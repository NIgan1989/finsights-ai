import { Transaction, PnLData, CashFlowData, BalanceSheetData, FinancialReport, BusinessProfile, DebtReport } from '../types';
// import { classifyAndReviewTransactions, extractTransactionsFromImage } from './geminiService.ts';
// Динамический импорт pdfjs-dist будет выполнен при использовании

// --- Улучшенная система автокатегоризации ---
const categoryKeywords: { [key: string]: string[] } = {
    // Операционные расходы
    'Зарплата': ['зарплата', 'salary', 'оплата труда', 'выплата зарплаты'],
    'Аренда': ['аренда', 'rent', 'арендная плата', 'плата за аренду'],
    'Закупка товаров': ['закупка', 'товары', 'материалы', 'сырье', 'инвентарь'],
    'Реклама и маркетинг': ['реклама', 'маркетинг', 'advertising', 'продвижение', 'smm'],
    'Коммунальные услуги': ['прэк', 'коммунал', 'электро', 'вода', 'газ', 'тепло', 'квартплата', 'жилищно-коммунальные'],
    'Связь и интернет': ['beeline', 'tele2', 'kcell', 'activ', 'altel', 'интернет', 'связь', 'мобильная связь', 'телефон'],
    'Транспортные расходы': ['транспорт', 'бензин', 'такси', 'yandex', 'яндекс', 'bolt', 'uber', 'азс', 'заправка'],
    'Ремонт и обслуживание': ['ремонт', 'обслуживание', 'сервис', 'техобслуживание'],
    'Канцтовары': ['канцтовары', 'бумага', 'ручки', 'тетради', 'офисные принадлежности'],
    'Представительские расходы': ['представительские', 'встречи', 'переговоры', 'бизнес-ланч'],
    'Командировочные расходы': ['командировка', 'гостиница', 'отель', 'hotel'],
    'Подписки на сервисы': ['подписка', 'subscription', 'сервис', 'app', 'приложение'],
    'Страхование': ['страхование', 'insurance', 'страховка'],
    'Банковские комиссии': ['комиссия', 'банковская комиссия', 'снятие наличных сверх лимита'],
    'Налоги': ['налог', 'ндс', 'подоходный', 'социальный налог'],
    'Штрафы и пени': ['штраф', 'пеня', 'fine', 'penalty'],

    // Капитальные затраты
    'Оборудование': ['оборудование', 'equipment', 'техника', 'компьютер', 'принтер'],

    // Финансовые операции
    'Проценты по кредитам': ['проценты', 'interest', 'процент по кредиту'],
    'Погашение кредита': ['оплата кредита', 'погашение кредита', 'kaspi кредит', 'кредит'],
    'Выдача займа': ['займ', 'заем', 'выдача займа', 'кредитование'],
    'Лизинговые платежи': ['лизинг', 'leasing', 'лизинговый платеж'],
    'Выплата дивидендов': ['дивиденды', 'dividend', 'выплата дивидендов'],
    'Накопления и сбережения': ['накопления', 'сбережения', 'депозит', 'вклад'],
    'Личные траты': ['личные', 'personal', 'личные расходы'],

    // Доходы
    'Операционный доход': ['доход', 'revenue', 'выручка', 'операционный доход'],
    'Получение кредита': ['получение кредита', 'кредит получен'],
    'Взнос учредителя': ['взнос учредителя', 'вклад учредителя'],
    'Возврат долга': ['возврат долга', 'возврат займа'],
    'Прочие поступления': ['поступления', 'поступление'],

    // Специальные категории для переводов
    'Переводы между своими счетами': [
        'на kaspi депозит', 'с kaspi депозита', 'депозит', 'в kaspi банкомате',
        'в kaspi терминале', 'отбасы банк. пополнение депозита'
    ],
    'Переводы': ['с карты другого банка', 'перевод', 'от карты', 'на карту'],

    // Дополнительные категории на основе ваших транзакций
    'Детский сад': ['детвора', 'детский сад', 'садик', 'детский клуб'],
    'Аптека и здоровье': ['аптека', 'фармаком', 'pharmacy', 'медицин', 'врач', 'клиника', 'kromiadi'],
    'Красота и здоровье': ['beauty', 'салон', 'spa', 'будуар', 'красота', 'эстетика'],
    'Магазины': ['магазин', 'small', 'fix price', 'маркет', 'modnopvl', 'sabina', 'овощифрукты', 'спортмастер'],
    'Кафе и рестораны': ['кафе', 'ресторан', 'pub', 'суши', 'chechil', 'chekhov', 'magic villag', 'бала парк'],
    'Развлечения': ['кино', 'аттракцион', 'парк', 'билеты', '7 д', 'leone d\'oro', 'macdac', 'призовой аттракцион'],
    'Банкоматы': ['банкомат', 'терминал', 'в kaspi банкомате', 'в kaspi терминале', 'аппарат самообслуживания', 'банкомат small'],
    'Недвижимость': ['крыша', 'аренда', 'ипотека', 'недвижимость'],
    'Бизнес/Поставщики': [
        'ип ', 'ип.', 'ип,', 'ип-', 'ип_', 'too', 'тoo', 'ип айчанов', 'ип майер', 'ип оганисян',
        'ип негматов', 'ип балкибаев', 'ип рунар', 'ип айтчанов', 'ип бахтиярова', 'ип алгазина'
    ]
};

