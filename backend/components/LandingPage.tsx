import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'ИИ-аналитика',
    desc: 'Автоматический анализ выписок, прогнозы и рекомендации для бизнеса.',
    icon: '🤖',
    gradientNumber: 1
  },
  {
    title: 'Интерактивные отчёты',
    desc: 'Дашборд, графики, KPI, экспорт PDF/Excel.',
    icon: '📊',
    gradientNumber: 1
  },
  {
    title: 'Безопасность',
    desc: 'Ваши данные хранятся только у вас. Шифрование и приватность.',
    icon: '🔒',
    gradientNumber: 2
  },
  {
    title: 'Поддержка',
    desc: 'Быстрая помощь и консультации по работе сервиса.',
    icon: '💬',
    gradientNumber: 3
  },
  {
    title: 'Автокатегоризация',
    desc: 'Умное распознавание и классификация всех ваших транзакций.',
    icon: '🏷️',
    gradientNumber: 4
  },
  {
    title: 'Финансовое моделирование',
    desc: 'DCF модели, сценарный анализ и оценка стоимости бизнеса.',
    icon: '📈',
    gradientNumber: 2
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
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full blur-3xl animate-pulse" 
             style={{
               backgroundColor: `var(--color-primary) / 0.3`
             }}></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full blur-3xl animate-pulse" 
             style={{
               backgroundColor: `var(--color-accent) / 0.3`,
               animationDelay: '2s'
             }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse" 
             style={{
               backgroundColor: `var(--color-secondary) / 0.1`,
               animationDelay: '4s'
             }}></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-4 h-4 rotate-45 animate-bounce" 
             style={{
               backgroundColor: `var(--color-primary) / 0.6`,
               animationDelay: '1s'
             }}></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full animate-bounce" 
             style={{
               backgroundColor: `var(--color-accent) / 0.6`,
               animationDelay: '3s'
             }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-8 animate-pulse" 
             style={{
               backgroundColor: `var(--color-secondary) / 0.6`,
               animationDelay: '2s'
             }}></div>
        <div className="absolute top-2/3 right-1/6 w-6 h-6 border-2 rotate-45 animate-spin" 
             style={{
               borderColor: `var(--color-primary) / 0.6`,
               animationDuration: '8s'
             }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl border-b border-border/10 bg-background/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-2xl font-black text-primary-foreground">F</span>
            </div>
            <div>
              <span className="text-2xl font-black text-foreground drop-shadow-lg">FinSights AI</span>
              <div className="text-xs text-primary font-semibold">Умная финансовая аналитика</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-primary hover:text-primary/80 transition-all duration-300 font-semibold relative group">
                Возможности
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#pricing" className="text-primary hover:text-primary/80 transition-all duration-300 font-semibold relative group">
                Тарифы
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <button className="text-accent hover:text-accent/80 transition-colors p-2 rounded-lg hover:bg-accent/10" title="Поиск">
                🔍
              </button>
            </nav>
            <button 
              onClick={() => setShowLoginForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/80 transition-all duration-300 shadow-lg hover:shadow-primary/25 transform hover:-translate-y-0.5 hover:scale-105 font-semibold border border-primary/30"
            >
              Начать работу
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-32 px-6 text-center max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-surface/10 backdrop-blur-xl rounded-full border border-border/20 text-foreground text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-lg"></div>
            <span className="text-primary font-bold">ИИ-платформа нового поколения</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[0.9] tracking-tight">
            <span className="block mb-2 text-primary">Умная</span>
                <span className="block text-accent mb-2 animate-pulse">финансовая</span>
                <span className="block text-secondary">аналитика</span>
          </h1>
          <div className="mb-16 max-w-5xl mx-auto">
            <p className="text-lg md:text-xl text-foreground/95 mb-6 leading-relaxed font-medium">
              Загружайте банковские выписки и получайте <span className="text-success font-bold text-xl md:text-2xl">профессиональные отчёты</span> с ИИ-анализом.
            </p>
            <p className="text-base md:text-lg text-primary/90 leading-relaxed">
              Автоматическая категоризация, прогнозы и рекомендации для роста вашего бизнеса.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button 
            onClick={() => handlePlanSelect('free')}
            className="group relative px-12 py-4 bg-primary text-primary-foreground rounded-3xl text-lg font-bold hover:bg-primary/80 transition-all duration-500 shadow-2xl hover:shadow-4xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-surface/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-surface/10 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <svg className="w-8 h-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10">Начать бесплатно</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success/80 rounded-full"></div>
          </button>
          <button 
            onClick={() => handlePlanSelect('pro')}
            className="group px-12 py-4 bg-surface/20 backdrop-blur-xl border-2 border-border/30 text-foreground rounded-3xl text-lg font-bold hover:bg-surface/30 hover:border-border/50 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4"
          >
            <span className="text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">✨</span>
            <span>Узнать о PRO тарифе</span>
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "👥", number: "548+", text: "транзакций обработано", color: "bg-primary" },
            { icon: "🎯", number: "95%", text: "точность категоризации", color: "bg-accent" },
            { icon: "⚡", number: "5 мин", text: "до готового отчёта", color: "bg-success" }
          ].map((stat, index) => (
            <div key={index} className="group relative bg-surface/10 backdrop-blur-xl rounded-3xl p-8 border border-border/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-surface/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                  {stat.icon}
                </div>
                <div className={`text-2xl font-black mb-2 text-foreground`}>
                  {stat.number}
                </div>
                <div className="text-foreground/80 font-medium text-base">
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
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-success/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* Enhanced badge */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-surface/10 backdrop-blur-xl rounded-full border border-border/20 text-foreground text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl animate-bounce">⚡</span>
              <span className="text-primary font-bold">Мощные возможности</span>
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced heading */}
            <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
              Всё что нужно для 
              <span className="text-accent animate-pulse">финансового</span><br/>
              <span className="text-success">успеха</span>
            </h2>
            
            <p className="text-lg text-foreground/90 max-w-4xl mx-auto font-medium leading-relaxed mb-12">
              Мощные инструменты <span className="text-primary font-bold">ИИ-аналитики</span>, которые помогут вам принимать обоснованные бизнес-решения
            </p>
          </div>
          
          {/* Enhanced feature cards with glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="group relative bg-surface/10 backdrop-blur-xl rounded-3xl p-10 border border-border/20 hover:border-border/40 transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 hover:scale-105 overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-all duration-500 rounded-3xl"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-surface/5 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                  {/* Enhanced icon */}
                  <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl group-hover:shadow-3xl">
                    {feature.icon}
                  </div>
                  
                  {/* Enhanced title */}
                  <h3 className="text-2xl font-black mb-6 text-accent group-hover:scale-105 transition-all duration-300">
                    {feature.title}
                  </h3>
                  
                  {/* Enhanced description */}
                  <p className="text-foreground/80 leading-relaxed text-base font-medium group-hover:text-foreground/90 transition-colors duration-300">
                    {feature.desc}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-surface/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 20 20">
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
      <section className="relative z-10 py-32 px-6 bg-surface/50 dark:bg-surface/30 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 dark:bg-surface/60 backdrop-blur-sm rounded-full border border-primary/20 dark:border-primary/30 text-primary dark:text-primary text-sm font-semibold mb-8">
              <span className="text-lg animate-pulse">🎬</span>
              Демонстрация возможностей
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
              Посмотрите как это <span className="text-accent">работает</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Интуитивно понятный интерфейс и <span className="text-primary font-bold">мощная аналитика</span> в одном решении
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                title: "Интерактивный дашборд",
                desc: "Все ключевые метрики на одном экране с возможностью детального анализа",
                icon: "📊",
                gradientNumber: 1
              },
              {
                title: "ИИ-ассистент",
                desc: "Умные рекомендации и прогнозы на основе машинного обучения",
                icon: "🤖",
                gradientNumber: 2
              },
              {
                title: "Финансовые отчёты",
                desc: "Профессиональная аналитика и отчётность за считанные минуты",
                icon: "📈",
                gradientNumber: 3
              }
            ].map((demo, index) => (
              <div key={index} className="group relative bg-surface-subtle/90 backdrop-blur-xl rounded-3xl p-8 hover:shadow-4xl transition-all duration-500 border border-border dark:border-border/50 hover:-translate-y-6 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 dark:bg-surface/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="aspect-video bg-primary rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-surface/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="text-6xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10">
                      {demo.icon}
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 w-2 h-2 bg-primary rounded-full animate-ping"></div>
                  </div>
                  
                  <h3 className="text-xl font-black mb-4 text-accent group-hover:scale-105 transition-transform duration-300">
                    {demo.title}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed font-medium group-hover:text-foreground transition-colors duration-300">
                    {demo.desc}
                  </p>
                  
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-primary/5 dark:bg-surface/60 backdrop-blur-sm rounded-2xl border border-primary/20 dark:border-primary/30">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-primary rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm">📊</div>
              <div className="w-10 h-10 bg-accent rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm">🤖</div>
              <div className="w-10 h-10 bg-success rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm">📈</div>
              </div>
              <div className="text-foreground font-semibold">
                Попробуйте <span className="text-primary font-bold">все возможности</span> бесплатно
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="relative z-10 py-32 px-6 overflow-hidden">
        {/* Enhanced background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-background"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* Enhanced badge */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-surface/10 backdrop-blur-xl rounded-full border border-border/20 text-foreground text-sm font-semibold mb-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl animate-bounce">💎</span>
              <span className="text-primary font-bold">Прозрачные цены</span>
              <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced heading */}
            <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight text-foreground">
              Выберите подходящий<br/>
              <span className="text-accent animate-pulse">тариф</span>
            </h2>
            
            <p className="text-lg text-foreground/95 max-w-4xl mx-auto leading-relaxed font-medium">
              Начните с <span className="text-success font-bold">бесплатного тарифа</span> или получите полный доступ с PRO
            </p>
          </div>
          
          {/* Enhanced pricing cards with glassmorphism */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto mt-8">
            {plans.map((plan, index) => (
              <div 
                key={plan.name} 
                className={`group relative bg-surface/10 backdrop-blur-xl rounded-3xl p-10 border transition-all duration-500 hover:shadow-3xl hover:-translate-y-3 flex flex-col h-auto overflow-hidden ${
                  plan.popular 
                    ? 'border-border/40 shadow-2xl scale-105 bg-surface/15' 
                    : 'border-border/20 hover:border-border/40 hover:scale-105'
                }`}
              >
                {/* Animated background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl ${
                  plan.popular ? 'bg-primary/20' : 'bg-surface/10'
                }`}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-surface/5 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {plan.popular && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-4 py-2 bg-primary rounded-full text-xs font-bold text-primary-foreground shadow-xl animate-pulse">
                      ⚡ Популярный выбор
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  {/* Plan icon */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl ${
                    plan.popular ? 'bg-primary' : 'bg-surface'
                  }`}>
                    {plan.popular ? '⭐' : '🚀'}
                  </div>
                  
                  <div className="text-center mb-10">
                    <h3 className={`text-2xl font-black mb-4 ${
                      plan.popular ? 'text-primary' : 'text-muted-foreground'
                    }`}>{plan.name}</h3>
                    <div className="text-3xl font-black mb-6 text-foreground">
                      {plan.price}
                    </div>
                    {plan.name === 'PRO' && (
                      <p className="text-foreground/80 text-base font-medium">все возможности без ограничений</p>
                    )}
                    {plan.name === 'Бесплатно' && (
                      <p className="text-foreground/80 text-base font-medium">идеально для начала работы</p>
                    )}
                  </div>
                  
                  <ul className="space-y-5 mb-10 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-lg">
                          <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-foreground/90 text-base font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => handlePlanSelect(plan.action)}
                      className={`group/btn relative w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-500 overflow-hidden ${
                        plan.popular
                          ? 'bg-primary text-primary-foreground hover:shadow-2xl hover:scale-110 shadow-xl'
                          : 'bg-surface/20 text-foreground hover:bg-surface/30 hover:scale-110 border border-border/30 hover:border-border/50'
                      }`}
                    >
                      <div className="absolute inset-0 bg-surface/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-white/10 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">{plan.cta}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-muted-foreground mt-12 text-base font-medium">
            Все цены указаны в тенге (KZT). Оплата — переводом на Kaspi Gold.
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="relative z-10 py-32 px-6 bg-gradient-background-light dark:bg-gradient-surface overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse"
               style={{
                 background: `linear-gradient(135deg, 
                   var(--color-primary) / 0.3,
                var(--color-accent) / 0.2)
                 `
               }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl animate-pulse"
             style={{
               background: `linear-gradient(135deg, 
                 var(--color-secondary) / 0.3,
                var(--color-primary) / 0.2)
               `,
               animationDelay: '2s'
             }}></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm rounded-full border border-accent/20 text-accent text-sm font-semibold mb-8">
              <span className="text-lg animate-pulse">⭐</span>
              Отзывы клиентов
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
              Что говорят наши <span className="text-accent">клиенты</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
              Более <span className="text-success font-bold">10,000 предпринимателей</span> уже используют FinSights AI для управления финансами
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
                gradientNumber: 1
              },
              {
                name: "Айжан С.",
                role: "Директор ТОО",
                content: "Прогнозы по денежному потоку помогли избежать кассового разрыва. Теперь планирую бюджет на основе данных, а не интуиции.",
                rating: 5,
                avatar: "АС",
                gradientNumber: 2
              },
              {
                name: "Марат Б.",
                role: "Владелец сети кафе",
                content: "Автоматическая категоризация расходов сэкономила массу времени. Теперь вижу реальную прибыльность каждой точки.",
                rating: 5,
                avatar: "МБ",
                gradientNumber: 3
              }
            ].map((testimonial, index) => (
              <div key={index} className="group relative bg-surface dark:bg-surface/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-4xl transition-all duration-500 border border-border dark:border-border/50 hover:-translate-y-6 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 dark:bg-surface/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <div key={i} className="relative">
                        <svg className="w-7 h-7 text-accent fill-current transform group-hover:scale-125 transition-transform duration-300" viewBox="0 0 20 20" style={{animationDelay: `${i * 100}ms`}}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="absolute inset-0 bg-accent/30 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative mb-8">
                     <div className="absolute -top-4 -left-4 text-6xl text-primary/40 dark:text-surface/80 font-serif opacity-70">"
                     </div>
                     <p className="text-foreground leading-relaxed text-base font-medium relative z-10">
                       {testimonial.content}
                     </p>
                     <div className="absolute -bottom-4 -right-4 text-6xl text-primary/40 dark:text-surface/80 font-serif opacity-70 rotate-180">"
                     </div>
                   </div>
                   
                   <div className="flex items-center">
                     <div 
                       className={`w-16 h-16 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-xl mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${
                         testimonial.gradientNumber === 1 ? 'bg-primary' :
                         testimonial.gradientNumber === 2 ? 'bg-accent' : 'bg-secondary'
                       }`}
                     >
                       {testimonial.avatar}
                     </div>
                     <div>
                       <div className="font-bold text-foreground text-lg mb-1">{testimonial.name}</div>
                       <div className="text-muted-foreground font-medium">{testimonial.role}</div>
                     </div>
                   </div>
                   
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                       <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="text-center mt-16">
             <div className="inline-flex items-center gap-4 px-8 py-4 bg-success/10 dark:bg-surface/60 backdrop-blur-sm rounded-2xl border border-success/20 dark:border-success/30">
               <div className="flex -space-x-2">
                 <div className="w-10 h-10 rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm bg-primary">АК</div>
                 <div className="w-10 h-10 rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm bg-accent">АС</div>
                 <div className="w-10 h-10 rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm bg-secondary">МБ</div>
                 <div className="w-10 h-10 rounded-full border-2 border-background dark:border-surface flex items-center justify-center text-primary-foreground font-bold text-sm bg-success">+7K</div>
               </div>
               <div className="text-foreground font-semibold">
                 Присоединяйтесь к <span className="text-success font-bold">10,000+</span> довольных клиентов
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* CTA */}
      <section className="relative z-10 py-32 px-6 bg-gradient-background-light dark:from-surface dark:via-surface/90 dark:to-surface/80 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
            }}
          ></div>
          <div 
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{
              background: `linear-gradient(135deg, var(--color-accent), var(--color-secondary))`
            }}
          ></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="bg-surface backdrop-blur-xl rounded-4xl p-16 shadow-3xl border border-border hover:shadow-4xl transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div 
                className="inline-flex items-center gap-3 px-6 py-3 backdrop-blur-sm rounded-full border border-success-light text-success text-sm font-semibold mb-8 bg-success-light"
              >
                <span className="text-lg animate-bounce">🎯</span>
                Начните прямо сейчас
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
                Готовы <span className="text-primary">начать?</span>
              </h2>
              <p className="text-lg text-primary mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                Загрузите первую выписку и получите <span className="text-accent font-bold">профессиональный анализ</span> уже через минуту
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <button 
                  onClick={() => handlePlanSelect('free')}
                  className="group relative px-12 py-4 text-primary-foreground rounded-2xl text-lg font-bold transition-all duration-300 shadow-3xl hover:shadow-4xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-4 overflow-hidden bg-primary"
                >
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10">🚀</span>
                  <span className="relative z-10">Начать бесплатно</span>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full animate-ping"></div>
                </button>
                <button 
                  onClick={() => handlePlanSelect('pro')}
                  className="group px-12 py-4 bg-background border-4 border-primary/30 text-primary rounded-2xl text-lg font-bold hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 hover:scale-110 flex items-center justify-center gap-3"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">✨</span>
                  <span>Узнать о PRO</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-muted-foreground text-base font-medium">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Без обязательств</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Отмена в любое время</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
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
      <footer className="relative bg-surface text-foreground overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Логотип и описание */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-primary-foreground">F</span>
                </div>
                <span className="text-3xl font-black text-primary">FinSights AI</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md">
                Революционная платформа для финансового анализа с использованием искусственного интеллекта. Превращаем данные в прибыль.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 bg-surface/50 hover:bg-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 text-foreground hover:text-primary-foreground">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-surface/50 hover:bg-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 text-foreground hover:text-primary-foreground">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-surface/50 hover:bg-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 text-foreground hover:text-primary-foreground">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Продукт */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-foreground">Продукт</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Возможности
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Тарифы
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  API
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Интеграции
                </a></li>
              </ul>
            </div>
            
            {/* Поддержка */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-foreground">Поддержка</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Документация
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Центр помощи
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Связаться с нами
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-2 h-2 bg-primary rounded-full group-hover:w-3 transition-all duration-200"></span>
                  Статус системы
                </a></li>
              </ul>
            </div>
          </div>
          
          {/* Разделитель */}
          <div className="h-px bg-border mb-8"></div>
          
          {/* Нижняя часть */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-muted-foreground text-sm">
              © 2024 FinSights AI. Все права защищены.
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Политика конфиденциальности</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Условия использования</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
