import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';

const plans = [
  {
    name: 'Бесплатно',
    price: '0₽',
    features: [
      '1 бизнес-профиль',
      'До 200 транзакций',
      'ИИ-ассистент с лимитом',
      'Экспорт PDF',
      'Базовые отчёты'
    ],
    cta: 'Начать бесплатно',
    popular: false
  },
  {
    name: 'PRO',
    price: '490₽/мес',
    features: [
      'Неограниченно профилей',
      'Безлимит транзакций',
      'ИИ-ассистент без лимитов',
      'Экспорт PDF/Excel',
      'Расширенная аналитика',
      'Приоритетная поддержка'
    ],
    cta: 'Оформить PRO',
    popular: true
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
  const { token } = useUser();
  const status = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'pro' | 'free'>('free');

  useEffect(() => {
    // Для MVP: userId захардкожен
    const userId = 'demo-user';
    fetch(`/api/subscription-status?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'pro') setSubscriptionStatus('pro');
        else setSubscriptionStatus('free');
      });
  }, []);

  const handleCta = (plan: string) => {
    if (plan === 'PRO') {
      if (!token) {
        window.location.href = '/register';
      } else if (status !== 'pro') {
        // В будущем: переход к оплате
        alert('Оформление PRO: интеграция оплаты будет добавлена');
      }
    } else {
      window.location.href = token ? '/dashboard' : '/register';
    }
  };

  // Удаляю handleSubscribe, priceId, Stripe-логику
  // Вместо этого:
  const handleKaspiPayment = async () => {
    setLoading(true);
    const userId = 'demo-user'; // TODO: получить реального пользователя
    const res = await fetch('/api/kaspi-payment-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    alert(data.message || 'Заявка отправлена!');
    setLoading(false);
  };

  return (
    <div className="bg-background min-h-screen text-text-primary py-16 px-4">
      <h1 className="text-4xl font-extrabold mb-8 text-center">Тарифы FinSights AI</h1>
      <div className="flex flex-col md:flex-row gap-8 justify-center max-w-5xl mx-auto">
        {plans.map(plan => (
          <div key={plan.name} className={`bg-surface rounded-2xl p-8 shadow border border-border flex-1 min-w-[260px] flex flex-col items-center ${plan.popular ? 'border-primary scale-105' : ''}`}>
            {plan.popular && <div className="mb-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold">Популярно</div>}
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="text-3xl font-extrabold mb-4">{plan.price}</div>
            <ul className="mb-6 text-text-secondary list-disc pl-5 text-left">
              {plan.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            {plan.name === 'PRO' && status === 'pro' ? (
              <button className="px-6 py-3 rounded-lg font-semibold shadow bg-success text-success-foreground cursor-default" disabled>PRO активен</button>
            ) : (
              <button
                className={`px-6 py-3 rounded-lg font-semibold shadow transition ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'bg-background border border-primary text-primary hover:bg-primary/10'}`}
                onClick={() => handleCta(plan.name)}
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <b>Подписка:</b> {subscriptionStatus === 'pro' ? 'PRO' : 'Бесплатно'}
      </div>
      {/* В рендере вместо Stripe: */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 text-yellow-900 text-center my-8">
        <b>Для активации PRO переведите 4900₸ на Kaspi Gold по номеру <span className="underline">+7 778 694 18 03</span> (Дулат).</b><br/>
        После перевода нажмите кнопку ниже:
        <br/><br/>
        <button onClick={handleKaspiPayment} disabled={loading} className="px-6 py-3 rounded-lg font-semibold shadow bg-primary text-primary-foreground hover:bg-primary-hover mt-2">
          {loading ? 'Отправка...' : 'Я оплатил(а)'}
        </button>
      </div>
      <div className="text-center text-text-secondary mt-12">Вопросы по тарифам? <a href="mailto:support@finsights.ai" className="text-primary underline">Напишите нам</a></div>
    </div>
  );
};

export default PricingPage; 