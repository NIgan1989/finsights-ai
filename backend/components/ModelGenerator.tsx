import React, { useState } from 'react';

interface ModelGeneratorProps {
  onModelGenerated: (model: any) => void;
  onClose: () => void;
}

interface BusinessInfo {
  name: string;
  industry: string;
  description: string;
  stage: 'startup' | 'existing' | 'expansion';
  timeframe: number;
  currency: string;
  location: string;
}

const ModelGenerator: React.FC<ModelGeneratorProps> = ({ onModelGenerated, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    industry: '',
    description: '',
    stage: 'startup',
    timeframe: 5,
    currency: 'KZT',
    location: 'Kazakhstan'
  });

  const industries = [
    { id: 'cafe', name: '☕ Кафе / Ресторан', description: 'Общественное питание, доставка еды' },
    { id: 'retail', name: '🛍️ Розничная торговля', description: 'Магазины, торговые точки' },
    { id: 'saas', name: '💻 SaaS / IT', description: 'Программное обеспечение, подписки' },
    { id: 'manufacturing', name: '🏭 Производство', description: 'Изготовление товаров' },
    { id: 'services', name: '🤝 Услуги', description: 'Консалтинг, персональные услуги' },
    { id: 'ecommerce', name: '🛒 E-commerce', description: 'Интернет-магазины, маркетплейсы' },
    { id: 'real_estate', name: '🏠 Недвижимость', description: 'Аренда, управление недвижимостью' },
    { id: 'healthcare', name: '🏥 Здравоохранение', description: 'Медицинские услуги, клиники' },
    { id: 'education', name: '🎓 Образование', description: 'Онлайн курсы, тренинги' },
    { id: 'logistics', name: '🚚 Логистика', description: 'Доставка, складские услуги' },
    { id: 'tourism', name: '🏨 Туризм', description: 'Отели, туристические услуги' },
    { id: 'automotive', name: '🔧 Автосервис', description: 'Ремонт и обслуживание автомобилей' },
    { id: 'beauty', name: '💄 Красота', description: 'Салоны красоты, СПА-услуги' },
    { id: 'other', name: '📋 Другое', description: 'Иная сфера деятельности' }
  ];

  const generateModel = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDescription: `${businessInfo.name} - ${businessInfo.description}`,
          industry: businessInfo.industry,
          stage: businessInfo.stage,
          timeframe: businessInfo.timeframe,
          currency: businessInfo.currency,
          language: 'ru'
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации модели');
      }

      const generatedModel = await response.json();
      
      // Добавляем метаданные
      const fullModel = {
        ...generatedModel,
        id: `model_${Date.now()}`,
        name: businessInfo.name,
        industry: businessInfo.industry,
        stage: businessInfo.stage,
        createdAt: new Date().toISOString(),
        currency: businessInfo.currency
      };

      onModelGenerated(fullModel);
      
    } catch (error) {
      console.error('Error generating model:', error);
      alert('❌ Ошибка генерации модели. Проверьте подключение к серверу.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🚀 Создайте финансовую модель с помощью ИИ
        </h2>
        <p className="text-muted-foreground">
          Опишите ваш бизнес, и мы создадим полную финансовую модель за минуты
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Название бизнеса
        </label>
        <input
          type="text"
          value={businessInfo.name}
          onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
          placeholder="Например: Кофейня 'Уютный уголок'"
          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Выберите отрасль
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {industries.map(industry => (
            <button
              key={industry.id}
              onClick={() => setBusinessInfo({...businessInfo, industry: industry.id})}
              className={`p-4 text-left border-2 rounded-lg transition ${
                businessInfo.industry === industry.id
                  ? 'border-primary bg-primary-10'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="font-medium text-foreground">{industry.name}</div>
              <div className="text-sm text-muted-foreground">{industry.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition"
        >
          Отмена
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!businessInfo.name || !businessInfo.industry}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Далее →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          📝 Расскажите о вашем бизнесе
        </h2>
        <p className="text-muted-foreground">
          Чем больше деталей, тем точнее будет модель
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Описание бизнеса
        </label>
        <textarea
          value={businessInfo.description}
          onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
          placeholder="Опишите ваш бизнес: что продаете, кому, как работаете, планы развития..."
          rows={6}
          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface text-foreground resize-none"
        />
        <div className="text-sm text-muted-foreground mt-1">
          Например: "Кофейня в центре Алматы, 30 мест, работаем с 7:00 до 22:00, планируем добавить доставку..."
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Стадия бизнеса
          </label>
          <select
            value={businessInfo.stage}
            onChange={(e) => setBusinessInfo({...businessInfo, stage: e.target.value as any})}
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface text-foreground"
          >
            <option value="startup">🚀 Стартап (планирование)</option>
            <option value="existing">📈 Действующий бизнес</option>
            <option value="expansion">🎯 Расширение/развитие</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Период планирования
          </label>
          <select
            value={businessInfo.timeframe}
            onChange={(e) => setBusinessInfo({...businessInfo, timeframe: parseInt(e.target.value)})}
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface text-foreground"
          >
            <option value={3}>3 года</option>
            <option value={5}>5 лет</option>
            <option value={7}>7 лет</option>
            <option value={10}>10 лет</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition"
        >
          ← Назад
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!businessInfo.description.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Создать модель →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ✨ Генерация вашей модели
        </h2>
        <p className="text-muted-foreground">
          ИИ анализирует ваш бизнес и создает персональную финансовую модель
        </p>
      </div>

      <div className="bg-surface/50 rounded-lg p-6">
        <div className="font-medium text-foreground mb-2">
          {businessInfo.name}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {industries.find(i => i.id === businessInfo.industry)?.name} • 
          {businessInfo.stage === 'startup' ? ' Стартап' : businessInfo.stage === 'existing' ? ' Действующий' : ' Расширение'} • 
          {businessInfo.timeframe} лет
        </div>
        <div className="text-sm text-muted-foreground italic">
          "{businessInfo.description.substring(0, 100)}..."
        </div>
      </div>

      {!isGenerating ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Все готово! Нажмите кнопку для создания модели.
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 text-muted-foreground hover:text-foreground transition"
            >
              ← Изменить
            </button>
            <button
              onClick={generateModel}
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 transition font-medium"
            >
              🤖 Создать с помощью ИИ
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>🧠 Анализируем ваш бизнес...</div>
            <div>📊 Создаем структуру модели...</div>
            <div>💰 Настраиваем доходы и расходы...</div>
            <div>📈 Строим прогнозы...</div>
          </div>
          <div className="text-xs text-muted-foreground/80">
            Обычно занимает 10-30 секунд
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Progress bar */}
        <div className="bg-muted h-1">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default ModelGenerator;