// Функция для определения категории на основе ключевых слов
const determineCategory = (description: string, counterparty: string = '', operation: string = ''): string => {
    const text = `${description} ${counterparty} ${operation}`.toLowerCase();

    // Сначала проверяем специальные случаи
    if (text.includes('на kaspi депозит') || text.includes('с kaspi депозита') ||
        text.includes('в kaspi банкомате') || text.includes('в kaspi терминале') ||
        text.includes('отбасы банк. пополнение депозита')) {
        return 'Переводы между своими счетами';
    }

    if (text.includes('с карты другого банка') || text.includes('от карты') || text.includes('на карту')) {
        return 'Переводы';
    }

    // Проверяем все категории по ключевым словам
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }

    // Если ничего не найдено, возвращаем "Прочее"
    return 'Прочее';
};

// --- Вспомогательная функция для выделения контрагента ---
function extractCounterparty(description: string, operation: string = ""): string {
    const text = `${description} ${operation}`.toLowerCase();
    // Переводы между своими счетами
    if (text.includes('на kaspi депозит')) return 'Kaspi Депозит';
    if (text.includes('с kaspi депозита')) return 'Kaspi Депозит';
    if (text.includes('в kaspi банкомате')) return 'Kaspi Банкомат';
    if (text.includes('в kaspi терминале')) return 'Kaspi Терминал';
    if (text.includes('отбасы банк. пополнение депозита')) return 'Отбасы Банк';
    if (text.includes('с карты другого банка')) return 'Другая карта';
    // Магазины, ИП, TOO, компании
    const match = description.match(/(ип\s+[\w\s.]+|too\s+[\w\s.]+|тoo\s+[\w\s.]+|магазин\s+[\w\s.]+|кафе\s+[\w\s.]+|ресторан\s+[\w\s.]+|[A-ZА-ЯЁ][a-zа-яё]+\s+[A-ZА-ЯЁ][a-zа-яё.]+)/i);
    if (match) return match[0].trim();
    // Если есть имя (например, "Иван И.", "Гульмира М.")
    const nameMatch = description.match(/[А-ЯЁA-Z][а-яёa-z]+\s+[А-ЯЁA-Z][а-яёa-z.]+/);
    if (nameMatch) return nameMatch[0].trim();
    // Если есть короткое слово (бренд, сервис)
    const wordMatch = description.match(/^([A-Za-zА-Яа-яЁё0-9_\-\.]+)(\s|$)/);
    if (wordMatch) return wordMatch[1].trim();
    // По умолчанию
    return description.trim() || operation.trim() || 'Kaspi Bank';
}

