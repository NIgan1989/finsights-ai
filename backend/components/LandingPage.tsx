import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'ИИ-аналитика',
    desc: 'Автоматический анализ выписок, прогнозы и рекомендации для бизнеса.',
    icon: '🤖',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Интерактивные отчёты',
    desc: 'Дашборд, графики, KPI, экспорт PDF/Excel.',
    icon: '📊',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Безопасность',
    desc: 'Ваши данные хранятся только у вас. Шифрование и приватность.',
    icon: '🔒',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Поддержка',
    desc: 'Быстрая помощь и консультации по работе сервиса.',
    icon: '💬',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Автокатегоризация',
    desc: 'Умное распознавание и классификация всех ваших транзакций.',
    icon: '🏷️',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Финансовое моделирование',
    desc: 'DCF модели, сценарный анализ и оценка стоимости бизнеса.',
    icon: '📈',
    gradient: 'from-teal-500 to-blue-500'
  }
];

// Тарифы в тенге
const plans = [
  {
    name: 'Бесплатно',
    price: '0 ₸',
    features: [
      '1 бизнес-профиль',
      'До 200 транзакций',
      'ИИ-ассистент с лимитом',
      'Экспорт PDF',
      'Базовые отчёты'
    ],
    action: 'free',
    cta: 'Начать бесплатно',
    popular: false
  },
  {
    name: 'PRO',
    price: '2 200 ₸/мес',
    features: [
      'Неограниченно профилей',
      'Безлимит транзакций',
      'ИИ-ассистент без лимитов',
      'Экспорт PDF/Excel',
      'Расширенная аналитика',
      'Приоритетная поддержка'
    ],
    action: 'pro',
    cta: 'Выбрать PRO',
    popular: true
  }
];

const LandingPage: React.FC = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();

  const handlePlanSelect = (action: string) => {
    console.log('[LandingPage] handlePlanSelect called with action:', action);
    
    if (action === 'free' || action === 'pro') {
      // Показываем форму входа для любого тарифа
      setShowLoginForm(true);
    } else {
      console.error('[LandingPage] Unknown action:', action);
    }
  };

  const handleLoginSuccess = () => {
    console.log('[LandingPage] Login successful, redirecting to dashboard');
    navigate('/dashboard');
  };

  const handleLoginCancel = () => {
    setShowLoginForm(false);
  };

  // Если показываем форму входа, рендерим только её
  if (showLoginForm) {
    return <LoginForm onSuccess={handleLoginSuccess} onCancel={handleLoginCancel} />;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900 min-h-screen relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-400/30 to-pink-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm border-b border-white/20 bg-white/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <img src="/logo.svg" alt="FinSights AI" className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FinSights AI</span>
              <div className="text-xs text-slate-600 font-medium">Умная финансовая аналитика</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Возможности</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Тарифы</a>
              <a href="/auth-debug" className="text-slate-400 hover:text-slate-600 transition-colors">🔍</a>
            </nav>
            <button 
              onClick={() => setShowLoginForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              Начать работу
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-24 px-6 text-center max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200/50 text-blue-700 text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ИИ-платформа нового поколения
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            Умная <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">финансовая</span><br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">аналитика</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Загружайте банковские выписки и получайте <strong>профессиональные отчёты</strong> с ИИ-анализом. 
            Автоматическая категоризация, прогнозы и рекомендации для роста вашего бизнеса.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button 
            onClick={() => handlePlanSelect('free')}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Начать бесплатно
          </button>
          <button 
            onClick={() => handlePlanSelect('pro')}
            className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-blue-700 rounded-xl text-lg font-semibold hover:bg-white hover:border-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Узнать о PRO тарифе
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">548+</div>
            <div className="text-slate-600 font-medium">Транзакций обработано</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="text-3xl font-bold text-indigo-600 mb-2">95%</div>
            <div className="text-slate-600 font-medium">Точность категоризации</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="text-3xl font-bold text-purple-600 mb-2">5 мин</div>
            <div className="text-slate-600 font-medium">До готового отчёта</div>
          </div>
        </div>

        {/* Демо-вход для тестирования */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm mb-4">Готовые аккаунты для тестирования:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowLoginForm(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              👤 demo@finsights.ai / demo123
            </button>
            <button 
              onClick={() => setShowLoginForm(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              🔧 admin@finsights.ai / admin123
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Всё что нужно для 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> финансового успеха</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Мощные инструменты ИИ-аналитики, которые помогут вам принимать обоснованные бизнес-решения
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Посмотрите как это работает
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Интуитивно понятный интерфейс и мощная аналитика в одном решении
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all">
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-white text-4xl">📊</div>
              </div>
              <h3 className="text-lg font-bold mb-2">Интерактивный дашборд</h3>
              <p className="text-slate-600 text-sm">Все ключевые метрики на одном экране</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all">
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-white text-4xl">🤖</div>
              </div>
              <h3 className="text-lg font-bold mb-2">ИИ-ассистент</h3>
              <p className="text-slate-600 text-sm">Умные рекомендации и прогнозы</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all">
              <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-600 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-white text-4xl">📈</div>
              </div>
              <h3 className="text-lg font-bold mb-2">Финансовые отчёты</h3>
              <p className="text-slate-600 text-sm">Профессиональная аналитика за минуты</p>
            </div>
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Выберите подходящий 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> тариф</span>
            </h2>
            <p className="text-xl text-slate-600">
              Начните с бесплатного тарифа или получите полный доступ с PRO
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, _index) => (
              <div 
                key={plan.name} 
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-blue-300 ring-4 ring-blue-100 scale-105' 
                    : 'border-white/50 hover:border-blue-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      🔥 Популярный
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-slate-900">{plan.name}</h3>
                  <div className="text-4xl font-extrabold mb-2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                  </div>
                  {plan.name === 'PRO' && (
                    <p className="text-slate-500 text-sm">все возможности без ограничений</p>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handlePlanSelect(plan.action)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:-translate-y-1 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow hover:shadow-lg'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center text-slate-500 mt-8">
            Все цены указаны в тенге (KZT). Оплата — переводом на Kaspi Gold.
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Отзывы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface p-6 rounded-xl border border-border">
            <p className="text-text-secondary mb-4">"Сэкономил 10 часов в неделю на подготовке финансовых отчётов. ИИ отлично категоризирует транзакции."</p>
            <div className="font-semibold">Алмат К., ИП</div>
          </div>
          <div className="bg-surface p-6 rounded-xl border border-border">
            <p className="text-text-secondary mb-4">"Прогнозы по денежному потоку помогли избежать кассового разрыва. Рекомендую!"</p>
            <div className="font-semibold">Айжан С., ТОО</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-primary/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-xl text-text-secondary mb-8">Загрузите первую выписку и получите анализ уже через минуту</p>
          <button 
            onClick={() => handlePlanSelect('free')}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary-hover transition shadow-lg"
          >
            🚀 Начать бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-text-secondary">
        <div className="max-w-6xl mx-auto">
          <p>&copy; 2025 FinSights AI. Умная финансовая аналитика для бизнеса.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 