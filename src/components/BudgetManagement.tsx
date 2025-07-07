import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  Assessment,
  DateRange,
  MonetizationOn
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Budget, BudgetCategory, FinancialGoal, Transaction } from '../types';
import { formatCurrency } from '../utils/formatting';

interface BudgetManagementProps {
  transactions: Transaction[];
}

const BudgetManagement: React.FC<BudgetManagementProps> = ({ transactions }) => {
  const { company, hasPermission } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    name: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    categories: []
  });
  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    name: '',
    description: '',
    type: 'revenue',
    targetAmount: 0,
    targetDate: ''
  });

  const canManage = hasPermission('budget', 'manage');
  const canEdit = hasPermission('budget', 'write');

  // Mock data - в реальном приложении загружать с сервера
  useEffect(() => {
    const mockBudgets: Budget[] = [
      {
        id: 'budget_1',
        name: 'Квартальный бюджет Q1 2024',
        period: 'quarterly',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        status: 'active',
        createdBy: 'user_1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        categories: [
          {
            categoryId: 'revenue',
            budgetedAmount: 5000000,
            actualAmount: 3200000,
            variance: -1800000,
            variancePercentage: -36
          },
          {
            categoryId: 'salary',
            budgetedAmount: 2000000,
            actualAmount: 1950000,
            variance: 50000,
            variancePercentage: 2.5
          },
          {
            categoryId: 'office',
            budgetedAmount: 500000,
            actualAmount: 620000,
            variance: -120000,
            variancePercentage: -24
          }
        ]
      }
    ];

    const mockGoals: FinancialGoal[] = [
      {
        id: 'goal_1',
        name: 'Увеличение выручки на 25%',
        description: 'Достичь месячной выручки 2,000,000 тенге к концу квартала',
        type: 'revenue',
        targetAmount: 2000000,
        currentAmount: 1600000,
        targetDate: '2024-03-31',
        status: 'in_progress',
        createdBy: 'user_1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ];

    setBudgets(mockBudgets);
    setGoals(mockGoals);
  }, []);

  const calculateActualAmounts = (budget: Budget): Budget => {
    // Рассчитываем фактические суммы на основе транзакций
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);
    
    const relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= budgetStart && transactionDate <= budgetEnd;
    });

    const updatedCategories = budget.categories.map(category => {
      const categoryTransactions = relevantTransactions.filter(t => 
        t.category.toLowerCase().includes(category.categoryId.toLowerCase())
      );
      
      const actualAmount = categoryTransactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      );
      
      const variance = actualAmount - category.budgetedAmount;
      const variancePercentage = category.budgetedAmount !== 0 
        ? (variance / category.budgetedAmount) * 100 
        : 0;

      return {
        ...category,
        actualAmount,
        variance,
        variancePercentage
      };
    });

    return {
      ...budget,
      categories: updatedCategories
    };
  };

  const handleCreateBudget = () => {
    if (!newBudget.name || !newBudget.startDate || !newBudget.endDate) {
      return;
    }

    const budget: Budget = {
      id: 'budget_' + Date.now(),
      name: newBudget.name,
      period: newBudget.period || 'monthly',
      startDate: newBudget.startDate,
      endDate: newBudget.endDate,
      status: 'draft',
      createdBy: 'user_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: []
    };

    setBudgets(prev => [...prev, budget]);
    setIsCreateDialogOpen(false);
    setNewBudget({
      name: '',
      period: 'monthly',
      startDate: '',
      endDate: '',
      categories: []
    });
  };

  const handleCreateGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      return;
    }

    const goal: FinancialGoal = {
      id: 'goal_' + Date.now(),
      name: newGoal.name,
      description: newGoal.description || '',
      type: newGoal.type || 'revenue',
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      targetDate: newGoal.targetDate,
      status: 'in_progress',
      createdBy: 'user_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGoals(prev => [...prev, goal]);
    setIsGoalDialogOpen(false);
    setNewGoal({
      name: '',
      description: '',
      type: 'revenue',
      targetAmount: 0,
      targetDate: ''
    });
  };

  const getBudgetProgress = (budget: Budget) => {
    const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
    const totalActual = budget.categories.reduce((sum, cat) => sum + cat.actualAmount, 0);
    const progress = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    return { progress, totalBudgeted, totalActual };
  };

  const getGoalProgress = (goal: FinancialGoal) => {
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'success';
    if (variance < -0.1) return 'error';
    return 'warning';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Управление бюджетами
        </Typography>
        {canManage && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Создать бюджет
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => setIsGoalDialogOpen(true)}
            >
              Добавить цель
            </Button>
          </Box>
        )}
      </Box>

      {/* Финансовые цели */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Финансовые цели
          </Typography>
          <Grid container spacing={2}>
            {goals.map(goal => {
              const progress = getGoalProgress(goal);
              const isOverdue = new Date(goal.targetDate) < new Date() && goal.status === 'in_progress';
              
              return (
                <Grid item xs={12} md={6} key={goal.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {goal.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {goal.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={goal.status === 'in_progress' ? 'В процессе' : 'Завершено'}
                          color={isOverdue ? 'error' : 'primary'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </Typography>
                          <Typography variant="body2">
                            {Math.round(progress)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{ height: 8, borderRadius: 4 }}
                          color={progress >= 100 ? 'success' : isOverdue ? 'error' : 'primary'}
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        Срок: {new Date(goal.targetDate).toLocaleDateString('ru-RU')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Список бюджетов */}
      <Grid container spacing={3}>
        {budgets.map(budget => {
          const updatedBudget = calculateActualAmounts(budget);
          const { progress, totalBudgeted, totalActual } = getBudgetProgress(updatedBudget);
          
          return (
            <Grid item xs={12} lg={6} key={budget.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {budget.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(budget.startDate).toLocaleDateString('ru-RU')} - {new Date(budget.endDate).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={budget.status === 'active' ? 'Активный' : 'Черновик'}
                        color={budget.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                      {canEdit && (
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Исполнение бюджета
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progress, 100)}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      color={progress > 100 ? 'error' : progress > 80 ? 'warning' : 'success'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(totalActual)} / {formatCurrency(totalBudgeted)}
                    </Typography>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Категория</TableCell>
                          <TableCell align="right">План</TableCell>
                          <TableCell align="right">Факт</TableCell>
                          <TableCell align="right">Отклонение</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {updatedBudget.categories.slice(0, 3).map((category, index) => (
                          <TableRow key={index}>
                            <TableCell>{category.categoryId}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(category.budgetedAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(category.actualAmount)}
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {category.variance > 0 ? (
                                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                                ) : (
                                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                                )}
                                <Typography
                                  variant="body2"
                                  color={category.variance > 0 ? 'success.main' : 'error.main'}
                                >
                                  {Math.round(category.variancePercentage)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => setSelectedBudget(updatedBudget)}
                  >
                    Подробнее
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Диалог создания бюджета */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новый бюджет</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название бюджета"
            value={newBudget.name}
            onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Период</InputLabel>
            <Select
              value={newBudget.period}
              onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as any }))}
              label="Период"
            >
              <MenuItem value="monthly">Месячный</MenuItem>
              <MenuItem value="quarterly">Квартальный</MenuItem>
              <MenuItem value="yearly">Годовой</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="date"
            label="Дата начала"
            value={newBudget.startDate}
            onChange={(e) => setNewBudget(prev => ({ ...prev, startDate: e.target.value }))}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            type="date"
            label="Дата окончания"
            value={newBudget.endDate}
            onChange={(e) => setNewBudget(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateBudget} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания цели */}
      <Dialog open={isGoalDialogOpen} onClose={() => setIsGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать финансовую цель</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название цели"
            value={newGoal.name}
            onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            fullWidth
            label="Описание"
            value={newGoal.description}
            onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Тип цели</InputLabel>
            <Select
              value={newGoal.type}
              onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as any }))}
              label="Тип цели"
            >
              <MenuItem value="revenue">Увеличение выручки</MenuItem>
              <MenuItem value="profit">Увеличение прибыли</MenuItem>
              <MenuItem value="expense_reduction">Снижение расходов</MenuItem>
              <MenuItem value="cash_flow">Улучшение денежного потока</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Целевая сумма"
            value={newGoal.targetAmount}
            onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <MonetizationOn />
            }}
          />

          <TextField
            fullWidth
            type="date"
            label="Дата достижения"
            value={newGoal.targetDate}
            onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGoalDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateGoal} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetManagement;