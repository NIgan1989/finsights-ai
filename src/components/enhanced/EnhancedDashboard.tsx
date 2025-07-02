import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Chip,
  LinearProgress,
  useTheme,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PieChart,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  FilterList,
  DateRange,
} from '@mui/icons-material';
import { FinancialCard } from './FinancialCard';
import { AdvancedChart } from './AdvancedChart';
import { AdvancedFinanceService } from '../../services/advancedFinanceService';
import { Transaction } from '../../types';
import { colors } from '../../theme/designSystem';

interface EnhancedDashboardProps {
  transactions: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
  dateRange?: {
    start: string;
    end: string;
  };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  transactions,
  loading = false,
  onRefresh,
  dateRange,
  onDateRangeChange,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Расчет продвинутых метрик
  const metrics = useMemo(() => {
    if (!transactions.length) return null;
    
    return AdvancedFinanceService.calculateAdvancedMetrics(
      transactions,
      1000000, // Примерные активы
      500000   // Примерный капитал
    );
  }, [transactions]);

  // Анализ категорий
  const categoryAnalysis = useMemo(() => {
    if (!transactions.length) return [];
    return AdvancedFinanceService.analyzeCategorySpending(transactions);
  }, [transactions]);

  // Анализ денежных потоков
  const cashFlowAnalysis = useMemo(() => {
    if (!transactions.length) return null;
    return AdvancedFinanceService.analyzeCashFlow(transactions);
  }, [transactions]);

  // Анализ рисков
  const riskAnalysis = useMemo(() => {
    if (!metrics) return null;
    return AdvancedFinanceService.analyzeRisks(metrics, transactions);
  }, [metrics, transactions]);

