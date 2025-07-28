import React from 'react';
import { FaArrowUp, FaArrowDown, FaUsers, FaCreditCard, FaChartLine } from 'react-icons/fa';

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
  const userGrowthData: ChartData = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Новые пользователи',
        data: [120, 190, 300, 500, 200, 300],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
  };

  const revenueData: ChartData = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Доход (₸)',
        data: [50000, 75000, 120000, 180000, 150000, 200000],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)'
      }
    ]
  };

  const subscriptionData = [
    { label: 'FREE', value: 892, color: 'bg-gray-500' },
    { label: 'PRO', value: 156, color: 'bg-purple-500' },
    { label: 'PENDING', value: 23, color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Новые пользователи"
          value="+156"
          change={12.5}
          icon={<FaUsers className="text-white text-xl" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Доход"
          value="₸2.4M"
          change={8.2}
          icon={<FaCreditCard className="text-white text-xl" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Конверсия"
          value="23.4%"
          change={-2.1}
          icon={<FaChartLine className="text-white text-xl" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Активность"
          value="89%"
          change={5.7}
          icon={<FaArrowUp className="text-white text-xl" />}
          color="bg-orange-500"
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Рост пользователей</h3>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FaChartLine className="text-4xl text-blue-500 mx-auto mb-2" />
              <p className="text-text-secondary">График роста пользователей</p>
              <p className="text-sm text-text-secondary mt-1">Интеграция с Chart.js</p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Доходы</h3>
          <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FaCreditCard className="text-4xl text-green-500 mx-auto mb-2" />
              <p className="text-text-secondary">График доходов</p>
              <p className="text-sm text-text-secondary mt-1">Интеграция с Chart.js</p>
            </div>
          </div>
        </div>
      </div>

      {/* Подписки */}
      <div className="bg-surface p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Распределение подписок</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionData.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white font-bold">{item.value}</span>
              </div>
              <p className="text-text-primary font-medium">{item.label}</p>
              <p className="text-text-secondary text-sm">
                {Math.round((item.value / 1071) * 100)}% от общего числа
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCharts; 