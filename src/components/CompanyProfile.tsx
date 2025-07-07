import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Business,
  Edit,
  Save,
  Cancel,
  Upload,
  Phone,
  Language,
  LocationOn,
  TaxiAlert
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types';

const CompanyProfile: React.FC = () => {
  const { company, updateCompany, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company | null>(company);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = hasPermission('settings', 'write');

  const industries = [
    'IT Services',
    'Manufacturing',
    'Retail',
    'Healthcare',
    'Finance',
    'Education',
    'Construction',
    'Agriculture',
    'Tourism',
    'Other'
  ];

  const companySizes = [
    { value: 'micro', label: 'Микро (1-9 сотрудников)' },
    { value: 'small', label: 'Малое (10-49 сотрудников)' },
    { value: 'medium', label: 'Среднее (50-249 сотрудников)' },
    { value: 'large', label: 'Крупное (250+ сотрудников)' }
  ];

  const currencies = [
    { value: 'KZT', label: 'Тенге (₸)' },
    { value: 'USD', label: 'Доллар ($)' },
    { value: 'EUR', label: 'Евро (€)' },
    { value: 'RUB', label: 'Рубль (₽)' }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCompany(company);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCompany(company);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editedCompany) return;

    try {
      setSaveError(null);
      
      // Validation
      if (!editedCompany.name.trim()) {
        throw new Error('Название компании обязательно');
      }
      
      if (!editedCompany.legalName.trim()) {
        throw new Error('Юридическое название обязательно');
      }

      // Mock save - in real app, call API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateCompany(editedCompany);
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Ошибка сохранения');
    }
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    if (!editedCompany) return;
    
    const value = event.target.value;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedCompany(prev => prev ? {
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      } : null);
    } else {
      setEditedCompany(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleSettingsChange = (setting: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editedCompany) return;
    
    const value = event.target.checked;
    const [parent, child] = setting.split('.');
    
    setEditedCompany(prev => prev ? {
      ...prev,
      settings: {
        ...prev.settings,
        [parent]: {
          ...prev.settings[parent as keyof typeof prev.settings],
          [child]: value
        }
      }
    } : null);
  };

  if (!company || !editedCompany) {
    return (
      <Card>
        <CardContent>
          <Typography>Загрузка профиля компании...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Профиль компании успешно обновлен
        </Alert>
      )}
      
      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                <Business sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {company.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {company.industry} • {companySizes.find(s => s.value === company.size)?.label}
                </Typography>
              </Box>
            </Box>
            
            {canEdit && (
              <Box>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                  >
                    Редактировать
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Save />}
                      onClick={handleSave}
                    >
                      Сохранить
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                    >
                      Отмена
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business /> Основная информация
              </Typography>
              
              <TextField
                fullWidth
                label="Название компании"
                value={editedCompany.name}
                onChange={handleInputChange('name')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Юридическое название"
                value={editedCompany.legalName}
                onChange={handleInputChange('legalName')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="ИИН/БИН"
                value={editedCompany.taxId}
                onChange={handleInputChange('taxId')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Регистрационный номер"
                value={editedCompany.registrationNumber}
                onChange={handleInputChange('registrationNumber')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Отрасль</InputLabel>
                <Select
                  value={editedCompany.industry}
                  onChange={handleInputChange('industry')}
                  disabled={!isEditing}
                  label="Отрасль"
                >
                  {industries.map(industry => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Размер компании</InputLabel>
                <Select
                  value={editedCompany.size}
                  onChange={handleInputChange('size')}
                  disabled={!isEditing}
                  label="Размер компании"
                >
                  {companySizes.map(size => (
                    <MenuItem key={size.value} value={size.value}>
                      {size.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Валюта</InputLabel>
                <Select
                  value={editedCompany.currency}
                  onChange={handleInputChange('currency')}
                  disabled={!isEditing}
                  label="Валюта"
                >
                  {currencies.map(currency => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Контактная информация
              </Typography>
              
              <TextField
                fullWidth
                label="Адрес"
                value={editedCompany.address.street}
                onChange={handleInputChange('address.street')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Город"
                value={editedCompany.address.city}
                onChange={handleInputChange('address.city')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Страна"
                value={editedCompany.address.country}
                onChange={handleInputChange('address.country')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Почтовый код"
                value={editedCompany.address.postalCode}
                onChange={handleInputChange('address.postalCode')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Веб-сайт"
                value={editedCompany.website || ''}
                onChange={handleInputChange('website')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Телефон"
                value={editedCompany.phone || ''}
                onChange={handleInputChange('phone')}
                disabled={!isEditing}
              />
            </Grid>

            {/* Settings */}
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Настройки уведомлений
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedCompany.settings.notifications.email}
                        onChange={handleSettingsChange('notifications.email')}
                        disabled={!isEditing}
                      />
                    }
                    label="Email уведомления"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedCompany.settings.notifications.weeklyReport}
                        onChange={handleSettingsChange('notifications.weeklyReport')}
                        disabled={!isEditing}
                      />
                    }
                    label="Еженедельный отчет"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedCompany.settings.notifications.budgetAlerts}
                        onChange={handleSettingsChange('notifications.budgetAlerts')}
                        disabled={!isEditing}
                      />
                    }
                    label="Уведомления о бюджете"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedCompany.settings.notifications.goalAlerts}
                        onChange={handleSettingsChange('notifications.goalAlerts')}
                        disabled={!isEditing}
                      />
                    }
                    label="Уведомления о целях"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Company Info */}
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Дополнительная информация
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  icon={<Business />} 
                  label={`Создано: ${new Date(company.createdAt).toLocaleDateString('ru-RU')}`}
                  variant="outlined" 
                />
                <Chip 
                  icon={<TaxiAlert />} 
                  label={`Финансовый год: с ${company.fiscalYearStart}`}
                  variant="outlined" 
                />
                <Chip 
                  icon={<Language />} 
                  label={`Язык: ${company.settings.language.toUpperCase()}`}
                  variant="outlined" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanyProfile;