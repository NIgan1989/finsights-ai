import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  ShowChart,
  Assessment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getFinancialColor, getFinancialGradient } from '../../theme/designSystem';

export interface FinancialCardProps {
  title: string;
  value: number;
  previousValue?: number;
  currency?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  format?: 'currency' | 'percentage' | 'number';
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  showComparison?: boolean;
  progress?: number; // 0-100
  target?: number;
  onClick?: () => void;
  info?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'gradient' | 'minimal';
}

const MotionCard = motion(Card);

export const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  value,
  previousValue,
  currency = '₸',
  icon,
  subtitle,
  format = 'currency',
  loading = false,
  trend,
  showComparison = false,
  progress,
  target,
  onClick,
  info,
  size = 'medium',
  variant = 'default',
}) => {
  const theme = useTheme();

  // Форматирование значений
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'KZT',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('ru-RU').format(val);
      default:
        return val.toString();
    }
  };

  // Вычисление изменения
  const changeValue = previousValue ? value - previousValue : 0;
  const changePercentage = previousValue ? ((changeValue / Math.abs(previousValue)) * 100) : 0;
  
  // Определение тренда
  const determineTrend = (): 'up' | 'down' | 'neutral' => {
    if (trend) return trend;
    if (changeValue > 0) return 'up';
    if (changeValue < 0) return 'down';
    return 'neutral';
  };

  const currentTrend = determineTrend();
  const trendColor = getFinancialColor(changeValue, 'profit');

  // Размеры карточки
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 140, padding: 2 };
      case 'large':
        return { height: 200, padding: 3 };
      default:
        return { height: 160, padding: 2.5 };
    }
  };

  const sizeStyles = getSizeStyles();

  // Стили варианта
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          background: getFinancialGradient(value),
          color: 'white',
          '& .MuiTypography-root': { color: 'white' },
        };
      case 'minimal':
        return {
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  if (loading) {
    return (
      <Card sx={{ height: sizeStyles.height, ...variantStyles }}>
        <CardContent sx={{ p: sizeStyles.padding, height: '100%' }}>
          <Box display="flex" flexDirection="column" height="100%">
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 'auto' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionCard
      sx={{
        height: sizeStyles.height,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...variantStyles,
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {/* Фоновая анимация */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          transform: 'translateX(-100%)',
        }}
        animate={{
          transform: onClick ? 'translateX(100%)' : 'translateX(-100%)',
        }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
      />

      <CardContent sx={{ p: sizeStyles.padding, height: '100%', position: 'relative' }}>
        <Box display="flex" flexDirection="column" height="100%">
          {/* Заголовок с иконкой */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              {icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: variant === 'gradient' ? 'rgba(255,255,255,0.2)' : theme.palette.action.hover,
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography
                variant={size === 'small' ? 'body2' : 'body1'}
                color="textSecondary"
                fontWeight={500}
              >
                {title}
              </Typography>
            </Box>

            {info && (
              <Tooltip title={info} arrow>
                <IconButton size="small" sx={{ opacity: 0.7 }}>
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Основное значение */}
          <Box flex={1} display="flex" alignItems="center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <Typography
                variant={size === 'large' ? 'h3' : size === 'small' ? 'h5' : 'h4'}
                fontWeight={700}
                sx={{
                  fontFamily: 'Inter, monospace',
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums',
                  color: variant === 'gradient' ? 'white' : 'text.primary',
                }}
              >
                {formatValue(value)}
              </Typography>
            </motion.div>
          </Box>

          {/* Подзаголовок */}
          {subtitle && (
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}

          {/* Прогресс бар */}
          {progress !== undefined && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: variant === 'gradient' ? 'rgba(255,255,255,0.3)' : theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: variant === 'gradient' ? 'white' : theme.palette.primary.main,
                    borderRadius: 2,
                  },
                }}
              />
              {target && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                  {formatValue(value)} из {formatValue(target)}
                </Typography>
              )}
            </Box>
          )}

          {/* Сравнение с предыдущим периодом */}
          <AnimatePresence>
            {showComparison && previousValue && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Chip
                    icon={
                      currentTrend === 'up' ? (
                        <TrendingUp fontSize="small" />
                      ) : currentTrend === 'down' ? (
                        <TrendingDown fontSize="small" />
                      ) : (
                        <ShowChart fontSize="small" />
                      )
                    }
                    label={`${changePercentage >= 0 ? '+' : ''}${changePercentage.toFixed(1)}%`}
                    size="small"
                    sx={{
                      backgroundColor: variant === 'gradient' ? 'rgba(255,255,255,0.2)' : trendColor + '20',
                      color: variant === 'gradient' ? 'white' : trendColor,
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: variant === 'gradient' ? 'white' : trendColor,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: variant === 'gradient' ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                    }}
                  >
                    с пред. периодом
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </CardContent>
    </MotionCard>
  );
};