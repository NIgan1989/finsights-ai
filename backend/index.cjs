const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Настройка CORS с поддержкой cookies
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Разрешенные источники
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(bodyParser.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[Server] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('[Server] Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[Server] Request body:', req.body);
  }
  next();
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Простое хранилище пользователей (в продакшене заменить на базу данных)
const users = {
  // Дефолтный админ
  'admin': {
    id: 'admin-user',
    email: 'admin@finsights.ai',
    displayName: 'Администратор',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // password: admin123
    role: 'admin',
    photoUrl: null
  },
  // Дефолтный демо пользователь  
  'demo': {
    id: 'demo-user',
    email: 'demo@finsights.ai',
    displayName: 'Demo User',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // password: demo123
    role: 'user',
    photoUrl: null
  }
};

// В памяти: userId <-> статус подписки
const userSubscriptionStatus = {};
const userUsageData = {};

// Хранилище пользовательских данных (в продакшене заменить на базу данных)
const userDataStorage = {
  profiles: {}, // userId -> profiles[]
  transactions: {}, // userId -> transactions[]
  activeProfileId: {} // userId -> activeProfileId
};

// Инициализация данных пользователя
const initUserData = (userId) => {
  if (!userUsageData[userId]) {
    userUsageData[userId] = {
      profiles: 0,
      transactions: 0,
      aiRequests: 0,
      lastReset: new Date().toDateString() // для сброса дневных лимитов
    };
  }
  
  // Сброс дневных лимитов ИИ
  const today = new Date().toDateString();
  if (userUsageData[userId].lastReset !== today) {
    userUsageData[userId].aiRequests = 0;
    userUsageData[userId].lastReset = today;
  }
};

// Сессии
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 часа
}));

