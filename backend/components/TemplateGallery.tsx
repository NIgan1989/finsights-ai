import React, { useState } from 'react';
import templates, { TemplateData } from '../../templates/templateData';

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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📊 Галерея шаблонов</h2>
              <p className="text-blue-100">Выберите готовый шаблон или создайте свой с помощью ИИ</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
            <button
              onClick={onCustomGenerate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
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
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition cursor-pointer"
                onClick={() => onTemplateSelected(template.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{template.icon}</div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getComplexityColor(template.complexity)}`}>
                            {getComplexityText(template.complexity)}
                          </span>
                          {template.verified && (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs rounded-full">
                              ✓ Проверено
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {template.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Ключевые особенности:
                    </div>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Примерные показатели ({template.timeframe}):
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Выручка</div>
                        <div className="font-medium text-green-600">{template.preview.revenue}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Расходы</div>
                        <div className="font-medium text-red-600">{template.preview.expenses}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Прибыль</div>
                        <div className="font-medium text-blue-600">{template.preview.profit}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateSelected(template.id);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
              <div className="text-gray-500 dark:text-gray-400">
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
