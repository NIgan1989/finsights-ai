import { Transaction } from '../types';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion, PDFDocumentProxy } from 'pdfjs-dist';

// Устанавливаем PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Ищем строки с датой в формате ДД.ММ.ГГ или ДД.ММ.ГГГГ
    const dateMatch = line.match(/^(\d{2}\.\d{2}\.(\d{2}|\d{4}))/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split('.');
    
    // Определяем год: если двузначный, добавляем 20
    let year = dateParts[2];
    if (year.length === 2) {
      year = `20${year}`;
    }
    
    const isoDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
    
    // Проверяем правильность даты
    const dateObj = new Date(isoDate);
    if (isNaN(dateObj.getTime())) continue;
    
    // Ищем сумму с знаком (улучшенное регулярное выражение для формата Каспи)
    const amountMatches = line.match(/([\+\-])\s*(\d+(?:\s?\d{3})*(?:,\d{2})?)\s*₸/);
    if (!amountMatches) continue;
    
    const sign = amountMatches[1];
    const amountStr = amountMatches[2].replace(/\s/g, '').replace(',', '.');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) continue;
    
    // Определяем тип транзакции по знаку
    const isIncome = sign === '+';
    
    // Извлекаем описание операции (все после знака и суммы)
    const descriptionMatch = line.match(/^\d{2}\.\d{2}\.(?:\d{2}|\d{4})\s+[\+\-]\s*\d+(?:\s?\d{3})*(?:,\d{2})?\s*₸\s*(.+)$/);
    let description = 'Транзакция Каспи банка';
    
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1].trim();
    }
    
    // Очищаем описание от лишних символов
    if (!description || description.length < 3) {
      description = 'Транзакция Каспи банка';
    }
    
    transactions.push({
      id: `kaspi_${Date.now()}_${transactions.length}_${Math.random().toString(36).substr(2, 9)}`,
      date: isoDate,
      description: description,
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Ищем строки с датой в формате ДД.ММ.ГГГГ (табличный формат Халык банка)
    const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{4})/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split('.');
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    // Проверяем правильность даты
    const dateObj = new Date(isoDate);
    if (isNaN(dateObj.getTime())) continue;
    
    // Для табличного формата Халык банка:
    // Формат: ДАТА ДАТА ОПИСАНИЕ СУММА KZT ПРИХОД РАСХОД КОМИССИЯ НОМЕР
    // Нужно найти столбец с отрицательной суммой в "Расход в валюте счета"
    
    // Ищем паттерн: -СУММА,XX после описания и до конца строки
    const amountMatches = line.match(/-(\d+(?:\s\d{3})*(?:,\d{2})?)/g);
    if (!amountMatches || amountMatches.length === 0) continue;
    
    // Берем последнюю найденную отрицательную сумму (это должна быть сумма расхода)
    const lastAmountMatch = amountMatches[amountMatches.length - 1];
    const amountStr = lastAmountMatch.replace('-', '').replace(/\s/g, '').replace(',', '.');
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount === 0) continue;
    
    // В данной выписке все операции - расходы (отрицательные суммы)
    const isIncome = false;
    
    // Извлекаем описание операции
    // Убираем даты и ищем текст до первой суммы
    let description = 'Транзакция Халык банка';
    
    // Удаляем две даты в начале строки
    const withoutDates = line.replace(/^\d{2}\.\d{2}\.\d{4}\s+\d{2}\.\d{2}\.\d{4}\s+/, '');
    
    // Ищем описание до первой суммы или до KZT
    const descMatch = withoutDates.match(/^(.+?)\s+(?:-?\d+(?:\s\d{3})*(?:,\d{2})?|KZT)/);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
      // Очищаем описание от лишних пробелов
      description = description.replace(/\s+/g, ' ').trim();
    }
    
    // Если описание пустое или слишком короткое
    if (!description || description.length < 3) {
      description = 'Транзакция Халык банка';
    }
    
    transactions.push({
      id: `halyk_${Date.now()}_${transactions.length}_${Math.random().toString(36).substr(2, 9)}`,
      date: isoDate,
      description: description,
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Ищем любую дату в различных форматах
    const dateMatch = line.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-](?:\d{2}|\d{4}))/);
    if (!dateMatch) continue;
    
    // Извлекаем дату
    const dateStr = dateMatch[1];
    const dateParts = dateStr.split(/[\/\.\-]/);
    let isoDate: string;
    
    if (dateParts[2].length === 4) { // ДД/ММ/ГГГГ
      isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    } else if (dateParts[2].length === 2) { // ДД/ММ/ГГ
      const year = `20${dateParts[2]}`;
      isoDate = `${year}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    } else { // ГГГГ/ММ/ДД
      isoDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
    }
    
    // Проверяем правильность даты
    const dateObj = new Date(isoDate);
    if (isNaN(dateObj.getTime())) continue;
    
    // Ищем сумму
    const amountMatches = line.match(/([\-\+]?\d+(?:[,\.]\d{2})?)/g);
    if (!amountMatches || amountMatches.length === 0) continue;
    
    // Берем последнее число как сумму
    const lastAmount = amountMatches[amountMatches.length - 1];
    const amountStr = lastAmount.replace(/,/g, '.').replace(/[^\d\-\+\.]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) continue;
    
    transactions.push({
      id: `generic_${Date.now()}_${transactions.length}_${Math.random().toString(36).substr(2, 9)}`,
      date: isoDate,
      description: line.trim() || 'Банковская транзакция',
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
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => (item as any).str).join(' ');
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
    'банк', 'bank', 'дата', 'date', 'сумма', 'amount',
    'счет', 'account', 'операци', 'operation'
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