import React, { useEffect, useState } from 'react';

interface AuthDebugInfo {
  serverReachable: boolean;
  googleConfigured: boolean;
  sessionActive: boolean;
  userAuthenticated: boolean;
  error: string | null;
}

export const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    serverReachable: false,
    googleConfigured: false,
    sessionActive: false,
    userAuthenticated: false,
    error: null
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const info: AuthDebugInfo = {
        serverReachable: false,
        googleConfigured: false,
        sessionActive: false,
        userAuthenticated: false,
        error: null
      };

      try {
        // Проверяем доступность сервера
        console.log('[AuthDebug] Checking server...');
        const healthResponse = await fetch('http://localhost:3001/api/health', {
          credentials: 'include'
        });
        
        if (healthResponse.ok) {
          info.serverReachable = true;
          console.log('[AuthDebug] Server is reachable');
        }
      } catch (error) {
        console.error('[AuthDebug] Server not reachable:', error);
        info.error = 'Сервер недоступен на порту 3001';
      }

      try {
        // Проверяем настройку Google OAuth
        console.log('[AuthDebug] Checking Google OAuth config...');
        const configResponse = await fetch('http://localhost:3001/auth/google/config', {
          credentials: 'include'
        });
        
        if (configResponse.ok) {
          const config = await configResponse.json();
          info.googleConfigured = !!config.clientId;
          console.log('[AuthDebug] Google OAuth configured:', info.googleConfigured);
        }
      } catch (error) {
        console.error('[AuthDebug] Google config check failed:', error);
      }

      try {
        // Проверяем текущую сессию
        console.log('[AuthDebug] Checking current session...');
        const meResponse = await fetch('http://localhost:3001/api/me', {
          credentials: 'include'
        });
        
        if (meResponse.ok) {
          const userData = await meResponse.json();
          info.sessionActive = true;
          info.userAuthenticated = !!userData.email;
          console.log('[AuthDebug] Session check result:', userData);
        } else if (meResponse.status === 401) {
          info.sessionActive = true; // Сервер отвечает, но не авторизован
          console.log('[AuthDebug] Not authenticated (401)');
        }
      } catch (error) {
        console.error('[AuthDebug] Session check failed:', error);
        if (!info.error) {
          info.error = 'Ошибка проверки сессии';
        }
      }

      setDebugInfo(info);
    };

    runDiagnostics();
  }, []);

  const testGoogleAuth = () => {
    console.log('[AuthDebug] Testing Google OAuth...');
    window.location.href = 'http://localhost:3001/auth/google';
  };

  const testDemoAuth = () => {
    console.log('[AuthDebug] Testing Demo auth...');
    window.location.href = 'http://localhost:3001/api/auth/demo';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-surface rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">🔍 Диагностика авторизации</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-background rounded">
          <span>Сервер доступен (localhost:3001)</span>
          <span className={debugInfo.serverReachable ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.serverReachable ? '✅' : '❌'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded">
          <span>Google OAuth настроен</span>
          <span className={debugInfo.googleConfigured ? 'text-green-600' : 'text-yellow-600'}>
            {debugInfo.googleConfigured ? '✅' : '⚠️'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded">
          <span>Сессия активна</span>
          <span className={debugInfo.sessionActive ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.sessionActive ? '✅' : '❌'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-background rounded">
          <span>Пользователь авторизован</span>
          <span className={debugInfo.userAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {debugInfo.userAuthenticated ? '✅' : '❌'}
          </span>
        </div>
      </div>

      {debugInfo.error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          <h3 className="font-semibold">Ошибка:</h3>
          <p>{debugInfo.error}</p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Тестирование:</h3>
        
        <button
          onClick={testGoogleAuth}
          disabled={!debugInfo.serverReachable}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔗 Тест Google OAuth
        </button>

        <button
          onClick={testDemoAuth}
          disabled={!debugInfo.serverReachable}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎭 Тест демо-авторизации
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Возможные проблемы:</h3>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>• Сервер не запущен (npm start в папке backend)</li>
          <li>• Google OAuth не настроен в Google Console</li>
          <li>• Неправильный redirect_uri в Google Console</li>
          <li>• Переменные окружения GOOGLE_CLIENT_ID или GOOGLE_CLIENT_SECRET отсутствуют</li>
          <li>• Блокировка CORS или cookies</li>
        </ul>
      </div>
    </div>
  );
}; 