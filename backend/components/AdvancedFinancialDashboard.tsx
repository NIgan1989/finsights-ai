import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdvancedFinancialReport } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AdvancedFinancialDashboardProps {
  report: AdvancedFinancialReport;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedFinancialDashboard: React.FC<AdvancedFinancialDashboardProps> = ({ report }): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'trends' | 'risks' | 'recommendations'>('overview');
  const [modalChart, setModalChart] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskColor = (value: number) => {
    if (value < 0.3) return 'text-green-600';
    if (value < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Выручка</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {formatCurrency(report.pnl.totalRevenue)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.revenueTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.revenueTrend)}
            </div>
          </div>
        </div>

        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Чистая прибыль</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {formatCurrency(report.pnl.netProfit)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.profitTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.profitTrend)}
            </div>
          </div>
        </div>

        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Рентабельность</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {formatPercentage(report.advancedMetrics.netProfitMargin)}
              </p>
            </div>
            <div className="text-xl transition-transform group-hover:scale-110">📊</div>
          </div>
        </div>

        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Денежный поток</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {formatCurrency(report.cashFlow.netCashFlow)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.cashFlowTrend === 'increasing' ? 'text-green-500' : 'text-red-500'}`}>
              {getTrendIcon(report.trendAnalysis.cashFlowTrend)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="chart-card cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('pnl')}>
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white tracking-tight">Динамика P&L</h3>
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

        <div className="chart-card cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('expenses')}>
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white tracking-tight">Структура расходов</h3>
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
                {report.pnl.expenseByCategory.slice(0, 6).map((category, index) => (
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
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-base tracking-tight">Ликвидность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Коэффициент текущей ликвидности</span>
                <span className="font-bold text-gray-900 dark:text-white">{report.advancedMetrics.currentRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Коэффициент быстрой ликвидности</span>
                <span className="font-bold text-gray-900 dark:text-white">{report.advancedMetrics.quickRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Коэффициент абсолютной ликвидности</span>
                <span className="font-bold text-gray-900 dark:text-white">{report.advancedMetrics.cashRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-base tracking-tight">Рентабельность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Рентабельность продаж</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPercentage(report.advancedMetrics.netProfitMargin)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Рентабельность активов</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPercentage(report.advancedMetrics.returnOnAssets)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Рентабельность собственного капитала</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPercentage(report.advancedMetrics.returnOnEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-base tracking-tight">Эффективность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Оборачиваемость активов</span>
                <span className="font-bold text-gray-900 dark:text-white">{report.advancedMetrics.assetTurnover.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Оборачиваемость дебиторской задолженности</span>
                <span className="font-bold text-gray-900 dark:text-white">{report.advancedMetrics.receivablesTurnover.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">ROE</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPercentage(report.advancedMetrics.returnOnEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">Ключевые показатели эффективности</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Выручка на транзакцию</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {formatCurrency(report.kpis.revenuePerEmployee)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Прибыль на транзакцию</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {formatCurrency(report.kpis.profitPerTransaction)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Цикл конвертации</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {report.kpis.cashConversionCycle.toFixed(0)} дней
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DSO</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {report.kpis.daysSalesOutstanding.toFixed(0)} дней
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DPO</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {report.kpis.daysPayablesOutstanding.toFixed(0)} дней
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DIO</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {report.kpis.daysInventoryOutstanding.toFixed(0)} дней
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      {/* Growth Trends */}
      <div className="relative group bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-lg overflow-hidden p-6">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">Темпы роста</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-transparent rounded-xl border border-blue-100 dark:border-blue-800/30">
              <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-2">Тренд выручки</p>
              <p className="text-2xl font-bold text-white leading-tight">
                {report.trendAnalysis.revenueTrend === 'increasing' ? '↗️ Рост' : 
                 report.trendAnalysis.revenueTrend === 'decreasing' ? '↘️ Снижение' : '➡️ Стабильно'}
              </p>
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-green-100 dark:border-green-800/30">
              <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-2">Тренд прибыли</p>
              <p className="text-2xl font-bold text-white leading-tight">
                {report.trendAnalysis.profitTrend === 'increasing' ? '↗️ Рост' : 
                 report.trendAnalysis.profitTrend === 'decreasing' ? '↘️ Снижение' : '➡️ Стабильно'}
              </p>
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-purple-100 dark:border-purple-800/30">
              <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-2">Сезонность</p>
              <p className="text-2xl font-bold text-white leading-tight">
                {report.trendAnalysis.seasonality ? 
                  `Пик: ${report.trendAnalysis.seasonality.peakMonths.join(', ')}` : 'Низкая'}
              </p>
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-yellow-100 dark:border-yellow-800/30">
              <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-2">Денежный поток</p>
              <p className="text-2xl font-bold text-white leading-tight">
                {getTrendIcon(report.trendAnalysis.cashFlowTrend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('cashflow')}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Анализ денежных потоков</h3>
        <ResponsiveContainer width="100%" height={400}>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('risks')}>
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
            {
              subject: 'Риск волатильности',
              A: report.riskMetrics.volatilityRisk * 100,
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
        {Object.entries(report.riskMetrics).map(([key, rawValue]) => {
          const value = rawValue as number;
          const displayValue = Math.min(value * 100, 100);
          const actualValue = value * 100;
          
          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                  {actualValue.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${value < 0.3 ? 'bg-green-500' : value < 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${displayValue}%` }}
                ></div>
              </div>
              {actualValue > 100 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠️ Критический уровень риска
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="space-y-4">
        {report.alerts.critical.length > 0 && (
          <div className="bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <h4 className="text-red-900 dark:text-red-100 font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">🚨</span>
              Критические предупреждения
            </h4>
            <ul className="space-y-2">
              {report.alerts.critical.map((alert, index) => (
                <li key={index} className="text-red-800 dark:text-red-200 text-sm flex items-start">
                  <span className="mr-2 mt-1 text-red-600 dark:text-red-300">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.warning.length > 0 && (
          <div className="bg-amber-100 dark:bg-amber-900/40 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
            <h4 className="text-amber-900 dark:text-amber-100 font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">⚠️</span>
              Предупреждения
            </h4>
            <ul className="space-y-2">
              {report.alerts.warning.map((alert, index) => (
                <li key={index} className="text-amber-800 dark:text-amber-200 text-sm flex items-start">
                  <span className="mr-2 mt-1 text-amber-600 dark:text-amber-300">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.info.length > 0 && (
          <div className="bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
            <h4 className="text-blue-900 dark:text-blue-100 font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">ℹ️</span>
              Информация
            </h4>
            <ul className="space-y-2">
              {report.alerts.info.map((alert, index) => (
                <li key={index} className="text-blue-800 dark:text-blue-200 text-sm flex items-start">
                  <span className="mr-2 mt-1 text-blue-600 dark:text-blue-300">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 shadow-sm border border-green-200 dark:border-green-700">
        <h3 className="text-lg font-bold mb-4 text-green-900 dark:text-green-100 flex items-center">
          <span className="mr-2 text-xl">💡</span>
          Рекомендации
        </h3>
        {report.recommendations.length > 0 ? (
          <ul className="space-y-4">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600 shadow-sm">
                <span className="text-green-600 dark:text-green-400 mt-1 text-lg">💡</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium flex-1">{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600 shadow-sm">
            <p className="text-green-700 dark:text-green-300 font-medium flex items-center">
              <span className="mr-2 text-lg">✅</span>
              Все показатели в норме. Продолжайте в том же духе!
            </p>
          </div>
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

      {/* Modal Windows */}
      {modalChart && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalChart === 'pnl' && 'Динамика P&L'}
                {modalChart === 'expenses' && 'Структура расходов'}
                {modalChart === 'cashflow' && 'Анализ денежных потоков'}
                {modalChart === 'risks' && 'Профиль рисков'}
              </h2>
              <button
                onClick={() => setModalChart(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {modalChart === 'pnl' ? (
                  <LineChart data={report.pnl.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="Доход" stroke="#0088FE" strokeWidth={3} />
                    <Line type="monotone" dataKey="Расход" stroke="#FF8042" strokeWidth={3} />
                    <Line type="monotone" dataKey="Прибыль" stroke="#00C49F" strokeWidth={3} />
                  </LineChart>
                ) : modalChart === 'expenses' ? (
                  <PieChart>
                    <Pie
                      data={report.pnl.expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {report.pnl.expenseByCategory.map((category, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                ) : modalChart === 'cashflow' ? (
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
                ) : modalChart === 'risks' ? (
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
                    {
                      subject: 'Риск волатильности',
                      A: report.riskMetrics.volatilityRisk * 100,
                      fullMark: 100,
                    },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Риски" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p>Выберите тип графика</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdvancedFinancialDashboard;
