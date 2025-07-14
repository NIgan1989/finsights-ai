const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
// Удаляю Stripe
// const Stripe = require('stripe');
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Минимальное хранилище пользователей (MVP)
const users = {};

// В памяти: userId <-> customerId и статус подписки
// Удаляю Stripe
// const userToStripeCustomer = {};
// const customerToUser = {};
const userSubscriptionStatus = {};

// Подготовка к интеграции Google OAuth (passport.js)
// Здесь будет passport.use(...) и маршруты /auth/google, /auth/google/callback

// Сессии
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  users[profile.id] = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value,
    photoUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
  };
  return done(null, users[profile.id]);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, users[id]));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/dashboard');
  }
);

app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Вход
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
  // Удалить строки вида:
  // const valid = await bcrypt.compare(password, user.password);
  // if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
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

// Сброс пароля (заглушка)
app.post('/api/reset-password', (req, res) => {
  const { email } = req.body;
  // В реальном проекте: найти пользователя, сгенерировать токен, отправить email
  const user = users.find(u => u.email === email);
  if (user) {
    console.log(`Отправка письма для сброса пароля на ${email}`);
  }
  // Не раскрываем, есть ли пользователь
  res.json({ success: true });
});

// Удаляю /api/create-checkout-session и /api/stripe-webhook
// Вместо этого добавляю endpoint для заявки на оплату через Kaspi Gold
app.post('/api/kaspi-payment-request', (req, res) => {
  const { userId } = req.body;
  // Сохраняем заявку на оплату (MVP: просто в память)
  if (!userId) return res.status(400).json({ error: 'userId required' });
  userSubscriptionStatus[userId] = 'pending';
  // В реальном проекте: уведомить админа, записать в базу, отправить email и т.д.
  res.json({ success: true, message: 'Заявка на оплату получена. Мы проверим перевод и активируем PRO в течение 24 часов.' });
});

// Оставляю endpoint для проверки статуса подписки
app.get('/api/subscription-status', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const status = userSubscriptionStatus[userId] || 'free';
  res.json({ status });
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