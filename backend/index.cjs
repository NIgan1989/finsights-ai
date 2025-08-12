const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Импортируем модули
const { router: authRoutes } = require('./routes/auth');
const openaiRoutes = require('./routes/openai');
const financialModelRoutes = require('./routes/financialModel');
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

// Простое хранилище пользователей (в продакшене заменить на базу данных)
const users = {
  'admin': {
    id: 'admin-user',
    email: 'admin@finsights.ai',
    displayName: 'Администратор',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    role: 'admin',
    photoUrl: null
  },
  'demo': {
    id: 'demo-user',
    email: 'demo@finsights.ai',
    displayName: 'Demo User',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    role: 'user',
    photoUrl: null
  }
};

const userSubscriptionStatus = {};
const userUsageData = {};

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