  // Подготовка данных для графиков
  const chartData = useMemo(() => {
    if (!transactions.length) return [];
    
    // Группировка по месяцам
    const monthlyData = new Map<string, { revenue: number; expenses: number }>();
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, expenses: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      if (t.amount > 0) {
        monthData.revenue += t.amount;
      } else {
        monthData.expenses += Math.abs(t.amount);
      }
    });
    
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: month,
        value: data.revenue - data.expenses,
        revenue: data.revenue,
        expenses: data.expenses,
      }));
  }, [transactions]);

  // Данные для круговой диаграммы категорий
  const categoryChartData = useMemo(() => {
    return categoryAnalysis.map(cat => ({
      name: cat.category,
      value: cat.amount,
    }));
  }, [categoryAnalysis]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  if (loading || !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Финансовая аналитика
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FinancialCard
                title="Загрузка..."
                value={0}
                loading={true}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Финансовая аналитика
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          {riskAnalysis && (
            <Chip
              icon={
                riskAnalysis.overallRisk === 'low' ? <CheckCircle /> :
                riskAnalysis.overallRisk === 'medium' ? <Warning /> : <Error />
              }
              label={`Риск: ${riskAnalysis.overallRisk === 'low' ? 'Низкий' : 
                              riskAnalysis.overallRisk === 'medium' ? 'Средний' : 'Высокий'}`}
              color={
                riskAnalysis.overallRisk === 'low' ? 'success' :
                riskAnalysis.overallRisk === 'medium' ? 'warning' : 'error'
              }
              variant="filled"
            />
          )}
          
          <Tooltip title="Обновить данные">
            <IconButton onClick={onRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Уведомления о рисках */}
      {riskAnalysis?.alerts.map((alert, index) => (
        <Alert 
          key={index} 
          severity={alert.type === 'critical' ? 'error' : 'warning'} 
          sx={{ mb: 2 }}
        >
          <AlertTitle>{alert.message}</AlertTitle>
          {alert.action}
        </Alert>
      ))}

      {/* KPI Карточки */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="Выручка"
            value={metrics.revenue}
            icon={<TrendingUp color="success" />}
            format="currency"
            showComparison={true}
            previousValue={metrics.revenue * 0.9}
            variant="gradient"
            size="medium"
            info="Общая выручка за период"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="Расходы"
            value={metrics.expenses}
            icon={<TrendingDown color="error" />}
            format="currency"
            showComparison={true}
            previousValue={metrics.expenses * 1.1}
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="Чистая прибыль"
            value={metrics.netIncome}
            icon={<AccountBalance />}
            format="currency"
            showComparison={true}
            previousValue={metrics.netIncome * 0.8}
            variant={metrics.netIncome > 0 ? 'gradient' : 'default'}
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="Рентабельность"
            value={metrics.profitability.netMargin}
            icon={<Assessment />}
            format="percentage"
            showComparison={true}
            previousValue={metrics.profitability.netMargin - 2}
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="ROA"
            value={metrics.profitability.roa}
            icon={<PieChart />}
            format="percentage"
            showComparison={true}
            previousValue={metrics.profitability.roa - 1}
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <FinancialCard
            title="Ликвидность"
            value={metrics.liquidity.currentRatio}
            icon={<Info />}
            format="number"
            showComparison={true}
            previousValue={metrics.liquidity.currentRatio - 0.1}
            size="medium"
            progress={Math.min(100, metrics.liquidity.currentRatio * 50)}
            target={2}
          />
        </Grid>
      </Grid>

      {/* Вкладки */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Обзор" />
          <Tab label="Денежные потоки" />
          <Tab label="Расходы по категориям" />
          <Tab label="Коэффициенты" />
          <Tab label="Прогнозы" />
          <Tab label={
            <Badge 
              badgeContent={riskAnalysis?.alerts.length || 0} 
              color="error"
            >
              Риски
            </Badge>
          } />
        </Tabs>

        {/* Обзор */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <AdvancedChart
                title="Динамика прибыли"
                subtitle="Помесячная динамика доходов и расходов"
                data={chartData}
                type="area"
                height={400}
                showComparison={true}
                showTrend={true}
                showPeriodSelector={true}
                periods={[
                  { label: '3М', value: '3m', active: selectedPeriod === '3m' },
                  { label: '6М', value: '6m', active: selectedPeriod === '6m' },
                  { label: '1Г', value: '1y', active: selectedPeriod === '1y' },
                ]}
                onPeriodChange={handlePeriodChange}
                onRefresh={onRefresh}
              />
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Бенчмарк с отраслью
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      ROA: Ваша компания vs Отрасль
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(metrics.profitability.roa / metrics.benchmarks.industryMedianROA) * 100}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="caption">
                      {metrics.profitability.roa.toFixed(1)}% vs {metrics.benchmarks.industryMedianROA}%
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      ROE: Ваша компания vs Отрасль
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(metrics.profitability.roe / metrics.benchmarks.industryMedianROE) * 100}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="caption">
                      {metrics.profitability.roe.toFixed(1)}% vs {metrics.benchmarks.industryMedianROE}%
                    </Typography>
                  </Box>

                  <Chip
                    label={
                      metrics.benchmarks.companyVsIndustry === 'above' ? 'Выше отрасли' :
                      metrics.benchmarks.companyVsIndustry === 'below' ? 'Ниже отрасли' : 'В среднем по отрасли'
                    }
                    color={
                      metrics.benchmarks.companyVsIndustry === 'above' ? 'success' :
                      metrics.benchmarks.companyVsIndustry === 'below' ? 'error' : 'info'
                    }
                    variant="filled"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Денежные потоки */}
        <TabPanel value={activeTab} index={1}>
          {cashFlowAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FinancialCard
                  title="Операционный поток"
                  value={cashFlowAnalysis.operatingCashFlow}
                  format="currency"
                  variant="gradient"
                  size="large"
                  info="Денежный поток от основной деятельности"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinancialCard
                  title="Инвестиционный поток"
                  value={cashFlowAnalysis.investingCashFlow}
                  format="currency"
                  size="large"
                  info="Денежный поток от инвестиционной деятельности"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FinancialCard
                  title="Финансовый поток"
                  value={cashFlowAnalysis.financingCashFlow}
                  format="currency"
                  size="large"
                  info="Денежный поток от финансовой деятельности"
                />
              </Grid>
              
              <Grid item xs={12}>
                <AdvancedChart
                  title="Структура денежных потоков"
                  data={[
                    { name: 'Операционный', value: cashFlowAnalysis.operatingCashFlow },
                    { name: 'Инвестиционный', value: Math.abs(cashFlowAnalysis.investingCashFlow) },
                    { name: 'Финансовый', value: Math.abs(cashFlowAnalysis.financingCashFlow) },
                  ]}
                  type="pie"
                  height={400}
                />
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Расходы по категориям */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <AdvancedChart
                title="Расходы по категориям"
                data={categoryChartData}
                type="pie"
                height={400}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Анализ категорий
                  </Typography>
                  {categoryAnalysis.slice(0, 5).map((cat, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{cat.category}</Typography>
                        <Chip
                          size="small"
                          label={cat.trend === 'increasing' ? 'Рост' : 
                                 cat.trend === 'decreasing' ? 'Снижение' : 'Стабильно'}
                          color={cat.trend === 'increasing' ? 'error' : 
                                 cat.trend === 'decreasing' ? 'success' : 'default'}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={cat.percentage}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {cat.percentage.toFixed(1)}% от общих расходов
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Коэффициенты */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Рентабельность
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Валовая маржа"
                        value={metrics.profitability.grossMargin}
                        format="percentage"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Чистая маржа"
                        value={metrics.profitability.netMargin}
                        format="percentage"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="ROA"
                        value={metrics.profitability.roa}
                        format="percentage"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="ROE"
                        value={metrics.profitability.roe}
                        format="percentage"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ликвидность
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Текущая ликвидность"
                        value={metrics.liquidity.currentRatio}
                        format="number"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Быстрая ликвидность"
                        value={metrics.liquidity.quickRatio}
                        format="number"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Абсолютная ликвидность"
                        value={metrics.liquidity.cashRatio}
                        format="number"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FinancialCard
                        title="Операционный CF"
                        value={metrics.liquidity.operatingCashFlowRatio}
                        format="number"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Прогнозы */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FinancialCard
                title="Прогноз выручки"
                value={metrics.forecast.expectedRevenue}
                format="currency"
                variant="gradient"
                size="large"
                subtitle={`Доверие: ${metrics.forecast.confidence}%`}
                progress={metrics.forecast.confidence}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FinancialCard
                title="Прогноз прибыли"
                value={metrics.forecast.expectedProfit}
                format="currency"
                variant="gradient"
                size="large"
                subtitle={`Доверие: ${metrics.forecast.confidence}%`}
                progress={metrics.forecast.confidence}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FinancialCard
                title="Прогноз ден. потока"
                value={metrics.forecast.expectedCashFlow}
                format="currency"
                variant="gradient"
                size="large"
                subtitle={`Доверие: ${metrics.forecast.confidence}%`}
                progress={metrics.forecast.confidence}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Риски */}
        <TabPanel value={activeTab} index={5}>
          {riskAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Факторы риска
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Риск ликвидности</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={riskAnalysis.factors.liquidityRisk}
                        color={riskAnalysis.factors.liquidityRisk > 20 ? 'error' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">
                        {riskAnalysis.factors.liquidityRisk.toFixed(0)}%
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Кредитный риск</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={riskAnalysis.factors.creditRisk}
                        color={riskAnalysis.factors.creditRisk > 20 ? 'error' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">
                        {riskAnalysis.factors.creditRisk.toFixed(0)}%
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Операционный риск</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={riskAnalysis.factors.operationalRisk}
                        color={riskAnalysis.factors.operationalRisk > 20 ? 'error' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">
                        {riskAnalysis.factors.operationalRisk.toFixed(0)}%
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Рыночный риск</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={riskAnalysis.factors.marketRisk}
                        color={riskAnalysis.factors.marketRisk > 20 ? 'error' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption">
                        {riskAnalysis.factors.marketRisk.toFixed(0)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Рекомендации
                    </Typography>
                    {riskAnalysis.recommendations.map((rec, index) => (
                      <Alert key={index} severity="info" sx={{ mb: 1 }}>
                        {rec}
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};