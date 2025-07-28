import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SubscriptionInfo, subscriptionService } from '../../services/subscriptionService';
import { userDataService } from '../../services/userDataService';

// Интерфейс состояния пользователя
interface UserContextType {
  // Состояние
  token: string | null;
  email: string | null;
  displayName: string | null;
  userId: string | null;
  role: string | null;
  photoUrl: string | null;
  loading: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  
  // Методы
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  guestLogin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getUserId: () => string;
  saveUserData: (key: string, data: any) => void;
  loadUserData: (key: string) => Promise<any>;
  clearUserData: () => Promise<void>;
}

// Создаем контексты
const UserStateContext = createContext<UserContextType | null>(null);

// Основной хук для использования контекста
export const useUser = (): UserContextType => {
  const context = useContext(UserStateContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

// Дополнительные хуки для совместимости
export const useUserState = () => {
  const { token, email, displayName, userId, role, photoUrl, loading, subscriptionInfo } = useUser();
  return { token, email, displayName, userId, role, photoUrl, loading, subscriptionInfo };
};

export const useUserActions = () => {
  const { login, register, logout, refreshSubscription, getUserId, saveUserData, loadUserData, clearUserData } = useUser();
  return { login, register, logout, refreshSubscription, getUserId, saveUserData, loadUserData, clearUserData };
};

// Provider компонент
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  const getUserId = useCallback(() => {
    return userId || email || 'anonymous';
  }, [userId, email]);

  const saveUserData = useCallback(async (key: string, data: any) => {
    const currentUserId = getUserId();
    console.log('[UserContext] === SAVE USER DATA START ===');
    console.log('[UserContext] Saving key:', key);
    console.log('[UserContext] User ID:', currentUserId);
    console.log('[UserContext] Data preview:', data ? (Array.isArray(data) ? `Array(${data.length})` : typeof data) : 'null');
    
    try {
      // Сохраняем в localStorage
      const storageKey = `finsights_${currentUserId}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('[UserContext] localStorage save success');
    } catch (error) {
      console.error('[UserContext] localStorage save error:', error);
    }

    // Сохраняем на сервер если нужно
    try {
      if (key === 'businessProfiles') {
        await userDataService.saveUserProfiles(currentUserId, data);
      } else if (key === 'transactions') {
        await userDataService.saveUserTransactions(currentUserId, data);
      }
      // Для других ключей используем только localStorage
    } catch (error) {
      console.error('[UserContext] Server save error for key:', key, 'error:', error);
    }
  }, [getUserId]);

  const loadUserData = useCallback(async (key: string): Promise<any> => {
    const currentUserId = getUserId();
    console.log('[UserContext] === LOAD USER DATA START ===');
    console.log('[UserContext] Loading key:', key);
    console.log('[UserContext] User ID:', currentUserId);
    
    try {
      // Пробуем загрузить из localStorage
      const storageKey = `finsights_${currentUserId}_${key}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('[UserContext] === LOAD FROM LOCALSTORAGE SUCCESS ===');
        console.log('[UserContext] Data preview:', Array.isArray(data) ? `Array(${data.length})` : typeof data);
        return data;
      }
    } catch (error) {
      console.error('[UserContext] localStorage load error:', error);
    }

    // Загружаем с сервера если нужно
    try {
      if (key === 'businessProfiles') {
        const serverData = await userDataService.loadUserProfiles(currentUserId);
        if (serverData.profiles.length > 0) {
          // Кешируем в localStorage
          const storageKey = `finsights_${currentUserId}_${key}`;
          localStorage.setItem(storageKey, JSON.stringify(serverData.profiles));
          return serverData.profiles;
        }
      } else if (key === 'transactions') {
        const serverData = await userDataService.loadUserTransactions(currentUserId);
        if (serverData.length > 0) {
          // Кешируем в localStorage
          const storageKey = `finsights_${currentUserId}_${key}`;
          localStorage.setItem(storageKey, JSON.stringify(serverData));
          return serverData;
        }
      } else if (key === 'activeProfileId') {
        const serverData = await userDataService.loadUserProfiles(currentUserId);
        if (serverData.activeProfileId) {
          // Кешируем в localStorage
          const storageKey = `finsights_${currentUserId}_${key}`;
          localStorage.setItem(storageKey, JSON.stringify(serverData.activeProfileId));
          return serverData.activeProfileId;
        }
      }
      // Для других ключей используем только localStorage
    } catch (error) {
      console.error('[UserContext] Server load error for key:', key, 'error:', error);
    }
    
    return null;
  }, [getUserId]);

  const clearUserData = useCallback(async () => {
    const currentUserId = getUserId();
    console.log('[UserContext] === CLEAR USER DATA ===');
    console.log('[UserContext] User ID:', currentUserId);
    
    // Очищаем localStorage
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(key => key.startsWith(`finsights_${currentUserId}_`));
    userKeys.forEach(key => localStorage.removeItem(key));
    
    // Очищаем данные на сервере
    try {
      await userDataService.clearUserData(currentUserId);
    } catch (error) {
      console.error('[UserContext] Server clear error:', error);
    }
  }, [getUserId]);

  // Проверка авторизации при загрузке
  useEffect(() => {
    if (initialized) {
      console.log('[UserContext] Already initialized, skipping auth check');
      return;
    }
    
    console.log('[UserContext] Starting auth check...');
    setInitialized(true);
    const saved = localStorage.getItem('finsights_auth');
    const guestSaved = sessionStorage.getItem('finsights_guest');
    
    // Проверяем гостевую сессию в sessionStorage
    if (guestSaved) {
      try {
        const guestData = JSON.parse(guestSaved);
        if (guestData.token === 'guest-session') {
          console.log('[UserContext] Restoring guest session');
          setToken(guestData.token);
          setEmail(guestData.email);
          setDisplayName(guestData.displayName);
          setUserId(guestData.userId);
          setRole(guestData.role);
          setPhotoUrl(guestData.photoUrl);
          setLoading(false);
          
          // Загружаем информацию о подписке для гостя
          refreshSubscription();
          return;
        }
      } catch (error) {
        console.log('[UserContext] Invalid guest session data, clearing...');
        sessionStorage.removeItem('finsights_guest');
      }
    }
    
    // Проверяем на устаревшие токены и очищаем localStorage
    if (saved) {
      try {
        const authData = JSON.parse(saved);
        if (authData.token === 'google-oauth' || authData.token?.startsWith('google-')) {
          console.log('[UserContext] Detected old token format, clearing localStorage');
          localStorage.removeItem('finsights_auth');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('[UserContext] Invalid localStorage data, clearing...');
        localStorage.removeItem('finsights_auth');
        setLoading(false);
        return;
      }
    }
    
    // Проверяем сессию на сервере с тайм-аутом
    console.log('[UserContext] Checking /api/me endpoint...');
    
    // Создаем промис с тайм-аутом
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 секунд тайм-аут
    });
    
    Promise.race([
      fetch('http://localhost:3001/api/me', { credentials: 'include' }),
      timeoutPromise
    ])
      .then((res: unknown) => {
        // Проверяем что это Response объект
        if (res instanceof Response) {
          console.log('[UserContext] /api/me response status:', res.status);
          if (res.ok) return res.json();
          throw new Error(`HTTP ${res.status}`);
        }
        throw new Error('Invalid response type');
      })
      .then(data => {
        console.log('[UserContext] /api/me success data:', data);
        
        // Сохраняем токен и данные пользователя
        const authToken = 'session-auth';
        const userData = {
          token: authToken,
          email: data.email,
          displayName: data.displayName || null,
          userId: data.id || null,
          role: data.role || 'user',
          photoUrl: data.photoUrl || null
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('finsights_auth', JSON.stringify(userData));
        console.log('[UserContext] Saved auth data to localStorage:', userData);
        
        // Обновляем состояние
        setToken(authToken);
        setEmail(data.email);
        setDisplayName(data.displayName || null);
        setUserId(data.id || null);
        setRole(data.role || 'user');
        setPhotoUrl(data.photoUrl || null);
        setLoading(false);
        console.log('[UserContext] Successfully authenticated via /api/me');
        
        // Специальная обработка для админ пользователя
        if (data.email?.toLowerCase().trim() === 'dulat280489@gmail.com') {
          console.log('[UserContext] Admin user detected, setting PRO subscription');
          const adminSubscription: SubscriptionInfo = {
            status: 'pro' as const,
            limits: {
              maxProfiles: -1,
              maxTransactions: -1, 
              maxAiRequests: -1,
              hasAdvancedAnalytics: true,
              hasExcelExport: true,
              hasPrioritySupport: true,
              hasFinancialModeling: true,
            },
            currentUsage: { profiles: 0, transactions: 0, aiRequests: 0 }
          };
          setSubscriptionInfo(adminSubscription);
          // Синхронизируем с subscriptionService
          subscriptionService.setSubscriptionInfo(adminSubscription);
        } else {
          // Загружаем информацию о подписке для обычных пользователей
          refreshSubscription();
        }
      })
      .catch((err) => {
        console.log('[UserContext] /api/me failed:', err);
        
        // При получении 401 очищаем localStorage
        if (err.message.includes('401')) {
          console.log('[UserContext] 401 Unauthorized - clearing localStorage');
          localStorage.removeItem('finsights_auth');
          setToken(null);
          setEmail(null);
          setDisplayName(null);
          setUserId(null);
          setRole('user');
          setPhotoUrl(null);
        } else if (err.message.includes('timeout')) {
          console.log('[UserContext] Request timeout - server might be down');
          // При тайм-ауте не очищаем localStorage, возможно сервер просто недоступен
        } else if (saved) {
          // Fallback к localStorage только если ошибка не 401
          try {
            const authData = JSON.parse(saved);
            setToken(authData.token);
            setEmail(authData.email);
            setDisplayName(authData.displayName || null);
            setUserId(authData.userId || null);
            setRole(authData.role || 'user');
            setPhotoUrl(authData.photoUrl || null);
            console.log('[UserContext] Restored from localStorage');
            
            // Загружаем информацию о подписке
            refreshSubscription();
          } catch (error) {
            console.error('[UserContext] Error parsing localStorage auth:', error);
          }
        }
        
        setLoading(false);
        console.log('[UserContext] Auth check complete - not authenticated');
      });
  }, []);

  // Функция входа
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[UserContext] Login attempt for:', email);
    
    // Демо вход для админа (если сервер недоступен)
    if (email.toLowerCase().trim() === 'dulat280489@gmail.com' && (password === 'admin123' || password === 'Malika2015')) {
      console.log('[UserContext] Demo admin login');
      
      const userData = {
        token: 'session-auth',
        email: 'Dulat280489@gmail.com',
        displayName: 'Админ',
        userId: 'admin_user_1',
        role: 'admin',
        photoUrl: null
      };

      // Сохраняем в localStorage
      localStorage.setItem('finsights_auth', JSON.stringify(userData));
      
      // Обновляем состояние
      setToken('session-auth');
      setEmail('Dulat280489@gmail.com');
      setDisplayName('Админ');
      setUserId('admin_user_1');
      setRole('admin');
      setPhotoUrl(null);
      setLoading(false);

      // Устанавливаем PRO подписку
      const adminSubscription: SubscriptionInfo = {
        status: 'pro' as const,
        limits: {
          maxProfiles: -1,
          maxTransactions: -1, 
          maxAiRequests: -1,
          hasAdvancedAnalytics: true,
          hasExcelExport: true,
          hasPrioritySupport: true,
          hasFinancialModeling: true,
        },
        currentUsage: { profiles: 0, transactions: 0, aiRequests: 0 }
      };
      console.log('[UserContext] Demo admin - setting subscription:', adminSubscription);
      setSubscriptionInfo(adminSubscription);
      // Синхронизируем с subscriptionService
      subscriptionService.setSubscriptionInfo(adminSubscription);

      console.log('[UserContext] Demo admin login successful');
      return { success: true };
    }

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          token: 'session-auth',
          email: data.user.email,
          displayName: data.user.displayName,
          userId: data.user.id,
          role: data.user.role,
          photoUrl: data.user.photoUrl
        };

        // Сохраняем в localStorage
        localStorage.setItem('finsights_auth', JSON.stringify(userData));
        
        // Обновляем состояние
        setToken('session-auth');
        setEmail(data.user.email);
        setDisplayName(data.user.displayName);
        setUserId(data.user.id);
        setRole(data.user.role);
        setPhotoUrl(data.user.photoUrl);
        setLoading(false);

        // Специальная обработка для админ пользователя
        if (data.user.email?.toLowerCase().trim() === 'dulat280489@gmail.com') {
          console.log('[UserContext] Admin login detected, setting PRO subscription');
          const adminSubscription: SubscriptionInfo = {
            status: 'pro' as const,
            limits: {
              maxProfiles: -1,
              maxTransactions: -1, 
              maxAiRequests: -1,
              hasAdvancedAnalytics: true,
              hasExcelExport: true,
              hasPrioritySupport: true,
              hasFinancialModeling: true,
            },
            currentUsage: { profiles: 0, transactions: 0, aiRequests: 0 }
          };
          console.log('[UserContext] Setting admin subscription:', adminSubscription);
          setSubscriptionInfo(adminSubscription);
          // Синхронизируем с subscriptionService
          subscriptionService.setSubscriptionInfo(adminSubscription);
        } else {
          // Загружаем информацию о подписке для обычных пользователей
          refreshSubscription();
        }

        console.log('[UserContext] Login successful');
        return { success: true };
      } else {
        console.log('[UserContext] Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('[UserContext] Login error:', error);
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  }, []);

  // Функция регистрации
  const register = useCallback(async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[UserContext] Registration attempt for:', email);
    
    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          token: 'session-auth',
          email: data.user.email,
          displayName: data.user.displayName,
          userId: data.user.id,
          role: data.user.role,
          photoUrl: data.user.photoUrl
        };

        // Сохраняем в localStorage
        localStorage.setItem('finsights_auth', JSON.stringify(userData));
        
        // Обновляем состояние
        setToken('session-auth');
        setEmail(data.user.email);
        setDisplayName(data.user.displayName);
        setUserId(data.user.id);
        setRole(data.user.role);
        setPhotoUrl(data.user.photoUrl);
        setLoading(false);
        
        // Загружаем информацию о подписке сразу после регистрации
        await refreshSubscription();
        
        console.log('[UserContext] Registration successful');
        return { success: true };
      } else {
        console.log('[UserContext] Registration failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('[UserContext] Registration error:', error);
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  }, []);

  // Функция входа в гостевом режиме
  const guestLogin = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    console.log('[UserContext] Guest login attempt');
    
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        token: 'guest-session',
        email: 'guest@local',
        displayName: 'Гость',
        userId: guestId,
        role: 'guest',
        photoUrl: null
      };

      // Сохраняем в sessionStorage (НЕ localStorage) чтобы данные не сохранялись между сеансами
      sessionStorage.setItem('finsights_guest', JSON.stringify(userData));
      
      // Обновляем состояние
      setToken('guest-session');
      setEmail('guest@local');
      setDisplayName('Гость');
      setUserId(guestId);
      setRole('guest');
      setPhotoUrl(null);
      setLoading(false);
      
      console.log('[UserContext] Guest login successful');
      return { success: true };
    } catch (error) {
      console.error('[UserContext] Guest login error:', error);
      return { success: false, error: 'Ошибка входа в гостевой режим' };
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (userId || email) {
      const currentUserId = userId || email || 'demo-user';
      const info = await subscriptionService.fetchSubscriptionInfo(currentUserId);
      setSubscriptionInfo(info);
    }
  }, [userId, email]);

  const logout = useCallback(async () => {
    console.log('[UserContext] Logout attempt');
    
    try {
      await fetch('http://localhost:3001/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[UserContext] Logout server error:', error);
    }
    
    // Очищаем локальное состояние
    await clearUserData();
    setToken(null);
    setEmail(null);
    setDisplayName(null);
    setUserId(null);
    setRole(null);
    setPhotoUrl(null);
    setLoading(false);
    setSubscriptionInfo(null);
    localStorage.removeItem('finsights_auth');
    sessionStorage.removeItem('finsights_guest');
    console.log('[UserContext] Logout completed');
  }, [clearUserData]);

  // Загружаем данные подписки при авторизации
  useEffect(() => {
    if ((userId || email) && !subscriptionInfo) {
      refreshSubscription();
    }
  }, [userId, email, subscriptionInfo, refreshSubscription]);

  // Значение контекста
  const contextValue: UserContextType = {
    // Состояние
    token, 
    email, 
    displayName, 
    userId, 
    role, 
    photoUrl, 
    loading, 
    subscriptionInfo,
    
    // Методы
    login,
    register,
    guestLogin,
    logout,
    refreshSubscription,
    getUserId,
    saveUserData,
    loadUserData,
    clearUserData
  };

  console.log('[UserContext] Render:', contextValue);

  return (
    <UserStateContext.Provider value={contextValue}>
      {children}
    </UserStateContext.Provider>
  );
}; 