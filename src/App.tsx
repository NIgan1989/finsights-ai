import React, { useCallback, useState } from 'react';
import {
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    ThemeProvider,
    Menu,
    MenuItem,
    Container,
    Button,
    Tab,
    Tabs,
    Grid,
    Paper
} from '@mui/material';
import { Language as LanguageIcon, PictureAsPdf, Dashboard as DashboardIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import DataUpload from './components/DataUpload';
import Dashboard from './components/Dashboard';
import AiAssistant from './components/AiAssistant';
import Loader from './components/Loader';
import DateRangeFilter from './components/DateRangeFilter';
import { Transaction, FinancialReport } from './types';
import { processAndCategorizeTransactions, generateFinancialReport } from './services/financeService';
import { generatePdf } from './services/pdfService';
import { darkTheme } from './theme';
import { DateRangeProvider } from './contexts/DateRangeContext';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const languageMap: { [key: string]: string } = {
        en: 'English',
        ru: 'Русский',
        kk: 'Қазақ',
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (lang?: string) => {
        setAnchorEl(null);
        if (lang && i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    };

    return (
        <div>
            <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
            >
                <LanguageIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
            >
                {Object.keys(languageMap).map((lang) => (
                    <MenuItem key={lang} onClick={() => handleClose(lang)} selected={i18n.language === lang}>
                        {languageMap[lang]}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
};

function App() {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
        start: '',
        end: ''
    });

    const handleDataUpload = async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setTransactions([]);
        try {
            const processedTransactions = await processAndCategorizeTransactions(file, (msg) => {
                setProgressMessage(msg);
            });
            setTransactions(processedTransactions);
            const report = generateFinancialReport(processedTransactions);
            setFinancialReport(report);
        } catch (err) {
            setError('Failed to process file. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
            setProgressMessage('');
        }
    };

    const handleUpdateTransaction = useCallback((originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => {
        setTransactions(prev => {
            if (applyToAll) {
                return prev.map(tx =>
                    tx.description === originalTx.description
                        ? { ...tx, ...updates }
                        : tx
                );
            } else {
                return prev.map(tx =>
                    tx.id === originalTx.id
                        ? { ...tx, ...updates }
                        : tx
                );
            }
        });
    }, []);

    const handleExportPdf = useCallback(async () => {
        if (financialReport) {
            try {
                await generatePdf(financialReport, t);
            } catch (err) {
                console.error('Failed to generate PDF', err);
                setError('Failed to generate PDF. Please try again.');
            }
        }
    }, [financialReport, t]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

    const renderContent = () => {
        if (isProcessing) {
            return <Loader message={progressMessage || "Analyzing your financial data..."} />;
        }

        const uploadComponent = (
            <Box sx={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <Box>
                    <DataUpload onUpload={handleDataUpload} />
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                </Box>
            </Box>
        );

        if (transactions.length === 0) {
            return uploadComponent;
        }

        return (
            <>
                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={9}>
                            <DateRangeFilter />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PictureAsPdf />}
                                    onClick={handleExportPdf}
                                    fullWidth
                                >
                                    {t('export_pdf')}
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab icon={<DashboardIcon />} label={t('dashboard.title')} value="dashboard" />
                    <Tab icon={<ChatIcon />} label={t('ai_assistant')} value="assistant" />
                </Tabs>

                {activeTab === 'dashboard' && <Dashboard transactions={transactions} onUpdateTransaction={handleUpdateTransaction} />}
                {activeTab === 'assistant' && financialReport && (
                    <AiAssistant
                        transactions={transactions}
                        report={financialReport}
                        dateRange={dateRange}
                        onBack={() => setActiveTab('dashboard')}
                    />
                )}
            </>
        );
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <DateRangeProvider>
                <CssBaseline />
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <AppBar position="sticky">
                        <Toolbar>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                Finsights AI
                            </Typography>
                            <LanguageSwitcher />
                        </Toolbar>
                    </AppBar>
                    <Container component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                        {renderContent()}
                    </Container>
                </Box>
            </DateRangeProvider>
        </ThemeProvider>
    );
}

export default App;