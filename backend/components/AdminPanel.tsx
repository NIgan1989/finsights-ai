import React, { useState } from 'react';

const AdminPanel: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const activatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !adminKey.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/activate-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), adminKey: adminKey.trim() })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ PRO активирован для ${userId}`);
        setUserId('');
      } else {
        setMessage(`❌ Ошибка: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Ошибка подключения к серверу');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto bg-surface rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">
          🔧 Админ-панель
        </h1>
        
        <form onSubmit={activatePro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              User ID (email или googleId)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Админ-ключ
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="admin123"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? 'Активация...' : 'Активировать PRO'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-text-secondary text-center">
          <p>Для активации PRO после оплаты через Kaspi Gold</p>
          <p className="mt-1">Админ-ключ: admin123 (только для демо)</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 