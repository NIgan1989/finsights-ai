import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  ButtonGroup,
  Button,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Fullscreen,
  Download,
  Refresh,
  ZoomIn,
  ZoomOut,
  Timeline,
  BarChart,
  PieChart,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ReferenceLine,
} from 'recharts';
// import { motion } from 'framer-motion';
import { colors, getFinancialColor } from '../../theme/designSystem';

export interface ChartDataPoint {
  name: string;
  value: number;
  previousValue?: number;
  category?: string;
  date?: string;
  [key: string]: any;
}

export interface AdvancedChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'bar' | 'pie' | 'combo';
  height?: number;
  currency?: string;
  showComparison?: boolean;
  showTrend?: boolean;
  allowFullscreen?: boolean;
  allowExport?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  customColors?: string[];
  showZoom?: boolean;
  showPeriodSelector?: boolean;
  periods?: Array<{ label: string; value: string; active?: boolean }>;
  onPeriodChange?: (period: string) => void;
}

// Временно используем обычный Card вместо motion
const MotionCard = Card;

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  title,
  subtitle,
  data,
  type,
  height = 400,
  currency = '₸',
  showComparison = false,
  showTrend = true,
  allowFullscreen = true,
  allowExport = true,
  loading = false,
  onRefresh,
  onExport,
  customColors,
  showZoom = true,
  showPeriodSelector = false,
  periods = [],
  onPeriodChange,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [chartType, setChartType] = useState(type);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Цвета для графиков
  const chartColors = customColors || [
    colors.financial.revenue,
    colors.financial.expense,
    colors.financial.profit,
    colors.primary[600],
    colors.financial.warning,
    colors.financial.info,
  ];

  // Обработка данных для разных типов графиков
  const processedData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: chartColors[index % chartColors.length],
      stroke: chartColors[index % chartColors.length],
    }));
  }, [data, chartColors]);

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1.5, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                }}
              />
              <Typography variant="body2">
                {entry.name}: {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'KZT',
                  minimumFractionDigits: 0,
                }).format(entry.value)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Рендеринг графика
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.financial.revenue} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.financial.revenue} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickFormatter={(value) => new Intl.NumberFormat('ru-RU', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.financial.revenue}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previousValue"
                stroke={colors.financial.expense}
                fillOpacity={0.3}
                fill={colors.financial.expense}
                strokeDasharray="5 5"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickFormatter={(value) => new Intl.NumberFormat('ru-RU', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={colors.financial.revenue}
              radius={[4, 4, 0, 0]}
            />
            {showComparison && (
              <Bar 
                dataKey="previousValue" 
                fill={colors.financial.expense}
                radius={[4, 4, 0, 0]}
                opacity={0.7}
              />
            )}
          </RechartsBarChart>
        );

      case 'pie':
        return (
          <RechartsPieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(height * 0.3, 120)}
              fill="#8884d8"
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
          </RechartsPieChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickFormatter={(value) => new Intl.NumberFormat('ru-RU', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(value)}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.financial.revenue}
              strokeWidth={3}
              dot={{ fill: colors.financial.revenue, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors.financial.revenue, strokeWidth: 2 }}
            />
            {showComparison && (
              <Line
                type="monotone"
                dataKey="previousValue"
                stroke={colors.financial.expense}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: colors.financial.expense, strokeWidth: 2, r: 3 }}
              />
            )}
            {showTrend && data.length > 1 && (
              <ReferenceLine 
                segment={[
                  { x: data[0].name, y: data[0].value },
                  { x: data[data.length - 1].name, y: data[data.length - 1].value }
                ]}
                stroke={colors.financial.neutral}
                strokeDasharray="2 2"
              />
            )}
          </LineChart>
        );
    }
  };

  // Обработчики
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    onExport?.(format);
    handleMenuClose();
  };

  const handleChartTypeChange = (newType: typeof chartType) => {
    setChartType(newType);
  };

  return (
    <MotionCard
      sx={{
        height: isFullscreen ? '100vh' : 'auto',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 1300 : 'auto',
      }}
    >
      <CardContent>
        {/* Заголовок и контролы */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* Селектор периода */}
            {showPeriodSelector && periods.length > 0 && (
              <ButtonGroup size="small" variant="outlined">
                {periods.map((period) => (
                  <Button
                    key={period.value}
                    variant={period.active ? 'contained' : 'outlined'}
                    onClick={() => onPeriodChange?.(period.value)}
                    size="small"
                  >
                    {period.label}
                  </Button>
                ))}
              </ButtonGroup>
            )}

            {/* Типы графиков */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Линейный график">
                <IconButton
                  size="small"
                  color={chartType === 'line' ? 'primary' : 'default'}
                  onClick={() => handleChartTypeChange('line')}
                >
                  <Timeline fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Столбчатый график">
                <IconButton
                  size="small"
                  color={chartType === 'bar' ? 'primary' : 'default'}
                  onClick={() => handleChartTypeChange('bar')}
                >
                  <BarChart fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Круговая диаграмма">
                <IconButton
                  size="small"
                  color={chartType === 'pie' ? 'primary' : 'default'}
                  onClick={() => handleChartTypeChange('pie')}
                >
                  <PieChart fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            {/* Зум контролы */}
            {showZoom && chartType !== 'pie' && (
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Увеличить">
                  <IconButton
                    size="small"
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                  >
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Уменьшить">
                  <IconButton
                    size="small"
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                  >
                    <ZoomOut fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            )}

            {/* Меню действий */}
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Статистики */}
        {data.length > 0 && (
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <Chip
              label={`Макс: ${new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'KZT',
                notation: 'compact',
              }).format(Math.max(...data.map(d => d.value)))}`}
              size="small"
              color="success"
            />
            <Chip
              label={`Мин: ${new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'KZT',
                notation: 'compact',
              }).format(Math.min(...data.map(d => d.value)))}`}
              size="small"
              color="error"
            />
            <Chip
              label={`Среднее: ${new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'KZT',
                notation: 'compact',
              }).format(data.reduce((sum, d) => sum + d.value, 0) / data.length)}`}
              size="small"
              color="primary"
            />
          </Box>
        )}

        {/* График */}
        <Box sx={{ height, transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </Box>

        {/* Меню действий */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {onRefresh && (
            <MenuItem onClick={() => { onRefresh(); handleMenuClose(); }}>
              <Refresh sx={{ mr: 1 }} fontSize="small" />
              Обновить
            </MenuItem>
          )}
          {allowFullscreen && (
            <MenuItem onClick={() => { setIsFullscreen(!isFullscreen); handleMenuClose(); }}>
              <Fullscreen sx={{ mr: 1 }} fontSize="small" />
              {isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            </MenuItem>
          )}
          {allowExport && (
            <>
              <MenuItem onClick={() => handleExport('png')}>
                <Download sx={{ mr: 1 }} fontSize="small" />
                Экспорт PNG
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <Download sx={{ mr: 1 }} fontSize="small" />
                Экспорт PDF
              </MenuItem>
              <MenuItem onClick={() => handleExport('csv')}>
                <Download sx={{ mr: 1 }} fontSize="small" />
                Экспорт CSV
              </MenuItem>
            </>
          )}
        </Menu>
      </CardContent>
    </MotionCard>
  );
};