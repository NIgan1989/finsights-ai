
import React, { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { Transaction, FinancialReport, BusinessProfile, Theme, View } from './types';
import Sidebar from './backend/components/Sidebar';
import DataUpload from './backend/components/DataUpload';
import TransactionsTable from './backend/components/TransactionsTable';
import AiAssistant from './backend/components/AiAssistant';
import Profile from './backend/components/Profile';
import Loader from './backend/components/Loader';
import DateRangeFilter from './backend/components/DateRangeFilter';
import { processAndCategorizeTransactions, generateFinancialReport } from './services/financeService';
import { UserProvider, useUser, useUserState, useUserActions } from './backend/components/UserContext';
import { ThemeProvider } from './backend/components/ThemeProvider';

import LandingPage from './backend/components/LandingPage';
import { formatLocalDate, parseLocalDate, getCurrentLocalDate } from './utils/dateUtils';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PricingPage from './backend/components/PricingPage';
import FinancialPage from './backend/components/FinancialPage';
import AdminPanel from './backend/components/AdminPanel';
import { AuthDebug } from './backend/components/AuthDebug';

// Компонент для логирования навигации (только в dev режиме)
const NavigationLogger: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Navigation] Page changed to:', location.pathname);
    }
  }, [location]);
  
  return null;
};

