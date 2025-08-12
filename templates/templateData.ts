/**
 * Общий источник данных для шаблонов финансовых моделей
 * Используется как на клиентской, так и на серверной стороне
 */

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  verified: boolean;
  complexity: 'simple' | 'medium' | 'advanced';
  timeframe: string;
  features: string[];
  preview: {
    revenue: string;
    expenses: string;
    profit: string;
  };
  // Флаг, указывающий, реализован ли шаблон на сервере
  implemented: boolean;
}

const templates: TemplateData[] = [
  {
    id: 'coffee-shop',
    name: 'Кофейня / Кафе',
    description: 'Полная модель для кафе с посещаемостью, средним чеком и сезонностью',
    icon: '☕',
    category: 'food',
    verified: true,
    complexity: 'simple',
    timeframe: '5 лет',
    features: ['Расчет посещаемости', 'Себестоимость продуктов', 'Аренда и персонал', 'Сезонные колебания'],
    preview: {
      revenue: '24.3M тенге/год',
      expenses: '19.2M тенге/год',
      profit: '5.1M тенге/год'
    },
    implemented: true // Восстановлен Coffee Shop
  },
  {
    id: 'saas-startup',
    name: 'SaaS / Подписки',
    description: 'Модель для подписочного бизнеса с метриками LTV, CAC, Churn',
    icon: '💻',
    category: 'tech',
    verified: true,
    complexity: 'medium',
    timeframe: '7 лет',
    features: ['MRR/ARR прогнозы', 'Churn анализ', 'Unit Economics', 'Масштабирование'],
    preview: {
      revenue: '45.2M тенге/год',
      expenses: '32.1M тенге/год',
      profit: '13.1M тенге/год'
    },
    implemented: true
  },
  {
    id: 'retail-store',
    name: 'Розничный магазин',
    description: 'Универсальная модель для магазина с товарооборотом и инвентарем',
    icon: '🛍️',
    category: 'retail',
    verified: true,
    complexity: 'medium',
    timeframe: '5 лет',
    features: ['Управление запасами', 'Товарооборот', 'Наценки по категориям', 'Сезонность продаж'],
    preview: {
      revenue: '67.8M тенге/год',
      expenses: '54.2M тенге/год',
      profit: '13.6M тенге/год'
    },
    implemented: true
  },
  {
    id: 'manufacturing',
    name: 'Производство',
    description: 'Модель производственного предприятия с CAPEX и операционными циклами',
    icon: '🏭',
    category: 'production',
    verified: true,
    complexity: 'advanced',
    timeframe: '10 лет',
    features: ['Производственные мощности', 'Капитальные вложения', 'Себестоимость единицы', 'Оборотный капитал'],
    preview: {
      revenue: '156.4M тенге/год',
      expenses: '128.7M тенге/год',
      profit: '27.7M тенге/год'
    },
    implemented: true
  },
  {
    id: 'ecommerce',
    name: 'Интернет-магазин',
    description: 'E-commerce модель с маркетинговыми воронками и конверсиями',
    icon: '🛒',
    category: 'tech',
    verified: true,
    complexity: 'medium',
    timeframe: '5 лет',
    features: ['Веб-трафик и конверсия', 'Digital маркетинг', 'Логистика', 'Возвраты и отмены'],
    preview: {
      revenue: '89.3M тенге/год',
      expenses: '71.4M тенге/год',
      profit: '17.9M тенге/год'
    },
    implemented: true // Восстановлен E-commerce Store
  },
  {
    id: 'consulting',
    name: 'Консалтинг / Услуги',
    description: 'Модель для сервисного бизнеса с почасовой оплатой и проектами',
    icon: '🤝',
    category: 'services',
    verified: true,
    complexity: 'simple',
    timeframe: '3 года',
    features: ['Загруженность специалистов', 'Почасовые ставки', 'Проектное планирование', 'Масштабирование команды'],
    preview: {
      revenue: '34.7M тенге/год',
      expenses: '26.2M тенге/год',
      profit: '8.5M тенге/год'
    },
    implemented: true
  },
  {
    id: 'real-estate',
    name: 'Аренда недвижимости',
    description: 'Модель управления арендной недвижимостью с доходностью',
    icon: '🏠',
    category: 'real-estate',
    verified: true,
    complexity: 'medium',
    timeframe: '15 лет',
    features: ['Арендные ставки', 'Заполняемость', 'Обслуживание', 'Капитальный ремонт'],
    preview: {
      revenue: '78.9M тенге/год',
      expenses: '31.6M тенге/год',
      profit: '47.3M тенге/год'
    },
    implemented: true // Восстановлен Real Estate (was false)
  },
  {
    id: 'restaurant',
    name: 'Ресторан',
    description: 'Детализированная модель ресторана с кухней и обслуживанием',
    icon: '🍽️',
    category: 'food',
    verified: true,
    complexity: 'advanced',
    timeframe: '7 лет',
    features: ['Меню и FoodCost', 'Персонал кухни/зала', 'Алкогольная лицензия', 'Банкеты и мероприятия'],
    preview: {
      revenue: '125.6M тенге/год',
      expenses: '98.3M тенге/год',
      profit: '27.3M тенге/год'
    },
    implemented: false
  },
  {
    id: 'medical-clinic',
    name: 'Медицинская клиника',
    description: 'Модель частной клиники с приемами пациентов и медицинскими услугами',
    icon: '🏥',
    category: 'healthcare',
    verified: true,
    complexity: 'medium',
    timeframe: '5 лет',
    features: ['Поток пациентов', 'Медицинское оборудование', 'Лицензирование', 'Страхование'],
    preview: {
      revenue: '50.0M тенге/год',
      expenses: '38.5M тенге/год',
      profit: '11.5M тенге/год'
    },
    implemented: true // Восстановлен Healthcare Clinic (was false)
  },
  {
    id: 'education-courses',
    name: 'Образовательные курсы',
    description: 'Модель для образовательного центра или онлайн-курсов',
    icon: '🎓',
    category: 'education',
    verified: true,
    complexity: 'simple',
    timeframe: '3 года',
    features: ['Наборы студентов', 'Программы обучения', 'Сертификация', 'Онлайн платформа'],
    preview: {
      revenue: '21.6M тенге/год',
      expenses: '16.8M тенге/год',
      profit: '4.8M тенге/год'
    },
    implemented: false
  },
  {
    id: 'logistics-delivery',
    name: 'Логистика и доставка',
    description: 'Модель службы доставки с автопарком и складскими операциями',
    icon: '🚚',
    category: 'logistics',
    verified: true,
    complexity: 'advanced',
    timeframe: '7 лет',
    features: ['Автопарк', 'Маршрутизация', 'Складские операции', 'Топливные расходы'],
    preview: {
      revenue: '52.6M тенге/год',
      expenses: '43.8M тенге/год',
      profit: '8.8M тенге/год'
    },
    implemented: false
  },
  {
    id: 'tourism-hotel',
    name: 'Отель / Гостиница',
    description: 'Модель гостиничного бизнеса с номерным фондом и сервисами',
    icon: '🏨',
    category: 'tourism',
    verified: true,
    complexity: 'advanced',
    timeframe: '10 лет',
    features: ['Заполняемость номеров', 'Сезонность', 'Дополнительные услуги', 'Рейтинги'],
    preview: {
      revenue: '109.5M тенге/год',
      expenses: '87.6M тенге/год',
      profit: '21.9M тенге/год'
    },
    implemented: false
  },
  {
    id: 'auto-service',
    name: 'Автосервис',
    description: 'Модель станции технического обслуживания автомобилей',
    icon: '🔧',
    category: 'automotive',
    verified: true,
    complexity: 'medium',
    timeframe: '5 лет',
    features: ['Ремонтные работы', 'Запчасти', 'Диагностика', 'Специализация'],
    preview: {
      revenue: '90.0M тенге/год',
      expenses: '72.0M тенге/год',
      profit: '18.0M тенге/год'
    },
    implemented: false
  },
  {
    id: 'beauty-salon',
    name: 'Салон красоты',
    description: 'Модель салона красоты с различными услугами и мастерами',
    icon: '💄',
    category: 'beauty',
    verified: true,
    complexity: 'simple',
    timeframe: '3 года',
    features: ['Услуги мастеров', 'Косметика', 'Абонементы', 'Программы лояльности'],
    preview: {
      revenue: '64.8M тенге/год',
      expenses: '51.8M тенге/год',
      profit: '13.0M тенге/год'
    },
    implemented: false
  }
];

export default templates;

// Функция для получения только реализованных шаблонов
export const getImplementedTemplates = () => {
  return templates.filter(template => template.implemented);
};

// Функция для получения шаблона по ID
export const getTemplateById = (id: string) => {
  return templates.find(template => template.id === id);
};
