import { Transaction, PnLData, CashFlowData, BalanceSheetData, FinancialReport, BusinessProfile, DebtReport } from '../types';
import { formatLocalDate } from '../utils/dateUtils';
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
    'Магазины': ['магазин', 'small', 'fix price', 'маркет', 'modnopvl', 'sabina', 'овощифрукты', 'спортмастер', 'chipa shop', 'sabina shop', 'pegas'],
    'Кафе и рестораны': ['кафе', 'ресторан', 'pub', 'суши', 'chechil', 'chekhov', 'magic villag', 'бала парк'],
    'Развлечения': ['кино', 'аттракцион', 'парк', 'билеты', '7 д', 'leone d\'oro', 'macdac', 'призовой аттракцион', 'irtysh cinema'],
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

// Функция для автокатегоризации долгов при импорте
export const detectDebtCategory = (description: string, counterparty: string, amount: number): { isDebt: boolean; category: string; type: 'income' | 'expense' } => {
    const text = `${description} ${counterparty}`.toLowerCase();
    
    // Ключевые слова для определения долгов
    const debtKeywords = {
        // Выдача займов (дебиторская задолженность)
        loanGiven: ['займ выдан', 'выдача займа', 'кредит выдан', 'долг выдан', 'заем выдан'],
        // Получение кредитов (кредиторская задолженность)
        loanReceived: ['кредит получен', 'займ получен', 'заем получен', 'кредитование'],
        // Возврат долгов
        debtRepayment: ['возврат долга', 'возврат займа', 'погашение долга', 'возврат кредита'],
        // Погашение кредитов
        creditRepayment: ['погашение кредита', 'оплата кредита', 'выплата кредита']
    };
    
    // Проверяем выдачу займов
    for (const keyword of debtKeywords.loanGiven) {
        if (text.includes(keyword)) {
            return {
                isDebt: true,
                category: 'Выдача займа',
                type: 'expense'
            };
        }
    }
    
    // Проверяем получение кредитов
    for (const keyword of debtKeywords.loanReceived) {
        if (text.includes(keyword)) {
            return {
                isDebt: true,
                category: 'Получение кредита',
                type: 'income'
            };
        }
    }
    
    // Проверяем возврат долгов
    for (const keyword of debtKeywords.debtRepayment) {
        if (text.includes(keyword)) {
            return {
                isDebt: true,
                category: 'Возврат долга',
                type: 'income'
            };
        }
    }
    
    // Проверяем погашение кредитов
    for (const keyword of debtKeywords.creditRepayment) {
        if (text.includes(keyword)) {
            return {
                isDebt: true,
                category: 'Погашение кредита',
                type: 'expense'
            };
        }
    }
    
    // Дополнительная логика на основе суммы и контрагента
    // Если сумма большая и контрагент - физическое лицо, возможно это займ
    if (amount > 100000 && counterparty && !counterparty.toLowerCase().includes('банк')) {
        // Проверяем, есть ли в описании слова, указывающие на займ
        if (text.includes('займ') || text.includes('кредит') || text.includes('долг')) {
            return {
                isDebt: true,
                category: amount > 0 ? 'Выдача займа' : 'Получение кредита',
                type: amount > 0 ? 'expense' : 'income'
            };
        }
    }
    
    return {
        isDebt: false,
        category: '',
        type: 'expense'
    };
};

