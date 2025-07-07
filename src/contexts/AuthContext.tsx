import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, Company, LoginCredentials, RegisterData, UserRole, Permission } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateCompany: (updates: Partial<Company>) => void;
  switchCompany: (companyId: string) => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  refreshToken: () => Promise<void>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_COMPANY'; payload: Company | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'RESET_AUTH' };

const initialState: AuthState = {
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_COMPANY':
      return { ...state, company: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'RESET_AUTH':
      return initialState;
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock permission system based on roles
const getPermissionsByRole = (role: UserRole): Permission[] => {
  const permissions: Record<UserRole, Permission[]> = {
    owner: [
      {
        module: 'transactions',
        actions: ['read', 'write', 'delete', 'manage']
      },
      {
        module: 'reports',
        actions: ['read', 'write', 'delete', 'manage']
      },
      {
        module: 'budget',
        actions: ['read', 'write', 'delete', 'manage']
      },
      {
        module: 'settings',
        actions: ['read', 'write', 'delete', 'manage']
      },
      {
        module: 'users',
        actions: ['read', 'write', 'delete', 'manage']
      },
      {
        module: 'analytics',
        actions: ['read', 'write', 'delete', 'manage']
      }
    ],
    admin: [
      {
        module: 'transactions',
        actions: ['read', 'write', 'delete']
      },
      {
        module: 'reports',
        actions: ['read', 'write', 'delete']
      },
      {
        module: 'budget',
        actions: ['read', 'write', 'delete']
      },
      {
        module: 'settings',
        actions: ['read', 'write']
      },
      {
        module: 'users',
        actions: ['read', 'write']
      },
      {
        module: 'analytics',
        actions: ['read', 'write']
      }
    ],
    editor: [
      {
        module: 'transactions',
        actions: ['read', 'write']
      },
      {
        module: 'reports',
        actions: ['read']
      },
      {
        module: 'budget',
        actions: ['read', 'write']
      },
      {
        module: 'analytics',
        actions: ['read']
      }
    ],
    accountant: [
      {
        module: 'transactions',
        actions: ['read']
      },
      {
        module: 'reports',
        actions: ['read', 'write']
      },
      {
        module: 'budget',
        actions: ['read']
      },
      {
        module: 'analytics',
        actions: ['read', 'write']
      }
    ],
    viewer: [
      {
        module: 'transactions',
        actions: ['read']
      },
      {
        module: 'reports',
        actions: ['read']
      },
      {
        module: 'budget',
        actions: ['read']
      },
      {
        module: 'analytics',
        actions: ['read']
      }
    ]
  };

  return permissions[role] || [];
};

// Mock companies data
const mockCompanies: Company[] = [
  {
    id: 'comp_1',
    name: 'ТехСтарт КЗ',
    legalName: 'ТОО "ТехСтарт Казахстан"',
    taxId: '123456789012',
    registrationNumber: 'REG123456',
    address: {
      street: 'ул. Абая, 150',
      city: 'Алматы',
      country: 'Казахстан',
      postalCode: '050000'
    },
    industry: 'IT Services',
    size: 'small',
    currency: 'KZT',
    fiscalYearStart: '01-01',
    website: 'https://techstart.kz',
    phone: '+7 777 123 4567',
    createdAt: '2024-01-15T00:00:00Z',
    settings: {
      language: 'ru',
      timezone: 'Asia/Almaty',
      dateFormat: 'DD.MM.YYYY',
      numberFormat: 'ru-KZ',
      notifications: {
        email: true,
        push: true,
        weeklyReport: true,
        monthlyReport: true,
        budgetAlerts: true,
        goalAlerts: true
      },
      categories: {
        income: [
          { id: 'inc_1', name: 'Услуги разработки', color: '#4CAF50', icon: 'code', isDefault: true },
          { id: 'inc_2', name: 'Консультации', color: '#2196F3', icon: 'support', isDefault: true }
        ],
        expense: [
          { id: 'exp_1', name: 'Зарплата', color: '#FF5722', icon: 'person', isDefault: true },
          { id: 'exp_2', name: 'Офисные расходы', color: '#9C27B0', icon: 'business', isDefault: true },
          { id: 'exp_3', name: 'Маркетинг', color: '#FF9800', icon: 'campaign', isDefault: true }
        ]
      },
      integrations: {
        openBanking: false,
        stripe: false,
        paypal: false
      }
    }
  }
];

// Mock users data
const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'owner@techstart.kz',
    firstName: 'Айдар',
    lastName: 'Назарбаев',
    role: 'owner',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    permissions: getPermissionsByRole('owner')
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');
        const companyId = localStorage.getItem('companyId');

        if (token && userId) {
          // In a real app, validate token with backend
          const user = mockUsers.find(u => u.id === userId);
          const company = mockCompanies.find(c => c.id === companyId);

          if (user) {
            dispatch({ type: 'SET_USER', payload: user });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            
            if (company) {
              dispatch({ type: 'SET_COMPANY', payload: company });
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('companyId');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Mock login - in real app, call backend API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user by email (mock)
      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (!user || credentials.password !== 'password123') {
        throw new Error('Неверный email или пароль');
      }

      // Generate mock token
      const token = 'mock_jwt_token_' + Date.now();
      
      // Store in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', user.id);
      
      // Get user's company
      const company = mockCompanies[0]; // For demo, use first company
      localStorage.setItem('companyId', company.id);

      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_COMPANY', payload: company });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Ошибка входа' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Mock registration - in real app, call backend API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user already exists
      if (mockUsers.some(u => u.email === data.email)) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Create new user and company
      const newUser: User = {
        id: 'user_' + Date.now(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: getPermissionsByRole('owner')
      };

      const newCompany: Company = {
        id: 'comp_' + Date.now(),
        name: data.companyName,
        legalName: data.companyName,
        taxId: '',
        registrationNumber: '',
        address: {
          street: '',
          city: '',
          country: 'Казахстан',
          postalCode: ''
        },
        industry: data.industry,
        size: data.companySize,
        currency: 'KZT',
        fiscalYearStart: '01-01',
        createdAt: new Date().toISOString(),
        settings: {
          language: 'ru',
          timezone: 'Asia/Almaty',
          dateFormat: 'DD.MM.YYYY',
          numberFormat: 'ru-KZ',
          notifications: {
            email: true,
            push: true,
            weeklyReport: false,
            monthlyReport: true,
            budgetAlerts: true,
            goalAlerts: true
          },
          categories: {
            income: [],
            expense: []
          },
          integrations: {
            openBanking: false,
            stripe: false,
            paypal: false
          }
        }
      };

      // Mock storing (in real app, these would be saved to backend)
      mockUsers.push(newUser);
      mockCompanies.push(newCompany);

      // Generate token and store
      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', newUser.id);
      localStorage.setItem('companyId', newCompany.id);

      dispatch({ type: 'SET_USER', payload: newUser });
      dispatch({ type: 'SET_COMPANY', payload: newCompany });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Ошибка регистрации' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    dispatch({ type: 'RESET_AUTH' });
  };

  const updateUser = (updates: Partial<User>): void => {
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: 'SET_USER', payload: updatedUser });
    }
  };

  const updateCompany = (updates: Partial<Company>): void => {
    if (state.company) {
      const updatedCompany = { ...state.company, ...updates };
      dispatch({ type: 'SET_COMPANY', payload: updatedCompany });
    }
  };

  const switchCompany = async (companyId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const company = mockCompanies.find(c => c.id === companyId);
      if (!company) {
        throw new Error('Компания не найдена');
      }

      localStorage.setItem('companyId', companyId);
      dispatch({ type: 'SET_COMPANY', payload: company });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Ошибка переключения компании' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!state.user) return false;
    
    const permission = state.user.permissions.find(p => p.module === module);
    return permission ? permission.actions.includes(action as any) : false;
  };

  const refreshToken = async (): Promise<void> => {
    try {
      // Mock token refresh - in real app, call backend API
      const newToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('authToken', newToken);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    updateCompany,
    switchCompany,
    hasPermission,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};