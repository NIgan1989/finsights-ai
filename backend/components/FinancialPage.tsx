import React, { useState, useCallback, useEffect } from 'react';
import EditableCell from './EditableCell';
import AIFinancialAssistant from './AIFinancialAssistant';
import FormulaBar from './FormulaBar';
import ModelGenerator from './ModelGenerator';
import TemplateGallery from './TemplateGallery';
import ContextMenu from './ContextMenu';
import ResultsDashboard from './ResultsDashboard';
import { getImplementedTemplates } from '../../templates/templateData';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';

// Финальный интерфейс шаблона, используемый на странице
interface FinancialTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  complexity: string;
  timeframe: string;
  features: string[];
  implemented: boolean;
  industry: string;
  preview: string;
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
  const { userId, email, subscriptionInfo, refreshSubscription } = useUser();
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
  const [showFormulas, setShowFormulas] = useState<boolean>(false);

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

  // Используем только реализованные шаблоны из общего источника данных
  // и адаптируем их для использования в FinancialPage
  const implementedTemplatesList: FinancialTemplate[] = getImplementedTemplates().map(template => ({
    ...template,
    industry: template.category === 'food' ? 'Food & Beverage' :
              template.category === 'tech' ? 'Technology' :
              template.category === 'retail' ? 'Retail' :
              template.category === 'production' ? 'Manufacturing' :
              template.category === 'services' ? 'Professional Services' :
              template.category === 'healthcare' ? 'Healthcare' :
              template.category === 'education' ? 'Education' :
              template.category === 'logistics' ? 'Logistics' :
              template.category === 'tourism' ? 'Tourism' :
              template.category === 'automotive' ? 'Automotive' :
              template.category === 'beauty' ? 'Beauty' : 'Other',
    preview: `/templates/${template.id}-preview.png`
  }));

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
      const response = await fetch(`/api/financial-model/templates/${template.id}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона');
      }
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
      if (newModel.sheets && newModel.sheets.length > 0) {
        setActiveSheet(newModel.sheets[0].id);
      } else {
        setActiveSheet('assumptions');
      }
      setShowTemplateGallery(false);
      setCurrentStep('edit');
    } catch (error) {
      console.error('Error loading template:', error);
      alert('❌ Ошибка загрузки шаблона: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Функции экспорта
  const exportToExcel = async () => {
    if (!currentModel) return;

    // Проверка авторизации и лимитов
    const currentUserId = userId ?? email;
    if (!currentUserId) {
      subscriptionService.showUpgradeModal('Войдите, чтобы экспортировать отчеты');
      return;
    }
    const reportLimit = subscriptionService.checkReportDownloadLimit();
    if (!reportLimit.allowed) {
      subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
      return;
    }

    try {
      // Добавляем лист результатов во временную модель для экспорта
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...(currentModel?.sheets || []),
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
        
        // Инкремент счетчика скачивания отчетов (с проверкой и ленивой подзагрузкой подписки)
        if (!subscriptionInfo) {
          try {
            await refreshSubscription();
          } catch (e) {
            console.warn('Не удалось обновить информацию о подписке:', e);
          }
        }
        const reportLimit = subscriptionService.checkReportDownloadLimit();
        if (!reportLimit.allowed) {
          subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
          return;
        }
        await subscriptionService.incrementReportDownloads(currentUserId);
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

    // Проверка авторизации и лимитов
    const currentUserId = userId ?? email;
    if (!currentUserId) {
      subscriptionService.showUpgradeModal('Войдите, чтобы экспортировать отчеты');
      return;
    }
    const reportLimit = subscriptionService.checkReportDownloadLimit();
    if (!reportLimit.allowed) {
      subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
      return;
    }

    try {
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...(currentModel?.sheets || []),
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
        
        // Инкремент счетчика скачивания отчетов (с проверкой и ленивой подзагрузкой подписки)
        if (!subscriptionInfo) {
          try {
            await refreshSubscription();
          } catch (e) {
            console.warn('Не удалось обновить информацию о подписке:', e);
          }
        }
        const reportLimit = subscriptionService.checkReportDownloadLimit();
        if (!reportLimit.allowed) {
          subscriptionService.showUpgradeModal(reportLimit.reason || 'Лимит скачивания отчетов достигнут');
          return;
        }
        await subscriptionService.incrementReportDownloads(currentUserId);
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

    // Проверка авторизации и лимитов
    const currentUserId = userId ?? email;
    if (!currentUserId) {
      subscriptionService.showUpgradeModal('Войдите, чтобы экспортировать отчеты');
      return;
    }
    const exportLimit = subscriptionService.checkDashboardExportLimit();
    if (!exportLimit.allowed) {
      subscriptionService.showUpgradeModal(exportLimit.reason || 'Экспорт доступен только в PRO тарифе');
      return;
    }

    try {
      const modelWithResults = {
        ...currentModel,
        sheets: [
          ...(currentModel?.sheets || []),
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
        
        // Инкремент счетчика экспортов дашборда
        await subscriptionService.incrementDashboardExports(currentUserId);
        
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
    if (!currentModel?.sheets) return [] as any[];

    const revenueSheet = currentModel?.sheets?.find(s => s.type === 'revenue');
    const expensesSheet = currentModel?.sheets?.find(s => s.type === 'expenses');

    // Определяем количество лет по количеству колонок (за вычетом колонки с названием показателя)
    const revYears = (revenueSheet?.data?.[0]?.length || 1) - 1;
    const expYears = (expensesSheet?.data?.[0]?.length || 1) - 1;
    const yearCount = Math.max(revYears, expYears, 4); // Минимум 4 года, по умолчанию — как в данных
    const yearLabels = Array.from({ length: yearCount }, (_, i) => `Год ${i + 1}`);

    // Заготовка пустой строки нужной длины
    const blankRow = Array(yearCount).fill('');

    const results: any[] = [
      ['Итоговые показатели модели', ...blankRow],
      ['Создано:', new Date().toLocaleDateString('ru-RU'), ...blankRow.slice(1)],
      ['Модель:', currentModel.name || 'Без названия', ...blankRow.slice(1)],
      ['Отрасль:', currentModel.industry || 'Общая', ...blankRow.slice(1)],
      ['', ...blankRow],
      ['ФИНАНСОВЫЕ ПОКАЗАТЕЛИ', ...yearLabels],
      ['', ...blankRow]
    ];

    // Добавляем суммарные данные по годам
    if (revenueSheet?.data && expensesSheet?.data) {
      // Суммируем выручку
      const revenueTotals = ['Общая выручка'];
      const expensesTotals = ['Общие расходы'];
      const profitTotals = ['Чистая прибыль'];
      
      for (let year = 1; year <= yearCount; year++) {
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
      ['', ...blankRow],
      ['КЛЮЧЕВЫЕ МЕТРИКИ', ...blankRow],
      ['Средняя маржинальность', ...blankRow.map(()=>'')],
      ['Темп роста выручки', ...blankRow.map(()=>'')],
      ['ROI (возврат инвестиций)', ...blankRow.map(()=>'')],
      ['', ...blankRow],
      ['РЕКОМЕНДАЦИИ', ...blankRow],
      ['• Отслеживать ключевые показатели ежемесячно', ...blankRow],
      ['• Обновлять прогнозы каждый квартал', ...blankRow],
      ['• Анализировать отклонения план/факт', ...blankRow],
      ['• Корректировать стратегию при необходимости', ...blankRow]
    );

    return results;
  };

  // Обновление ячейки
  const handleCellUpdate = async (sheetId: string, row: number, col: number, value: string) => {
    if (!currentModel) return;

    // Обновляем локально
    const updatedSheets = currentModel?.sheets?.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data];
        if (!newData[row]) newData[row] = [];
        newData[row][col] = value;
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    if (!updatedSheets) return;
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

    const updatedSheets = currentModel?.sheets?.map(sheet => {
      if (sheet.id === sheetId) {
        const newData = [...sheet.data, rowData];
        return { ...sheet, data: newData };
      }
      return sheet;
    });

    if (!updatedSheets) return;
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
      const response = await fetch(`/api/financial-model/templates/${templateId}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблона');
      }
      
      const templateData = await response.json();
      
      // Получаем название шаблона из списка шаблонов
      const templateInfo = implementedTemplatesList.find(t => t.id === templateId);
      const templateName = templateInfo?.name || templateData.name || templateId;
      
      const model: FinancialModel = {
        id: `model_${Date.now()}`,
        name: templateName,
        industry: templateInfo?.industry || templateId,
        template: templateId,
        sheets: templateData.sheets || [],
        assumptions: templateData.assumptions || {},
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      console.log('Loaded template model:', model);
      console.log('Template sheets:', model.sheets);
      
      setCurrentModel(model);
      if (model.sheets && model.sheets.length > 0) {
        setActiveSheet(model.sheets[0].id);
      } else {
        setActiveSheet('assumptions');
      }
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

    const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
    
    const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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

    const updatedSheets = currentModel?.sheets?.map(sheet => {
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

    const updatedSheets = currentModel?.sheets?.map(sheet => {
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

    const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
    if (!sheet) return;

    const newData = [...sheet.data];
    const draggedRowData = newData[dragState.draggedRow];
    
    // Удаляем исходную строку
    newData.splice(dragState.draggedRow, 1);
    
    // Вставляем в новое место
    const insertIndex = row > dragState.draggedRow ? row - 1 : row;
    newData.splice(insertIndex, 0, draggedRowData);

    const updatedSheets = currentModel?.sheets?.map(s => 
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
                  {implementedTemplatesList.slice(0, 6).map((template) => (
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
            {/* Left Sidebar - Sheets - скрыта на странице результатов */}
            {activeSheet !== 'results' && (
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
                  {/* Кнопка результатов в боковой панели */}
                  <button
                    onClick={() => setActiveSheet('results')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                      activeSheet === 'results'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">📊</span>
                      <span className="font-medium">Результаты</span>
                    </div>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                      dashboard
                    </span>
                  </button>
                  
                  {/* Разделитель */}
                  <div className="border-t border-gray-600 my-3"></div>
                  
                  {/* Листы модели */}
                  {currentModel?.sheets?.filter(sheet => sheet.type !== 'results').map((sheet) => (
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
                    <div>Листов: {currentModel?.sheets?.length || 0}</div>
                    <div>Создана: {new Date(currentModel.createdAt).toLocaleString('ru-RU')}</div>
                    <div>Изменена: {new Date().toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${activeSheet === 'results' ? 'w-full' : ''}`}>
              {/* Кнопка результатов в заголовке */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentModel.name || 'Финансовая модель'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {activeSheet === 'results' 
                      ? 'Результаты модели' 
                      : (activeSheet && currentModel?.sheets?.find(s => s.id === activeSheet)?.name || 'Выберите лист')
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeSheet === 'results' && (
                    <button
                      onClick={() => {
                        const firstSheet = currentModel?.sheets?.[0];
                        if (firstSheet) setActiveSheet(firstSheet.id);
                      }}
                      className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      ← Назад к листам
                    </button>
                  )}
                </div>
              </div>

              {/* Условный рендеринг: Результаты или Редактор */}
              {activeSheet === 'results' ? (
                <ResultsDashboard 
                  model={currentModel}
                  onExportExcel={exportToExcel}
                  onExportPDF={exportToPDF}
                />
              ) : activeSheet && currentModel?.sheets?.find(s => s.id === activeSheet) ? (
                <div className="flex-1 flex flex-col">
                  {/* Formula Bar */}
                  <FormulaBar
                    currentCell={currentCell}
                    isEditing={editingCell !== null}
                    onFormulaChange={(formula) => {
                      if (editingCell) {
                        const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
                              const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
                                const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
                                const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            id="showFormulas"
                            checked={showFormulas}
                            onChange={(e) => setShowFormulas(e.target.checked)}
                            className="w-3 h-3 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="showFormulas" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                            Показывать формулы
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spreadsheet */}
                  <div className="flex-1 overflow-auto relative">
                                        {(() => {
                      const currentSheet = currentModel?.sheets?.find(s => s.id === activeSheet);
                      if (!currentSheet) return <div>Лист не найден</div>;

                      return (
                        <table className="w-full border-collapse table-fixed">
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
                                  className={`
                                    ${rowIndex === 0 ? 'sticky top-0 z-10' : ''}
                                    ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}
                                    hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150
                                  `}
                                >
                                  {Array.isArray(row) ? row.map((cell, cellIndex) => (
                                    <EditableCell
                                      key={cellIndex}
                                      value={typeof cell === 'string' && cell.startsWith('=') && !showFormulas ? (() => {
                                        const result = evaluateFormula(cell, currentModel?.sheets || [], currentSheet?.data || []);
                                        // Проверяем, является ли это формулой рентабельности (деление на выручку)
                                        if (typeof result === 'number' && cell.includes('/') && (cell.includes('B2') || cell.includes('C2') || cell.includes('D2'))) {
                                          return `${Math.round(result * 100)}%`;
                                        }
                                        return result;
                                      })() : (cell || '')}
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
                                      isHeader={rowIndex === 0 || cellIndex === 0}
                                      isFormula={typeof cell === 'string' && cell.startsWith('=')}
                                      sheetType={currentSheet?.type}
                                      onContextMenu={handleContextMenu}
                                      isDragging={dragState.isDragging && dragState.draggedRow === rowIndex}
                                      onDragStart={handleDragStart}
                                      onDragOver={handleDragOver}
                                      onDrop={handleDrop}
                                      showFormulas={showFormulas}
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
                const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
                if (sheet) {
                  handleCellUpdate(sheet.id, editingCell.row, editingCell.col, suggestion);
                }
              }
              setShowAIAssistant(false);
            }}
            onAddRow={(rowData) => {
              const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
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
            sheetType={currentModel?.sheets?.find(s => s.id === activeSheet)?.type}
          />
        </div>
      )}
    </div>
  );
};
export default FinancialPage;

// Функция для превращения ссылки на ячейку (например, A1) в числовое значение
function getCellValue(ref: string, data: (string | number)[][]): number {
  const match = ref.match(/([A-Z]+)(\d+)/);
  if (!match) return 0;
  
  const colLetters = match[1];
  const row = parseInt(match[2], 10) - 1; // строки в данных с 0
  
  // Правильное преобразование букв колонки в индекс (A=0, B=1, ..., Z=25, AA=26, etc.)
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }
  col = col - 1; // Приводим к 0-индексации
  
  if (row < 0 || col < 0 || row >= data.length || col >= (data[row]?.length || 0)) {
    return 0;
  }
  
  const val = data[row]?.[col];
  if (typeof val === 'number') {
    return val;
  }
  
  const strVal = String(val || '');
  // Если это формула, не пытаемся её парсить как число
  if (strVal.startsWith('=')) {
    return 0;
  }
  
  // Обработка процентных значений
  if (strVal.includes('%')) {
    const percentVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
    return isNaN(percentVal) ? 0 : percentVal / 100;
  }
  
  // Парсим числовое значение, убирая все нечисловые символы кроме точки и минуса
  const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
  return isNaN(numVal) ? 0 : numVal;
}

// Получить значение ячейки с учётом ссылок на другие листы
function getCellValueGlobal(ref: string, sheets: { id: string; name?: string; data: (string | number)[][] }[], currentSheetData: (string | number)[][], visitedCells: Set<string> = new Set()): number {
  // Проверка на циклические ссылки
  if (visitedCells.has(ref)) {
    return 0;
  }
  
  visitedCells.add(ref);
  
  const parts = ref.split('!');
  let cellRef = ref;
  let data = currentSheetData;
  
  if (parts.length === 2) {
    const [sheetPart, cellPart] = parts;
    cellRef = cellPart;
    const targetSheet = sheets.find(s => s.id === sheetPart || s.name === sheetPart);
    if (targetSheet) {
      data = targetSheet.data;
    } else {
      visitedCells.delete(ref);
      return 0;
    }
  }
  
  // Получаем координаты ячейки
  const match = cellRef.match(/([A-Z]+)(\d+)/);
  if (!match) {
    visitedCells.delete(ref);
    return 0;
  }
  
  let col = 0;
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + (match[1].charCodeAt(i) - 64);
  }
  col = col - 1;
  const row = parseInt(match[2], 10) - 1;
  
  if (row < 0 || col < 0 || row >= data.length || col >= (data[row]?.length || 0)) {
    visitedCells.delete(ref);
    return 0;
  }
  
  const val = data[row]?.[col];
  
  // Если это формула, рекурсивно вычисляем её
  if (typeof val === 'string' && val.startsWith('=')) {
    const result = evaluateFormula(val, sheets, data, new Set(visitedCells));
    visitedCells.delete(ref);
    return typeof result === 'number' ? result : 0;
  }
  
  // Обычное значение
  visitedCells.delete(ref);
  if (typeof val === 'number') {
    return val;
  }
  
  const strVal = String(val || '');
  
  // Обработка процентных значений
  if (strVal.includes('%')) {
    const percentVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
    return isNaN(percentVal) ? 0 : percentVal / 100;
  }
  
  const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
  return isNaN(numVal) ? 0 : numVal;
}

// Улучшенная функция для вычисления формул с валидацией и расширенным набором функций
function evaluateFormula(formula: string, sheets: { id: string; name?: string; data: (string | number)[][] }[], currentSheetData: (string | number)[][], visitedCells: Set<string> = new Set()): string | number {
  // Валидация входных данных
  if (!formula || typeof formula !== 'string' || !formula.startsWith('=')) {
    return formula;
  }

  // Убираем = и пробелы
  const expr = formula.slice(1).replace(/\s+/g, '');
  
  // Проверка на пустую формулу
  if (!expr) {
    return 0;
  }

  try {
    // Проверка циклических ссылок
    const cellRefs = expr.match(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g) || [];
    for (const ref of cellRefs) {
      if (visitedCells.has(ref)) {
        console.warn(`Обнаружена циклическая ссылка: ${ref}`);
        return '#CYCLE!';
      }
    }

    // SUM функция с улучшенной обработкой
    const sumMatch = expr.match(/^SUM\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (sumMatch) {
      const [, rangeStr, startCol, startRow, endCol, endRow] = sumMatch;
      let sheetData = currentSheetData;
      
      // Обработка межлистовых ссылок
      if (rangeStr.includes('!')) {
        const sheetName = rangeStr.split('!')[0];
        const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
        if (targetSheet) {
          sheetData = targetSheet.data;
        } else {
          console.warn(`Лист не найден: ${sheetName}`);
          return '#REF!';
        }
      }
      
      const startRowIdx = parseInt(startRow, 10) - 1;
      const endRowIdx = parseInt(endRow, 10) - 1;
      const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
      const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
      
      // Валидация диапазона
      if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
        return '#VALUE!';
      }
      
      let sum = 0;
      for (let r = startRowIdx; r <= endRowIdx; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          const val = sheetData[r]?.[c];
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
          if (!isNaN(num)) sum += num;
        }
      }
      return sum;
    }

    // AVERAGE функция
    const avgMatch = expr.match(/^AVERAGE\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (avgMatch) {
      const [, rangeStr, startCol, startRow, endCol, endRow] = avgMatch;
      let sheetData = currentSheetData;
      
      if (rangeStr.includes('!')) {
        const sheetName = rangeStr.split('!')[0];
        const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
        if (targetSheet) sheetData = targetSheet.data;
        else return '#REF!';
      }
      
      const startRowIdx = parseInt(startRow, 10) - 1;
      const endRowIdx = parseInt(endRow, 10) - 1;
      const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
      const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
      
      if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
        return '#VALUE!';
      }
      
      let sum = 0;
      let count = 0;
      for (let r = startRowIdx; r <= endRowIdx; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          const val = sheetData[r]?.[c];
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      }
      return count > 0 ? sum / count : 0;
    }

    // MAX функция
    const maxMatch = expr.match(/^MAX\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (maxMatch) {
      const [, rangeStr, startCol, startRow, endCol, endRow] = maxMatch;
      let sheetData = currentSheetData;
      
      if (rangeStr.includes('!')) {
        const sheetName = rangeStr.split('!')[0];
        const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
        if (targetSheet) sheetData = targetSheet.data;
        else return '#REF!';
      }
      
      const startRowIdx = parseInt(startRow, 10) - 1;
      const endRowIdx = parseInt(endRow, 10) - 1;
      const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
      const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
      
      if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
        return '#VALUE!';
      }
      
      let max = -Infinity;
      for (let r = startRowIdx; r <= endRowIdx; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          const val = sheetData[r]?.[c];
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
          if (!isNaN(num)) {
            max = Math.max(max, num);
          }
        }
      }
      return max === -Infinity ? 0 : max;
    }

    // MIN функция
    const minMatch = expr.match(/^MIN\(((?:[A-Za-z0-9_\- ]+!)?([A-Z]+)(\d+):([A-Z]+)(\d+))\)$/i);
    if (minMatch) {
      const [, rangeStr, startCol, startRow, endCol, endRow] = minMatch;
      let sheetData = currentSheetData;
      
      if (rangeStr.includes('!')) {
        const sheetName = rangeStr.split('!')[0];
        const targetSheet = sheets.find(s => s.id === sheetName || s.name === sheetName);
        if (targetSheet) sheetData = targetSheet.data;
        else return '#REF!';
      }
      
      const startRowIdx = parseInt(startRow, 10) - 1;
      const endRowIdx = parseInt(endRow, 10) - 1;
      const startColIdx = startCol.toUpperCase().charCodeAt(0) - 65;
      const endColIdx = endCol.toUpperCase().charCodeAt(0) - 65;
      
      if (startRowIdx < 0 || endRowIdx < 0 || startColIdx < 0 || endColIdx < 0) {
        return '#VALUE!';
      }
      
      let min = Infinity;
      for (let r = startRowIdx; r <= endRowIdx; r++) {
        for (let c = startColIdx; c <= endColIdx; c++) {
          const val = sheetData[r]?.[c];
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
          if (!isNaN(num)) {
            min = Math.min(min, num);
          }
        }
      }
      return min === Infinity ? 0 : min;
    }

    // ROUND функция
    const roundMatch = expr.match(/^ROUND\(([^,]+),?([^)]*)\)$/i);
    if (roundMatch) {
      const [, value, digits] = roundMatch;
      
      // Заменяем ссылки на ячейки в значении
      const valueReplaced = value.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
        const newVisited = new Set(visitedCells);
        return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
      });
      
      try {
        const numValue = Function(`"use strict";return (${valueReplaced})`)();
        const numDigits = digits ? parseInt(digits.trim(), 10) : 0;
        
        if (typeof numValue === 'number' && !isNaN(numValue)) {
          return Math.round(numValue * Math.pow(10, numDigits)) / Math.pow(10, numDigits);
        }
        return '#VALUE!';
      } catch (e) {
        console.warn('Ошибка в функции ROUND:', e);
        return '#VALUE!';
      }
    }

    // IF функция
    const ifMatch = expr.match(/^IF\(([^,]+),([^,]+),([^)]+)\)$/i);
    if (ifMatch) {
      const [, condition, trueValue, falseValue] = ifMatch;
      
      // Заменяем ссылки на ячейки в условии
      const conditionReplaced = condition.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
        const newVisited = new Set(visitedCells);
        return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
      });
      
      try {
        // Безопасная оценка условия
        const conditionResult = Function(`"use strict";return (${conditionReplaced})`)();
        
        if (conditionResult) {
          // Если условие истинно, возвращаем trueValue
          if (trueValue.match(/^[A-Z]+\d+$/)) {
            return getCellValueGlobal(trueValue, sheets, currentSheetData, new Set(visitedCells));
          }
          return isNaN(Number(trueValue)) ? trueValue.replace(/"/g, '') : Number(trueValue);
        } else {
          // Если условие ложно, возвращаем falseValue
          if (falseValue.match(/^[A-Z]+\d+$/)) {
            return getCellValueGlobal(falseValue, sheets, currentSheetData, new Set(visitedCells));
          }
          return isNaN(Number(falseValue)) ? falseValue.replace(/"/g, '') : Number(falseValue);
        }
      } catch (e) {
        console.warn('Ошибка в условии IF:', e);
        return '#VALUE!';
      }
    }

    // Арифметические формулы с улучшенной валидацией
    const newVisited = new Set(visitedCells);
    const replaced = expr.replace(/([A-Za-z0-9_\- ]+!)?[A-Z]+\d+/g, (ref) => {
      return getCellValueGlobal(ref, sheets, currentSheetData, newVisited).toString();
    });
    
    // Проверяем, что формула содержит только безопасные символы
    if (!/^[\d+\-*/.()\s]+$/.test(replaced)) {
      console.warn('Небезопасная формула:', replaced);
      return '#VALUE!';
    }
    
    const result = Function(`"use strict";return (${replaced})`)();
    
    if (typeof result === 'number' && !isNaN(result)) {
      return result;
    }
    
    return '#VALUE!';
    
  } catch (e) {
    console.warn('Ошибка вычисления формулы:', formula, e);
    return '#ERROR!';
  }
};
