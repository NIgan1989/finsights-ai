import React, { useState, useEffect, useMemo } from 'react';
import { formatLocalDate, getCurrentLocalDate, parseLocalDate, formatFullDate, formatRuDate } from '../../utils/dateUtils.ts';
import { useUser } from './UserContext';
import { Navigate } from 'react-router-dom';
import { FaCrown, FaUsers, FaChartBar, FaCog, FaShieldAlt, FaDatabase, FaBell, FaTrophy, FaCreditCard, FaUserCheck, FaUserTimes, FaChartLine, FaServer, FaKey, FaClipboardList, FaCheck, FaTimes, FaSync } from 'react-icons/fa';
import { subscriptionService } from '../../services/subscriptionService';
import { formatNumber, formatCurrency } from '../../utils/formatUtils.ts';

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

interface PaymentRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  note?: string;
}

interface SystemSettings {
  notifications: boolean;
  automaticBackups: boolean;
  maintenanceMode: boolean;
  twoFactorAuth: boolean;
  logging: boolean;
  ipRestriction: boolean;
  apiRateLimit: number;
  maxFileSize: number;
  sessionTimeout: number;
  debugMode: boolean;
}

interface SystemInfo {
  server: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    uptime: number;
    cpu: {
      model: string;
      cores: number;
      usage: number;
    };
    memory: {
      total: number;
      used: number;
      usage: number;
    };
    disk: {
      usage: number;
      available: number;
    };
    network: {
      status: string;
      latency: number;
    };
  };
  database: {
    type: string;
    size: string;
    connections: number;
    queriesPerSecond: number;
    responseTime: number;
  };
  application: {
    version: string;
    environment: string;
    apiKeys: {
      openai: string;
    };
    activeConnections: number;
    errorRate: string;
  };
}

