import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';

interface ChartCardProps {
    title: string;
    children: ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
    return (
        <Card>
            <CardHeader title={title} />
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
};

export default ChartCard;