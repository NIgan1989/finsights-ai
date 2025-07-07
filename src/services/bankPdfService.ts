import { Transaction } from '../types';

// Устанавливаем PDF.js worker
const pdfjsLib = (window as any).pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface BankPdfParseResult {
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[];
  bankType: 'kaspi' | 'halyk' | 'unknown';
  extractedText: string;
  debugInfo?: string;
}

// Общие утилиты для обработки дат и сумм
const utils = {
  /**
   * Улучшенная функция парсинга дат с поддержкой различных форматов
   */
  parseDate(dateStr: string): string | null {
    // Проверка входных данных
    if (!dateStr || typeof dateStr !== 'string') {
      console.warn('parseDate: Получена пустая или некорректная строка даты');
      return null;
    }

    // Очистка строки от лишних символов
    const cleanDateStr = dateStr.trim().replace(/\s+/g, ' ');
    console.log(`parseDate: Обработка даты "${cleanDateStr}"`);

    // Попытка определить формат даты
    let day: string, month: string, year: string;
    let dateObj: Date | null = null;

    // Список поддерживаемых форматов дат с регулярными выражениями
    const dateFormats = [
      // ДД.ММ.ГГГГ
      {
        regex: /^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/,
        handler: (matches: RegExpMatchArray) => {
          [, day, month, year] = matches;
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      },
      // ГГГГ.ММ.ДД
      {
        regex: /^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})$/,
        handler: (matches: RegExpMatchArray) => {
          [, year, month, day] = matches;
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      },
      // ДД.ММ.ГГ
      {
        regex: /^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2})$/,
        handler: (matches: RegExpMatchArray) => {
          [, day, month, year] = matches;
          // Преобразование двузначного года в четырехзначный
          const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      },
      // Месяц словом: 15 янв 2023, 15 января 2023
      {
        regex: /^(\d{1,2})\s+([а-яА-Яa-zA-Z]{3,})\s+(\d{4})$/i,
        handler: (matches: RegExpMatchArray) => {
          [, day, month, year] = matches;
          // Преобразование названия месяца в номер
          const monthMappings = [
            { name: 'янв', number: 1 },
            { name: 'фев', number: 2 },
            { name: 'мар', number: 3 },
            { name: 'апр', number: 4 },
            { name: 'май', number: 5 },
            { name: 'июн', number: 6 },
            { name: 'июл', number: 7 },
            { name: 'авг', number: 8 },
            { name: 'сен', number: 9 },
            { name: 'окт', number: 10 },
            { name: 'ноя', number: 11 },
            { name: 'дек', number: 12 },
            { name: 'января', number: 1 },
            { name: 'февраля', number: 2 },
            { name: 'марта', number: 3 },
            { name: 'апреля', number: 4 },
            { name: 'мая', number: 5 },
            { name: 'июня', number: 6 },
            { name: 'июля', number: 7 },
            { name: 'августа', number: 8 },
            { name: 'сентября', number: 9 },
            { name: 'октября', number: 10 },
            { name: 'ноября', number: 11 },
            { name: 'декабря', number: 12 },
            { name: 'jan', number: 1 },
            { name: 'feb', number: 2 },
            { name: 'mar', number: 3 },
            { name: 'apr', number: 4 },
            { name: 'may', number: 5 },
            { name: 'jun', number: 6 },
            { name: 'jul', number: 7 },
            { name: 'aug', number: 8 },
            { name: 'sep', number: 9 },
            { name: 'oct', number: 10 },
            { name: 'nov', number: 11 },
            { name: 'dec', number: 12 },
            { name: 'january', number: 1 },
            { name: 'february', number: 2 },
            { name: 'march', number: 3 },
            { name: 'april', number: 4 },
            { name: 'may', number: 5 },
            { name: 'june', number: 6 },
            { name: 'july', number: 7 },
            { name: 'august', number: 8 },
            { name: 'september', number: 9 },
            { name: 'october', number: 10 },
            { name: 'november', number: 11 },
            { name: 'december', number: 12 }
          ];

          const monthLower = month.toLowerCase();
          const foundMonth = monthMappings.find(m =>
            m.name === monthLower ||
            (monthLower.length >= 3 && m.name === monthLower.substring(0, 3))
          );

          if (!foundMonth) return null;

          const monthNumber = foundMonth.number;

          return new Date(`${year}-${monthNumber.toString().padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      },
      // ISO формат: YYYY-MM-DD
      {
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        handler: (matches: RegExpMatchArray) => {
          [, year, month, day] = matches;
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
    ];

    // Проходим по всем форматам и пытаемся распарсить дату
    for (const format of dateFormats) {
      const matches = cleanDateStr.match(format.regex);
      if (matches) {
        try {
          dateObj = format.handler(matches);
          if (dateObj && !isNaN(dateObj.getTime())) {
            console.log(`parseDate: Успешно распознана дата: ${dateObj.toISOString().split('T')[0]}`);
            break;
          }
        } catch (e) {
          console.warn(`parseDate: Ошибка при обработке формата: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    // Если не удалось распарсить дату ни одним из форматов, пробуем использовать стандартный парсер
    if (!dateObj || isNaN(dateObj.getTime())) {
      try {
        // Пробуем использовать стандартный парсер Date
        dateObj = new Date(cleanDateStr);
        if (!isNaN(dateObj.getTime())) {
          console.log(`parseDate: Дата распознана стандартным парсером: ${dateObj.toISOString().split('T')[0]}`);
        } else {
          console.warn(`parseDate: Не удалось распарсить дату: "${cleanDateStr}"`);
          return null;
        }
      } catch (e) {
        console.warn(`parseDate: Ошибка при использовании стандартного парсера: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
    }

    // Проверка на валидность даты (не в будущем и не слишком в прошлом)
    const now = new Date();
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 10); // Не старше 10 лет

    if (dateObj > now) {
      console.warn(`parseDate: Дата в будущем: ${dateObj.toISOString().split('T')[0]}`);
      // Но всё равно возвращаем дату, так как это может быть плановый платеж
    }

    if (dateObj < minDate) {
      console.warn(`parseDate: Дата слишком старая: ${dateObj.toISOString().split('T')[0]}`);
      // Но всё равно возвращаем дату, так как это может быть исторический документ
    }

    // Возвращаем дату в формате ISO (YYYY-MM-DD)
    return dateObj.toISOString().split('T')[0];
  },

  /**
   * Улучшенная функция парсинга денежных сумм с поддержкой различных форматов
   */
  parseAmount(amountStr: string): { amount: number, isNegative: boolean } | null {
    if (!amountStr || typeof amountStr !== 'string') {
      console.warn('parseAmount: Получена пустая или некорректная строка суммы');
      return null;
    }

    // Сохраняем оригинальную строку для логирования
    const originalStr = amountStr;
    console.log(`parseAmount: Обработка суммы "${originalStr}"`);

    try {
      // Определяем знак суммы до очистки строки
      const hasMinusPrefix = amountStr.trim().startsWith('-');
      const hasPlusPrefix = amountStr.trim().startsWith('+');
      const hasMinusInside = amountStr.includes('-') && !hasMinusPrefix;

      // Проверка на наличие скобок (часто используются для обозначения отрицательных сумм)
      const hasBrackets = /^\(.*\)$/.test(amountStr.trim());

      // Очистка строки суммы от нецифровых символов, кроме разделителей
      let cleanAmountStr = amountStr
        .replace(/[\(\)]/g, '') // Удаляем скобки
        .replace(/\s+/g, '') // Убираем пробелы
        .replace(/[^\d\+\-,\.]/g, ''); // Оставляем только цифры, знаки и разделители

      // Обрабатываем различные форматы разделителей
      // Если есть и точка, и запятая, определяем, что является разделителем десятичной части
      if (cleanAmountStr.includes(',') && cleanAmountStr.includes('.')) {
        // Если запятая находится правее точки, то запятая - разделитель десятичной части
        if (cleanAmountStr.lastIndexOf(',') > cleanAmountStr.lastIndexOf('.')) {
          // Убираем все точки и заменяем запятую на точку
          cleanAmountStr = cleanAmountStr.replace(/\./g, '').replace(',', '.');
        } else {
          // Убираем все запятые
          cleanAmountStr = cleanAmountStr.replace(/,/g, '');
        }
      } else {
        // Если есть только запятая, заменяем её на точку
        cleanAmountStr = cleanAmountStr.replace(/,/g, '.');
      }

      // Удаляем знаки плюс/минус из строки для корректного парсинга
      cleanAmountStr = cleanAmountStr.replace(/[\+\-]/g, '');

      // Парсинг суммы
      const amount = parseFloat(cleanAmountStr);
      if (isNaN(amount)) {
        console.warn(`parseAmount: Не удалось преобразовать в число: "${originalStr}" -> "${cleanAmountStr}"`);
        return null;
      }

      // Определяем знак суммы на основе префикса, скобок или контекста
      let isNegative = hasMinusPrefix || hasMinusInside || hasBrackets;

      // Если есть явный плюс, то это доход
      if (hasPlusPrefix) {
        isNegative = false;
      }

      console.log(`parseAmount: Успешно распознана сумма: ${amount}, isNegative: ${isNegative}`);
      return {
        amount: amount,
        isNegative: isNegative
      };
    } catch (error) {
      console.error(`parseAmount: Ошибка при парсинге суммы "${originalStr}":`, error);
      return null;
    }
  },

  /**
   * Улучшенная функция определения типа транзакции на основе описания и знака суммы
   */
  determineTransactionType(description: string, isNegative: boolean): 'income' | 'expense' {
    if (!description) {
      // Если нет описания, полагаемся только на знак
      return isNegative ? 'expense' : 'income';
    }

    const lowerDesc = description.toLowerCase();

    // Расширенный список ключевых слов для доходов
    const incomeKeywords = [
      // Русские ключевые слова
      'пополнение', 'поступление', 'зарплата', 'перевод на счет', 'перевод на карту',
      'возврат', 'доход', 'аванс', 'стипендия', 'пенсия', 'пособие', 'выплата',
      'зачисление', 'кэшбэк', 'кэшбек', 'cashback', 'бонус', 'дивиденд', 'процент',
      'возмещение', 'компенсация', 'приход', 'заработная плата', 'гонорар',
      'получение', 'поступило', 'зачислено', 'приз', 'награда', 'подарок',

      // Английские ключевые слова
      'payment received', 'salary', 'deposit', 'refund', 'income', 'transfer in',
      'credit', 'bonus', 'dividend', 'interest', 'compensation', 'reimbursement',
      'received', 'credited', 'paycheck', 'reward', 'gift'
    ];

    // Расширенный список ключевых слов для расходов
    const expenseKeywords = [
      // Русские ключевые слова
      'покупка', 'оплата', 'платеж', 'списание', 'перевод', 'снятие', 'комиссия',
      'налог', 'штраф', 'абонентская плата', 'подписка', 'счет', 'кредит',
      'расход', 'плата', 'услуга', 'товар', 'магазин', 'аренда', 'счет',
      'обслуживание', 'страхование', 'погашение', 'выплата по кредиту',

      // Английские ключевые слова
      'purchase', 'payment', 'withdrawal', 'fee', 'tax', 'charge', 'subscription',
      'bill', 'loan', 'expense', 'service', 'store', 'rent', 'insurance',
      'debit', 'paid', 'transfer out', 'deducted', 'expense'
    ];

    // Проверка на ключевые слова доходов
    for (const keyword of incomeKeywords) {
      if (lowerDesc.includes(keyword)) {
        // Если описание содержит ключевое слово дохода, но сумма отрицательная,
        // проверяем, нет ли в описании также ключевых слов расходов
        if (isNegative) {
          const hasExpenseKeyword = expenseKeywords.some(expKeyword => lowerDesc.includes(expKeyword));
          if (!hasExpenseKeyword) {
            console.log(`determineTransactionType: Обнаружено несоответствие - описание содержит ключевое слово дохода "${keyword}", но сумма отрицательная`);
          }
        }
        return 'income';
      }
    }

    // Проверка на ключевые слова расходов
    for (const keyword of expenseKeywords) {
      if (lowerDesc.includes(keyword)) {
        // Если описание содержит ключевое слово расхода, но сумма положительная,
        // проверяем, нет ли в описании также ключевых слов доходов
        if (!isNegative) {
          const hasIncomeKeyword = incomeKeywords.some(incKeyword => lowerDesc.includes(incKeyword));
          if (!hasIncomeKeyword) {
            console.log(`determineTransactionType: Обнаружено несоответствие - описание содержит ключевое слово расхода "${keyword}", но сумма положительная`);
          }
        }
        return 'expense';
      }
    }

    // Если не нашли ключевых слов, полагаемся на знак суммы
    console.log(`determineTransactionType: Не найдено ключевых слов в описании "${description}", определяем тип по знаку суммы: ${isNegative ? 'expense' : 'income'}`);
    return isNegative ? 'expense' : 'income';
  },

  /**
   * Улучшенная функция очистки описания транзакции
   */
  cleanDescription(description: string): string {
    if (!description) return '';

    // Сохраняем оригинальное описание для логирования
    const originalDesc = description;

    try {
      // Удаляем лишние пробелы
      let cleanDesc = description.trim().replace(/\s+/g, ' ');

      // Удаляем служебные префиксы и суффиксы
      const prefixesToRemove = [
        'Покупка:', 'Оплата:', 'Перевод:', 'Пополнение:', 'Снятие:',
        'Purchase:', 'Payment:', 'Transfer:', 'Deposit:', 'Withdrawal:',
        'Операция:', 'Transaction:', 'Ref:', 'ID:'
      ];

      for (const prefix of prefixesToRemove) {
        if (cleanDesc.startsWith(prefix)) {
          cleanDesc = cleanDesc.substring(prefix.length).trim();
        }
      }

      // Удаляем номера карт и счетов (для безопасности)
      cleanDesc = cleanDesc
        .replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX') // 16-значные номера карт
        .replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, 'XXXX-XXXX-XXXX') // 12-значные номера
        .replace(/\b\d{10,20}\b/g, 'НОМЕР'); // Длинные числовые последовательности (вероятно номера счетов)

      // Удаляем специфичные для банков суффиксы
      const suffixesToRemove = [
        'Спасибо за покупку', 'Thank you for your purchase',
        'С уважением', 'Sincerely', 'Best regards',
        'Kaspi Bank', 'Halyk Bank', 'Народный Банк'
      ];

      for (const suffix of suffixesToRemove) {
        if (cleanDesc.endsWith(suffix)) {
          cleanDesc = cleanDesc.substring(0, cleanDesc.length - suffix.length).trim();
        }
      }

      // Удаляем даты из описания, так как они уже есть в отдельном поле
      cleanDesc = cleanDesc.replace(/\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}\b/g, '').trim();

      // Удаляем повторяющиеся знаки препинания
      cleanDesc = cleanDesc.replace(/[\.,:;!?]{2,}/g, '.').trim();

      // Удаляем лишние пробелы после очистки
      cleanDesc = cleanDesc.trim().replace(/\s+/g, ' ');

      // Если описание стало слишком коротким, возвращаем оригинальное
      if (cleanDesc.length < 3) {
        console.log(`cleanDescription: Описание стало слишком коротким после очистки, возвращаем оригинальное: "${originalDesc}"`);
        return originalDesc;
      }

      // Если описание сильно изменилось, логируем это
      if (cleanDesc.length < originalDesc.length * 0.5) {
        console.log(`cleanDescription: Значительное сокращение описания: "${originalDesc}" -> "${cleanDesc}"`);
      }

      return cleanDesc;
    } catch (error) {
      console.error(`cleanDescription: Ошибка при очистке описания "${originalDesc}":`, error);
      return originalDesc; // В случае ошибки возвращаем оригинальное описание
    }
  }
};

/**
 * Определяет тип банка по содержимому PDF
 */
const detectBankType = (text: string): 'kaspi' | 'halyk' | 'unknown' => {
  const textLower = text.toLowerCase();

  if (textLower.includes('kaspi') || textLower.includes('каспи')) {
    return 'kaspi';
  }

  if (textLower.includes('halyk') || textLower.includes('халык') || textLower.includes('народный банк')) {
    return 'halyk';
  }

  return 'unknown';
};

/**
 * Улучшенная функция проверки содержимого на соответствие банковской выписке
 */
export const validateBankStatement = (text: string): boolean => {
  if (!text || typeof text !== 'string' || text.length < 100) {
    console.warn('validateBankStatement: Текст слишком короткий для банковской выписки');
    return false;
  }

  // Нормализуем текст для проверки
  const normalizedText = text.toLowerCase();

  // Ключевые слова, характерные для банковских выписок
  const bankStatementKeywords = [
    // Общие банковские термины
    'выписка', 'счет', 'карта', 'баланс', 'остаток', 'транзакция', 'операция',
    'перевод', 'платеж', 'комиссия', 'statement', 'account', 'card', 'balance',
    'transaction', 'transfer', 'payment', 'fee',

    // Специфичные для Kaspi Bank
    'kaspi', 'каспи', 'kaspi bank', 'каспи банк', 'kaspi gold', 'kaspi red',

    // Специфичные для Halyk Bank
    'halyk', 'халык', 'народный банк', 'halyk bank', 'homebank',

    // Финансовые термины
    'дебет', 'кредит', 'списание', 'зачисление', 'debit', 'credit',
    'withdrawal', 'deposit', 'поступление', 'снятие'
  ];

  // Паттерны дат, характерные для выписок
  const datePatterns = [
    /\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}/,  // DD.MM.YYYY, DD/MM/YYYY
    /\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2}/,    // YYYY.MM.DD, YYYY/MM/DD
    /\d{1,2}\s+[а-яА-Яa-zA-Z]{3,}\s+\d{4}/    // DD Month YYYY
  ];

  // Паттерны денежных сумм
  const amountPatterns = [
    /\d+[\s\,\.]\d{2}\s*(?:₸|тг|тенге|KZT)/i,  // 1 234,56 ₸
    /\d+[\s\,\.]\d{2}/                         // 1 234,56
  ];

  // Проверка на наличие ключевых слов
  const hasKeywords = bankStatementKeywords.some(keyword => normalizedText.includes(keyword));

  // Проверка на наличие дат
  const hasDates = datePatterns.some(pattern => pattern.test(normalizedText));

  // Проверка на наличие денежных сумм
  const hasAmounts = amountPatterns.some(pattern => pattern.test(normalizedText));

  // Проверка на наличие табличной структуры (строки с датами и суммами)
  const hasTableStructure = /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}).*?(\d+[\s\,\.]\d{2})/g.test(normalizedText);

  // Логируем результаты проверок
  console.log('validateBankStatement: Результаты проверок:', {
    hasKeywords,
    hasDates,
    hasAmounts,
    hasTableStructure,
    textLength: text.length
  });

  // Для положительного результата нужно наличие ключевых слов И (дат ИЛИ денежных сумм)
  const isValid = hasKeywords && (hasDates || hasAmounts);

  // Если есть табличная структура, это дополнительно подтверждает, что это выписка
  const result = isValid || hasTableStructure;

  console.log(`validateBankStatement: Текст ${result ? 'похож' : 'не похож'} на банковскую выписку`);
  return result;
};

/**
 * Улучшенный парсер для транзакций Каспи банка с расширенной поддержкой форматов
 */
const parseKaspiTransactions = (text: string): {
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[],
  debugInfo: string
} => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const debugLines: string[] = [];
  const lines = text.split('\n');

  debugLines.push(`Всего строк для анализа: ${lines.length}`);
  debugLines.push('--- Начинаем парсинг транзакций Каспи банка ---');

  // Предварительный анализ текста для определения формата выписки
  const hasTabularFormat = text.includes('Дата\tОписание\tСумма') ||
    text.includes('Date\tDescription\tAmount');
  const hasTableMarkers = text.match(/(\|\s*\d{1,2}\.\d{1,2}\.\d{4}\s*\|)/g);

  debugLines.push(`Определен формат выписки: ${hasTabularFormat ? 'табличный' : 'обычный'}${hasTableMarkers ? ' с разделителями' : ''}`);

  // Расширенные паттерны для строк с транзакциями в выписках Каспи
  const patterns = [
    // Основной формат: ДД.ММ.ГГГГ описание ±сумма ₸
    /^(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с временем: ДД.ММ.ГГГГ ЧЧ:ММ описание ±сумма ₸
    /^(\d{1,2}\.\d{1,2}\.\d{4})\s+\d{1,2}:\d{2}\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с разделением по столбцам или табуляцией
    /^(\d{1,2}\.\d{1,2}\.\d{4})(?:\s+|\t+)(.+?)(?:\s+|\t+)([\+\-]?\d[\d\s]*[,.]?\d{0,2})$/,

    // Формат с дополнительными символами и указанием валюты
    /(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s,\.]*)\s*(?:₸|тг|тенге|KZT|T)?\s*(?:Остаток|Balance|Итого|Total)?/i,

    // Формат с разделителями (вертикальная черта)
    /\|\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*\|\s*(.+?)\s*\|\s*([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*\|/,

    // Формат с годом в начале: ГГГГ.ММ.ДД
    /^(\d{4}\.\d{1,2}\.\d{1,2})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с датой в скобках
    /\((\d{1,2}\.\d{1,2}\.\d{4})\)\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i
  ];

  // Если обнаружен табличный формат, добавляем специальные паттерны
  if (hasTabularFormat) {
    patterns.push(
      // Табличный формат с табуляцией
      /^(\d{1,2}\.\d{1,2}\.\d{4})\t(.+?)\t([\+\-]?\d[\d\s]*[,.]?\d{0,2})/,

      // Табличный формат с пробелами и выравниванием
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s{2,}(.+?)\s{2,}([\+\-]?\d[\d\s]*[,.]?\d{0,2})/
    );
  }

  // Анализ строк и поиск транзакций
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue; // Игнорируем короткие строки

    // Пропускаем заголовки и служебные строки
    if (/^(?:Дата|Date|Время|Time|Описание|Description|Сумма|Amount|Баланс|Balance|Итого|Total)$/i.test(line)) {
      continue;
    }

    let matched = false;
    let matchData: { dateStr: string, description: string, amountStr: string } | null = null;

    // Проверяем все паттерны
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, description, amountStr] = match;
        matchData = { dateStr, description, amountStr };
        break;
      }
    }

    // Если не нашли соответствие ни одному паттерну, но строка содержит дату,
    // пробуем найти дату и сумму отдельно
    if (!matchData && line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
      // Ищем дату
      const dateMatch = line.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];

        // Ищем сумму (любое число с возможными разделителями)
        const amountMatch = line.match(/(\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?/i);
        if (amountMatch) {
          const amountStr = amountMatch[1];

          // Описание - всё, что между датой и суммой
          const datePos = line.indexOf(dateStr);
          const amountPos = line.indexOf(amountMatch[0], datePos + dateStr.length);

          if (amountPos > datePos) {
            const description = line.substring(datePos + dateStr.length, amountPos).trim();
            if (description) {
              matchData = { dateStr, description, amountStr };
            }
          }
        }
      }
    }

    // Обрабатываем найденные данные
    if (matchData) {
      const { dateStr, description, amountStr } = matchData;

      // Парсинг даты
      const isoDate = utils.parseDate(dateStr);
      if (!isoDate) {
        debugLines.push(`❌ Строка ${i + 1}: Некорректная дата "${dateStr}"`);
        continue;
      }

      // Парсинг суммы
      const parsedAmount = utils.parseAmount(amountStr);
      if (!parsedAmount) {
        debugLines.push(`❌ Строка ${i + 1}: Некорректная сумма "${amountStr}"`);
        continue;
      }

      const { amount, isNegative } = parsedAmount;

      // Определение типа транзакции
      const transactionType = utils.determineTransactionType(description, isNegative);

      // Очистка описания
      const cleanDescription = utils.cleanDescription(description);

      transactions.push({
        id: `kaspi_${Date.now()}_${transactions.length}`,
        date: isoDate,
        description: cleanDescription || 'Транзакция Каспи банка',
        amount: amount,
        type: transactionType,
      });

      debugLines.push(`✅ Строка ${i + 1}: ${dateStr} | ${cleanDescription} | ${amount} ₸ (${transactionType})`);
      matched = true;
    }

    if (!matched && line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
      debugLines.push(`⚠️ Строка ${i + 1}: Содержит дату, но не распознана: "${line}"`);
    }
  }

  // Если транзакций не найдено, пробуем альтернативный подход - объединение строк
  if (transactions.length === 0) {
    debugLines.push('Не найдено транзакций при стандартном анализе. Пробуем альтернативный подход...');

    // Объединяем соседние строки, которые могут быть разделены переносом
    let combinedText = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      // Если текущая строка содержит дату, но не содержит суммы,
      // а следующая строка не содержит даты, объединяем их
      if (line.match(/\d{1,2}\.\d{1,2}\.\d{4}/) &&
        !line.match(/\d{1,2}\.\d{1,2}\.\d{4}.*?\d+[,.]?\d{0,2}/) &&
        nextLine && !nextLine.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
        combinedText += line + ' ' + nextLine + '\n';
        i++; // Пропускаем следующую строку
      } else {
        combinedText += line + '\n';
      }
    }

    // Повторяем анализ с объединенным текстом
    const combinedResult = parseKaspiTransactions(combinedText);
    if (combinedResult.transactions.length > 0) {
      debugLines.push(`Найдено ${combinedResult.transactions.length} транзакций при альтернативном анализе.`);
      transactions.push(...combinedResult.transactions);
    }
  }

  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);

  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Улучшенный парсер для транзакций Халык банка с расширенной поддержкой форматов
 */
const parseHalykTransactions = (text: string): {
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[],
  debugInfo: string
} => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const debugLines: string[] = [];
  const lines = text.split('\n');

  debugLines.push(`Всего строк для анализа: ${lines.length}`);
  debugLines.push('--- Начинаем парсинг транзакций Халык банка ---');

  // Предварительный анализ текста для определения формата выписки
  const hasTabularFormat = text.includes('Дата\tОписание\tСумма') ||
    text.includes('Date\tDescription\tAmount');
  const hasTableMarkers = text.match(/(\|\s*\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}\s*\|)/g);

  debugLines.push(`Определен формат выписки: ${hasTabularFormat ? 'табличный' : 'обычный'}${hasTableMarkers ? ' с разделителями' : ''}`);

  // Расширенные паттерны для Халык банка
  const patterns = [
    // Основной формат с точками или слешами: ДД.ММ.ГГГГ или ДД/ММ/ГГГГ описание ±сумма
    /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с временем
    /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s+\d{1,2}:\d{2}\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с разделением по столбцам или табуляцией
    /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})(?:\s+|\t+)(.+?)(?:\s+|\t+)([\+\-]?\d[\d\s]*[,.]?\d{0,2})$/,

    // Формат с дополнительными символами и указанием валюты
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s,\.]*)\s*(?:₸|тг|тенге|KZT|T)?\s*(?:Остаток|Balance|Итого|Total)?/i,

    // Формат с разделителями (вертикальная черта)
    /\|\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s*\|\s*(.+?)\s*\|\s*([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*\|/,

    // Формат с годом в начале: ГГГГ.ММ.ДД или ГГГГ/ММ/ДД
    /^(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Формат с датой в скобках
    /\((\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\)\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?\s*$/i,

    // Халык-специфичный формат с номером транзакции
    /^(?:№|#)?\d+\s+(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?/i
  ];

  // Если обнаружен табличный формат, добавляем специальные паттерны
  if (hasTabularFormat) {
    patterns.push(
      // Табличный формат с табуляцией
      /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\t(.+?)\t([\+\-]?\d[\d\s]*[,.]?\d{0,2})/,

      // Табличный формат с пробелами и выравниванием
      /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})\s{2,}(.+?)\s{2,}([\+\-]?\d[\d\s]*[,.]?\d{0,2})/
    );
  }

  // Анализ строк и поиск транзакций
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue; // Игнорируем короткие строки

    // Пропускаем заголовки и служебные строки
    if (/^(?:Дата|Date|Время|Time|Описание|Description|Сумма|Amount|Баланс|Balance|Итого|Total)$/i.test(line)) {
      continue;
    }

    let matched = false;
    let matchData: { dateStr: string, description: string, amountStr: string } | null = null;

    // Проверяем все паттерны
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, description, amountStr] = match;
        matchData = { dateStr, description, amountStr };
        break;
      }
    }

    // Если не нашли соответствие ни одному паттерну, но строка содержит дату,
    // пробуем найти дату и сумму отдельно
    if (!matchData && line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/)) {
      // Ищем дату
      const dateMatch = line.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];

        // Ищем сумму (любое число с возможными разделителями)
        const amountMatch = line.match(/(\d[\d\s]*[,.]?\d{0,2})\s*(?:₸|тг|тенге|KZT)?/i);
        if (amountMatch) {
          const amountStr = amountMatch[1];

          // Описание - всё, что между датой и суммой
          const datePos = line.indexOf(dateStr);
          const amountPos = line.indexOf(amountMatch[0], datePos + dateStr.length);

          if (amountPos > datePos) {
            const description = line.substring(datePos + dateStr.length, amountPos).trim();
            if (description) {
              matchData = { dateStr, description, amountStr };
            }
          }
        }
      }
    }

    // Обрабатываем найденные данные
    if (matchData) {
      const { dateStr, description, amountStr } = matchData;

      // Парсинг даты
      const isoDate = utils.parseDate(dateStr);
      if (!isoDate) {
        debugLines.push(`❌ Строка ${i + 1}: Некорректная дата "${dateStr}"`);
        continue;
      }

      // Парсинг суммы
      const parsedAmount = utils.parseAmount(amountStr);
      if (!parsedAmount) {
        debugLines.push(`❌ Строка ${i + 1}: Некорректная сумма "${amountStr}"`);
        continue;
      }

      const { amount, isNegative } = parsedAmount;

      // Определение типа транзакции
      const transactionType = utils.determineTransactionType(description, isNegative);

      // Очистка описания
      const cleanDescription = utils.cleanDescription(description);

      transactions.push({
        id: `halyk_${Date.now()}_${transactions.length}`,
        date: isoDate,
        description: cleanDescription || 'Транзакция Халык банка',
        amount: amount,
        type: transactionType,
      });

      debugLines.push(`✅ Строка ${i + 1}: ${dateStr} | ${cleanDescription} | ${amount} ₸ (${transactionType})`);
      matched = true;
    }

    if (!matched && line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/)) {
      debugLines.push(`⚠️ Строка ${i + 1}: Содержит дату, но не распознана: "${line}"`);
    }
  }

  // Если транзакций не найдено, пробуем альтернативный подход - объединение строк
  if (transactions.length === 0) {
    debugLines.push('Не найдено транзакций при стандартном анализе. Пробуем альтернативный подход...');

    // Объединяем соседние строки, которые могут быть разделены переносом
    let combinedText = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      // Если текущая строка содержит дату, но не содержит суммы,
      // а следующая строка не содержит даты, объединяем их
      if (line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/) &&
        !line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}.*?\d+[,.]?\d{0,2}/) &&
        nextLine && !nextLine.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/)) {
        combinedText += line + ' ' + nextLine + '\n';
        i++; // Пропускаем следующую строку
      } else {
        combinedText += line + '\n';
      }
    }

    // Повторяем анализ с объединенным текстом
    const combinedResult = parseHalykTransactions(combinedText);
    if (combinedResult.transactions.length > 0) {
      debugLines.push(`Найдено ${combinedResult.transactions.length} транзакций при альтернативном анализе.`);
      transactions.push(...combinedResult.transactions);
    }
  }

  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);

  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Парсер для неизвестных форматов банковских выписок
 */
const parseGenericTransactions = (text: string): {
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[],
  debugInfo: string
} => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const debugLines: string[] = [];
  const lines = text.split('\n');

  debugLines.push(`Всего строк для анализа: ${lines.length}`);
  debugLines.push('--- Начинаем универсальный парсинг транзакций ---');

  // Сначала пробуем парсить с помощью Kaspi парсера
  const kaspiResult = parseKaspiTransactions(text);
  if (kaspiResult.transactions.length > 0) {
    debugLines.push(`Найдено ${kaspiResult.transactions.length} транзакций с помощью Kaspi парсера`);
    transactions.push(...kaspiResult.transactions);
    debugLines.push(kaspiResult.debugInfo);
    return { transactions, debugInfo: debugLines.join('\n') };
  }

  // Если не сработал Kaspi парсер, пробуем Halyk парсер
  const halykResult = parseHalykTransactions(text);
  if (halykResult.transactions.length > 0) {
    debugLines.push(`Найдено ${halykResult.transactions.length} транзакций с помощью Halyk парсера`);
    transactions.push(...halykResult.transactions);
    debugLines.push(halykResult.debugInfo);
    return { transactions, debugInfo: debugLines.join('\n') };
  }

  // Если оба парсера не сработали, используем универсальный алгоритм
  debugLines.push('Специфичные парсеры не сработали, используем универсальный алгоритм');

  // Универсальный алгоритм - ищем строки, содержащие дату и сумму
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue;

    // Поиск даты в строке
    const dateMatch = line.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})|(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/);
    if (!dateMatch) continue;

    const dateStr = dateMatch[0];

    // Поиск суммы в строке
    const amountMatch = line.match(/(\d[\d\s]*[,\.]\d{0,2})/);
    if (!amountMatch) continue;

    const amountStr = amountMatch[0];

    // Извлечение описания - всё между датой и суммой
    const datePos = line.indexOf(dateStr);
    const amountPos = line.indexOf(amountMatch[0], datePos + dateStr.length);

    let description = '';

    if (amountPos > datePos) {
      description = line.substring(datePos + dateStr.length, amountPos).trim();
    } else {
      // Если сумма идет перед датой или не можем определить порядок,
      // используем остаток строки после даты
      description = line.substring(datePos + dateStr.length).trim();
      // Удаляем сумму из описания, если она там есть
      description = description.replace(amountStr, '').trim();
    }

    // Если описание пустое, пробуем взять текст из следующей строки
    if (!description && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/)) {
        description = nextLine;
        i++; // Пропускаем следующую строку
      }
    }

    // Парсинг даты
    const isoDate = utils.parseDate(dateStr);
    if (!isoDate) {
      debugLines.push(`❌ Строка ${i + 1}: Некорректная дата "${dateStr}"`);
      continue;
    }

    // Парсинг суммы
    const parsedAmount = utils.parseAmount(amountStr);
    if (!parsedAmount) {
      debugLines.push(`❌ Строка ${i + 1}: Некорректная сумма "${amountStr}"`);
      continue;
    }

    const { amount, isNegative } = parsedAmount;

    // Определение типа транзакции
    const transactionType = utils.determineTransactionType(description, isNegative);

    // Очистка описания
    const cleanDescription = utils.cleanDescription(description);

    transactions.push({
      id: `generic_${Date.now()}_${transactions.length}`,
      date: isoDate,
      description: cleanDescription || 'Транзакция',
      amount: amount,
      type: transactionType,
    });

    debugLines.push(`✅ Строка ${i + 1}: ${dateStr} | ${cleanDescription} | ${amount} ₸ (${transactionType})`);
  }

  // Если не нашли транзакции, пробуем более агрессивный подход - объединение соседних строк
  if (transactions.length === 0) {
    debugLines.push('Не найдено транзакций при стандартном анализе. Пробуем объединение строк...');

    // Объединяем соседние строки
    let combinedText = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Если текущая строка содержит дату, объединяем её со следующей
      if (line.match(/\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}/) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine) {
          combinedText += line + ' ' + nextLine + '\n';
          i++; // Пропускаем следующую строку
        } else {
          combinedText += line + '\n';
        }
      } else {
        combinedText += line + '\n';
      }
    }

    // Повторяем анализ с объединенным текстом
    const combinedResult = parseGenericTransactions(combinedText);
    if (combinedResult.transactions.length > 0) {
      debugLines.push(`Найдено ${combinedResult.transactions.length} транзакций при альтернативном анализе.`);
      transactions.push(...combinedResult.transactions);
    }
  }

  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);

  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Улучшенная функция извлечения текста из PDF с учетом структуры таблиц
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    if (!pdfjsLib) {
      throw new Error('PDF.js не загружен. Пожалуйста, убедитесь, что библиотека подключена.');
    }

    // Проверяем, что файл существует и имеет правильный тип
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Неверный формат файла. Ожидается PDF.');
    }

    console.log('Начинаем извлечение текста из PDF файла:', file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Загружаем PDF документ
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (pdfError) {
      console.error('Ошибка при загрузке PDF документа:', pdfError);
      throw new Error(`Не удалось загрузить PDF документ: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
    }

    console.log(`PDF документ успешно загружен, страниц: ${pdf.numPages}`);
    let fullText = '';

    // Информация для отладки
    const debugInfo: string[] = [];
    debugInfo.push(`PDF содержит ${pdf.numPages} страниц`);

    // Обрабатываем каждую страницу
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Обработка страницы ${pageNum} из ${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);

      // Извлекаем текстовое содержимое страницы
      let textContent;
      try {
        textContent = await page.getTextContent({ normalizeWhitespace: true });
      } catch (textError) {
        console.error(`Ошибка при извлечении текста со страницы ${pageNum}:`, textError);
        debugInfo.push(`⚠️ Ошибка при извлечении текста со страницы ${pageNum}: ${textError instanceof Error ? textError.message : String(textError)}`);
        continue; // Продолжаем со следующей страницей
      }

      debugInfo.push(`Страница ${pageNum}: найдено ${textContent.items.length} текстовых элементов`);

      // Если на странице нет текстовых элементов, пробуем извлечь как изображение
      if (textContent.items.length === 0) {
        debugInfo.push(`⚠️ Страница ${pageNum} не содержит текстовых элементов, возможно это отсканированное изображение`);
        // Здесь можно добавить код для OCR, если необходимо
        continue;
      }

      // Группируем элементы по строкам на основе Y-координаты
      const rows: { [key: number]: any[] } = {};
      textContent.items.forEach((item: any) => {
        // Округляем Y-координату для группировки элементов в одной строке
        // Используем более точное округление для лучшего определения строк
        const yPos = Math.round(item.transform[5] * 10) / 10;
        if (!rows[yPos]) {
          rows[yPos] = [];
        }
        rows[yPos].push(item);
      });

      // Сортируем строки сверху вниз (по убыванию Y-координаты)
      const sortedYPositions = Object.keys(rows)
        .map(Number)
        .sort((a, b) => b - a);

      // Для каждой строки сортируем элементы слева направо и объединяем
      let pageText = '';
      sortedYPositions.forEach(yPos => {
        // Сортируем элементы в строке по X-координате (слева направо)
        const sortedRowItems = rows[yPos].sort((a, b) => a.transform[4] - b.transform[4]);

        // Определяем, является ли это строкой таблицы (проверяем расстояние между элементами)
        const isTableRow = sortedRowItems.length > 1 &&
          sortedRowItems.some((item, idx) => {
            if (idx === 0) return false;
            // Если расстояние между элементами значительное, вероятно это табличные данные
            const distance = item.transform[4] - (sortedRowItems[idx - 1].transform[4] + sortedRowItems[idx - 1].width);
            return distance > 10;
          });

        // Формируем текст строки
        let rowText = '';
        if (isTableRow) {
          // Для табличных данных добавляем табуляцию между элементами
          rowText = sortedRowItems.map(item => item.str).join('\t');
        } else {
          // Для обычного текста объединяем с пробелами, учитывая расстояние
          sortedRowItems.forEach((item, idx) => {
            if (idx > 0) {
              const prevItem = sortedRowItems[idx - 1];
              const distance = item.transform[4] - (prevItem.transform[4] + prevItem.width);
              // Добавляем пробелы в зависимости от расстояния между элементами
              const spaces = Math.max(1, Math.min(4, Math.floor(distance / 4)));
              rowText += ' '.repeat(spaces);
            }
            rowText += item.str;
          });
        }

        pageText += rowText + '\n';
      });

      fullText += pageText;
    }

    // Дополнительная обработка извлеченного текста
    // Удаляем лишние пробелы и пустые строки
    fullText = fullText
      .replace(/\n{3,}/g, '\n\n') // Заменяем множественные переносы строк на двойной перенос
      .replace(/\t{2,}/g, '\t') // Заменяем множественные табуляции на одну
      .trim();

    // Проверяем, что текст был успешно извлечен
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('Не удалось извлечь текст из PDF файла. Файл может быть пустым или защищенным.');
    }

    console.log('Извлечение текста из PDF завершено успешно');
    console.log('Отладочная информация:', debugInfo.join('\n'));

    return fullText;
  } catch (error) {
    console.error('Ошибка извлечения текста из PDF:', error);
    throw new Error(`Не удалось извлечь текст из PDF файла: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Улучшенная основная функция для парсинга PDF выписок банков
 * с расширенной обработкой ошибок и отладочной информацией
 */
export const parseBankPdf = async (file: File): Promise<BankPdfParseResult> => {
  const debugInfo: string[] = [];

  try {
    debugInfo.push(`=== НАЧАЛО ПАРСИНГА PDF ФАЙЛА ===`);
    debugInfo.push(`Файл: ${file.name}, Размер: ${(file.size / 1024).toFixed(2)} КБ, Тип: ${file.type}`);

    // Проверка типа файла
    if (file.type !== 'application/pdf') {
      throw new Error(`Неверный тип файла: ${file.type}. Ожидается application/pdf`);
    }

    // Извлекаем текст из PDF
    debugInfo.push(`Извлечение текста из PDF...`);
    let extractedText: string;

    try {
      extractedText = await extractTextFromPdf(file);
    } catch (extractError) {
      debugInfo.push(`❌ Ошибка извлечения текста: ${extractError instanceof Error ? extractError.message : String(extractError)}`);
      throw new Error(`Не удалось извлечь текст из PDF файла: ${extractError instanceof Error ? extractError.message : String(extractError)}`);
    }

    if (!extractedText || !extractedText.trim()) {
      debugInfo.push(`❌ PDF файл не содержит текста или не может быть прочитан`);
      throw new Error('PDF файл не содержит текста или не может быть прочитан');
    }

    debugInfo.push(`✅ Текст успешно извлечен, длина: ${extractedText.length} символов`);

    // Проверка на наличие признаков банковской выписки
    if (!validateBankStatement(extractedText)) {
      debugInfo.push(`⚠️ Предупреждение: файл не похож на банковскую выписку`);
    }

    // Определяем тип банка
    const bankType = detectBankType(extractedText);
    debugInfo.push(`✅ Определен тип банка: ${bankType.toUpperCase()}`);

    // Парсим транзакции в зависимости от типа банка
    debugInfo.push(`Начинаем парсинг транзакций для ${bankType.toUpperCase()}...`);

    let parseResult: {
      transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[],
      debugInfo: string
    };

    // Пробуем сначала специфичный парсер
    try {
      switch (bankType) {
        case 'kaspi':
          parseResult = parseKaspiTransactions(extractedText);
          break;
        case 'halyk':
          parseResult = parseHalykTransactions(extractedText);
          break;
        default:
          debugInfo.push(`Тип банка не определен, используем универсальный парсер`);
          parseResult = parseGenericTransactions(extractedText);
          break;
      }

      debugInfo.push(`✅ Парсинг ${bankType} завершен, найдено транзакций: ${parseResult.transactions.length}`);
      debugInfo.push(parseResult.debugInfo);

    } catch (parseError) {
      debugInfo.push(`❌ Ошибка при парсинге ${bankType}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      debugInfo.push(`Пробуем универсальный парсер...`);

      // Если специфичный парсер не сработал, пробуем универсальный
      try {
        parseResult = parseGenericTransactions(extractedText);
        debugInfo.push(`✅ Универсальный парсинг завершен, найдено транзакций: ${parseResult.transactions.length}`);
      } catch (genericError) {
        debugInfo.push(`❌ Ошибка при универсальном парсинге: ${genericError instanceof Error ? genericError.message : String(genericError)}`);
        throw new Error(`Не удалось распарсить транзакции: ${genericError instanceof Error ? genericError.message : String(genericError)}`);
      }
    }

    // Проверка результата парсинга
    if (parseResult.transactions.length === 0) {
      debugInfo.push(`❌ Не найдено транзакций в выписке`);
      throw new Error('Не удалось найти транзакции в PDF файле. Проверьте формат выписки.');
    }

    // Статистика по найденным транзакциям
    const incomeCount = parseResult.transactions.filter(tx => tx.type === 'income').length;
    const expenseCount = parseResult.transactions.filter(tx => tx.type === 'expense').length;
    const totalAmount = parseResult.transactions.reduce((sum, tx) => sum + tx.amount, 0);

    debugInfo.push(`=== СТАТИСТИКА ПАРСИНГА ===`);
    debugInfo.push(`Всего транзакций: ${parseResult.transactions.length}`);
    debugInfo.push(`Доходы: ${incomeCount}, Расходы: ${expenseCount}`);
    debugInfo.push(`Общая сумма: ${totalAmount.toFixed(2)} ₸`);
    debugInfo.push(`=== ПАРСИНГ ЗАВЕРШЕН УСПЕШНО ===`);

    // Возвращаем результат
    return {
      transactions: parseResult.transactions,
      bankType,
      extractedText,
      debugInfo: debugInfo.join('\n')
    };

  } catch (error) {
    // Добавляем информацию об ошибке в отладочную информацию
    debugInfo.push(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error instanceof Error ? error.message : String(error)}`);
    debugInfo.push(`=== ПАРСИНГ ЗАВЕРШЕН С ОШИБКОЙ ===`);

    console.error('Ошибка парсинга PDF банка:', error);
    console.error('Отладочная информация:', debugInfo.join('\n'));

    // Создаем расширенный объект ошибки с отладочной информацией
    const enhancedError = new Error(error instanceof Error ? error.message : String(error));
    (enhancedError as any).debugInfo = debugInfo.join('\n');
    throw enhancedError;
  }
};

/**
 * Форматирует результат парсинга для отображения пользователю
 * @param result Результат парсинга
 * @returns Отформатированная информация о результате парсинга
 */
export const formatParseResult = (result: BankPdfParseResult): string => {
  const { transactions, bankType, debugInfo } = result;

  const incomeCount = transactions.filter(tx => tx.type === 'income').length;
  const expenseCount = transactions.filter(tx => tx.type === 'expense').length;
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const formattedResult = [
    `=== РЕЗУЛЬТАТ ПАРСИНГА PDF ВЫПИСКИ ===`,
    `Тип банка: ${bankType.toUpperCase()}`,
    `Всего транзакций: ${transactions.length}`,
    `Доходы: ${incomeCount}, Расходы: ${expenseCount}`,
    `Общая сумма: ${totalAmount.toFixed(2)} ₸`,
    `=== ДЕТАЛИ ===`,
    debugInfo
  ].join('\n');

  return formattedResult;
};