// PrivateRoute для защиты приватных страниц
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useUser();
  const location = useLocation();
  
  if (loading) {
    return <Loader message="Проверка авторизации..." />;
  }
  
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Основной контент приложения
const AppContent: React.FC = () => {
    const [allTransactions, setAllTransactions] = useState<Transaction[] | null>(null);
    const [currentReport, setCurrentReport] = useState<FinancialReport | null>(null);
    const [allProfiles, setAllProfiles] = useState<BusinessProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [appState, setAppState] = useState<AppState>('processing');
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Загрузка приложения...");
    const { token, email } = useUserState();
    const { loadUserData, saveUserData } = useUserActions();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);

    const activeProfile = useMemo(() => {
        return allProfiles.find(p => p.id === activeProfileId) || null;
    }, [allProfiles, activeProfileId]);

    // Функция для добавления новой транзакции
    const handleAddTransaction = useCallback((tx: Transaction) => {
        const newTransactions = [...(allTransactions || []), tx];
        setAllTransactions(newTransactions);
        
        // Обновляем отчет с новыми данными
        const newReport = generateFinancialReport(newTransactions);
        setCurrentReport(newReport);
        
        // Сохраняем данные пользователя
        saveUserData('transactions', newTransactions);
    }, [allTransactions, saveUserData]);

    type AppState = 'processing' | 'dashboard';

    // Эффект для загрузки пользовательских данных при авторизации
    useEffect(() => {
        // Загружаем данные только если пользователь авторизован
        if (!token || token === null || typeof token !== 'string' || token === 'null') {
            // Если пользователь не авторизован, показываем дашборд с пустыми данными
            setAppState('dashboard');
            setAllTransactions([]);
            setCurrentReport(null);
            return;
        }
        
        const loadAppData = async () => {
            setAppState('processing');
            setLoadingMessage('Загрузка данных пользователя...');
            
            try {
                const profiles = await loadUserData('businessProfiles');
                const transactions = await loadUserData('transactions');
                const savedActiveProfileId = await loadUserData('activeProfileId');
                
                // Обновляем состояние
                if (profiles && Array.isArray(profiles) && profiles.length > 0) {
                    setAllProfiles(profiles);
                    if (savedActiveProfileId && profiles.find(p => p.id === savedActiveProfileId)) {
                        setActiveProfileId(savedActiveProfileId);
                    } else {
                        setActiveProfileId(profiles[0].id);
                    }
                }
                
                if (transactions && Array.isArray(transactions) && transactions.length > 0) {
                    setAllTransactions(transactions);
                    
                    // Генерируем отчет для загруженных данных
                    const report = generateFinancialReport(transactions);
                    setCurrentReport(report);
                    setAppState('dashboard');
                } else {
                    setAllTransactions([]);
                    setCurrentReport(null);
                    setAppState('dashboard');
                }
            } catch (error) {
                console.error('[App] Error loading user data:', error);
                setAppState('dashboard');
                setAllTransactions([]);
                setCurrentReport(null);
            }
        };
        
        loadAppData();
    }, [token, email, loadUserData]);

    // Автоматическое обновление отчета при изменении транзакций
    useEffect(() => {
        if (allTransactions && allTransactions.length > 0) {
            const newReport = generateFinancialReport(allTransactions);
            setCurrentReport(newReport);
        } else {
            setCurrentReport(null);
        }
    }, [allTransactions]);

    // Фильтрация транзакций по диапазону дат
    const filteredTransactions = useMemo(() => {
        if (!allTransactions || !dateRange) {
            return allTransactions;
        }
        
        return allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            const startDate = new Date(dateRange.start + 'T00:00:00');
            const endDate = new Date(dateRange.end + 'T23:59:59');
            
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [allTransactions, dateRange]);

    // Ленивая загрузка компонентов
    const Dashboard = lazy(() => import('./backend/components/Dashboard'));
    const AdvancedFinancialDashboard = lazy(() => import('./backend/components/AdvancedFinancialDashboard'));

    const handleFileProcess = useCallback(async (file: File, mode: 'replace' | 'append' = 'replace') => {
        setIsUploadModalOpen(false);
        setAppState('processing');
        setLoadingMessage('Обработка файла...');
        setError(null);

        try {
            const result = await processAndCategorizeTransactions(file, activeProfile, setLoadingMessage);
            
            if (result && result.length > 0) {
                setLoadingMessage('Создание отчёта...');
                
                let finalTransactions;
                if (mode === 'append' && allTransactions && allTransactions.length > 0) {
                    // Объединяем существующие и новые транзакции, удаляя дубликаты
                    const existingIds = new Set(allTransactions.map(t => `${t.date}_${t.amount}_${t.description}`));
                    const newTransactions = result.filter(t => !existingIds.has(`${t.date}_${t.amount}_${t.description}`));
                    finalTransactions = [...allTransactions, ...newTransactions];
                    setLoadingMessage(`Добавлено ${newTransactions.length} новых операций...`);
                } else {
                    finalTransactions = result;
                }
                
                const report = generateFinancialReport(finalTransactions);
                
                setAllTransactions(finalTransactions);
                setCurrentReport(report);
                setAppState('dashboard');
                
                // Сохраняем данные пользователя
                saveUserData('transactions', finalTransactions);
            } else {
                throw new Error('Не удалось извлечь транзакции из файла');
            }
        } catch (error) {
            console.error('[App] Processing error:', error);
            setError(error instanceof Error ? error.message : 'Произошла ошибка при обработке файла');
            setAppState('dashboard'); // Остаемся в дашборде даже при ошибке
        }
    }, [saveUserData, allTransactions, activeProfile]);

    const openUploadModal = useCallback(() => {
        if (allTransactions && allTransactions.length > 0) {
            setShowUploadOptions(true);
        } else {
            setIsUploadModalOpen(true);
        }
    }, [allTransactions]);

    const handleUploadModeSelect = useCallback((mode: 'replace' | 'append') => {
        setShowUploadOptions(false);
        setIsUploadModalOpen(true);
        // Сохраняем выбранный режим для использования в handleFileProcess
        setUploadMode(mode);
    }, []);

    const cancelUploadOptions = useCallback(() => {
        setShowUploadOptions(false);
    }, []);

    const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');

    const closeUploadModal = useCallback(() => {
        setIsUploadModalOpen(false);
    }, []);

    const handleSetActiveView = useCallback((view: View) => {
        setActiveView(view);
    }, []);

    const handleSaveProfile = useCallback((profile: BusinessProfile | Omit<BusinessProfile, 'id'>) => {
        // Если профиль без id, создаем новый id
        const profileWithId: BusinessProfile = 'id' in profile 
            ? profile 
            : { ...profile, id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        
        setAllProfiles(prevProfiles => {
            const existingIndex = prevProfiles.findIndex(p => p.id === profileWithId.id);
            let newProfiles;
            
            if (existingIndex >= 0) {
                newProfiles = [...prevProfiles];
                newProfiles[existingIndex] = profileWithId;
            } else {
                newProfiles = [...prevProfiles, profileWithId];
            }
            
            // Сохраняем в пользовательские данные
            saveUserData('businessProfiles', newProfiles);
            
            return newProfiles;
        });
        
        setActiveProfileId(profileWithId.id);
        saveUserData('activeProfileId', profileWithId.id);
    }, [saveUserData]);

    const handleSwitchProfile = useCallback((profileId: string) => {
        setActiveProfileId(profileId);
        saveUserData('activeProfileId', profileId);
    }, [saveUserData]);

    const handleDeleteProfile = useCallback((profileId: string) => {
        setAllProfiles(prevProfiles => {
            const newProfiles = prevProfiles.filter(p => p.id !== profileId);
            
            // Сохраняем обновленный список
            saveUserData('businessProfiles', newProfiles);
            
            return newProfiles;
        });
        
        // Если удаляем активный профиль, переключаемся на первый доступный
        if (activeProfileId === profileId) {
            const remainingProfiles = allProfiles.filter(p => p.id !== profileId);
            if (remainingProfiles.length > 0) {
                const newActiveId = remainingProfiles[0].id;
                setActiveProfileId(newActiveId);
                saveUserData('activeProfileId', newActiveId);
            } else {
                setActiveProfileId(null);
                saveUserData('activeProfileId', null);
            }
        }
    }, [allProfiles, activeProfileId, saveUserData]);

    const handleNewProfile = useCallback(() => {
        setActiveProfileId(null);
    }, []);

    // Модальное окно выбора режима загрузки
    const UploadOptionsModal = () => (
        showUploadOptions ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div className="bg-surface p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                        Загрузить новые данные
                    </h3>
                    <p className="text-text-secondary mb-6">
                        У вас уже есть загруженные транзакции. Выберите способ загрузки новых данных:
                    </p>
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleUploadModeSelect('replace')}
                            className="w-full p-4 text-left border border-border rounded-lg hover:bg-surface-hover transition group"
                        >
                            <div className="font-medium text-text-primary group-hover:text-primary mb-1">
                                🔄 Загрузить новые операции
                            </div>
                            <div className="text-sm text-text-secondary">
                                Полностью заменить текущие операции на новые
                            </div>
                        </button>
                        <button
                            onClick={() => handleUploadModeSelect('append')}
                            className="w-full p-4 text-left border border-border rounded-lg hover:bg-surface-hover transition group"
                        >
                            <div className="font-medium text-text-primary group-hover:text-primary mb-1">
                                ➕ Обновить текущие операции
                            </div>
                            <div className="text-sm text-text-secondary">
                                Добавить новые данные поверх существующих операций
                            </div>
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={cancelUploadOptions}
                            className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border rounded transition"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        ) : null
    );

    // Модальное окно загрузки
    const UploadModal = () => (
        isUploadModalOpen ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            Загрузить файл
                        </h3>
                        <button
                            onClick={closeUploadModal}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </button>
                    </div>
                    <DataUpload 
                        onFileUploaded={(file) => {
                            handleFileProcess(file, uploadMode);
                            closeUploadModal();
                        }} 
                        isProcessing={appState === 'processing'} 
                        isCompact={true}
                    />
                </div>
            </div>
        ) : null
    );

    // Функция рендера основного контента
    const renderContent = useCallback(() => {
        
        switch (appState) {
            case 'processing':
                return <Loader message={loadingMessage} />;
            case 'dashboard':
                
                // Всегда показываем дашборд, даже если нет транзакций
                const hasTransactions = allTransactions && allTransactions.length > 0;

                // Создаем dateRange если его нет
                const effectiveDateRange = dateRange || (() => {
                    if (!hasTransactions) {
                        return {
                            start: getCurrentLocalDate(),
                            end: getCurrentLocalDate()
                        };
                    }
                    const dates = allTransactions.map(t => (parseLocalDate(t.date) || new Date(t.date)).getTime());
                    return {
                        start: formatLocalDate(new Date(Math.min(...dates))),
                        end: formatLocalDate(new Date(Math.max(...dates)))
                    };
                })();

                // Создаем отчет если его нет
                const effectiveReport = currentReport || generateFinancialReport(allTransactions || []);

                return (
                    <div className="min-h-screen bg-background text-text-primary">
                        <Sidebar activeView={activeView} setActiveView={handleSetActiveView} hasData={hasTransactions || false} onResetData={openUploadModal} />
                        <main className="lg:ml-[280px] min-h-screen">
                            {error && (
                                <div className="m-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                    {error}
                                </div>
                            )}

                            {activeView === 'dashboard' && (
                                <Suspense fallback={<Loader message="Загрузка дашборда..." />}>
                                    <Dashboard
                                        transactions={hasTransactions ? (filteredTransactions || allTransactions) : []}
                                        report={effectiveReport}
                                        dateRange={effectiveDateRange}
                                        profile={activeProfile}
                                        onAddTransaction={handleAddTransaction}
                                    />
                                    {!hasTransactions && (
                                        <div className="fixed bottom-6 right-6">
                                            <button 
                                                onClick={openUploadModal}
                                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition font-medium shadow-lg flex items-center gap-2"
                                            >
                                                <span>📁</span>
                                                Загрузить данные
                                            </button>
                                        </div>
                                    )}
                                </Suspense>
                            )}

                            {activeView === 'advanced' && (
                                <Suspense fallback={<Loader message="Загрузка расширенной аналитики..." />}>
                                    <AdvancedFinancialDashboard
                                        report={(() => {
                                            const { generateAdvancedFinancialReport } = require('./services/advancedFinancialService');
                                            return generateAdvancedFinancialReport(filteredTransactions || allTransactions);
                                        })()}
                                    />
                                </Suspense>
                            )}

                            {activeView === 'transactions' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <DateRangeFilter 
                                            startDate={effectiveDateRange.start}
                                            endDate={effectiveDateRange.end}
                                            minDate={hasTransactions ? formatLocalDate(new Date(Math.min(...allTransactions.map(t => (parseLocalDate(t.date) || new Date(t.date)).getTime())))) : effectiveDateRange.start}
                                            maxDate={hasTransactions ? formatLocalDate(new Date(Math.max(...allTransactions.map(t => (parseLocalDate(t.date) || new Date(t.date)).getTime())))) : effectiveDateRange.end}
                                            onDateChange={(start, end) => setDateRange({ start, end })}
                                        />
                                    </div>
                                    <TransactionsTable 
                                        transactions={hasTransactions ? (filteredTransactions || allTransactions) : []}
                                        onUpdateTransaction={(originalTx, updates, applyToAll) => {
                                            // TODO: Implement transaction update logic
                                        }}
                                        onAddTransaction={(tx) => {
                                            const newTransactions = [...(allTransactions || []), tx];
                                            setAllTransactions(newTransactions);
                                            
                                            // Обновляем отчет с новыми данными
                                            const newReport = generateFinancialReport(newTransactions);
                                            setCurrentReport(newReport);
                                            
                                            // Сохраняем данные пользователя
                                            saveUserData('transactions', newTransactions);
                                        }}
                                        onDeleteTransaction={(tx) => {
                                            const newTransactions = (allTransactions || []).filter(t => 
                                                t.date !== tx.date || 
                                                t.amount !== tx.amount || 
                                                t.description !== tx.description
                                            );
                                            setAllTransactions(newTransactions);
                                            
                                            // Обновляем отчет с новыми данными
                                            const newReport = generateFinancialReport(newTransactions);
                                            setCurrentReport(newReport);
                                            
                                            // Сохраняем данные пользователя
                                            saveUserData('transactions', newTransactions);
                                        }}
                                        onClearAllData={() => {
                                            setAllTransactions([]);
                                            setCurrentReport(null);
                                            
                                            // Сохраняем пустые данные
                                            saveUserData('transactions', []);
                                        }}
                                    />
                                    {!hasTransactions && (
                                        <div className="mt-6 text-center">
                                            <div className="mb-4 text-4xl">📋</div>
                                            <h3 className="text-lg font-semibold text-text-primary mb-2">Таблица транзакций пуста</h3>
                                            <p className="text-text-secondary mb-4">
                                                Загрузите файл с транзакциями или добавьте их вручную
                                            </p>
                                            <button 
                                                onClick={openUploadModal}
                                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition font-medium"
                                            >
                                                Загрузить файл
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeView === 'ai_assistant' && (
                                <AiAssistant 
                                    transactions={filteredTransactions || allTransactions || []} 
                                    report={effectiveReport}
                                    dateRange={effectiveDateRange}
                                    profile={activeProfile}
                                />
                            )}

                            {activeView === 'financial_model' && (
                                <Suspense fallback={<Loader message="Загрузка финансовой модели..." />}>
                                    <FinancialPage />
                                </Suspense>
                            )}

                            {activeView === 'profile' && (
                                <Profile
                                    allProfiles={allProfiles}
                                    activeProfile={activeProfile}
                                    onSave={handleSaveProfile}
                                    onSwitch={handleSwitchProfile}
                                    onDelete={handleDeleteProfile}
                                    onNew={handleNewProfile}
                                />
                            )}

                            {activeView === 'admin' && (
                                <Suspense fallback={<Loader message="Загрузка админ панели..." />}>
                                    <AdminPanel />
                                </Suspense>
                            )}
                        </main>
                    </div>
                );
            default:
                return <Loader message="Инициализация..." />;
        }
    }, [
        appState, activeView, allTransactions, allProfiles, activeProfile, error, loadingMessage,
        filteredTransactions, currentReport, dateRange, handleSetActiveView, openUploadModal,
        handleSaveProfile, handleSwitchProfile, handleDeleteProfile, handleNewProfile, handleFileProcess
    ]);

    // Основной рендер с роутингом
    return (
        <div className="min-h-screen transition-colors duration-300">
            <Router>
                <NavigationLogger />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/dashboard" element={
                        <RequireAuth>
                            <div className="min-h-screen transition-colors duration-300">
                                {renderContent()}
                                <UploadOptionsModal />
                                <UploadModal />
                            </div>
                        </RequireAuth>
                    } />

                    <Route path="/auth-debug" element={<AuthDebug />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </div>
    );
};

// Основной компонент App с UserProvider и ThemeProvider
const App: React.FC = () => {
  return (
    <UserProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
