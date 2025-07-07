import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material';

export interface StatCardProps {
  title: string;
  value: string;
  type: 'revenue' | 'expense' | 'net';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, type, icon }) => {
  const getIcon = () => {
    const iconStyle = { fontSize: 40, color: 'primary.main' };

    if (icon) {
      return icon;
    }

    switch (type) {
      case 'revenue':
        return <TrendingUp sx={iconStyle} />;
      case 'expense':
        return <TrendingDown sx={{ ...iconStyle, color: 'secondary.main' }} />;
      case 'net':
        return <AccountBalanceWallet sx={{ ...iconStyle, color: value.startsWith('-') ? 'secondary.main' : 'primary.main' }} />;
      default:
        return null;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="700">
              {value}
            </Typography>
          </Box>
          <Box sx={{
            backgroundColor: type === 'expense' ? 'rgba(255, 105, 180, 0.1)' : 'rgba(0, 191, 255, 0.1)',
            borderRadius: '50%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {getIcon()}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
