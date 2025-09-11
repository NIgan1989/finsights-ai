import React, { useState } from 'react';
import { FinancialTemplate } from '../../models/financialModels';

interface LandingPageProps {
  templates: FinancialTemplate[];
  onTemplateSelect: (template: FinancialTemplate) => void;
  onShowTemplateGallery: () => void;
  onShowModelGenerator: () => void;
  onBackToDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  templates,
  onTemplateSelect,
  onShowTemplateGallery,
  onShowModelGenerator,
  onBackToDashboard
}) => {
  const [customBusiness, setCustomBusiness] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="p-6 bg-card backdrop-blur-sm border border-border rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-fade-in shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">FinSights AI - Конструктор моделей</h1>
              <p className="text-muted-foreground">Создание профессиональных финансовых моделей</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 bg-surface hover:bg-surface-elevated px-4 py-2 rounded-lg transition text-foreground"
            >
              <span>← Назад к дашборду</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Используйте ИИ для создания
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> финансовой модели</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Экономьте время и деньги. Создавайте профессиональные 3-отчетные модели за минуты, 
            а не часы. Готовые шаблоны или ИИ-генерация под ваш бизнес.
          </p>
        </div>

        {/* AI Generator Section */}
        <div className="bg-card backdrop-blur-sm rounded-2xl p-8 mb-12 border border-border shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">🤖 Создать с помощью ИИ</h2>
            <p className="text-muted-foreground">Опишите ваш бизнес, и ИИ создаст персонализированную модель</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <textarea
              value={customBusiness}
              onChange={(e) => setCustomBusiness(e.target.value)}
              placeholder="Например: Я открываю кафе в центре города. 30 посадочных мест, работаем с 8:00 до 22:00. Средний чек 1500 тенге. Планируем доставку через Glovo..."
              className="w-full h-32 bg-surface text-foreground rounded-lg p-4 border border-border focus:border-primary focus:outline-none resize-none"
            />
            <button
              onClick={onShowModelGenerator}
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:from-primary/90 hover:to-secondary/90 transition"
            >
              🚀 Создать модель с ИИ
            </button>
          </div>
        </div>

        {/* Templates Section */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">📋 Готовые шаблоны</h2>
            <p className="text-muted-foreground">Выберите проверенный шаблон для вашей отрасли</p>
            <button
              onClick={onShowTemplateGallery}
              className="mt-4 bg-surface text-foreground py-2 px-6 rounded-lg font-medium hover:bg-surface-elevated transition"
            >
              Посмотреть все шаблоны →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.slice(0, 6).map((template) => (
              <div
                key={template.id}
                className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
                onClick={() => onTemplateSelect(template)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-primary-foreground text-xl mr-4">
                    {template.category === 'food' ? '🍽️' : 
                     template.category === 'tech' ? '💻' : 
                     template.category === 'retail' ? '🛍️' : '🏢'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                    <p className="text-muted-foreground text-sm">{template.category}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{template.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-primary text-sm font-medium">Готов к использованию</span>
                  <span className="text-success-foreground text-xs">✓ Проверено</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;