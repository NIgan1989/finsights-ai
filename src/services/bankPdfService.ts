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

/**
 * Определяет тип банка по содержимому PDF
 */
const detectBankType = (text: string): 'kaspi' | 'halyk' | 'unknown' => {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('каспи') || textLower.includes('kaspi') || 
      textLower.includes('kaspi bank') || textLower.includes('касп')) {
    return 'kaspi';
  }
  
  if (textLower.includes('халык') || textLower.includes('halyk') || 
      textLower.includes('halyk bank') || textLower.includes('народный банк')) {
    return 'halyk';
  }
  
  return 'unknown';
};

/**
 * Улучшенный парсер для транзакций Каспи банка
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Различные паттерны для строк с транзакциями в выписках Каспи
    const patterns = [
      // Основной формат: ДД.ММ.ГГГГ описание ±сумма ₸
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*₸?\s*$/,
      
      // Формат с временем: ДД.ММ.ГГГГ ЧЧ:ММ описание ±сумма ₸
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s+\d{1,2}:\d{2}\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*₸?\s*$/,
      
      // Формат с разделением по столбцам
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})$/,
      
      // Простой формат без символа валюты
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d+(?:[,.]\d{1,2})?)$/,
      
      // Формат с дополнительными символами
      /(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s,\.]*)\s*₸?\s*(?:Остаток|Balance|Итого)?/
    ];
    
    let matched = false;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, description, amountStr] = match;
        
        // Парсинг даты
        const dateParts = dateStr.split('.');
        if (dateParts.length !== 3) continue;
        
        let [day, month, year] = dateParts;
        
        // Добавляем ведущие нули
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        // Проверяем корректность года
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        
        const isoDate = `${year}-${month}-${day}`;
        
        // Проверка корректности даты
        const dateObj = new Date(isoDate);
        if (isNaN(dateObj.getTime())) {
          debugLines.push(`❌ Строка ${i+1}: Некорректная дата ${dateStr}`);
          continue;
        }
        
        // Парсинг суммы
        let cleanAmountStr = amountStr
          .replace(/\s+/g, '') // Убираем пробелы
          .replace(/[^\d\+\-,\.]/g, '') // Оставляем только цифры, знаки и разделители
          .replace(/,/g, '.'); // Заменяем запятые на точки
        
        // Обработка знака
        const isNegative = cleanAmountStr.includes('-');
        const isPositive = cleanAmountStr.includes('+');
        cleanAmountStr = cleanAmountStr.replace(/[\+\-]/g, '');
        
        const amount = parseFloat(cleanAmountStr);
        if (isNaN(amount) || amount === 0) {
          debugLines.push(`❌ Строка ${i+1}: Некорректная сумма "${amountStr}" -> "${cleanAmountStr}"`);
          continue;
        }
        
        // Определение типа транзакции
        let transactionType: 'income' | 'expense' = 'expense';
        
        if (isPositive || (!isNegative && (
          description.toLowerCase().includes('пополнение') ||
          description.toLowerCase().includes('поступление') ||
          description.toLowerCase().includes('зарплата') ||
          description.toLowerCase().includes('перевод на счет') ||
          description.toLowerCase().includes('возврат') ||
          description.toLowerCase().includes('доход')
        ))) {
          transactionType = 'income';
        }
        
        // Очистка описания
        const cleanDescription = description
          .replace(/\s+/g, ' ')
          .replace(/^[^\w\u0400-\u04FF]+/, '') // Убираем символы в начале
          .replace(/[^\w\u0400-\u04FF\s]+$/, '') // Убираем символы в конце
          .trim();
        
        const transaction = {
          id: `kaspi_${Date.now()}_${transactions.length}`,
          date: isoDate,
          description: cleanDescription || 'Транзакция Каспи банка',
          amount: amount,
          type: transactionType,
        };
        
        transactions.push(transaction);
        debugLines.push(`✅ Строка ${i+1}: ${dateStr} | ${cleanDescription} | ${amount} ₸ (${transactionType})`);
        matched = true;
        break;
      }
    }
    
    if (!matched && line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
      debugLines.push(`⚠️ Строка ${i+1}: Содержит дату, но не распознана: "${line}"`);
    }
  }
  
  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);
  
  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Улучшенный парсер для транзакций Халык банка
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Паттерны для Халык банка
    const patterns = [
      // Формат с слешами: ДД/ММ/ГГГГ описание ±сумма
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*₸?\s*$/,
      
      // Формат с точками: ДД.ММ.ГГГГ описание ±сумма
      /^(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*₸?\s*$/,
      
      // Формат с временем
      /^(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4})\s+\d{1,2}:\d{2}\s+(.+?)\s+([\+\-]?\d[\d\s]*[,.]?\d{0,2})\s*₸?\s*$/,
    ];
    
    let matched = false;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, description, amountStr] = match;
        
        // Парсинг даты
        const dateParts = dateStr.split(/[\/\.]/);
        if (dateParts.length !== 3) continue;
        
        let [day, month, year] = dateParts;
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        
        const isoDate = `${year}-${month}-${day}`;
        
        // Парсинг суммы
        let cleanAmountStr = amountStr
          .replace(/\s+/g, '')
          .replace(/[^\d\+\-,\.]/g, '')
          .replace(/,/g, '.');
        
        const isNegative = cleanAmountStr.includes('-');
        const isPositive = cleanAmountStr.includes('+');
        cleanAmountStr = cleanAmountStr.replace(/[\+\-]/g, '');
        
        const amount = parseFloat(cleanAmountStr);
        if (isNaN(amount) || amount === 0) continue;
        
        // Определение типа транзакции для Халык банка
        let transactionType: 'income' | 'expense' = 'expense';
        
        if (isPositive || (!isNegative && (
          description.toLowerCase().includes('пополнение') ||
          description.toLowerCase().includes('поступление') ||
          description.toLowerCase().includes('зарплата') ||
          description.toLowerCase().includes('доход')
        ))) {
          transactionType = 'income';
        }
        
        const cleanDescription = description.replace(/\s+/g, ' ').trim();
        
        transactions.push({
          id: `halyk_${Date.now()}_${transactions.length}`,
          date: isoDate,
          description: cleanDescription || 'Транзакция Халык банка',
          amount: amount,
          type: transactionType,
        });
        
        debugLines.push(`✅ Строка ${i+1}: ${dateStr} | ${cleanDescription} | ${amount} ₸ (${transactionType})`);
        matched = true;
        break;
      }
    }
    
    if (!matched && line.match(/\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4}/)) {
      debugLines.push(`⚠️ Строка ${i+1}: Содержит дату, но не распознана: "${line}"`);
    }
  }
  
  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);
  
  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Улучшенный общий парсер для неопознанных банков
 */
const parseGenericTransactions = (text: string): { 
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[], 
  debugInfo: string 
} => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const debugLines: string[] = [];
  const lines = text.split('\n');
  
  debugLines.push(`Всего строк для анализа: ${lines.length}`);
  debugLines.push('--- Начинаем общий парсинг транзакций ---');
  
  // Универсальные паттерны для различных форматов дат и транзакций
  const datePatterns = [
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/,  // ДД/ММ/ГГГГ, ДД.ММ.ГГГГ, ДД-ММ-ГГГГ
    /(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/   // ГГГГ/ММ/ДД, ГГГГ.ММ.ДД, ГГГГ-ММ-ДД
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    let dateMatch = null;
    let dateFormat = '';
    
    // Ищем дату в различных форматах
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        dateMatch = match;
        dateFormat = match[1];
        break;
      }
    }
    
    if (!dateMatch) continue;
    
    // Парсинг даты
    const dateParts = dateFormat.split(/[\/\.\-]/);
    let isoDate: string;
    
    if (dateParts[0].length === 4) {
      // Формат ГГГГ/ММ/ДД
      const [year, month, day] = dateParts;
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      // Формат ДД/ММ/ГГГГ
      const [day, month, year] = dateParts;
      const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Ищем все числа в строке (потенциальные суммы)
    const numberMatches = line.match(/([\+\-]?\d[\d\s]*[,.]?\d{0,2})/g);
    if (!numberMatches || numberMatches.length === 0) continue;
    
    // Берем последнее число как сумму транзакции
    const amountStr = numberMatches[numberMatches.length - 1];
    let cleanAmountStr = amountStr
      .replace(/\s+/g, '')
      .replace(/[^\d\+\-,\.]/g, '')
      .replace(/,/g, '.');
    
    const isNegative = cleanAmountStr.includes('-');
    cleanAmountStr = cleanAmountStr.replace(/[\+\-]/g, '');
    
    const amount = parseFloat(cleanAmountStr);
    if (isNaN(amount) || amount === 0) continue;
    
    // Извлекаем описание (вся строка без даты и суммы)
    const description = line
      .replace(dateFormat, '')
      .replace(amountStr, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    transactions.push({
      id: `generic_${Date.now()}_${transactions.length}`,
      date: isoDate,
      description: description || 'Транзакция',
      amount: amount,
      type: isNegative ? 'expense' : 'income',
    });
    
    debugLines.push(`✅ Строка ${i+1}: ${dateFormat} | ${description} | ${amount} (${isNegative ? 'расход' : 'доход'})`);
  }
  
  debugLines.push(`--- Итого найдено транзакций: ${transactions.length} ---`);
  
  return {
    transactions,
    debugInfo: debugLines.join('\n')
  };
};

/**
 * Улучшенная функция извлечения текста из PDF
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    if (!pdfjsLib) {
      throw new Error('PDF.js не загружен. Пожалуйста, убедитесь, что библиотека подключена.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Улучшенная обработка текста с учетом позиций
      const pageText = textContent.items
        .sort((a: any, b: any) => {
          // Сортируем по вертикальной позиции (y), затем по горизонтальной (x)
          if (Math.abs(a.transform[5] - b.transform[5]) > 2) {
            return b.transform[5] - a.transform[5]; // Сортировка сверху вниз
          }
          return a.transform[4] - b.transform[4]; // Сортировка слева направо
        })
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Ошибка извлечения текста из PDF:', error);
    throw new Error(`Не удалось извлечь текст из PDF файла: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Основная функция для парсинга PDF выписок банков
 */
export const parseBankPdf = async (file: File): Promise<BankPdfParseResult> => {
  try {
    console.log('Начинаем парсинг PDF файла:', file.name);
    
    // Извлекаем текст из PDF
    const extractedText = await extractTextFromPdf(file);
    
    if (!extractedText.trim()) {
      throw new Error('PDF файл не содержит текста или не может быть прочитан');
    }
    
    console.log('Извлечен текст из PDF, длина:', extractedText.length);
    
    // Определяем тип банка
    const bankType = detectBankType(extractedText);
    console.log('Определен тип банка:', bankType);
    
    // Парсим транзакции в зависимости от типа банка
    let parseResult: { 
      transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[], 
      debugInfo: string 
    };
    
    switch (bankType) {
      case 'kaspi':
        parseResult = parseKaspiTransactions(extractedText);
        break;
      case 'halyk':
        parseResult = parseHalykTransactions(extractedText);
        break;
      default:
        parseResult = parseGenericTransactions(extractedText);
        break;
    }
    
    console.log('Результат парсинга:', parseResult.debugInfo);
    
    if (parseResult.transactions.length === 0) {
      throw new Error('Не удалось найти транзакции в PDF файле. Проверьте формат выписки.');
    }
    
    return {
      transactions: parseResult.transactions,
      bankType,
      extractedText,
      debugInfo: parseResult.debugInfo
    };
    
  } catch (error) {
    console.error('Ошибка парсинга PDF банка:', error);
    throw error;
  }
};

/**
 * Валидирует, является ли файл банковской выпиской
 */
export const validateBankStatement = (text: string): boolean => {
  const keywords = [
    'выписка', 'statement', 'transaction', 'транзакция',
    'баланс', 'balance', 'каспи', 'kaspi', 'халык', 'halyk',
    'банк', 'bank', 'дата', 'date', 'сумма', 'amount'
  ];
  
  const textLower = text.toLowerCase();
  return keywords.some(keyword => textLower.includes(keyword));
};

/**
 * Улучшенное форматирование результата для отладки
 */
export const formatParseResult = (result: BankPdfParseResult): string => {
  const summary = `
=== РЕЗУЛЬТАТ ПАРСИНГА PDF ===
Тип банка: ${result.bankType.toUpperCase()}
Найдено транзакций: ${result.transactions.length}

${result.debugInfo || ''}

=== ПЕРВЫЕ 5 ТРАНЗАКЦИЙ ===
${result.transactions.slice(0, 5).map((tx, i) => 
  `${i + 1}. ${tx.date} | ${tx.description} | ${tx.amount} ₸ (${tx.type === 'income' ? 'доход' : 'расход'})`
).join('\n')}

=== СУММАРНАЯ СТАТИСТИКА ===
Доходы: ${result.transactions.filter(tx => tx.type === 'income').length} транзакций
Расходы: ${result.transactions.filter(tx => tx.type === 'expense').length} транзакций
Общая сумма доходов: ${result.transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} ₸
Общая сумма расходов: ${result.transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)} ₸
  `.trim();
  
  return summary;
};