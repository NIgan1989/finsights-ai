import React, { useState } from 'react';
import { useUser } from './UserContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, guestLogin } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(email, password, displayName);
      }

      if (result.success) {
        console.log('[LoginForm] Auth successful');
        onSuccess?.();
      } else {
        setError(result.error || 'Ошибка авторизации');
      }
    } catch (error) {
      console.error('[LoginForm] Auth error:', error);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async () => {
    setLoading(true);
    try {
      const result = await guestLogin();
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Ошибка входа в гостевой режим');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl shadow-lg p-8 border border-border">
          {/* Логотип */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.svg" alt="FinSights AI" className="w-8 h-8" />
              <span className="text-2xl font-bold text-text-primary">FinSights AI</span>
            </div>
            <p className="text-foreground">
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                name="email"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                name="password"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Переключение режима */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>

          {/* Быстрый вход */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-foreground text-center mb-3">Или попробуйте сервис:</p>
            <button
              onClick={quickLogin}
              disabled={loading}
              className="w-full bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-lg text-sm hover:bg-primary/20 transition disabled:opacity-50"
            >
              🚀 Режим гостя - попробовать бесплатно
            </button>
          </div>

          {/* Отмена */}
          {onCancel && (
            <div className="mt-4">
              <button
                onClick={onCancel}
                className="w-full text-muted-foreground hover:text-foreground transition"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
