import React from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { formatCurrency } from '../utils/formatting';
import { useTranslation } from 'react-i18next';

interface FinancialStatementCardProps {
    summary: {
        totalIncome: number;
        totalExpense: number;
        netIncome: number;
    };
}

const FinancialStatementCard: React.FC<FinancialStatementCardProps> = ({ summary }) => {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader title="Financial Statement" />
            <CardContent>
                <Typography>{t('total_revenue')}: {formatCurrency(summary.totalIncome)}</Typography>
                <Typography>{t('total_expenses')}: {formatCurrency(summary.totalExpense)}</Typography>
                <Typography>{t('net_income')}: {formatCurrency(summary.netIncome)}</Typography>
            </CardContent>
        </Card>
    );
};

export default FinancialStatementCard;
