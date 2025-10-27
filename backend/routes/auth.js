const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Простое хранилище пользователей (в продакшене заменить на базу данных)
const users = {
  // Дефолтный админ (обновлено под ваши данные)
  'admin': {
    id: 'admin-user',
    email: 'Dulat280489@gmail.com',
    displayName: 'Администратор',
    password: 'Malika2015', // password: Malika2015 (bcrypt)
    role: 'admin',
    photoUrl: null
  }
};

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

// Регистрация
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
    
    // Проверяем пароль (поддержка как bcrypt-хеша, так и простого текста в dev)
    let isValidPassword;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      // Похоже на bcrypt-хеш
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Обычное сравнение для dev-настроек
      isValidPassword = password === user.password;
    }
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
router.get('/me', (req, res) => {
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
router.post('/logout', (req, res) => {
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
router.get('/demo', (req, res) => {
  console.log('[Server] Demo auth request');
  // Отключено по требованию: демо режим не используется
  return res.status(403).json({ error: 'Демо режим отключен' });
});

// Быстрый вход для админа (можно убрать в продакшене)
router.get('/admin', (req, res) => {
  console.log('[Server] Admin auth request');
  req.session.userId = 'admin-user';
  res.redirect('http://localhost:5173/dashboard');
});

module.exports = { router, authenticateToken, users };