const AdminPanel: React.FC = () => {
  const { email, displayName } = useUser();
   const isLifetimeAdmin = subscriptionService.checkIsLifetimeAdmin((email?.toLowerCase().trim()) || '');

  if (!isLifetimeAdmin) {
    return <Navigate to="/" replace />;
  }

  // Состояния для компонента
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'settings' | 'system' | 'requests'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Состояния для реальных данных
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    proUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingUpgrades: 0,
    systemHealth: 'good'
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Настройки и системная информация
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Ошибка загрузки настроек', e);
    }
  };

  const updateSetting = async (setting: keyof SystemSettings, value: any) => {
    try {
      setSettingsSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting, value })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...(data.settings as SystemSettings) });
      } else {
        console.error('Не удалось обновить настройку');
      }
    } catch (e) {
      console.error('Ошибка обновления настройки', e);
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/admin/system-info');
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data.systemInfo);
      }
    } catch (e) {
      console.error('Ошибка загрузки системной информации', e);
    }
  };

  // Хелпер форматирования аптайма
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}д ${h}ч ${m}м`;
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  };

  // Функции для загрузки реальных данных
  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-requests');
      if (response.ok) {
        const data = await response.json();
        setPaymentRequests(data.requests || []);
        setLastUpdated(new Date().toLocaleTimeString('ru-RU'));
      } else {
        console.error('Ошибка загрузки заявок:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      // Получаем аналитику с сервера
      const analyticsResponse = await fetch('/api/admin/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        
        if (analyticsData.success) {
          setStats({
            totalUsers: analyticsData.stats.totalUsers,
            activeUsers: analyticsData.stats.activeUsers,
            proUsers: analyticsData.stats.proUsers,
            totalTransactions: analyticsData.stats.totalUsers, // Используем количество пользователей как количество транзакций
            totalRevenue: analyticsData.stats.totalRevenue,
            pendingUpgrades: analyticsData.stats.pendingRequests,
            systemHealth: analyticsData.stats.pendingRequests > 5 ? 'warning' : 'good'
          });
        }
      }

      // Получаем заявки для создания списка пользователей
      const requestsResponse = await fetch('/api/payment-requests');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const requests = requestsData.requests || [];
        
        // Создаем данные пользователей на основе заявок
        const usersData: UserData[] = requests.map((request: PaymentRequest) => ({
          id: request.userId,
          email: request.email,
          displayName: request.displayName,
          status: 'active' as const,
          subscription: request.status === 'approved' ? 'pro' as const : 
                       request.status === 'pending' ? 'pending' as const : 'free' as const,
          lastLogin: request.createdAt,
          transactionsCount: 1,
          joinDate: formatLocalDate(new Date(request.createdAt))
        }));
        
        // Добавляем текущего администратора в список пользователей только если есть заявки и он админ
        if (requests.length > 0 && isLifetimeAdmin) {
          usersData.unshift({
            id: 'admin',
            email: (email || 'Dulat280489@gmail.com'),
            displayName: (displayName || 'Администратор'),
            status: 'active',
            subscription: 'pro',
            lastLogin: new Date().toISOString(),
            transactionsCount: 0,
            joinDate: getCurrentLocalDate()
          });
        }
        
        setUsers(usersData);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payment-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert('PRO подписка успешно активирована!');
        // Обновляем данные
        await fetchPaymentRequests();
        await fetchAdminStats();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось одобрить заявку'}`);
      }
    } catch (error) {
      console.error('Ошибка одобрения заявки:', error);
      alert('Ошибка при одобрении заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payment-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        alert('Заявка отклонена');
        // Обновляем данные
        await fetchPaymentRequests();
        await fetchAdminStats();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось отклонить заявку'}`);
      }
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Ошибка при отклонении заявки');
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPaymentRequests(),
        fetchAdminStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    refreshAllData();
    fetchSettings();
    fetchSystemInfo();
  }, []);

  useEffect(() => {
    // Доп. подзагрузка при переключении вкладок
    if (activeTab === 'settings' && !settings) fetchSettings();
    if (activeTab === 'system' && !systemInfo) fetchSystemInfo();
  }, [activeTab]);



  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Панель управления</h2>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-text-secondary">
              Обновлено: {lastUpdated}
            </span>
          )}
          <button
            onClick={refreshAllData}
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition disabled:opacity-50 flex items-center gap-2"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Всего пользователей</p>
              <p className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</p>
            </div>
            <FaUsers className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">PRO пользователи</p>
              <p className="text-3xl font-bold">{formatNumber(stats.proUsers)}</p>
            </div>
            <FaTrophy className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Заявки</p>
              <p className="text-3xl font-bold">{formatNumber(stats.totalTransactions)}</p>
            </div>
            <FaChartBar className="text-4xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Доход</p>
              <p className="text-3xl font-bold">{(stats.totalRevenue / 1000).toFixed(0)}K ₸</p>
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
              <span className="text-text-secondary">Ожидают активации</span>
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
            {paymentRequests.slice(0, 3).map((request, index) => (
              <div key={request.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  request.status === 'approved' ? 'bg-green-500' :
                  request.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-text-secondary">
                  {request.status === 'approved' ? 'PRO активирован' :
                   request.status === 'pending' ? 'Новая заявка' : 'Заявка отклонена'}: {request.displayName}
                </span>
                <span className="text-text-primary">
                  {formatFullDate(request.createdAt)}
                </span>
              </div>
            ))}
            {paymentRequests.length === 0 && (
              <div className="text-text-secondary text-sm">Нет активности</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const UsersManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Управление пользователями</h2>
        <button onClick={refreshAllData} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition disabled:opacity-50">
          Обновить
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
                    {(parseLocalDate(user.lastLogin) || new Date(user.lastLogin)).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-primary hover:text-primary-hover" title="Активировать PRO вручную" onClick={() => alert('Эта функция будет добавлена позже')}>
                        <FaUserCheck />
                      </button>
                      <button className="text-red-500 hover:text-red-600" title="Деактивировать пользователя" onClick={() => alert('Эта функция будет добавлена позже')}>
                        <FaUserTimes />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">Пользователи не найдены</td>
                </tr>
              )}
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
      {!settings && (
        <div className="text-text-secondary">Загрузка настроек...</div>
      )}
      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FaCog className="text-primary" />
              Общие настройки
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Уведомления</span>
                <button
                  onClick={() => updateSetting('notifications', !settings.notifications)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.notifications ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.notifications ? 'Включено' : 'Выключено'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Автоматические бэкапы</span>
                <button
                  onClick={() => updateSetting('automaticBackups', !settings.automaticBackups)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.automaticBackups ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.automaticBackups ? 'Включено' : 'Выключено'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Режим обслуживания</span>
                <button
                  onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.maintenanceMode ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.maintenanceMode ? 'Включено' : 'Выключено'}
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Лимит API (запросов/час)</span>
                  <input
                    type="number"
                    className="w-28 bg-background border border-border rounded px-2 py-1 text-text-primary"
                    value={settings.apiRateLimit}
                    min={10}
                    step={10}
                    onChange={(e) => updateSetting('apiRateLimit', Math.max(10, Number(e.target.value)))}
                    disabled={settingsSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Макс. размер файла (МБ)</span>
                  <input
                    type="number"
                    className="w-28 bg-background border border-border rounded px-2 py-1 text-text-primary"
                    value={settings.maxFileSize}
                    min={1}
                    step={1}
                    onChange={(e) => updateSetting('maxFileSize', Math.max(1, Number(e.target.value)))}
                    disabled={settingsSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Таймаут сессии (часы)</span>
                  <input
                    type="number"
                    className="w-28 bg-background border border-border rounded px-2 py-1 text-text-primary"
                    value={settings.sessionTimeout}
                    min={1}
                    step={1}
                    onChange={(e) => updateSetting('sessionTimeout', Math.max(1, Number(e.target.value)))}
                    disabled={settingsSaving}
                  />
                </div>
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
                <button
                  onClick={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.twoFactorAuth ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.twoFactorAuth ? 'Включено' : 'Выключено'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Логирование</span>
                <button
                  onClick={() => updateSetting('logging', !settings.logging)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.logging ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.logging ? 'Включено' : 'Выключено'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Ограничение IP</span>
                <button
                  onClick={() => updateSetting('ipRestriction', !settings.ipRestriction)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.ipRestriction ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.ipRestriction ? 'Включено' : 'Выключено'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Режим отладки</span>
                <button
                  onClick={() => updateSetting('debugMode', !settings.debugMode)}
                  disabled={settingsSaving}
                  className={`px-3 py-1 rounded text-sm ${settings.debugMode ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-200 dark:bg-border text-gray-700 dark:text-text-secondary'}`}
                >
                  {settings.debugMode ? 'Включено' : 'Выключено'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const SystemInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Информация о системе</h2>
        <button
          onClick={fetchSystemInfo}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2"
        >
          <FaSync /> Обновить
        </button>
      </div>

      {!systemInfo && (
        <div className="text-text-secondary">Загрузка системной информации...</div>
      )}

      {systemInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FaServer className="text-primary" />
              Сервер
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Платформа</span>
                <span className="text-text-primary">{systemInfo.server.platform} ({systemInfo.server.architecture})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Node</span>
                <span className="text-text-primary">{systemInfo.server.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Аптайм</span>
                <span className="text-text-primary">{formatUptime(systemInfo.server.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">CPU</span>
                <span className="text-text-primary">{systemInfo.server.cpu.model} • {systemInfo.server.cpu.cores}× • {systemInfo.server.cpu.usage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">RAM</span>
                <span className="text-text-primary">{(systemInfo.server.memory.used / 1024).toFixed(2)} GB / {systemInfo.server.memory.total.toFixed(2)} GB • {systemInfo.server.memory.usage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Диск</span>
                <span className="text-text-primary">Занято {systemInfo.server.disk.usage}% • Свободно {systemInfo.server.disk.available} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Сеть</span>
                <span className="text-text-primary">{systemInfo.server.network.status} • {systemInfo.server.network.latency} ms</span>
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
                <span className="text-text-secondary">Тип</span>
                <span className="text-text-primary">{systemInfo.database.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Размер</span>
                <span className="text-text-primary">{systemInfo.database.size} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Подключения</span>
                <span className="text-text-primary">{systemInfo.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Запросы/сек</span>
                <span className="text-text-primary">{systemInfo.database.queriesPerSecond}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Время ответа</span>
                <span className="text-text-primary">{systemInfo.database.responseTime} ms</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border lg:col-span-2">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FaKey className="text-primary" />
              Приложение
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Версия</span>
                <span className="text-text-primary">{systemInfo.application.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Окружение</span>
                <span className="text-text-primary">{systemInfo.application.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">OpenAI API ключ</span>
                <span className={`px-2 py-0.5 rounded text-sm ${systemInfo.application.apiKeys.openai === 'configured' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{systemInfo.application.apiKeys.openai === 'configured' ? 'сконфигурирован' : 'отсутствует'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Активные соединения</span>
                <span className="text-text-primary">{systemInfo.application.activeConnections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Ошибка/рейт</span>
                <span className="text-text-primary">{systemInfo.application.errorRate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Компонент управления заявками на активацию PRO
  const PaymentRequestsManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Заявки на активацию PRO</h2>
        <button 
          onClick={fetchPaymentRequests}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2"
        >
          <FaClipboardList />
          Обновить
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
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Примечание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paymentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{request.displayName}</div>
                      <div className="text-sm text-text-secondary">{request.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatCurrency(request.amount)} ₸
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'approved' ? 'Одобрено' : 
                       request.status === 'pending' ? 'Ожидает' : 'Отклонено'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {formatRuDate(request.createdAt, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                    {request.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition"
                        >
                          <FaCheck />
                          Одобрить
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition"
                        >
                          <FaTimes />
                          Отклонить
                        </button>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-xs">
                        {request.status === 'approved' ? 'Обработано' : 'Отклонено'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paymentRequests.length === 0 && (
          <div className="text-center py-12">
            <FaClipboardList className="mx-auto text-4xl text-text-secondary mb-4 opacity-50" />
            <p className="text-text-secondary">Заявки не найдены</p>
          </div>
        )}
      </div>
    </div>
  );

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
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-surface border-b border-border px-6">
        <div className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Дашборд', icon: FaChartBar },
            { id: 'users', label: 'Пользователи', icon: FaUsers },
            { id: 'requests', label: 'Заявки', icon: FaClipboardList },
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
        {activeTab === 'requests' && <PaymentRequestsManagement />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'system' && <SystemInfo />}
      </main>
    </div>
  );
};

export default AdminPanel;
