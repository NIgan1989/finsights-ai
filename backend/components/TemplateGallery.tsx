import React, { useState } from 'react';
import templates, { TemplateData } from '../../templates/templateData';
import { useTheme } from './ThemeProvider';

interface TemplateGalleryProps {
  onTemplateSelected: (templateId: string) => void;
  onCustomGenerate: () => void;
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  onTemplateSelected, 
  onCustomGenerate, 
  onClose 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Используем только реализованные шаблоны
  const implementedTemplates = templates.filter(t => t.implemented);

  const categories = [
    { id: 'all', name: 'Все категории', count: implementedTemplates.length },
    { id: 'food', name: '🍽️ Общепит', count: implementedTemplates.filter(t => t.category === 'food').length },
    { id: 'tech', name: '💻 Технологии', count: implementedTemplates.filter(t => t.category === 'tech').length },
    { id: 'retail', name: '🛍️ Ритейл', count: implementedTemplates.filter(t => t.category === 'retail').length },
    { id: 'services', name: '🤝 Услуги', count: implementedTemplates.filter(t => t.category === 'services').length },
    { id: 'production', name: '🏭 Производство', count: implementedTemplates.filter(t => t.category === 'production').length },
    { id: 'real-estate', name: '🏠 Недвижимость', count: implementedTemplates.filter(t => t.category === 'real-estate').length },
    { id: 'healthcare', name: '🏥 Медицина', count: implementedTemplates.filter(t => t.category === 'healthcare').length },
    { id: 'education', name: '🎓 Образование', count: implementedTemplates.filter(t => t.category === 'education').length },
    { id: 'logistics', name: '🚚 Логистика', count: implementedTemplates.filter(t => t.category === 'logistics').length },
    { id: 'tourism', name: '🏨 Туризм', count: implementedTemplates.filter(t => t.category === 'tourism').length },
    { id: 'automotive', name: '🔧 Автосервис', count: implementedTemplates.filter(t => t.category === 'automotive').length },
    { id: 'beauty', name: '💄 Красота', count: implementedTemplates.filter(t => t.category === 'beauty').length }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? implementedTemplates 
    : implementedTemplates.filter(t => t.category === selectedCategory);

  const { theme } = useTheme();

  const getComplexityColor = (complexity: string) => {
    const baseClasses = String(theme) === 'light' ? 'border' : '';
    switch (complexity) {
      case 'simple': return `bg-success-light text-success ${baseClasses ? 'border-success-light' : ''}`;
      case 'medium': return `bg-warning-light text-warning ${baseClasses ? 'border-warning-light' : ''}`;
      case 'advanced': return `bg-destructive-light text-destructive ${baseClasses ? 'border-destructive-light' : ''}`;
      default: return `bg-muted-light text-muted ${baseClasses ? 'border-muted-light' : ''}`;
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'Простая';
      case 'medium': return 'Средняя';
      case 'advanced': return 'Сложная';
      default: return complexity;
    }
  };

  return (
    <div className="fixed inset-0 bg-background-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-modal-card rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground dark:text-primary-foreground p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📊 Галерея шаблонов</h2>
              <p className="text-primary-foreground/80 dark:text-primary-foreground/80">Выберите готовый шаблон или создайте свой с помощью ИИ</p>
            </div>
            <button
              onClick={onClose}
              className="text-primary-foreground dark:text-primary-foreground hover:bg-primary-foreground/20 rounded-full p-2 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground dark:text-primary-foreground'
                      : `bg-muted-light text-muted hover:bg-muted-hover ${String(theme) === 'light' ? 'border border-muted-light' : ''}`
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
            <button
              onClick={onCustomGenerate}
              className="bg-gradient-secondary-accent text-primary-foreground dark:text-primary-foreground px-6 py-2 rounded-lg hover:bg-gradient-secondary-accent-hover transition font-medium"
            >
              🤖 Создать с ИИ
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-template-card border border-border rounded-lg hover:shadow-lg transition cursor-pointer"
                onClick={() => onTemplateSelected(template.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{template.icon}</div>
                      <div>
                        <h3 className="font-bold text-foreground">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getComplexityColor(template.complexity)}`}>
                            {getComplexityText(template.complexity)}
                          </span>
                          {template.verified && (
                            <span className={`bg-primary-light text-primary px-2 py-1 text-xs rounded-full ${String(theme) === 'light' ? 'border border-primary-light' : ''}`}>
                              ✓ Проверено
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4">
                    {template.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-muted mb-2">
                      Ключевые особенности:
                    </div>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center">
                          <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-muted-light rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-muted mb-2">
                      Примерные показатели ({template.timeframe}):
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted">Выручка</div>
                        <div className="font-medium text-success">{template.preview.revenue}</div>
                      </div>
                      <div>
                        <div className="text-muted">Расходы</div>
                        <div className="font-medium text-destructive">{template.preview.expenses}</div>
                      </div>
                      <div>
                        <div className="text-muted">Прибыль</div>
                        <div className="font-medium text-primary">{template.preview.profit}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateSelected(template.id);
                    }}
                    className="w-full bg-primary text-primary-foreground dark:text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary-hover transition text-sm font-medium"
                  >
                    Использовать шаблон
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-muted">
                Шаблоны в этой категории скоро появятся
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
