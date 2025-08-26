import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaUsers, FaCreditCard, FaChartLine, FaSync } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
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

interface RealTimeStats {
  totalUsers: number;
  newUsersThisMonth: number;
  proUsers: number;
  totalRevenue: number;
  conversionRate: number;
  activeUsers: number;
  pendingRequests: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => (
  <div className="bg-surface p-6 rounded-xl border border-border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-sm">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {change > 0 ? (
            <FaArrowUp className="text-green-500 text-sm" />
          ) : (
            <FaArrowDown className="text-red-500 text-sm" />
          )}
          <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const AdminCharts: React.FC = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<RealTimeStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    proUsers: 0,
    totalRevenue: 0,
    conversionRate: 0,
    activeUsers: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  // Добавлено: состояние для данных графика, которые приходят с бэкенда
  interface MonthlyPoint { month: string; users: number; approved: number; revenue: number; }
  const [chartMonthlyData, setChartMonthlyData] = useState<MonthlyPoint[]>([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Получаем реальную аналитику с бэкенда
      const analyticsResponse = await fetch('/api/admin/analytics');
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setStats(analyticsData.stats);
        // Сохраняем данные о графиках для использования в generateChartData
        setChartMonthlyData(analyticsData.monthly);
      }

      // Также получаем заявки для отображения в других местах
      const requestsResponse = await fetch('/api/payment-requests');
      const requestsData = await requestsResponse.json();
      const requests = requestsData.requests || [];
      setPaymentRequests(requests);

      setLastUpdate(new Date().toLocaleTimeString('ru-RU'));
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Генерация реальных данных по месяцам за последние 6 месяцев
  const generateChartData = () => {
    // Если данные для графиков пришли с бэкенда — используем их
    if (chartMonthlyData && chartMonthlyData.length > 0) {
      return chartMonthlyData;
    }

    const now = new Date();
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    // Подготовим массив последних 6 месяцев
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
    });

    // Агрегируем по месяцам
    const monthlyData = months.map(({ label, year, month }) => {
      const monthRequests = paymentRequests.filter(r => {
        const dt = new Date(r.createdAt);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

      const users = monthRequests.length;
      const approved = monthRequests.filter(r => r.status === 'approved').length;
      const revenue = monthRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.amount, 0);

      return { month: label, users, approved, revenue };
    });

    return monthlyData;
  };

  const chartData = generateChartData();

  // Изменение по месяцам для метрик (MoM)
  const currentIdx = chartData.length - 1;
  const prevIdx = chartData.length - 2;
  const usersChange = prevIdx >= 0 && chartData[prevIdx].users > 0
    ? ((chartData[currentIdx].users - chartData[prevIdx].users) / chartData[prevIdx].users) * 100
    : 0;
  const revenueChange = prevIdx >= 0 && chartData[prevIdx].revenue > 0
    ? ((chartData[currentIdx].revenue - chartData[prevIdx].revenue) / chartData[prevIdx].revenue) * 100
    : 0;
  const conversionCurrent = chartData[currentIdx].users > 0 ? (chartData[currentIdx].approved / chartData[currentIdx].users) * 100 : 0;
  const conversionPrev = prevIdx >= 0 && chartData[prevIdx].users > 0 ? (chartData[prevIdx].approved / chartData[prevIdx].users) * 100 : 0;
  const conversionChange = conversionCurrent - conversionPrev;

  const subscriptionData = [
    { 
      name: 'FREE', 
      value: Math.max(stats.totalUsers - stats.proUsers, 0), 
      color: '#6B7280' 
    },
    { 
      name: 'PRO', 
      value: stats.proUsers, 
      color: '#8B5CF6' 
    },
    { 
      name: 'PENDING', 
      value: stats.pendingRequests, 
      color: '#F59E0B' 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с обновлением */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Аналитика в реальном времени</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            Обновлено: {lastUpdate}
          </span>
          <button 
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            disabled={loading}
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Новые пользователи"
          value={`+${stats.newUsersThisMonth}`}
          change={Number(usersChange.toFixed(1))}
          icon={<FaUsers className="text-white text-xl" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Доход"
          value={`₸${(stats.totalRevenue / 1000).toFixed(0)}K`}
          change={Number(revenueChange.toFixed(1))}
          icon={<FaCreditCard className="text-white text-xl" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Конверсия"
          value={`${stats.conversionRate.toFixed(1)}%`}
          change={Number(conversionChange.toFixed(1))}
          icon={<FaChartLine className="text-white text-xl" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Активность"
          value={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`}
          change={8.5}
          icon={<FaArrowUp className="text-white text-xl" />}
          color="bg-orange-500"
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Рост пользователей</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Новые пользователи"
              />
              <Line 
                type="monotone" 
                dataKey="approved" 
                stroke="#10B981" 
                strokeWidth={2}
                name="PRO подписки"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Доходы по месяцам</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`₸${Number(value).toLocaleString()}`, 'Доход']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Доход (₸)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Подписки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Распределение подписок</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Статистика</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-text-secondary">Всего пользователей</span>
              <span className="text-xl font-bold text-text-primary">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-text-secondary">PRO подписки</span>
              <span className="text-xl font-bold text-purple-600">{stats.proUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-text-secondary">Ожидают активации</span>
              <span className="text-xl font-bold text-yellow-600">{stats.pendingRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-text-secondary">Общий доход</span>
              <span className="text-xl font-bold text-green-600">₸{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-text-secondary">Конверсия</span>
              <span className="text-xl font-bold text-blue-600">{stats.conversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;