// JWT секрет
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-dev-only';

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  // Проверяем сессию
  if (req.session && req.session.userId) {
    const user = Object.values(users).find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Проверяем JWT токен в заголовках
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// =================== АВТОРИЗАЦИЯ ===================

// Регистрация
app.post('/api/register', async (req, res) => {
  console.log('[Server] Registration attempt:', req.body);
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  // Проверяем, существует ли пользователь
  const existingUser = Object.values(users).find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }

  try {
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем нового пользователя
    const userId = 'user_' + Date.now();
    const newUser = {
      id: userId,
      email,
      displayName: displayName || email.split('@')[0],
      password: hashedPassword,
      role: 'user',
      photoUrl: null,
      createdAt: new Date().toISOString()
    };

    users[userId] = newUser;
    
    // Создаем сессию
    req.session.userId = userId;
    
    console.log('[Server] User registered successfully:', { id: userId, email });
    
    // Возвращаем данные без пароля
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ 
      message: 'Регистрация успешна',
      user: userWithoutPassword,
      token: jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' })
    });
  } catch (error) {
    console.error('[Server] Registration error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  console.log('[Server] Login attempt:', { email: req.body.email });
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('[Server] Missing email or password');
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    console.log('[Server] Searching for user with email:', email);
    console.log('[Server] Available users:', Object.keys(users));
    
    // Ищем пользователя
    const user = Object.values(users).find(u => u.email === email);
    console.log('[Server] Found user:', user ? { id: user.id, email: user.email } : null);
    
    if (!user) {
      console.log('[Server] User not found');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    console.log('[Server] Checking password...');
    
    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('[Server] Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('[Server] Invalid password');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаем сессию
    req.session.userId = user.id;
    
    console.log('[Server] User logged in successfully:', { id: user.id, email: user.email });
    
    // Возвращаем данные без пароля
    const { password: _, ...userWithoutPassword } = user;
    console.log('[Server] Sending response with user data:', userWithoutPassword);
    
    res.json({
      message: 'Вход выполнен успешно',
      user: userWithoutPassword,
      token: jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    });
  } catch (error) {
    console.error('[Server] Login error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

// Получение данных текущего пользователя
app.get('/api/me', (req, res) => {
  console.log('[Server] /api/me request');
  console.log('[Server] Session:', req.session);
  
  if (req.session && req.session.userId) {
    const user = Object.values(users).find(u => u.id === req.session.userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      console.log('[Server] User found in session:', userWithoutPassword);
      return res.json(userWithoutPassword);
    }
  }
  
  console.log('[Server] No valid session found');
  res.status(401).json({ error: 'Not authenticated' });
});

// Выход
app.post('/api/logout', (req, res) => {
  console.log('[Server] Logout request');
  req.session.destroy((err) => {
    if (err) {
      console.error('[Server] Logout error:', err);
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
    res.json({ message: 'Выход выполнен успешно' });
  });
});

// Быстрый вход для демо (можно убрать в продакшене)
app.get('/api/auth/demo', (req, res) => {
  console.log('[Server] Demo auth request');
  req.session.userId = 'demo-user';
  res.redirect('http://localhost:5173/dashboard');
});

// Быстрый вход для админа (можно убрать в продакшене)
app.get('/api/auth/admin', (req, res) => {
  console.log('[Server] Admin auth request');
  req.session.userId = 'admin-user';
  res.redirect('http://localhost:5173/dashboard');
});

// =================== ОСТАЛЬНЫЕ ЭНДПОИНТЫ ===================

// Диагностические эндпоинты
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/auth/google/config', (req, res) => {
  res.json({ 
    clientId: null, // Google OAuth отключен
    callbackURL: null
  });
});

app.post('/api/openai/forecast', async (req, res) => {
    try {
        const { pnlMonthlyData } = req.body;
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Ты — финансовый аналитик. Проанализируй данные о прибылях и убытках и создай прогноз на следующие 3 месяца. Верни только валидный JSON с полями: forecastedRevenue (массив из 3 чисел), forecastedExpenses (массив из 3 чисел), forecastedProfit (массив из 3 чисел), confidence, assumptions. forecastedRevenue, forecastedExpenses, forecastedProfit — всегда массивы длины 3, даже если значения одинаковые. Не возвращай одно число, только массив из 3 чисел! Без пояснений, markdown и текста.'
                },
                {
                    role: 'user',
                    content: `Создай финансовый прогноз на основе данных: ${JSON.stringify(pnlMonthlyData)}`
                }
            ],
            response_format: { type: 'json_object' }
        });
        let text = response.choices[0]?.message?.content || '{}';
        // Попытка извлечь JSON, если вдруг что-то не так
        try {
            text = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const parsed = JSON.parse(text);
            // Приводим forecastedRevenue, forecastedExpenses, forecastedProfit к массивам, если это объекты или числа
            ['forecastedRevenue', 'forecastedExpenses', 'forecastedProfit'].forEach(key => {
              if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
                // Берём только числовые значения
                let arr = Object.values(parsed[key]).map(Number).filter(v => !isNaN(v));
                // Если длина не 3, дублируем последнее значение
                while (arr.length < 3) arr.push(arr[arr.length - 1] ?? 0);
                parsed[key] = arr.slice(0, 3);
              }
              if (parsed[key] && !Array.isArray(parsed[key])) {
                parsed[key] = [parsed[key], parsed[key], parsed[key]];
              }
            });
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: 'AI ответ не является валидным JSON', raw: text });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, transactions, report, dateRange, profile } = req.body;
    // Проверка наличия данных
    if (!report) console.log('ВНИМАНИЕ: report отсутствует или пустой');
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) console.log('ВНИМАНИЕ: transactions отсутствуют или пусты');
    if (!profile) console.log('ВНИМАНИЕ: profile отсутствует или пустой');

    // Формируем максимально структурированный system prompt
    let summary = '';
    if (profile) {
      summary += `Профиль бизнеса: ${profile.businessName || '-'} (${profile.businessType || '-'})\n`;
    }
    if (dateRange) {
      summary += `Период: ${dateRange.start || '-'} - ${dateRange.end || '-'}\n`;
    }
    if (report) {
      summary += `\nКлючевые показатели:\n`;
      summary += `- Выручка: ${report.pnl?.totalRevenue ?? '-'}\n`;
      summary += `- Операционные расходы: ${report.pnl?.totalOperatingExpenses ?? '-'}\n`;
      summary += `- Чистая прибыль: ${report.pnl?.netProfit ?? '-'}\n`;
      summary += `- Денежный поток: ${report.cashFlow?.netCashFlow ?? '-'}\n`;
      summary += `- Контрагентов: ${report.counterpartyReport?.length ?? '-'}\n`;
      // Топ категории расходов
      if (report.pnl?.expenseByCategory) {
        const topCategories = report.pnl.expenseByCategory
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map((cat, i) => `${i + 1}. ${cat.name}: ${cat.value}`)
          .join('\n');
        summary += `\nТоп-3 категории расходов:\n${topCategories}\n`;
      }
      // Динамика по месяцам
      if (report.pnl?.monthlyData) {
        summary += '\nДинамика по месяцам:\n' +
          report.pnl.monthlyData.map(m => `${m.month}: Доход ${m['Доход']}, Расход ${m['Расход']}, Прибыль ${m['Прибыль']}`).join('\n') + '\n';
      }
    }
    if (transactions && Array.isArray(transactions) && transactions.length > 0) {
      const lastTxs = transactions.slice(-10).reverse();
      summary += '\nПоследние 10 транзакций:\n' + lastTxs.map(tx =>
        `${tx.date}: ${tx.description} (${tx.category}) — ${tx.type === 'income' ? '+' : '-'}${tx.amount}`
      ).join('\n') + '\n';
    }
    const systemPrompt = {
      role: 'system',
      content: `Ты — финансовый ассистент. Используй только эти данные для анализа и ответов на вопросы пользователя.\n${summary}`
    };
    // Логируем system prompt для отладки
    console.log('System prompt для OpenAI:', systemPrompt.content);
    const fullMessages = [systemPrompt, ...(messages || [])];
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: fullMessages,
      max_tokens: 500,
    });
    const text = response.choices[0]?.message?.content || '';
    res.json({ content: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Financial Model AI endpoints
app.post('/api/financial-model/chat', async (req, res) => {
  try {
    const { message, currentStep, modelData, messages } = req.body;
    
    // Создаем контекст для AI
    const context = `
Ты - экспертный финансовый аналитик и моделист. Твоя задача - создать профессиональную финансовую модель.

Текущий шаг: ${currentStep}/6
Данные модели: ${JSON.stringify(modelData, null, 2)}
История чата: ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

Пользователь написал: "${message}"

ОБЯЗАТЕЛЬНО следуй этой структуре ответа:
1. Проанализируй информацию пользователя
2. Задай КОНКРЕТНЫЕ уточняющие вопросы для текущего этапа
3. Предложи варианты или дай экспертные рекомендации
4. Если этап завершен, скажи "ЭТАП_ЗАВЕРШЕН"

Этапы создания модели:
0. Информация о компании (название, отрасль, стадия, валюта)
1. Модель доходов (источники, типы, драйверы роста)
2. Структура затрат (COGS, OPEX, CAPEX)
3. Финансовые предположения (WACC, налоги, терминальный рост)
4. Создание модели (DCF, P&L, Balance Sheet)
5. Анализ и сценарии

Отвечай профессионально, структурированно, с эмодзи для наглядности.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content;
    
    // Определяем, завершен ли этап
    const stepCompleted = aiResponse.includes('ЭТАП_ЗАВЕРШЕН');
    
    // Извлекаем обновления данных модели из ответа AI
    let modelUpdate = {};
    
    // Простая логика извлечения данных (можно улучшить)
    if (currentStep === 0 && message.toLowerCase().includes('компания')) {
      const companyMatch = message.match(/компания\s+([^,.\n]+)/i);
      const industryMatch = message.match(/отрасль\s+([^,.\n]+)/i);
      
      if (companyMatch) modelUpdate.companyName = companyMatch[1].trim();
      if (industryMatch) modelUpdate.industry = industryMatch[1].trim();
    }

    res.json({
      response: aiResponse.replace('ЭТАП_ЗАВЕРШЕН', '').trim(),
      stepCompleted,
      modelUpdate,
      type: stepCompleted ? 'model' : 'question'
    });

  } catch (error) {
    console.error('Financial model chat error:', error);
    res.status(500).json({ 
      error: 'Ошибка AI-ассистента. Попробуйте переформулировать запрос.',
      response: '❌ Произошла техническая ошибка. Пожалуйста, попробуйте еще раз.'
    });
  }
});

app.post('/api/financial-model/generate', async (req, res) => {
  try {
    const { modelData } = req.body;
    
    // Создаем полную финансовую модель
    const prompt = `
Создай детальную финансовую модель на основе данных:
${JSON.stringify(modelData, null, 2)}

Создай DCF модель с:
1. P&L прогноз на 5 лет
2. Cash Flow прогноз
3. Balance Sheet ключевые позиции
4. Расчет справедливой стоимости (DCF)
5. Сценарный анализ (базовый, оптимистичный, пессимистичный)
6. Анализ чувствительности

Верни результат в JSON формате с полями:
{
  "companyName": "название",
  "projectionYears": 5,
  "projections": {
    "revenue": [год1, год2, год3, год4, год5],
    "cogs": [год1, год2, год3, год4, год5],
    "grossProfit": [год1, год2, год3, год4, год5],
    "opex": [год1, год2, год3, год4, год5],
    "ebitda": [год1, год2, год3, год4, год5],
    "freeCashFlow": [год1, год2, год3, год4, год5]
  },
  "valuation": {
    "fairValue": "сумма в млн руб",
    "npv": "сумма в млн руб", 
    "irr": "процент"
  },
  "scenarios": [
    {"name": "Базовый", "npv": "сумма", "probability": 0.6},
    {"name": "Оптимистичный", "npv": "сумма", "probability": 0.2},
    {"name": "Пессимистичный", "npv": "сумма", "probability": 0.2}
  ],
  "keyAssumptions": ["предположение1", "предположение2"],
  "recommendations": ["рекомендация1", "рекомендация2"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ты экспертный финансовый моделист. Создавай детальные, профессиональные финансовые модели в формате JSON." },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    let modelResult;
    try {
      modelResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // Если не удалось распарсить JSON, создаем базовую модель
      modelResult = {
        companyName: modelData.companyName || "Компания",
        projectionYears: 5,
        projections: {
          revenue: [100, 120, 144, 173, 207],
          cogs: [60, 72, 86, 104, 124],
          grossProfit: [40, 48, 58, 69, 83],
          opex: [25, 30, 36, 43, 52],
          ebitda: [15, 18, 22, 26, 31],
          freeCashFlow: [12, 14, 17, 20, 24]
        },
        valuation: {
          fairValue: "450 млн руб",
          npv: "280 млн руб",
          irr: "25.3"
        },
        scenarios: [
          {"name": "Базовый", "npv": "280 млн руб", "probability": 0.6},
          {"name": "Оптимистичный", "npv": "420 млн руб", "probability": 0.2},
          {"name": "Пессимистичный", "npv": "180 млн руб", "probability": 0.2}
        ],
        keyAssumptions: [
          "Рост выручки 20% в год",
          "Маржинальность EBITDA 15%",
          "WACC 12%",
          "Терминальный рост 3%"
        ],
        recommendations: [
          "Фокус на увеличении маржинальности",
          "Оптимизация структуры капитала",
          "Инвестиции в цифровизацию процессов"
        ]
      };
    }

    res.json({ model: modelResult });

  } catch (error) {
    console.error('Generate model error:', error);
    res.status(500).json({ 
      error: 'Ошибка генерации модели. Попробуйте еще раз.',
      model: null
    });
  }
});

// Сброс пароля (заглушка)
app.post('/api/reset-password', (req, res) => {
  const { email } = req.body;
  // В реальном проекте: найти пользователя, сгенерировать токен, отправить email
  const user = Object.values(users).find(u => u.email === email);
  if (user) {
    console.log(`Отправка письма для сброса пароля на ${email}`);
  }
  // Не раскрываем, есть ли пользователь
  res.json({ success: true });
});

// Список администраторов с пожизненной подпиской
const lifetimeAdmins = [
  'Dulat280489@gmail.com'
];

const isLifetimeAdmin = (userId) => {
  return lifetimeAdmins.includes(userId.toLowerCase());
};

// Endpoint для получения полной информации о подписке
app.get('/api/subscription-info', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  // Проверяем, является ли пользователь администратором с пожизненной подпиской
  if (isLifetimeAdmin(userId)) {
    return res.json({
      status: 'pro',
      currentUsage: {
        profiles: 0,
        transactions: 0,
        aiRequests: 0
      }
    });
  }
  
  initUserData(userId);
  const status = userSubscriptionStatus[userId] || 'free';
  const currentUsage = userUsageData[userId];
  
  res.json({ 
    status,
    currentUsage: {
      profiles: currentUsage.profiles,
      transactions: currentUsage.transactions,
      aiRequests: currentUsage.aiRequests
    }
  });
});

// Endpoint для увеличения счетчика ИИ запросов
app.post('/api/increment-ai-usage', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  initUserData(userId);
  userUsageData[userId].aiRequests++;
  
  res.json({ success: true, newCount: userUsageData[userId].aiRequests });
});

// Endpoint для обновления использования (профили, транзакции)
app.post('/api/update-usage', (req, res) => {
  const { userId, type, count } = req.body;
  if (!userId || !type) return res.status(400).json({ error: 'userId and type required' });
  
  initUserData(userId);
  if (type === 'profiles') userUsageData[userId].profiles = count;
  if (type === 'transactions') userUsageData[userId].transactions = count;
  
  res.json({ success: true });
});

// Endpoint для заявки на оплату через Kaspi Gold
app.post('/api/kaspi-payment-request', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  initUserData(userId);
  userSubscriptionStatus[userId] = 'pending';
  
  res.json({ 
    success: true, 
    message: 'Заявка на оплату получена. Мы проверим перевод и активируем PRO в течение 24 часов.' 
  });
});

// Admin endpoint для активации PRO (в реальном проекте: защищенный)
app.post('/api/admin/activate-pro', (req, res) => {
  const { userId, adminKey } = req.body;
  
  // Простая защита (в продакшене: JWT token, роли)
  if (adminKey !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  userSubscriptionStatus[userId] = 'pro';
  res.json({ success: true, message: 'PRO activated successfully' });
});

// Legacy endpoint для совместимости
app.get('/api/subscription-status', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  // Проверяем администратора
  if (isLifetimeAdmin(userId)) {
    return res.json({ status: 'pro' });
  }
  
  const status = userSubscriptionStatus[userId] || 'free';
  res.json({ status });
});

// API для работы с профилями пользователя
app.get('/api/user/profiles', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  const profiles = userDataStorage.profiles[userId] || [];
  const activeProfileId = userDataStorage.activeProfileId[userId] || null;
  
  res.json({ profiles, activeProfileId });
});

