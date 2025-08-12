/**
 * Улучшенная система логирования для финансового приложения
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
    
    // Уровни логирования
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = process.env.LOG_LEVEL || 'INFO';
  }
  
  /**
   * Создает директорию для логов если она не существует
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Форматирует сообщение лога
   * @param {string} level - Уровень лога
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   * @returns {string} - Отформатированное сообщение
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }
  
  /**
   * Записывает лог в файл
   * @param {string} level - Уровень лога
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   */
  writeToFile(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    try {
      fs.appendFileSync(filepath, formattedMessage + '\n');
    } catch (error) {
      console.error('Ошибка записи в лог файл:', error);
    }
  }
  
  /**
   * Проверяет, нужно ли логировать сообщение данного уровня
   * @param {string} level - Уровень сообщения
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.currentLevel];
  }
  
  /**
   * Логирует ошибку
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   */
  error(message, meta = {}) {
    if (this.shouldLog('ERROR')) {
      console.error(`❌ ${message}`, meta);
      this.writeToFile('ERROR', message, meta);
    }
  }
  
  /**
   * Логирует предупреждение
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   */
  warn(message, meta = {}) {
    if (this.shouldLog('WARN')) {
      console.warn(`⚠️ ${message}`, meta);
      this.writeToFile('WARN', message, meta);
    }
  }
  
  /**
   * Логирует информационное сообщение
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   */
  info(message, meta = {}) {
    if (this.shouldLog('INFO')) {
      console.log(`ℹ️ ${message}`, meta);
      this.writeToFile('INFO', message, meta);
    }
  }
  
  /**
   * Логирует отладочное сообщение
   * @param {string} message - Сообщение
   * @param {Object} meta - Дополнительные данные
   */
  debug(message, meta = {}) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🐛 ${message}`, meta);
      this.writeToFile('DEBUG', message, meta);
    }
  }
  
  /**
   * Логирует HTTP запрос
   * @param {Object} req - Express request объект
   * @param {Object} res - Express response объект
   * @param {number} duration - Время выполнения в мс
   */
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    };
    
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`;
    
    if (level === 'WARN') {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }
  
  /**
   * Логирует операцию с финансовой моделью
   * @param {string} operation - Тип операции
   * @param {string} modelId - ID модели
   * @param {string} userId - ID пользователя
   * @param {Object} details - Детали операции
   */
  logModelOperation(operation, modelId, userId, details = {}) {
    const meta = {
      operation,
      modelId,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    this.info(`Операция с моделью: ${operation}`, meta);
  }
  
  /**
   * Логирует ошибку валидации
   * @param {string} field - Поле с ошибкой
   * @param {string} value - Значение
   * @param {string} error - Описание ошибки
   * @param {Object} context - Контекст
   */
  logValidationError(field, value, error, context = {}) {
    const meta = {
      field,
      value: typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value,
      error,
      ...context
    };
    
    this.warn(`Ошибка валидации поля ${field}: ${error}`, meta);
  }
  
  /**
   * Логирует безопасность события
   * @param {string} event - Тип события
   * @param {string} userId - ID пользователя
   * @param {Object} details - Детали
   */
  logSecurityEvent(event, userId, details = {}) {
    const meta = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      ...details
    };
    
    this.warn(`Событие безопасности: ${event}`, meta);
  }
  
  /**
   * Логирует производительность
   * @param {string} operation - Операция
   * @param {number} duration - Время выполнения
   * @param {Object} context - Контекст
   */
  logPerformance(operation, duration, context = {}) {
    const meta = {
      operation,
      duration: `${duration}ms`,
      ...context
    };
    
    const level = duration > 5000 ? 'WARN' : 'INFO';
    const message = `Производительность: ${operation} выполнена за ${duration}ms`;
    
    if (level === 'WARN') {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }
  
  /**
   * Очищает старые лог файлы
   * @param {number} daysToKeep - Количество дней для хранения
   */
  cleanOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      files.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.info(`Удален старый лог файл: ${file}`);
          }
        }
      });
    } catch (error) {
      this.error('Ошибка очистки старых логов', { error: error.message });
    }
  }
}

// Создаем единственный экземпляр логгера
const logger = new Logger();

// Очищаем старые логи при запуске
logger.cleanOldLogs();

module.exports = logger;
