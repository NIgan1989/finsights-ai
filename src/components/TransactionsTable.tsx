import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Tooltip, IconButton, Checkbox, FormControlLabel, Button,
    Select, MenuItem, FormControl, InputLabel, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Card, CardContent, Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    ShoppingCart as ShoppingCartIcon,
    Payments as PaymentsIcon,
    CreditCard as CreditCardIcon,
    AccountBalance as AccountBalanceIcon,
    Home as HomeIcon,
    DirectionsCar as CarIcon,
    LocalHospital as HealthIcon,
    Restaurant as FoodIcon,
    School as EducationIcon,
    FlightTakeoff as TravelIcon,
    Devices as TechIcon,
    Redeem as GiftIcon
} from '@mui/icons-material';
import { Transaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { useTranslation } from 'react-i18next';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridToolbar
} from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../utils/formatting';

interface TransactionsTableProps {
    transactions: Transaction[];
    onUpdateTransaction: (originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onUpdateTransaction }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [applyToAll, setApplyToAll] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [dateRangeFilter, setDateRangeFilter] = useState({
        startDate: '',
        endDate: ''
    });

    // Обработчик для редактирования транзакции
    const handleEdit = (transaction: Transaction) => {
        setEditTransaction(transaction);
        setEditDescription(transaction.description);
        setEditCategory(transaction.category);
        setApplyToAll(false);
        setEditDialogOpen(true);
    };

    // Сохранение изменений транзакции
    const handleSave = () => {
        if (editTransaction) {
            onUpdateTransaction(
                editTransaction,
                { description: editDescription, category: editCategory },
                applyToAll
            );
        }
        setEditDialogOpen(false);
    };

