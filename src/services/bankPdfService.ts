import { Transaction } from '../types';

// Устанавливаем PDF.js worker
const pdfjsLib = (window as any).pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Паттерны для извлечения данных из PDF выписок банков
const KASPI_PATTERNS = {
  transaction: /(\d{2}\.\d{2}\.\d{4})\s*(.+?)\s*([\-\+]?\d+(?:\.\d{2})?)/g,
  date: /(\d{2}\.\d{2}\.\d{4})/,
  amount: /([\-\+]?\d+(?:\.\d{2})?)/,
  description: /^\d{2}\.\d{2}\.\d{4}\s*(.+?)\s*[\-\+]?\d+(?:\.\d{2})?$/
};

const HALYK_PATTERNS = {
  transaction: /(\d{2}\/\d{2}\/\d{4})\s*(.+?)\s*([\-\+]?\d+(?:,\d{2})?)/g,
  date: /(\d{2}\/\d{2}\/\d{4})/,
  amount: /([\-\+]?\d+(?:,\d{2})?)/,
  description: /^\d{2}\/\d{2}\/\d{4}\s*(.+?)\s*[\-\+]?\d+(?:,\d{2})?$/
};

interface BankPdfParseResult {
  transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[];
  bankType: 'kaspi' | 'halyk' | 'unknown';
  extractedText: string;
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
 * Парсит транзакции из текста выписки Каспи банка
 */
const parseKaspiTransactions = (text: string): Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Ищем строки с датой в формате ДД.ММ.ГГГГ
    const dateMatch = cleanLine.match(/^(\d{2}\.\d{2}\.\d{4})/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split('.');
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    // Ищем сумму в конце строки
    const amountMatch = cleanLine.match(/([\-\+]?\d+(?:\.\d{2})?)\s*₸?\s*$/);
    if (!amountMatch) continue;
    
    const amountStr = amountMatch[1].replace(/[^\d\-\+\.]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;
    
    // Извлекаем описание (все между датой и суммой)
    const descriptionMatch = cleanLine.match(/^\d{2}\.\d{2}\.\d{4}\s*(.+?)\s*[\-\+]?\d+(?:\.\d{2})?\s*₸?\s*$/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : cleanLine;
    
    transactions.push({
      id: `kaspi_${Date.now()}_${transactions.length}`,
      date: isoDate,
      description: description || 'Транзакция Каспи банка',
      amount: Math.abs(amount),
      type: amount >= 0 ? 'income' : 'expense',
    });
  }
  
  return transactions;
};

/**
 * Парсит транзакции из текста выписки Халык банка
 */
const parseHalykTransactions = (text: string): Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Ищем строки с датой в формате ДД/ММ/ГГГГ или ДД.ММ.ГГГГ
    const dateMatch = cleanLine.match(/^(\d{2}[\/\.]\d{2}[\/\.]\d{4})/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split(/[\/\.]/);
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    // Ищем сумму (может быть с запятой в качестве разделителя)
    const amountMatch = cleanLine.match(/([\-\+]?\d+(?:[,\.]\d{2})?)\s*₸?\s*$/);
    if (!amountMatch) continue;
    
    const amountStr = amountMatch[1].replace(/,/g, '.').replace(/[^\d\-\+\.]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;
    
    // Извлекаем описание
    const descriptionMatch = cleanLine.match(/^\d{2}[\/\.]\d{2}[\/\.]\d{4}\s*(.+?)\s*[\-\+]?\d+(?:[,\.]\d{2})?\s*₸?\s*$/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : cleanLine;
    
    transactions.push({
      id: `halyk_${Date.now()}_${transactions.length}`,
      date: isoDate,
      description: description || 'Транзакция Халык банка',
      amount: Math.abs(amount),
      type: amount >= 0 ? 'income' : 'expense',
    });
  }
  
  return transactions;
};

/**
 * Парсит общий формат транзакций (для неопознанных банков)
 */
const parseGenericTransactions = (text: string): Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] => {
  const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Ищем любую дату в различных форматах
    const dateMatch = cleanLine.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4})/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split(/[\/\.\-]/);
    let isoDate: string;
    
    if (dateParts[2].length === 4) { // ДД/ММ/ГГГГ
      isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    } else { // ГГГГ/ММ/ДД
      isoDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
    }
    
    // Ищем сумму
    const amountMatch = cleanLine.match(/([\-\+]?\d+(?:[,\.]\d{2})?)/g);
    if (!amountMatch) continue;
    
    // Берем последнее число как сумму
    const amountStr = amountMatch[amountMatch.length - 1].replace(/,/g, '.').replace(/[^\d\-\+\.]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;
    
    transactions.push({
      id: `generic_${Date.now()}_${transactions.length}`,
      date: isoDate,
      description: cleanLine,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'income' : 'expense',
    });
  }
  
  return transactions;
};

/**
 * Извлекает текст из PDF файла
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
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Ошибка извлечения текста из PDF:', error);
    throw new Error('Не удалось извлечь текст из PDF файла');
  }
};

/**
 * Основная функция для парсинга PDF выписок банков
 */
export const parseBankPdf = async (file: File): Promise<BankPdfParseResult> => {
  try {
    // Извлекаем текст из PDF
    const extractedText = await extractTextFromPdf(file);
    
    if (!extractedText.trim()) {
      throw new Error('PDF файл не содержит текста или не может быть прочитан');
    }
    
    // Определяем тип банка
    const bankType = detectBankType(extractedText);
    
    // Парсим транзакции в зависимости от типа банка
    let transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];
    
    switch (bankType) {
      case 'kaspi':
        transactions = parseKaspiTransactions(extractedText);
        break;
      case 'halyk':
        transactions = parseHalykTransactions(extractedText);
        break;
      default:
        transactions = parseGenericTransactions(extractedText);
        break;
    }
    
    if (transactions.length === 0) {
      throw new Error('Не удалось найти транзакции в PDF файле. Проверьте формат выписки.');
    }
    
    return {
      transactions,
      bankType,
      extractedText
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
 * Форматирует результат для отладки
 */
export const formatParseResult = (result: BankPdfParseResult): string => {
  return `
Тип банка: ${result.bankType}
Найдено транзакций: ${result.transactions.length}
Первые 5 транзакций:
${result.transactions.slice(0, 5).map((tx, i) => 
  `${i + 1}. ${tx.date} | ${tx.description} | ${tx.amount} ₸ (${tx.type})`
).join('\n')}
  `.trim();
};