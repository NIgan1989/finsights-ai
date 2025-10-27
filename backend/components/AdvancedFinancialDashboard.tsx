import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdvancedFinancialReport } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { formatCurrency as formatCurrencyUtil, formatPercentage as formatPercentageUtil } from '../../utils/formatUtils';

interface AdvancedFinancialDashboardProps {
  report: AdvancedFinancialReport;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

const AdvancedFinancialDashboard: React.FC<AdvancedFinancialDashboardProps> = ({ report }): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'trends' | 'risks' | 'recommendations'>('overview');
  const [modalChart, setModalChart] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value);
  };

  const formatPercentage = (value: number) => {
    return formatPercentageUtil(value, { fraction: true });
  };

  const getRiskColor = (value: number) => {
    if (value < 0.3) return 'text-success';
    if (value < 0.7) return 'text-warning';
    return 'text-destructive';
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
        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Выручка</p>
              <p className="text-xl font-bold text-foreground leading-tight">
                {formatCurrency(report.pnl.totalRevenue)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.revenueTrend === 'increasing' ? 'text-success' : 'text-destructive'}`}>
              {getTrendIcon(report.trendAnalysis.revenueTrend)}
            </div>
          </div>
        </div>

        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Чистая прибыль</p>
              <p className="text-xl font-bold text-foreground leading-tight">
                {formatCurrency(report.pnl.netProfit)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.profitTrend === 'increasing' ? 'text-success' : 'text-destructive'}`}>
              {getTrendIcon(report.trendAnalysis.profitTrend)}
            </div>
          </div>
        </div>

        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Рентабельность</p>
              <p className="text-xl font-bold text-foreground leading-tight">
                {formatPercentage(report.advancedMetrics.netProfitMargin)}
              </p>
            </div>
            <div className="text-xl transition-transform group-hover:scale-110">📊</div>
          </div>
        </div>

        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Денежный поток</p>
              <p className="text-xl font-bold text-foreground leading-tight">
                {formatCurrency(report.cashFlow.netCashFlow)}
              </p>
            </div>
            <div className={`text-xl transition-transform group-hover:scale-110 ${report.trendAnalysis.cashFlowTrend === 'increasing' ? 'text-success' : 'text-destructive'}`}>
              {getTrendIcon(report.trendAnalysis.cashFlowTrend)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-chart-card cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('pnl')}>
          <h3 className="text-lg font-bold mb-6 text-foreground tracking-tight">Динамика P&L</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <LineChart data={report.pnl.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
              <XAxis dataKey="month" stroke="var(--chart-line-axis)" style={{ fill: 'var(--chart-line-axis)' }} />
              <YAxis stroke="var(--chart-line-axis)" style={{ fill: 'var(--chart-line-axis)' }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="Доход" stroke="var(--chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Расход" stroke="var(--chart-2)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Прибыль" stroke="var(--chart-3)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-chart-card cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('expenses')}>
          <h3 className="text-lg font-bold mb-6 text-foreground tracking-tight">Структура расходов</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={report.pnl.expenseByCategory.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="var(--chart-4)"
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
        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-foreground mb-4 text-base tracking-tight">Ликвидность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Коэффициент текущей ликвидности</span>
                <span className="font-bold text-foreground">{report.advancedMetrics.currentRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Коэффициент быстрой ликвидности</span>
                <span className="font-bold text-foreground">{report.advancedMetrics.quickRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Коэффициент абсолютной ликвидности</span>
                <span className="font-bold text-foreground">{report.advancedMetrics.cashRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-foreground mb-4 text-base tracking-tight">Рентабельность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Рентабельность продаж</span>
                <span className="font-bold text-foreground">{formatPercentage(report.advancedMetrics.netProfitMargin)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Рентабельность активов</span>
                <span className="font-bold text-foreground">{formatPercentage(report.advancedMetrics.returnOnAssets)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Рентабельность собственного капитала</span>
                <span className="font-bold text-foreground">{formatPercentage(report.advancedMetrics.returnOnEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
          <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative z-10">
            <h4 className="font-bold text-foreground mb-4 text-base tracking-tight">Эффективность</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Оборачиваемость активов</span>
                <span className="font-bold text-foreground">{report.advancedMetrics.assetTurnover.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">Оборачиваемость дебиторской задолженности</span>
                <span className="font-bold text-foreground">{report.advancedMetrics.receivablesTurnover.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground font-medium">ROE</span>
                <span className="font-bold text-foreground">{formatPercentage(report.advancedMetrics.returnOnEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
        <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-4 text-foreground tracking-tight">Ключевые показатели эффективности</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Выручка на транзакцию</p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {formatCurrency(report.kpis.revenuePerEmployee)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Прибыль на транзакцию</p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {formatCurrency(report.kpis.profitPerTransaction)}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Цикл конвертации</p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {report.kpis.cashConversionCycle.toFixed(0)} дней
                </p>
              </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">DSO</p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {report.kpis.daysSalesOutstanding.toFixed(0)} дней
                </p>
              </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">DPO</p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {report.kpis.daysPayablesOutstanding.toFixed(0)} дней
                </p>
              </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">DIO</p>
                <p className="text-lg font-bold text-foreground leading-tight">
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
      <div className="relative group bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden p-6">
        <div className="absolute -inset-0.5 bg-gradient-chart-hover rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Темпы роста</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-transparent rounded-xl border border-primary/30">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Тренд выручки</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {report.trendAnalysis.revenueTrend === 'increasing' ? '↗️ Рост' : 
                 report.trendAnalysis.revenueTrend === 'decreasing' ? '↘️ Снижение' : '➡️ Стабильно'}
              </p>
              {report.advancedMetrics?.revenueGrowthRate && (
                 <p className="text-sm text-muted-foreground font-medium mt-1">
                   {formatPercentage(report.advancedMetrics.revenueGrowthRate)}
                 </p>
               )}
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-success/30">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Тренд прибыли</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {report.trendAnalysis.profitTrend === 'increasing' ? '↗️ Рост' : 
                 report.trendAnalysis.profitTrend === 'decreasing' ? '↘️ Снижение' : '➡️ Стабильно'}
              </p>
              {report.advancedMetrics?.profitGrowthRate && (
                 <p className="text-sm text-muted-foreground font-medium mt-1">
                   {formatPercentage(report.advancedMetrics.profitGrowthRate)}
                 </p>
               )}
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-primary/30">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Сезонность</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {report.trendAnalysis.seasonality ? 
                  `Пик: ${report.trendAnalysis.seasonality.peakMonths.join(', ')}` : 'Низкая'}
              </p>
            </div>
            <div className="text-center p-4 bg-transparent rounded-xl border border-warning/30">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Денежный поток</p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {getTrendIcon(report.trendAnalysis.cashFlowTrend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('cashflow')}>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Анализ денежных потоков</h3>
        <ResponsiveContainer width="100%" height={400} minWidth={400} minHeight={400}>
          <BarChart data={report.cashFlow.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-line-grid)" opacity={0.4} />
              <XAxis dataKey="month" stroke="var(--chart-line-axis)" style={{ fill: 'var(--chart-line-axis)' }} />
              <YAxis stroke="var(--chart-line-axis)" style={{ fill: 'var(--chart-line-axis)' }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="Поступления" fill="var(--chart-1)" />
            <Bar dataKey="Выбытия" fill="var(--chart-2)" />
            <Bar dataKey="Чистый поток" fill="var(--chart-3)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-6">
      {/* Risk Radar Chart */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setModalChart('risks')}>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Профиль рисков</h3>
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
            <Radar name="Риски" dataKey="A" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.6} />
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
            <div key={key} className="bg-card rounded-lg p-4 shadow-sm border border-border overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">
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
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${value < 0.3 ? 'bg-success' : value < 0.7 ? 'bg-warning' : 'bg-destructive'}`}
                  style={{ width: `${displayValue}%` }}
                ></div>
              </div>
              {actualValue > 100 && (
                <p className="text-xs text-destructive mt-1">
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
          <div className="bg-card border-l-4 border-destructive rounded-lg p-4 shadow-sm">
            <h4 className="text-destructive font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">🚨</span>
              Критические предупреждения
            </h4>
            <ul className="space-y-2">
              {report.alerts.critical.map((alert, index) => (
                <li key={index} className="text-destructive text-sm flex items-start">
                  <span className="mr-2 mt-1 text-destructive">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.warning.length > 0 && (
          <div className="bg-card border-l-4 border-warning rounded-lg p-4 shadow-sm">
            <h4 className="text-warning font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">⚠️</span>
              Предупреждения
            </h4>
            <ul className="space-y-2">
              {report.alerts.warning.map((alert, index) => (
                <li key={index} className="text-warning text-sm flex items-start">
                  <span className="mr-2 mt-1 text-warning">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.alerts.info.length > 0 && (
          <div className="bg-card border-l-4 border-info rounded-lg p-4 shadow-sm">
            <h4 className="text-info font-bold mb-3 flex items-center">
              <span className="mr-2 text-lg">ℹ️</span>
              Информация
            </h4>
            <ul className="space-y-2">
              {report.alerts.info.map((alert, index) => (
                <li key={index} className="text-info text-sm flex items-start">
                  <span className="mr-2 mt-1 text-info">•</span>
                  <span className="flex-1">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-success/30">
        <h3 className="text-lg font-bold mb-4 text-success flex items-center">
          <span className="mr-2 text-xl">💡</span>
          Рекомендации
        </h3>
        {report.recommendations.length > 0 ? (
          <ul className="space-y-4">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3 p-3 bg-card rounded-lg border border-success/30 shadow-sm">
                <span className="text-success mt-1 text-lg">💡</span>
                <span className="text-foreground font-medium flex-1">{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 bg-card rounded-lg border border-success/30 shadow-sm">
            <p className="text-success font-medium flex items-center">
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
      <div className="bg-card border-b border-border rounded-t-lg p-4">
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
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/20'
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
        <div className="fixed inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {modalChart === 'pnl' && 'Динамика P&L'}
                {modalChart === 'expenses' && 'Структура расходов'}
                {modalChart === 'cashflow' && 'Анализ денежных потоков'}
                {modalChart === 'risks' && 'Профиль рисков'}
              </h2>
              <button
                onClick={() => setModalChart(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/20 text-2xl font-bold rounded-lg p-1 transition-all duration-200"
              >
                ×
              </button>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={400}>
                {modalChart === 'pnl' ? (
                  <LineChart data={report.pnl.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="Доход" stroke="var(--chart-1)" strokeWidth={3} />
                    <Line type="monotone" dataKey="Расход" stroke="var(--chart-2)" strokeWidth={3} />
                    <Line type="monotone" dataKey="Прибыль" stroke="var(--chart-3)" strokeWidth={3} />
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
                      fill="hsl(var(--chart-4))"
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
                    <Bar dataKey="Поступления" fill="var(--chart-1)" />
                    <Bar dataKey="Выбытия" fill="var(--chart-2)" />
                    <Bar dataKey="Чистый поток" fill="var(--chart-3)" />
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
                    <Radar name="Риски" dataKey="A" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.6} />
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
