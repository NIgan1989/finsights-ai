import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend
} from 'recharts';
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Typography, Chip, Stack, Zoom } from '@mui/material';
import { formatCurrency } from '../utils/formatting';
import { aggregateDataByPeriod } from '../utils/finance';

interface CashFlowChartProps {
    data: { name: string; cashFlow: number }[];
    period?: 'monthly' | 'quarterly' | 'yearly';
}

type ProcessedData = {
    name: string;
    cashFlow: number;
    income?: number;
    expense?: number;
}[];

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, period = 'monthly' }) => {
    const theme = useTheme();
    const [processedData, setProcessedData] = useState<ProcessedData>(data);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Process data when period changes
    useEffect(() => {
        if (period !== 'monthly' && data.length > 3) {
            // Use type assertion to fix the type issue
            const aggregatedData = aggregateDataByPeriod(data, period) as ProcessedData;
            setProcessedData(aggregatedData);
        } else {
            setProcessedData(data);
        }
    }, [data, period]);

    // Calculate statistics
    const totalCashFlow = processedData.reduce((sum, item) => sum + item.cashFlow, 0);
    const positiveCashFlowMonths = processedData.filter(item => item.cashFlow > 0).length;
    const negativeCashFlowMonths = processedData.filter(item => item.cashFlow < 0).length;
    const averageCashFlow = processedData.length > 0
        ? totalCashFlow / processedData.length
        : 0;

    // Calculate growth
    const firstCashFlow = processedData[0]?.cashFlow || 0;
    const lastCashFlow = processedData[processedData.length - 1]?.cashFlow || 0;
    const cashFlowGrowth = firstCashFlow !== 0 && processedData.length > 1
        ? ((lastCashFlow - firstCashFlow) / Math.abs(firstCashFlow)) * 100
        : 0;

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const cashFlow = payload[0].value;
            const isPositive = cashFlow >= 0;

            return (
                <Zoom in={true}>
                    <Box
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            p: 2,
                            boxShadow: theme.shadows[8],
                            minWidth: 200,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                            {label}
                        </Typography>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Cash Flow:</Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 600,
                                        color: isPositive ? theme.palette.success.main : theme.palette.error.main
                                    }}
                                >
                                    {formatCurrency(cashFlow)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {isPositive ? 'Positive' : 'Negative'} cash flow for this period
                            </Typography>
                        </Stack>
                    </Box>
                </Zoom>
            );
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            {/* Summary Stats */}
            <Box sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                flexWrap: 'wrap',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 1,
                p: 1
            }}>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Cash Flow</Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: totalCashFlow >= 0 ? theme.palette.success.main : theme.palette.error.main
                        }}
                    >
                        {formatCurrency(totalCashFlow)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    <Typography variant="caption" color="text.secondary">Average Monthly</Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: averageCashFlow >= 0 ? theme.palette.success.main : theme.palette.error.main
                        }}
                    >
                        {formatCurrency(averageCashFlow)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    <Typography variant="caption" color="text.secondary">Growth</Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: cashFlowGrowth >= 0 ? theme.palette.success.main : theme.palette.error.main
                        }}
                    >
                        {cashFlowGrowth >= 0 ? '+' : ''}{cashFlowGrowth.toFixed(1)}%
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                    <Typography variant="caption" color="text.secondary">Positive/Negative</Typography>
                    <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                    >
                        <Box component="span" sx={{ color: theme.palette.success.main }}>{positiveCashFlowMonths}</Box>
                        <Box component="span" sx={{ mx: 0.5 }}>/</Box>
                        <Box component="span" sx={{ color: theme.palette.error.main }}>{negativeCashFlowMonths}</Box>
                    </Typography>
                </Box>
            </Box>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={processedData}
                    onMouseMove={(data) => {
                        if (data.activeTooltipIndex !== undefined) {
                            setActiveIndex(data.activeTooltipIndex);
                        }
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                >
                    <defs>
                        <linearGradient id="colorPositiveCashFlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNegativeCashFlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                        strokeOpacity={0.3}
                    />
                    <XAxis
                        dataKey="name"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis
                        stroke={theme.palette.text.secondary}
                        tickFormatter={(tick) => formatCurrency(tick as number)}
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: theme.palette.divider }}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            color: theme.palette.text.primary,
                            fontSize: '14px',
                            fontWeight: 500,
                            padding: '16px 0 0 0'
                        }}
                    />
                    <ReferenceLine
                        y={0}
                        stroke={theme.palette.divider}
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="cashFlow"
                        name="Cash Flow"
                        stroke={theme.palette.primary.main}
                        fillOpacity={0.5}
                        fill="url(#colorPositiveCashFlow)"
                        activeDot={{
                            r: 6,
                            stroke: theme.palette.background.paper,
                            strokeWidth: 2
                        }}
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Indicators */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Chip
                    label="Positive Cash Flow"
                    size="small"
                    sx={{
                        mr: 1,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        border: `1px solid ${theme.palette.success.main}`
                    }}
                />
                <Chip
                    label="Negative Cash Flow"
                    size="small"
                    sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        border: `1px solid ${theme.palette.error.main}`
                    }}
                />
            </Box>
        </Box>
    );
};

export default CashFlowChart; 