import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    useTheme,
    alpha,
    Chip,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AttachMoney,
    AccountBalance,
    Speed,
    Timeline,
    PieChart,
    ShowChart,
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatting';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: number;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
    progress?: number;
    target?: number;
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    color = 'primary',
    progress,
    target,
}) => {
    const theme = useTheme();
    
    const colorPalette = {
        primary: theme.palette.primary,
        success: theme.palette.success,
        error: theme.palette.error,
        warning: theme.palette.warning,
        info: theme.palette.info,
    };

    const selectedColor = colorPalette[color];

    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp fontSize="small" />;
        if (trend === 'down') return <TrendingDown fontSize="small" />;
        return null;
    };

    const getTrendColor = () => {
        if (trend === 'up') return theme.palette.success.main;
        if (trend === 'down') return theme.palette.error.main;
        return theme.palette.text.secondary;
    };

    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(selectedColor.main, 0.1)} 0%, ${alpha(selectedColor.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(selectedColor.main, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${selectedColor.main} 0%, ${selectedColor.light} 100%)`,
                },
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 32px ${alpha(selectedColor.main, 0.3)}`,
                },
                transition: 'all 0.3s ease-in-out',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: selectedColor.main, mb: 0.5 }}>
                            {typeof value === 'number' ? formatCurrency(value) : value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                backgroundColor: alpha(selectedColor.main, 0.1),
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: selectedColor.main,
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>

                {(trend || trendValue !== undefined) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {getTrendIcon()}
                        <Typography
                            variant="body2"
                            sx={{
                                color: getTrendColor(),
                                fontWeight: 600,
                            }}
                        >
                            {trendValue !== undefined ? `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}%` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            за период
                        </Typography>
                    </Box>
                )}

                {progress !== undefined && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Прогресс
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {progress.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(progress, 100)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: alpha(selectedColor.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: selectedColor.main,
                                    borderRadius: 3,
                                },
                            }}
                        />
                        {target && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Цель: {formatCurrency(target)}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

interface FinancialKPIGridProps {
    data: {
        revenue: number;
        expenses: number;
        netProfit: number;
        grossMargin: number;
        operatingMargin: number;
        netMargin: number;
        roa: number;
        roe: number;
        currentRatio: number;
        quickRatio: number;
        debtToEquity: number;
        cashFlow: number;
        // Дополнительные поля для трендов
        revenueTrend?: number;
        profitTrend?: number;
        expensesTrend?: number;
        // Цели
        revenueTarget?: number;
        profitTarget?: number;
    };
}

export const FinancialKPIGrid: React.FC<FinancialKPIGridProps> = ({ data }) => {
    const kpis = [
        {
            title: 'Общая выручка',
            value: data.revenue,
            subtitle: 'За отчетный период',
            trend: data.revenueTrend && data.revenueTrend > 0 ? 'up' as const : data.revenueTrend && data.revenueTrend < 0 ? 'down' as const : 'stable' as const,
            trendValue: data.revenueTrend,
            icon: <AttachMoney />,
            color: 'success' as const,
            progress: data.revenueTarget ? (data.revenue / data.revenueTarget) * 100 : undefined,
            target: data.revenueTarget,
        },
        {
            title: 'Чистая прибыль',
            value: data.netProfit,
            subtitle: 'После всех расходов',
            trend: data.profitTrend && data.profitTrend > 0 ? 'up' as const : data.profitTrend && data.profitTrend < 0 ? 'down' as const : 'stable' as const,
            trendValue: data.profitTrend,
            icon: <TrendingUp />,
            color: data.netProfit >= 0 ? 'success' as const : 'error' as const,
            progress: data.profitTarget ? (data.netProfit / data.profitTarget) * 100 : undefined,
            target: data.profitTarget,
        },
        {
            title: 'Общие расходы',
            value: data.expenses,
            subtitle: 'Операционные + прочие',
            trend: data.expensesTrend && data.expensesTrend > 0 ? 'down' as const : data.expensesTrend && data.expensesTrend < 0 ? 'up' as const : 'stable' as const,
            trendValue: data.expensesTrend ? -data.expensesTrend : undefined,
            icon: <TrendingDown />,
            color: 'error' as const,
        },
        {
            title: 'Валовая маржа',
            value: `${(data.grossMargin * 100).toFixed(1)}%`,
            subtitle: 'Эффективность продаж',
            icon: <PieChart />,
            color: data.grossMargin > 0.5 ? 'success' as const : data.grossMargin > 0.2 ? 'warning' as const : 'error' as const,
            progress: data.grossMargin * 100,
        },
        {
            title: 'Операционная маржа',
            value: `${(data.operatingMargin * 100).toFixed(1)}%`,
            subtitle: 'Операционная эффективность',
            icon: <Speed />,
            color: data.operatingMargin > 0.15 ? 'success' as const : data.operatingMargin > 0.05 ? 'warning' as const : 'error' as const,
            progress: Math.max(0, data.operatingMargin * 100),
        },
        {
            title: 'Чистая маржа',
            value: `${(data.netMargin * 100).toFixed(1)}%`,
            subtitle: 'Итоговая рентабельность',
            icon: <ShowChart />,
            color: data.netMargin > 0.1 ? 'success' as const : data.netMargin > 0 ? 'warning' as const : 'error' as const,
            progress: Math.max(0, data.netMargin * 100),
        },
        {
            title: 'ROA (рентабельность активов)',
            value: `${(data.roa * 100).toFixed(1)}%`,
            subtitle: 'Эффективность активов',
            icon: <AccountBalance />,
            color: data.roa > 0.05 ? 'success' as const : data.roa > 0 ? 'warning' as const : 'error' as const,
            progress: Math.max(0, data.roa * 100),
        },
        {
            title: 'ROE (рентабельность капитала)',
            value: `${(data.roe * 100).toFixed(1)}%`,
            subtitle: 'Доходность инвестиций',
            icon: <Timeline />,
            color: data.roe > 0.15 ? 'success' as const : data.roe > 0.05 ? 'warning' as const : 'error' as const,
            progress: Math.max(0, data.roe * 100),
        },
        {
            title: 'Коэффициент текущей ликвидности',
            value: data.currentRatio.toFixed(2),
            subtitle: 'Способность погасить долги',
            icon: <Speed />,
            color: data.currentRatio > 1.5 ? 'success' as const : data.currentRatio > 1 ? 'warning' as const : 'error' as const,
            progress: Math.min(100, (data.currentRatio / 2) * 100),
        },
        {
            title: 'Быстрая ликвидность',
            value: data.quickRatio.toFixed(2),
            subtitle: 'Мгновенная платежеспособность',
            icon: <Speed />,
            color: data.quickRatio > 1 ? 'success' as const : data.quickRatio > 0.7 ? 'warning' as const : 'error' as const,
            progress: Math.min(100, (data.quickRatio / 1.5) * 100),
        },
        {
            title: 'Долг к капиталу',
            value: data.debtToEquity.toFixed(2),
            subtitle: 'Финансовый леверидж',
            icon: <AccountBalance />,
            color: data.debtToEquity < 0.5 ? 'success' as const : data.debtToEquity < 1 ? 'warning' as const : 'error' as const,
            progress: Math.max(0, 100 - (data.debtToEquity * 50)),
        },
        {
            title: 'Денежный поток',
            value: data.cashFlow,
            subtitle: 'Операционный поток',
            icon: <Timeline />,
            color: data.cashFlow > 0 ? 'success' as const : 'error' as const,
        },
    ];

    return (
        <Grid container spacing={3}>
            {kpis.map((kpi, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Tooltip
                        title={`${kpi.title}: ${kpi.subtitle}`}
                        placement="top"
                        arrow
                    >
                        <div>
                            <KPICard {...kpi} />
                        </div>
                    </Tooltip>
                </Grid>
            ))}
        </Grid>
    );
};

export default FinancialKPIGrid;