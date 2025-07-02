// Категории расходов и доходов в соответствии с международными стандартами бухгалтерского учета
// Структурировано согласно GAAP и МСФО (IFRS)

// Категории расходов для детального учета и анализа
export const EXPENSE_CATEGORIES = [
    // --- Себестоимость товаров и услуг (COGS - Cost of Goods Sold) ---
    'Закупка товаров',             // Прямые затраты на приобретение товаров для перепродажи
    'Сырье и материалы',           // Материалы для производства
    'Производственная зарплата',    // Зарплата производственного персонала
    'Производственная аренда',      // Аренда производственных помещений
    'Производственные услуги',      // Аутсорсинг производственных процессов

    // --- Операционные расходы (Operating Expenses / SG&A) ---
    // Коммерческие расходы (Selling)
    'Маркетинг и реклама',         // Расходы на продвижение
    'Комиссии с продаж',           // Комиссионные агентам и менеджерам
    'Логистика и доставка',        // Расходы на доставку товаров

    // Административные расходы (General & Administrative)
    'Административная зарплата',    // Зарплата руководства и офисных сотрудников
    'Офисная аренда',              // Аренда офисных помещений
    'Коммунальные услуги',         // Электричество, вода, отопление
    'Связь и интернет',            // Телефония, интернет, ПО
    'Канцтовары',                  // Офисные принадлежности
    'Консалтинг и аудит',          // Профессиональные услуги
    'Страхование',                 // Бизнес-страхование
    'Представительские расходы',    // Прием партнеров, подарки
    'Командировочные расходы',      // Поездки, проживание
    'Обучение персонала',          // Повышение квалификации
    'Подписки на сервисы',         // ПО, информационные системы

    // Налоги и сборы (не включая налог на прибыль)
    'Налоги (кроме налога на прибыль)', // НДС, налог на имущество и пр.
    'Банковские комиссии',        // Расходы на банковское обслуживание
    'Штрафы и пени',              // Штрафы, пени, неустойки

    // --- Финансовые расходы (Financial Expenses) ---
    'Проценты по кредитам',        // Процентные платежи по займам
    'Отрицательные курсовые разницы', // Убытки от конвертации валют

    // --- Капитальные затраты (CAPEX) ---
    'Оборудование',               // Покупка производственного оборудования
    'Транспортные средства',       // Покупка транспорта для бизнеса
    'Недвижимость',               // Покупка зданий и сооружений
    'Нематериальные активы',       // ПО, патенты, лицензии и т.д.
    'Модернизация активов',        // Улучшение существующих активов

    // --- Финансовая деятельность (Financing) ---
    'Погашение кредита',           // Выплата основной суммы кредита
    'Лизинговые платежи',          // Платежи по лизингу/аренде
    'Выплата дивидендов',          // Выплаты собственникам
    'Выкуп акций/долей',           // Обратный выкуп ценных бумаг

    // --- Прочие движения денежных средств ---
    'Накопления и сбережения',     // Перевод на депозиты и инвестиции
    'Личные траты',               // Изъятия средств на личные цели

    // --- Прочее ---
    'Прочие расходы'               // Для расходов, не входящих в перечисленные категории
];

// Категории доходов
export const INCOME_CATEGORIES = [
    // --- Операционные доходы ---
    'Основная выручка',            // Продажа основных товаров/услуг
    'Дополнительные услуги',        // Сопутствующие услуги
    'Комиссионные доходы',         // Комиссии, агентские вознаграждения

    // --- Прочие операционные доходы ---
    'Аренда имущества',            // Доход от сдачи активов в аренду
    'Роялти/лицензионные платежи',  // Доходы от интеллектуальной собственности

    // --- Финансовые доходы ---
    'Процентные доходы',           // Проценты по депозитам, займам
    'Положительные курсовые разницы', // Прибыль от конвертации валют
    'Дивиденды полученные',        // Дивиденды от инвестиций

    // --- Инвестиционные доходы ---
    'Продажа активов',             // Доход от продажи внеоборотных активов

    // --- Финансирование ---
    'Получение кредита',           // Поступления заемных средств
    'Взнос учредителя',            // Вклады в капитал от собственников

    // --- Прочее ---
    'Прочие поступления'           // Для доходов, не входящих в перечисленные категории
];

import { FinancialReport, Transaction } from './types';