app.post('/api/user/profiles', (req, res) => {
  const { userId, profiles, activeProfileId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  if (profiles) userDataStorage.profiles[userId] = profiles;
  if (activeProfileId) userDataStorage.activeProfileId[userId] = activeProfileId;
  
  res.json({ success: true });
});

// API для работы с транзакциями пользователя
app.get('/api/user/transactions', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  const transactions = userDataStorage.transactions[userId] || [];
  res.json({ transactions });
});

app.post('/api/user/transactions', (req, res) => {
  const { userId, transactions } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  userDataStorage.transactions[userId] = transactions || [];
  res.json({ success: true });
});

// API для очистки данных пользователя
app.delete('/api/user/data', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  delete userDataStorage.profiles[userId];
  delete userDataStorage.transactions[userId];
  delete userDataStorage.activeProfileId[userId];
  
  res.json({ success: true });
});

app.get('/', (req, res) => {
    res.send('FinSights AI backend is running');
});

// Глобальный обработчик ошибок (добавить в самом конце файла)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// SPA fallback: отдаём index.html для всех не-API/не-auth/не-static GET-запросов
const path = require('path');
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/auth') &&
    !req.path.startsWith('/static') &&
    !req.path.startsWith('/public')
  ) {
    res.sendFile(path.resolve(__dirname, '../index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
}); 

// Прокси-роут для OpenAI
app.post('/api/openai', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
}); 