const parseCSV = (csvText: string): Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] => {
    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) {
        throw new Error('CSV-файл пуст.');
    }

    const dateKeywords = ['дата', 'date'];
    const descKeywords = ['описание', 'description', 'назначение'];
    const amountKeywords = ['сумма', 'amount'];

    let headerRowIndex = -1;
    let headers: string[] = [];
    let separator = ',';

    // Find header row by looking for keywords
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const currentLine = lines[i];
        const currentSeparator = currentLine.includes(';') ? ';' : ',';
        const potentialHeaders = currentLine.split(currentSeparator).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

        const hasDate = potentialHeaders.some(h => dateKeywords.some(kw => h.includes(kw)));
        const hasDesc = potentialHeaders.some(h => descKeywords.some(kw => h.includes(kw)));
        const hasAmount = potentialHeaders.some(h => amountKeywords.some(kw => h.includes(kw)));

        if (hasDate && hasDesc && hasAmount) {
            headerRowIndex = i;
            separator = currentSeparator;
            headers = potentialHeaders;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error('Не удалось найти строку заголовка с обязательными колонками (Дата, Описание, Сумма) в CSV.');
    }

    const findIndex = (keywords: string[]) => headers.findIndex(h => keywords.some(kw => h.includes(kw)));

    const dateIndex = findIndex(dateKeywords);
    const descIndex = findIndex(descKeywords);
    const amountIndex = findIndex(amountKeywords);

    // This check is a safeguard, but the loop above should have ensured this.
    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
        throw new Error('Неверный формат CSV. Убедитесь, что файл содержит колонки "Дата", "Описание" и "Сумма".');
    }

    const transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const data = lines[i].split(separator);
        // Skip rows that don't have enough columns, might be empty lines or metadata.
        if (data.length < headers.length) continue;

        const amountString = (data[amountIndex] || '').trim().replace(/"/g, '').replace(/\s/g, '').replace('₸', '');
        const amount = parseFloat(amountString.replace(',', '.'));

        if (isNaN(amount)) continue;

        const dateRaw = (data[dateIndex] || '').trim().replace(/"/g, '');
        const dateParts = dateRaw.split(/[.\-\/]/);
        let dateObj: Date;

        if (dateParts.length === 3) {
            const p1 = parseInt(dateParts[0], 10), p2 = parseInt(dateParts[1], 10), p3 = parseInt(dateParts[2], 10);

            if (dateParts[0].length === 4 && p1 > 1900) { // YYYY-MM-DD
                dateObj = new Date(Date.UTC(p1, p2 - 1, p3));
            } else { // DD.MM.YYYY or DD.MM.YY
                let year = p3;
                if (dateParts[2].length === 2) {
                    year = year < 50 ? 2000 + year : 1900 + year;
                }
                dateObj = new Date(Date.UTC(year, p2 - 1, p1));
            }
        } else {
            dateObj = new Date(dateRaw);
        }

        if (isNaN(dateObj.getTime())) continue;

        const isoDate = dateObj.toISOString().split('T')[0];
        const description = (data[descIndex] || '').trim().replace(/^"|"$/g, '');
        // Новый способ выделения контрагента
        const counterparty = extractCounterparty(description, '');

        transactions.push({
            id: `tx_${Date.now()}_${i}`,
            date: isoDate,
            description: description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' : 'expense',
            counterparty,
        });
    }

    if (transactions.length === 0 && lines.length > headerRowIndex + 1) {
        throw new Error('Не удалось прочитать транзакции из файла. Проверьте содержимое и формат данных после строки заголовка.');
    }

    return transactions;
};

