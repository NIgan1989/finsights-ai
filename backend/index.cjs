const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Загружаем .env файл из папки backend
const envPath = path.join(__dirname, '.env');
console.log('[Server] Looking for .env file at:', envPath);
console.log('[Server] File exists:', require('fs').existsSync(envPath));

  // Попробуем прочитать файл вручную
  const fs = require('fs');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('[Server] .env file content:', envContent);
    
    // Удаляем BOM если есть
    const cleanContent = envContent.replace(/^\uFEFF/, '');
    
    // Парсим файл вручную
    const lines = cleanContent.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          if (key && value) {
            process.env[key] = value;
            console.log(`[Server] Set ${key} = ${value.substring(0, 20)}...`);
          }
        }
      }
    });
  } else {
    console.error('[Server] .env file not found at:', envPath);
  }

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

// Проверяем загрузку API ключа
console.log('[Server] OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
console.log('[Server] OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT FOUND');
if (!process.env.OPENAI_API_KEY) {
  console.error('[Server] ERROR: OPENAI_API_KEY not found in environment variables');
  console.error('[Server] Make sure .env file exists in root folder with OPENAI_API_KEY=your_key_here');
}

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Financial Model AI endpoints
app.post('/api/financial-model/chat', async (req, res) => {
  try {
    const { message, currentStep, modelData, messages } = req.body;
    
    console.log('[Server] Получен запрос на финансовую модель:');
    console.log('[Server] - Сообщение:', message?.substring(0, 200) + '...');
    console.log('[Server] - Текущий шаг:', currentStep);
    console.log('[Server] - Данные модели:', modelData ? 'присутствуют' : 'отсутствуют');
    console.log('[Server] - История сообщений:', messages?.length || 0);
    
    // Проверяем, содержит ли сообщение полную информацию для создания модели
    const hasCompleteInfo = (
      // Проверка на детальный промпт с финансовыми параметрами
      message.length > 1000 && 
      (message.includes('выручка') || message.includes('доход') || message.includes('тенге') || message.includes('млн')) && 
      (message.includes('затраты') || message.includes('расходы') || message.includes('COGS') || message.includes('OPEX')) && 
      (message.includes('WACC') || message.includes('ставка') || message.includes('%')) && 
      (message.includes('модель') || message.includes('создай') || message.includes('финансовую')) &&
      (message.includes('структура') || message.includes('категории') || message.includes('каналы'))
    ) || (
      // Проверка на конкретные бизнес-типы
      (message.includes('СтройМаркет') || message.includes('строительные материалы') || message.includes('ремонт')) &&
      message.length > 500 &&
      (message.includes('выручка') || message.includes('доход')) &&
      (message.includes('затраты') || message.includes('расходы')) &&
      (message.includes('модель') || message.includes('создай'))
    ) || (
      // Проверка на SaaS/технологические компании
      (message.includes('SaaS') || message.includes('технологии') || message.includes('стартап')) &&
      message.length > 500 &&
      (message.includes('выручка') || message.includes('доход')) &&
      (message.includes('затраты') || message.includes('расходы')) &&
      (message.includes('модель') || message.includes('создай'))
    ) || (
      // Проверка на ресторанный бизнес
      (message.includes('ресторан') || message.includes('кафе') || message.includes('питание')) &&
      message.length > 500 &&
      (message.includes('выручка') || message.includes('доход')) &&
      (message.includes('затраты') || message.includes('расходы')) &&
      (message.includes('модель') || message.includes('создай'))
    ) || (
      // Проверка на производство
      (message.includes('производство') || message.includes('завод') || message.includes('фабрика')) &&
      message.length > 500 &&
      (message.includes('выручка') || message.includes('доход')) &&
      (message.includes('затраты') || message.includes('расходы')) &&
      (message.includes('модель') || message.includes('создай'))
    ) || (
      // Универсальная проверка для детальных промптов
      message.length > 1500 && 
      message.includes('финансовую модель') &&
      (message.includes('выручка') || message.includes('доход')) &&
      (message.includes('затраты') || message.includes('расходы')) &&
      (message.includes('WACC') || message.includes('ставка'))
    ) || (
      // Проверка на отраслевые шаблоны
      message.includes('Создай полную финансовую модель для компании в сфере') &&
      message.length > 800 &&
      (message.includes('Основные параметры') || message.includes('Структура затрат')) &&
      (message.includes('Ключевые метрики') || message.includes('Особенности модели')) &&
      (message.includes('Создай детальную финансовую модель') || message.includes('анализ чувствительности'))
    );
    
    console.log('[Server] Проверка полной информации:');
    console.log('[Server] - Длина сообщения:', message.length);
    console.log('[Server] - Содержит компания/называется:', message.includes('компания') || message.includes('называется'));
    console.log('[Server] - Содержит выручка/доход/млн:', message.includes('выручка') || message.includes('доход') || message.includes('млн'));
    console.log('[Server] - Содержит затраты/расходы/%:', message.includes('затраты') || message.includes('расходы') || message.includes('%'));
    console.log('[Server] - Содержит WACC/ставка/18%:', message.includes('WACC') || message.includes('ставка') || message.includes('18%'));
    console.log('[Server] - Содержит DCF/анализ/модель:', message.includes('DCF') || message.includes('анализ') || message.includes('модель'));
    console.log('[Server] - Содержит анализ/модель/создай:', message.includes('анализ') || message.includes('модель') || message.includes('создай'));
    console.log('[Server] - Содержит посуточная/сдача/квартир/SaaS/стартап/бизнес/HomeStay Pro/TechFlow:', 
      message.includes('посуточная') || message.includes('сдача') || message.includes('квартир') || 
      message.includes('SaaS') || message.includes('стартап') || message.includes('бизнес') || 
      message.includes('HomeStay Pro') || message.includes('TechFlow'));
    console.log('[Server] - Содержит модель/создай/полную:', message.includes('модель') || message.includes('создай') || message.includes('полную'));
    console.log('[Server] - Содержит полную финансовую модель:', message.includes('полную финансовую модель'));
    console.log('[Server] - Простая проверка (длина>500 + HomeStay Pro/TechFlow + посуточная/SaaS + млн + % + полную):', 
      message.length > 500 && 
      (message.includes('HomeStay Pro') || message.includes('TechFlow')) && 
      (message.includes('посуточная') || message.includes('SaaS')) && 
      message.includes('млн') && 
      message.includes('%') && 
      message.includes('полную финансовую модель')
    );
    console.log('[Server] - Результат проверки:', hasCompleteInfo);
    
    // Если получена полная информация, сразу создаем модель
    if (hasCompleteInfo) {
      console.log('[Server] Получена полная информация, создаем модель напрямую');
      
      // Извлекаем данные из сообщения
      const extractedData = extractModelDataFromMessage(message);
      console.log('[Server] Извлеченные данные:', extractedData);
      
          // Создаем профессиональную модель по стандартам ФРП
    const modelResult = createProfessionalFinancialModel(extractedData);
      
      res.json({
        response: `✅ **Полная финансовая модель создана!**\n\nЯ получил всю необходимую информацию и создал профессиональную финансовую модель для вашей компании.\n\nПерейдите на вкладку "Модель" для просмотра результатов.`,
        stepCompleted: true,
        modelUpdate: extractedData,
        type: 'model',
        model: modelResult
      });
      
      return;
    }
    
    // Если запрос на создание модели через кнопку
    if (message && message.includes('Создай полную финансовую модель') && modelData) {
      console.log('[Server] Создание модели через кнопку');
      
      // Используем данные из modelData или создаем базовые
      const modelDataToUse = {
        companyName: modelData.companyName || 'HomeStay Pro',
        industry: modelData.industry || 'посуточная сдача квартир',
        revenue: '15,000,000 тенге',
        growthRate: '35%',
        wacc: '18%',
        taxRate: '20%',
        currency: 'тенге',
        stage: 'growth'
      };
      
      // Создаем модель
      const modelResult = await generateFinancialModel(modelDataToUse);
      
      res.json({
        response: `✅ **Финансовая модель успешно создана!**\n\nПерейдите на вкладку "Модель" для просмотра результатов.`,
        stepCompleted: true,
        modelUpdate: modelDataToUse,
        type: 'model',
        model: modelResult
      });
      
      return;
    }
    
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

ВАЖНО: Если пользователь предоставил достаточно информации для завершения этапа, обязательно напиши "ЭТАП_ЗАВЕРШЕН" в конце ответа.

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
    const stepCompleted = aiResponse.includes('ЭТАП_ЗАВЕРШЕН') || 
                         (currentStep === 5 && aiResponse.toLowerCase().includes('модель готова')) ||
                         (currentStep === 5 && aiResponse.toLowerCase().includes('создание завершено'));
    
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

// Функция извлечения данных модели из сообщения (универсальная)
function extractModelDataFromMessage(message) {
  const data = {};
  
  // Специальная обработка для отраслевых шаблонов
  if (message.includes('Создай полную финансовую модель для компании в сфере')) {
    // Извлекаем отрасль из промпта шаблона
    const industryMatch = message.match(/сфере\s+([^,.\n]+)/i);
    if (industryMatch) {
      const industry = industryMatch[1].trim();
      data.industry = industry;
      
      // Устанавливаем название компании на основе отрасли
      if (industry.includes('строительные материалы')) {
        data.companyName = 'СтройМаркет';
      } else if (industry.includes('SaaS') || industry.includes('подписки')) {
        data.companyName = 'TechFlow';
      } else if (industry.includes('ресторан') || industry.includes('кафе')) {
        data.companyName = 'Ресторан "Уют"';
      } else if (industry.includes('производство')) {
        data.companyName = 'Производственное предприятие';
      } else if (industry.includes('розничная торговля')) {
        data.companyName = 'Розничная сеть';
      } else {
        data.companyName = `Компания в сфере ${industry}`;
      }
    }
  }
  
  // Извлекаем название компании (универсально)
  const companyMatch = message.match(/компания\s+называется\s+([^,.\n]+)/i) || 
                      message.match(/называется\s+([^,.\n]+)/i) ||
                      message.match(/компания\s+([^,.\n]+)/i) ||
                      message.match(/бизнес\s+([^,.\n]+)/i) ||
                      message.match(/СтройМаркет/i) ||
                      message.match(/строительные материалы/i);
  if (companyMatch) {
    data.companyName = companyMatch[1] ? companyMatch[1].trim() : 'СтройМаркет';
  } else if (message.includes('СтройМаркет') || message.includes('строительные материалы')) {
    data.companyName = 'СтройМаркет';
  }
  
  // Извлекаем отрасль (универсально)
  const industryMatch = message.match(/сфере\s+([^,.\n]+)/i) || 
                       message.match(/отрасль\s+([^,.\n]+)/i) ||
                       message.match(/бизнес\s+в\s+([^,.\n]+)/i) ||
                       message.match(/работаем\s+в\s+([^,.\n]+)/i) ||
                       message.match(/продаже\s+([^,.\n]+)/i) ||
                       message.match(/торговля\s+([^,.\n]+)/i);
  if (industryMatch) {
    data.industry = industryMatch[1] ? industryMatch[1].trim() : 'розничная торговля';
  } else if (message.includes('строительные материалы') || message.includes('ремонт')) {
    data.industry = 'розничная торговля строительными материалами';
  }
  
  // Извлекаем стадию (универсально)
  const stageMatch = message.match(/стадии\s+([^,.\n]+)/i) || 
                    message.match(/стадия\s+([^,.\n]+)/i) ||
                    message.match(/этап\s+([^,.\n]+)/i);
  if (stageMatch) data.stage = stageMatch[1] ? stageMatch[1].trim() : 'growth';
  
  // Извлекаем валюту (универсально)
  const currencyMatch = message.match(/валюта\s+([^,.\n]+)/i) || 
                       message.match(/учет\s+в\s+([^,.\n]+)/i) ||
                       message.match(/тенге/i) ||
                       message.match(/рублей/i) ||
                       message.match(/долларов/i) ||
                       message.match(/евро/i);
  if (currencyMatch) {
    if (message.includes('тенге')) data.currency = 'тенге';
    else if (message.includes('рублей') || message.includes('руб')) data.currency = 'рублей';
    else if (message.includes('долларов') || message.includes('USD')) data.currency = 'долларов';
    else if (message.includes('евро') || message.includes('EUR')) data.currency = 'евро';
    else data.currency = currencyMatch[1] ? currencyMatch[1].trim() : 'тенге';
  } else {
    // Автоматическое определение валюты из текста
    data.currency = detectCurrency(message);
  }
  
  // Извлекаем выручку (универсально)
  const revenueMatch = message.match(/выручка[:\s]+([^,.\n]+)/i) ||
                      message.match(/доход[:\s]+([^,.\n]+)/i) ||
                      message.match(/оборот[:\s]+([^,.\n]+)/i) ||
                      message.match(/(\d+)\s*млн/i) ||
                      message.match(/(\d+)\s*тыс/i) ||
                      message.match(/(\d+)\s*тысяч/i) ||
                      message.match(/Выручка:\s*([^,.\n]+)/i);
  if (revenueMatch) {
    const revenueValue = revenueMatch[1] ? revenueMatch[1].trim() : revenueMatch[0];
    data.revenue = revenueValue;
  } else if (message.includes('выручка') || message.includes('доход')) {
    // Если упоминается выручка/доход, но нет конкретных цифр, используем базовые значения
    data.revenue = '25,000,000 тенге';
  }
  
  // Извлекаем рост (универсально)
  const growthMatch = message.match(/рост[:\s]+([^,.\n]+)/i) ||
                     message.match(/рост\s+(\d+)\s*%/i) ||
                     message.match(/темп\s+роста[:\s]+([^,.\n]+)/i) ||
                     message.match(/(\d+)\s*%/i) ||
                     message.match(/Рост:\s*([^,.\n]+)/i);
  if (growthMatch) {
    const growthValue = growthMatch[1] ? growthMatch[1].trim() : growthMatch[0];
    data.growthRate = growthValue;
  } else if (message.includes('рост') || message.includes('развитие')) {
    // Если упоминается рост/развитие, но нет конкретных цифр, используем базовые значения
    data.growthRate = '25%';
  }
  
  // Извлекаем WACC (универсально)
  const waccMatch = message.match(/WACC[:\s]+([^,.\n]+)/i) ||
                   message.match(/ставка\s+дисконтирования[:\s]+([^,.\n]+)/i) ||
                   message.match(/ставка[:\s]+([^,.\n]+)/i) ||
                   message.match(/(\d+)\s*%/i) ||
                   message.match(/WACC:\s*([^,.\n]+)/i);
  if (waccMatch) {
    const waccValue = waccMatch[1] ? waccMatch[1].trim() : waccMatch[0];
    data.wacc = waccValue;
  } else if (message.includes('WACC') || message.includes('ставка')) {
    // Если упоминается WACC/ставка, но нет конкретных цифр, используем базовые значения
    data.wacc = '18%';
  }
  
  // Извлекаем налог (универсально)
  const taxMatch = message.match(/налог[:\s]+([^,.\n]+)/i) ||
                  message.match(/налоговая\s+ставка[:\s]+([^,.\n]+)/i) ||
                  message.match(/(\d+)\s*%/i);
  if (taxMatch) {
    const taxValue = taxMatch[1] ? taxMatch[1].trim() : taxMatch[0];
    data.taxRate = taxValue;
  }
  
  // Извлекаем источники доходов (универсально)
  const revenueSources = [];
  if (message.includes('аренда') || message.includes('сдача')) revenueSources.push('rental');
  if (message.includes('продажи') || message.includes('товары')) revenueSources.push('sales');
  if (message.includes('услуги') || message.includes('сервисы')) revenueSources.push('services');
  if (message.includes('подписки') || message.includes('subscription')) revenueSources.push('subscriptions');
  if (message.includes('лицензии') || message.includes('licenses')) revenueSources.push('licenses');
  if (message.includes('консультации') || message.includes('consulting')) revenueSources.push('consulting');
  if (message.includes('реклама') || message.includes('advertising')) revenueSources.push('advertising');
  if (message.includes('комиссии') || message.includes('commission')) revenueSources.push('commission');
  if (revenueSources.length > 0) data.revenueSources = revenueSources;
  
  // Извлекаем структуру затрат (универсально)
  const costStructure = {};
  
  // Поиск затрат по ключевым словам
  const costPatterns = [
    { key: 'materials', patterns: ['материалы', 'сырье', 'товары', 'закупки'] },
    { key: 'labor', patterns: ['персонал', 'зарплата', 'трудовые', 'сотрудники'] },
    { key: 'rent', patterns: ['аренда', 'помещения', 'офис', 'склад'] },
    { key: 'utilities', patterns: ['коммунальные', 'электричество', 'вода', 'газ'] },
    { key: 'marketing', patterns: ['маркетинг', 'реклама', 'продвижение'] },
    { key: 'technology', patterns: ['технологии', 'IT', 'разработка', 'программирование'] },
    { key: 'maintenance', patterns: ['обслуживание', 'ремонт', 'техобслуживание'] },
    { key: 'administrative', patterns: ['административные', 'управление', 'администрация'] },
    { key: 'insurance', patterns: ['страхование', 'страховка'] },
    { key: 'legal', patterns: ['юридические', 'правовые', 'юрист'] },
    { key: 'transport', patterns: ['транспорт', 'логистика', 'доставка'] }
  ];
  
  costPatterns.forEach(({ key, patterns }) => {
    patterns.forEach(pattern => {
      if (message.toLowerCase().includes(pattern)) {
        // Ищем процент рядом с упоминанием
        const percentMatch = message.match(new RegExp(`${pattern}[^\\d]*(\\d+)\\s*%`, 'i'));
        if (percentMatch) {
          costStructure[key] = `${percentMatch[1]}%`;
        } else {
          costStructure[key] = '10%'; // дефолтное значение
        }
      }
    });
  });
  
  if (Object.keys(costStructure).length > 0) data.costStructure = costStructure;
  
  // Извлекаем сезонность
  if (message.includes('сезонность') || message.includes('сезонный') || 
      message.includes('высокий сезон') || message.includes('низкий сезон')) {
    data.seasonality = true;
  }
  
  // Извлекаем количество единиц/объектов
  const unitsMatch = message.match(/(\d+)\s*(квартир|единиц|объектов|машин|компьютеров|сотрудников)/i);
  if (unitsMatch) data.units = unitsMatch[1];
  
  // Извлекаем загрузку/использование
  const occupancyMatch = message.match(/загрузка[:\s]+([^,.\n]+)/i) ||
                        message.match(/использование[:\s]+([^,.\n]+)/i);
  if (occupancyMatch) data.occupancy = occupancyMatch[1].trim();
  
  // Устанавливаем значения по умолчанию если не найдены
  if (!data.revenue) data.revenue = '25,000,000 тенге';
  if (!data.growthRate) data.growthRate = '25%';
  if (!data.wacc) data.wacc = '18%';
  if (!data.taxRate) data.taxRate = '20%';
  if (!data.industry) data.industry = 'розничная торговля строительными материалами';
  if (!data.stage) data.stage = 'growth';
  if (!data.currency) data.currency = 'тенге';
  if (!data.units) data.units = '1';
  if (!data.occupancy) data.occupancy = '85%';
  
  // Специальная логика для строительных материалов
  if (message.includes('строительные материалы') || message.includes('ремонт') || data.companyName === 'СтройМаркет') {
    data.industry = 'розничная торговля строительными материалами';
    data.revenueSources = ['sales'];
    
    // Структура затрат для строительных материалов
    data.costStructure = {
      'materials': '65%', // Закупка товаров
      'labor': '15%',     // Персонал
      'rent': '8%',       // Аренда помещения
      'utilities': '3%',  // Коммунальные услуги
      'marketing': '5%',  // Маркетинг
      'administrative': '4%' // Административные расходы
    };
  }
  
  return data;
}

// Функция генерации финансовой модели
async function generateFinancialModel(modelData) {
  try {
    const prompt = `
Создай базовую финансовую модель в JSON формате для компании ${modelData.companyName || 'Моя компания'}.

Используй следующие данные:
- Выручка: ${modelData.revenue || '15 млн тенге'}
- Рост: ${modelData.growthRate || '35%'}
- WACC: ${modelData.wacc || '18%'}
- Налог: ${modelData.taxRate || '20%'}
- Отрасль: ${modelData.industry || 'общие услуги'}

Создай JSON с такой структурой:
{
  "companyInfo": {
    "name": "название компании",
    "industry": "отрасль",
    "stage": "стадия"
  },
  "assumptions": {
    "taxRate": 0.20,
    "wacc": 0.18,
    "terminalGrowthRate": 0.04,
    "workingCapital": {
      "dso": 15,
      "dpo": 30,
      "dio": 0
    }
  },
  "monthlyProjections": {
    "revenue": [массив 60 значений],
    "cogs": [массив 60 значений],
    "grossProfit": [массив 60 значений],
    "operatingExpenses": {
      "materials": [массив 60 значений],
      "labor": [массив 60 значений],
      "marketing": [массив 60 значений],
      "administrative": [массив 60 значений]
    },
    "ebitda": [массив 60 значений],
    "ebit": [массив 60 значений],
    "netIncome": [массив 60 значений],
    "freeCashFlow": [массив 60 значений]
  },
  "annualSummary": {
    "years": [2025, 2026, 2027, 2028, 2029],
    "revenue": [5 значений],
    "ebitda": [5 значений],
    "netIncome": [5 значений],
    "freeCashFlow": [5 значений]
  },
  "valuation": {
    "fairValue": "сумма в млн тенге",
    "npv": "сумма в млн тенге",
    "irr": "процент",
    "terminalValue": "сумма в млн тенге",
    "dcfBreakdown": {
      "explicitPeriod": "сумма в млн тенге",
      "terminalValue": "сумма в млн тенге",
      "totalValue": "сумма в млн тенге"
    }
  },
  "sensitivityAnalysis": {
    "revenueGrowth": {
      "labels": ["-20%", "-10%", "0%", "+10%", "+20%"],
      "values": [5 значений]
    },
    "wacc": {
      "labels": ["12%", "14%", "16%", "18%", "20%"],
      "values": [5 значений]
    },
    "terminalGrowth": {
      "labels": ["2%", "3%", "4%", "5%", "6%"],
      "values": [5 значений]
    }
  },
  "scenarios": [
    {
      "name": "Базовый",
      "probability": 0.6,
      "revenueGrowth": 0.35,
      "npv": "сумма в млн тенге",
      "description": "описание"
    },
    {
      "name": "Оптимистичный",
      "probability": 0.2,
      "revenueGrowth": 0.50,
      "npv": "сумма в млн тенге",
      "description": "описание"
    },
    {
      "name": "Пессимистичный",
      "probability": 0.2,
      "revenueGrowth": 0.20,
      "npv": "сумма в млн тенге",
      "description": "описание"
    }
  ],
  "keyMetrics": {
    "ebitdaMargin": [5 значений],
    "netProfitMargin": [5 значений],
    "roe": [5 значений],
    "roa": [5 значений],
    "debtToEquity": [5 значений]
  },
  "recommendations": [
    "рекомендация 1",
    "рекомендация 2",
    "рекомендация 3"
  ],
  "riskFactors": [
    "риск 1",
    "риск 2"
  ]
}

ВАЖНО: Заполни все числовые значения реалистичными данными. Используй простые расчеты.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ты экспертный финансовый моделист с опытом в инвестиционном банкинге и консалтинге. Создавай детальные, профессиональные финансовые модели в точном JSON формате. Все расчеты должны быть математически корректными." },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    let modelResult;
    try {
      modelResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', response.choices[0].message.content);
      
      // Fallback - создаем универсальную модель
      modelResult = createUniversalFinancialModel(modelData);
    }

    return modelResult;

  } catch (error) {
    console.error('Financial model generation error:', error);
    return createUniversalFinancialModel(modelData);
  }
}

// Функция создания базовой модели если AI не справился
function createFallbackModel(modelData) {
  // Извлекаем данные из modelData
  const revenueStr = modelData.revenue || "15,000,000 тенге";
  const growthStr = modelData.growthRate || "35%";
  const waccStr = modelData.wacc || "18%";
  const taxStr = modelData.taxRate || "20%";
  const currency = modelData.currency || "тенге";
  
  // Парсим числовые значения
  const baseRevenue = parseFloat(revenueStr.replace(/[^\d]/g, '')) || 15000000; // извлекаем только цифры
  const growthRate = parseFloat(growthStr.match(/(\d+)/)?.[1] || "35") / 100;
  const wacc = parseFloat(waccStr.match(/(\d+)/)?.[1] || "18") / 100;
  const taxRate = parseFloat(taxStr.match(/(\d+)/)?.[1] || "20") / 100;
  
  const monthlyProjections = {
    revenue: [],
    cogs: [],
    grossProfit: [],
    operatingExpenses: {
      rental: [], // аренда квартир
      utilities: [], // коммунальные
      personnel: [], // персонал
      marketing: [], // маркетинг
      maintenance: [], // техническое обслуживание
      administrative: [] // административные
    },
    ebitda: [],
    ebit: [],
    netIncome: [],
    freeCashFlow: []
  };

  // Генерируем месячные данные на 5 лет (60 месяцев)
  for (let month = 0; month < 60; month++) {
    const monthlyGrowth = Math.pow(1 + growthRate, month / 12);
    const revenue = baseRevenue * monthlyGrowth;
    
    // Структура затрат для посуточной сдачи квартир (в тенге)
    const rental = revenue * 0.45; // 45% аренда квартир
    const utilities = revenue * 0.15; // 15% коммунальные
    const personnel = revenue * 0.20; // 20% персонал
    const marketing = revenue * 0.10; // 10% маркетинг
    const maintenance = revenue * 0.05; // 5% техническое обслуживание
    const administrative = revenue * 0.05; // 5% административные
    
    const totalOpex = rental + utilities + personnel + marketing + maintenance + administrative;
    const ebitda = revenue - totalOpex;
    const ebit = ebitda * 0.95; // 5% амортизация
    const netIncome = ebit * (1 - taxRate);
    const freeCashFlow = netIncome * 0.85; // 85% конвертация в FCF

    monthlyProjections.revenue.push(Math.round(revenue));
    monthlyProjections.cogs.push(Math.round(rental + utilities)); // COGS = аренда + коммунальные
    monthlyProjections.grossProfit.push(Math.round(revenue - (rental + utilities)));
    monthlyProjections.operatingExpenses.rental.push(Math.round(rental));
    monthlyProjections.operatingExpenses.utilities.push(Math.round(utilities));
    monthlyProjections.operatingExpenses.personnel.push(Math.round(personnel));
    monthlyProjections.operatingExpenses.marketing.push(Math.round(marketing));
    monthlyProjections.operatingExpenses.maintenance.push(Math.round(maintenance));
    monthlyProjections.operatingExpenses.administrative.push(Math.round(administrative));
    monthlyProjections.ebitda.push(Math.round(ebitda));
    monthlyProjections.ebit.push(Math.round(ebit));
    monthlyProjections.netIncome.push(Math.round(netIncome));
    monthlyProjections.freeCashFlow.push(Math.round(freeCashFlow));
  }

  // Рассчитываем годовые суммы
  const annualRevenue = [];
  const annualEbitda = [];
  const annualNetIncome = [];
  const annualFCF = [];
  
  for (let year = 0; year < 5; year++) {
    const yearStart = year * 12;
    const yearEnd = yearStart + 12;
    
    const yearRevenue = monthlyProjections.revenue.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearEbitda = monthlyProjections.ebitda.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearNetIncome = monthlyProjections.netIncome.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearFCF = monthlyProjections.freeCashFlow.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    
    annualRevenue.push(yearRevenue);
    annualEbitda.push(yearEbitda);
    annualNetIncome.push(yearNetIncome);
    annualFCF.push(yearFCF);
  }

  // Рассчитываем DCF
  const terminalGrowth = 0.04; // 4% терминальный рост
  const terminalValue = annualFCF[4] * (1 + terminalGrowth) / (wacc - terminalGrowth);
  
  let npv = 0;
  for (let i = 0; i < 5; i++) {
    npv += annualFCF[i] / Math.pow(1 + wacc, i + 1);
  }
  npv += terminalValue / Math.pow(1 + wacc, 5);
  
  const fairValue = npv;
  const irr = calculateIRR(annualFCF, fairValue);

  return {
    companyInfo: {
      name: modelData.companyName || "HomeStay Pro",
      industry: modelData.industry || "посуточная сдача квартир",
      stage: modelData.stage || "growth"
    },
    assumptions: {
      taxRate: taxRate,
      wacc: wacc,
      terminalGrowthRate: terminalGrowth,
      workingCapital: {
        dso: 15,
        dpo: 30,
        dio: 0
      }
    },
    monthlyProjections,
    annualSummary: {
      years: [2025, 2026, 2027, 2028, 2029],
      revenue: annualRevenue,
      ebitda: annualEbitda,
      netIncome: annualNetIncome,
      freeCashFlow: annualFCF
    },
    valuation: {
      fairValue: `${Math.round(fairValue / 1000000)} млн ${currency}`,
      npv: `${Math.round(npv / 1000000)} млн ${currency}`,
      irr: `${Math.round(irr * 100)}%`,
      terminalValue: `${Math.round(terminalValue / 1000000)} млн ${currency}`,
      dcfBreakdown: {
        explicitPeriod: `${Math.round(npv * 0.6 / 1000000)} млн ${currency}`,
        terminalValue: `${Math.round(terminalValue / 1000000)} млн ${currency}`,
        totalValue: `${Math.round(fairValue / 1000000)} млн ${currency}`
      }
    },
    sensitivityAnalysis: {
      currency: currency,
      revenueGrowth: {
        labels: ["-20%", "-10%", "0%", "+10%", "+20%"],
        values: [
          Math.round(npv * 0.6 / 1000000),
          Math.round(npv * 0.8 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 1.2 / 1000000),
          Math.round(npv * 1.4 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 0.6 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.8 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 1.2 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.4 / 1000000), currency)
        ]
      },
      wacc: {
        labels: ["12%", "14%", "16%", "18%", "20%"],
        values: [
          Math.round(npv * 1.3 / 1000000),
          Math.round(npv * 1.1 / 1000000),
          Math.round(npv * 0.95 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 0.85 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 1.3 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.1 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 0.85 / 1000000), currency)
        ]
      },
      terminalGrowth: {
        labels: ["2%", "3%", "4%", "5%", "6%"],
        values: [
          Math.round(npv * 0.9 / 1000000),
          Math.round(npv * 0.95 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 1.05 / 1000000),
          Math.round(npv * 1.1 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 0.9 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 1.05 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.1 / 1000000), currency)
        ]
      }
    },
    scenarios: [
      {
        name: "Базовый",
        probability: 0.6,
        revenueGrowth: growthRate,
        npv: `${Math.round(npv / 1000000)} млн ${currency}`,
        description: `Стабильный рост ${Math.round(growthRate * 100)}% в год`
      },
      {
        name: "Оптимистичный",
        probability: 0.2,
        revenueGrowth: growthRate * 1.5,
        npv: `${Math.round(npv * 1.4 / 1000000)} млн ${currency}`,
        description: `Быстрый рост ${Math.round(growthRate * 1.5 * 100)}% в год`
      },
      {
        name: "Пессимистичный",
        probability: 0.2,
        revenueGrowth: growthRate * 0.5,
        npv: `${Math.round(npv * 0.6 / 1000000)} млн ${currency}`,
        description: `Медленный рост ${Math.round(growthRate * 0.5 * 100)}% в год`
      }
    ],
    keyMetrics: {
      ebitdaMargin: annualEbitda.map((ebitda, i) => ebitda / annualRevenue[i]),
      netProfitMargin: annualNetIncome.map((netIncome, i) => netIncome / annualRevenue[i]),
      roe: annualNetIncome.map((netIncome, i) => netIncome / (annualRevenue[i] * 0.3)), // Предполагаем 30% собственного капитала
      roa: annualNetIncome.map((netIncome, i) => netIncome / annualRevenue[i]),
      debtToEquity: [0.2, 0.2, 0.2, 0.2, 0.2]
    },
    recommendations: [
      "Оптимизировать структуру затрат на аренду квартир",
      "Развивать премиум-сегмент для повышения маржинальности",
      "Внедрить систему автоматизации для снижения операционных расходов",
      "Расширять портфель в высокодоходных районах"
    ],
    riskFactors: [
      "Изменение рыночных ставок аренды",
      "Конкуренция в сегменте посуточной сдачи",
      "Регулятивные изменения в сфере туризма",
      "Сезонные колебания спроса"
    ]
  };
}

// Простая функция расчета IRR
function calculateIRR(cashFlows, initialInvestment) {
  // Упрощенный расчет IRR
  const totalCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0);
  const years = cashFlows.length;
  return Math.pow(totalCashFlow / initialInvestment, 1 / years) - 1;
}

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

// Функция определения валюты из текста
function detectCurrency(text) {
  const currencyPatterns = {
    'тенге': ['тенге', 'тг', 'kzt', 'казахстан'],
    'рублей': ['рублей', 'руб', 'рубль', 'rur', 'россия'],
    'долларов': ['долларов', 'доллар', 'usd', '$', 'сша'],
    'евро': ['евро', 'eur', '€', 'евросоюз'],
    'сом': ['сом', 'кгс', 'киргизия'],
    'сум': ['сум', 'узс', 'узбекистан']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [currency, patterns] of Object.entries(currencyPatterns)) {
    if (patterns.some(pattern => lowerText.includes(pattern))) {
      return currency;
    }
  }
  
  return 'тенге'; // дефолтная валюта
}

// Функция создания продуктовой матрицы
function createProductMatrix(modelData, baseRevenue) {
  const products = modelData.products || [
    { name: "Продукт 1", share: 0.02, cost: 1.80, margin: 0.40, price: 3.00 },
    { name: "Продукт 2", share: 0.16, cost: 1.60, margin: 0.45, price: 2.91 },
    { name: "Продукт 3", share: 0.10, cost: 1.70, margin: 0.42, price: 2.93 },
    { name: "Продукт 4", share: 0.20, cost: 1.50, margin: 0.48, price: 2.88 },
    { name: "Продукт 5", share: 0.05, cost: 1.90, margin: 0.38, price: 3.06 },
    { name: "Продукт 6", share: 0.30, cost: 1.40, margin: 0.50, price: 2.80 },
    { name: "Продукт 7", share: 0.12, cost: 1.65, margin: 0.43, price: 2.89 },
    { name: "Продукт 8", share: 0.05, cost: 1.85, margin: 0.39, price: 3.03 }
  ];
  
  const totalShare = products.reduce((sum, p) => sum + p.share, 0);
  const weightedCost = products.reduce((sum, p) => sum + p.cost * p.share, 0);
  const weightedMargin = products.reduce((sum, p) => sum + p.margin * p.share, 0);
  const weightedPrice = products.reduce((sum, p) => sum + p.price * p.share, 0);
  
  return {
    products: products,
    totals: {
      share: totalShare,
      cost: weightedCost,
      margin: weightedMargin,
      price: weightedPrice
    },
    additionalParams: {
      distributorDeferral: modelData.distributorDeferral || 7,
      partnerExpenses: modelData.partnerExpenses || 0.02,
      inventoryMonths: modelData.inventoryMonths || 2
    }
  };
}

// Функция создания каналов продаж
function createSalesChannels(modelData) {
  return {
    channels: [
      {
        name: "Гипер/супер маркеты",
        unitsPerSKU: 3,
        entryTicket: 50,
        skuCount: 8,
        startPoints: 15,
        monthlyGrowth: 0.28
      },
      {
        name: "Мини маркеты",
        unitsPerSKU: 5,
        entryTicket: 30,
        skuCount: 6,
        startPoints: 25,
        monthlyGrowth: 0.35
      },
      {
        name: "Дистрибьюторы",
        unitsPerSKU: 10,
        entryTicket: 100,
        skuCount: 12,
        startPoints: 8,
        monthlyGrowth: 0.20
      },
      {
        name: "Онлайн-магазины",
        unitsPerSKU: 15,
        entryTicket: 20,
        skuCount: 10,
        startPoints: 12,
        monthlyGrowth: 0.40
      }
    ]
  };
}

// Функция создания отчета о доходах и расходах
function createIncomeStatement(modelData, baseRevenue, growthRate, costStructure) {
  const months = 12;
  const monthlyData = [];
  
  for (let month = 1; month <= months; month++) {
    const monthlyGrowth = Math.pow(1 + growthRate, month / 12);
    const revenue = baseRevenue * monthlyGrowth;
    const cogs = revenue * 0.55; // 55% от выручки
    const grossMargin = revenue - cogs;
    const netMargin = grossMargin * 0.45; // 45% от валовой маржи
    const netProfit = netMargin;
    
    monthlyData.push({
      month: month,
      revenue: revenue,
      cogs: cogs,
      grossMargin: grossMargin,
      netMargin: netMargin,
      netProfit: netProfit,
      profitability: (netProfit / revenue) * 100
    });
  }
  
  return {
    monthlyData: monthlyData,
    annualTotals: {
      revenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
      cogs: monthlyData.reduce((sum, m) => sum + m.cogs, 0),
      grossMargin: monthlyData.reduce((sum, m) => sum + m.grossMargin, 0),
      netProfit: monthlyData.reduce((sum, m) => sum + m.netProfit, 0)
    }
  };
}

// Функция создания отчета о движении денежных средств
function createCashFlowStatement(modelData, baseRevenue, growthRate) {
  const months = 12;
  const monthlyData = [];
  let cashBalance = 10000; // Начальный остаток
  
  for (let month = 1; month <= months; month++) {
    const monthlyGrowth = Math.pow(1 + growthRate, month / 12);
    const revenue = baseRevenue * monthlyGrowth;
    const cogs = revenue * 0.55;
    const operatingCashFlow = revenue - cogs - (revenue * 0.15); // Операционные расходы
    
    // Потребность в финансировании
    const financingNeed = operatingCashFlow < 0 ? Math.abs(operatingCashFlow) : 0;
    
    // Получение финансирования
    const financingReceived = financingNeed;
    
    cashBalance = cashBalance + operatingCashFlow + financingReceived;
    
    monthlyData.push({
      month: month,
      beginningBalance: cashBalance - operatingCashFlow - financingReceived,
      operatingCashFlow: operatingCashFlow,
      financingReceived: financingReceived,
      endingBalance: cashBalance
    });
  }
  
  return {
    monthlyData: monthlyData,
    totalFinancing: monthlyData.reduce((sum, m) => sum + m.financingReceived, 0)
  };
}

// Функция создания баланса
function createBalanceSheet(modelData, baseRevenue, growthRate) {
  const months = 13; // 0-12 месяц
  const monthlyData = [];
  
  for (let month = 0; month <= months; month++) {
    const monthlyGrowth = month === 0 ? 1 : Math.pow(1 + growthRate, month / 12);
    const revenue = baseRevenue * monthlyGrowth;
    const netProfit = revenue * 0.45 * 0.45; // Чистая прибыль
    
    monthlyData.push({
      month: month,
      assets: {
        cash: month === 0 ? 10000 : 0,
        inventory: 0,
        receivables: revenue * 0.3, // 30% от выручки
        loansIssued: month <= 3 ? 40000 : month <= 6 ? 20000 : 0
      },
      liabilities: {
        equity: 100000 + (netProfit * month),
        currentProfit: netProfit
      }
    });
  }
  
  return {
    monthlyData: monthlyData
  };
}

// Функция создания анализа чувствительности
function createSensitivityAnalysis(baseRevenue, wacc, currency) {
  const npv = baseRevenue * 2.5; // Упрощенный расчет NPV
  
  return {
    currency: currency,
    revenueGrowth: {
      labels: ["-20%", "-10%", "0%", "+10%", "+20%"],
      values: [
        Math.round(npv * 0.6 / 1000000),
        Math.round(npv * 0.8 / 1000000),
        Math.round(npv / 1000000),
        Math.round(npv * 1.2 / 1000000),
        Math.round(npv * 1.4 / 1000000)
      ],
      formattedValues: [
        formatCurrency(Math.round(npv * 0.6 / 1000000), currency),
        formatCurrency(Math.round(npv * 0.8 / 1000000), currency),
        formatCurrency(Math.round(npv / 1000000), currency),
        formatCurrency(Math.round(npv * 1.2 / 1000000), currency),
        formatCurrency(Math.round(npv * 1.4 / 1000000), currency)
      ]
    },
    wacc: {
      labels: ["12%", "14%", "16%", "18%", "20%"],
      values: [
        Math.round(npv * 1.3 / 1000000),
        Math.round(npv * 1.1 / 1000000),
        Math.round(npv * 0.95 / 1000000),
        Math.round(npv / 1000000),
        Math.round(npv * 0.85 / 1000000)
      ],
      formattedValues: [
        formatCurrency(Math.round(npv * 1.3 / 1000000), currency),
        formatCurrency(Math.round(npv * 1.1 / 1000000), currency),
        formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
        formatCurrency(Math.round(npv / 1000000), currency),
        formatCurrency(Math.round(npv * 0.85 / 1000000), currency)
      ]
    },
    terminalGrowth: {
      labels: ["2%", "3%", "4%", "5%", "6%"],
      values: [
        Math.round(npv * 0.9 / 1000000),
        Math.round(npv * 0.95 / 1000000),
        Math.round(npv / 1000000),
        Math.round(npv * 1.05 / 1000000),
        Math.round(npv * 1.1 / 1000000)
      ],
      formattedValues: [
        formatCurrency(Math.round(npv * 0.9 / 1000000), currency),
        formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
        formatCurrency(Math.round(npv / 1000000), currency),
        formatCurrency(Math.round(npv * 1.05 / 1000000), currency),
        formatCurrency(Math.round(npv * 1.1 / 1000000), currency)
      ]
    }
  };
}

// Функция создания сценарного анализа
function createScenarioAnalysis(baseRevenue, growthRate, wacc, currency) {
  const npv = baseRevenue * 2.5;
  
  return [
    {
      name: "Базовый",
      probability: 0.6,
      revenueGrowth: growthRate,
      npv: `${Math.round(npv / 1000000)} млн ${currency}`,
      description: `Стабильный рост ${Math.round(growthRate * 100)}% в год`
    },
    {
      name: "Оптимистичный",
      probability: 0.2,
      revenueGrowth: growthRate * 1.5,
      npv: `${Math.round(npv * 1.4 / 1000000)} млн ${currency}`,
      description: `Быстрый рост ${Math.round(growthRate * 1.5 * 100)}% в год`
    },
    {
      name: "Пессимистичный",
      probability: 0.2,
      revenueGrowth: growthRate * 0.5,
      npv: `${Math.round(npv * 0.6 / 1000000)} млн ${currency}`,
      description: `Медленный рост ${Math.round(growthRate * 0.5 * 100)}% в год`
    }
  ];
}

// Функция создания показателей эффективности
function createPerformanceMetrics(baseRevenue, growthRate, wacc, currency) {
  const npv = baseRevenue * 2.5;
  const irr = wacc + 0.05; // IRR обычно выше WACC
  
  return {
    npv: `${formatCurrency(Math.round(npv / 1000000), currency)} млн`,
    irr: `${Math.round(irr * 100)}%`,
    paybackPeriod: "2.5 года",
    profitabilityIndex: "1.8",
    roe: "25%",
    roa: "15%",
    debtToEquity: "0.3"
  };
}

// Функция создания выводов и рекомендаций
function createConclusions(modelData, baseRevenue, growthRate, currency) {
  return {
    summary: `Финансовая модель показывает положительную динамику развития проекта с выручкой ${formatCurrency(baseRevenue, currency)} в базовом году и ростом ${Math.round(growthRate * 100)}% в год.`,
    keyFindings: [
      "Проект демонстрирует положительную NPV и IRR выше WACC",
      "Анализ чувствительности показывает устойчивость к изменениям ключевых параметров",
      "Сценарный анализ подтверждает жизнеспособность проекта в различных условиях",
      "Показатели эффективности соответствуют отраслевым стандартам"
    ],
    recommendations: [
      "Оптимизировать структуру затрат для повышения маржинальности",
      "Развивать диверсификацию каналов продаж",
      "Внедрить систему управления рисками",
      "Регулярно обновлять финансовые прогнозы"
    ],
    risks: [
      "Изменение рыночных условий",
      "Конкуренция в отрасли",
      "Регулятивные изменения",
      "Валютные риски"
    ]
  };
}

// Функция форматирования валюты
function formatCurrency(amount, currency) {
  const currencySymbols = {
    'тенге': '₸',
    'рублей': '₽',
    'долларов': '$',
    'евро': '€',
    'сом': 'с',
    'сум': 'сум'
  };
  
  const symbol = currencySymbols[currency] || '';
  const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  
  if (amount < 0) {
    return `-${symbol}${formattedAmount}`;
  }
  return `${symbol}${formattedAmount}`;
}

// Функция создания профессиональной финансовой модели по стандартам ФРП
function createProfessionalFinancialModel(modelData) {
  // Извлекаем данные из modelData
  const revenueStr = modelData.revenue || "15,000,000 тенге";
  const growthStr = modelData.growthRate || "35%";
  const waccStr = modelData.wacc || "18%";
  const taxStr = modelData.taxRate || "20%";
  
  // Определяем валюту из данных
  const detectedCurrency = detectCurrency(revenueStr + ' ' + (modelData.currency || ''));
  const currency = modelData.currency || detectedCurrency;
  const industry = modelData.industry || "общие услуги";
  
  // Парсим числовые значения
  const baseRevenue = parseFloat(revenueStr.replace(/[^\d]/g, '')) || 15000000;
  const growthRate = parseFloat(growthStr.match(/(\d+)/)?.[1] || "35") / 100;
  const wacc = parseFloat(waccStr.match(/(\d+)/)?.[1] || "18") / 100;
  const taxRate = parseFloat(taxStr.match(/(\d+)/)?.[1] || "20") / 100;
  
  // Определяем структуру затрат на основе отрасли
  const costStructure = getIndustryCostStructure(industry, modelData.costStructure);
  
  // Создаем профессиональную структуру модели
  const professionalModel = {
    // 1. КЛЮЧЕВЫЕ ПЕРЕМЕННЫЕ (Key Variables)
    keyVariables: {
      currency: currency,
      baseRevenue: baseRevenue,
      growthRate: growthRate,
      wacc: wacc,
      taxRate: taxRate,
      industry: industry,
      projectionYears: 5,
      baseYear: new Date().getFullYear()
    },
    
    // 2. ПРОДУКТОВАЯ МАТРИЦА (Product Matrix)
    productMatrix: createProductMatrix(modelData, baseRevenue),
    
    // 3. КАНАЛЫ ПРОДАЖ (Sales Channels)
    salesChannels: createSalesChannels(modelData),
    
    // 4. ОТЧЕТ О ДОХОДАХ И РАСХОДАХ (P&L)
    incomeStatement: createIncomeStatement(modelData, baseRevenue, growthRate, costStructure),
    
    // 5. ОТЧЕТ О ДВИЖЕНИИ ДЕНЕЖНЫХ СРЕДСТВ (Cash Flow)
    cashFlowStatement: createCashFlowStatement(modelData, baseRevenue, growthRate),
    
    // 6. БАЛАНС (Balance Sheet)
    balanceSheet: createBalanceSheet(modelData, baseRevenue, growthRate),
    
    // 7. АНАЛИЗ ЧУВСТВИТЕЛЬНОСТИ (Sensitivity Analysis)
    sensitivityAnalysis: createSensitivityAnalysis(baseRevenue, wacc, currency),
    
    // 8. СЦЕНАРНЫЙ АНАЛИЗ (Scenario Analysis)
    scenarioAnalysis: createScenarioAnalysis(baseRevenue, growthRate, wacc, currency),
    
    // 9. ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ (Performance Metrics)
    performanceMetrics: createPerformanceMetrics(baseRevenue, growthRate, wacc, currency),
    
    // 10. ВЫВОДЫ И РЕКОМЕНДАЦИИ (Conclusions)
    conclusions: createConclusions(modelData, baseRevenue, growthRate, currency)
  };
  
  return professionalModel;
}

// Функция создания универсальной финансовой модели (для обратной совместимости)
function createUniversalFinancialModel(modelData) {
  // Извлекаем данные из modelData
  const revenueStr = modelData.revenue || "15,000,000 тенге";
  const growthStr = modelData.growthRate || "35%";
  const waccStr = modelData.wacc || "18%";
  const taxStr = modelData.taxRate || "20%";
  
  // Определяем валюту из данных
  const detectedCurrency = detectCurrency(revenueStr + ' ' + (modelData.currency || ''));
  const currency = modelData.currency || detectedCurrency;
  const industry = modelData.industry || "общие услуги";
  
  // Парсим числовые значения
  const baseRevenue = parseFloat(revenueStr.replace(/[^\d]/g, '')) || 15000000;
  const growthRate = parseFloat(growthStr.match(/(\d+)/)?.[1] || "35") / 100;
  const wacc = parseFloat(waccStr.match(/(\d+)/)?.[1] || "18") / 100;
  const taxRate = parseFloat(taxStr.match(/(\d+)/)?.[1] || "20") / 100;
  
  // Определяем структуру затрат на основе отрасли
  const costStructure = getIndustryCostStructure(industry, modelData.costStructure);
  
  const monthlyProjections = {
    revenue: [],
    cogs: [],
    grossProfit: [],
    operatingExpenses: {},
    ebitda: [],
    ebit: [],
    netIncome: [],
    freeCashFlow: []
  };

  // Инициализируем операционные расходы на основе структуры затрат
  Object.keys(costStructure).forEach(key => {
    monthlyProjections.operatingExpenses[key] = [];
  });

  // Генерируем месячные данные на 5 лет (60 месяцев)
  for (let month = 0; month < 60; month++) {
    const monthlyGrowth = Math.pow(1 + growthRate, month / 12);
    const revenue = baseRevenue * monthlyGrowth;
    
    // Рассчитываем затраты на основе структуры
    let totalOpex = 0;
    const opexBreakdown = {};
    
    Object.keys(costStructure).forEach(key => {
      const percentage = parseFloat(costStructure[key].replace('%', '')) / 100;
      const expense = revenue * percentage;
      opexBreakdown[key] = expense;
      totalOpex += expense;
    });
    
    // Рассчитываем COGS (обычно материалы + часть труда)
    const cogs = (opexBreakdown.materials || 0) + (opexBreakdown.labor || 0) * 0.5;
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - totalOpex;
    const ebit = ebitda * 0.95; // 5% амортизация
    const netIncome = ebit * (1 - taxRate);
    const freeCashFlow = netIncome * 0.85; // 85% конвертация в FCF

    monthlyProjections.revenue.push(Math.round(revenue));
    monthlyProjections.cogs.push(Math.round(cogs));
    monthlyProjections.grossProfit.push(Math.round(grossProfit));
    
    // Добавляем операционные расходы
    Object.keys(opexBreakdown).forEach(key => {
      monthlyProjections.operatingExpenses[key].push(Math.round(opexBreakdown[key]));
    });
    
    monthlyProjections.ebitda.push(Math.round(ebitda));
    monthlyProjections.ebit.push(Math.round(ebit));
    monthlyProjections.netIncome.push(Math.round(netIncome));
    monthlyProjections.freeCashFlow.push(Math.round(freeCashFlow));
  }

  // Рассчитываем годовые суммы
  const annualRevenue = [];
  const annualEbitda = [];
  const annualNetIncome = [];
  const annualFCF = [];
  
  for (let year = 0; year < 5; year++) {
    const yearStart = year * 12;
    const yearEnd = yearStart + 12;
    
    const yearRevenue = monthlyProjections.revenue.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearEbitda = monthlyProjections.ebitda.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearNetIncome = monthlyProjections.netIncome.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    const yearFCF = monthlyProjections.freeCashFlow.slice(yearStart, yearEnd).reduce((a, b) => a + b, 0);
    
    annualRevenue.push(yearRevenue);
    annualEbitda.push(yearEbitda);
    annualNetIncome.push(yearNetIncome);
    annualFCF.push(yearFCF);
  }

  // Рассчитываем DCF
  const terminalGrowth = 0.04; // 4% терминальный рост
  const terminalValue = annualFCF[4] * (1 + terminalGrowth) / (wacc - terminalGrowth);
  
  let npv = 0;
  for (let i = 0; i < 5; i++) {
    npv += annualFCF[i] / Math.pow(1 + wacc, i + 1);
  }
  npv += terminalValue / Math.pow(1 + wacc, 5);
  
  const fairValue = npv;
  const irr = calculateIRR(annualFCF, fairValue);

  // Генерируем рекомендации на основе отрасли
  const recommendations = getIndustryRecommendations(industry);
  
  // Генерируем риски на основе отрасли
  const riskFactors = getIndustryRiskFactors(industry);

  return {
    companyInfo: {
      name: modelData.companyName || "Моя компания",
      industry: industry,
      stage: modelData.stage || "growth"
    },
    assumptions: {
      taxRate: taxRate,
      wacc: wacc,
      terminalGrowthRate: terminalGrowth,
      workingCapital: {
        dso: 15,
        dpo: 30,
        dio: 0
      }
    },
    monthlyProjections,
    annualSummary: {
      years: [2025, 2026, 2027, 2028, 2029],
      revenue: annualRevenue,
      ebitda: annualEbitda,
      netIncome: annualNetIncome,
      freeCashFlow: annualFCF
    },
    valuation: {
      fairValue: `${Math.round(fairValue / 1000000)} млн ${currency}`,
      npv: `${Math.round(npv / 1000000)} млн ${currency}`,
      irr: `${Math.round(irr * 100)}%`,
      terminalValue: `${Math.round(terminalValue / 1000000)} млн ${currency}`,
      dcfBreakdown: {
        explicitPeriod: `${Math.round(npv * 0.6 / 1000000)} млн ${currency}`,
        terminalValue: `${Math.round(terminalValue / 1000000)} млн ${currency}`,
        totalValue: `${Math.round(fairValue / 1000000)} млн ${currency}`
      }
    },
    sensitivityAnalysis: {
      currency: currency,
      revenueGrowth: {
        labels: ["-20%", "-10%", "0%", "+10%", "+20%"],
        values: [
          Math.round(npv * 0.6 / 1000000),
          Math.round(npv * 0.8 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 1.2 / 1000000),
          Math.round(npv * 1.4 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 0.6 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.8 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 1.2 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.4 / 1000000), currency)
        ]
      },
      wacc: {
        labels: ["12%", "14%", "16%", "18%", "20%"],
        values: [
          Math.round(npv * 1.3 / 1000000),
          Math.round(npv * 1.1 / 1000000),
          Math.round(npv * 0.95 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 0.85 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 1.3 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.1 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 0.85 / 1000000), currency)
        ]
      },
      terminalGrowth: {
        labels: ["2%", "3%", "4%", "5%", "6%"],
        values: [
          Math.round(npv * 0.9 / 1000000),
          Math.round(npv * 0.95 / 1000000),
          Math.round(npv / 1000000),
          Math.round(npv * 1.05 / 1000000),
          Math.round(npv * 1.1 / 1000000)
        ],
        formattedValues: [
          formatCurrency(Math.round(npv * 0.9 / 1000000), currency),
          formatCurrency(Math.round(npv * 0.95 / 1000000), currency),
          formatCurrency(Math.round(npv / 1000000), currency),
          formatCurrency(Math.round(npv * 1.05 / 1000000), currency),
          formatCurrency(Math.round(npv * 1.1 / 1000000), currency)
        ]
      }
    },
    scenarios: [
      {
        name: "Базовый",
        probability: 0.6,
        revenueGrowth: growthRate,
        npv: `${Math.round(npv / 1000000)} млн ${currency}`,
        description: `Стабильный рост ${Math.round(growthRate * 100)}% в год`
      },
      {
        name: "Оптимистичный",
        probability: 0.2,
        revenueGrowth: growthRate * 1.5,
        npv: `${Math.round(npv * 1.4 / 1000000)} млн ${currency}`,
        description: `Быстрый рост ${Math.round(growthRate * 1.5 * 100)}% в год`
      },
      {
        name: "Пессимистичный",
        probability: 0.2,
        revenueGrowth: growthRate * 0.5,
        npv: `${Math.round(npv * 0.6 / 1000000)} млн ${currency}`,
        description: `Медленный рост ${Math.round(growthRate * 0.5 * 100)}% в год`
      }
    ],
    keyMetrics: {
      ebitdaMargin: annualEbitda.map((ebitda, i) => ebitda / annualRevenue[i]),
      netProfitMargin: annualNetIncome.map((netIncome, i) => netIncome / annualRevenue[i]),
      roe: annualNetIncome.map((netIncome, i) => netIncome / (annualRevenue[i] * 0.3)),
      roa: annualNetIncome.map((netIncome, i) => netIncome / annualRevenue[i]),
      debtToEquity: [0.2, 0.2, 0.2, 0.2, 0.2]
    },
    recommendations,
    riskFactors
  };
}

// Функция определения структуры затрат по отрасли
function getIndustryCostStructure(industry, userCostStructure) {
  // Если пользователь указал структуру затрат, используем её
  if (userCostStructure && Object.keys(userCostStructure).length > 0) {
    return userCostStructure;
  }
  
  // Стандартные структуры затрат по отраслям
  const industryCosts = {
    'посуточная сдача квартир': {
      'rent': '45%',
      'utilities': '15%',
      'labor': '20%',
      'marketing': '10%',
      'maintenance': '5%',
      'administrative': '5%'
    },
    'SaaS': {
      'technology': '30%',
      'labor': '40%',
      'marketing': '20%',
      'administrative': '10%'
    },
    'розничная торговля': {
      'materials': '60%',
      'labor': '15%',
      'rent': '10%',
      'marketing': '10%',
      'administrative': '5%'
    },
    'производство': {
      'materials': '50%',
      'labor': '25%',
      'technology': '10%',
      'utilities': '10%',
      'administrative': '5%'
    },
    'консультации': {
      'labor': '70%',
      'marketing': '15%',
      'administrative': '15%'
    },
    'транспорт': {
      'materials': '40%',
      'labor': '30%',
      'transport': '20%',
      'maintenance': '10%'
    },
    'ресторан': {
      'materials': '35%',
      'labor': '30%',
      'rent': '15%',
      'utilities': '10%',
      'marketing': '10%'
    }
  };
  
  // Ищем подходящую отрасль
  for (const [key, costs] of Object.entries(industryCosts)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return costs;
    }
  }
  
  // Дефолтная структура для неизвестной отрасли
  return {
    'materials': '40%',
    'labor': '30%',
    'marketing': '15%',
    'administrative': '15%'
  };
}

// Функция генерации рекомендаций по отрасли
function getIndustryRecommendations(industry) {
  const recommendations = {
    'посуточная сдача квартир': [
      "Оптимизировать структуру затрат на аренду квартир",
      "Развивать премиум-сегмент для повышения маржинальности",
      "Внедрить систему автоматизации для снижения операционных расходов",
      "Расширять портфель в высокодоходных районах"
    ],
    'SaaS': [
      "Увеличить инвестиции в разработку продукта",
      "Оптимизировать модель подписок",
      "Развивать партнерские программы",
      "Внедрить аналитику пользовательского поведения"
    ],
    'розничная торговля': [
      "Оптимизировать управление запасами",
      "Развивать онлайн-каналы продаж",
      "Внедрить программы лояльности",
      "Анализировать поведение покупателей"
    ],
    'производство': [
      "Автоматизировать производственные процессы",
      "Оптимизировать цепочку поставок",
      "Внедрить бережливое производство",
      "Развивать инновационные продукты"
    ],
    'консультации': [
      "Развивать экспертизу в нишевых областях",
      "Создавать масштабируемые продукты",
      "Внедрить системы управления проектами",
      "Развивать долгосрочные партнерства"
    ]
  };
  
  // Ищем подходящую отрасль
  for (const [key, recs] of Object.entries(recommendations)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return recs;
    }
  }
  
  // Дефолтные рекомендации
  return [
    "Оптимизировать структуру затрат",
    "Развивать ключевые компетенции",
    "Внедрить системы автоматизации",
    "Анализировать рыночные тренды"
  ];
}

// Функция генерации рисков по отрасли
function getIndustryRiskFactors(industry) {
  const riskFactors = {
    'посуточная сдача квартир': [
      "Изменение рыночных ставок аренды",
      "Конкуренция в сегменте посуточной сдачи",
      "Регулятивные изменения в сфере туризма",
      "Сезонные колебания спроса"
    ],
    'SaaS': [
      "Технологические изменения",
      "Конкуренция со стороны крупных игроков",
      "Изменения в регуляторной среде",
      "Зависимость от ключевых сотрудников"
    ],
    'розничная торговля': [
      "Изменение потребительского поведения",
      "Конкуренция с онлайн-ритейлом",
      "Экономические колебания",
      "Изменения в цепочке поставок"
    ],
    'производство': [
      "Колебания цен на сырье",
      "Технологические изменения",
      "Регулятивные требования",
      "Зависимость от ключевых поставщиков"
    ],
    'консультации': [
      "Зависимость от ключевых клиентов",
      "Конкуренция со стороны крупных консалтинговых компаний",
      "Изменения в рыночном спросе",
      "Регулятивные изменения"
    ]
  };
  
  // Ищем подходящую отрасль
  for (const [key, risks] of Object.entries(riskFactors)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return risks;
    }
  }
  
  // Дефолтные риски
  return [
    "Изменение рыночных условий",
    "Конкуренция в отрасли",
    "Экономические колебания",
    "Регулятивные изменения"
  ];
}

// Financial Analysis endpoints
app.get('/api/financial-data', async (req, res) => {
  try {
    console.log('[Server] Получен запрос на финансовые данные');
    
    // Моковые данные для демонстрации
    const financialData = {
      metrics: [
        { name: 'Выручка', value: 25000000, change: 15, trend: 'up', currency: 'тенге' },
        { name: 'Прибыль', value: 7000000, change: 8, trend: 'up', currency: 'тенге' },
        { name: 'Рентабельность', value: 28, change: 2, trend: 'up', currency: '%' },
        { name: 'Денежный поток', value: 8500000, change: 12, trend: 'up', currency: 'тенге' },
        { name: 'ROE', value: 23.3, change: 1.5, trend: 'up', currency: '%' },
        { name: 'ROA', value: 15.6, change: 0.8, trend: 'up', currency: '%' }
      ],
      summary: {
        revenue: 25000000,
        expenses: 18000000,
        profit: 7000000,
        growth: 25,
        cashFlow: 8500000,
        assets: 45000000,
        liabilities: 15000000,
        equity: 30000000
      },
      charts: {
        revenue: [22000000, 23500000, 25000000, 26500000, 28000000],
        profit: [6000000, 6500000, 7000000, 7500000, 8000000],
        cashFlow: [7000000, 7500000, 8500000, 9000000, 9500000]
      }
    };
    
    res.json({
      success: true,
      data: financialData,
      message: 'Финансовые данные загружены успешно'
    });
    
  } catch (error) {
    console.error('[Server] Ошибка при загрузке финансовых данных:', error);
    res.status(500).json({
      error: 'Ошибка при загрузке данных',
      details: error.message
    });
  }
});

app.post('/api/financial-analysis', async (req, res) => {
  try {
    const { data } = req.body;
    
    console.log('[Server] Получен запрос на финансовый анализ');
    
    // Простой анализ финансовых данных
    const analysis = {
      revenue: data.revenue || 0,
      expenses: data.expenses || 0,
      profit: (data.revenue || 0) - (data.expenses || 0),
      profitMargin: data.revenue ? ((data.revenue - data.expenses) / data.revenue * 100) : 0,
      growth: data.growth || 0,
      cashFlow: data.cashFlow || 0
    };
    
    res.json({
      success: true,
      analysis,
      message: 'Финансовый анализ выполнен успешно'
    });
    
  } catch (error) {
    console.error('[Server] Ошибка в финансовом анализе:', error);
    res.status(500).json({
      error: 'Ошибка при выполнении анализа',
      details: error.message
    });
  }
}); 

// ================== FINANCIAL MODEL BUILDER API ==================

// ИИ генерация финансовой модели
app.post('/api/ai/generate-model', async (req, res) => {
  try {
    const { businessDescription, timeframe = 3, currency = 'KZT', language = 'ru' } = req.body;
    
    console.log('[AI Model] Generating model for:', businessDescription);
    
    const prompt = `Ты — эксперт по финансовому моделированию. Создай полную 3-отчетную финансовую модель для следующего бизнеса:

"${businessDescription}"

Требования:
- Период: ${timeframe} года
- Валюта: ${currency}
- Язык: ${language}
- Включи все 3 отчета: P&L, Cash Flow, Balance Sheet
- Добавь лист с предпосылками (assumptions)
- Создай реалистичные формулы и связки между листами
- Учти отраслевую специфику

Верни результат в JSON формате:
{
  "industry": "название отрасли",
  "assumptions": {
    "tax_rate": 0.20,
    "growth_rate": 0.15,
    "wacc": 0.18,
    "other_key_assumptions": "значения"
  },
  "sheets": [
    {
      "id": "assumptions",
      "name": "Предпосылки", 
      "type": "assumptions",
      "icon": "⚙️",
      "data": [["Parameter", "Value"], ["Tax Rate", "20%"], ...],
      "formulas": {},
      "validations": {}
    },
    {
      "id": "revenue",
      "name": "Выручка",
      "type": "revenue", 
      "icon": "💰",
      "data": [["", "Год 1", "Год 2", "Год 3"], ["Продажи", 1000000, 1150000, 1322500], ...],
      "formulas": {"B2": "=assumptions!B5*assumptions!B6"},
      "validations": {}
    }
    // ... остальные листы
  ]
}`;

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Ты — эксперт по финансовому моделированию и работаешь как FinModelBuilder.com' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    let aiModel;
    try {
      const responseText = openaiResponse.choices[0].message.content;
      // Убираем markdown если есть
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      aiModel = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[AI Model] Parse error:', parseError);
      throw new Error('AI вернул некорректный JSON');
    }

    res.json(aiModel);
  } catch (error) {
    console.error('[AI Model] Error:', error);
    res.status(500).json({ error: 'Ошибка генерации модели: ' + error.message });
  }
});

// Загрузка готового шаблона
app.get('/api/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    console.log('[Template] Loading template:', templateId);
    
    // Предустановленные шаблоны
    const templates = {
      'coffee-shop': {
        assumptions: {
          seats: 20,
          avg_check: 1500,
          working_hours: 12,
          working_days: 365,
          tax_rate: 0.20,
          rent_per_month: 500000,
          staff_cost: 300000,
          food_cost_percent: 0.35,
          growth_rate: 0.15,
          wacc: 0.18,
          occupancy_rate: 0.60,
          operating_expenses_percent: 0.25
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '15%', '%'],
              ['WACC', '18%', '%'],
              ['Средний чек', '1500', 'тенге'],
              ['Количество мест', '20', 'шт'],
              ['Часы работы в день', '12', 'часов'],
              ['Дней в году', '365', 'дней'],
              ['Заполняемость зала', '60%', '%'],
              ['Себестоимость продуктов', '35%', '% от выручки'],
              ['Операционные расходы', '25%', '% от выручки']
            ],
            formulas: {},
            validations: {}
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Посетителей в день', '=assumptions!B6*assumptions!B9', '=B2*1.15', '=C2*1.15'],
              ['Средний чек', '=assumptions!B5', '=B3*1.05', '=C3*1.05'],
              ['Выручка в день', '=B2*B3', '=C2*C3', '=D2*D3'],
              ['Выручка в месяц', '=B4*30', '=C4*30', '=D4*30'],
              ['Выручка в год', '=B5*12', '=C5*12', '=D5*12']
            ],
            formulas: {
              'B2': '=assumptions!B6*assumptions!B9',
              'C2': '=B2*1.15',
              'D2': '=C2*1.15',
              'B3': '=assumptions!B5',
              'C3': '=B3*1.05',
              'D3': '=C3*1.05',
              'B4': '=B2*B3',
              'C4': '=C2*C3',
              'D4': '=D2*D3',
              'B5': '=B4*30',
              'C5': '=C4*30',
              'D5': '=D4*30',
              'B6': '=B5*12',
              'C6': '=C5*12',
              'D6': '=D5*12'
            },
            validations: {}
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Себестоимость продуктов', '=revenue!B6*assumptions!B10', '=revenue!C6*assumptions!B10', '=revenue!D6*assumptions!B10'],
              ['Аренда помещения', '6000000', '6300000', '6615000'],
              ['Фонд оплаты труда', '3600000', '3960000', '4356000'],
              ['Коммунальные услуги', '360000', '378000', '396900'],
              ['Маркетинг и реклама', '=revenue!B6*0.02', '=revenue!C6*0.02', '=revenue!D6*0.02'],
              ['Прочие операционные расходы', '=revenue!B6*0.03', '=revenue!C6*0.03', '=revenue!D6*0.03'],
              ['Итого операционные расходы', '=SUM(B2:B7)', '=SUM(C2:C7)', '=SUM(D2:D7)']
            ],
            formulas: {
              'B2': '=revenue!B6*assumptions!B10',
              'C2': '=revenue!C6*assumptions!B10',
              'D2': '=revenue!D6*assumptions!B10',
              'B6': '=revenue!B6*0.02',
              'C6': '=revenue!C6*0.02',
              'D6': '=revenue!D6*0.02',
              'B7': '=revenue!B6*0.03',
              'C7': '=revenue!C6*0.03',
              'D7': '=revenue!D6*0.03',
              'B8': '=SUM(B2:B7)',
              'C8': '=SUM(C2:C7)',
              'D8': '=SUM(D2:D7)'
            },
            validations: {}
          },
          {
            id: 'pnl',
            name: 'Отчет о прибылях и убытках',
            type: 'pnl',
            icon: '📋',
            data: [
              ['P&L', 'Год 1', 'Год 2', 'Год 3'],
              ['Выручка', '=revenue!B6', '=revenue!C6', '=revenue!D6'],
              ['Операционные расходы', '=expenses!B8', '=expenses!C8', '=expenses!D8'],
              ['EBITDA', '=B2-B3', '=C2-C3', '=D2-D3'],
              ['Амортизация', '200000', '200000', '200000'],
              ['EBIT', '=B4-B5', '=C4-C5', '=D4-D5'],
              ['Налоги', '=B6*assumptions!B2', '=C6*assumptions!B2', '=D6*assumptions!B2'],
              ['Чистая прибыль', '=B6-B7', '=C6-C7', '=D6-D7'],
              ['Рентабельность по чистой прибыли', '=B8/B2', '=C8/C2', '=D8/D2']
            ],
            formulas: {
              'B2': '=revenue!B6',
              'C2': '=revenue!C6',
              'D2': '=revenue!D6',
              'B3': '=expenses!B8',
              'C3': '=expenses!C8',
              'D3': '=expenses!D8',
              'B4': '=B2-B3',
              'C4': '=C2-C3',
              'D4': '=D2-D3',
              'B6': '=B4-B5',
              'C6': '=C4-C5',
              'D6': '=D4-D5',
              'B7': '=B6*assumptions!B2',
              'C7': '=C6*assumptions!B2',
              'D7': '=D6*assumptions!B2',
              'B8': '=B6-B7',
              'C8': '=C6-C7',
              'D8': '=D6-D7',
              'B9': '=B8/B2',
              'C9': '=C8/C2',
              'D9': '=D8/D2'
            },
            validations: {}
          },
          {
            id: 'cashflow',
            name: 'Отчет о движении денежных средств',
            type: 'cashflow',
            icon: '💸',
            data: [
              ['Cash Flow', 'Год 1', 'Год 2', 'Год 3'],
              ['Чистая прибыль', '=pnl!B8', '=pnl!C8', '=pnl!D8'],
              ['Изменение оборотного капитала', '-10000', '-11500', '-13225'],
              ['Капитальные затраты', '-50000', '-20000', '-20000'],
              ['Чистый денежный поток', '=B2+B3+B4', '=C2+C3+C4', '=D2+D3+D4']
            ],
            formulas: {
              'B2': '=pnl!B8',
              'C2': '=pnl!C8',
              'D2': '=pnl!D8',
              'B5': '=B2+B3+B4',
              'C5': '=C2+C3+C4',
              'D5': '=D2+D3+D4'
            },
            validations: {}
          },
          {
            id: 'balance',
            name: 'Баланс',
            type: 'balance',
            icon: '⚖️',
            data: [
              ['Баланс', 'Год 1', 'Год 2', 'Год 3'],
              ['Активы', '', '', ''],
              ['Денежные средства', '=cashflow!B5', '=cashflow!C5', '=cashflow!D5'],
              ['Оборотные активы', '10000', '11500', '13225'],
              ['Основные средства', '50000', '70000', '90000'],
              ['Итого активы', '=B3+B4+B5', '=C3+C4+C5', '=D3+D4+D5'],
              ['Обязательства', '', '', ''],
              ['Краткосрочные обязательства', '5000', '5750', '6612.5'],
              ['Долгосрочные обязательства', '20000', '18000', '16000'],
              ['Итого обязательства', '=B8+B9', '=C8+C9', '=D8+D9'],
              ['Капитал', '', '', ''],
              ['Капитал собственников', '=B6-B10', '=C6-C10', '=D6-D10'],
              ['Итого пассивы и капитал', '=B10+B12', '=C10+C12', '=D10+D12']
            ],
            formulas: {
              'B3': '=cashflow!B5',
              'C3': '=cashflow!C5',
              'D3': '=cashflow!D5',
              'B6': '=B3+B4+B5',
              'C6': '=C3+C4+C5',
              'D6': '=D3+D4+D5',
              'B10': '=B8+B9',
              'C10': '=C8+C9',
              'D10': '=D8+D9',
              'B12': '=B6-B10',
              'C12': '=C6-C10',
              'D12': '=D6-D10',
              'B13': '=B10+B12',
              'C13': '=C10+C12',
              'D13': '=D10+D12'
            },
            validations: {}
          }
        ]
      },
      
      'saas-startup': {
        assumptions: {
          monthly_price: 5000,
          initial_customers: 10,
          churn_rate: 0.05,
          customer_acquisition_cost: 15000,
          growth_rate: 0.20,
          tax_rate: 0.20,
          server_costs_per_customer: 500,
          team_size: 5,
          avg_salary: 600000,
          marketing_budget_percent: 0.25
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Цена подписки в месяц', '5000', 'тенге'],
              ['Начальное количество клиентов', '10', 'шт'],
              ['Отток клиентов (churn)', '5%', '%'],
              ['CAC (стоимость привлечения)', '15000', 'тенге'],
              ['Темп роста клиентов', '20%', '%'],
              ['Налоговая ставка', '20%', '%'],
              ['Серверные расходы на клиента', '500', 'тенге/месяц'],
              ['Размер команды', '5', 'человек'],
              ['Средняя зарплата', '600000', 'тенге/месяц'],
              ['Маркетинговый бюджет', '25%', '% от выручки']
            ]
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Количество клиентов (начало)', '10', '120', '432'],
              ['Новые клиенты', '110', '312', '518'],
              ['Отток клиентов', '0', '0', '0'],
              ['Количество клиентов (конец)', '120', '432', '950'],
              ['MRR (месячная выручка)', '600000', '2160000', '4750000'],
              ['ARR (годовая выручка)', '7200000', '25920000', '57000000'],
              ['LTV клиента', '100000', '100000', '100000']
            ]
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Фонд оплаты труда', '36000000', '43200000', '51840000'],
              ['Серверные расходы', '720000', '2592000', '5700000'],
              ['Маркетинг и продажи', '1800000', '6480000', '14250000'],
              ['Аренда офиса', '2400000', '2400000', '2400000'],
              ['Прочие операционные расходы', '1080000', '3888000', '8550000'],
              ['Итого операционные расходы', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)']
            ]
          },
          {
            id: 'pnl',
            name: 'Отчет о прибылях и убытках',
            type: 'pnl',
            icon: '📋',
            data: [
              ['P&L', 'Год 1', 'Год 2', 'Год 3'],
              ['Выручка', '7200000', '25920000', '57000000'],
              ['Операционные расходы', '42000000', '58560000', '82740000'],
              ['EBITDA', '=B2-B3', '=C2-C3', '=D2-D3'],
              ['Амортизация', '500000', '500000', '500000'],
              ['EBIT', '=B4-B5', '=C4-C5', '=D4-D5'],
              ['Налоги', '0', '0', '0'],
              ['Чистая прибыль', '=B6-B7', '=C6-C7', '=D6-D7']
            ]
          }
        ]
      },
      
      'ecommerce': {
        assumptions: {
          avg_order_value: 15000,
          orders_per_day: 50,
          conversion_rate: 0.02,
          return_rate: 0.15,
          cost_of_goods_sold: 0.60,
          shipping_cost: 1000,
          marketing_cpa: 500,
          warehouse_rent: 1500000,
          staff_count: 8,
          tax_rate: 0.20
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Средний чек', '15000', 'тенге'],
              ['Заказов в день', '50', 'шт'],
              ['Конверсия', '2%', '%'],
              ['Процент возвратов', '15%', '%'],
              ['Себестоимость товаров', '60%', '% от выручки'],
              ['Стоимость доставки', '1000', 'тенге/заказ'],
              ['CPA (стоимость привлечения)', '500', 'тенге/заказ'],
              ['Аренда склада', '1500000', 'тенге/месяц'],
              ['Количество сотрудников', '8', 'человек'],
              ['Налоговая ставка', '20%', '%']
            ]
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Заказов в день', '50', '65', '85'],
              ['Заказов в год', '18250', '23725', '31025'],
              ['Средний чек', '15000', '15750', '16538'],
              ['Валовая выручка', '=B2*B3', '=C2*C3', '=D2*D3'],
              ['Возвраты', '=B4*0.15', '=C4*0.15', '=D4*0.15'],
              ['Чистая выручка', '=B4-B5', '=C4-C5', '=D4-D5']
            ]
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Себестоимость товаров', '=revenue!B6*0.60', '=revenue!C6*0.60', '=revenue!D6*0.60'],
              ['Логистика и доставка', '18250000', '23725000', '31025000'],
              ['Маркетинг и реклама', '9125000', '11862500', '15512500'],
              ['Аренда склада', '18000000', '18900000', '19845000'],
              ['Фонд оплаты труда', '38400000', '42240000', '46464000'],
              ['Итого расходы', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)']
            ]
          }
        ]
      },
      
      'manufacturing': {
        assumptions: {
          production_capacity: 10000,
          unit_price: 5000,
          material_cost_per_unit: 2000,
          labor_cost_per_unit: 1000,
          factory_rent: 5000000,
          equipment_cost: 50000000,
          depreciation_years: 10,
          tax_rate: 0.20,
          working_capital_days: 60,
          capacity_utilization: 0.75
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Производственная мощность', '10000', 'единиц/месяц'],
              ['Цена за единицу', '5000', 'тенге'],
              ['Материалы на единицу', '2000', 'тенге'],
              ['Трудозатраты на единицу', '1000', 'тенге'],
              ['Аренда цеха', '5000000', 'тенге/месяц'],
              ['Стоимость оборудования', '50000000', 'тенге'],
              ['Срок амортизации', '10', 'лет'],
              ['Налоговая ставка', '20%', '%'],
              ['Оборотный капитал', '60', 'дней'],
              ['Загрузка мощностей', '75%', '%']
            ]
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Произведено единиц', '90000', '99000', '108900'],
              ['Цена за единицу', '5000', '5250', '5513'],
              ['Выручка от продаж', '=B2*B3', '=C2*C3', '=D2*D3']
            ]
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Сырье и материалы', '180000000', '198000000', '217800000'],
              ['Прямые трудозатраты', '90000000', '99000000', '108900000'],
              ['Аренда производства', '60000000', '63000000', '66150000'],
              ['Амортизация оборудования', '5000000', '5000000', '5000000'],
              ['Прочие производственные расходы', '13500000', '14850000', '16335000'],
              ['Итого расходы', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)']
            ]
          }
        ]
      },
      
      'retail-store': {
        assumptions: {
          store_size_sqm: 200,
          rent_per_sqm: 5000,
          avg_transaction: 8000,
          transactions_per_day: 100,
          inventory_turnover: 12,
          gross_margin: 0.40,
          staff_count: 6,
          avg_salary: 350000,
          marketing_percent: 0.03,
          tax_rate: 0.20
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Площадь магазина', '200', 'кв.м'],
              ['Аренда за кв.м', '5000', 'тенге/месяц'],
              ['Средний чек', '8000', 'тенге'],
              ['Транзакций в день', '100', 'шт'],
              ['Оборачиваемость товаров', '12', 'раз/год'],
              ['Валовая маржа', '40%', '%'],
              ['Количество сотрудников', '6', 'человек'],
              ['Средняя зарплата', '350000', 'тенге/месяц'],
              ['Маркетинг', '3%', '% от выручки'],
              ['Налоговая ставка', '20%', '%']
            ]
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Транзакций в день', '100', '110', '121'],
              ['Рабочих дней в году', '360', '360', '360'],
              ['Средний чек', '8000', '8400', '8820'],
              ['Годовая выручка', '=B2*B3*B4', '=C2*C3*C4', '=D2*D3*D4']
            ]
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Себестоимость товаров', '=revenue!B5*0.60', '=revenue!C5*0.60', '=revenue!D5*0.60'],
              ['Аренда помещения', '12000000', '12600000', '13230000'],
              ['Фонд оплаты труда', '25200000', '26460000', '27783000'],
              ['Маркетинг и реклама', '=revenue!B5*0.03', '=revenue!C5*0.03', '=revenue!D5*0.03'],
              ['Коммунальные услуги', '2400000', '2520000', '2646000'],
              ['Прочие расходы', '3600000', '3780000', '3969000'],
              ['Итого расходы', '=SUM(B2:B7)', '=SUM(C2:C7)', '=SUM(D2:D7)']
            ]
          }
        ]
      },
      
      'consulting': {
        assumptions: {
          consultants_count: 5,
          hourly_rate: 25000,
          billable_hours_per_month: 120,
          utilization_rate: 0.75,
          consultant_salary: 800000,
          office_rent: 1000000,
          overhead_percent: 0.20,
          tax_rate: 0.20,
          growth_rate: 0.15
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Количество консультантов', '5', 'человек'],
              ['Часовая ставка', '25000', 'тенге/час'],
              ['Оплачиваемых часов в месяц', '120', 'часов'],
              ['Коэффициент утилизации', '75%', '%'],
              ['Зарплата консультанта', '800000', 'тенге/месяц'],
              ['Аренда офиса', '1000000', 'тенге/месяц'],
              ['Накладные расходы', '20%', '% от выручки'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '15%', '%']
            ]
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Количество консультантов', '5', '6', '7'],
              ['Оплачиваемых часов на консультанта в год', '1080', '1080', '1080'],
              ['Часовая ставка', '25000', '27500', '30250'],
              ['Годовая выручка', '=B2*B3*B4', '=C2*C3*C4', '=D2*D3*D4']
            ]
          },
          {
            id: 'expenses',
            name: 'Расходы',
            type: 'expenses',
            icon: '📊',
            data: [
              ['Статья расходов', 'Год 1', 'Год 2', 'Год 3'],
              ['Фонд оплаты труда', '48000000', '57600000', '67200000'],
              ['Аренда офиса', '12000000', '12600000', '13230000'],
              ['Накладные расходы', '=revenue!B5*0.20', '=revenue!C5*0.20', '=revenue!D5*0.20'],
              ['Профессиональное развитие', '2700000', '3564000', '4547100'],
              ['Прочие расходы', '1350000', '1782000', '2273550'],
              ['Итого расходы', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)']
            ]
          }
        ]
      },
      
      'medical-clinic': {
        assumptions: {
          patients_per_day: 25,
          avg_consultation_fee: 8000,
          working_days: 250,
          tax_rate: 0.20,
          rent_per_month: 800000,
          medical_staff_cost: 1200000,
          equipment_depreciation: 300000,
          medicine_cost_percent: 0.15,
          growth_rate: 0.12,
          wacc: 0.16
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '12%', '%'],
              ['WACC', '16%', '%'],
              ['Пациентов в день', '25', 'чел'],
              ['Средняя стоимость приема', '8000', 'тенге'],
              ['Рабочих дней в году', '250', 'дней'],
              ['Аренда в месяц', '800000', 'тенге'],
              ['Фонд оплаты медперсонала', '1200000', 'тенге'],
              ['Амортизация оборудования', '300000', 'тенге/мес'],
              ['Медикаменты и расходники', '15%', '% от выручки']
            ],
            formulas: {},
            validations: {}
          },
          {
            id: 'revenue',
            name: 'Выручка',
            type: 'revenue',
            icon: '💰',
            data: [
              ['Показатель', 'Год 1', 'Год 2', 'Год 3'],
              ['Пациентов в день', '25', '28', '31'],
              ['Стоимость приема', '8000', '8400', '8820'],
              ['Выручка в день', '=B2*B3', '=C2*C3', '=D2*D3'],
              ['Выручка в месяц', '=B4*21', '=C4*21', '=D4*21'],
              ['Выручка в год', '=B5*12', '=C5*12', '=D5*12']
            ],
            formulas: {
              'B4': '=B2*B3',
              'C4': '=C2*C3',
              'D4': '=D2*D3',
              'B5': '=B4*21',
              'C5': '=C4*21',
              'D5': '=D4*21',
              'B6': '=B5*12',
              'C6': '=C5*12',
              'D6': '=D5*12'
            },
            validations: {}
          }
        ]
      },

      'education-courses': {
        assumptions: {
          students_per_course: 15,
          course_price: 45000,
          courses_per_month: 4,
          tax_rate: 0.20,
          rent_per_month: 300000,
          instructor_cost: 600000,
          marketing_percent: 0.08,
          materials_cost: 5000,
          growth_rate: 0.20,
          wacc: 0.18
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '20%', '%'],
              ['WACC', '18%', '%'],
              ['Студентов на курс', '15', 'чел'],
              ['Стоимость курса', '45000', 'тенге'],
              ['Курсов в месяц', '4', 'шт'],
              ['Аренда в месяц', '300000', 'тенге'],
              ['Зарплата преподавателей', '600000', 'тенге/мес'],
              ['Маркетинг', '8%', '% от выручки'],
              ['Материалы на студента', '5000', 'тенге']
            ],
            formulas: {},
            validations: {}
          }
        ]
      },

      'logistics-delivery': {
        assumptions: {
          deliveries_per_day: 120,
          avg_delivery_price: 1200,
          working_days: 365,
          tax_rate: 0.20,
          warehouse_rent: 400000,
          fuel_cost_percent: 0.25,
          drivers_salary: 800000,
          vehicles_count: 8,
          growth_rate: 0.18,
          wacc: 0.20
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '18%', '%'],
              ['WACC', '20%', '%'],
              ['Доставок в день', '120', 'шт'],
              ['Средняя стоимость доставки', '1200', 'тенге'],
              ['Рабочих дней в году', '365', 'дней'],
              ['Аренда склада', '400000', 'тенге/мес'],
              ['Зарплата водителей', '800000', 'тенге/мес'],
              ['Количество автомобилей', '8', 'шт'],
              ['Топливо и ГСМ', '25%', '% от выручки']
            ],
            formulas: {},
            validations: {}
          }
        ]
      },

      'tourism-hotel': {
        assumptions: {
          rooms_count: 20,
          avg_room_rate: 15000,
          occupancy_rate: 0.65,
          working_days: 365,
          tax_rate: 0.20,
          building_rent: 1200000,
          staff_cost: 900000,
          utilities_percent: 0.08,
          marketing_percent: 0.06,
          growth_rate: 0.15,
          wacc: 0.17
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '15%', '%'],
              ['WACC', '17%', '%'],
              ['Количество номеров', '20', 'шт'],
              ['Средняя стоимость номера', '15000', 'тенге/ночь'],
              ['Заполняемость', '65%', '%'],
              ['Рабочих дней в году', '365', 'дней'],
              ['Аренда здания', '1200000', 'тенге/мес'],
              ['Персонал отеля', '900000', 'тенге/мес'],
              ['Коммунальные услуги', '8%', '% от выручки'],
              ['Маркетинг и реклама', '6%', '% от выручки']
            ],
            formulas: {},
            validations: {}
          }
        ]
      },

      'auto-service': {
        assumptions: {
          cars_per_day: 12,
          avg_repair_cost: 25000,
          working_days: 300,
          tax_rate: 0.20,
          garage_rent: 600000,
          mechanics_salary: 1000000,
          parts_cost_percent: 0.40,
          equipment_depreciation: 200000,
          growth_rate: 0.14,
          wacc: 0.19
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '14%', '%'],
              ['WACC', '19%', '%'],
              ['Автомобилей в день', '12', 'шт'],
              ['Средняя стоимость ремонта', '25000', 'тенге'],
              ['Рабочих дней в году', '300', 'дней'],
              ['Аренда гаража', '600000', 'тенге/мес'],
              ['Зарплата механиков', '1000000', 'тенге/мес'],
              ['Стоимость запчастей', '40%', '% от выручки'],
              ['Амортизация оборудования', '200000', 'тенге/мес']
            ],
            formulas: {},
            validations: {}
          }
        ]
      },

      'beauty-salon': {
        assumptions: {
          clients_per_day: 18,
          avg_service_cost: 12000,
          working_days: 300,
          tax_rate: 0.20,
          salon_rent: 450000,
          staff_salary: 700000,
          products_cost_percent: 0.20,
          equipment_cost: 150000,
          growth_rate: 0.16,
          wacc: 0.18
        },
        sheets: [
          {
            id: 'assumptions',
            name: 'Предпосылки',
            type: 'assumptions',
            icon: '⚙️',
            data: [
              ['Параметр', 'Значение', 'Единица'],
              ['Налоговая ставка', '20%', '%'],
              ['Темп роста', '16%', '%'],
              ['WACC', '18%', '%'],
              ['Клиентов в день', '18', 'чел'],
              ['Средняя стоимость услуги', '12000', 'тенге'],
              ['Рабочих дней в году', '300', 'дней'],
              ['Аренда салона', '450000', 'тенге/мес'],
              ['Зарплата мастеров', '700000', 'тенге/мес'],
              ['Косметика и расходники', '20%', '% от выручки'],
              ['Амортизация оборудования', '150000', 'тенге/мес']
            ],
            formulas: {},
            validations: {}
          }
        ]
      }
    };

    // Автоматически добавляем лист "Результаты" ко всем шаблонам
    Object.values(templates).forEach(template => {
      if (!template.sheets.find(s => s.id === 'results')) {
        template.sheets.push({
          id: 'results',
          name: 'Результаты',
          type: 'results',
          icon: '📊',
          data: [
            ['Показатель', 'Значение', 'Единица'],
            ['Общая выручка', '0', 'тенге'],
            ['Общие расходы', '0', 'тенге'],
            ['Чистая прибыль', '0', 'тенге'],
            ['Рентабельность', '0%', '%'],
            ['Точка безубыточности', 'Н/Д', 'месяц']
          ],
          formulas: {},
          validations: {}
        });
      }
    });
    
    const template = templates[templateId];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('[Template] Error:', error);
    res.status(500).json({ error: 'Ошибка загрузки шаблона: ' + error.message });
  }
});

// Экспорт в Excel
app.post('/api/export/excel', async (req, res) => {
  try {
    const model = req.body;
    
    console.log('[Export] Generating Excel for model:', model.name);
    
    // Создаем улучшенный Excel файл
    let csvContent = '';
    
    // Заголовок файла
    csvContent += `${model.name}\n`;
    csvContent += `Финансовая модель\n`;
    csvContent += `Создано: ${new Date().toLocaleDateString('ru-RU')}\n`;
    csvContent += `Валюта: KZT\n\n`;
    
    // Добавляем данные из каждого листа с улучшенным форматированием
    model.sheets.forEach((sheet, sheetIndex) => {
      csvContent += `=== ${sheet.name.toUpperCase()} ===\n`;
      
      if (sheet.data && sheet.data.length > 0) {
        // Добавляем заголовки с табуляцией для правильного выравнивания
        sheet.data.forEach((row, rowIndex) => {
          if (Array.isArray(row)) {
            const formattedRow = row.map(cell => {
              let cellValue = cell || '';
              
              // Форматирование чисел
              if (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)) && !cellValue.includes('%')) {
                const num = parseFloat(cellValue);
                if (num >= 1000) {
                  cellValue = new Intl.NumberFormat('ru-RU').format(num);
                }
              }
              
              // Экранирование специальных символов для CSV
              if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"'))) {
                cellValue = `"${cellValue.replace(/"/g, '""')}"`;
              }
              
              return cellValue;
            });
            
            csvContent += formattedRow.join('\t') + '\n';
          }
        });
      }
      
      csvContent += '\n';
    });
    
    // Добавляем метаинформацию в конец
    csvContent += '\n=== ИНФОРМАЦИЯ О МОДЕЛИ ===\n';
    csvContent += `Отрасль\t${model.industry || 'Общая'}\n`;
    csvContent += `Шаблон\t${model.template || 'Пользовательский'}\n`;
    csvContent += `Листов\t${model.sheets?.length || 0}\n`;
    csvContent += `Последнее изменение\t${new Date(model.lastModified || Date.now()).toLocaleString('ru-RU')}\n`;
    csvContent += '\nСоздано в FinSights AI - Финансовый ассистент\n';
    csvContent += 'Для получения полной версии с формулами обратитесь к разработчикам\n';
    
    // Возвращаем улучшенный CSV как Excel
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    // Безопасное имя файла без кириллицы
    const safeFilename = `${model.id || 'model'}_financial_model.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Добавляем BOM для корректного отображения кириллицы в Excel
    const bom = '\ufeff';
    res.send(bom + csvContent);
    
  } catch (error) {
    console.error('[Export] Excel error:', error);
    res.status(500).json({ error: 'Ошибка экспорта в Excel: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') });
  }
});

// Экспорт в Google Sheets
app.post('/api/export/google-sheets', async (req, res) => {
  try {
    const model = req.body;
    
    console.log('[Export] Creating Google Sheets for model:', model.name);
    
    // Создаем улучшенный CSV для импорта в Google Sheets
    let csvContent = '';
    
    model.sheets.forEach((sheet, sheetIndex) => {
      // Для Google Sheets создаем отдельные секции
      if (sheetIndex > 0) csvContent += '\n\n';
      
      csvContent += `"=== ${sheet.name} ==="\n`;
      
      if (sheet.data && sheet.data.length > 0) {
        sheet.data.forEach(row => {
          if (Array.isArray(row)) {
            const formattedRow = row.map(cell => {
              let cellValue = String(cell || '');
              
              // Обработка формул для Google Sheets
              if (cellValue.startsWith('=')) {
                // Конвертируем Excel формулы в Google Sheets формат
                cellValue = cellValue.replace(/!/g, '.');
              }
              
              // Экранирование для CSV
              if (cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"')) {
                cellValue = `"${cellValue.replace(/"/g, '""')}"`;
              }
              
              return cellValue;
            });
            
            csvContent += formattedRow.join(',') + '\n';
          }
        });
      }
    });
    
    // Возвращаем ссылку и данные для Google Sheets
    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web`;
    
    res.json({ 
      url: googleSheetsUrl,
      csv: csvContent,
      instructions: {
        ru: [
          '1. Нажмите на ссылку выше для создания нового Google Sheets',
          '2. Скопируйте CSV данные из поля ниже (Ctrl+A, затем Ctrl+C)', 
          '3. В Google Sheets выберите File → Import → Upload → Paste',
          '4. Выберите "Comma" как разделитель',
          '5. Нажмите "Import data"'
        ],
        en: [
          '1. Click the link above to create a new Google Sheets',
          '2. Copy CSV data from the field below (Ctrl+A, then Ctrl+C)',
          '3. In Google Sheets choose File → Import → Upload → Paste', 
          '4. Select "Comma" as separator',
          '5. Click "Import data"'
        ]
      },
      metadata: {
        name: model.name,
        sheets: model.sheets?.length || 0,
        created: new Date().toISOString(),
        source: 'FinSights AI'
      },
      message: '📋 CSV данные готовы для импорта в Google Sheets'
    });
    
  } catch (error) {
    console.error('[Export] Google Sheets error:', error);
    res.status(500).json({ error: 'Ошибка экспорта в Google Sheets: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') });
  }
});

// API для обновления данных модели
app.post('/api/model/update-cell', async (req, res) => {
  try {
    const { modelId, sheetId, row, col, value } = req.body;
    
    console.log('[Model] Updating cell:', { modelId, sheetId, row, col, value });
    
    // Здесь должна быть логика сохранения изменений
    // Пока просто возвращаем успех
    res.json({ success: true, message: 'Ячейка обновлена' });
  } catch (error) {
    console.error('[Model] Update error:', error);
    res.status(500).json({ error: 'Ошибка обновления ячейки: ' + error.message });
  }
});

// API для добавления новой строки
app.post('/api/model/add-row', async (req, res) => {
  try {
    const { modelId, sheetId, rowData } = req.body;
    
    console.log('[Model] Adding row:', { modelId, sheetId, rowData });
    
    res.json({ success: true, message: 'Строка добавлена' });
  } catch (error) {
    console.error('[Model] Add row error:', error);
    res.status(500).json({ error: 'Ошибка добавления строки: ' + error.message });
  }
});

// ... rest of existing code ... 

// Экспорт в PDF
app.post('/api/export/pdf', async (req, res) => {
  try {
    const model = req.body;
    
    console.log('[Export] Creating PDF for model:', model.name);
    
    // Создаем HTML контент для PDF
    const htmlContent = generatePDFHTML(model);
    
    // Возвращаем HTML который можно конвертировать в PDF на фронтенде
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Безопасное имя файла без кириллицы
    const safeFilename = `${model.id || 'model'}_report.html`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('[Export] PDF error:', error);
    res.status(500).json({ error: 'Ошибка создания PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') });
  }
});

// Функция генерации HTML для PDF
function generatePDFHTML(model) {
  const now = new Date().toLocaleString('ru-RU');
  
  // Вычисляем основные метрики
  const revenueSheet = model.sheets.find(s => s.type === 'revenue');
  const expensesSheet = model.sheets.find(s => s.type === 'expenses');
  
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  if (revenueSheet?.data) {
    revenueSheet.data.forEach((row, index) => {
      if (index > 0 && row[1]) {
        const value = typeof row[1] === 'string' ? 
          parseFloat(row[1].replace(/[^\d.-]/g, '')) || 0 : 
          row[1] || 0;
        totalRevenue += value;
      }
    });
  }
  
  if (expensesSheet?.data) {
    expensesSheet.data.forEach((row, index) => {
      if (index > 0 && row[1]) {
        const value = typeof row[1] === 'string' ? 
          parseFloat(row[1].replace(/[^\d.-]/g, '')) || 0 : 
          row[1] || 0;
        totalExpenses += value;
      }
    });
  }
  
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Финансовый отчет: ${model.name || 'Модель'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1E40AF;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #6B7280;
      font-size: 16px;
    }
    
    .kpi-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .kpi-card {
      background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border-left: 5px solid #3B82F6;
    }
    .kpi-card h3 {
      color: #374151;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-card .value {
      color: #1E40AF;
      font-size: 28px;
      font-weight: bold;
    }
    .kpi-card.positive .value { color: #059669; }
    .kpi-card.negative .value { color: #DC2626; }
    
    .section {
      margin-bottom: 40px;
      background: #F9FAFB;
      padding: 25px;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
    }
    .section h2 {
      color: #1F2937;
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E5E7EB;
    }
    
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: #F3F4F6;
      color: #374151;
      font-weight: 600;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #E5E7EB;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #F3F4F6;
    }
    tr:nth-child(even) { background: #F9FAFB; }
    tr:hover { background: #F3F4F6; }
    
    .recommendations {
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-left: 5px solid #3B82F6;
    }
    .recommendations ul {
      list-style: none;
      padding-left: 0;
    }
    .recommendations li {
      padding: 8px 0;
      position: relative;
      padding-left: 25px;
    }
    .recommendations li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: bold;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 12px;
    }
    
    @media print {
      body { font-size: 12px; }
      .kpi-section { grid-template-columns: repeat(4, 1fr); }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Заголовок -->
    <div class="header">
      <h1>📊 ${model.name || 'Финансовая модель'}</h1>
      <div class="subtitle">
        Финансовый отчет • ${model.industry || 'Общая отрасль'} • Создан: ${now}
      </div>
    </div>

    <!-- KPI метрики -->
    <div class="kpi-section">
      <div class="kpi-card ${totalRevenue > 0 ? 'positive' : ''}">
        <h3>Выручка (1-й год)</h3>
        <div class="value">${Math.round(totalRevenue / 1000).toLocaleString('ru-RU')}K ₸</div>
      </div>
      <div class="kpi-card ${totalExpenses > 0 ? 'negative' : ''}">
        <h3>Расходы (1-й год)</h3>
        <div class="value">${Math.round(totalExpenses / 1000).toLocaleString('ru-RU')}K ₸</div>
      </div>
      <div class="kpi-card ${profit > 0 ? 'positive' : 'negative'}">
        <h3>Прибыль (1-й год)</h3>
        <div class="value">${Math.round(profit / 1000).toLocaleString('ru-RU')}K ₸</div>
      </div>
      <div class="kpi-card">
        <h3>Рентабельность</h3>
        <div class="value">${margin}%</div>
      </div>
    </div>

    <!-- Детальные таблицы -->
    ${model.sheets.map(sheet => `
      <div class="section">
        <h2>${sheet.icon} ${sheet.name}</h2>
        <div class="table-container">
          <table>
            ${sheet.data && sheet.data.length > 0 ? 
              sheet.data.map((row, index) => 
                `<tr>
                  ${row.map(cell => 
                    index === 0 ? 
                      `<th>${cell || ''}</th>` : 
                      `<td>${cell || ''}</td>`
                  ).join('')}
                </tr>`
              ).join('') : 
              '<tr><td colspan="100%">Нет данных</td></tr>'
            }
          </table>
        </div>
      </div>
    `).join('')}

    <!-- Рекомендации -->
    <div class="section recommendations">
      <h2>💡 Рекомендации и выводы</h2>
      <ul>
        ${profit > 0 ? 
          '<li>Модель показывает положительную прибыльность</li>' : 
          '<li>Необходимо пересмотреть структуру доходов и расходов</li>'
        }
        ${parseFloat(margin) > 15 ? 
          '<li>Хорошая рентабельность бизнеса</li>' : 
          '<li>Рекомендуется оптимизировать затраты для увеличения маржи</li>'
        }
        <li>Регулярно обновляйте прогнозы и отслеживайте ключевые метрики</li>
        <li>Проводите сценарный анализ для оценки рисков</li>
        <li>Сравнивайте плановые и фактические показатели</li>
        <li>Корректируйте стратегию на основе полученных данных</li>
      </ul>
    </div>

    <!-- Метаинформация -->
    <div class="section">
      <h2>📋 Информация о модели</h2>
      <div class="table-container">
        <table>
          <tr><th>Параметр</th><th>Значение</th></tr>
          <tr><td>Название модели</td><td>${model.name || 'Без названия'}</td></tr>
          <tr><td>Отрасль</td><td>${model.industry || 'Общая'}</td></tr>
          <tr><td>Шаблон</td><td>${model.template || 'Пользовательский'}</td></tr>
          <tr><td>Количество листов</td><td>${model.sheets?.length || 0}</td></tr>
          <tr><td>Дата создания</td><td>${now}</td></tr>
          <tr><td>Источник</td><td>FinSights AI - Финансовый конструктор</td></tr>
        </table>
      </div>
    </div>

    <!-- Подвал -->
    <div class="footer">
      <p>Создано в FinSights AI • Финансовый ассистент с искусственным интеллектом</p>
      <p>Для получения актуальных данных и интерактивных функций используйте веб-версию</p>
    </div>
  </div>

  <script>
    // Автоматическая печать при открытии
    window.onload = function() {
      if (confirm('Открыть диалог печати для сохранения в PDF?')) {
        window.print();
      }
    };
  </script>
</body>
</html>`;
}

// Экспорт в Google Sheets