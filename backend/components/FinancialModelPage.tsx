import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';

interface ModelData {
  companyName: string;
  industry: string;
  stage: 'startup' | 'growth' | 'mature' | 'turnaround';
  timeHorizon: number;
  currency: string;
  baseYear: number;
  
  // Revenue streams
  revenueStreams: Array<{
    name: string;
    type: 'recurring' | 'one-time' | 'commission' | 'subscription';
    currentValue: number;
    growthRate: number;
    seasonality?: number[];
  }>;
  
  // Cost structure
  costStructure: {
    cogs: Array<{ name: string; percentage: number; isVariable: boolean }>;
    opex: Array<{ name: string; amount: number; growthRate: number; isFixed: boolean }>;
    capex: Array<{ name: string; amount: number; depreciation: number }>;
  };
  
  // Financial assumptions
  assumptions: {
    taxRate: number;
    wacc: number;
    terminalGrowthRate: number;
    workingCapital: {
      dso: number; // Days Sales Outstanding
      dpo: number; // Days Payable Outstanding
      dio: number; // Days Inventory Outstanding
    };
  };
}

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  type?: 'question' | 'analysis' | 'model' | 'suggestion';
}

interface ModelStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  data?: any;
}

const FinancialModelPage: React.FC = () => {
  const { } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [modelData, setModelData] = useState<Partial<ModelData>>({});
  const [generatedModel, setGeneratedModel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'model' | 'analysis'>('chat');

  // Проверяем доступ к финансовому моделированию
  const hasAccess = subscriptionService.checkFeatureAccess('hasFinancialModeling');
  
  if (!hasAccess.allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-3-5a6 6 0 0110.318 0H18a3 3 0 013 3v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a3 3 0 013-3h0.318A6 6 0 0112 10z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">PRO функция</h2>
          <p className="text-text-secondary mb-6">{hasAccess.reason}</p>
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition"
          >
            Обновить до PRO
          </button>
        </div>
      </div>
    );
  }

  const modelingSteps: ModelStep[] = [
    { id: 'company', title: 'Информация о компании', description: 'Основные данные о бизнесе', completed: false },
    { id: 'revenue', title: 'Модель доходов', description: 'Источники и драйверы доходов', completed: false },
    { id: 'costs', title: 'Структура затрат', description: 'COGS, OPEX, CAPEX', completed: false },
    { id: 'assumptions', title: 'Финансовые предположения', description: 'WACC, налоги, рост', completed: false },
    { id: 'model', title: 'Создание модели', description: 'DCF, P&L, Balance Sheet', completed: false },
    { id: 'analysis', title: 'Анализ и сценарии', description: 'Чувствительность, стресс-тесты', completed: false }
  ];

  useEffect(() => {
    // Инициализация с приветственным сообщением
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `🏢 **Добро пожаловать в AI Financial Modeling Studio!**

Я ваш автономный финансовый аналитик. Создам для вас профессиональную финансовую модель по всем лучшим практикам.

**Что я умею:**
📊 DCF модели с детальными прогнозами
💰 Комплексное моделирование доходов и расходов  
📈 Сценарный анализ и стресс-тесты
🎯 Оптимизация структуры капитала
⚡ Анализ чувствительности ключевых драйверов

**Процесс создания модели:**
1️⃣ Сбор информации о компании
2️⃣ Моделирование источников доходов
3️⃣ Структурирование затрат (COGS/OPEX/CAPEX)
4️⃣ Финансовые предположения (WACC, налоги)
5️⃣ Построение трехмерной модели (P&L, CF, BS)
6️⃣ Анализ и оптимизация

Начнем? Расскажите о вашей компании или проекте!`,
      timestamp: new Date(),
      type: 'question'
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim(); // Сохраняем текст перед очисткой
    setInput(''); // Очищаем поле немедленно для лучшего UX

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/financial-model/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          currentStep,
          modelData,
          messages: messages.slice(-10) // Последние 10 сообщений для контекста
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: data.type || 'analysis'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Обновляем данные модели если они пришли
      if (data.modelUpdate) {
        setModelData(prev => ({ ...prev, ...data.modelUpdate }));
      }

      // Переходим к следующему шагу если текущий завершен
      if (data.stepCompleted && currentStep < modelingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }

      // Если модель готова
      if (data.model) {
        setGeneratedModel(data.model);
        setActiveTab('model');
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Попробуйте переформулировать вопрос.`,
        timestamp: new Date(),
        type: 'analysis'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, currentStep, modelData, modelingSteps.length]);



  const generateFullModel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/financial-model/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelData })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedModel(data.model);
      setActiveTab('model');

      const modelMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ **Финансовая модель успешно создана!**

📊 **Включено:**
- DCF анализ с ${data.model.projectionYears} годами прогнозов
- P&L, Cash Flow, Balance Sheet
- ${data.model.scenarios?.length || 3} сценария развития
- Анализ чувствительности по ключевым драйверам
- Рекомендации по оптимизации

💡 **Справедливая стоимость:** ${data.model.valuation?.fairValue || 'Рассчитывается...'}

Перейдите на вкладку "Модель" для детального просмотра!`,
        timestamp: new Date(),
        type: 'model'
      };

      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error generating model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StepProgress = () => (
    <div className="card p-6 mb-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-xl">📋</span>
        </div>
        <h3 className="text-lg font-bold text-text-primary">Прогресс создания модели</h3>
      </div>
      
      <div className="space-y-4">
        {modelingSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className={`
              group relative p-4 rounded-2xl transition-all duration-300 border-2
              ${isActive 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md' 
                : isCompleted 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className="flex items-start gap-4">
                <div className={`
                  relative w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                    : isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  
                  {isActive && (
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-30 animate-ping" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm mb-1 transition-colors ${
                    isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  
                  {isActive && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      В процессе...
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Прогресс бар */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
          <span>Общий прогресс</span>
          <span>{Math.round((currentStep / (modelingSteps.length - 1)) * 100)}%</span>
        </div>
        <div className="progress">
          <div 
            className="progress-bar transition-all duration-500" 
            style={{ width: `${(currentStep / (modelingSteps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      
      {Object.keys(modelData).length > 0 && (
        <button
          onClick={generateFullModel}
          disabled={isLoading}
          className="btn btn-primary w-full mt-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Создание модели...
            </div>
          ) : (
            <>🚀 Создать полную модель</>
          )}
        </button>
      )}
    </div>
  );

  const ChatInterface = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-4xl p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-surface border border-border'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Анализирую и создаю рекомендации...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-border p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="💬 Опишите вашу компанию, отрасль, или задайте вопрос..."
              className="input w-full pl-4 pr-12 py-4 text-sm placeholder:text-gray-400 disabled:opacity-50 shadow-sm"
              disabled={isLoading}
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="btn btn-primary px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );

  const ModelView = () => (
    <div className="p-6">
      {generatedModel ? (
        <div className="space-y-6">
          <div className="bg-surface rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">📊 Финансовая модель: {generatedModel.companyName}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-sm text-text-secondary">Справедливая стоимость</div>
                <div className="text-2xl font-bold text-primary">{generatedModel.valuation?.fairValue || 'Расчет...'}</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-sm text-text-secondary">NPV</div>
                <div className="text-2xl font-bold text-green-600">{generatedModel.valuation?.npv || 'Расчет...'}</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="text-sm text-text-secondary">IRR</div>
                <div className="text-2xl font-bold text-blue-600">{generatedModel.valuation?.irr || 'Расчет...'}%</div>
              </div>
            </div>

            {/* Здесь будут таблицы P&L, Cash Flow, Balance Sheet */}
            <div className="bg-background p-4 rounded-lg">
              <h4 className="font-semibold mb-2">P&L Прогноз (млн. руб.)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Показатель</th>
                      {Array.from({length: 5}, (_, i) => (
                        <th key={i} className="text-right p-2">{new Date().getFullYear() + i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Выручка</td>
                      {generatedModel.projections?.revenue?.map((val: number, i: number) => (
                        <td key={i} className="text-right p-2">{val.toFixed(1)}</td>
                      )) || Array.from({length: 5}, (_, i) => <td key={i} className="text-right p-2">-</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Себестоимость</td>
                      {generatedModel.projections?.cogs?.map((val: number, i: number) => (
                        <td key={i} className="text-right p-2">({val.toFixed(1)})</td>
                      )) || Array.from({length: 5}, (_, i) => <td key={i} className="text-right p-2">-</td>)}
                    </tr>
                    <tr className="border-b font-semibold">
                      <td className="p-2">Валовая прибыль</td>
                      {generatedModel.projections?.grossProfit?.map((val: number, i: number) => (
                        <td key={i} className="text-right p-2">{val.toFixed(1)}</td>
                      )) || Array.from({length: 5}, (_, i) => <td key={i} className="text-right p-2">-</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Модель не создана</h3>
          <p className="text-text-secondary">Пообщайтесь с AI-ассистентом для создания финансовой модели</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold gradient-text">AI Financial Modeling Studio</h1>
              <p className="text-text-secondary font-medium">Автономный ИИ-ассистент для создания профессиональных финансовых моделей</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[900px]">
          {/* Sidebar с прогрессом */}
          <div className="lg:col-span-1">
            <StepProgress />
          </div>

          {/* Основная область */}
          <div className="lg:col-span-3">
            <div className="card h-full flex flex-col animate-fade-in">
              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex">
                  {[
                    { id: 'chat', label: '💬 Чат с ИИ', icon: '🤖' },
                    { id: 'model', label: '📊 Модель', icon: '📈' },
                    { id: 'analysis', label: '📈 Анализ', icon: '🔍' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary border-b-2 border-primary bg-primary/5'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' && <ChatInterface />}
                {activeTab === 'model' && <ModelView />}
                {activeTab === 'analysis' && (
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">Анализ чувствительности</h3>
                    <p className="text-text-secondary">Функция будет доступна после создания модели</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialModelPage; 