// --- Kaspi PDF Parser ---
const parseKaspiPdfText = (pdfText: string): Transaction[] => {
    console.log('Raw lines for parsing:', pdfText.split('\n'));
    const transactions: Transaction[] = [];
    
    // Предварительная обработка текста - разбиваем длинные строки на отдельные транзакции
    let processedText = pdfText;
    // Заменяем заголовки страниц пустой строкой
    processedText = processedText.replace(/АО «Kaspi Bank», БИК CASPKZKA, www\.kaspi\.kz/g, '\n');
    
    // Разбиваем по датам (dd.mm.yy) с пробелами после них
    const datePattern = /(\d{2}\.\d{2}\.\d{2})\s+/g;
    processedText = processedText.replace(datePattern, '\n$1 ');
    
    // Теперь разбиваем на строки и обрабатываем каждую строку
    const lines = processedText.split('\n').map(l => l.trim()).filter(Boolean);
    console.log('Processed lines:', lines);
    
    let parsing = false;
    for (const line of lines) {
        // Игнорируем заголовки и служебные строки
        if (line.includes('ВЫПИСКА') || 
            line.includes('Краткое содержание') || 
            line.includes('Доступно на') || 
            line.includes('Валюта счета') ||
            line.includes('Дата   Сумма   Операция   Детали') ||
            line.includes('Сумма заблокирована')) {
            if (line.includes('Дата   Сумма   Операция   Детали')) {
                parsing = true;
            }
            continue;
        }
        
        // Если строка содержит дату в формате dd.mm.yy, то это транзакция
        const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})/);
        if (!dateMatch || !parsing) continue;
        
        // Улучшенный regex для парсинга строки
        const match = line.match(/(\d{2}\.\d{2}\.\d{2})\s+([+-]?\s*[\d\s]+,\d{2}\s*₸)\s+([\wА-Яа-яЁё\s]+)\s+(.+)/);
        if (!match) {
            console.log('Skipped line:', line);
            continue;
        }
        
        const [, dateStr, amountStr, operation, details] = match;
        
        // Парсим дату
        const [day, month, yearStr] = dateStr.split('.');
        const year = parseInt(yearStr) < 50 ? 2000 + parseInt(yearStr) : 1900 + parseInt(yearStr);
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
            console.log('Invalid date:', dateStr);
            continue;
        }
        
        // Парсим сумму
        const cleanAmountStr = amountStr.replace(/\s/g, '').replace('₸', '').replace(',', '.');
        const amount = parseFloat(cleanAmountStr);
        if (isNaN(amount)) {
            console.log('Invalid amount:', amountStr);
            continue;
        }
        
        const description = `${operation} ${details}`.trim();
        const counterparty = extractCounterparty(description, operation);
        const category = determineCategory(description, counterparty, operation);
        
        const tx = {
            id: `kaspi_${Date.now()}_${transactions.length}`,
            date: date.toISOString().split('T')[0],
            description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' as 'income' : 'expense' as 'expense',
            counterparty,
            category,
            transactionType: 'operating' as 'operating',
            isCapitalized: false,
            needsClarification: false,
        };
        
        transactions.push(tx);
        console.log('Parsed transaction:', tx);
    }
    
    console.log('Final parsed transactions:', transactions);
    return transactions;
};

// --- Halyk PDF Parser ---
const parseHalykPdfText = (pdfText: string): Transaction[] => {
    const transactions: Transaction[] = [];
    const lines = pdfText.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Ищем строки с датами и суммами
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Ищем дату в формате DD.MM.YYYY
        const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (!dateMatch) continue;
        
        // Ищем сумму в той же строке или следующей
        const amountMatch = line.match(/([+-]?)\s*([\d\s]+,\d{2})\s*₸/) || 
                           (i + 1 < lines.length ? lines[i + 1].match(/([+-]?)\s*([\d\s]+,\d{2})\s*₸/) : null);
        
        if (!amountMatch) continue;
        
        const date = new Date(dateMatch[1].split('.').reverse().join('-'));
        const sign = amountMatch[1] === '-' ? -1 : 1;
        const amount = sign * parseFloat(amountMatch[2].replace(/\s/g, '').replace(',', '.'));
        
        // Описание - берем текст до даты или после суммы
        let description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
        if (!description && i + 1 < lines.length) {
            description = lines[i + 1].replace(amountMatch[0], '').trim();
        }
        
        const counterparty = extractCounterparty(description);
        const category = determineCategory(description, counterparty);

        transactions.push({
            id: `halyk_${Date.now()}_${i}`,
            date: date.toISOString().split('T')[0],
            description: description || 'Операция',
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' : 'expense',
            counterparty,
            category,
            transactionType: 'operating',
            isCapitalized: false,
            needsClarification: false,
        });
    }
    
    return transactions;
};

// --- Smart PDF Parser ---
const parsePdfTextSmart = (pdfText: string): Transaction[] => {
    // Определяем тип банка по характерным признакам
    if (pdfText.includes('Kaspi Bank') || pdfText.includes('KASPI')) {
        return parseKaspiPdfText(pdfText);
    } else if (pdfText.includes('Halyk Bank') || pdfText.includes('HALYK')) {
        return parseHalykPdfText(pdfText);
    } else {
        // Пробуем универсальный парсер
        return parseKaspiPdfText(pdfText);
    }
};

