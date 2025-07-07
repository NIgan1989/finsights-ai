import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    Cell,
    ComposedChart,
    Area,
    AreaChart,
    Line,
    Label
} from 'recharts';
import {
    useTheme,
    Box,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Stack,
    alpha,
    Zoom
} from '@mui/material';
import {
    BarChart as BarChartIcon,
    ShowChart as LineChartIcon,
    Timeline as AreaChartIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatting';
import { aggregateDataByPeriod } from '../utils/finance';

interface IncomeExpenseChartProps {
    data: {
        name: string;
        income: number;
        expense: number;
        net?: number;
        period?: string;
    }[];
    title?: string;
    showNetProfit?: boolean;
    period?: 'monthly' | 'quarterly' | 'yearly';
}

type ChartType = 'bar' | 'area' | 'combo';

// Type for the processed data
type ProcessedData = {
    name: string;
    income: number;
    expense: number;
    net?: number;
    cashFlow?: number;
}[];

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
    data,
    title = "Income and Expenses",
    showNetProfit = true,
    period = 'monthly'
}) => {
    const theme = useTheme();
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [processedData, setProcessedData] = useState<ProcessedData>(data);

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

    // Calculate net profit if not provided
    const enrichedData = processedData.map(item => ({
        ...item,
        net: item.net ?? (item.income - item.expense)
    }));

    // Statistics
    const totalIncome = enrichedData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = enrichedData.reduce((sum, item) => sum + item.expense, 0);
    const totalNet = totalIncome - totalExpense;
    const averageIncome = totalIncome / enrichedData.length;
    const averageExpense = totalExpense / enrichedData.length;

    // Calculate growth rates
    const incomeGrowth = enrichedData.length > 1 ?
        ((enrichedData[enrichedData.length - 1].income / enrichedData[0].income) - 1) * 100 : 0;
    const expenseGrowth = enrichedData.length > 1 ?
        ((enrichedData[enrichedData.length - 1].expense / enrichedData[0].expense) - 1) * 100 : 0;
    const profitGrowth = enrichedData.length > 1 && enrichedData[0].net !== 0 ?
        ((enrichedData[enrichedData.length - 1].net / enrichedData[0].net) - 1) * 100 : 0;

    const handleChartTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
        if (newType) {
            setChartType(newType);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const netColor = data.net >= 0
                ? theme.palette.success.main
                : theme.palette.error.main;

            // Calculate percentage of income and expense
            const incomePercentage = totalIncome > 0
                ? ((data.income / totalIncome) * 100).toFixed(1)
                : '0';
            const expensePercentage = totalExpense > 0
                ? ((data.expense / totalExpense) * 100).toFixed(1)
                : '0';

            return (
                <Zoom in={true}>
                    <Box
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            p: 2,
                            boxShadow: theme.shadows[8],
                            minWidth: 240,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                            {label}
                        </Typography>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            backgroundColor: theme.palette.success.main,
                                            borderRadius: '50%',
                                        }}
                                    />
                                    <Typography variant="body2">Income:</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                        {formatCurrency(data.income)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {incomePercentage}% of total
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            backgroundColor: theme.palette.error.main,
                                            borderRadius: '50%',
                                        }}
                                    />
                                    <Typography variant="body2">Expenses:</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                                        {formatCurrency(data.expense)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {expensePercentage}% of total
                                    </Typography>
                                </Box>
                            </Box>
                            {showNetProfit && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pt: 1.5,
                                    mt: 0.5,
                                    borderTop: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Net Profit:
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: netColor
                                        }}
                                    >
                                        {formatCurrency(data.net)}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Zoom>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data: enrichedData,
            onMouseEnter: (_: any, index: number) => setActiveIndex(index),
            onMouseLeave: () => setActiveIndex(null),
        };

        switch (chartType) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} />
                        <XAxis
                            dataKey="name"
                            stroke={theme.palette.text.secondary}
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => formatCurrency(value as number)}
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                color: theme.palette.text.primary,
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stackId="1"
                            stroke={theme.palette.success.main}
                            fill="url(#incomeGradient)"
                            name="Income"
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 1, stroke: theme.palette.background.paper }}
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stackId="2"
                            stroke={theme.palette.error.main}
                            fill="url(#expenseGradient)"
                            name="Expenses"
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 1, stroke: theme.palette.background.paper }}
                        />
                        {showNetProfit && (
                            <Area
                                type="monotone"
                                dataKey="net"
                                stackId="3"
                                stroke={theme.palette.info.main}
                                fill="url(#netGradient)"
                                name="Net Profit"
                                strokeWidth={2}
                                activeDot={{ r: 6, strokeWidth: 1, stroke: theme.palette.background.paper }}
                            />
                        )}
                        {showNetProfit && averageIncome > 0 && (
                            <ReferenceLine
                                y={averageIncome}
                                stroke={theme.palette.info.main}
                                strokeDasharray="5 5"
                                label={{
                                    value: "Avg Income",
                                    position: "insideTopRight",
                                    fill: theme.palette.text.secondary
                                }}
                            />
                        )}
                    </AreaChart>
                );

            case 'combo':
                return (
                    <ComposedChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} />
                        <XAxis
                            dataKey="name"
                            stroke={theme.palette.text.secondary}
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => formatCurrency(value as number)}
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                color: theme.palette.text.primary,
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill={theme.palette.success.main}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {enrichedData.map((entry, index) => (
                                <Cell
                                    key={`income-${index}`}
                                    fill={activeIndex === index
                                        ? theme.palette.success.dark
                                        : alpha(theme.palette.success.main, 0.8)
                                    }
                                />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="expense"
                            name="Expenses"
                            fill={theme.palette.error.main}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {enrichedData.map((entry, index) => (
                                <Cell
                                    key={`expense-${index}`}
                                    fill={activeIndex === index
                                        ? theme.palette.error.dark
                                        : alpha(theme.palette.error.main, 0.8)
                                    }
                                />
                            ))}
                        </Bar>
                        {showNetProfit && (
                            <Line
                                type="monotone"
                                dataKey="net"
                                name="Net Profit"
                                stroke={theme.palette.info.main}
                                strokeWidth={2}
                                dot={{
                                    stroke: theme.palette.background.paper,
                                    strokeWidth: 1,
                                    r: 4,
                                    fill: theme.palette.info.main
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: theme.palette.background.paper,
                                    strokeWidth: 1,
                                    fill: theme.palette.info.main
                                }}
                            />
                        )}
                        {averageIncome > 0 && (
                            <ReferenceLine
                                y={averageIncome}
                                stroke={theme.palette.info.main}
                                strokeDasharray="5 5"
                                label={{
                                    value: "Avg Income",
                                    position: "insideTopRight",
                                    fill: theme.palette.text.secondary
                                }}
                            />
                        )}
                    </ComposedChart>
                );

            default:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} />
                        <XAxis
                            dataKey="name"
                            stroke={theme.palette.text.secondary}
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: theme.palette.divider }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => formatCurrency(value as number)}
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
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill={theme.palette.success.main}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {enrichedData.map((entry, index) => (
                                <Cell
                                    key={`income-${index}`}
                                    fill={activeIndex === index
                                        ? theme.palette.success.dark
                                        : alpha(theme.palette.success.main, 0.8)
                                    }
                                />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="expense"
                            name="Expenses"
                            fill={theme.palette.error.main}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {enrichedData.map((entry, index) => (
                                <Cell
                                    key={`expense-${index}`}
                                    fill={activeIndex === index
                                        ? theme.palette.error.dark
                                        : alpha(theme.palette.error.main, 0.8)
                                    }
                                />
                            ))}
                        </Bar>
                        {averageIncome > 0 && (
                            <ReferenceLine
                                y={averageIncome}
                                stroke={theme.palette.info.main}
                                strokeDasharray="5 5"
                                label={{
                                    value: "Avg Income",
                                    position: "insideTopRight",
                                    fill: theme.palette.text.secondary
                                }}
                            />
                        )}
                    </BarChart>
                );
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                            size="small"
                            label={`Total Income: ${formatCurrency(totalIncome)}`}
                            color="success"
                            variant="outlined"
                        />
                        <Chip
                            size="small"
                            label={`Total Expenses: ${formatCurrency(totalExpense)}`}
                            color="error"
                            variant="outlined"
                        />
                        {showNetProfit && (
                            <Chip
                                size="small"
                                label={`Net Profit: ${formatCurrency(totalNet)}`}
                                color={totalNet >= 0 ? 'success' : 'error'}
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={handleChartTypeChange}
                    size="small"
                >
                    <ToggleButton value="bar" aria-label="bar chart">
                        <BarChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="area" aria-label="area chart">
                        <AreaChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="combo" aria-label="combo chart">
                        <LineChartIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Chart Stats */}
            {processedData.length > 1 && (
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                    p: 1
                }}>
                    <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Income Growth</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: incomeGrowth >= 0 ? theme.palette.success.main : theme.palette.error.main
                            }}
                        >
                            {incomeGrowth >= 0 ? '+' : ''}{incomeGrowth.toFixed(1)}%
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Expense Growth</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: expenseGrowth <= 0 ? theme.palette.success.main : theme.palette.error.main
                            }}
                        >
                            {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}%
                        </Typography>
                    </Box>
                    {showNetProfit && (
                        <Box sx={{ textAlign: 'center', px: 2 }}>
                            <Typography variant="caption" color="text.secondary">Profit Growth</Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: profitGrowth >= 0 ? theme.palette.success.main : theme.palette.error.main
                                }}
                            >
                                {profitGrowth >= 0 ? '+' : ''}{profitGrowth.toFixed(1)}%
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Profit Margin</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: totalIncome > 0 && (totalNet / totalIncome) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                            }}
                        >
                            {totalIncome > 0 ? ((totalNet / totalIncome) * 100).toFixed(1) : '0'}%
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box sx={{ height: 'calc(100% - 100px)', width: '100%', minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default IncomeExpenseChart; 