// Примеры транзакций для тестирования
export const exampleTransactions: Transaction[] = [
    { id: '1', date: '2023-10-01', description: 'Поступление от продажи услуг', amount: 5000, category: 'Основная выручка', type: 'income', transactionType: 'operating', isCapitalized: false },
    { id: '2', date: '2023-10-01', description: 'Арендная плата за офис', amount: 1500, category: 'Офисная аренда', type: 'expense', transactionType: 'operating', isCapitalized: false },
    { id: '3', date: '2023-10-02', description: 'Закупка материалов', amount: 1200, category: 'Сырье и материалы', type: 'expense', transactionType: 'operating', isCapitalized: false },
    { id: '4', date: '2023-10-03', description: 'Оплата консультационных услуг', amount: 750, category: 'Консалтинг и аудит', type: 'expense', transactionType: 'operating', isCapitalized: false },
    { id: '5', date: '2023-10-05', description: 'Оплата электроэнергии', amount: 80, category: 'Коммунальные услуги', type: 'expense', transactionType: 'operating', isCapitalized: false },
    { id: '6', date: '2023-10-10', description: 'Расходы на рекламу', amount: 600, category: 'Маркетинг и реклама', type: 'expense', transactionType: 'operating', isCapitalized: false },
    { id: '7', date: '2023-10-15', description: 'Получение процентов по депозиту', amount: 120, category: 'Процентные доходы', type: 'income', transactionType: 'financing', isCapitalized: false },
    { id: '8', date: '2023-10-20', description: 'Приобретение оборудования', amount: 3000, category: 'Оборудование', type: 'expense', transactionType: 'investing', isCapitalized: true },
    { id: '9', date: '2023-10-25', description: 'Поступление от клиента', amount: 2500, category: 'Основная выручка', type: 'income', transactionType: 'operating', isCapitalized: false },
    { id: '10', date: '2023-10-28', description: 'Выплата зарплаты сотрудникам', amount: 2000, category: 'Административная зарплата', type: 'expense', transactionType: 'operating', isCapitalized: false },
];

// Пример финансового отчета - этот объект будет заменен реальными данными
export const exampleReport: FinancialReport = {
    pnl: {
        totalRevenue: 7620,
        costOfGoodsSold: 1200,
        grossProfit: 6420,
        totalOperatingExpenses: 4930,
        ebitda: 1490,
        depreciation: 83,
        ebit: 1407,
        financialExpense: 0,
        financialIncome: 120,
        ebt: 1527,
        taxes: 305,
        netProfit: 1222,
        monthlyData: [
            { month: '2023-10', Доход: 7620, Себестоимость: 1200, ОперРасходы: 4930, Амортизация: 83, Прибыль: 1407 }
        ],
        expenseByCategory: [
            { name: 'Административная зарплата', value: 2000 },
            { name: 'Офисная аренда', value: 1500 },
            { name: 'Сырье и материалы', value: 1200 },
            { name: 'Консалтинг и аудит', value: 750 },
            { name: 'Маркетинг и реклама', value: 600 },
            { name: 'Коммунальные услуги', value: 80 }
        ],
        ratios: {
            grossMargin: 0.84, // 84%
            operatingMargin: 0.18, // 18%
            netMargin: 0.16, // 16%
            roa: 0.12, // 12%
            roe: 0.15, // 15%
        }
    },
    cashFlow: {
        netCashFlow: 1490,
        operatingActivities: 4490,
        investingActivities: -3000,
        financingActivities: 0,
        operatingDetails: {
            fromNetIncome: 1222,
            depreciation: 83,
            workingCapitalChanges: 3185,
        },
        investingDetails: {
            capitalExpenditures: -3000,
            assetDisposals: 0,
            investments: 0,
        },
        financingDetails: {
            debtProceeds: 0,
            debtRepayments: 0,
            equityChanges: 0,
            dividends: 0,
        },
        monthlyData: [
            { month: '2023-10', 'Поступления': 7620, 'Выбытия': 6130, 'Чистый поток': 1490 }
        ],
        liquidity: {
            operatingCashFlowRatio: 2.25,
            cashConversionCycle: 45,
        }
    },
    balanceSheet: {
        assets: {
            cash: 10000,
            accountsReceivable: 2000,
            inventory: 3000,
            shortTermInvestments: 0,
            prepaidExpenses: 500,
            totalCurrentAssets: 15500,
            equipment: 5000,
            realEstate: 0,
            intangibleAssets: 0,
            longTermInvestments: 0,
            accumulatedDepreciation: -500,
            netEquipment: 4500,
            totalNonCurrentAssets: 4500,
            totalAssets: 20000,
        },
        liabilities: {
            accountsPayable: 1500,
            shortTermLoans: 0,
            accruedExpenses: 500,
            taxesPayable: 0,
            totalCurrentLiabilities: 2000,
            loansPayable: 2000,
            deferredTaxes: 0,
            totalNonCurrentLiabilities: 2000,
            totalLiabilities: 4000,
        },
        equity: {
            authorizedCapital: 10000,
            retainedEarnings: 6000,
            ownerContributions: 0,
            ownerWithdrawals: 0,
            totalEquity: 16000,
        },
        totalLiabilitiesAndEquity: 20000,
        ratios: {
            currentRatio: 7.75,
            quickRatio: 6.25,
            debtToEquity: 0.25,
            assetTurnover: 0.38,
        }
    },
};