    // Получение иконки для категории транзакции
    const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
        if (type === 'income') {
            switch (category.toLowerCase()) {
                case 'зарплата':
                case 'основная выручка':
                    return <PaymentsIcon fontSize="small" />;
                case 'инвестиции':
                    return <TrendingUpIcon fontSize="small" />;
                case 'возврат':
                    return <CreditCardIcon fontSize="small" />;
                default:
                    return <ArrowUpIcon fontSize="small" />;
            }
        } else {
            // Иконки для расходов
            switch (category.toLowerCase()) {
                case 'продукты':
                    return <FoodIcon fontSize="small" />;
                case 'жилье':
                case 'аренда':
                    return <HomeIcon fontSize="small" />;
                case 'транспорт':
                    return <CarIcon fontSize="small" />;
                case 'здоровье':
                    return <HealthIcon fontSize="small" />;
                case 'образование':
                    return <EducationIcon fontSize="small" />;
                case 'путешествия':
                    return <TravelIcon fontSize="small" />;
                case 'техника':
                    return <TechIcon fontSize="small" />;
                case 'подарки':
                    return <GiftIcon fontSize="small" />;
                case 'покупки':
                    return <ShoppingCartIcon fontSize="small" />;
                default:
                    return <ArrowDownIcon fontSize="small" />;
            }
        }
    };

    // Стиль для строк в зависимости от типа транзакции
    const getRowClassName = (params: any) => {
        if (!params?.row) return '';

        // Базовый класс для строк, требующих уточнения
        const clarificationClass = params.row.needsClarification ? 'needs-clarification' : '';

        // Добавляем класс в зависимости от типа транзакции
        const typeClass = params.row.type === 'income' ? 'income-row' : 'expense-row';

        return `${clarificationClass} ${typeClass}`;
    };

    // Получение списка категорий для редактируемой транзакции
    const categories = editTransaction?.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    // Фильтрация транзакций по категории и датам
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            // Фильтр по категории
            if (categoryFilter && transaction.category !== categoryFilter) {
                return false;
            }

            // Фильтр по диапазону дат
            const transactionDate = new Date(transaction.date);
            if (dateRangeFilter.startDate && new Date(dateRangeFilter.startDate) > transactionDate) {
                return false;
            }
            if (dateRangeFilter.endDate && new Date(dateRangeFilter.endDate) < transactionDate) {
                return false;
            }

            return true;
        });
    }, [transactions, categoryFilter, dateRangeFilter]);

    // Все уникальные категории из транзакций
    const uniqueCategories = useMemo(() => {
        const categories = new Set<string>();
        transactions.forEach(tx => categories.add(tx.category));
        return Array.from(categories);
    }, [transactions]);

    // Определение колонок для DataGrid
    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'date',
            headerName: t('date'),
            flex: 1,
            minWidth: 120,
            valueFormatter: (params: any) => {
                if (!params?.value) return '';
                try {
                    return new Date(params.value.toString()).toLocaleDateString();
                } catch (e) {
                    console.error('Ошибка форматирования даты:', e);
                    return params.value.toString();
                }
            },
        },
        {
            field: 'description',
            headerName: t('description'),
            flex: 2,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.row) return null;
                const isIncome = params.row.type === 'income';
                const needsClarification = params.row.needsClarification as boolean;

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box
                            sx={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isIncome ? theme.palette.success.main : theme.palette.error.main,
                                marginRight: 1
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                color: isIncome ? theme.palette.success.dark : theme.palette.error.dark,
                                fontWeight: needsClarification ? 'medium' : 'normal'
                            }}
                        >
                            {params.value as string}
                        </Typography>
                        {needsClarification && (
                            <Tooltip title={t('needs_clarification')}>
                                <WarningIcon
                                    fontSize="small"
                                    sx={{
                                        color: theme.palette.warning.main,
                                        ml: 1
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
        {
            field: 'amount',
            headerName: t('amount'),
            flex: 1,
            minWidth: 120,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.row) return null;
                const amount = params.row.amount as number;
                const isIncome = params.row.type === 'income';

                return (
                    <Tooltip title={isIncome ? t('income') : t('expense')}>
                        <Box sx={{
                            color: isIncome ? theme.palette.success.main : theme.palette.error.main,
                            fontWeight: 'medium',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {isIncome ?
                                <ArrowUpIcon fontSize="small" color="success" /> :
                                <ArrowDownIcon fontSize="small" color="error" />
                            }
                            {isIncome ? '+' : '-'}
                            {formatCurrency(Math.abs(amount))}
                        </Box>
                    </Tooltip>
                );
            },
        },
        {
            field: 'category',
            headerName: t('category'),
            flex: 1,
            minWidth: 150,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.row) return null;
                const isIncome = params.row.type === 'income';
                const transactionType = params.row.transactionType as string;
                const category = params.value as string;

                // Получаем иконку для категории
                const categoryIcon = getCategoryIcon(category, isIncome ? 'income' : 'expense');

                // Получаем текст подсказки для типа деятельности
                const getTransactionTypeTooltip = () => {
                    switch (transactionType) {
                        case 'operating':
                            return t('operating_activity');
                        case 'investing':
                            return t('investing_activity');
                        case 'financing':
                            return t('financing_activity');
                        default:
                            return '';
                    }
                };

                return (
                    <Tooltip title={`${category} (${getTransactionTypeTooltip()})`}>
                        <Chip
                            icon={categoryIcon}
                            label={category}
                            size="small"
                            sx={{
                                backgroundColor: isIncome ? `${theme.palette.success.main}20` : `${theme.palette.error.main}20`,
                                color: isIncome ? theme.palette.success.dark : theme.palette.error.dark,
                                fontWeight: 'medium',
                                '& .MuiChip-icon': {
                                    color: isIncome ? theme.palette.success.dark : theme.palette.error.dark
                                }
                            }}
                        />
                    </Tooltip>
                );
            },
        },
        {
            field: 'actions',
            headerName: t('actions'),
            width: 100,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.row) return null;
                return (
                    <Tooltip title={t('edit')}>
                        <IconButton onClick={() => handleEdit(params.row as Transaction)}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                );
            },
            sortable: false,
            filterable: false,
        },
    ], [t, theme.palette.error.main, theme.palette.success.main]);

    return (
        <>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>{t('filters')}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>{t('category')}</InputLabel>
                            <Select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as string)}
                                label={t('category')}
                                displayEmpty
                            >
                                <MenuItem value="">{t('all_categories')}</MenuItem>
                                {uniqueCategories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label={t('start_date')}
                            type="date"
                            value={dateRangeFilter.startDate}
                            onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, startDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label={t('end_date')}
                            type="date"
                            value={dateRangeFilter.endDate}
                            onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <Button
                            variant="outlined"
                            onClick={() => {
                                setCategoryFilter('');
                                setDateRangeFilter({ startDate: '', endDate: '' });
                            }}
                        >
                            {t('reset_filters')}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{t('transactions')}</Typography>
                <Typography variant="body2">
                    {t('showing')} {filteredTransactions.length} {t('of')} {transactions.length} {t('transactions')}
                </Typography>
            </Box>

            <Paper sx={{ width: '100%', height: '70vh' }}>
                <DataGrid
                    rows={filteredTransactions}
                    columns={columns}
                    density="standard"
                    disableRowSelectionOnClick
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25, page: 0 },
                        },
                        sorting: {
                            sortModel: [{ field: 'date', sort: 'desc' }],
                        },
                    }}
                    getRowClassName={getRowClassName}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }}
                    sx={{
                        '& .needs-clarification': {
                            backgroundColor: `${theme.palette.warning.main}20`,
                        },
                        '& .income-row': {
                            backgroundColor: `${theme.palette.success.main}05`,
                            '&:hover': {
                                backgroundColor: `${theme.palette.success.main}10`,
                            },
                            '& .MuiDataGrid-cell:first-of-type': {
                                borderLeft: `3px solid ${theme.palette.success.main}`,
                            }
                        },
                        '& .expense-row': {
                            backgroundColor: `${theme.palette.error.main}05`,
                            '&:hover': {
                                backgroundColor: `${theme.palette.error.main}10`,
                            },
                            '& .MuiDataGrid-cell:first-of-type': {
                                borderLeft: `3px solid ${theme.palette.error.main}`,
                            }
                        },
                        '& .MuiDataGrid-cell:focus-within': {
                            outline: 'none',
                        },
                    }}
                />
            </Paper>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('edit_transaction')}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('description')}
                        fullWidth
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>{t('category')}</InputLabel>
                        <Select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as string)}
                            label={t('category')}
                        >
                            {categories?.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={<Checkbox checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />}
                        label={t('apply_to_all_similar')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={handleSave} variant="contained">{t('save')}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TransactionsTable;