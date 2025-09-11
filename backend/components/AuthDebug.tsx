import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';

interface DebugInfo {
  serverReachable: boolean;
  sessionExists: boolean;
  userLoggedIn: boolean;
}

export const AuthDebug: React.FC = () => {
  const { email, role, token, displayName } = useUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    serverReachable: false,
    sessionExists: false,
    userLoggedIn: false,
  });

  useEffect(() => {
    console.log('[AuthDebug] Component mounted');
    checkAllSystems();
  }, []);

  const checkAllSystems = async () => {
    console.log('[AuthDebug] Проверяем системы...');
    
    const info: DebugInfo = {
      serverReachable: false,
      sessionExists: false,
      userLoggedIn: false,
    };

    try {
      // Проверяем доступность сервера
      console.log('[AuthDebug] Checking server status...');
      const healthResponse = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        credentials: 'include'
      });
      
      info.serverReachable = healthResponse.ok;
      console.log('[AuthDebug] Server reachable:', info.serverReachable);

      // Проверяем сессию
      if (info.serverReachable) {
        console.log('[AuthDebug] Checking session...');
        const sessionResponse = await fetch('http://localhost:3001/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        info.sessionExists = sessionResponse.ok;
        info.userLoggedIn = !!email && !!token;
        console.log('[AuthDebug] Session exists:', info.sessionExists);
        console.log('[AuthDebug] User logged in:', info.userLoggedIn);
      }
    } catch (error) {
      console.error('[AuthDebug] System check failed:', error);
    }

    setDebugInfo(info);
  };

  const testDemoAuth = async () => {
    console.log('[AuthDebug] Testing demo auth...');
    // Демо режим отключен
    alert('Демо режим отключен');
    return;
    // const response = await fetch('http://localhost:3001/api/auth/demo', {
    //   method: 'GET',
    //   credentials: 'include'
    // });
    // const data = await response.json();
    // console.log('[AuthDebug] Demo auth response:', data);
  };

  return (
    <div className="min-h-screen bg-muted dark:bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">
            🔧 Отладка авторизации
          </h1>

          {/* Статус системы */}
          <div className="bg-muted dark:bg-surface-accent rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Статус системы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span>Сервер доступен</span>
                <span className={debugInfo.serverReachable ? 'text-success' : 'text-destructive'}>
                  {debugInfo.serverReachable ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Сессия существует</span>
                <span className={debugInfo.sessionExists ? 'text-success' : 'text-destructive'}>
                  {debugInfo.sessionExists ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Пользователь авторизован</span>
                <span className={debugInfo.userLoggedIn ? 'text-success' : 'text-destructive'}>
                  {debugInfo.userLoggedIn ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="bg-primary/10 dark:bg-primary/30 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-info mb-4">
              Текущий пользователь
            </h2>
            <div className="space-y-2 text-sm">
              <div><strong>Email:</strong> {email || 'Не авторизован'}</div>
              <div><strong>Имя:</strong> {displayName || 'Не указано'}</div>
              <div><strong>Роль:</strong> {role || 'Не указана'}</div>
              <div><strong>Токен:</strong> {token ? '✅ Есть' : '❌ Отсутствует'}</div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="bg-success/10 dark:bg-success/30 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-success mb-4">
              Быстрые действия
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testDemoAuth}
                disabled={!debugInfo.serverReachable}
                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed"
              >
                🚀 Демо вход
              </button>
              <button
                onClick={checkAllSystems}
                className="bg-muted-foreground text-primary-foreground px-4 py-2 rounded hover:bg-muted-foreground/80"
              >
                🔄 Обновить статус
              </button>
            </div>
          </div>

          {/* Возможные проблемы */}
          {(!debugInfo.serverReachable || !debugInfo.sessionExists) && (
            <div className="bg-warning/10 dark:bg-warning/30 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-warning mb-4">
                ⚠️ Возможные проблемы
              </h2>
              <ul className="text-sm text-warning space-y-1">
                <li>• Бэкенд сервер не запущен (http://localhost:3001)</li>
                <li>• Проблемы с сетевым подключением</li>
                <li>• Сессия истекла или повреждена</li>
                <li>• Переменные окружения неправильно настроены</li>
              </ul>
            </div>
          )}

          {/* Полезные ссылки */}
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              🔗 Полезные ссылки
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>API Endpoints:</strong>
                <ul className="mt-2 space-y-1 text-primary">
                  <li><a href="http://localhost:3001/api/health" target="_blank" rel="noopener noreferrer">/api/health</a></li>
                  <li><a href="http://localhost:3001/api/auth/me" target="_blank" rel="noopener noreferrer">/api/auth/me</a></li>
                  <li><s>/api/auth/demo</s> (отключено)</li>
                </ul>
              </div>
              <div>
                <strong>Панели:</strong>
                <ul className="mt-2 space-y-1 text-primary">
                  <li><a href="/admin">Админ панель</a></li>
                  <li><a href="/">Главная страница</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
