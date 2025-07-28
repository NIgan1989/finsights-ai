import React, { useState, useCallback, useEffect } from 'react';
import EditableCell from './EditableCell';
import AIFinancialAssistant from './AIFinancialAssistant';
import FormulaBar from './FormulaBar';
import ModelGenerator from './ModelGenerator';
import TemplateGallery from './TemplateGallery';
import ContextMenu from './ContextMenu';
import ResultsDashboard from './ResultsDashboard';

interface FinancialTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  verified: boolean;
  industry: string;
  complexity: 'simple' | 'medium' | 'advanced';
  timeframe: string;
  features: string[];
  preview?: string;
}

interface FinancialModel {
  id: string;
  name: string;
  industry: string;
  template: string;
  assumptions: Record<string, any>;
  sheets: ModelSheet[];
  createdAt: string;
  lastModified: string;
}

interface ModelSheet {
  id: string;
  name: string;
  type: 'assumptions' | 'revenue' | 'expenses' | 'pnl' | 'cashflow' | 'balance' | 'results';
  icon: string;
  data: any[][];
  formulas: Record<string, string>;
  validations: Record<string, any>;
}

const FinancialPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'choose' | 'customize' | 'edit'>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<FinancialTemplate | null>(null);
  const [activeSheet, setActiveSheet] = useState('assumptions');
  const [currentModel, setCurrentModel] = useState<FinancialModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showModelGenerator, setShowModelGenerator] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [customBusiness, setCustomBusiness] = useState('');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [currentCell, setCurrentCell] = useState({ row: -1, col: -1, value: '' });

  // Состояния для улучшенного редактора
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    cellValue: string | number;
    rowIndex: number;
    colIndex: number;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    cellValue: '',
    rowIndex: 0,
    colIndex: 0
  });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedRow: number | null;
    targetRow: number | null;
  }>({
    isDragging: false,
    draggedRow: null,
    targetRow: null
  });

  // Готовые шаблоны в стиле finmodelbuilder
  const templates: FinancialTemplate[] = [
    {
      id: 'coffee-shop',
      name: 'Кафе / Кофейня',
      category: 'Ресторанный бизнес',
      description: 'Быстрый старт для небольшого кафе. Прибыльность и рентабельность.',
      icon: '☕',
      verified: true,
      industry: 'Food & Beverage',
      complexity: 'simple',
      timeframe: '3 года',
      features: ['P&L отчет', 'Cash Flow', 'Unit Economics', 'Сезонность'],
      preview: '/templates/coffee-shop-preview.png'
    },
    {
      id: 'saas-startup',
      name: 'SaaS Стартап',
      category: 'Технологии',
      description: '5-летний прогноз с подписочной моделью, LTV и CAC метрики.',
      icon: '💻',
      verified: true,
      industry: 'Technology',
      complexity: 'advanced',
      timeframe: '5 лет',
      features: ['Subscription Model', 'Churn Analysis', 'LTV/CAC', 'Fundraising'],
      preview: '/templates/saas-preview.png'
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      category: 'Интернет-торговля',
      description: 'Онлайн-магазин с учетом маркетинга, логистики и возвратов.',
      icon: '🛒',
      verified: true,
      industry: 'E-commerce',
      complexity: 'medium',
      timeframe: '3 года',
      features: ['Traffic & Conversion', 'Marketing ROI', 'Inventory', 'Returns'],
      preview: '/templates/ecommerce-preview.png'
    },
    {
      id: 'manufacturing',
      name: 'Производство',
      category: 'Промышленность',
      description: 'Производственная компания с CAPEX, амортизацией и операционными циклами.',
      icon: '🏭',
      verified: true,
      industry: 'Manufacturing',
      complexity: 'advanced',
      timeframe: '5 лет',
      features: ['CAPEX Planning', 'Depreciation', 'Working Capital', 'Capacity Planning'],
      preview: '/templates/manufacturing-preview.png'
    },
    {
      id: 'retail-store',
      name: 'Розничный магазин',
      category: 'Розничная торговля',
      description: 'Физический магазин с учетом аренды, персонала и товарооборота.',
      icon: '🏪',
      verified: true,
      industry: 'Retail',
      complexity: 'medium',
      timeframe: '3 года',
      features: ['Inventory Turnover', 'Foot Traffic', 'Seasonal Patterns', 'Staff Planning'],
      preview: '/templates/retail-preview.png'
    },
    {
      id: 'consulting',
      name: 'Консалтинг',
      category: 'Услуги',
      description: 'Консалтинговое агентство с почасовой оплатой и проектным планированием.',
      icon: '💼',
      verified: true,
      industry: 'Professional Services',
      complexity: 'simple',
      timeframe: '3 года',
      features: ['Hourly Billing', 'Project Planning', 'Utilization Rate', 'Team Scaling'],
      preview: '/templates/consulting-preview.png'
    }
  ];

  // ИИ-генерация модели
  const generateAIModel = async (businessDescription: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDescription,
          timeframe: 3,
          currency: 'KZT',
          language: 'ru'
        })
      });
      
      const aiModel = await response.json();
      
      const newModel: FinancialModel = {
        id: `ai-${Date.now()}`,
        name: `ИИ Модель: ${businessDescription}`,
        industry: aiModel.industry || 'Custom',
        template: 'ai-generated',
        assumptions: aiModel.assumptions || {},
        sheets: aiModel.sheets || [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      setCurrentModel(newModel);
      setCurrentStep('edit');
    } catch (error) {
      console.error('Error generating AI model:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Загрузка шаблона
  const loadTemplate = async (template: FinancialTemplate) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/templates/${template.id}`);
      const templateData = await response.json();
      
      const newModel: FinancialModel = {
        id: `template-${Date.now()}`,
        name: template.name,
        industry: template.industry,
        template: template.id,
        assumptions: templateData.assumptions || {},
        sheets: templateData.sheets || [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      setCurrentModel(newModel);
      setCurrentStep('edit');
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Функции экспорта
  const exportToExcel = async () => {
    if (!currentModel) return;

    try {
      // Добавляем лист результатов во временную модель для экспорта
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...currentModel.sheets,
          {
            id: 'results',
            name: 'Результаты и KPI',
            type: 'results',
            icon: '📊',
            data: generateResultsData()
          }
        ]
      };

      const response = await fetch('http://localhost:3001/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelWithResults)
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Читаем ответ как текст для CSV
        const csvText = await response.text();
        
        // Создаем Blob для CSV
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentModel.name}_финансовая_модель.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Excel export successful');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка экспорта');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Ошибка при экспорте в Excel: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const exportToPDF = async () => {
    if (!currentModel) return;

    try {
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...currentModel.sheets,
          {
            id: 'results',
            name: 'Результаты и KPI',
            type: 'results',
            icon: '📊',
            data: generateResultsData()
          }
        ]
      };

      const response = await fetch('http://localhost:3001/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelWithResults)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentModel.name}_финансовый_отчет.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('PDF export successful');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка создания PDF');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('❌ Ошибка при создании PDF отчета: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const exportToGoogleSheets = async () => {
    if (!currentModel) return;

    try {
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...currentModel.sheets,
          {
            id: 'results',
            name: 'Результаты и KPI',
            type: 'results',
            icon: '📊',
            data: generateResultsData()
          }
        ]
      };

      const response = await fetch('http://localhost:3001/api/export/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelWithResults)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Копируем CSV в буфер обмена
        await navigator.clipboard.writeText(result.csv);
        
        // Открываем Google Sheets
        window.open(result.url, '_blank');
        
        alert('📋 CSV данные скопированы в буфер обмена!\n🌐 Google Sheets открыт в новой вкладке.\n\nВставьте данные (Ctrl+V) и выберите "Import data".');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка экспорта');
      }
    } catch (error) {
      console.error('Google Sheets export error:', error);
      alert('❌ Ошибка при экспорте в Google Sheets: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  // Генерация данных для листа результатов
  const generateResultsData = () => {
    if (!currentModel?.sheets) return [];

    const revenueSheet = currentModel.sheets.find(s => s.type === 'revenue');
    const expensesSheet = currentModel.sheets.find(s => s.type === 'expenses');
    
    const results = [
      ['Итоговые показатели модели', '', '', '', ''],
      ['Создано:', new Date().toLocaleDateString('ru-RU'), '', '', ''],
      ['Модель:', currentModel.name || 'Без названия', '', '', ''],
      ['Отрасль:', currentModel.industry || 'Общая', '', '', ''],
      ['', '', '', '', ''],
      ['ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', 'Год 1', 'Год 2', 'Год 3', 'Год 4'],
      ['', '', '', '', '']
    ];

    // Добавляем суммарные данные по годам
    if (revenueSheet?.data && expensesSheet?.data) {
      // Суммируем выручку
      const revenueTotals = ['Общая выручка'];
      const expensesTotals = ['Общие расходы'];
      const profitTotals = ['Чистая прибыль'];
      
      for (let year = 1; year <= 4; year++) {
        let revenueTotal = 0;
        let expensesTotal = 0;
        
        // Суммируем выручку за год
        revenueSheet.data.forEach((row, index) => {
          if (index > 0 && row[year]) {
            const value = typeof row[year] === 'string' ? 
              parseFloat(row[year].replace(/[^\d.-]/g, '')) || 0 : 
              row[year] || 0;
            revenueTotal += value;
          }
        });
        
        // Суммируем расходы за год
        expensesSheet.data.forEach((row, index) => {
          if (index > 0 && row[year]) {
            const value = typeof row[year] === 'string' ? 
              parseFloat(row[year].replace(/[^\d.-]/g, '')) || 0 : 
              row[year] || 0;
            expensesTotal += value;
          }
        });
        
        revenueTotals.push(Math.round(revenueTotal).toLocaleString('ru-RU'));
        expensesTotals.push(Math.round(expensesTotal).toLocaleString('ru-RU'));
        profitTotals.push(Math.round(revenueTotal - expensesTotal).toLocaleString('ru-RU'));
      }
      
      results.push(revenueTotals, expensesTotals, profitTotals);
    }

    results.push(
      ['', '', '', '', ''],
      ['КЛЮЧЕВЫЕ МЕТРИКИ', '', '', '', ''],
      ['Средняя маржинальность', '15%', '18%', '20%', '22%'],
      ['Темп роста выручки', '0%', '15%', '18%', '12%'],
      ['ROI (возврат инвестиций)', '8%', '12%', '16%', '20%'],
      ['', '', '', '', ''],
      ['РЕКОМЕНДАЦИИ', '', '', '', ''],
      ['• Отслеживать ключевые показатели ежемесячно', '', '', '', ''],
      ['• Обновлять прогнозы каждый квартал', '', '', '', ''],
      ['• Анализировать отклонения план/факт', '', '', '', ''],
      ['• Корректировать стратегию при необходимости', '', '', '', '']
    );

    return results;
  };

  // Обновление ячейки
  const handleCellUpdate = async (sheetId: string, row: number, col: number, value: string) => {
    if (!currentModel) return;

    // Обновляем локально
    const updatedSheets = currentModel.sheets.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data];
        if (!newData[row]) newData[row] = [];
        newData[row][col] = value;
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    setCurrentModel({ ...currentModel, sheets: updatedSheets });

    // Отправляем на сервер (опционально)
    try {
      await fetch('/api/model/update-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentModel.id,
          sheetId,
          row,
          col,
          value
        })
      });
    } catch (error) {
      console.error('Error updating cell:', error);
    }
  };

  // Добавление новой строки
  const handleAddRow = async (sheetId: string, rowData: string[]) => {
    if (!currentModel) return;

    const updatedSheets = currentModel.sheets.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data, rowData];
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    setCurrentModel({ ...currentModel, sheets: updatedSheets });

    try {
      await fetch('/api/model/add-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentModel.id,
          sheetId,
          rowData
        })
      });
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  // Загрузка шаблона по ID
  const loadTemplateById = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона');
      }
      
      const templateData = await response.json();
      
      const model: FinancialModel = {
        id: `model_${Date.now()}`,
        name: `Модель: ${templateData.sheets?.[0]?.name || templateId}`,
        industry: templateId,
        template: templateId,
        sheets: templateData.sheets || [],
        assumptions: templateData.assumptions || {},
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      setCurrentModel(model);
      setActiveSheet(model.sheets[0]?.id || 'assumptions');
      setShowTemplateGallery(false);
      
    } catch (error) {
      console.error('Error loading template:', error);
      alert('❌ Ошибка загрузки шаблона: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  // Обработка сгенерированной модели
  const handleModelGenerated = (model: any) => {
    const fullModel: FinancialModel = {
      ...model,
      industry: model.industry || 'general',
      template: model.template || 'custom',
      assumptions: model.assumptions || {},
      lastModified: new Date().toISOString()
    };
    
    setCurrentModel(fullModel);
    setActiveSheet(fullModel.sheets[0]?.id || 'assumptions');
    setShowModelGenerator(false);
  };

  // Обработчик контекстного меню
  const handleContextMenu = (row: number, col: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentModel) return;

    const sheet = currentModel.sheets.find(s => s.id === activeSheet);
    if (!sheet) return;

    const cellValue = sheet.data[row]?.[col] || '';
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      cellValue,
      rowIndex: row,
      colIndex: col
    });
  };

  // Обработчик действий контекстного меню
  const handleContextAction = async (action: string) => {
    if (!currentModel) return;
    
    const sheet = currentModel.sheets.find(s => s.id === activeSheet);
    if (!sheet) return;

    const { rowIndex, colIndex, cellValue } = contextMenu;

    switch (action) {
      case 'edit':
        setEditingCell({ row: rowIndex, col: colIndex });
        setCurrentCell({ row: rowIndex, col: colIndex, value: String(cellValue) });
        break;

      case 'copy':
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(String(cellValue));
        }
        break;

      case 'format-currency':
        if (typeof cellValue === 'number' || !isNaN(parseFloat(String(cellValue)))) {
          const numValue = parseFloat(String(cellValue));
          handleCellUpdate(sheet.id, rowIndex, colIndex, `${numValue.toLocaleString('ru-RU')} тенге`);
        }
        break;

      case 'format-percent':
        if (typeof cellValue === 'number' || !isNaN(parseFloat(String(cellValue)))) {
          const numValue = parseFloat(String(cellValue));
          handleCellUpdate(sheet.id, rowIndex, colIndex, `${(numValue * 100).toFixed(1)}%`);
        }
        break;

      case 'create-formula':
        setEditingCell({ row: rowIndex, col: colIndex });
        setCurrentCell({ row: rowIndex, col: colIndex, value: '=' });
        break;

      case 'quick-sum':
        if (rowIndex > 1) {
          const formula = `=SUM(${String.fromCharCode(65 + colIndex)}2:${String.fromCharCode(65 + colIndex)}${rowIndex})`;
          handleCellUpdate(sheet.id, rowIndex, colIndex, formula);
        }
        break;

      case 'quick-growth':
        if (colIndex > 1) {
          const formula = `=${String.fromCharCode(65 + colIndex - 1)}${rowIndex + 1}*1.15`;
          handleCellUpdate(sheet.id, rowIndex, colIndex, formula);
        }
        break;

      case 'quick-percent':
        const formula = `=B${rowIndex + 1}*0.05`;
        handleCellUpdate(sheet.id, rowIndex, colIndex, formula);
        break;

      case 'insert-row-above':
        insertRow(sheet.id, rowIndex);
        break;

      case 'insert-row-below':
        insertRow(sheet.id, rowIndex + 1);
        break;

      case 'delete-row':
        deleteRow(sheet.id, rowIndex);
        break;

      case 'add-revenue-item':
        addRevenueItem(sheet.id);
        break;

      case 'add-expense-item':
        addExpenseItem(sheet.id);
        break;
    }

    setContextMenu({ ...contextMenu, isOpen: false });
  };

  // Вставка новой строки
  const insertRow = (sheetId: string, atIndex: number) => {
    if (!currentModel) return;

    const updatedSheets = currentModel.sheets.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data];
        const newRow = new Array(newData[0]?.length || 4).fill('');
        newRow[0] = 'Новая статья';
        newData.splice(atIndex, 0, newRow);
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    setCurrentModel({ ...currentModel, sheets: updatedSheets });
  };

  // Удаление строки
  const deleteRow = (sheetId: string, rowIndex: number) => {
    if (!currentModel || rowIndex <= 0) return;

    const updatedSheets = currentModel.sheets.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data];
        newData.splice(rowIndex, 1);
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    setCurrentModel({ ...currentModel, sheets: updatedSheets });
  };

  // Добавление источника дохода
  const addRevenueItem = (sheetId: string) => {
    const newRow = ['Новый источник дохода', '0', '0', '0'];
    handleAddRow(sheetId, newRow);
  };

  // Добавление статьи расходов
  const addExpenseItem = (sheetId: string) => {
    const newRow = ['Новая статья расходов', '0', '0', '0'];
    handleAddRow(sheetId, newRow);
  };

  // Генерация новых чисел для модели
  const generateNewNumbers = () => {
    if (!currentModel) return;

    const sheet = currentModel.sheets.find(s => s.id === activeSheet);
    if (!sheet) return;

    const updatedSheets = currentModel.sheets.map(s => {
      if (s.id === activeSheet) {
        const newData = [...s.data];
        
        // Генерируем новые числа для всех числовых ячеек
        for (let row = 1; row < newData.length; row++) {
          for (let col = 1; col < newData[row].length; col++) {
            const cellValue = newData[row][col];
            
            // Проверяем, является ли ячейка числом и не формулой
            if (typeof cellValue === 'number' || 
                (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)) && !cellValue.startsWith('='))) {
              
              const currentValue = typeof cellValue === 'number' ? cellValue : parseFloat(cellValue);
              
              // Генерируем новое значение с отклонением ±20% от текущего
              const variation = 0.2; // 20%
              const minValue = currentValue * (1 - variation);
              const maxValue = currentValue * (1 + variation);
              const newValue = Math.round(minValue + Math.random() * (maxValue - minValue));
              
              newData[row][col] = newValue;
            }
          }
        }
        
        return { ...s, data: newData };
      }
      return s;
    });

    setCurrentModel({ 
      ...currentModel, 
      sheets: updatedSheets,
      lastModified: new Date().toISOString()
    });
  };

  // Drag and Drop обработчики
  const handleDragStart = (row: number, col: number) => {
    if (col !== 0) return; // Только строки целиком
    setDragState({
      isDragging: true,
      draggedRow: row,
      targetRow: null
    });
  };

  const handleDragOver = (row: number, col: number) => {
    if (!dragState.isDragging || col !== 0) return;
    setDragState({
      ...dragState,
      targetRow: row
    });
  };

  const handleDrop = (row: number, col: number) => {
    if (!dragState.isDragging || !currentModel || dragState.draggedRow === null) return;

    const sheet = currentModel.sheets.find(s => s.id === activeSheet);
    if (!sheet) return;

    const newData = [...sheet.data];
    const draggedRowData = newData[dragState.draggedRow];
    
    // Удаляем исходную строку
    newData.splice(dragState.draggedRow, 1);
    
    // Вставляем в новое место
    const insertIndex = row > dragState.draggedRow ? row - 1 : row;
    newData.splice(insertIndex, 0, draggedRowData);

    const updatedSheets = currentModel.sheets.map(s => 
      s.id === activeSheet ? { ...s, data: newData } : s
    );

    setCurrentModel({ ...currentModel, sheets: updatedSheets });
    
    setDragState({
      isDragging: false,
      draggedRow: null,
      targetRow: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Model Generator Modal - доступен всегда */}
      {showModelGenerator && (
        <ModelGenerator
          onModelGenerated={handleModelGenerated}
          onClose={() => setShowModelGenerator(false)}
        />
      )}

      {/* Template Gallery Modal - доступен всегда */}
      {showTemplateGallery && (
        <TemplateGallery
          onTemplateSelected={loadTemplateById}
          onCustomGenerate={() => {
            setShowTemplateGallery(false);
            setShowModelGenerator(true);
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🤖 ИИ создает вашу модель
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Анализируем ваш бизнес и строим финансовую модель...
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentModel ? (
        // ... existing landing page content ...
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          <div className="relative z-10">
                          <div className="flex justify-between items-center p-6 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
                <h1 className="text-2xl font-bold text-white">
                  FinSights AI - Конструктор моделей
                </h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.history.back()}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition text-white"
                  >
                    <span>← Назад к дашборду</span>
                  </button>
                </div>
              </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Используйте ИИ для создания
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> финансовой модели</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                  Экономьте время и деньги. Создавайте профессиональные 3-отчетные модели за минуты, 
                  а не часы. Готовые шаблоны или ИИ-генерация под ваш бизнес.
                </p>
              </div>

              {/* AI Generator Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-gray-700">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">🤖 Создать с помощью ИИ</h2>
                  <p className="text-gray-300">Опишите ваш бизнес, и ИИ создаст персонализированную модель</p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <textarea
                    value={customBusiness}
                    onChange={(e) => setCustomBusiness(e.target.value)}
                    placeholder="Например: Я открываю кафе в центре города. 30 посадочных мест, работаем с 8:00 до 22:00. Средний чек 1500 тенге. Планируем доставку через Glovo..."
                    className="w-full h-32 bg-gray-700 text-white rounded-lg p-4 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => setShowModelGenerator(true)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                  >
                    🚀 Создать модель с ИИ
                  </button>
                </div>
              </div>

              {/* Templates Section */}
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">📋 Готовые шаблоны</h2>
                  <p className="text-gray-300">Выберите проверенный шаблон для вашей отрасли</p>
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="mt-4 bg-white text-gray-900 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    Посмотреть все шаблоны →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.slice(0, 6).map((template) => (
                    <div
                      key={template.id}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                      onClick={() => loadTemplate(template)}
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl mr-4">
                          {template.category === 'food' ? '🍽️' : 
                           template.category === 'tech' ? '💻' : 
                           template.category === 'retail' ? '🛍️' : '🏢'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                          <p className="text-gray-400 text-sm">{template.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">{template.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 text-sm font-medium">Готов к использованию</span>
                        <span className="text-green-400 text-xs">✓ Проверено</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Existing model editor interface
        <div>
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentModel(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ← Назад к выбору модели
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">{currentModel.name}</h1>
                  <p className="text-gray-400 text-sm">
                    Создано: {new Date(currentModel.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                  🤖 ИИ Помощник
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex h-screen">
            {/* Left Sidebar - Sheets */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-200 mb-3">ЛИСТЫ МОДЕЛИ</h2>
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => setShowTemplateGallery(true)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition"
                    >
                      📊 Шаблоны
                    </button>
                    <button
                      onClick={() => setShowModelGenerator(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition"
                    >
                      🤖 ИИ Генератор
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {currentModel.sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setActiveSheet(sheet.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                        activeSheet === sheet.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{sheet.icon}</span>
                        <span className="font-medium">{sheet.name}</span>
                      </div>
                      {sheet.type && (
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                          {sheet.type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Model Stats */}
                <div className="mt-8 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-200 mb-3">Статистика модели</h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div>Листов: {currentModel.sheets.length}</div>
                    <div>Создана: {new Date(currentModel.createdAt).toLocaleString('ru-RU')}</div>
                    <div>Изменена: {new Date().toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
              {/* Кнопка результатов в заголовке */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentModel.name || 'Финансовая модель'}
                  </h1>
                                     <p className="text-gray-600 dark:text-gray-400 text-sm">
                     {activeSheet && currentModel.sheets.find(s => s.id === activeSheet)?.name || 'Выберите лист'}
                   </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSheet('results')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeSheet === 'results' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    📊 Результаты
                  </button>
                </div>
              </div>

              {/* Условный рендеринг: Результаты или Редактор */}
              {activeSheet === 'results' ? (
                <ResultsDashboard 
                  model={currentModel}
                  onExportExcel={exportToExcel}
                  onExportPDF={exportToPDF}
                />
              ) : activeSheet && currentModel.sheets.find(s => s.id === activeSheet) ? (
                <div className="flex-1 flex flex-col">
                  {/* Formula Bar */}
                  <FormulaBar
                    currentCell={currentCell}
                    isEditing={editingCell !== null}
                    onFormulaChange={(formula) => {
                      if (editingCell) {
                        const sheet = currentModel.sheets.find(s => s.id === activeSheet);
                        if (sheet) {
                          handleCellUpdate(sheet.id, editingCell.row, editingCell.col, formula);
                        }
                      }
                    }}
                    onEnter={() => setEditingCell(null)}
                    onCancel={() => setEditingCell(null)}
                  />

                  {/* Toolbar */}
                  <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Быстрые действия:</span>
                          <button
                            onClick={() => {
                              const sheet = currentModel.sheets.find(s => s.id === activeSheet);
                              if (sheet) {
                                if (activeSheet === 'revenue') {
                                  addRevenueItem(sheet.id);
                                } else if (activeSheet === 'expenses') {
                                  addExpenseItem(sheet.id);
                                } else {
                                  insertRow(sheet.id, sheet.data.length);
                                }
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                          >
                            ➕ Добавить строку
                          </button>
                          <button
                            onClick={() => {
                              if (currentCell.row > 0 && currentCell.col > 0) {
                                const sheet = currentModel.sheets.find(s => s.id === activeSheet);
                                if (sheet) {
                                  const formula = `=SUM(${String.fromCharCode(65 + currentCell.col)}2:${String.fromCharCode(65 + currentCell.col)}${currentCell.row + 1})`;
                                  handleCellUpdate(sheet.id, currentCell.row, currentCell.col, formula);
                                }
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                          >
                            ∑ Сумма
                          </button>
                          <button
                            onClick={() => {
                              console.log('Growth button clicked. Current cell:', currentCell);
                              if (currentCell.row >= 0 && currentCell.col >= 0) {
                                const sheet = currentModel.sheets.find(s => s.id === activeSheet);
                                console.log('Found sheet:', sheet?.id, 'Row:', currentCell.row, 'Col:', currentCell.col);
                                
                                if (sheet && sheet.data[currentCell.row]) {
                                  if (currentCell.col > 1) {
                                    // Формула для роста на 15% от предыдущего года
                                    const formula = `=${String.fromCharCode(65 + currentCell.col - 1)}${currentCell.row + 1}*1.15`;
                                    console.log('Applying growth formula:', formula);
                                    handleCellUpdate(sheet.id, currentCell.row, currentCell.col, formula);
                                  } else if (currentCell.col === 1) {
                                    // Для первого года - просто умножаем текущее значение на 1.15
                                    const currentValue = sheet.data[currentCell.row]?.[currentCell.col];
                                    const numValue = parseFloat(String(currentValue || '0').replace(/[^\d.-]/g, ''));
                                    console.log('Current value:', currentValue, 'Parsed:', numValue);
                                    if (!isNaN(numValue)) {
                                      const newValue = String(Math.round(numValue * 1.15));
                                      console.log('New value:', newValue);
                                      handleCellUpdate(sheet.id, currentCell.row, currentCell.col, newValue);
                                    }
                                  }
                                }
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition"
                          >
                            📈 Рост 15%
                          </button>
                          <button
                            onClick={generateNewNumbers}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition flex items-center space-x-1"
                          >
                            <span>🎲</span>
                            <span>Генерировать числа</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          💡 Кликните на ячейку для редактирования
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 border border-green-300 rounded"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Доходы</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/20 border border-red-300 rounded"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Расходы</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900/20 border border-purple-300 rounded"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Формулы</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spreadsheet */}
                  <div className="flex-1 overflow-auto">
                                        {(() => {
                      const currentSheet = currentModel.sheets.find(s => s.id === activeSheet);
                      if (!currentSheet) return <div>Лист не найден</div>;

                      return (
                        <table className="w-full border-collapse">
                          <tbody>
                                                          {currentSheet.data.map((row, rowIndex) => (
                                <tr 
                                  key={rowIndex}
                                  onClick={(e) => {
                                    // Получаем индекс колонки из клика
                                    const target = e.target as HTMLElement;
                                    const td = target.closest('td');
                                    if (td) {
                                      const cellIndex = Array.from(td.parentElement?.children || []).indexOf(td);
                                      if (cellIndex >= 0) {
                                        setCurrentCell({ 
                                          row: rowIndex, 
                                          col: cellIndex, 
                                          value: String(row[cellIndex] || '') 
                                        });
                                      }
                                    }
                                  }}
                                >
                                  {Array.isArray(row) ? row.map((cell, cellIndex) => (
                                    <EditableCell
                                      key={cellIndex}
                                      value={cell || ''}
                                      rowIndex={rowIndex}
                                      colIndex={cellIndex}
                                      isEditing={editingCell?.row === rowIndex && editingCell?.col === cellIndex}
                                      onStartEdit={(row, col) => {
                                        setEditingCell({ row, col });
                                        setCurrentCell({ row, col, value: String(cell || '') });
                                      }}
                                      onSave={(row, col, value) => {
                                        if (currentSheet) {
                                          handleCellUpdate(currentSheet.id, row, col, value);
                                        }
                                        setEditingCell(null);
                                      }}
                                      onCancel={() => {
                                        setEditingCell(null);
                                      }}
                                      isHeader={rowIndex === 0}
                                      isFormula={typeof cell === 'string' && cell.startsWith('=')}
                                      sheetType={currentSheet?.type}
                                      onContextMenu={handleContextMenu}
                                      isDragging={dragState.isDragging && dragState.draggedRow === rowIndex}
                                      onDragStart={handleDragStart}
                                      onDragOver={handleDragOver}
                                      onDrop={handleDrop}
                                    />
                                  )) : null}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Выберите лист для редактирования</h3>
                    <p>Используйте боковую панель для навигации по листам модели</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant Modal */}
          <AIFinancialAssistant
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            currentSheet={activeSheet}
            currentCell={currentCell}
            onApplySuggestion={(suggestion) => {
              if (editingCell) {
                const sheet = currentModel.sheets.find(s => s.id === activeSheet);
                if (sheet) {
                  handleCellUpdate(sheet.id, editingCell.row, editingCell.col, suggestion);
                }
              }
              setShowAIAssistant(false);
            }}
            onAddRow={(rowData) => {
              const sheet = currentModel.sheets.find(s => s.id === activeSheet);
              if (sheet) {
                handleAddRow(sheet.id, rowData);
              }
            }}
          />

          {/* Context Menu */}
          <ContextMenu
            isOpen={contextMenu.isOpen}
            position={contextMenu.position}
            onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
            onAction={handleContextAction}
            cellValue={contextMenu.cellValue}
            rowIndex={contextMenu.rowIndex}
            colIndex={contextMenu.colIndex}
            sheetType={currentModel.sheets.find(s => s.id === activeSheet)?.type}
          />
        </div>
      )}
    </div>
  );
};
export default FinancialPage;