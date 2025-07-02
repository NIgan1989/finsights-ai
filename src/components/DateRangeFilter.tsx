import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Typography, FormControl, RadioGroup, FormControlLabel, Radio, Box } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useDateRange } from '../contexts/DateRangeContext';
import dayjs, { Dayjs } from 'dayjs';

const DateRangeFilter: React.FC = () => {
  const { t } = useTranslation();
  const { setDateRange } = useDateRange();
  const [value, setValue] = useState<'all' | 'custom'>('all');
  const [customStart, setCustomStart] = useState<Dayjs | null>(null);
  const [customEnd, setCustomEnd] = useState<Dayjs | null>(null);

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value as 'all' | 'custom';
    setValue(newValue);
    if (newValue === 'all') {
      setDateRange({ startDate: null, endDate: null });
    } else {
      if (customStart && customEnd) {
        setDateRange({ startDate: customStart.toDate(), endDate: customEnd.toDate() });
      }
    }
  };

  const handleDateChange = (start: Dayjs | null, end: Dayjs | null) => {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end && value === 'custom') {
      setDateRange({ startDate: start.toDate(), endDate: end.toDate() });
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{t('date_range.title')}</Typography>
        <FormControl component="fieldset">
          <RadioGroup row value={value} onChange={handleRadioChange}>
            <FormControlLabel value="all" control={<Radio />} label={t('all_time')} />
            <FormControlLabel value="custom" control={<Radio />} label={t('custom_range')} />
          </RadioGroup>
        </FormControl>
        {value === 'custom' && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <DatePicker
                label={t('date_range.start_date')}
                value={customStart}
                onChange={(newValue) => handleDateChange(newValue, customEnd)}
              />
              <DatePicker
                label={t('date_range.end_date')}
                value={customEnd}
                onChange={(newValue) => handleDateChange(customStart, newValue)}
              />
            </Box>
          </LocalizationProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
