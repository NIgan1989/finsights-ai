import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultsDashboardProps {
  model: any;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ model, onExportExcel, onExportPDF }) => {
  // Извлечение данных из модели для графиков
  const extractModelData = () => {
    if (!model?.sheets) return null;

    const revenueSheet = model.sheets.find((s: any) => s.type === 'revenue');
    const expensesSheet = model.sheets.find((s: any) => s.type === 'expenses');
    const pnlSheet = model.sheets.find((s: any) => s.type === 'pnl');
    const assumptionsSheet = model.sheets.find((s: any) => s.type === 'assumptions');

    // Извлекаем годовые данные
    const getYearlyData = (sheet: any) => {
      if (!sheet?.data) return [];
      
      const years = ['Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'];
      const data = [];
      
      for (let yearIndex = 0; yearIndex < 5; yearIndex++) {
        const yearData = { year: years[yearIndex] };
        
        sheet.data.forEach((row: any[], rowIndex: number) => {
          if (rowIndex === 0) return; // Пропускаем заголовок
          
          const label = row[0];
          const value = row[yearIndex + 1];
          
          if (label && value !== undefined) {
            // Преобразуем в число, если возможно
            let numValue = 0;
            if (typeof value === 'string') {
              const cleanValue = value.replace(/[^\d.-]/g, '');
              numValue = parseFloat(cleanValue) || 0;
            } else if (typeof value === 'number') {
              numValue = value;
            }
            
            (yearData as any)[label] = numValue;
          }
        });
        
        data.push(yearData);
      }
      
      return data;
    };

    return {
      revenue: getYearlyData(revenueSheet),
      expenses: getYearlyData(expensesSheet),
      pnl: getYearlyData(pnlSheet),
      assumptions: assumptionsSheet?.data || []
    };
  };

  const modelData = extractModelData();

  // Подготовка данных для финансового графика
  const getFinancialChartData = () => {
    if (!modelData) return [];
    
    const years = ['Год 1', 'Год 2', 'Год 3', 'Год 4', 'Год 5'];
    return years.map(year => {
      const revenueYear = modelData.revenue.find(r => r.year === year);
      const expensesYear = modelData.expenses.find(e => e.year === year);
      const pnlYear = modelData.pnl.find(p => p.year === year);
      
      // Суммируем доходы и расходы
      const totalRevenue = Object.values(revenueYear || {})
        .filter(v => typeof v === 'number')
        .reduce((sum: number, val) => sum + (val as number), 0);
        
      const totalExpenses = Object.values(expensesYear || {})
        .filter(v => typeof v === 'number')
        .reduce((sum: number, val) => sum + (val as number), 0);
        
      const profit = totalRevenue - totalExpenses;
      
      return {
        year: year.replace('Год ', ''),
        revenue: Math.round(totalRevenue / 1000000), // В миллионах
        expenses: Math.round(totalExpenses / 1000000),
        profit: Math.round(profit / 1000000),
        margin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0
      };
    });
  };

  // Данные для диаграммы структуры расходов
  const getExpensesBreakdown = () => {
    if (!modelData?.expenses || modelData.expenses.length === 0) return [];
    
    const firstYear = modelData.expenses[0];
    const breakdown: any[] = [];
    
    Object.entries(firstYear).forEach(([key, value]) => {
      if (key !== 'year' && typeof value === 'number' && value > 0) {
        breakdown.push({
          name: key,
          value: Math.round(value / 1000000), // В миллионах
          percent: 0 // Будет рассчитан ниже
        });
      }
    });
    
    const total = breakdown.reduce((sum, item) => sum + item.value, 0);
    breakdown.forEach(item => {
      item.percent = Math.round((item.value / total) * 100);
    });
    
    return breakdown.slice(0, 6); // Топ-6 категорий
  };

  const chartData = getFinancialChartData();
  const expensesBreakdown = getExpensesBreakdown();

  // Цвета для графиков
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // KPI метрики
  const getKPIs = () => {
    if (chartData.length === 0) return null;
    
    const lastYear = chartData[chartData.length - 1];
    const firstYear = chartData[0];
    
    const revenueGrowth = firstYear.revenue > 0 
      ? Math.round(((lastYear.revenue - firstYear.revenue) / firstYear.revenue) * 100)
      : 0;
      
    const avgMargin = Math.round(chartData.reduce((sum, year) => sum + year.margin, 0) / chartData.length);
    
    return {
      totalRevenue: lastYear.revenue,
      totalProfit: lastYear.profit,
      avgMargin,
      revenueGrowth,
      breakEven: chartData.findIndex(year => year.profit > 0) + 1 || 'Н/Д'
    };
  };

  const kpis = getKPIs();

  if (!modelData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-4">📊 Результаты модели</h3>
        <p>Недостаточно данных для отображения результатов</p>
        <p className="text-sm mt-2">Заполните листы "Выручка", "Расходы" и "Отчет о прибылях и убытках"</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Заголовок и экспорт */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Результаты модели</h1>
          <p className="text-gray-600 dark:text-gray-400">{model.name || 'Финансовая модель'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 Excel отчет
          </button>
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            📄 PDF отчет
          </button>
        </div>
      </div>

      {/* KPI метрики */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Выручка (5-й год)</h3>
            <p className="text-2xl font-bold text-blue-600">{kpis.totalRevenue}M тг</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Прибыль (5-й год)</h3>
            <p className="text-2xl font-bold text-green-600">{kpis.totalProfit}M тг</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Средняя маржа</h3>
            <p className="text-2xl font-bold text-purple-600">{kpis.avgMargin}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Рост выручки</h3>
            <p className="text-2xl font-bold text-orange-600">{kpis.revenueGrowth}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Безубыточность</h3>
            <p className="text-2xl font-bold text-teal-600">{kpis.breakEven} год</p>
          </div>
        </div>
      )}

      {/* Основной финансовый график */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          💰 Финансовые показатели по годам
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis label={{ value: 'млн тенге', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} млн тг`, '']} />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" name="Выручка" />
            <Bar dataKey="expenses" fill="#EF4444" name="Расходы" />
            <Bar dataKey="profit" fill="#10B981" name="Прибыль" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График маржинальности */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            📈 Рентабельность по годам
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value}%`, 'Маржа']} />
              <Line 
                type="monotone" 
                dataKey="margin" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Структура расходов */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🥧 Структура расходов (1-й год)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expensesBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} млн тг`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Детальная таблица показателей */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📋 Детальные показатели
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Показатель</th>
                {chartData.map(year => (
                  <th key={year.year} className="text-right p-3 font-semibold text-gray-900 dark:text-white">
                    {year.year} год
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">Выручка (млн тг)</td>
                {chartData.map(year => (
                  <td key={year.year} className="p-3 text-right text-blue-600 font-semibold">
                    {year.revenue.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">Расходы (млн тг)</td>
                {chartData.map(year => (
                  <td key={year.year} className="p-3 text-right text-red-600 font-semibold">
                    {year.expenses.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">Прибыль (млн тг)</td>
                {chartData.map(year => (
                  <td key={year.year} className={`p-3 text-right font-semibold ${year.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {year.profit.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-gray-900 dark:text-white">Маржинальность (%)</td>
                {chartData.map(year => (
                  <td key={year.year} className="p-3 text-right text-purple-600 font-semibold">
                    {year.margin}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Рекомендации */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          💡 Аналитические выводы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">✅ Сильные стороны:</h3>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              {kpis?.revenueGrowth && kpis.revenueGrowth > 0 && <li>• Положительная динамика роста выручки</li>}
              {kpis?.avgMargin && kpis.avgMargin > 10 && <li>• Хорошая рентабельность бизнеса</li>}
              {kpis?.breakEven !== 'Н/Д' && typeof kpis?.breakEven === 'number' && kpis.breakEven <= 3 && <li>• Быстрый выход на безубыточность</li>}
              <li>• Структурированная финансовая модель</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-orange-600">⚠️ Рекомендации:</h3>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              {kpis?.avgMargin && kpis.avgMargin < 10 && <li>• Пересмотреть структуру затрат</li>}
              {kpis?.revenueGrowth && kpis.revenueGrowth < 0 && <li>• Проанализировать причины снижения выручки</li>}
              <li>• Регулярно обновлять прогнозы</li>
              <li>• Отслеживать ключевые метрики</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard; 