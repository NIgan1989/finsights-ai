import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'ИИ-аналитика',
    desc: 'Автоматический анализ выписок, прогнозы и рекомендации для бизнеса.'
  },
  {
    title: 'Интерактивные отчёты',
    desc: 'Дашборд, графики, KPI, экспорт PDF/Excel.'
  },
  {
    title: 'Безопасность',
    desc: 'Ваши данные хранятся только у вас. Шифрование и приватность.'
  },
  {
    title: 'Поддержка',
    desc: 'Быстрая помощь и консультации по работе сервиса.'
  }
];

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
    ]
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
    ]
  }
];

const faqs = [
  {
    q: 'Как начать пользоваться?',
    a: 'Зарегистрируйтесь, загрузите выписку или добавьте транзакции вручную.'
  },
  {
    q: 'Мои данные в безопасности?',
    a: 'Да, все данные хранятся только у вас и не передаются третьим лицам.'
  },
  {
    q: 'Можно ли попробовать бесплатно?',
    a: 'Да, есть бесплатный тариф с основными возможностями.'
  }
];

const LandingPage: React.FC = () => {
  return (
    <div className="bg-background min-h-screen text-text-primary">
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
        <h1 className="text-5xl font-extrabold mb-4">FinSights AI</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">Умная аналитика и автоматизация финансов для малого бизнеса. Загрузите выписку — получите отчёт, прогноз и рекомендации за минуты!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/auth/google" className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow hover:bg-primary-hover transition">Войти через Google</a>
          <a href="#features" className="px-8 py-4 border border-primary text-primary rounded-xl font-bold text-lg hover:bg-primary/10 transition">Подробнее</a>
        </div>
      </section>

      {/* О сервисе */}
      <section id="features" className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Возможности FinSights AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map(f => (
            <div key={f.title} className="bg-surface rounded-2xl p-6 shadow border border-border">
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Скриншоты/демо */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Как это выглядит</h2>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="w-72 h-44 bg-border rounded-xl flex items-center justify-center text-text-secondary">[Скриншот дашборда]</div>
          <div className="w-72 h-44 bg-border rounded-xl flex items-center justify-center text-text-secondary">[ИИ-ассистент]</div>
          <div className="w-72 h-44 bg-border rounded-xl flex items-center justify-center text-text-secondary">[Финансовый отчёт]</div>
        </div>
      </section>

      {/* Тарифы */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Тарифы</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {plans.map(plan => (
            <div key={plan.name} className="bg-surface rounded-2xl p-8 shadow border border-border flex-1 min-w-[260px] flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-extrabold mb-4">{plan.price}</div>
              <ul className="mb-6 text-text-secondary list-disc pl-5 text-left">
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <a href="#register" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow hover:bg-primary-hover transition">Выбрать</a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
        <ul className="space-y-6">
          {faqs.map(faq => (
            <li key={faq.q} className="bg-surface rounded-xl p-6 border border-border shadow">
              <div className="font-semibold mb-2">{faq.q}</div>
              <div className="text-text-secondary">{faq.a}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Контакты */}
      <footer className="py-10 px-4 bg-surface border-t border-border text-center text-text-secondary">
        <div className="mb-2">© {new Date().getFullYear()} FinSights AI</div>
        <div className="mb-2">Email: <a href="mailto:support@finsights.ai" className="text-primary underline">support@finsights.ai</a></div>
        <div>Telegram: <a href="https://t.me/finsights_support" className="text-primary underline" target="_blank" rel="noopener noreferrer">@finsights_support</a></div>
      </footer>
    </div>
  );
};

export default LandingPage; 