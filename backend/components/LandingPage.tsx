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
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white min-h-screen relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-cyan-400/60 rotate-45 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-400/60 rounded-full animate-bounce" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-8 bg-pink-400/60 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-2/3 right-1/6 w-6 h-6 border-2 border-blue-400/60 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl border-b border-white/10 bg-black/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-2xl font-black text-white">F</span>
            </div>
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">FinSights AI</span>
              <div className="text-xs text-cyan-300 font-semibold">Умная финансовая аналитика</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-cyan-200 hover:text-cyan-100 transition-all duration-300 font-semibold relative group">
                Возможности
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#pricing" className="text-cyan-200 hover:text-cyan-100 transition-all duration-300 font-semibold relative group">
                Тарифы
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/auth-debug" className="text-purple-300 hover:text-purple-200 transition-colors">🔍</a>
            </nav>
            <button 
              onClick={() => setShowLoginForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 hover:scale-105 font-semibold border border-cyan-400/30"
            >
              Начать работу
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-32 px-6 text-center max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">ИИ-платформа нового поколения</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-8xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tight">
            <span className="block mb-2 bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">Умная</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-pulse">финансовая</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">аналитика</span>
          </h1>
          <div className="mb-16 max-w-5xl mx-auto">
            <p className="text-2xl md:text-3xl text-white/95 mb-6 leading-relaxed font-medium">
              Загружайте банковские выписки и получайте <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold text-3xl md:text-4xl">профессиональные отчёты</span> с ИИ-анализом.
            </p>
            <p className="text-xl md:text-2xl text-cyan-100/90 leading-relaxed">
              Автоматическая категоризация, прогнозы и рекомендации для роста вашего бизнеса.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button 
            onClick={() => handlePlanSelect('free')}
            className="group relative px-16 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl text-2xl font-bold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-500 shadow-2xl hover:shadow-4xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <svg className="w-8 h-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Начать бесплатно</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-300 rounded-full"></div>
          </button>
          <button 
            onClick={() => handlePlanSelect('pro')}
            className="group px-16 py-6 bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white rounded-3xl text-2xl font-bold hover:bg-white/30 hover:border-white/50 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4"
          >
            <span className="text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">✨</span>
            <span>Узнать о PRO тарифе</span>
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "👥", number: "548+", text: "транзакций обработано", color: "from-blue-500 to-cyan-500" },
            { icon: "🎯", number: "95%", text: "точность категоризации", color: "from-purple-500 to-pink-500" },
            { icon: "⚡", number: "5 мин", text: "до готового отчёта", color: "from-green-500 to-emerald-500" }
          ].map((stat, index) => (
            <div key={index} className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                  {stat.icon}
                </div>
                <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.number}
                </div>
                <div className="text-white/80 font-medium text-lg">
                  {stat.text}
                </div>
              </div>
            </div>
          ))}
        </div>


      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-32 px-6 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* Enhanced badge */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl animate-bounce">⚡</span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">Мощные возможности</span>
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced heading */}
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Всё что нужно для 
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">финансового</span><br/>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">успеха</span>
            </h2>
            
            <p className="text-2xl text-white/90 max-w-4xl mx-auto font-medium leading-relaxed mb-12">
              Мощные инструменты <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">ИИ-аналитики</span>, которые помогут вам принимать обоснованные бизнес-решения
            </p>
          </div>
          
          {/* Enhanced feature cards with glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="group relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:scale-105 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                  {/* Enhanced icon */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl group-hover:shadow-3xl`}>
                    {feature.icon}
                  </div>
                  
                  {/* Enhanced title */}
                  <h3 className={`text-2xl font-black mb-6 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-all duration-300`}>
                    {feature.title}
                  </h3>
                  
                  {/* Enhanced description */}
                  <p className="text-white/80 leading-relaxed text-lg font-medium group-hover:text-white/90 transition-colors duration-300">
                    {feature.desc}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-300/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-green-300/15 to-emerald-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-8">
              <span className="text-lg animate-pulse">🎬</span>
              Демонстрация возможностей
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Посмотрите как это <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">работает</span>
            </h2>
            <p className="text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Интуитивно понятный интерфейс и <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">мощная аналитика</span> в одном решении
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                title: "Интерактивный дашборд",
                desc: "Все ключевые метрики на одном экране с возможностью детального анализа",
                icon: "📊",
                gradient: "from-blue-500 to-indigo-600",
                bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"
              },
              {
                title: "ИИ-ассистент",
                desc: "Умные рекомендации и прогнозы на основе машинного обучения",
                icon: "🤖",
                gradient: "from-purple-500 to-pink-600",
                bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30"
              },
              {
                title: "Финансовые отчёты",
                desc: "Профессиональная аналитика и отчётность за считанные минуты",
                icon: "📈",
                gradient: "from-green-500 to-emerald-600",
                bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
              }
            ].map((demo, index) => (
              <div key={index} className="group relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/95 dark:to-slate-700/85 backdrop-blur-xl rounded-3xl p-8 hover:shadow-4xl transition-all duration-500 border border-slate-200 dark:border-slate-600/50 hover:-translate-y-6 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-700/30 dark:to-slate-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className={`aspect-video bg-gradient-to-br ${demo.bgGradient} rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`text-6xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10`}>
                      {demo.icon}
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                  </div>
                  
                  <h3 className={`text-2xl font-black mb-4 bg-gradient-to-r ${demo.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                    {demo.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    {demo.desc}
                  </p>
                  
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-400/30">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">📊</div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">🤖</div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">📈</div>
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">
                Попробуйте <span className="text-blue-600 dark:text-blue-400 font-bold">все возможности</span> бесплатно
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="relative z-10 py-32 px-6 overflow-hidden">
        {/* Enhanced background with multiple gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-pink-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-600/15 to-emerald-600/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* Enhanced badge */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl animate-bounce">💎</span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">Прозрачные цены</span>
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced heading */}
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight text-white">
              Выберите подходящий<br/>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">тариф</span>
            </h2>
            
            <p className="text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
              Начните с <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-bold">бесплатного тарифа</span> или получите полный доступ с PRO
            </p>
          </div>
          
          {/* Enhanced pricing cards with glassmorphism */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={plan.name} 
                className={`group relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 border transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 flex flex-col h-auto overflow-hidden ${
                  plan.popular 
                    ? 'border-white/40 shadow-2xl scale-105 bg-white/15' 
                    : 'border-white/20 hover:border-white/40 hover:scale-105'
                }`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.popular ? 'from-blue-600/20 to-purple-600/20' : 'from-gray-500/10 to-slate-600/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {plan.popular && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse">
                      ⚡ Популярный выбор
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  {/* Plan icon */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${plan.popular ? 'from-blue-600 to-purple-600' : 'from-gray-500 to-slate-600'} rounded-2xl flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl`}>
                    {plan.popular ? '⭐' : '🚀'}
                  </div>
                  
                  <div className="text-center mb-10">
                    <h3 className={`text-3xl font-black mb-4 bg-gradient-to-r ${plan.popular ? 'from-blue-400 to-purple-400' : 'from-gray-400 to-slate-400'} bg-clip-text text-transparent`}>{plan.name}</h3>
                    <div className="text-5xl font-black mb-6 text-white">
                      {plan.price}
                    </div>
                    {plan.name === 'PRO' && (
                      <p className="text-white/80 text-lg font-medium">все возможности без ограничений</p>
                    )}
                    {plan.name === 'Бесплатно' && (
                      <p className="text-white/80 text-lg font-medium">идеально для начала работы</p>
                    )}
                  </div>
                  
                  <ul className="space-y-5 mb-10 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-white/90 text-lg font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => handlePlanSelect(plan.action)}
                      className={`group/btn relative w-full py-5 px-8 rounded-2xl font-bold text-xl transition-all duration-500 overflow-hidden ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:scale-110 shadow-xl'
                          : 'bg-white/20 text-white hover:bg-white/30 hover:scale-110 border border-white/30 hover:border-white/50'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">{plan.cta}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-white/80 mt-12 text-xl font-medium">
            Все цены указаны в тенге (KZT). Оплата — переводом на Kaspi Gold.
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm rounded-full border border-amber-200/50 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-sm font-semibold mb-8">
              <span className="text-lg animate-pulse">⭐</span>
              Отзывы клиентов
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Что говорят наши <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">клиенты</span>
            </h2>
            <p className="text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed font-medium">
              Более <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">10,000 предпринимателей</span> уже используют FinSights AI для управления финансами
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                name: "Алмат К.",
                role: "Индивидуальный предприниматель",
                content: "Сэкономил 10 часов в неделю на подготовке финансовых отчётов. ИИ отлично категоризирует транзакции и даёт полезные рекомендации.",
                rating: 5,
                avatar: "АК",
                color: "from-blue-500 to-indigo-600"
              },
              {
                name: "Айжан С.",
                role: "Директор ТОО",
                content: "Прогнозы по денежному потоку помогли избежать кассового разрыва. Теперь планирую бюджет на основе данных, а не интуиции.",
                rating: 5,
                avatar: "АС",
                color: "from-purple-500 to-pink-600"
              },
              {
                name: "Марат Б.",
                role: "Владелец сети кафе",
                content: "Автоматическая категоризация расходов сэкономила массу времени. Теперь вижу реальную прибыльность каждой точки.",
                rating: 5,
                avatar: "МБ",
                color: "from-emerald-500 to-teal-600"
              }
            ].map((testimonial, index) => (
              <div key={index} className="group relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/95 dark:to-slate-700/85 backdrop-blur-xl rounded-3xl p-10 hover:shadow-4xl transition-all duration-500 border border-slate-200 dark:border-slate-600/50 hover:-translate-y-6 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-700/30 dark:to-slate-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <div key={i} className="relative">
                        <svg className="w-7 h-7 text-yellow-400 fill-current transform group-hover:scale-125 transition-transform duration-300" viewBox="0 0 20 20" style={{animationDelay: `${i * 100}ms`}}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="absolute inset-0 bg-yellow-300 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative mb-8">
                     <div className="absolute -top-4 -left-4 text-6xl text-blue-200 dark:text-slate-600 font-serif opacity-50">"
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xl font-medium relative z-10">
                       {testimonial.content}
                     </p>
                     <div className="absolute -bottom-4 -right-4 text-6xl text-blue-200 dark:text-slate-600 font-serif opacity-50 rotate-180">"
                     </div>
                   </div>
                   
                   <div className="flex items-center">
                     <div className={`w-16 h-16 bg-gradient-to-br ${testimonial.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                       {testimonial.avatar}
                     </div>
                     <div>
                       <div className="font-bold text-slate-900 dark:text-white text-xl mb-1">{testimonial.name}</div>
                       <div className="text-slate-700 dark:text-slate-300 font-medium">{testimonial.role}</div>
                     </div>
                   </div>
                   
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                       <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="text-center mt-16">
             <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-400/30">
               <div className="flex -space-x-2">
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">АК</div>
                 <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">АС</div>
                 <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">МБ</div>
                 <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm">+7K</div>
               </div>
               <div className="text-slate-800 dark:text-slate-200 font-semibold">
                 Присоединяйтесь к <span className="text-green-600 dark:text-green-400 font-bold">10,000+</span> довольных клиентов
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* CTA */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/95 dark:to-slate-700/85 backdrop-blur-xl rounded-4xl p-16 shadow-3xl border border-slate-200 dark:border-slate-600/50 hover:shadow-4xl transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-700/30 dark:to-slate-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-sm rounded-full border border-green-200/50 dark:border-green-400/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-8">
                <span className="text-lg animate-bounce">🎯</span>
                Начните прямо сейчас
              </div>
              
              <h2 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
                Готовы <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">начать?</span>
              </h2>
              <p className="text-2xl text-slate-700 dark:text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                Загрузите первую выписку и получите <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">профессиональный анализ</span> уже через минуту
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <button 
                  onClick={() => handlePlanSelect('free')}
                  className="group relative px-16 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl text-2xl font-bold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-3xl hover:shadow-4xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10">🚀</span>
                  <span className="relative z-10">Начать бесплатно</span>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
                </button>
                <button 
                  onClick={() => handlePlanSelect('pro')}
                  className="group px-16 py-6 bg-white/90 dark:bg-slate-700/90 border-4 border-blue-300 dark:border-blue-400/60 text-blue-700 dark:text-blue-300 rounded-2xl text-2xl font-bold hover:bg-blue-50 dark:hover:bg-slate-600/90 hover:border-blue-400 dark:hover:border-blue-300 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-3"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">✨</span>
                  <span>Узнать о PRO</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700 dark:text-slate-200 text-lg font-medium">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Без обязательств</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Отмена в любое время</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Поддержка 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Логотип и описание */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-white">F</span>
                </div>
                <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">FinSights AI</span>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-md">
                Революционная платформа для финансового анализа с использованием искусственного интеллекта. Превращаем данные в прибыль.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 bg-slate-800/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-slate-800/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-slate-800/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Продукт */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Продукт</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Возможности
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Тарифы
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  API
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Интеграции
                </a></li>
              </ul>
            </div>
            
            {/* Поддержка */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Поддержка</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Документация
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Центр помощи
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Связаться с нами
                </a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full group-hover:w-2 transition-all duration-200"></span>
                  Статус системы
                </a></li>
              </ul>
            </div>
          </div>
          
          {/* Разделитель */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8"></div>
          
          {/* Нижняя часть */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-400 text-sm">
              © 2024 FinSights AI. Все права защищены.
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Политика конфиденциальности</a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Условия использования</a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
