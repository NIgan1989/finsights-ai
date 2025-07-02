import React, { useState } from 'react';
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
    AreaChart
} from 'recharts';
import { 
    useTheme, 
    Box, 
    Typography, 
    ToggleButton, 
    ToggleButtonGroup,
    Chip,
    Stack
} from '@mui/material';
import { 
    BarChart as BarChartIcon, 
    ShowChart as LineChartIcon,
    Timeline as AreaChartIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatting';

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
}

type ChartType = 'bar' | 'area' | 'combo';

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ 
    data, 
    title = "Доходы и Расходы",
    showNetProfit = true 
}) => {
    const theme = useTheme();
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Рассчитываем чистую прибыль если не передана
    const enrichedData = data.map(item => ({
        ...item,
        net: item.net ?? (item.income - item.expense)
    }));

    // Статистика
    const totalIncome = enrichedData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = enrichedData.reduce((sum, item) => sum + item.expense, 0);
    const totalNet = totalIncome - totalExpense;
    const averageIncome = totalIncome / enrichedData.length;
    const averageExpense = totalExpense / enrichedData.length;

    const handleChartTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
        if (newType) {
            setChartType(newType);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Box
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.primary.main}`,
                        borderRadius: 2,
                        p: 2,
                        boxShadow: theme.shadows[8],
                        minWidth: 200,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {label}
                    </Typography>
                    <Stack spacing={1}>
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
                                <Typography variant="body2">Доходы:</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                {formatCurrency(data.income)}
                            </Typography>
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
                                <Typography variant="body2">Расходы:</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                                {formatCurrency(data.expense)}
                            </Typography>
                        </Box>
                        {showNetProfit && (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                pt: 1,
                                borderTop: `1px solid ${theme.palette.divider}`
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Чистая прибыль:
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: data.net >= 0 ? theme.palette.success.main : theme.palette.error.main 
                                    }}
                                >
                                    {formatCurrency(data.net)}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
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
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="name" 
                            stroke={theme.palette.text.secondary}
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis 
                            stroke={theme.palette.text.secondary} 
                            tickFormatter={(value) => formatCurrency(value as number)}
                            fontSize={12}
                            tickLine={false}
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
                            name="Доходы"
                            strokeWidth={2}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expense" 
                            stackId="2"
                            stroke={theme.palette.error.main} 
                            fill="url(#expenseGradient)"
                            name="Расходы"
                            strokeWidth={2}
                        />
                        {showNetProfit && averageIncome > 0 && (
                            <ReferenceLine 
                                y={averageIncome} 
                                stroke={theme.palette.info.main} 
                                strokeDasharray="5 5"
                                label={{ value: "Средний доход", position: "insideTopRight" }}
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
                        />
                        <YAxis 
                            stroke={theme.palette.text.secondary} 
                            tickFormatter={(value) => formatCurrency(value as number)}
                            fontSize={12}
                            tickLine={false}
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
                            fill={theme.palette.success.main} 
                            name="Доходы" 
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                        <Bar 
                            dataKey="expense" 
                            fill={theme.palette.error.main} 
                            name="Расходы" 
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="net" 
                            stroke={theme.palette.primary.main} 
                            fill={theme.palette.primary.main}
                            fillOpacity={0.1}
                            name="Чистая прибыль"
                            strokeWidth={3}
                        />
                    </ComposedChart>
                );

            default: // 'bar'
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="name" 
                            stroke={theme.palette.text.secondary}
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis 
                            stroke={theme.palette.text.secondary} 
                            tickFormatter={(value) => formatCurrency(value as number)}
                            fontSize={12}
                            tickLine={false}
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
                            name="Доходы" 
                            radius={[4, 4, 0, 0]}
                        >
                            {enrichedData.map((_, index) => (
                                <Cell 
                                    key={`income-cell-${index}`} 
                                    fill={activeIndex === index 
                                        ? theme.palette.success.light 
                                        : theme.palette.success.main
                                    }
                                    stroke={activeIndex === index ? theme.palette.success.dark : 'none'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                        <Bar 
                            dataKey="expense" 
                            name="Расходы" 
                            radius={[4, 4, 0, 0]}
                        >
                            {enrichedData.map((_, index) => (
                                <Cell 
                                    key={`expense-cell-${index}`} 
                                    fill={activeIndex === index 
                                        ? theme.palette.error.light 
                                        : theme.palette.error.main
                                    }
                                    stroke={activeIndex === index ? theme.palette.error.dark : 'none'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                        {showNetProfit && (
                            <ReferenceLine 
                                y={0} 
                                stroke={theme.palette.text.secondary} 
                                strokeDasharray="2 2"
                                strokeOpacity={0.5}
                            />
                        )}
                    </BarChart>
                );
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Controls */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip 
                            label={`Прибыль: ${formatCurrency(totalNet)}`}
                            color={totalNet >= 0 ? "success" : "error"}
                            variant="outlined"
                            size="small"
                        />
                        <Chip 
                            label={`${enrichedData.length} периодов`}
                            variant="outlined"
                            size="small"
                        />
                    </Stack>
                </Box>
                
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={handleChartTypeChange}
                    size="small"
                >
                    <ToggleButton value="bar">
                        <BarChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="area">
                        <AreaChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="combo">
                        <LineChartIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Chart */}
            <Box sx={{ flex: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: 2, 
                mt: 2,
                p: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Общий доход
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                        {formatCurrency(totalIncome)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Общие расходы
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                        {formatCurrency(totalExpense)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Средний доход
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatCurrency(averageIncome)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Рентабельность
                    </Typography>
                    <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: totalNet >= 0 ? theme.palette.success.main : theme.palette.error.main 
                    }}>
                        {totalIncome > 0 ? `${((totalNet / totalIncome) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default IncomeExpenseChart; 