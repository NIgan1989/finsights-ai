import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { Navigate } from 'react-router-dom';
import { FaCrown, FaUsers, FaChartBar, FaCog, FaShieldAlt, FaDatabase, FaBell, FaTrophy, FaCreditCard, FaUserCheck, FaUserTimes, FaChartLine, FaServer, FaKey } from 'react-icons/fa';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingUpgrades: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  status: 'active' | 'inactive' | 'pending';
  subscription: 'free' | 'pro' | 'pending';
  lastLogin: string;
  transactionsCount: number;
  joinDate: string;
}

const AdminPanel: React.FC = () => {
  const { email } = useUser();
  const isLifetimeAdmin = email?.toLowerCase().trim() === 'dulat280489@gmail.com';

  console.log('[AdminPanel] Render - email:', email);
  console.log('[AdminPanel] isLifetimeAdmin:', isLifetimeAdmin);

  if (!isLifetimeAdmin) {
    console.log('[AdminPanel] Access denied, redirecting...');
    return <Navigate to="/" replace />;
  }

  console.log('[AdminPanel] ✅ ACCESS GRANTED - RENDERING ADMIN PANEL');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'settings' | 'system'>('dashboard');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Моковые данные для демонстрации
  const [stats] = useState<AdminStats>({
    totalUsers: 1247,
    activeUsers: 892,
    proUsers: 156,
    totalTransactions: 15420,
    totalRevenue: 1250000,
    pendingUpgrades: 23,
    systemHealth: 'good'
  });

  const [users] = useState<UserData[]>([
    {
      id: '1',
      email: 'user1@example.com',
      displayName: 'Иван Петров',
      status: 'active',
      subscription: 'pro',
      lastLogin: '2024-01-15T10:30:00Z',
      transactionsCount: 45,
      joinDate: '2023-06-15'
    },
    {
      id: '2',
      email: 'user2@example.com',
      displayName: 'Мария Сидорова',
      status: 'active',
      subscription: 'free',
      lastLogin: '2024-01-14T15:45:00Z',
      transactionsCount: 12,
      joinDate: '2023-12-01'
    },
    {
      id: '3',
      email: 'user3@example.com',
      displayName: 'Алексей Козлов',
      status: 'pending',
      subscription: 'pending',
      lastLogin: '2024-01-13T09:20:00Z',
      transactionsCount: 8,
      joinDate: '2024-01-10'
    }
  ]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;

    setLoading(true);
    try {
      // Демо авторизация
      if (adminKey === 'admin123') {
        setIsAuthenticated(true);
        setMessage('✅ Админ панель активирована');
      } else {
        setMessage('❌ Неверный админ-ключ');
      }
    } catch (error) {
      setMessage('❌ Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Всего пользователей</p>
              <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <FaUsers className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">PRO пользователи</p>
              <p className="text-3xl font-bold">{stats.proUsers.toLocaleString()}</p>
            </div>
            <FaTrophy className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Транзакции</p>
              <p className="text-3xl font-bold">{stats.totalTransactions.toLocaleString()}</p>
            </div>
            <FaChartBar className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Доход</p>
              <p className="text-3xl font-bold">{(stats.totalRevenue / 1000000).toFixed(1)}M ₸</p>
            </div>
            <FaCreditCard className="text-4xl opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaChartLine className="text-primary" />
            Активность системы
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Статус системы</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                stats.systemHealth === 'good' ? 'bg-green-100 text-green-800' :
                stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {stats.systemHealth === 'good' ? 'Отлично' : 
                 stats.systemHealth === 'warning' ? 'Внимание' : 'Критично'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Активные пользователи</span>
              <span className="text-text-primary font-medium">{stats.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Ожидают апгрейда</span>
              <span className="text-text-primary font-medium">{stats.pendingUpgrades}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaBell className="text-primary" />
            Последние действия
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-text-secondary">Новый PRO пользователь</span>
              <span className="text-text-primary">2 мин назад</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-text-secondary">Обновление системы</span>
              <span className="text-text-primary">15 мин назад</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-text-secondary">Новый запрос поддержки</span>
              <span className="text-text-primary">1 час назад</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Управление пользователями</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition">
          Добавить пользователя
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Подписка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Транзакции
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Последний вход
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{user.displayName}</div>
                      <div className="text-sm text-text-secondary">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Активен' : 
                       user.status === 'pending' ? 'Ожидает' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.subscription === 'pro' ? 'bg-purple-100 text-purple-800' :
                      user.subscription === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription === 'pro' ? 'PRO' : 
                       user.subscription === 'pending' ? 'Ожидает' : 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {user.transactionsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {new Date(user.lastLogin).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-primary hover:text-primary-hover">
                        <FaUserCheck />
                      </button>
                      <button className="text-red-500 hover:text-red-600">
                        <FaUserTimes />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const Analytics = () => {
    const AdminCharts = React.lazy(() => import('./AdminCharts'));
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Аналитика</h2>
        <React.Suspense fallback={<div className="text-center py-8">Загрузка аналитики...</div>}>
          <AdminCharts />
        </React.Suspense>
      </div>
    );
  };

  const Settings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Настройки системы</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaCog className="text-primary" />
            Общие настройки
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Уведомления</span>
              <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                Включено
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Автоматические бэкапы</span>
              <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                Включено
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Режим обслуживания</span>
              <button className="bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary px-3 py-1 rounded text-sm">
                Выключено
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-primary" />
            Безопасность
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Двухфакторная аутентификация</span>
              <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                Включено
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Логирование</span>
              <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                Включено
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Ограничение IP</span>
              <button className="bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary px-3 py-1 rounded text-sm">
                Выключено
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SystemInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Информация о системе</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaServer className="text-primary" />
            Сервер
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">CPU</span>
              <span className="text-text-primary">23%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">RAM</span>
              <span className="text-text-primary">67%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Диск</span>
              <span className="text-text-primary">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Сеть</span>
              <span className="text-text-primary">12 Мбит/с</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FaDatabase className="text-primary" />
            База данных
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Размер</span>
              <span className="text-text-primary">2.4 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Подключения</span>
              <span className="text-text-primary">24/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Запросы/сек</span>
              <span className="text-text-primary">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Время ответа</span>
              <span className="text-text-primary">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-8">Админ Панель</h1>
          
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                User ID (email или googleId)
              </label>
              <input
                type="text"
                value={email || ''}
                readOnly
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Админ-ключ
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="admin123"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Активировать PRO'}
            </button>
          </form>
          
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
          
          <div className="mt-6 text-sm text-text-secondary space-y-2">
            <p>Для активации PRO после оплаты через Kaspi Gold</p>
            <p>Админ-ключ: admin123 (только для демо)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCrown className="text-2xl text-primary" />
            <h1 className="text-2xl font-bold text-text-primary">Админ Панель</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary">Админ: {email}</span>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-surface border-b border-border px-6">
        <div className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Дашборд', icon: FaChartBar },
            { id: 'users', label: 'Пользователи', icon: FaUsers },
            { id: 'analytics', label: 'Аналитика', icon: FaChartLine },
            { id: 'settings', label: 'Настройки', icon: FaCog },
            { id: 'system', label: 'Система', icon: FaServer }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'system' && <SystemInfo />}
      </main>
    </div>
  );
};

export default AdminPanel; 