import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';

const plans = [
  {
    name: 'Бесплатно',
    price: '0 ₸',
    period: '',
    features: [
      '1 бизнес-профиль',
      'До 200 транзакций',
      'ИИ-ассистент (10 запросов/день)',
      'Экспорт PDF',
      'Базовые отчёты',
      'Email поддержка'
    ],
    cta: 'Начать бесплатно',
    popular: false,
    gradient: 'from-muted to-muted-foreground'
  },
  {
    name: 'PRO',
    price: '2 200 ₸',
    period: '/месяц',
    features: [
      'Неограниченно профилей',
      'Безлимит транзакций',
      'ИИ-ассистент без лимитов',
      'Экспорт PDF/Excel',
      'Расширенная аналитика',
      'Прогнозирование доходов',
      'Приоритетная поддержка',
      'API доступ'
    ],
    cta: 'Оформить PRO',
    popular: true,
    gradient: 'from-primary to-secondary'
  }
];

// Заглушка: статус подписки (в будущем — из профиля пользователя)
function useSubscriptionStatus() {
  const { email } = useUser();
  // Пример: если email содержит 'pro', считаем что PRO активен
  if (email && email.includes('pro')) return 'pro';
  return 'free';
}

const PricingPage: React.FC = () => {
  const { token, email, displayName, getUserId } = useUser();
  const status = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'pro' | 'free'>('free');

  useEffect(() => {
    // Используем реального пользователя
    const userId = getUserId();
    fetch(`/api/subscription-status?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'pro' || data.status === 'admin') setSubscriptionStatus('pro');
        else setSubscriptionStatus('free');
      })
      .catch(() => setSubscriptionStatus('free'));
  }, [getUserId]);

  const handleCta = (plan: string) => {
    console.log('[PricingPage] handleCta called with plan:', plan);
    console.log('[PricingPage] Current token:', token);
    console.log('[PricingPage] Current status:', status);
    
    if (plan === 'PRO') {
      if (!token) {
        console.log('[PricingPage] No token, redirecting to login...');
        window.location.href = '/';
      } else if (status !== 'pro') {
        console.log('[PricingPage] User has token but not PRO, showing alert...');
        // В будущем: переход к оплате
        alert('Оформление PRO: интеграция оплаты будет добавлена');
      } else {
        console.log('[PricingPage] User already has PRO status');
      }
    } else {
      console.log('[PricingPage] Free plan selected');
      const targetUrl = token ? '/dashboard' : '/';
      console.log('[PricingPage] Redirecting to:', targetUrl);
      window.location.href = targetUrl;
    }
  };

  // Удаляю handleSubscribe, priceId, Stripe-логику
  // Вместо этого:
  const handleKaspiPayment = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const res = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: email || 'unknown@user',
          displayName: displayName || 'Пользователь',
          amount: 2200,
          note: 'Оплата через Kaspi Gold: +7 778 694 18 03'
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
        return;
      }
      alert('Заявка на активацию PRO отправлена! Мы обработаем её в ближайшее время.');
    } catch (e) {
      alert('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-pricing-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-hover/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16 px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-pricing-title bg-clip-text text-transparent mb-6">
            Выберите свой план
          </h1>
          <p className="text-xl text-foreground max-w-3xl mx-auto leading-relaxed">
            Начните бесплатно и развивайтесь вместе с нами. PRO версия откроет весь потенциал FinSights AI для вашего бизнеса.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div 
              key={plan.name} 
              className={`relative bg-modal-card backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-border/50 flex-1 max-w-md mx-auto lg:mx-0 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl ${
                plan.popular ? 'scale-105 lg:scale-110' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-pricing-popular text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    🔥 Популярный выбор
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${plan.popular ? 'bg-gradient-pricing-icon-pro' : 'bg-gradient-pricing-icon-free'} flex items-center justify-center`}>
                  {plan.name === 'PRO' ? (
                    <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-text-primary mb-2">{plan.name}</h2>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-text-primary">{plan.price}</span>
                  {plan.period && <span className="text-foreground text-lg">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {plan.name === 'PRO' && status === 'pro' ? (
                  <button className="w-full py-4 px-6 bg-success text-success-foreground rounded-xl font-semibold shadow-lg cursor-default flex items-center justify-center gap-2" disabled>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    PRO активен
                  </button>
                ) : (
                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl ${
                      plan.popular 
                        ? 'bg-gradient-pricing-button-pro text-primary-foreground hover:bg-gradient-pricing-button-pro-hover' 
                        : 'bg-surface border-2 border-border text-text-primary hover:border-primary hover:text-primary'
                    }`}
                    onClick={() => handleCta(plan.name)}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Current Subscription Status */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-modal-card backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-border/50">
            <div className={`w-3 h-3 rounded-full ${subscriptionStatus === 'pro' ? 'bg-success' : 'bg-primary'}`}></div>
            <span className="text-text-primary font-medium">
              Текущий план: <span className="font-bold">{subscriptionStatus === 'pro' ? 'PRO' : 'Бесплатный'}</span>
            </span>
          </div>
        </div>

        {/* Payment Info Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-pricing-payment backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-warning/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-pricing-payment-icon rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">Как активировать PRO?</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Для активации PRO подписки переведите <span className="font-bold text-warning">2,200 ₸</span> на Kaspi Gold
              </p>
              
              <div className="bg-modal-card rounded-2xl p-6 mb-6 border border-border/50">
                <div className="text-2xl font-bold text-warning mb-2">+7 778 694 18 03</div>
                <div className="text-muted-foreground">Получатель: Дулат</div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                После перевода нажмите кнопку ниже, и мы активируем ваш PRO доступ в течение нескольких минут
              </p>
              
              <button
                onClick={handleKaspiPayment}
                disabled={loading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-pricing-payment-button text-primary-foreground rounded-xl font-semibold shadow-lg hover:bg-gradient-pricing-payment-button-hover transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Обрабатываем...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Я оплатил(а)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Есть вопросы по тарифам? {' '}
            <a 
              href="mailto:support@finsights.ai" 
              className="text-primary hover:text-primary/90 font-semibold underline decoration-2 underline-offset-2 transition-colors"
            >
              Напишите нам
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
