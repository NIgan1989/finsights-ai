import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

type ReportView = 'pnl' | 'cashflow' | 'balance';

interface ReportTabsProps {
    activeReport: ReportView;
    setActiveReport: (report: ReportView) => void;
}

const tabs: { id: ReportView; label: string }[] = [
    { id: 'pnl', label: 'ОПиУ' },
    { id: 'cashflow', label: 'ДДС' },
    { id: 'balance', label: 'Баланс' },
];

const ReportTabs: React.FC<ReportTabsProps> = ({ activeReport, setActiveReport }) => {

    const handleChange = (event: React.SyntheticEvent, newValue: ReportView) => {
        setActiveReport(newValue);
    };

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={activeReport}
                onChange={handleChange}
                aria-label="financial report tabs"
            >
                {tabs.map(tab => (
                    <Tab key={tab.id} label={tab.label} value={tab.id} />
                ))}
            </Tabs>
        </Box>
    );
};

export default ReportTabs;
