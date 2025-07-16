// questions/financialModelQuestions.ts

export interface FinancialModelQuestion {
  id: string;
  text: string;
  placeholder?: string;
  followUp?: (answer: string) => FinancialModelQuestion[] | undefined;
  example?: string;
  required?: boolean;
  section?: 'business' | 'revenue' | 'expense' | 'investment' | 'risk' | 'kpi' | 'other';
}

export const questions: FinancialModelQuestion[] = [
  {
    id: 'business_type',
    text: 'Опишите ваш бизнес: чем вы занимаетесь, какая сфера, какие основные источники дохода?',
    placeholder: 'Например: онлайн-ритейл, SaaS, услуги, производство...',
    section: 'business',
    required: true,
    example: 'SaaS-платформа для автоматизации продаж малого бизнеса',
  },
  {
    id: 'market',
    text: 'Кто ваши основные клиенты и каков целевой рынок?',
    placeholder: 'Опишите портрет клиента, географию, сегмент...',
    section: 'business',
    required: true,
    example: 'Малый и средний бизнес в Казахстане, B2B сегмент',
  },
  {
    id: 'team',
    text: 'Расскажите о вашей команде: сколько человек, ключевые роли, опыт?',
    placeholder: 'Например: 3 основателя, 5 сотрудников, CTO, маркетолог...',
    section: 'business',
    required: true,
    example: '2 основателя, CTO, маркетолог, 4 разработчика',
  },
  {
    id: 'revenue_model',
    text: 'Как вы зарабатываете деньги? Опишите вашу модель монетизации.',
    placeholder: 'Подписка, разовые продажи, комиссия, freemium...',
    section: 'revenue',
    required: true,
    example: 'Подписка 10 000₸/мес, комиссия 2% с транзакций',
  },
  {
    id: 'current_financials',
    text: 'Каковы ваши текущие финансовые показатели? (выручка, расходы, прибыль, средний чек)',
    placeholder: 'Например: выручка 1 млн/год, расходы 700 тыс., прибыль 300 тыс., средний чек 10 тыс.',
    section: 'revenue',
    required: true,
    example: 'Выручка 2 млн/год, расходы 1.2 млн, прибыль 800 тыс., средний чек 15 тыс.',
  },
  {
    id: 'growth_plan',
    text: 'Каковы ваши планы по росту на ближайшие 3 года? Какие ключевые драйверы роста?',
    placeholder: 'Расширение на новые рынки, запуск новых продуктов, увеличение LTV...',
    section: 'kpi',
    required: true,
    example: 'Рост выручки на 30% в год за счет выхода на новые рынки',
  },
  {
    id: 'investments',
    text: 'Планируете ли вы привлекать инвестиции? Если да, то сколько и на что?',
    placeholder: 'Например: 200 тыс. $ на маркетинг и разработку, не планируем привлекать...',
    section: 'investment',
    required: false,
    example: 'Планируем привлечь 100 тыс. $ на расширение команды',
  },
  {
    id: 'risks',
    text: 'Какие основные риски и вызовы вы видите для вашего бизнеса?',
    placeholder: 'Конкуренция, регуляторика, зависимость от поставщиков...',
    section: 'risk',
    required: false,
    example: 'Высокая конкуренция, зависимость от одного крупного клиента',
  },
  {
    id: 'goals',
    text: 'Каковы ваши главные цели и KPI на ближайшие 3 года?',
    placeholder: 'Достичь выручки 10 млн, выйти на прибыль, увеличить долю рынка...',
    section: 'kpi',
    required: true,
    example: 'Достичь выручки 10 млн, увеличить LTV до 100 тыс.',
  },
  // ДОХОДЫ (Revenue)
  {
    id: 'revenue_streams',
    text: 'Перечислите основные источники дохода (по сегментам, продуктам или услугам).',
    placeholder: 'Например: подписка, разовые продажи, консалтинг...',
    section: 'revenue',
    required: true,
    example: 'Подписка SaaS, консалтинг, обучение',
    followUp: (answer) =>
      answer.toLowerCase().includes('прочее') || answer.trim() === ''
        ? [{
            id: 'revenue_streams_detail',
            text: 'Пожалуйста, расшифруйте, что входит в "прочие доходы" или уточните структуру доходов.',
            section: 'revenue',
            required: true,
          }]
        : undefined,
  },
  // РАСХОДЫ (Expense)
  {
    id: 'expense_categories',
    text: 'Перечислите основные статьи расходов (по категориям).',
    placeholder: 'Например: зарплата, аренда, маркетинг, IT, закупки...',
    section: 'expense',
    required: true,
    example: 'Зарплата, аренда, маркетинг, IT',
    followUp: (answer) =>
      answer.toLowerCase().includes('прочее') || answer.trim() === ''
        ? [{
            id: 'expense_categories_detail',
            text: 'Пожалуйста, расшифруйте, что входит в "прочие расходы" или уточните структуру расходов.',
            section: 'expense',
            required: true,
          }]
        : undefined,
  },
  {
    id: 'capex',
    text: 'Планируются ли крупные инвестиции (CAPEX) в ближайшие 3 года? Если да, то какие?',
    placeholder: 'Например: покупка оборудования, разработка ПО, ремонт офиса...',
    section: 'investment',
    required: false,
    example: 'Покупка серверов, разработка мобильного приложения',
  },
  // ДОЛГИ (Debt)
  {
    id: 'debts',
    text: 'Есть ли у компании кредиты или займы? Укажите сумму, ставку и срок.',
    placeholder: 'Например: кредит 5 млн под 12% на 3 года',
    section: 'investment',
    required: false,
    example: 'Кредит 2 млн под 10% на 2 года',
  },
  // KPI и метрики
  {
    id: 'unit_economics',
    text: 'Если применимо: опишите ключевые метрики unit-экономики (LTV, CAC, ARPU, Churn, Retention).',
    placeholder: 'Например: LTV 100 тыс., CAC 10 тыс., Churn 5% в месяц...',
    section: 'kpi',
    required: false,
    example: 'LTV 120 тыс., CAC 15 тыс., Churn 4% в месяц',
  },
  // DCF и сценарии
  {
    id: 'wacc',
    text: 'Если вы знаете: укажите ожидаемую ставку дисконтирования (WACC) для DCF-модели.',
    placeholder: 'Например: 18% (если не знаете — оставьте пустым, будет использовано значение по умолчанию)',
    section: 'other',
    required: false,
    example: '16%',
  },
  {
    id: 'tax_rate',
    text: 'Укажите среднюю налоговую ставку для вашего бизнеса.',
    placeholder: 'Например: 20%',
    section: 'other',
    required: false,
    example: '20%',
  },
  {
    id: 'scenario_analysis',
    text: 'Какие сценарии развития бизнеса вы хотели бы рассмотреть? (базовый, оптимистичный, пессимистичный)',
    placeholder: 'Опишите ключевые различия между сценариями, если есть',
    section: 'other',
    required: false,
    example: 'Базовый — рост 20% в год, оптимистичный — 40%, пессимистичный — стагнация',
  },
]; 