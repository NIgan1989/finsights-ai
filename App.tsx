
import React, { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { Transaction, FinancialReport, BusinessProfile, Theme, View } from './types.ts';
import Sidebar from './backend/components/Sidebar.tsx';
import DataUpload from './backend/components/DataUpload.tsx';
import TransactionsTable from './backend/components/TransactionsTable.tsx';
import AiAssistant from './backend/components/AiAssistant.tsx';
import Profile from './backend/components/Profile.tsx';
import Loader from './backend/components/Loader.tsx';
import DateRangeFilter from './backend/components/DateRangeFilter.tsx';
import { processAndCategorizeTransactions, generateFinancialReport } from './services/financeService.ts';
import { UserProvider, useUser, useUserState, useUserActions } from './backend/components/UserContext';
import { ThemeProvider } from './backend/components/ThemeProvider';
import LandingPage from './backend/components/LandingPage';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PricingPage from './backend/components/PricingPage';
import FinancialPage from './backend/components/FinancialPage';
import AdminPanel from './backend/components/AdminPanel';
import ThemeTest from './backend/components/ThemeTest';
import { AuthDebug } from './backend/components/AuthDebug';

// Компонент для логирования навигации
const NavigationLogger: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('[Navigation] Page changed to:', location.pathname);
    console.log('[Navigation] Search params:', location.search);
    console.log('[Navigation] Hash:', location.hash);
    console.log('[Navigation] State:', location.state);
    console.log('[Navigation] Full URL:', window.location.href);
  }, [location]);
  
  return null;
};

