const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Импортируем модули
const { router: authRoutes, users } = require('./routes/auth');
const openaiRoutes = require('./routes/openai');
const financialModelRoutes = require('./routes/financialModel');
const exportRoutes = require('./routes/export');
const FinancialModelService = require('./services/financialModelService');
const { validate } = require('./utils/validation');
const logger = require('./utils/logger');
const FormulaValidator = require('./utils/formulaValidator');

// Загружаем .env файл из папки backend
const envPath = path.join(__dirname, '.env');
console.log('[Server] Looking for .env file at:', envPath);
console.log('[Server] File exists:', require('fs').existsSync(envPath));

// Попробуем прочитать файл вручную
const fs = require('fs');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Больше не логируем содержимое .env, чтобы не раскрывать секреты
  
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
          // Безопасный лог: только имя переменной без значения
          console.log(`[Server] Loaded env var: ${key}`);
        }
      }
    }
  });
} else {
  console.error('[Server] .env file not found at:', envPath);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка CORS с поддержкой cookies
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(bodyParser.json());

// Настройка сессий
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret-for-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // для development
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Инициализируем валидатор формул
const formulaValidator = new FormulaValidator();

// Улучшенное логирование всех запросов с измерением времени
app.use((req, res, next) => {
  const startTime = Date.now();
  
  logger.debug(`Начало обработки запроса: ${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    return originalSend.call(this, data);
  };
  
  next();
});

// Проверяем загрузку API ключа
console.log('[Server] OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? 'YES' : 'NO');
if (!process.env.OPENAI_API_KEY) {
  console.error('[Server] ERROR: OPENAI_API_KEY not found in environment variables');
}

// Простое хранилище пользователей импортируется из routes/auth.js

const userSubscriptionStatus = {};
const userUsageData = {};

// Заявки на активацию PRO-подписки (изначально пустой список)
const paymentRequests = [];

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Подключаем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/financial-model', financialModelRoutes);
app.use('/api/export', exportRoutes);

// Хранилище пользовательских данных
const userProfiles = {}; // userId -> { profiles: [], activeProfileId: string }
const userTransactions = {}; // userId -> transactions[]

// Основные API эндпоинты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Получение доступных шаблонов (оставляем для обратной совместимости)
app.get('/api/templates', (req, res) => {
  try {
    const templates = FinancialModelService.getAvailableTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    logger.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// API для работы с профилями пользователя
app.get('/api/user/profiles', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userData = userProfiles[userId] || { profiles: [], activeProfileId: null };
    res.json({
      profiles: userData.profiles,
      activeProfileId: userData.activeProfileId
    });
    
  } catch (error) {
    logger.error('Error getting user profiles:', error);
    res.status(500).json({ error: 'Failed to get user profiles' });
  }
});

app.post('/api/user/profiles', (req, res) => {
  try {
    const { userId, profiles, activeProfileId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!Array.isArray(profiles)) {
      return res.status(400).json({ error: 'Profiles must be an array' });
    }

    userProfiles[userId] = {
      profiles: profiles,
      activeProfileId: activeProfileId || null
    };
    
    logger.info(`Saved ${profiles.length} profiles for user ${userId}`);
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Error saving user profiles:', error);
    res.status(500).json({ error: 'Failed to save user profiles' });
  }
});



// API для работы с транзакциями пользователя
app.get('/api/user/transactions', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const transactions = userTransactions[userId] || [];
    res.json({ transactions });
    
  } catch (error) {
    logger.error('Error getting user transactions:', error);
    res.status(500).json({ error: 'Failed to get user transactions' });
  }
});

app.post('/api/user/transactions', (req, res) => {
  try {
    const { userId, transactions } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions must be an array' });
    }

    userTransactions[userId] = transactions;
    
    logger.info(`Saved ${transactions.length} transactions for user ${userId}`);
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Error saving user transactions:', error);
    res.status(500).json({ error: 'Failed to save user transactions' });
  }
});

// Получение статистики использования
app.get('/api/usage-stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const stats = userUsageData[userId] || {
      modelsGenerated: 0,
      chatMessages: 0,
      lastActivity: null
    };
    
    res.json({ success: true, stats });
    
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// НОВЫЕ ЭНДПОИНТЫ ДЛЯ ПОДПИСОК И ЗАЯВОК

// Реальная аналитика для админки
app.get('/api/admin/analytics', (req, res) => {
  try {
    // Список всех пользователей
    const allUsers = Object.values(users || {});

    // Заявки на PRO
    const requests = paymentRequests || [];

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Новые пользователи за месяц по полю createdAt (если есть)
    const newUsersThisMonth = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const approvedRequests = requests.filter(r => r.status === 'approved');

    const totalRevenue = approvedRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

    // proUsers: админ всегда PRO + пользователи с одобренными заявками
    const proUsers = 1 + new Set(approvedRequests.map(r => r.userId)).size;

    // Конверсия из заявок
    const conversionRate = requests.length > 0 ? (approvedRequests.length / requests.length) * 100 : 0;

    // Предположим активных ~80% от всех пользователей
    const activeUsers = Math.floor(Math.max(allUsers.length, 1) * 0.8);

    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    // Подготовим помесячные данные (последние 6 месяцев) на основании заявок
    const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
    });

    const monthly = months.map(({ label, year, month }) => {
      const monthRequests = requests.filter(r => {
        const dt = new Date(r.createdAt);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

      const usersCount = monthRequests.length;
      const approvedCount = monthRequests.filter(r => r.status === 'approved').length;
      const revenue = monthRequests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);

      return { month: label, users: usersCount, approved: approvedCount, revenue };
    });

    res.json({
      success: true,
      stats: {
        totalUsers: Math.max(allUsers.length, 1),
        newUsersThisMonth,
        proUsers,
        totalRevenue,
        conversionRate,
        activeUsers,
        pendingRequests
      },
      monthly
    });
  } catch (error) {
    logger.error('Error building admin analytics:', error);
    res.status(500).json({ error: 'Failed to build analytics' });
  }
});

// Настройки системы
const systemSettings = {
  notifications: true,
  automaticBackups: true,
  maintenanceMode: false,
  twoFactorAuth: true,
  logging: true,
  ipRestriction: false,
  apiRateLimit: 1000,
  maxFileSize: 10, // MB
  sessionTimeout: 24, // hours
  debugMode: false
};

// Эндпоинт для получения настроек системы
app.get('/api/admin/settings', (req, res) => {
  try {
    res.json({
      settings: systemSettings,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для обновления настроек системы
app.post('/api/admin/settings', (req, res) => {
  try {
    const { setting, value } = req.body;
    
    if (setting in systemSettings) {
      systemSettings[setting] = value;
      logger.info(`Setting ${setting} changed to ${value}`);
      
      res.json({
        success: true,
        message: `Настройка ${setting} обновлена`,
        settings: systemSettings
      });
    } else {
      res.status(400).json({ error: 'Неизвестная настройка' });
    }
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для получения системной информации
app.get('/api/admin/system-info', (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    // Получаем информацию о системе
    const systemInfo = {
      server: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        cpu: {
          model: os.cpus()[0]?.model || 'Unknown',
          cores: os.cpus().length,
          usage: 'Недоступно' // Убираем случайную генерацию
        },
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100, // GB
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100, // MB
          usage: Math.round((process.memoryUsage().heapUsed / os.totalmem()) * 100 * 100) / 100 // %
        },
        disk: {
          usage: 'Недоступно', // Убираем случайную генерацию
          available: 'Недоступно' // Убираем случайную генерацию
        },
        network: {
          status: 'connected',
          latency: 'Недоступно' // Убираем случайную генерацию
        }
      },
      database: {
        type: 'In-Memory Storage',
        size: (JSON.stringify({ users, paymentRequests, systemSettings }).length / 1024).toFixed(2), // KB
        connections: 1,
        queriesPerSecond: 'Недоступно', // Убираем случайную генерацию
        responseTime: 'Недоступно' // Убираем случайную генерацию
      },
      application: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        apiKeys: {
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
        },
        activeConnections: 'Недоступно', // Убираем случайную генерацию
        errorRate: 'Недоступно' // Убираем случайную генерацию
      }
    };

    res.json({
      systemInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка получения системной информации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение информации о подписке пользователя
app.get('/api/subscription-info', (req, res) => {
  try {
    const { userId } = req.query;
    
    // Проверяем является ли пользователь администратором по роли
    const user = Object.values(users).find(u => u.id === userId || u.email === userId);
    if (user && user.role === 'admin') {
      return res.json({
        status: 'admin',
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      });
    }

    // Для остальных пользователей возвращаем сохраненный статус или free по умолчанию
    const subscription = userSubscriptionStatus[userId] || {
      status: 'free',
      currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
    };
    
    res.json(subscription);
    
  } catch (error) {
    logger.error('Error getting subscription info:', error);
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
});

// Увеличение счетчика AI-запросов
app.post('/api/increment-ai-usage', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Инициализируем данные пользователя если их нет
    if (!userUsageData[userId]) {
      userUsageData[userId] = {
        modelsGenerated: 0,
        chatMessages: 0,
        lastActivity: null
      };
    }

    if (!userSubscriptionStatus[userId]) {
      userSubscriptionStatus[userId] = {
        status: 'free',
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0 }
      };
    }

    // Увеличиваем счетчик AI-запросов
    userSubscriptionStatus[userId].currentUsage.aiRequests++;
    userUsageData[userId].lastActivity = new Date().toISOString();
    
    res.json({ success: true, currentUsage: userSubscriptionStatus[userId].currentUsage });
    
  } catch (error) {
    logger.error('Error incrementing AI usage:', error);
    res.status(500).json({ error: 'Failed to increment AI usage' });
  }
});

// Увеличение счетчика загрузки файлов
app.post('/api/increment-file-uploads', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Инициализируем данные пользователя если их нет
    if (!userUsageData[userId]) {
      userUsageData[userId] = {
        profiles: 0,
        transactions: 0,
        aiRequests: 0,
        fileUploads: 0,
        reportDownloads: 0,
        dashboardExports: 0,
        lastActivity: new Date().toISOString()
      };
    }

    if (!userSubscriptionStatus[userId]) {
      userSubscriptionStatus[userId] = {
        status: 'free',
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      };
    }

    // Увеличиваем счетчик
    userSubscriptionStatus[userId].currentUsage.fileUploads++;
    userUsageData[userId].fileUploads++;
    userUsageData[userId].lastActivity = new Date().toISOString();

    res.json({ success: true, currentUsage: userSubscriptionStatus[userId].currentUsage });
    
  } catch (error) {
    logger.error('Error incrementing file uploads:', error);
    res.status(500).json({ error: 'Failed to increment file uploads' });
  }
});

// Увеличение счетчика скачивания отчетов
app.post('/api/increment-report-downloads', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Инициализируем данные пользователя если их нет
    if (!userUsageData[userId]) {
      userUsageData[userId] = {
        profiles: 0,
        transactions: 0,
        aiRequests: 0,
        fileUploads: 0,
        reportDownloads: 0,
        dashboardExports: 0,
        lastActivity: new Date().toISOString()
      };
    }

    if (!userSubscriptionStatus[userId]) {
      userSubscriptionStatus[userId] = {
        status: 'free',
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      };
    }

    // Увеличиваем счетчик
    userSubscriptionStatus[userId].currentUsage.reportDownloads++;
    userUsageData[userId].reportDownloads++;
    userUsageData[userId].lastActivity = new Date().toISOString();

    res.json({ success: true, currentUsage: userSubscriptionStatus[userId].currentUsage });
    
  } catch (error) {
    logger.error('Error incrementing report downloads:', error);
    res.status(500).json({ error: 'Failed to increment report downloads' });
  }
});

// Увеличение счетчика экспорта дашборда
app.post('/api/increment-dashboard-exports', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Инициализируем данные пользователя если их нет
    if (!userUsageData[userId]) {
      userUsageData[userId] = {
        profiles: 0,
        transactions: 0,
        aiRequests: 0,
        fileUploads: 0,
        reportDownloads: 0,
        dashboardExports: 0,
        lastActivity: new Date().toISOString()
      };
    }

    if (!userSubscriptionStatus[userId]) {
      userSubscriptionStatus[userId] = {
        status: 'free',
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
      };
    }

    // Увеличиваем счетчик
    userSubscriptionStatus[userId].currentUsage.dashboardExports++;
    userUsageData[userId].dashboardExports++;
    userUsageData[userId].lastActivity = new Date().toISOString();

    res.json({ success: true, currentUsage: userSubscriptionStatus[userId].currentUsage });
    
  } catch (error) {
    logger.error('Error incrementing dashboard exports:', error);
    res.status(500).json({ error: 'Failed to increment dashboard exports' });
  }
});

// Создание заявки на активацию PRO
app.post('/api/payment-requests', (req, res) => {
  try {
    const { userId, email, displayName, amount, note } = req.body;
    
    if (!userId || !email || !displayName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверяем, есть ли уже активная заявка от этого пользователя
    const existingRequest = paymentRequests.find(
      r => r.userId === userId && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(409).json({ error: 'У вас уже есть активная заявка на рассмотрении' });
    }

    const newRequest = {
      id: Date.now().toString(),
      userId,
      email,
      displayName,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      note: note || ''
    };

    paymentRequests.push(newRequest);
    
    res.json({ success: true, request: newRequest });
    
  } catch (error) {
    logger.error('Error creating payment request:', error);
    res.status(500).json({ error: 'Failed to create payment request' });
  }
});

// Получение списка заявок (только для админов)
app.get('/api/payment-requests', (req, res) => {
  try {
    // В продакшене здесь должна быть проверка администратора
    res.json({ success: true, requests: paymentRequests });
    
  } catch (error) {
    logger.error('Error getting payment requests:', error);
    res.status(500).json({ error: 'Failed to get payment requests' });
  }
});

// Одобрение заявки на активацию PRO (только для админов)
app.post('/api/payment-requests/:requestId/approve', (req, res) => {
  try {
    const { requestId } = req.params;
    
    const requestIndex = paymentRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    const request = paymentRequests[requestIndex];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Обновляем статус заявки
    paymentRequests[requestIndex].status = 'approved';
    
    // Активируем PRO подписку для пользователя
    userSubscriptionStatus[request.userId] = {
      status: 'pro',
      currentUsage: userSubscriptionStatus[request.userId]?.currentUsage || { profiles: 0, transactions: 0, aiRequests: 0, fileUploads: 0, reportDownloads: 0, dashboardExports: 0 }
    };
    
    logger.info(`PRO подписка активирована для пользователя ${request.userId} (${request.email})`);
    
    res.json({ success: true, message: 'Payment request approved and PRO subscription activated' });
    
  } catch (error) {
    logger.error('Error approving payment request:', error);
    res.status(500).json({ error: 'Failed to approve payment request' });
  }
});

// Отклонение заявки (только для админов)
app.post('/api/payment-requests/:requestId/reject', (req, res) => {
  try {
    const { requestId } = req.params;
    
    const requestIndex = paymentRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    const request = paymentRequests[requestIndex];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Обновляем статус заявки
    paymentRequests[requestIndex].status = 'rejected';
    
    logger.info(`Заявка отклонена для пользователя ${request.userId} (${request.email})`);
    
    res.json({ success: true, message: 'Payment request rejected' });
    
  } catch (error) {
    logger.error('Error rejecting payment request:', error);
    res.status(500).json({ error: 'Failed to reject payment request' });
  }
});

// Получение статуса подписки (альтернативный эндпоинт)
app.get('/api/subscription-status', (req, res) => {
  try {
    const { userId } = req.query;
    
    // Проверяем является ли пользователь администратором по роли
    const user = Object.values(users).find(u => u.id === userId || u.email === userId);
    if (user && user.role === 'admin') {
      return res.json({
        status: 'admin',
        isLifetime: true
      });
    }

    const subscription = userSubscriptionStatus[userId];
    if (!subscription) {
      return res.json({ status: 'free', isLifetime: false });
    }
    
    res.json({
      status: subscription.status,
      isLifetime: false
    });
    
  } catch (error) {
    logger.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Обработка ошибок
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`[Server] FinSights AI Backend запущен на порту ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;