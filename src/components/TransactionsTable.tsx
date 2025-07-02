import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
    TextField, Toolbar, Typography, Collapse, IconButton, Checkbox, FormControlLabel, Button,
    Select, MenuItem, FormControl, InputLabel, Chip, TablePagination, Card, CardHeader, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Switch, FormGroup
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Edit as EditIcon } from '@mui/icons-material';
import { Transaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { useTranslation } from 'react-i18next';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { formatCurrency } from '../utils/formatting';
import VirtualList from './VirtualList';

type Order = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    const valA = a[orderBy];
    const valB = b[orderBy];

    // Special handling for dates
    if (orderBy === 'date' && typeof valA === 'string' && typeof valB === 'string') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        if (dateB < dateA) return -1;
        if (dateB > dateA) return 1;
        return 0;
    }

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
}

function getComparator<Key extends keyof Transaction>(
    order: Order,
    orderBy: Key,
): (a: Transaction, b: Transaction) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells: { id: keyof Transaction; label: string; numeric: boolean }[] = [
    { id: 'date', numeric: false, label: 'Date' },
    { id: 'description', numeric: false, label: 'Description' },
    { id: 'category', numeric: false, label: 'Category' },
    { id: 'amount', numeric: true, label: 'Amount' },
];

const ClarificationForm: React.FC<{
    transaction: Transaction;
    onSave: (updates: { description: string; category: string; }, applyToAll: boolean) => void;
    onCancel: () => void;
}> = ({ transaction, onSave, onCancel }) => {
    const [description, setDescription] = useState(transaction.description);
    const [category, setCategory] = useState(transaction.category);
    const [applyToAll, setApplyToAll] = useState(true);

    const categoryList = useMemo(() => (transaction.amount < 0 ? EXPENSE_CATEGORIES : INCOME_CATEGORIES), [transaction.amount]);

    const handleSave = () => {
        if (!description.trim() || !category.trim()) return;
        onSave({ description, category }, applyToAll);
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="h6" gutterBottom>Edit Transaction</Typography>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    variant="outlined"
                    fullWidth
                />
                <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                        value={category}
                        label="Category"
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {categoryList.map(cat => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControlLabel
                    control={<Checkbox checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />}
                    label="Apply to all similar transactions"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1 }}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </Box>
            </Box>
        </Box>
    );
};

const Row: React.FC<{
    row: Transaction;
    onUpdateTransaction: (originalTx: Transaction, updates: { description: string; category: string; }, applyToAll: boolean) => void;
}> = ({ row, onUpdateTransaction }) => {
    const [open, setOpen] = useState(false);

    const handleSave = (updates: { description: string; category: string }, applyToAll: boolean) => {
        onUpdateTransaction(row, updates, applyToAll);
        setOpen(false);
    };

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell><Chip label={row.category} size="small" /></TableCell>
                <TableCell align="right" sx={{ color: row.amount < 0 ? 'error.main' : 'success.main' }}>
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT' }).format(row.amount)}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <ClarificationForm
                            transaction={row}
                            onSave={handleSave}
                            onCancel={() => setOpen(false)}
                        />
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

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
    const [useVirtualList, setUseVirtualList] = useState(transactions.length > 100);

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'date',
            headerName: t('date'),
            flex: 1,
            minWidth: 120,
        },
        {
            field: 'description',
            headerName: t('description'),
            flex: 2,
            minWidth: 200,
        },
        {
            field: 'amount',
            headerName: t('amount'),
            flex: 1,
            minWidth: 120,
            renderCell: (params: GridRenderCellParams<Transaction>) => {
                const isExpense = params.row.type === 'expense';
                return (
                    <Box sx={{ color: isExpense ? theme.palette.error.main : theme.palette.success.main }}>
                        {isExpense ? '-' : '+'}{formatCurrency(params.value as number)}
                    </Box>
                );
            },
        },
        {
            field: 'category',
            headerName: t('category'),
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'actions',
            headerName: t('actions'),
            width: 100,
            renderCell: (params: GridRenderCellParams<Transaction>) => (
                <Tooltip title={t('edit')}>
                    <IconButton onClick={() => handleEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ], [t, theme.palette.error.main, theme.palette.success.main]);

    const handleEdit = (transaction: Transaction) => {
        setEditTransaction(transaction);
        setEditDescription(transaction.description);
        setEditCategory(transaction.category);
        setApplyToAll(false);
        setEditDialogOpen(true);
    };

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

    const getRowClassName = (params: any) => {
        return params.row.needsClarification ? 'needs-clarification' : '';
    };

    const categories = editTransaction?.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const renderVirtualizedTransactions = () => {
        return (
            <VirtualList
                items={transactions}
                rowHeight={53} // standard MUI TableRow height
                height={500}
                overscan={10}
                renderRow={(transaction, index) => (
                    <TableRow
                        key={transaction.id}
                        sx={{
                            backgroundColor: transaction.needsClarification
                                ? `${theme.palette.warning.main}20`
                                : 'inherit',
                            '&:nth-of-type(odd)': {
                                backgroundColor: (theme) =>
                                    transaction.needsClarification
                                        ? `${theme.palette.warning.main}20`
                                        : theme.palette.action.hover,
                            }
                        }}
                    >
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell sx={{
                            color: transaction.type === 'expense'
                                ? theme.palette.error.main
                                : theme.palette.success.main
                        }}>
                            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleEdit(transaction)}>
                                <EditIcon />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                )}
            />
        );
    };

    const renderDataGrid = () => {
        return (
            <DataGrid
                rows={transactions}
                columns={columns}
                autoHeight
                density="standard"
                disableRowSelectionOnClick
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 },
                    },
                }}
                getRowClassName={getRowClassName}
                sx={{
                    '& .needs-clarification': {
                        backgroundColor: `${theme.palette.warning.main}20`,
                    },
                }}
            />
        );
    };

    return (
        <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{t('transactions')}</Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={useVirtualList}
                                onChange={() => setUseVirtualList(!useVirtualList)}
                            />
                        }
                        label={t('use_virtual_list')}
                    />
                </FormGroup>
            </Box>

            {useVirtualList ? (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('date')}</TableCell>
                                <TableCell>{t('description')}</TableCell>
                                <TableCell>{t('amount')}</TableCell>
                                <TableCell>{t('category')}</TableCell>
                                <TableCell>{t('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderVirtualizedTransactions()}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Paper sx={{ width: '100%' }}>
                    {renderDataGrid()}
                </Paper>
            )}

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
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
                            onChange={(e) => setEditCategory(e.target.value)}
                            label={t('category')}
                        >
                            {categories.map((category) => (
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