import React, { useState } from 'react';
import { AdvancedFinancialReport } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AdvancedFinancialDashboardProps {
  report: AdvancedFinancialReport;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedFinancialDashboard: React.FC<AdvancedFinancialDashboardProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'trends' | 'risks' | 'recommendations'>('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRiskColor = (value: number) => {
    if (value < 0.3) return 'text-green-600';
    if (value < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Выручка</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.pnl.totalRevenue)}
              </p>
            </div>
            <div className={`text-2xl ${report.trendAnalysis.revenueTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.revenueTrend)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Чистая прибыль</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.pnl.netProfit)}
              </p>
            </div>
            <div className={`text-2xl ${report.trendAnalysis.profitTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.profitTrend)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Рентабельность</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(report.advancedMetrics.netProfitMargin)}
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Денежный поток</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.cashFlow.netCashFlow)}
              </p>
            </div>
            <div className={`text-2xl ${report.trendAnalysis.cashFlowTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.cashFlowTrend)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Динамика P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report.pnl.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="Доход" stroke="#0088FE" strokeWidth={2} />
              <Line type="monotone" dataKey="Расход" stroke="#FF8042" strokeWidth={2} />
              <Line type="monotone" dataKey="Прибыль" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Структура расходов</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={report.pnl.expenseByCategory.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {report.pnl.expenseByCategory.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      {/* Financial Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ликвидность</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Коэффициент текущей ликвидности</span>
              <span className="font-medium">{report.advancedMetrics.currentRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Коэффициент быстрой ликвидности</span>
              <span className="font-medium">{report.advancedMetrics.quickRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Коэффициент денежной ликвидности</span>
              <span className="font-medium">{report.advancedMetrics.cashRatio.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Рентабельность</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Валовая маржа</span>
              <span className="font-medium">{formatPercentage(report.advancedMetrics.grossProfitMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Операционная маржа</span>
              <span className="font-medium">{formatPercentage(report.advancedMetrics.operatingProfitMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Чистая маржа</span>
              <span className="font-medium">{formatPercentage(report.advancedMetrics.netProfitMargin)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Эффективность</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Оборачиваемость активов</span>
              <span className="font-medium">{report.advancedMetrics.assetTurnover.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Оборачиваемость дебиторской задолженности</span>
              <span className="font-medium">{report.advancedMetrics.receivablesTurnover.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">ROE</span>
              <span className="font-medium">{formatPercentage(report.advancedMetrics.returnOnEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ключевые показатели эффективности</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Выручка на транзакцию</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(report.kpis.revenuePerEmployee)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Прибыль на транзакцию</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(report.kpis.profitPerTransaction)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Цикл конвертации</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {report.kpis.cashConversionCycle.toFixed(0)} дней
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">DSO</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {report.kpis.daysSalesOutstanding.toFixed(0)} дней
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">DPO</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {report.kpis.daysPayablesOutstanding.toFixed(0)} дней
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">DIO</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {report.kpis.daysInventoryOutstanding.toFixed(0)} дней
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Темпы роста</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Рост выручки</span>
              <span className={`font-medium ${report.advancedMetrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(report.advancedMetrics.revenueGrowthRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Рост прибыли</span>
              <span className={`font-medium ${report.advancedMetrics.profitGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(report.advancedMetrics.profitGrowthRate)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Сезонность</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Пиковые месяцы: </span>
              <span className="text-sm font-medium">{report.trendAnalysis.seasonality.peakMonths.join(', ')}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Низкие месяцы: </span>
              <span className="text-sm font-medium">{report.trendAnalysis.seasonality.lowMonths.join(', ')}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Индекс сезонности: </span>
              <span className="text-sm font-medium">{report.trendAnalysis.seasonality.seasonalityIndex.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Анализ денежных потоков</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.cashFlow.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="Поступления" fill="#0088FE" />
            <Bar dataKey="Выбытия" fill="#FF8042" />
            <Bar dataKey="Чистый поток" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-6">
      {/* Risk Radar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Профиль рисков</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={[
            {
              subject: 'Риск ликвидности',
              A: report.riskMetrics.liquidityRisk * 100,
              fullMark: 100,
            },
            {
              subject: 'Риск платежеспособности',
              A: report.riskMetrics.solvencyRisk * 100,
              fullMark: 100,
            },
            {
              subject: 'Операционный риск',
              A: report.riskMetrics.operationalRisk * 100,
              fullMark: 100,
            },
            {
              subject: 'Рыночный риск',
              A: report.riskMetrics.marketRisk * 100,
              fullMark: 100,
            },
            {
              subject: 'Кредитный риск',
              A: report.riskMetrics.creditRisk * 100,
              fullMark: 100,
            },
            {
              subject: 'Концентрационный риск',
              A: report.riskMetrics.concentrationRisk * 100,
              fullMark: 100,
            },
          ]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Риски" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(report.riskMetrics).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {key === 'liquidityRisk' ? 'Риск ликвидности' :
                 key === 'solvencyRisk' ? 'Риск платежеспособности' :
                 key === 'operationalRisk' ? 'Операционный риск' :
                 key === 'marketRisk' ? 'Рыночный риск' :
                 key === 'creditRisk' ? 'Кредитный риск' :
                 key === 'concentrationRisk' ? 'Концентрационный риск' :
                 key === 'volatilityRisk' ? 'Риск волатильности' : key}
              </span>
              <span className={`text-sm font-bold ${getRiskColor(value)}`}>
                {(value * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${value < 0.3 ? 'bg-green-500' : value < 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${value * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="space-y-4">
        {report.alerts.critical.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2">Критические предупреждения</h4>
            <ul className="space-y-1">
              {report.alerts.critical.map((alert, index) => (
                <li key={index} className="text-red-700 dark:text-red-300 text-sm">• {alert}</li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.warning.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Предупреждения</h4>
            <ul className="space-y-1">
              {report.alerts.warning.map((alert, index) => (
                <li key={index} className="text-yellow-700 dark:text-yellow-300 text-sm">• {alert}</li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.info.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Информация</h4>
            <ul className="space-y-1">
              {report.alerts.info.map((alert, index) => (
                <li key={index} className="text-blue-700 dark:text-blue-300 text-sm">• {alert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Рекомендации</h3>
        {report.recommendations.length > 0 ? (
          <ul className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-blue-500 mt-1">💡</span>
                <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Все показатели в норме. Продолжайте в том же духе!</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Обзор', icon: '📊' },
            { id: 'metrics', label: 'Метрики', icon: '📈' },
            { id: 'trends', label: 'Тренды', icon: '📉' },
            { id: 'risks', label: 'Риски', icon: '⚠️' },
            { id: 'recommendations', label: 'Рекомендации', icon: '💡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'risks' && renderRisks()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  );
};

export default AdvancedFinancialDashboard;