// PrivateRoute для защиты приватных страниц
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useUser();
  const location = useLocation();
  
  console.log('[RequireAuth] Checking access...');
  console.log('[RequireAuth] token:', token);
  console.log('[RequireAuth] loading:', loading);
  console.log('[RequireAuth] location:', location.pathname);
  console.log('[RequireAuth] search params:', location.search);
  console.log('[RequireAuth] state:', location.state);
  
  if (loading) {
    console.log('[RequireAuth] Still loading, showing loader...');
    return <Loader message="Проверка авторизации..." />;
  }
  
  if (!token) {
    console.log('[RequireAuth] No token found, redirecting to landing page');
    console.log('[RequireAuth] Redirect from:', location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  console.log('[RequireAuth] Access granted, rendering protected content');
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
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

    const activeProfile = useMemo(() => {
        return allProfiles.find(p => p.id === activeProfileId) || null;
    }, [allProfiles, activeProfileId]);

    // Функция для добавления новой транзакции
    const handleAddTransaction = useCallback((tx: Transaction) => {
        console.log('Adding transaction:', tx);
        const newTransactions = [...(allTransactions || []), tx];
        setAllTransactions(newTransactions);
        
        // Обновляем отчет с новыми данными
        const newReport = generateFinancialReport(newTransactions);
        setCurrentReport(newReport);
        
        // Сохраняем данные пользователя
        saveUserData('transactions', newTransactions);
    }, [allTransactions, saveUserData]);

    type AppState = 'upload' | 'processing' | 'dashboard';

    // Эффект для загрузки пользовательских данных при авторизации
    useEffect(() => {
        console.log('[App] === AUTH STATE CHANGE EFFECT TRIGGERED ===');
        console.log('[App] Current token:', token);
        console.log('[App] Token type:', typeof token);
        console.log('[App] Token length:', token?.length);
        console.log('[App] Is token truthy:', !!token);
        console.log('[App] UserContext email:', email);
        
        // Загружаем данные только если пользователь авторизован
        if (!token || token === null || typeof token !== 'string' || token === 'null') {
            console.log('[App] No valid token, skipping data load. Token:', token, 'Type:', typeof token);
            // Если пользователь не авторизован, переходим в режим загрузки/запроса файла
            setAppState('upload');
            return;
        }

        console.log('[App] === STARTING USER DATA LOAD ===');
        
        const loadAppData = async () => {
            setAppState('processing');
            setLoadingMessage('Загрузка данных пользователя...');
            
            try {
                console.log('[App] Loading user profiles...');
                const profiles = await loadUserData('businessProfiles');
                console.log('[App] Loaded profiles:', profiles);
                
                console.log('[App] Loading user transactions...');
                const transactions = await loadUserData('transactions');
                console.log('[App] Loaded transactions:', transactions);
                
                console.log('[App] Loading active profile ID...');
                const savedActiveProfileId = await loadUserData('activeProfileId');
                console.log('[App] Loaded active profile ID:', savedActiveProfileId);
                
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
                    setAppState('dashboard');
                } else {
                    setAppState('upload');
                }
                
                console.log('[App] === USER DATA LOAD COMPLETE ===');
            } catch (error) {
                console.error('[App] Error loading user data:', error);
                setAppState('upload'); // Fallback to upload state
            }
        };
        
        loadAppData();
    }, [token, email, loadUserData]);

    // Фильтрация транзакций по диапазону дат
    const filteredTransactions = useMemo(() => {
        if (!allTransactions || !dateRange) return allTransactions;
        
        return allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [allTransactions, dateRange]);

    // Ленивая загрузка компонентов
    const Dashboard = lazy(() => import('./backend/components/Dashboard.tsx'));
    const AdvancedFinancialDashboard = lazy(() => import('./backend/components/AdvancedFinancialDashboard.tsx'));

    const handleFileProcess = useCallback(async (file: File) => {
        setIsUploadModalOpen(false);
        
        console.log('[App] === FILE PROCESSING START ===');
        console.log('[App] File:', file.name, file.type, file.size);
        
        setAppState('processing');
        setLoadingMessage('Обработка файла...');
        setError(null);

        try {
            const result = await processAndCategorizeTransactions(file, activeProfile, setLoadingMessage);
            console.log('[App] Processing result:', result);
            
            if (result && result.length > 0) {
                setLoadingMessage('Создание отчёта...');
                
                const report = generateFinancialReport(result);
                console.log('[App] Generated report:', report);
                
                setAllTransactions(result);
                setCurrentReport(report);
                setAppState('dashboard');
                
                // Сохраняем данные пользователя
                saveUserData('transactions', result);
                
                console.log('[App] === FILE PROCESSING COMPLETE ===');
            } else {
                throw new Error('Не удалось извлечь транзакции из файла');
            }
        } catch (error) {
            console.error('[App] Processing error:', error);
            setError(error instanceof Error ? error.message : 'Произошла ошибка при обработке файла');
            setAppState('upload');
        }
    }, [saveUserData]);

    const openUploadModal = useCallback(() => {
        if (allTransactions && allTransactions.length > 0) {
            setShowReplaceConfirm(true);
        } else {
            setIsUploadModalOpen(true);
        }
    }, [allTransactions]);

    const confirmReplace = useCallback(() => {
        setShowReplaceConfirm(false);
        setIsUploadModalOpen(true);
    }, []);

    const cancelReplace = useCallback(() => {
        setShowReplaceConfirm(false);
    }, []);

    const closeUploadModal = useCallback(() => {
        setIsUploadModalOpen(false);
    }, []);

    const handleSetActiveView = useCallback((view: View) => {
        setActiveView(view);
    }, []);

    const handleSaveProfile = useCallback((profile: BusinessProfile | Omit<BusinessProfile, 'id'>) => {
        console.log('[App] === SAVING PROFILE ===');
        console.log('[App] Profile to save:', profile);
        
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
                console.log('[App] Updated existing profile at index:', existingIndex);
            } else {
                newProfiles = [...prevProfiles, profileWithId];
                console.log('[App] Added new profile');
            }
            
            console.log('[App] New profiles array:', newProfiles);
            
            // Сохраняем в пользовательские данные
            saveUserData('businessProfiles', newProfiles);
            
            return newProfiles;
        });
        
        setActiveProfileId(profileWithId.id);
        saveUserData('activeProfileId', profileWithId.id);
    }, [saveUserData]);

    const handleSwitchProfile = useCallback((profileId: string) => {
        console.log('[App] === SWITCHING PROFILE ===');
        console.log('[App] New profile ID:', profileId);
        setActiveProfileId(profileId);
        saveUserData('activeProfileId', profileId);
    }, [saveUserData]);

    const handleDeleteProfile = useCallback((profileId: string) => {
        console.log('[App] === DELETING PROFILE ===');
        console.log('[App] Profile ID to delete:', profileId);
        
        setAllProfiles(prevProfiles => {
            const newProfiles = prevProfiles.filter(p => p.id !== profileId);
            console.log('[App] Remaining profiles:', newProfiles);
            
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

    // Модальное окно для подтверждения замены
    const ReplaceConfirmModal = () => (
        showReplaceConfirm ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-surface p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                        Заменить существующие данные?
                    </h3>
                    <p className="text-text-secondary mb-6">
                        У вас уже есть загруженные транзакции. Хотите заменить их новыми данными?
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={cancelReplace}
                            className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border rounded transition"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={confirmReplace}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover transition"
                        >
                            Заменить
                        </button>
                    </div>
                </div>
            </div>
        ) : null
    );

    // Модальное окно загрузки
    const UploadModal = () => (
        isUploadModalOpen ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-surface p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">
                            Загрузить файл
                        </h3>
                        <button
                            onClick={closeUploadModal}
                            className="text-text-secondary hover:text-text-primary"
                        >
                            ✕
                        </button>
                    </div>
                    <DataUpload 
                        onFileUploaded={(file) => {
                            handleFileProcess(file);
                            closeUploadModal();
                        }} 
                        isProcessing={appState === 'processing'} 
                        isCompact={true}
                    />
                </div>
            </div>
        ) : null
    );

    console.log('[App] === COMPONENT RENDER ===');
    console.log('[App] Current state snapshot:');
    console.log('[App] - appState:', appState);
    console.log('[App] - activeView:', activeView);
    console.log('[App] - token:', token, '(type:', typeof token, 'truthy:', !!token, ')');
    console.log('[App] - email:', email);
    console.log('[App] - allProfiles length:', allProfiles.length);
    console.log('[App] - allTransactions length:', allTransactions?.length || 0);
    console.log('[App] - activeProfileId:', activeProfileId);
    console.log('[App] - error:', error);
    console.log('[App] - loadingMessage:', loadingMessage);



    // Функция рендера основного контента
    const renderContent = useCallback(() => {
        console.log('[App] === RENDER CONTENT ===');
        console.log('[App] Current appState:', appState);
        console.log('[App] Current activeView:', activeView);
        console.log('[App] allTransactions:', allTransactions);
        console.log('[App] allProfiles:', allProfiles);
        console.log('[App] activeProfile:', activeProfile);
        console.log('[App] error:', error);
        
        switch (appState) {
            case 'processing':
                console.log('[App] Rendering processing state with message:', loadingMessage);
                return <Loader message={loadingMessage} />;
            case 'upload':
                console.log('[App] Rendering upload state');
                return (
                    <div className="min-h-screen bg-background text-text-primary">
                        <Sidebar activeView={activeView} setActiveView={handleSetActiveView} hasData={false} onResetData={openUploadModal} />
                        <main className="lg:ml-56 min-h-screen">
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
                            {activeView === 'dashboard' && (
                                <div className="p-8 text-center">
                                    <div className="max-w-md mx-auto">
                                        <div className="mb-4 text-6xl">📊</div>
                                        <h2 className="text-xl font-semibold text-text-primary mb-2">Добро пожаловать!</h2>
                                        <p className="text-text-secondary mb-6">
                                            Загрузите банковскую выписку чтобы начать анализ ваших финансов.
                                        </p>
                                        <button 
                                            onClick={openUploadModal}
                                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition font-medium"
                                        >
                                            Загрузить файл
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeView === 'admin' && (
                                <Suspense fallback={<Loader message="Загрузка админ панели..." />}>
                                    {(() => { console.log('[App] Rendering admin panel in upload state, activeView:', activeView); return null; })()}
                                    <AdminPanel />
                                </Suspense>
                            )}
                            {!['profile', 'dashboard', 'admin'].includes(activeView) && (
                                <DataUpload onFileUploaded={(file) => handleFileProcess(file)} isProcessing={false} isCompact={true} />
                            )}
                        </main>
                    </div>
                );
            case 'dashboard':
                console.log('[App] Rendering dashboard state');
                
                if (!allTransactions || allTransactions.length === 0) {
                    console.log('[App] No transactions available, redirecting to upload');
                    setTimeout(() => setAppState('upload'), 100);
                    return <Loader message="Перенаправление..." />;
                }

                // Создаем dateRange если его нет
                const effectiveDateRange = dateRange || (() => {
                    const dates = allTransactions.map(t => new Date(t.date).getTime());
                    return {
                        start: new Date(Math.min(...dates)).toISOString().split('T')[0],
                        end: new Date(Math.max(...dates)).toISOString().split('T')[0]
                    };
                })();

                // Создаем отчет если его нет
                const effectiveReport = currentReport || generateFinancialReport(allTransactions);

                return (
                    <div className="min-h-screen bg-background text-text-primary">
                        <Sidebar activeView={activeView} setActiveView={handleSetActiveView} hasData={true} onResetData={openUploadModal} />
                        <main className="lg:ml-56 min-h-screen">
                            {error && (
                                <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {activeView === 'dashboard' && (
                                allTransactions && allTransactions.length > 0 ? (
                                    <Suspense fallback={<Loader message="Загрузка дашборда..." />}>
                                        <Dashboard
                                            transactions={filteredTransactions || allTransactions}
                                            report={effectiveReport}
                                            dateRange={effectiveDateRange}
                                            profile={activeProfile}
                                            onAddTransaction={handleAddTransaction}
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="max-w-md mx-auto">
                                            <div className="mb-4 text-6xl">📊</div>
                                            <h2 className="text-xl font-semibold text-text-primary mb-2">Дашборд пустой</h2>
                                            <p className="text-text-secondary mb-6">
                                                Загрузите файл с транзакциями, чтобы увидеть аналитику и отчеты.
                                            </p>
                                            <button 
                                                onClick={() => setActiveView('profile')}
                                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition font-medium"
                                            >
                                                Перейти к загрузке файла
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}

                            {activeView === 'advanced' && (
                                <Suspense fallback={<Loader message="Загрузка расширенной аналитики..." />}>
                                    <AdvancedFinancialDashboard
                                        report={(() => {
                                            const { generateAdvancedFinancialReport } = require('./services/advancedFinancialService.ts');
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
                                            minDate={allTransactions.length > 0 ? new Date(Math.min(...allTransactions.map(t => new Date(t.date).getTime()))).toISOString().split('T')[0] : ''}
                                            maxDate={allTransactions.length > 0 ? new Date(Math.max(...allTransactions.map(t => new Date(t.date).getTime()))).toISOString().split('T')[0] : ''}
                                            onDateChange={(start, end) => setDateRange({ start, end })}

                                        />
                                    </div>
                                    <TransactionsTable 
                                        transactions={filteredTransactions || allTransactions}
                                        onUpdateTransaction={(originalTx, updates, applyToAll) => {
                                            // TODO: Implement transaction update logic
                                            console.log('Update transaction:', originalTx, updates, applyToAll);
                                        }}
                                        onAddTransaction={(tx) => {
                                            console.log('Adding transaction:', tx);
                                            const newTransactions = [...(allTransactions || []), tx];
                                            setAllTransactions(newTransactions);
                                            
                                            // Обновляем отчет с новыми данными
                                            const newReport = generateFinancialReport(newTransactions);
                                            setCurrentReport(newReport);
                                            
                                            // Сохраняем данные пользователя
                                            saveUserData('transactions', newTransactions);
                                        }}
                                        onDeleteTransaction={(tx) => {
                                            console.log('Deleting transaction:', tx);
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

                                    />
                                </div>
                            )}

                            {activeView === 'ai_assistant' && (
                                <AiAssistant 
                                    transactions={filteredTransactions || allTransactions} 
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
                                    {(() => { console.log('[App] Rendering admin panel, activeView:', activeView); return null; })()}
                                    <AdminPanel />
                                </Suspense>
                            )}
                        </main>
                    </div>
                );
            default:
                console.log('[App] Unknown appState:', appState);
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
                                <ReplaceConfirmModal />
                                <UploadModal />
                            </div>
                        </RequireAuth>
                    } />

                    <Route path="/theme-test" element={<ThemeTest />} />
                    <Route path="/auth-debug" element={<AuthDebug />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </div>
    );
};

// Основной компонент App с UserProvider
const App: React.FC = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;