// --- Вспомогательная функция для выделения контрагента ---
function extractCounterparty(description: string, operation: string = ""): string {
    const raw = `${description} ${operation}`;
    const text = raw.toLowerCase();
    
    // Коммерсант (часто в выписках Halyk)
    const merchMatch = raw.match(/коммерсанта\s+([A-Za-zА-Яа-яЁё0-9"'\-\.\s]{2,})/i);
    if (merchMatch) {
        let name = merchMatch[1].trim().replace(/\s{2,}/g, ' ');
        // обрезаем хвостовые служебные слова, номера карт и IBAN
        name = name
            .replace(/\s*(операция|перевод|касса|shop|magazin|KZ\d+|\d{6}\*+\d{4})\s*$/i, '')
            .replace(/\d{6}\*\*\*\*\*\*\d{4}/g, '')
            .replace(/KZ\d{10,}/g, '')
            .split('  ')[0]
            .trim();
        return name || 'Неизвестный контрагент';
    }
    
    // Переводы между своими счетами
    if (text.includes('на kaspi депозит')) return 'Kaspi Депозит';
    if (text.includes('с kaspi депозита')) return 'Kaspi Депозит';
    if (text.includes('в kaspi банкомате')) return 'Kaspi Банкомат';
    if (text.includes('в kaspi терминале')) return 'Kaspi Терминал';
    if (text.includes('отбасы банк. пополнение депозита')) return 'Отбасы Банк';
    if (text.includes('с карты другого банка')) return 'Другая карта';
    if (text.includes('перевод на другую карту')) return 'Другая карта';
    
    // Специальные случаи для Halyk
    if (text.includes('предстоящие налоговые платежи')) return 'Налоговая служба';
    
    // Известные контрагенты из скриншотов
    const knownMerchants = [
        'CHIPA SHOP', 'PEGAS', 'IRTYSH CINEMA', 'BALTABAEVA A M',
        'SABINA SHOP', 'DETVOR', 'СHIPA SHOP', 'САБИНА SHOP'
    ];
    
    for (const merchant of knownMerchants) {
        if (text.includes(merchant.toLowerCase())) {
            return merchant;
        }
    }
    
    // Магазины, ИП, TOO, компании
    const match = description.match(/(ип\s+[\w\s.]+|ip\s+[\w\s.]+|too\s+[\w\s.]+|тoo\s+[\w\s.]+|магазин\s+[\w\s.]+|magazin\s+[\w\s.]+|кафе\s+[\w\s.]+|ресторан\s+[\w\s.]+|[A-ZА-ЯЁ][a-zа-яё]+\s+[A-ZА-ЯЁ][a-zа-яё.]+)/i);
    if (match) return match[0].trim();
    
    // Если есть имя (например, "Иван И.", "Гульмира М.")
    const nameMatch = description.match(/[А-ЯЁA-Z][а-яёa-z]+\s+[А-ЯЁA-Z][а-яёa-z.]+/);
    if (nameMatch) return nameMatch[0].trim();
    
    // Если есть короткое слово (бренд, сервис) - исключаем служебные слова
    const wordMatch = description.match(/^([A-Za-zА-Яа-яЁё0-9_\-\.]+)(\s|$)/);
    if (wordMatch && !/(операция|оплаты|коммерсанта|перевод)/i.test(wordMatch[1])) {
        return wordMatch[1].trim();
    }
    
    // По умолчанию
    return '';
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

        // Формируем локальную дату YYYY-MM-DD без смещения часового пояса
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;

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
    console.log('Kaspi PDF Parser: Начинаем парсинг');
    console.log('Исходный текст (первые 500 символов):', pdfText.substring(0, 500));
    
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
    
    console.log(`Разбито на ${lines.length} строк для анализа`);
    console.log('Первые 10 строк:', lines.slice(0, 10));
    
    let parsing = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Обрабатываем строку ${i + 1}:`, line);
        
        // Игнорируем заголовки и служебные строки
        if (line.includes('ВЫПИСКА') || 
            line.includes('Краткое содержание') || 
            line.includes('Доступно на') || 
            line.includes('Валюта счета') ||
            line.includes('Дата   Сумма   Операция   Детали') ||
            line.includes('Сумма заблокирована')) {
            if (line.includes('Дата   Сумма   Операция   Детали')) {
                parsing = true;
                console.log('Начинаем парсинг транзакций');
            }
            continue;
        }
        
        // Если строка содержит дату в формате dd.mm.yy, то это транзакция
        const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})/);
        if (!dateMatch || !parsing) continue;
        
        console.log('Найдена дата:', dateMatch[1]);
        
        // Используем более гибкие паттерны для извлечения сумм
        // Ищем все числа с форматом суммы (могут быть разные варианты)
        const amountPatterns = [
            // Паттерн 1: -12 345,67 ₸ или +12 345,67 ₸
            /([+-]?\s*\d+(?:\s+\d+)*(?:,\d{2})?\s*₸)/g,
            // Паттерн 2: -12345,67 ₸
            /([+-]?\s*\d+(?:,\d{2})?\s*₸)/g,
            // Паттерн 3: просто числа с запятой
            /([+-]?\s*\d+(?:\s+\d+)*,\d{2})/g,
            // Паттерн 4: числа без знаков валюты
            /([+-]?\s*\d+(?:\s+\d+)*(?:,\d{2})?)/g
        ];
        
        let amounts: string[] = [];
        for (const pattern of amountPatterns) {
            const matches = line.match(pattern);
            if (matches && matches.length > 0) {
                amounts = matches;
                console.log(`Найдены суммы по паттерну:`, matches);
                break;
            }
        }
        
        if (amounts.length === 0) {
            console.log('Суммы не найдены в строке');
            continue;
        }
        
        // Берем первую найденную сумму как основную
        const amountStr = amounts[0];
        console.log('Используем сумму:', amountStr);
        
        // Парсим дату
        const [day, month, yearStr] = dateMatch[1].split('.');
        const year = parseInt(yearStr) < 50 ? 2000 + parseInt(yearStr) : 1900 + parseInt(yearStr);
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) {
            console.log('Неверная дата:', dateMatch[1]);
            continue;
        }
        
        // Парсим сумму
        const cleanAmountStr = amountStr
            .replace(/\s/g, '') // убираем все пробелы
            .replace('₸', '') // убираем символ валюты
            .replace(',', '.'); // заменяем запятую на точку
        
        console.log('Очищенная строка суммы:', cleanAmountStr);
        
        const amount = parseFloat(cleanAmountStr);
        if (isNaN(amount)) {
            console.log('Не удалось распарсить сумму:', cleanAmountStr);
            continue;
        }
        
        console.log('Распарсенная сумма:', amount);
        
        // Извлекаем описание (все что после даты и суммы)
        let description = line
            .replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '') // убираем дату
            .replace(/[+-]?\s*\d+(?:\s+\d+)*(?:,\d{2})?\s*₸?/g, '') // убираем все суммы
            .replace(/\s+/g, ' ') // нормализуем пробелы
            .trim();
        
        // Если описание пустое, пытаемся взять из следующей строки
        if (!description && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (!nextLine.match(/^\d{2}\.\d{2}\.\d{2}/)) { // если следующая строка не начинается с даты
                description = nextLine.trim();
            }
        }
        
        if (!description) {
            description = 'Операция';
        }
        
        console.log('Извлеченное описание:', description);
        
        // Определяем операцию и детали для совместимости
        const operationMatch = description.match(/^([\wА-Яа-яЁё\s]+)/);
        const operation = operationMatch ? operationMatch[1].trim() : 'Операция';
        const details = description.replace(operation, '').trim() || '';
        
        const counterparty = extractCounterparty(description, operation);
        const category = determineCategory(description, counterparty, operation);
        
        const tx = {
            id: `kaspi_${Date.now()}_${transactions.length}`,
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'income' as 'income' : 'expense' as 'expense',
            counterparty,
            category,
            transactionType: 'operating' as 'operating',
            isCapitalized: false,
            needsClarification: false,
        };
        
        console.log('Создана транзакция:', tx);
        transactions.push(tx);
    }
    
    console.log('Итоговый результат парсинга Kaspi Банка:', {
        totalTransactions: transactions.length,
        transactions: transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            counterparty: t.counterparty,
            category: t.category
        }))
    });
    
    return transactions;
};

// --- Halyk PDF Parser (Improved based on Kaspi approach) ---
export const parseHalykPdfText = (pdfText: string): Transaction[] => {
    console.log('\n=== ПАРСЕР HALYK PDF ===');
    console.log('Исходный текст (первые 500 символов):', pdfText.substring(0, 500));
    
    // Предварительная обработка текста
    let processedText = pdfText
        .replace(/\r/g, '')
        .replace(/[\u2212\u2013\u2014]/g, '-')
        .replace(/[\t\u00A0]+/g, ' ')
        .trim();
    
    console.log('Обработанный текст (первые 1000 символов):', processedText.substring(0, 1000));
    
    // Пробуем разные методы парсинга в порядке приоритета
    let transactions: Transaction[] = [];
    
    // 1. Табличный парсер для стандартной выписки
    transactions = parseHalykTableData(processedText);
    if (transactions.length > 0) {
        console.log(`Табличный парсер нашел ${transactions.length} транзакций`);
        return transactions;
    }
    
    // 2. Структурированный парсер
    transactions = parseHalykStructuredData(processedText);
    if (transactions.length > 0) {
        console.log(`Структурированный парсер нашел ${transactions.length} транзакций`);
        return transactions;
    }
    
    // 3. Альтернативный парсер
    transactions = parseHalykAlternative(processedText);
    if (transactions.length > 0) {
        console.log(`Альтернативный парсер нашел ${transactions.length} транзакций`);
        return transactions;
    }
    
    // 4. Legacy парсер
    transactions = parseHalykPdfTextLegacy(processedText);
    console.log(`Legacy парсер нашел ${transactions.length} транзакций`);
    
    return transactions;
};

// Новый табличный парсер для стандартной выписки Halyk банка
function parseHalykTableData(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    console.log('\n=== ТАБЛИЧНЫЙ ПАРСЕР HALYK ===');
    
    // Ищем таблицу транзакций по заголовкам
    const tableHeaderPattern = /Дата\s+проведения\s+операции\s+Дата\s+обработки\s+операции\s+Описание\s+операции\s+Сумма\s+операции\s+Валюта\s+Приход\s+Расход\s+Остаток\s+№\s+корреспондента/i;
    const headerMatch = text.search(tableHeaderPattern);
    
    if (headerMatch === -1) {
        console.log('Заголовок таблицы не найден');
        return transactions;
    }
    
    // Извлекаем текст после заголовка
    const tableText = text.substring(headerMatch);
    console.log('Текст таблицы (первые 2000 символов):', tableText.substring(0, 2000));
    
    // Паттерн для строк транзакций
    // Формат: дата_операции дата_обработки описание сумма_операции валюта приход расход остаток номер_корр
    const rowPattern = /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+([^\d-]+?)\s+(-?[\d\s]+,\d{2})\s+KZT\s+([\d\s]*,?\d*)\s+(-?[\d\s]+,\d{2})\s+([\d\s]+,\d{2})\s+(KZ\d+|\d{6}\*+\d{4})/g;
    
    let match;
    let transactionCount = 0;
    
    while ((match = rowPattern.exec(tableText)) !== null) {
        transactionCount++;
        console.log(`Найдена строка транзакции ${transactionCount}:`, match);
        
        const [
            fullMatch,
            operationDate,
            processingDate,
            description,
            operationAmount,
            incomeAmount,
            expenseAmount,
            balance,
            accountNumber
        ] = match;
        
        try {
            const transaction = parseHalykTableRow(
                operationDate,
                description.trim(),
                operationAmount.trim(),
                incomeAmount.trim(),
                expenseAmount.trim()
            );
            
            if (transaction) {
                transactions.push(transaction);
                console.log('Создана транзакция из таблицы:', transaction);
            }
        } catch (error) {
            console.log('Ошибка при парсинге строки таблицы:', error);
        }
    }
    
    console.log(`Табличный парсер нашел ${transactions.length} транзакций`);
    return transactions;
}

// Парсер для отдельной строки таблицы
function parseHalykTableRow(
    operationDate: string,
    description: string,
    operationAmount: string,
    incomeAmount: string,
    expenseAmount: string
): Transaction | null {
    // Парсим дату
    const [day, month, year] = operationDate.split('.');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(dateObj.getTime())) {
        console.log('Не удалось распарсить дату:', operationDate);
        return null;
    }
    
    // Парсим суммы
    const parseAmount = (amountStr: string): number => {
        if (!amountStr || amountStr.trim() === '') return 0;
        return parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
    };
    
    const incomeVal = parseAmount(incomeAmount);
    const expenseVal = Math.abs(parseAmount(expenseAmount));
    const operationVal = parseAmount(operationAmount);
    
    console.log('Распарсенные суммы:', { incomeVal, expenseVal, operationVal });
    
    // Определяем тип операции и сумму
    let txType: 'income' | 'expense';
    let amount: number;
    
    if (incomeVal > 0) {
        txType = 'income';
        amount = incomeVal;
    } else if (expenseVal > 0) {
        txType = 'expense';
        amount = expenseVal;
    } else {
        // Используем сумму операции
        amount = Math.abs(operationVal);
        txType = operationVal < 0 ? 'expense' : 'income';
    }
    
    // Очищаем описание
    let cleanDescription = description
        .replace(/Операция оплаты у\s+коммерсанта\s*/i, '')
        .replace(/Операция оплаты у\s*/i, '')
        .replace(/Операция оплаты\s*/i, '')
        .replace(/коммерсанта\s*/i, '')
        .replace(/Операционная\s*/i, '')
        .trim();
    
    if (!cleanDescription) {
        cleanDescription = 'Операция';
    }
    
    // Извлекаем контрагента
    const counterparty = extractCounterparty(cleanDescription);
    
    // Определяем категорию
    const category = determineCategory(cleanDescription, counterparty);
    
    return {
        id: `halyk_table_${Date.now()}_${Math.random()}`,
        date: formatLocalDate(dateObj),
        description: cleanDescription,
        amount,
        type: txType,
        counterparty,
        category,
        transactionType: 'operating',
        isCapitalized: false,
        needsClarification: false,
    };
}

// Функция для парсинга отдельной строки транзакции Халык банка
function parseHalykTransactionLine(line: string): Transaction | null {
    console.log('Парсим строку транзакции:', line);
    
    // Ищем дату в начале строки
    const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (!dateMatch) {
        console.log('Дата не найдена');
        return null;
    }
    
    console.log('Найдена дата:', dateMatch[1]);
    
    // Ищем суммы в строке - только значимые суммы (больше 100 тенге или с десятичными)
    const amountPattern = /([+-]?\s*\d+(?:\s+\d+)*(?:,\d{2})?(?:\s*(?:KZT|₸))?)/g;
    const amounts = line.match(amountPattern) || [];
    
    // Фильтруем суммы - исключаем маленькие целые числа (вероятно номера или коды)
    const validAmounts = amounts.filter(amountStr => {
        const cleanAmount = amountStr.replace(/\s/g, '').replace(/KZT|₸/g, '').replace(',', '.');
        const amount = parseFloat(cleanAmount);
        // Принимаем суммы больше 100 или с десятичными знаками
        return !isNaN(amount) && (Math.abs(amount) >= 100 || cleanAmount.includes('.'));
    });
    
    if (validAmounts.length === 0) {
        console.log('Значимые суммы не найдены в строке');
        return null;
    }
    
    console.log('Найдены значимые суммы:', validAmounts);
    
    // Определяем тип и сумму транзакции
    let transactionAmount = 0;
    let txType: 'income' | 'expense' = 'expense';
    
    // Ищем в строке колонки прихода/расхода
    const hasIncomeKeywords = /приход|поступление|\+/i.test(line);
    const hasExpenseKeywords = /расход|списание|\-/i.test(line);
    
    for (const amountStr of validAmounts) {
        const cleanAmountStr = amountStr
            .replace(/\s/g, '')
            .replace(/KZT|₸/g, '')
            .replace(',', '.');
        
        const amount = parseFloat(cleanAmountStr);
        if (!isNaN(amount) && amount !== 0) {
            transactionAmount = Math.abs(amount);
            
            // Определяем тип по знаку или контексту
            if (amount > 0 || hasIncomeKeywords) {
                txType = 'income';
            } else if (amount < 0 || hasExpenseKeywords) {
                txType = 'expense';
            }
            
            console.log('Используем сумму:', amountStr, 'Тип:', txType);
            break;
        }
    }
    
    if (transactionAmount === 0) {
        console.log('Не удалось определить сумму транзакции');
        return null;
    }
    
    // Парсим дату
    const [day, month, year] = dateMatch[1].split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) {
        console.log('Неверная дата:', dateMatch[1]);
        return null;
    }
    
    // Извлекаем описание
    let description = line
        .replace(/^\d{2}\.\d{2}\.\d{4}\s*/, '') // убираем первую дату
        .replace(/\d{2}\.\d{2}\.\d{4}\s*/, '') // убираем вторую дату если есть
        .replace(/[+-]?\s*\d+(?:\s+\d+)*(?:,\d{2})?\s*(?:KZT|₸)?/g, '') // убираем суммы
        .replace(/KZ\d+/g, '') // убираем номера счетов
        .replace(/\s+/g, ' ')
        .trim();
    
    if (!description) {
        description = 'Операция';
    }
    
    console.log('Извлеченное описание:', description);
    
    const counterparty = extractCounterparty(description, '');
    const category = determineCategory(description, counterparty, '');
    
    const tx = {
        id: `halyk_${Date.now()}_${Math.random()}`,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        description,
        amount: transactionAmount,
        type: txType,
        counterparty,
        category,
        transactionType: 'operating' as 'operating',
        isCapitalized: false,
        needsClarification: false,
    };
    
    console.log('Создана транзакция:', tx);
    return tx;
}
 
 // Вспомогательные функции для парсинга разных форматов
 function parseTransactionPdfTable(dateProcessed: string, description: string, income: string, expense: string, cardNumber: string): Transaction | null {
     // Улучшенный парсинг даты с проверкой различных форматов
     let dateObj: Date;
     let formattedDate: string;
     
     try {
         // Проверяем формат DD.MM.YYYY
         if (dateProcessed.includes('.')) {
             const [day, month, year] = dateProcessed.split('.');
             dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
             formattedDate = dateProcessed;
         } else {
             // Пробуем другие форматы
             dateObj = new Date(dateProcessed);
             formattedDate = dateObj.toLocaleDateString('ru-RU');
         }
         
         if (isNaN(dateObj.getTime())) {
             console.log('Не удалось распарсить дату:', dateProcessed);
             return null;
         }
     } catch (error) {
         console.log('Ошибка при парсинге даты:', dateProcessed, error);
         return null;
     }
 
     // Определяем сумму транзакции с улучшенной обработкой
     let transactionAmount = 0;
     let txType: 'income' | 'expense' = 'expense';
     
     try {
         if (income && income !== '0,00' && income !== '0.00' && income !== '0') {
             transactionAmount = parseFloat(income.replace(/\s/g, '').replace(',', '.'));
             txType = 'income';
         } else if (expense && expense !== '0,00' && expense !== '0.00' && expense !== '0') {
             transactionAmount = parseFloat(expense.replace(/\s/g, '').replace(',', '.'));
             txType = 'expense';
         }
         
         if (isNaN(transactionAmount) || transactionAmount === 0) {
             console.log('Не удалось распарсить сумму:', income, expense);
             return null;
         }
     } catch (error) {
         console.log('Ошибка при парсинге суммы:', income, expense, error);
         return null;
     }
 
     // Определяем категорию и контрагента
     const counterparty = extractCounterparty(description, cardNumber || '');
     const category = determineCategory(description, counterparty);
 
     return {
          id: `${formattedDate}_${Math.random().toString(36).substr(2, 9)}`,
          date: formattedDate,
          description: description.trim(),
          amount: txType === 'expense' ? -Math.abs(transactionAmount) : Math.abs(transactionAmount),
          type: txType,
          category: category,
          counterparty: counterparty,
          transactionType: 'operating',
          isCapitalized: false
      };
 }
 
 function parseTransactionFromInterface(date: string, description: string, counterparty: string, amountStr: string, category: string): Transaction | null {
     // Парсим дату
     const [day, month, year] = date.split('.');
     const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     
     if (isNaN(dateObj.getTime())) {
         console.log('Не удалось распарсить дату:', date);
         return null;
     }
 
     // Улучшенный парсинг суммы с обработкой формата "+-1 350 ₸"
     let amount = 0;
     let txType: 'income' | 'expense' = 'expense';
     
     try {
         // Убираем символы валюты и лишние пробелы
         let cleanAmount = amountStr.replace(/[₸\s]/g, '');
         
         // Обрабатываем формат "+-число"
         if (cleanAmount.startsWith('+-')) {
             cleanAmount = cleanAmount.substring(2);
             txType = 'expense';
         } else if (cleanAmount.startsWith('+')) {
             cleanAmount = cleanAmount.substring(1);
             txType = 'income';
         } else if (cleanAmount.startsWith('-')) {
             cleanAmount = cleanAmount.substring(1);
             txType = 'expense';
         } else {
             // Определяем по знаку числа
             const numValue = parseFloat(cleanAmount.replace(',', '.'));
             txType = numValue < 0 ? 'expense' : 'income';
         }
         
         // Парсим число
         cleanAmount = cleanAmount.replace(/[^\d,]/g, '').replace(',', '.');
         amount = parseFloat(cleanAmount);
         
         if (isNaN(amount) || amount === 0) {
             console.log('Не удалось распарсить сумму:', amountStr);
             return null;
         }
         
         // ИСПРАВЛЕНИЕ: Корректируем знак суммы в соответствии с типом транзакции
         // Для расходов amount должен быть отрицательным, для доходов - положительным
         if (txType === 'expense' && amount > 0) {
             amount = -amount;
         } else if (txType === 'income' && amount < 0) {
             amount = Math.abs(amount);
         }
     } catch (error) {
         console.log('Ошибка при парсинге суммы:', amountStr, error);
         return null;
     }
 
     // Очищаем описание
     let cleanDescription = description.trim();
     if (!cleanDescription) {
         cleanDescription = 'Операция';
     }
 
     // Очищаем контрагента
     let cleanCounterparty = counterparty.trim();
     if (!cleanCounterparty) {
         cleanCounterparty = extractCounterparty(cleanDescription);
     }
 
     // Формируем финальное описание
     let finalDescription = cleanDescription;
     if (/перевод на другую карту/i.test(cleanDescription)) {
         finalDescription = 'Перевод на другую карту';
     } else if (cleanCounterparty && cleanCounterparty !== cleanDescription) {
         finalDescription = cleanDescription;
     }
 
     const finalCategory = category || determineCategory(finalDescription, cleanCounterparty);
 
     return {
         id: `halyk_${Date.now()}_${Math.random()}`,
         date: formatLocalDate(dateObj),
         description: finalDescription,
         amount,
         type: txType,
         counterparty: cleanCounterparty,
         category: finalCategory,
         transactionType: 'operating',
         isCapitalized: false,
         needsClarification: false,
     };
 }
 
 function parseTransactionOriginal(operationDate: string, description: string, operationAmount: string, incomeAmount: string, expenseAmount: string): Transaction | null {
     // Парсим дату
     const [day, month, year] = operationDate.split('.');
     const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     
     if (isNaN(dateObj.getTime())) {
         console.log('Не удалось распарсить дату:', operationDate);
         return null;
     }
 
     // Парсим суммы
     const incomeVal = parseFloat(incomeAmount.replace(/\s/g, '').replace(',', '.')) || 0;
     const expenseVal = Math.abs(parseFloat(expenseAmount.replace(/\s/g, '').replace(',', '.')) || 0);
     const operationVal = parseFloat(operationAmount.replace(/\s/g, '').replace(',', '.'));
 
     // Определяем тип операции и сумму
     let txType: 'income' | 'expense';
     let amount: number;
     
     if (incomeVal > 0) {
         txType = 'income';
         amount = incomeVal;
     } else if (expenseVal > 0) {
         txType = 'expense';
         amount = expenseVal;
     } else {
         amount = Math.abs(operationVal);
         txType = operationVal < 0 ? 'expense' : 'income';
     }
 
     // Очищаем описание
     let cleanDescription = description.trim()
         .replace(/Операция оплаты у\s+коммерсанта\s*/i, '')
         .replace(/Операция оплаты у\s*/i, '')
         .replace(/Операция оплаты\s*/i, '')
         .replace(/коммерсанта\s*/i, '')
         .trim();
 
     if (!cleanDescription) {
         cleanDescription = 'Операция';
     }
 
     const counterparty = extractCounterparty(cleanDescription);
     
     let finalDescription = cleanDescription;
     if (/перевод на другую карту/i.test(cleanDescription)) {
         finalDescription = 'Перевод на другую карту';
     } else if (counterparty && counterparty !== cleanDescription) {
         finalDescription = `Оплата ${counterparty}`;
     }
 
     const category = determineCategory(finalDescription, counterparty);
 
     return {
         id: `halyk_${Date.now()}_${Math.random()}`,
         date: formatLocalDate(dateObj),
         description: finalDescription,
         amount,
         type: txType,
         counterparty,
         category,
         transactionType: 'operating',
         isCapitalized: false,
         needsClarification: false,
     };
 }
 
 function parseTransactionSimple(date: string, description: string, amountStr: string): Transaction | null {
     // Парсим дату
     const [day, month, year] = date.split('.');
     const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     
     if (isNaN(dateObj.getTime())) {
         console.log('Не удалось распарсить дату:', date);
         return null;
     }
 
     // Парсим сумму
     const cleanAmountStr = amountStr.replace(/\s/g, '').replace('₸', '').replace(',', '.');
     const amount = Math.abs(parseFloat(cleanAmountStr));
     
     if (isNaN(amount)) {
         console.log('Не удалось распарсить сумму:', amountStr);
         return null;
     }
 
     const txType: 'income' | 'expense' = amountStr.includes('-') ? 'expense' : 'income';
 
     let cleanDescription = description.trim();
     if (!cleanDescription) {
         cleanDescription = 'Операция';
     }
 
     const counterparty = extractCounterparty(cleanDescription);
     const category = determineCategory(cleanDescription, counterparty);
 
     return {
         id: `halyk_${Date.now()}_${Math.random()}`,
         date: formatLocalDate(dateObj),
         description: cleanDescription,
         amount,
         type: txType,
         counterparty,
         category,
         transactionType: 'operating',
         isCapitalized: false,
         needsClarification: false,
     };
 }
 
 // Новый парсер для структурированных данных Halyk
function parseHalykStructuredData(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    console.log('\n=== ПАРСЕР СТРУКТУРИРОВАННЫХ ДАННЫХ HALYK ===');
    
    // Ищем блоки транзакций, которые начинаются с номера
    // Паттерн: номер, дата, день недели, описание, тип, контрагент, сумма, категория
    const blockPattern = /(\d+)\s+(\d{2}\.\d{2}\.\d{4})\s+(\w+)\s+([^\n]+?)\s+Операционная\s+([^\n]+?)\s+([-+]?\d+[\s\d]*₸)\s+([^\n]+)/g;
    
    let match;
    while ((match = blockPattern.exec(text)) !== null) {
        const [, number, date, dayOfWeek, description, counterparty, amountStr, category] = match;
        
        console.log(`Найден блок ${number}:`, {
            date,
            description: description.trim(),
            counterparty: counterparty.trim(),
            amount: amountStr.trim(),
            category: category.trim()
        });
        
        try {
            const transaction = parseHalykStructuredTransaction(date, description.trim(), counterparty.trim(), amountStr.trim(), category.trim());
            if (transaction) {
                transactions.push(transaction);
                console.log('Создана транзакция:', transaction);
            }
        } catch (error) {
            console.log('Ошибка при парсинге блока:', error);
        }
    }
    
    console.log(`Структурированный парсер нашел ${transactions.length} транзакций`);
    return transactions;
}

// Парсер для отдельной структурированной транзакции
function parseHalykStructuredTransaction(date: string, description: string, counterparty: string, amountStr: string, categoryHint: string): Transaction | null {
    // Парсим дату
    const [day, month, year] = date.split('.');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(dateObj.getTime())) {
        console.log('Не удалось распарсить дату:', date);
        return null;
    }
    
    // Парсим сумму - убираем пробелы и извлекаем число
    const cleanAmountStr = amountStr.replace(/\s/g, '').replace('₸', '').replace(',', '.');
    const isNegative = cleanAmountStr.startsWith('-') || cleanAmountStr.startsWith('+');
    const amount = Math.abs(parseFloat(cleanAmountStr));
    
    if (isNaN(amount)) {
        console.log('Не удалось распарсить сумму:', amountStr);
        return null;
    }
    
    // Все операции в выписке Halyk - это расходы (expense)
    const txType: 'income' | 'expense' = 'expense';
    
    // Очищаем описание
    let cleanDescription = description.trim();
    if (!cleanDescription) {
        cleanDescription = 'Операция';
    }
    
    // Используем переданный контрагент или извлекаем из описания
    const finalCounterparty = counterparty || extractCounterparty(cleanDescription);
    
    // Определяем категорию на основе описания и подсказки
    const category = determineCategory(cleanDescription, finalCounterparty, categoryHint);
    
    return {
        id: `halyk_${Date.now()}_${Math.random()}`,
        date: formatLocalDate(dateObj),
        description: cleanDescription,
        amount,
        type: txType,
        counterparty: finalCounterparty,
        category,
        transactionType: 'operating',
        isCapitalized: false,
        needsClarification: false,
    };
}

// Альтернативный парсер для случаев, когда основные паттерны не работают
 function parseHalykAlternative(processed: string): Transaction[] {
     const transactions: Transaction[] = [];
     console.log('\n=== АЛЬТЕРНАТИВНЫЙ ПАРСЕР HALYK ===');
     
     // Ищем строки, которые выглядят как транзакции
     const lines = processed.split('\n');
     
     for (let i = 0; i < lines.length; i++) {
         const line = lines[i].trim();
         
         // Ищем строки с датой в формате dd.mm.yyyy
         const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);
         if (!dateMatch) continue;
         
         // Специальная обработка для переводов на другую карту
         if (line.includes('Перевод на другую карту')) {
             // Ищем сумму в этой или следующих строках
             let amountMatch = line.match(/(-?[\d\s]+(?:,\d{2})?(?:\s*₸|\s*KZT))/);
             let description = line;
             
             // Проверяем следующие 2 строки для поиска суммы
             for (let j = 1; j <= 2 && !amountMatch && i + j < lines.length; j++) {
                 const nextLine = lines[i + j].trim();
                 amountMatch = nextLine.match(/(-?[\d\s]+(?:,\d{2})?(?:\s*₸|\s*KZT))/);
                 if (amountMatch) {
                     description = line + ' ' + nextLine;
                     i += j; // Пропускаем обработанные строки
                     break;
                 }
             }
             
             if (amountMatch) {
                 try {
                     const transaction = parseTransactionSimple(dateMatch[1], 'Перевод на другую карту', amountMatch[1]);
                     if (transaction) {
                         transactions.push(transaction);
                         console.log('Альтернативный парсер нашел перевод:', transaction);
                     }
                 } catch (error) {
                     console.log('Ошибка при парсинге перевода:', error);
                 }
             }
             continue;
         }
         
         // Обычная обработка для других транзакций
         let amountMatch = line.match(/(-?[\d\s]+(?:,\d{2})?(?:\s*₸|\s*KZT))/);
         let description = line;
         
         if (!amountMatch && i + 1 < lines.length) {
             // Проверяем следующую строку
             const nextLine = lines[i + 1].trim();
             amountMatch = nextLine.match(/(-?[\d\s]+(?:,\d{2})?(?:\s*₸|\s*KZT))/);
             if (amountMatch) {
                 description = line + ' ' + nextLine;
                 i++; // Пропускаем следующую строку
             }
         }
         
         if (!amountMatch) continue;
         
         try {
             const transaction = parseTransactionSimple(dateMatch[1], description, amountMatch[1]);
             if (transaction) {
                 transactions.push(transaction);
                 console.log('Альтернативный парсер нашел транзакцию:', transaction);
             }
         } catch (error) {
             console.log('Ошибка в альтернативном парсере:', error);
         }
     }
     
     console.log(`Альтернативный парсер нашел ${transactions.length} транзакций`);
     return transactions;
 }

// Старый метод парсинга как fallback
const parseHalykPdfTextLegacy = (processed: string): Transaction[] => {
    const transactions: Transaction[] = [];
    
    // Ищем начало таблицы транзакций
    const tableStartPattern = /Дата\s+проведения\s+операции\s+Дата\s+обработки\s+операции\s+Описание\s+операции/i;
    const tableStartMatch = processed.search(tableStartPattern);
    
    if (tableStartMatch === -1) {
        console.log('Не найдено начало таблицы транзакций');
        return transactions;
    }

    // Извлекаем часть текста с транзакциями
    const transactionsText = processed.substring(tableStartMatch);
    console.log('Текст с транзакциями (первые 1000 символов):', transactionsText.substring(0, 1000));

    // Паттерн для поиска строк с транзакциями
    // Формат: дата дата описание сумма KZT приход расход комиссия номер_счета
    // Исправлено для обработки "Перевод на другую карту" и описаний с цифрами и дефисами
    const transactionPattern = /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+((?:[^\n\r]+?(?=\s+-?[\d\s]+,\d{2}\s+KZT)|Перевод на другую карту))\s+(-?[\d\s]+,\d{2})\s+KZT\s+(\d+,\d{2})\s+(-?[\d\s]+,\d{2})\s+(\d+,\d{2})\s+(KZ\d+|\d{6}\*+\d{4})/g;
    
    let match;
    let transactionCount = 0;
    
    while ((match = transactionPattern.exec(transactionsText)) !== null) {
        transactionCount++;
        console.log(`Найдена транзакция ${transactionCount}:`, match);
        
        const [
            fullMatch,
            operationDate,
            processingDate, 
            description,
            operationAmount,
            incomeAmount,
            expenseAmount,
            commission,
            accountNumber
        ] = match;

        // Парсим дату
        const [day, month, year] = operationDate.split('.');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (isNaN(dateObj.getTime())) {
            console.log('Не удалось распарсить дату:', operationDate);
            continue;
        }

        // Парсим суммы
        const incomeVal = parseFloat(incomeAmount.replace(/\s/g, '').replace(',', '.')) || 0;
        const expenseVal = Math.abs(parseFloat(expenseAmount.replace(/\s/g, '').replace(',', '.')) || 0);
        const operationVal = parseFloat(operationAmount.replace(/\s/g, '').replace(',', '.'));
        
        console.log('Распарсенные суммы:', { incomeVal, expenseVal, operationVal });

        // Определяем тип операции и сумму
        let txType: 'income' | 'expense';
        let amount: number;
        
        if (incomeVal > 0) {
            txType = 'income';
            amount = incomeVal;
        } else if (expenseVal > 0) {
            txType = 'expense';
            amount = expenseVal;
        } else {
            // Фоллбек на сумму операции
            amount = Math.abs(operationVal);
            txType = operationVal < 0 ? 'expense' : 'income';
        }

        // Очищаем описание
        let cleanDescription = description.trim()
            .replace(/Операция оплаты у\s+коммерсанта\s*/i, '')
            .replace(/Операция оплаты у\s*/i, '')
            .replace(/Операция оплаты\s*/i, '')
            .replace(/коммерсанта\s*/i, '')
            .trim();

        if (!cleanDescription) {
            cleanDescription = 'Операция';
        }

        // Извлекаем контрагента
        const counterparty = extractCounterparty(cleanDescription);
        
        // Формируем финальное описание
        let finalDescription = cleanDescription;
        if (/перевод на другую карту/i.test(cleanDescription)) {
            finalDescription = 'Перевод на другую карту';
        } else if (counterparty && counterparty !== cleanDescription) {
            finalDescription = `Оплата ${counterparty}`;
        }

        const category = determineCategory(finalDescription, counterparty);
        
        console.log('Создание транзакции (legacy):', {
            date: formatLocalDate(dateObj),
            description: finalDescription,
            amount,
            type: txType,
            counterparty,
            category
        });

        transactions.push({
            id: `halyk_${Date.now()}_${transactions.length}`,
            date: formatLocalDate(dateObj),
            description: finalDescription,
            amount,
            type: txType,
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
    // Расширенные маркеры для определения банка
    const isKaspi = /Kaspi\s*Bank|KASPI|www\.kaspi\.kz/i.test(pdfText);
    const isHalyk = /Halyk\s*Bank|HALYK|halykbank|АО\s*[«"]?Народный\s+Банк\s+Казахстана[»"]?/i.test(pdfText);
    
    if (isKaspi && !isHalyk) {
        const res = parseKaspiPdfText(pdfText);
        if (res.length > 0) return res;
        // fallback на Halyk-алгоритм если ничего не нашли
        const halykRes = parseHalykPdfText(pdfText);
        return halykRes.length > 0 ? halykRes : res;
    }
    
    if (isHalyk && !isKaspi) {
        const res = parseHalykPdfText(pdfText);
        if (res.length > 0) return res;
        // fallback на Kaspi-алгоритм если ничего не нашли
        const kaspiRes = parseKaspiPdfText(pdfText);
        return kaspiRes.length > 0 ? kaspiRes : res;
    }
    
    // Если банк однозначно не определен — пробуем оба и выбираем лучший результат
    const a = parseKaspiPdfText(pdfText);
    const b = parseHalykPdfText(pdfText);
    if (b.length > a.length) return b;
    return a.length > 0 ? a : b;
};

export const processAndCategorizeTransactions = async (
    file: File, 
    _profile: BusinessProfile | null, 
    onProgress: (message: string) => void
): Promise<Transaction[]> => {
    onProgress('Начинаем обработку файла...');
    let rawText: string;
    let transactions: (Omit<Transaction, 'category' | 'transactionType' | 'isCapitalized'> | Transaction)[] = [];

    try {
        if (file.name.toLowerCase().endsWith('.csv')) {
            onProgress('Обрабатываем CSV файл...');
            rawText = await file.text();
            transactions = parseCSV(rawText);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
            onProgress('Обрабатываем PDF файл...');
            const arrayBuffer = await file.arrayBuffer();
            
            // Динамический импорт pdfjs-dist
            const pdfjsLib = await import('pdfjs-dist') as any;
            
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

        // Категоризация транзакций с автокатегоризацией долгов
        const finalTransactions: Transaction[] = transactions.map(tx => {
            // Сначала проверяем, является ли транзакция долгом
            const debtInfo = detectDebtCategory(tx.description, tx.counterparty || '', tx.amount);
            let category: string;
            let type: 'income' | 'expense';
            let transactionType: 'operating' | 'investing' | 'financing' = 'operating';
            let isCapitalized = false;

            if (debtInfo.isDebt) {
                // Если это долг, используем категорию из detectDebtCategory
                category = debtInfo.category;
                type = debtInfo.type;
                transactionType = 'financing';
            } else {
                // Иначе используем стандартную категоризацию
                category = determineCategory(tx.description, tx.counterparty);
                type = tx.type;
                
                if (category === 'Оборудование') {
                    transactionType = 'investing';
                    isCapitalized = true;
                } else if (['Получение кредита', 'Погашение кредита', 'Выплата дивидендов', 'Взнос учредителя', 'Выдача займа', 'Возврат долга'].includes(category)) {
                    transactionType = 'financing';
                }
            }

            return {
                ...tx,
                category,
                type,
                counterparty: tx.counterparty || '',
                transactionType,
                isCapitalized,
                needsClarification: false,
            } as Transaction;
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
    const monthlySummary: { [month: string]: { pnlRevenue: number; pnlOpEx: number; cashInflow: number; cashOutflow: number } } = {};
    const expenseByCategory: { [category: string]: number } = {};
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
            totalEquipmentCost += Math.abs(tx.amount);
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
            monthlySummary[month].cashInflow += Math.abs(tx.amount);
            if (tx.transactionType === 'operating') {
                monthlySummary[month].pnlRevenue += Math.abs(tx.amount);
            }
        } else { // Expense
            monthlySummary[month].cashOutflow += Math.abs(tx.amount);
            if (tx.transactionType === 'operating' && !tx.isCapitalized) {
                monthlySummary[month].pnlOpEx += Math.abs(tx.amount);
                expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + Math.abs(tx.amount);
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
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
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

    const operatingActivities = transactions.reduce((sum, tx) => 
        tx.transactionType === 'operating' ? sum + (tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount)) : sum, 0);
    const investingActivities = transactions.reduce((sum, tx) => 
        tx.transactionType === 'investing' ? sum + (tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount)) : sum, 0);
    const financingActivities = transactions.reduce((sum, tx) => 
        tx.transactionType === 'financing' ? sum + (tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount)) : sum, 0);

    const cashFlow: CashFlowData = {
        operatingActivities,
        investingActivities,
        financingActivities,
        netCashFlow: operatingActivities + investingActivities + financingActivities,
        monthlyData: cashFlowMonthlyData
    };

    // --- Debt Report Calculation ---
    const receivablesSummary: { [counterparty: string]: number } = {};
    const payablesSummary: { [counterparty: string]: number } = {};

    transactions.forEach(tx => {
        const counterparty = tx.counterparty?.trim();
        if (!counterparty) return;

        if (tx.category === 'Выдача займа') { // You give a loan -> someone owes you
            receivablesSummary[counterparty] = (receivablesSummary[counterparty] || 0) + Math.abs(tx.amount);
        } else if (tx.category === 'Возврат долга') { // Someone pays you back for a loan you gave
            receivablesSummary[counterparty] = (receivablesSummary[counterparty] || 0) - Math.abs(tx.amount);
        } else if (tx.category === 'Получение кредита') { // You receive a loan -> you owe someone
            payablesSummary[counterparty] = (payablesSummary[counterparty] || 0) + Math.abs(tx.amount);
        } else if (tx.category === 'Погашение кредита') { // You pay back a loan you received
            payablesSummary[counterparty] = (payablesSummary[counterparty] || 0) - Math.abs(tx.amount);
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
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalDividends = transactions
        .filter(tx => tx.category === 'Выплата дивидендов')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

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

    const counterpartySummary: { [counterparty: string]: { income: number; expense: number; net: number } } = {};

    transactions.forEach(tx => {
        const counterparty = tx.counterparty?.trim();
        if (!counterparty || internalCounterparties.some(internal => counterparty.toLowerCase().includes(internal.toLowerCase()))) {
            return;
        }

        if (!counterpartySummary[counterparty]) {
            counterpartySummary[counterparty] = { income: 0, expense: 0, net: 0 };
        }

        if (tx.type === 'income') {
            counterpartySummary[counterparty].income += Math.abs(tx.amount);
            counterpartySummary[counterparty].net += Math.abs(tx.amount);
        } else {
            counterpartySummary[counterparty].expense += Math.abs(tx.amount);
            counterpartySummary[counterparty].net -= Math.abs(tx.amount);
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
