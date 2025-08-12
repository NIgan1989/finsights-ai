/**
 * Модуль для безопасной валидации и выполнения формул
 * Заменяет небезопасное использование Function() конструктора
 */

class FormulaValidator {
  constructor() {
    // Разрешенные функции
    this.allowedFunctions = new Set([
      'SUM', 'AVERAGE', 'MAX', 'MIN', 'IF', 'COUNT', 'ROUND',
      'ABS', 'SQRT', 'POW', 'LOG', 'EXP', 'FLOOR', 'CEIL'
    ]);
    
    // Разрешенные операторы
    this.allowedOperators = /^[+\-*/()\s\d.,A-Z:!]+$/i;
    
    // Паттерны для проверки безопасности
    this.dangerousPatterns = [
      /eval/i,
      /function/i,
      /script/i,
      /alert/i,
      /document/i,
      /window/i,
      /process/i,
      /require/i,
      /import/i,
      /export/i,
      /console/i,
      /setTimeout/i,
      /setInterval/i,
      /XMLHttpRequest/i,
      /fetch/i
    ];
  }
  
  /**
   * Валидирует формулу на безопасность
   * @param {string} formula - Формула для валидации
   * @returns {Object} - Результат валидации
   */
  validateFormula(formula) {
    const errors = [];
    
    if (!formula || typeof formula !== 'string') {
      errors.push('Формула должна быть строкой');
      return { isValid: false, errors };
    }
    
    // Проверка на опасные паттерны
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(formula)) {
        errors.push(`Формула содержит недопустимую конструкцию: ${pattern.source}`);
      }
    }
    
    // Проверка на разрешенные символы
    if (!this.allowedOperators.test(formula)) {
      errors.push('Формула содержит недопустимые символы');
    }
    
    // Проверка функций
    const functionMatches = formula.match(/([A-Z]+)\s*\(/gi);
    if (functionMatches) {
      for (const match of functionMatches) {
        const funcName = match.replace(/\s*\(/, '').toUpperCase();
        if (!this.allowedFunctions.has(funcName)) {
          errors.push(`Недопустимая функция: ${funcName}`);
        }
      }
    }
    
    // Проверка на сбалансированность скобок
    const openBrackets = (formula.match(/\(/g) || []).length;
    const closeBrackets = (formula.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Несбалансированные скобки в формуле');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Безопасно выполняет математическое выражение
   * @param {string} expression - Математическое выражение
   * @returns {number|string} - Результат вычисления или ошибка
   */
  safeEvaluate(expression) {
    try {
      // Удаляем все кроме чисел, операторов и скобок
      const sanitized = expression.replace(/[^0-9+\-*/.()\s]/g, '');
      
      // Проверяем, что выражение не пустое
      if (!sanitized.trim()) {
        return '#ERROR: Пустое выражение';
      }
      
      // Используем более безопасный способ вычисления
      const result = this.evaluateExpression(sanitized);
      
      // Проверяем результат на валидность
      if (isNaN(result) || !isFinite(result)) {
        return '#ERROR: Некорректный результат';
      }
      
      return result;
    } catch (error) {
      return `#ERROR: ${error.message}`;
    }
  }
  
  /**
   * Вычисляет математическое выражение без использования eval
   * @param {string} expr - Выражение для вычисления
   * @returns {number} - Результат
   */
  evaluateExpression(expr) {
    // Простой парсер математических выражений
    // Поддерживает +, -, *, /, () и числа
    
    const tokens = this.tokenize(expr);
    return this.parseExpression(tokens);
  }
  
  /**
   * Разбивает выражение на токены
   * @param {string} expr - Выражение
   * @returns {Array} - Массив токенов
   */
  tokenize(expr) {
    const tokens = [];
    let current = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      
      if (/\d|\./.test(char)) {
        current += char;
      } else if (/[+\-*/()]/.test(char)) {
        if (current) {
          tokens.push(parseFloat(current));
          current = '';
        }
        tokens.push(char);
      } else if (char === ' ') {
        if (current) {
          tokens.push(parseFloat(current));
          current = '';
        }
      }
    }
    
    if (current) {
      tokens.push(parseFloat(current));
    }
    
    return tokens;
  }
  
  /**
   * Парсит и вычисляет выражение
   * @param {Array} tokens - Токены
   * @returns {number} - Результат
   */
  parseExpression(tokens) {
    let index = 0;
    
    const parseNumber = () => {
      if (tokens[index] === '(') {
        index++; // skip '('
        const result = parseAddSub();
        index++; // skip ')'
        return result;
      }
      return tokens[index++];
    };
    
    const parseMulDiv = () => {
      let result = parseNumber();
      
      while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
        const operator = tokens[index++];
        const right = parseNumber();
        
        if (operator === '*') {
          result *= right;
        } else {
          if (right === 0) {
            throw new Error('Деление на ноль');
          }
          result /= right;
        }
      }
      
      return result;
    };
    
    const parseAddSub = () => {
      let result = parseMulDiv();
      
      while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
        const operator = tokens[index++];
        const right = parseMulDiv();
        
        if (operator === '+') {
          result += right;
        } else {
          result -= right;
        }
      }
      
      return result;
    };
    
    return parseAddSub();
  }
  
  /**
   * Проверяет ссылку на ячейку
   * @param {string} cellRef - Ссылка на ячейку (например, A1, B2)
   * @returns {boolean} - Валидна ли ссылка
   */
  isValidCellReference(cellRef) {
    const cellPattern = /^[A-Z]+\d+$/i;
    return cellPattern.test(cellRef);
  }
  
  /**
   * Проверяет диапазон ячеек
   * @param {string} range - Диапазон (например, A1:B5)
   * @returns {boolean} - Валиден ли диапазон
   */
  isValidRange(range) {
    const rangePattern = /^[A-Z]+\d+:[A-Z]+\d+$/i;
    return rangePattern.test(range);
  }
}

module.exports = FormulaValidator;
