import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    // Email validation
    if (!credentials.email) {
      errors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Некорректный формат email';
    }

    // Password validation
    if (!credentials.password) {
      errors.password = 'Пароль обязателен';
    } else if (credentials.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleDemoLogin = () => {
    setCredentials({
      email: 'owner@techstart.kz',
      password: 'password123'
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LoginIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            FinSights AI
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Войдите в ваш аккаунт
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={credentials.email}
            onChange={handleInputChange('email')}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'white', opacity: 0.7 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Пароль"
            value={credentials.password}
            onChange={handleInputChange('password')}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'white', opacity: 0.7 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'white', opacity: 0.7 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white'
                }
              }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              mb: 2,
              py: 1.5,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              },
              '&:disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Войти'
            )}
          </Button>

          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              или
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleDemoLogin}
            sx={{
              mb: 2,
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Демо вход
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Нет аккаунта?{' '}
              <Link
                component="button"
                type="button"
                onClick={onSwitchToRegister}
                sx={{
                  color: 'white',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                Зарегистрироваться
              </Link>
            </Typography>
          </Box>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Демо данные для входа:
            <br />
            Email: owner@techstart.kz
            <br />
            Пароль: password123
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;