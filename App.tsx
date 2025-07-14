
import React, { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { Transaction, FinancialReport, BusinessProfile, Theme } from './types.ts';
import Sidebar from './backend/components/Sidebar.tsx';
import DataUpload from './backend/components/DataUpload.tsx';
import TransactionsTable from './backend/components/TransactionsTable.tsx';
import AiAssistant from './backend/components/AiAssistant.tsx';
import Profile from './backend/components/Profile.tsx';
import Loader from './backend/components/Loader.tsx';
import DateRangeFilter from './backend/components/DateRangeFilter.tsx';
import { processAndCategorizeTransactions, generateFinancialReport } from './services/financeService.ts';
import { UserProvider, useUser } from './backend/components/UserContext';
import LandingPage from './backend/components/LandingPage';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PricingPage from './backend/components/PricingPage';


const Dashboard = lazy(() => import('./backend/components/Dashboard.tsx'));

type View = 'dashboard' | 'transactions' | 'ai_assistant' | 'profile';
type AppState = 'upload' | 'processing' | 'ready' | 'error';

const toYyyyMmDd = (date: Date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
}

const createNewProfile = (): BusinessProfile => ({
    id: `profile_${Date.now()}`,
    businessName: 'Новый Профиль',
    businessType: '',
    businessModel: '',
    typicalIncomeSources: '',
    typicalExpenseCategories: '',
    ownerName: '',
});

// PrivateRoute для защиты приватных страниц
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useUser();
  const location = useLocation();
  console.log('[RequireAuth] token:', token, 'loading:', loading, 'location:', location.pathname);
  if (loading) {
    return <Loader message="Проверка авторизации..." />;
  }
  if (!token) {
    console.log('[RequireAuth] Нет токена, редирект на /');
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  console.log('[RequireAuth] Авторизован, рендерим children');
  return <>{children}</>;
};

// Основной App
const App: React.FC = () => {
    const [allTransactions, setAllTransactions] = useState<Transaction[] | null>(null);
    const [allProfiles, setAllProfiles] = useState<BusinessProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [appState, setAppState] = useState<AppState>('processing');
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Загрузка приложения...");
    const [theme, setTheme] = useState<Theme>('light');
    const { token, email } = useUser();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

    const activeProfile = useMemo(() => {
        return allProfiles.find(p => p.id === activeProfileId) || null;
    }, [allProfiles, activeProfileId]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    useEffect(() => {
        // --- Load Profiles ---
        let profiles: BusinessProfile[] = [];
        let savedActiveId: string | null = null;
        try {
            const savedProfiles = localStorage.getItem('businessProfiles');
            if (savedProfiles) {
                profiles = JSON.parse(savedProfiles);
            }
        } catch (e) {
            console.error("Failed to load profiles, resetting.", e);
            localStorage.removeItem('businessProfiles');
        }

        if (profiles.length === 0) {
            profiles = [createNewProfile()];
        }
        setAllProfiles(profiles);

        // --- Load Active Profile ID ---
        savedActiveId = localStorage.getItem('activeProfileId');
        if (savedActiveId && profiles.some(p => p.id === savedActiveId)) {
            setActiveProfileId(savedActiveId);
        } else {
            setActiveProfileId(profiles[0].id);
        }

        // --- Load Transactions ---
        try {
            const savedTransactions = localStorage.getItem('transactions');
            if (savedTransactions) {
                const parsed = JSON.parse(savedTransactions) as Transaction[];
                setAllTransactions(parsed);

                if (parsed.length > 0) {
                    const dates = parsed.map(tx => new Date(tx.date).getTime());
                    setDateRange({ start: toYyyyMmDd(new Date(Math.min(...dates))), end: toYyyyMmDd(new Date(Math.max(...dates))) });
                }
                setActiveView('dashboard');
                setAppState('ready');
            } else {
                setActiveView('profile');
                setAppState('upload');
            }
        } catch (e) {
            console.error("Failed to load transactions, resetting.", e);
            localStorage.removeItem('transactions');
            setAllTransactions(null);
            setDateRange(null);
            setActiveView('profile');
            setAppState('upload');
        }
    }, []);

    useEffect(() => {
        console.log('[App] token:', token, 'email:', email, 'allProfiles:', allProfiles, 'allTransactions:', allTransactions);
    }, [token, email, allProfiles, allTransactions]);

    useEffect(() => {
        // Если пользователь авторизован, но нет профиля — создать дефолтный профиль
        if (token && email && allProfiles.length === 0) {
            const newProfile = createNewProfile();
            setAllProfiles([newProfile]);
            setActiveProfileId(newProfile.id);
            localStorage.setItem('businessProfiles', JSON.stringify([newProfile]));
            localStorage.setItem('activeProfileId', newProfile.id);
        }
    }, [token, email, allProfiles.length]);

    const handleFileProcess = async (file: File) => {
        setAppState('processing');
        setError(null);

        try {
            const profileToUse = activeProfile && activeProfile.businessName ? activeProfile : null;
            const processedTransactions = await processAndCategorizeTransactions(file, profileToUse, setLoadingMessage);

            if (processedTransactions.length === 0) {
                setError('Не удалось найти транзакции в файле. Проверьте формат документа или его содержимое.');
                setAppState('error');
                return;
            }
            const sorted = processedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setAllTransactions(sorted);
            localStorage.setItem('transactions', JSON.stringify(sorted));

            if (sorted.length > 0) {
                const dates = sorted.map(tx => new Date(tx.date).getTime());
                setDateRange({ start: toYyyyMmDd(new Date(Math.min(...dates))), end: toYyyyMmDd(new Date(Math.max(...dates))) });
            }

            setActiveView('dashboard');
            setAppState('ready');
        } catch (e: any) {
            console.error("Error processing file:", e);
            setError(e.message || 'Произошла неизвестная ошибка при обработке файла.');
            setAppState('error');
        }
    };

    const handleSaveProfile = (profileData: BusinessProfile | Omit<BusinessProfile, 'id'>) => {
        let updatedProfiles: BusinessProfile[];
        let savedProfile: BusinessProfile;

        if ('id' in profileData && allProfiles.some(p => p.id === profileData.id)) { // Update existing
            savedProfile = profileData;
            updatedProfiles = allProfiles.map(p => p.id === profileData.id ? profileData : p);
        } else { // Create new
            const newId = ('id' in profileData) ? profileData.id : `profile_${Date.now()}`;
            savedProfile = { ...profileData, id: newId };
            // Check if we are replacing a placeholder or adding new
            const existingIndex = allProfiles.findIndex(p => p.id === savedProfile.id);
            if (existingIndex > -1) {
                updatedProfiles = allProfiles.map(p => p.id === savedProfile.id ? savedProfile : p);
            } else {
                updatedProfiles = [...allProfiles, savedProfile];
            }
        }

        setAllProfiles(updatedProfiles);
        setActiveProfileId(savedProfile.id);
        localStorage.setItem('businessProfiles', JSON.stringify(updatedProfiles));
        localStorage.setItem('activeProfileId', savedProfile.id);

        if (appState === 'upload' && activeView === 'profile') {
            setActiveView('dashboard'); // Move to upload screen after saving first profile
        }
    };

    const handleSwitchProfile = (profileId: string) => {
        setActiveProfileId(profileId);
        localStorage.setItem('activeProfileId', profileId);
    };

    const handleNewProfile = () => {
        const newProfile = createNewProfile();
        setAllProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);
    };

    const handleDeleteProfile = (profileId: string) => {
        if (allProfiles.length <= 1) {
            alert("Нельзя удалить единственный профиль.");
            return;
        }
        const updatedProfiles = allProfiles.filter(p => p.id !== profileId);
        setAllProfiles(updatedProfiles);
        localStorage.setItem('businessProfiles', JSON.stringify(updatedProfiles));

        if (activeProfileId === profileId) {
            const newActiveId = updatedProfiles[0].id;
            setActiveProfileId(newActiveId);
            localStorage.setItem('activeProfileId', newActiveId);
        }
    };


    const handleUpdateTransaction = useCallback((originalTx: Transaction, updates: Partial<Pick<Transaction, 'description' | 'category' | 'counterparty'>>, applyToAll: boolean) => {
        setAllTransactions(prev => {
            if (!prev) return null;
            let updated: Transaction[];
            if (applyToAll) {
                updated = prev.map(tx => tx.description === originalTx.description ? { ...tx, ...updates, needsClarification: false } : tx);
            } else {
                updated = prev.map(tx => tx.id === originalTx.id ? { ...tx, ...updates, needsClarification: false } : tx);
            }
            localStorage.setItem('transactions', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const handleAddTransaction = useCallback((tx: Transaction) => {
        setAllTransactions(prev => {
            const updated = prev ? [...prev, tx] : [tx];
            localStorage.setItem('transactions', JSON.stringify(updated));
            return updated;
        });
        setDateRange(prev => {
            if (!prev) return { start: tx.date, end: tx.date };
            const min = prev.start < tx.date ? prev.start : tx.date;
            const max = prev.end > tx.date ? prev.end : tx.date;
            return { start: min, end: max };
        });
    }, []);


    const handleResetData = () => {
        setAllTransactions(null);
        setDateRange(null);
        localStorage.removeItem('transactions');
        setActiveView('profile');
        setAppState('upload');
    };

    const openUploadModal = () => {
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setShowReplaceConfirm(false); // Close confirmation modal if open
    };

    const confirmReplace = () => {
        setShowReplaceConfirm(false);
        setIsUploadModalOpen(true);
    };

    const filteredTransactions = useMemo<Transaction[] | null>(() => {
        if (!allTransactions || !dateRange) return null;
        try {
            const start = new Date(dateRange.start); start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.end); end.setHours(23, 59, 59, 999);
            const txs = allTransactions.filter(tx => {
                const txTime = new Date(tx.date).getTime();
                return txTime >= start.getTime() && txTime <= end.getTime();
            });
            return txs;
        } catch (e) {
            console.error("Date filtering error", e);
            return allTransactions;
        }
    }, [allTransactions, dateRange]);

    const financialReport = useMemo<FinancialReport | null>(() => {
        if (filteredTransactions && filteredTransactions.length > 0) {
            return generateFinancialReport(filteredTransactions);
        }
        return null;
    }, [filteredTransactions]);

    const dateBounds = useMemo(() => {
        if (!allTransactions || allTransactions.length === 0) return null;
        const dates = allTransactions.map(tx => new Date(tx.date).getTime());
        return { min: toYyyyMmDd(new Date(Math.min(...dates))), max: toYyyyMmDd(new Date(Math.max(...dates))) }
    }, [allTransactions]);

    const renderContent = () => {
        switch (appState) {
            case 'processing':
                return <Loader message={loadingMessage} />;
            case 'upload':
                return (
                    <div className="flex h-screen bg-background text-text-primary">
                        <Sidebar activeView={activeView} setActiveView={setActiveView} hasData={false} onResetData={openUploadModal} theme={theme} onToggleTheme={toggleTheme} />
                        <main className="flex-1 overflow-y-auto">
                            {activeView === 'profile' ? (
                                <Profile
                                    key={activeProfile?.id || 'new'}
                                    allProfiles={allProfiles}
                                    activeProfile={activeProfile}
                                    onSave={handleSaveProfile}
                                    onSwitch={handleSwitchProfile}
                                    onDelete={handleDeleteProfile}
                                    onNew={handleNewProfile}
                                />
                            ) : (
                                <DataUpload onFileUploaded={(file) => handleFileProcess(file)} isProcessing={false} />
                            )}
                        </main>
                    </div>
                );
            case 'error':
                return <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                    <p className="text-destructive text-xl mb-4">{error}</p>
                    <button onClick={handleResetData} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover">Попробовать снова</button>
                </div>;
            case 'ready':
                const mainContent = () => {
                    if (activeView === 'profile') {
                        return <Profile
                            key={activeProfile?.id || 'new'}
                            allProfiles={allProfiles}
                            activeProfile={activeProfile}
                            onSave={handleSaveProfile}
                            onSwitch={handleSwitchProfile}
                            onDelete={handleDeleteProfile}
                            onNew={handleNewProfile}
                        />;
                    }

                    if (!filteredTransactions || !financialReport || !dateRange) {
                        return (
                            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                                <p className="text-text-secondary text-lg">Нет данных за выбранный период.</p>
                                <p className="text-text-secondary text-md">Пожалуйста, проверьте фильтр дат или загрузите новый файл.</p>
                            </div>
                        );
                    }

                    switch (activeView) {
                        case 'dashboard':
                            return (
                                <Suspense fallback={<Loader message="Загрузка дашборда..." />}>
                                    <Dashboard report={financialReport} dateRange={dateRange} transactions={filteredTransactions} profile={activeProfile} theme={theme} />
                                </Suspense>
                            );
                        case 'transactions':
                            return <TransactionsTable transactions={filteredTransactions} onUpdateTransaction={handleUpdateTransaction} onAddTransaction={handleAddTransaction} theme={theme} />;
                        case 'ai_assistant':
                            return <AiAssistant transactions={filteredTransactions} report={financialReport} dateRange={dateRange} profile={activeProfile} />;
                        default:
                            return (
                                <Suspense fallback={<Loader message="Загрузка дашборда..." />}>
                                    <Dashboard report={financialReport} dateRange={dateRange} transactions={filteredTransactions} profile={activeProfile} theme={theme} />
                                </Suspense>
                            );
                    }
                };

                if (!allTransactions && activeView !== 'profile') {
                    return (
                        <div className="flex h-screen bg-background text-text-primary">
                            <Sidebar activeView={activeView} setActiveView={setActiveView} hasData={false} onResetData={openUploadModal} theme={theme} onToggleTheme={toggleTheme} />
                            <main className="flex-1 overflow-y-auto">
                                <DataUpload onFileUploaded={(file) => handleFileProcess(file)} isProcessing={false} />
                            </main>
                        </div>
                    );
                }

                return (
                    <div className="flex h-screen bg-background text-text-primary">
                        <Sidebar activeView={activeView} setActiveView={setActiveView} hasData={!!allTransactions} onResetData={openUploadModal} theme={theme} onToggleTheme={toggleTheme} />
                        <main className="flex-1 overflow-y-auto flex flex-col">
                            {dateRange && dateBounds && activeView !== 'profile' && (
                                <DateRangeFilter
                                    startDate={dateRange.start}
                                    endDate={dateRange.end}
                                    minDate={dateBounds.min}
                                    maxDate={dateBounds.max}
                                    onDateChange={(start, end) => setDateRange({ start, end })}
                                    theme={theme}
                                />
                            )}
                            <div className="flex-grow">
                                {mainContent()}
                            </div>
                        </main>
                    </div>
                );
            default:
                return null;
        }
    };

    // Модальное окно подтверждения замены
    const ReplaceConfirmModal = () => (
        showReplaceConfirm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-4 text-text-primary">Заменить данные?</h2>
                    <p className="mb-6 text-text-secondary">Текущие транзакции и дашборд будут заменены новым файлом. Продолжить?</p>
                    <div className="flex gap-4 justify-center">
                        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={confirmReplace}>Заменить</button>
                        <button className="px-4 py-2 rounded-lg bg-surface-accent text-text-primary border border-border" onClick={closeUploadModal}>Отмена</button>
                    </div>
                </div>
            </div>
        ) : null
    );

    // Модальное окно загрузки файла
    const UploadModal = () => (
        isUploadModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-xl w-full relative">
                    <button className="absolute top-4 right-4 text-2xl text-text-secondary hover:text-text-primary" onClick={closeUploadModal}>&times;</button>
                    <DataUpload
                        onFileUploaded={async (file) => {
                            await handleFileProcess(file);
                            closeUploadModal();
                        }}
                        isProcessing={appState === 'processing'}
                    />
                </div>
            </div>
        ) : null
    );

    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/dashboard" element={
                        <RequireAuth>
                            {/* Здесь основной функционал приложения: дашборд, профиль и т.д. */}
                            {renderContent()}
                            <ReplaceConfirmModal />
                            <UploadModal />
                        </RequireAuth>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