export const processAndCategorizeTransactions = async (file: File, _profile: BusinessProfile | null, onProgress: (msg: string) => void): Promise<Transaction[]> => {
    onProgress('Начинаем обработку файла...');

    let rawText: string;
    let transactions: Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'>[] = [];

    try {
        if (file.name.toLowerCase().endsWith('.csv')) {
            onProgress('Обрабатываем CSV файл...');
            rawText = await file.text();
            transactions = parseCSV(rawText);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
            onProgress('Обрабатываем PDF файл...');
            const arrayBuffer = await file.arrayBuffer();
            
            // Динамический импорт pdfjs-dist
            const pdfjsLib = await import('pdfjs-dist');
            
            // Настройка worker
            if (typeof window !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
            }
            
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            rawText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                onProgress(`Обрабатываем страницу ${i} из ${pdf.numPages}...`);
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                rawText += pageText + '\n';
            }
            
            // Отладка: Выводим сырой текст в консоль
            console.log('Raw PDF Text:', rawText);
            
            transactions = parsePdfTextSmart(rawText);
        } else {
            throw new Error('Неподдерживаемый формат файла. Поддерживаются только CSV и PDF файлы.');
        }

        onProgress(`Найдено ${transactions.length} транзакций. Категоризируем...`);

        // Отладка: Выводим извлеченные транзакции в консоль
        console.log('Extracted Transactions:', transactions);

        // Категоризация транзакций
        const finalTransactions: Transaction[] = transactions.map(tx => {
            const defaultCategory = determineCategory(tx.description, tx.counterparty);
            
            // Определяем тип транзакции
            let transactionType: 'operating' | 'investing' | 'financing' = 'operating';
            let isCapitalized = false;
            
            if (defaultCategory === 'Оборудование') {
                transactionType = 'investing';
                isCapitalized = true;
            } else if (['Получение кредита', 'Погашение кредита', 'Выплата дивидендов', 'Взнос учредителя'].includes(defaultCategory)) {
                transactionType = 'financing';
            }

            return {
                ...tx,
                category: defaultCategory,
                counterparty: tx.counterparty || '',
                transactionType,
                isCapitalized,
                needsClarification: false,
            };
        });

        // Отладка: Выводим финальные транзакции после категоризации
        console.log('Categorized Transactions:', finalTransactions);

        onProgress('Обработка завершена!');
        return finalTransactions;

    } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        throw new Error(`Ошибка при обработке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
};

const getMonthYear = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { month: 'short', year: 'numeric' });
};

export const generateFinancialReport = (transactions: Transaction[]): FinancialReport => {
    const monthlySummary: {
        [key: string]: {
            pnlRevenue: number,
            pnlOpEx: number,
            cashInflow: number,
            cashOutflow: number,
        }
    } = {};
    const expenseByCategory: { [key: string]: number } = {};
    let totalEquipmentCost = 0;

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTransactions.length === 0) {
        const emptyReport: FinancialReport = {
            pnl: { totalRevenue: 0, totalOperatingExpenses: 0, depreciation: 0, operatingProfit: 0, netProfit: 0, monthlyData: [], expenseByCategory: [] },
            cashFlow: { netCashFlow: 0, operatingActivities: 0, investingActivities: 0, financingActivities: 0, monthlyData: [] },
            balanceSheet: {
                assets: { cash: 0, receivables: 0, equipment: 0, accumulatedDepreciation: 0, netEquipment: 0, totalAssets: 0 },
                liabilities: { payables: 0, totalLiabilities: 0 },
                equity: { retainedEarnings: 0, totalEquity: 0 },
                totalLiabilitiesAndEquity: 0,
            },
            counterpartyReport: [],
            debtReport: { receivables: [], payables: [], totalReceivables: 0, totalPayables: 0 },
        };
        return emptyReport;
    }

    sortedTransactions.forEach(tx => {
        if (tx.type === 'expense' && tx.isCapitalized) {
            totalEquipmentCost += tx.amount;
        }
    });

    const firstMonthDate = new Date(sortedTransactions[0].date);
    const lastMonthDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    const monthsForDepreciation = (lastMonthDate.getFullYear() - firstMonthDate.getFullYear()) * 12 + (lastMonthDate.getMonth() - firstMonthDate.getMonth()) + 1;
    const totalMonthlyDepreciation = totalEquipmentCost > 0 ? totalEquipmentCost / 36 : 0; // Straight-line over 3 years

    sortedTransactions.forEach(tx => {
        const month = getMonthYear(tx.date);
        if (!monthlySummary[month]) {
            monthlySummary[month] = { pnlRevenue: 0, pnlOpEx: 0, cashInflow: 0, cashOutflow: 0 };
        }

        if (tx.type === 'income') {
            monthlySummary[month].cashInflow += tx.amount;
            if (tx.transactionType === 'operating') {
                monthlySummary[month].pnlRevenue += tx.amount;
            }
        } else { // Expense
            monthlySummary[month].cashOutflow += tx.amount;
            if (tx.transactionType === 'operating' && !tx.isCapitalized) {
                monthlySummary[month].pnlOpEx += tx.amount;
                expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
            }
        }
    });

    const totalDepreciation = totalMonthlyDepreciation * monthsForDepreciation;
    if (totalDepreciation > 0) {
        expenseByCategory['Амортизация'] = totalDepreciation;
    }

    const sortedMonths = Object.keys(monthlySummary).sort((a, b) => {
        const [monthA, yearA] = a.split(' г.');
        const [monthB, yearB] = b.split(' г.');
        const dateA = new Date(`${yearA} ${monthA} 1`);
        const dateB = new Date(`${yearB} ${monthB} 1`);
        return dateA.getTime() - dateB.getTime();
    });

    // --- P&L Calculation ---
    const pnlMonthlyData = sortedMonths.map(month => {
        const { pnlRevenue, pnlOpEx } = monthlySummary[month];
        const pnlTotalExpense = pnlOpEx + totalMonthlyDepreciation;
        return { month, 'Доход': pnlRevenue, 'Расход': pnlTotalExpense, 'Прибыль': pnlRevenue - pnlTotalExpense };
    });

    const totalRevenue = pnlMonthlyData.reduce((sum, d) => sum + d['Доход'], 0);
    const totalOperatingExpenses = sortedTransactions
        .filter(tx => tx.transactionType === 'operating' && tx.type === 'expense' && !tx.isCapitalized)
        .reduce((sum, tx) => sum + tx.amount, 0);

    const netProfit = totalRevenue - totalOperatingExpenses - totalDepreciation;

    const pnl: PnLData = {
        totalRevenue,
        totalOperatingExpenses,
        depreciation: totalDepreciation,
        operatingProfit: totalRevenue - totalOperatingExpenses,
        netProfit,
        monthlyData: pnlMonthlyData,
        expenseByCategory: Object.entries(expenseByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    };

    // --- Cash Flow Calculation ---
    const cashFlowMonthlyData = sortedMonths.map(month => {
        const { cashInflow, cashOutflow } = monthlySummary[month];
        return { month, 'Поступления': cashInflow, 'Выбытия': cashOutflow, 'Чистый поток': cashInflow - cashOutflow };
    });
    const operatingActivities = transactions.reduce((sum, tx) => tx.transactionType === 'operating' ? sum + (tx.type === 'income' ? tx.amount : -tx.amount) : sum, 0);
    const investingActivities = transactions.reduce((sum, tx) => tx.transactionType === 'investing' ? sum + (tx.type === 'income' ? tx.amount : -tx.amount) : sum, 0);
    const financingActivities = transactions.reduce((sum, tx) => tx.transactionType === 'financing' ? sum + (tx.type === 'income' ? tx.amount : -tx.amount) : sum, 0);

    const cashFlow: CashFlowData = {
        operatingActivities,
        investingActivities,
        financingActivities,
        netCashFlow: operatingActivities + investingActivities + financingActivities,
        monthlyData: cashFlowMonthlyData
    };

    // --- Debt Report Calculation ---
    const receivablesSummary: { [key: string]: number } = {};
    const payablesSummary: { [key: string]: number } = {};

    transactions.forEach(tx => {
        const counterparty = tx.counterparty?.trim();
        if (!counterparty) return;

        if (tx.category === 'Выдача займа') { // You give a loan -> someone owes you
            receivablesSummary[counterparty] = (receivablesSummary[counterparty] || 0) + tx.amount;
        } else if (tx.category === 'Возврат долга') { // Someone pays you back for a loan you gave
            receivablesSummary[counterparty] = (receivablesSummary[counterparty] || 0) - tx.amount;
        } else if (tx.category === 'Получение кредита') { // You receive a loan -> you owe someone
            payablesSummary[counterparty] = (payablesSummary[counterparty] || 0) + tx.amount;
        } else if (tx.category === 'Погашение кредита') { // You pay back a loan you received
            payablesSummary[counterparty] = (payablesSummary[counterparty] || 0) - tx.amount;
        }
    });

    const debtReport: DebtReport = {
        receivables: Object.entries(receivablesSummary).map(([counterparty, amount]) => ({ counterparty, amount })).filter(d => Math.round(d.amount) > 0),
        payables: Object.entries(payablesSummary).map(([counterparty, amount]) => ({ counterparty, amount })).filter(d => Math.round(d.amount) > 0),
        totalReceivables: Object.values(receivablesSummary).reduce((sum, amount) => sum + amount, 0),
        totalPayables: Object.values(payablesSummary).reduce((sum, amount) => sum + amount, 0),
    };

    // --- Balance Sheet Calculation ---
    const totalOwnerContributions = transactions
        .filter(tx => tx.category === 'Взнос учредителя')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDividends = transactions
        .filter(tx => tx.category === 'Выплата дивидендов')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const retainedEarnings = netProfit - totalDividends;
    const totalEquity = retainedEarnings + totalOwnerContributions;

    const totalAssets = cashFlow.netCashFlow + debtReport.totalReceivables + totalEquipmentCost - totalDepreciation;
    const totalLiabilities = debtReport.totalPayables;

    const balanceSheet: BalanceSheetData = {
        assets: {
            cash: cashFlow.netCashFlow,
            receivables: debtReport.totalReceivables,
            equipment: totalEquipmentCost,
            accumulatedDepreciation: totalDepreciation,
            netEquipment: totalEquipmentCost - totalDepreciation,
            totalAssets: totalAssets,
        },
        liabilities: {
            payables: totalLiabilities,
            totalLiabilities: totalLiabilities
        },
        equity: {
            retainedEarnings: totalEquity, // This is a simplified view. True RE is cumulative.
            totalEquity: totalEquity,
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };

    // --- Counterparty Report Calculation ---
    // Исключаем внутренние/технические контрагенты
    const internalCounterparties = [
        'kaspi депозит', 'kaspi банкомат', 'kaspi терминал', 'другая карта', 'kaspi bank', 
        'отбасы банк', 'отбасы банк. пополнение депозита', 'наличные', 'пополнение', 'снятие', 
        'перевод', 'вклад', 'депозит', 'банкомат', 'терминал', 'прочее', 'commission', 
        'комиссия', 'налог', 'штраф', 'пеня', 'оплата', 'погашение', 'получение', 'выдача', 
        'взнос', 'дивиденд', 'сбережения', 'накопления', 'личные', 'доход', 'расход', 
        'поступление', 'поступления', 'выручка', 'revenue', 'income', 'expense', 
        'операционный доход', 'операционные расходы', 'прочие поступления', 'прочее', 'other', 
        'прочие', 'прочие расходы', 'прочие доходы', 'прочие операции', 'прочие платежи', 
        'прочие списания', 'прочие зачисления', 'прочие переводы', 'прочие пополнения', 
        'прочие снятия', 'прочие комиссии', 'прочие налоги', 'прочие штрафы', 'прочие пени'
    ];

    const counterpartySummary: { [key: string]: { income: number, expense: number, net: number } } = {};

    transactions.forEach(tx => {
        const counterparty = tx.counterparty?.trim();
        if (!counterparty || internalCounterparties.some(internal => 
            counterparty.toLowerCase().includes(internal.toLowerCase()))) {
            return;
        }

        if (!counterpartySummary[counterparty]) {
            counterpartySummary[counterparty] = { income: 0, expense: 0, net: 0 };
        }

        if (tx.type === 'income') {
            counterpartySummary[counterparty].income += tx.amount;
            counterpartySummary[counterparty].net += tx.amount;
        } else {
            counterpartySummary[counterparty].expense += tx.amount;
            counterpartySummary[counterparty].net -= tx.amount;
        }
    });

    const counterpartyReport = Object.entries(counterpartySummary)
        .map(([counterparty, data]) => ({
            name: counterparty,
            income: data.income,
            expense: data.expense,
            balance: data.net
        }))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    return {
        pnl,
        cashFlow,
        balanceSheet,
        counterpartyReport,
        debtReport
    };
};