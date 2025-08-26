import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheet: string;
  currentCell: { row: number; col: number; value: string };
  onApplySuggestion: (suggestion: string) => void;
  onAddRow?: (rowData: string[]) => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

const AIFinancialAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  currentSheet,
  currentCell,
  onApplySuggestion,
  onAddRow
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'chat'>('quick');
  const [newRowName, setNewRowName] = useState('');
  const [newRowValue, setNewRowValue] = useState('');
  const [chatQuery, setChatQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Быстрые действия в зависимости от листа
  const getQuickActions = (): QuickAction[] => {
    // Отраслевые шаблоны статей
    const industryTemplates = {
      'medical-clinic': {
        revenue: ['Консультации врачей', 'Диагностические услуги', 'Лабораторные анализы', 'УЗИ и рентген', 'Процедуры и манипуляции'],
        expenses: ['Зарплата медперсонала', 'Медицинские расходники', 'Амортизация оборудования', 'Лицензирование', 'Страхование']
      },
      'education-courses': {
        revenue: ['Онлайн курсы', 'Очные программы', 'Корпоративное обучение', 'Сертификация', 'Индивидуальные занятия'],
        expenses: ['Зарплата преподавателей', 'Разработка контента', 'Платформа и технологии', 'Маркетинг', 'Учебные материалы']
      },
      'logistics-delivery': {
        revenue: ['Курьерская доставка', 'Экспресс доставка', 'Складские услуги', 'Упаковка товаров', 'Страхование грузов'],
        expenses: ['Топливо и ГСМ', 'Зарплата водителей', 'Аренда складов', 'Обслуживание автопарка', 'Страхование транспорта']
      },
      'tourism-hotel': {
        revenue: ['Проживание в номерах', 'Ресторан и бар', 'Конференц-услуги', 'SPA и фитнес', 'Экскурсионные услуги'],
        expenses: ['Персонал отеля', 'Коммунальные услуги', 'Уборка и прачечная', 'Завтраки и питание', 'Маркетинг и реклама']
      },
      'auto-service': {
        revenue: ['ТО и диагностика', 'Ремонт двигателя', 'Ремонт ходовой', 'Кузовные работы', 'Шиномонтаж'],
        expenses: ['Запчасти и расходники', 'Зарплата механиков', 'Аренда бокса', 'Инструменты и оборудование', 'Утилизация отходов']
      },
      'beauty-salon': {
        revenue: ['Стрижки и укладки', 'Окрашивание волос', 'Маникюр и педикюр', 'Косметология', 'Массаж'],
        expenses: ['Зарплата мастеров', 'Профессиональная косметика', 'Аренда кресел', 'Оборудование', 'Коммунальные услуги']
      },
      'coffee-shop': {
        revenue: ['Кофе и напитки', 'Выпечка и десерты', 'Завтраки и обеды', 'Продажа зерна', 'Кейтеринг'],
        expenses: ['Продукты и ингредиенты', 'Зарплата персонала', 'Аренда помещения', 'Коммунальные услуги', 'Оборудование кафе']
      }
    };

    // Определяем текущую отрасль по currentSheet или можно добавить параметр
    const getIndustryItems = (type: 'revenue' | 'expenses') => {
      // Здесь можно было бы определить отрасль из контекста модели
      // Пока используем общие шаблоны
      if (currentSheet === 'revenue' && type === 'revenue') {
        return ['Основные продажи', 'Дополнительные услуги', 'Абонентская плата', 'Комиссионные доходы', 'Партнерские программы'];
      }
      if (currentSheet === 'expenses' && type === 'expenses') {
        return ['Аренда помещения', 'Зарплата персонала', 'Маркетинг и реклама', 'Коммунальные услуги', 'Амортизация оборудования'];
      }
      return [];
    };

    switch (currentSheet) {
      case 'assumptions':
        return [
          {
            id: 'tax_rate',
            title: 'Налоговая ставка КПН',
            description: 'Стандартная ставка 20% в Казахстане',
            icon: '📊',
            action: () => onApplySuggestion('20%')
          },
          {
            id: 'wacc',
            title: 'WACC для малого бизнеса',
            description: 'Типичная ставка дисконтирования 18%',
            icon: '💹',
            action: () => onApplySuggestion('18%')
          },
          {
            id: 'growth',
            title: 'Консервативный рост',
            description: 'Умеренный рост 15% в год',
            icon: '📈',
            action: () => onApplySuggestion('15%')
          },
          {
            id: 'auto_fill_assumptions',
            title: 'Автозаполнение предпосылок',
            description: 'Заполнить типичными значениями для отрасли',
            icon: '⚡',
            action: () => {
              // Автозаполнение нескольких предпосылок сразу
              const assumptions = [
                'Налоговая ставка: 20%',
                'Темп роста: 15%', 
                'WACC: 18%',
                'Инфляция: 7%'
              ];
              onApplySuggestion(assumptions.join('\n'));
            }
          }
        ];

      case 'revenue':
        const revenueItems = getIndustryItems('revenue');
        return [
          {
            id: 'add_revenue_source',
            title: 'Добавить источник дохода',
            description: 'Новая строка доходов',
            icon: '➕',
            action: () => setActiveTab('chat')
          },
          {
            id: 'revenue_formula',
            title: 'Формула выручки',
            description: 'Клиенты × Средний чек × Частота',
            icon: '📐',
            action: () => onApplySuggestion('=B2*C2*D2')
          },
          {
            id: 'growth_formula',
            title: 'Рост выручки',
            description: 'Рост 15% к предыдущему году',
            icon: '⬆️',
            action: () => onApplySuggestion('=B2*1.15')
          },
          ...revenueItems.slice(0, 3).map((item, index) => ({
            id: `quick_revenue_${index}`,
            title: `Добавить: ${item}`,
            description: 'Типичный источник дохода для отрасли',
            icon: '💚',
            action: () => {
              if (onAddRow) {
                onAddRow([item, '0', '0', '0']);
              }
            }
          }))
        ];

      case 'expenses':
        const expenseItems = getIndustryItems('expenses');
        return [
          {
            id: 'add_expense',
            title: 'Добавить статью расходов',
            description: 'Новая строка расходов',
            icon: '➕',
            action: () => setActiveTab('chat')
          },
          {
            id: 'percent_expense',
            title: 'Процент от выручки',
            description: 'Переменные затраты в % от продаж',
            icon: '📊',
            action: () => onApplySuggestion('=revenue!B6*0.05')
          },
          {
            id: 'sum_formula',
            title: 'Сумма расходов',
            description: 'Суммировать диапазон ячеек',
            icon: '🧮',
            action: () => onApplySuggestion('=SUM(B2:B10)')
          },
          ...expenseItems.slice(0, 3).map((item, index) => ({
            id: `quick_expense_${index}`,
            title: `Добавить: ${item}`,
            description: 'Типичная статья расходов для отрасли',
            icon: '💸',
            action: () => {
              if (onAddRow) {
                onAddRow([item, '0', '0', '0']);
              }
            }
          }))
        ];

      case 'pnl':
        return [
          {
            id: 'ebitda',
            title: 'EBITDA',
            description: 'Выручка минус операционные расходы',
            icon: '💰',
            action: () => onApplySuggestion('=B2-B3')
          },
          {
            id: 'tax_calc',
            title: 'Расчет налогов',
            description: 'Налог с прибыли до налогообложения',
            icon: '📋',
            action: () => onApplySuggestion('=B6*assumptions!B2')
          },
          {
            id: 'margin',
            title: 'Рентабельность',
            description: 'Чистая прибыль / Выручка',
            icon: '📈',
            action: () => onApplySuggestion('=B8/B2')
          },
          {
            id: 'break_even',
            title: 'Точка безубыточности',
            description: 'Минимальная выручка для покрытия затрат',
            icon: '⚖️',
            action: () => onApplySuggestion('=expenses!B8')
          }
        ];

      default:
        return [
          {
            id: 'help',
            title: 'Помощь',
            description: 'Выберите лист для получения подсказок',
            icon: '💡',
            action: () => {}
          }
        ];
    }
  };

  // Обработка добавления новой строки
  const handleAddRow = () => {
    if (!newRowName.trim()) return;
    
    const rowData = [newRowName, newRowValue || '0', '0', '0'];
    if (onAddRow) {
      onAddRow(rowData);
    }
    
    setNewRowName('');
    setNewRowValue('');
    setActiveTab('quick');
  };

  // Простой чат для вопросов
  const handleChatSubmit = async () => {
    if (!chatQuery.trim()) return;
    
    // Получаем текущего пользователя
    const { userId, email } = useUser();
    
    // Проверяем авторизацию
    const currentUserId = userId ?? email;
    if (!currentUserId || currentUserId.startsWith('guest_')) {
      // Пользователь не авторизован или является гостем
      subscriptionService.showUpgradeModal('Войдите, чтобы использовать ИИ ассистента');
      return;
    }
    
    // Проверяем лимит ИИ запросов
    const limitCheck = subscriptionService.checkAiRequestLimit();
    if (!limitCheck.allowed) {
      subscriptionService.showUpgradeModal(limitCheck.reason || 'Лимит ИИ запросов достигнут');
      return;
    }
    
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: chatQuery }]);
    
    // Увеличиваем счетчик ИИ запросов
    await subscriptionService.incrementAiRequests(currentUserId);
    
    // Простые ответы без API
    let response = '';
    const query = chatQuery.toLowerCase();
    
    if (query.includes('формула') || query.includes('расчет')) {
      response = `Для листа "${currentSheet}" рекомендую использовать формулы:
      
• Ссылка на другой лист: =sheetname!A1
• Сумма диапазона: =SUM(A1:A10) 
• Процент: =A1*0.15
• Рост: =A1*1.15`;
    } else if (query.includes('добавить') || query.includes('статья')) {
      response = `Чтобы добавить новую статью ${currentSheet === 'revenue' ? 'дохода' : 'расходов'}:

1. Введите название статьи
2. Укажите сумму или формулу
3. Нажмите "Добавить строку"

Примеры статей:
${currentSheet === 'revenue' 
  ? '• Продажи товаров\n• Оказание услуг\n• Комиссионный доход' 
  : '• Аренда офиса\n• Зарплата\n• Маркетинг\n• Коммунальные услуги'}`;
    } else if (query.includes('процент') || query.includes('%')) {
      response = `Типичные проценты для бизнеса:

• Себестоимость: 30-60% от выручки
• Зарплаты: 15-30% от выручки  
• Аренда: 5-15% от выручки
• Маркетинг: 2-10% от выручки
• Налог на прибыль: 20% в Казахстане`;
    } else {
      response = `Я помогу вам с финансовой моделью! 

Часто задаваемые вопросы:
• "Как добавить статью расходов?"
• "Какие формулы использовать?"
• "Какой процент от выручки нормальный?"

Или используйте быстрые действия на вкладке "Быстрые действия".`;
    }
    
    setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    setChatQuery('');
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">🤖 Помощник по финансам</h2>
              <p className="text-blue-100 text-sm">
                Лист: {currentSheet} • Ячейка: {String.fromCharCode(65 + currentCell.col)}{currentCell.row + 1}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'quick'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              ⚡ Быстрые действия
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              💬 Задать вопрос
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Быстрые действия для листа "{currentSheet}"
              </h3>
              
              {getQuickActions().map(action => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{action.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{action.description}</div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Добавление новой строки */}
              {(currentSheet === 'revenue' || currentSheet === 'expenses') && (
                <div className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    ➕ Добавить новую статью {currentSheet === 'revenue' ? 'дохода' : 'расходов'}
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newRowName}
                      onChange={(e) => setNewRowName(e.target.value)}
                      placeholder={`Название ${currentSheet === 'revenue' ? 'дохода' : 'расхода'}`}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newRowValue}
                      onChange={(e) => setNewRowValue(e.target.value)}
                      placeholder="Сумма или формула (например: 100000 или =A1*0.1)"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={handleAddRow}
                      disabled={!newRowName.trim()}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Добавить строку
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="text-4xl mb-4">💬</div>
                    <p>Задайте вопрос о финансовой модели</p>
                    <p className="text-sm mt-2">Например: "Как добавить статью расходов?" или "Какие формулы использовать?"</p>
                  </div>
                )}
                
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Спросите что-нибудь..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={isLoading || !chatQuery.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  📤
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIFinancialAssistant;
