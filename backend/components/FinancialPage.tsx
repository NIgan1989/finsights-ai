import React, { useState, useCallback, useEffect } from 'react';
import AIFinancialAssistant from './AIFinancialAssistant';
import ModelGenerator from './ModelGenerator';
import TemplateGallery from './TemplateGallery';
import ContextMenu from './ContextMenu';
import ResultsDashboard from './ResultsDashboard';
import { getImplementedTemplates } from '../../templates/templateData';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';

// Импорт новых компонентов
import LandingPage from './financial/LandingPage';
import ModelEditor from './financial/ModelEditor';
import ModelSidebar from './financial/ModelSidebar';

// Импорт моделей данных и утилит
import { 
  FinancialModel, 
  FinancialTemplate, 
  ModelSheet, 
  ContextMenuState,
  adaptTemplate,
  createEmptyModel,
  generateResultsData
} from '../models/financialModels';

// Импорт утилитарных функций для работы с формулами
import { getCellValue } from '../utils/formulaUtils';
import { getCellValueGlobal, evaluateFormula } from '../utils/formulaEvaluator';



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
  const [resultsData, setResultsData] = useState<any>(null);

  // Состояния для улучшенного редактора
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    cellValue: '',
    rowIndex: 0,
    colIndex: 0
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
            data: generateResultsData(currentModel)
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
            data: generateResultsData(currentModel)
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
            data: generateResultsData(currentModel)
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



  // Обновление ячейки
  const handleCellUpdate = async (sheetId: string, row: number, col: number, value: string) => {
    if (!currentModel) {
      console.error('No current model available for update');
      return;
    }

    console.log('Updating cell:', { sheetId, row, col, value, currentModel: currentModel.id });

    // Обновляем локально с глубоким клонированием
    const updatedSheets = currentModel.sheets.map(sheet => {
      if (sheet.id === sheetId) {
        // Глубокое клонирование данных листа
        const newData = sheet.data.map(rowData => [...rowData]);
        
        // Убеждаемся, что строка существует
        while (newData.length <= row) {
          newData.push([]);
        }
        
        // Убеждаемся, что в строке достаточно колонок
        while (newData[row].length <= col) {
          newData[row].push('');
        }
        
        // Обновляем значение
        newData[row][col] = value;
        
        console.log('Updated sheet data:', { sheetId, newData });
        
        return { 
          ...sheet, 
          data: newData 
        };
      }
      return sheet;
    });

    // Создаем новую модель с обновленными листами
    const updatedModel = {
      ...currentModel,
      sheets: updatedSheets,
      lastModified: new Date().toISOString()
    };
    
    console.log('Setting updated model:', updatedModel);
    setCurrentModel(updatedModel);

    // Автоматически обновляем результаты при изменении данных
    try {
      const newResultsData = generateResultsData(updatedModel);
      setResultsData(newResultsData);
      console.log('Результаты автоматически обновлены после изменения ячейки');
    } catch (error) {
      console.warn('Ошибка при автоматическом обновлении результатов:', error);
    }

    // Если это лист предпосылок, пересчитываем формулы на других листах
    if (sheetId === 'assumptions') {
      console.log('Assumptions updated, recalculating formulas on other sheets');
      
      // Пересчитываем формулы только на листах, которые не являются assumptions
      const updatedSheetsWithFormulas = updatedModel.sheets.map(sheet => {
        if (sheet.id === 'assumptions') {
          return sheet; // Не изменяем лист assumptions
        }
        
        // Пересчитываем формулы для других листов
        const updatedData = sheet.data.map((row, rowIndex) => {
          return row.map((cell, colIndex) => {
            if (typeof cell === 'string' && cell.startsWith('=')) {
              try {
                const result = evaluateFormula(cell, updatedModel.sheets, sheet.data);
                return typeof result === 'number' ? result : cell;
              } catch (error) {
                console.warn(`Error evaluating formula ${cell}:`, error);
                return cell;
              }
            }
            return cell;
          });
        });
        
        return {
          ...sheet,
          data: updatedData
        };
      });
      
      // Обновляем модель с пересчитанными формулами
      const finalUpdatedModel = {
        ...updatedModel,
        sheets: updatedSheetsWithFormulas,
        lastModified: new Date().toISOString()
      };
      
      setCurrentModel(finalUpdatedModel);
      
      // Обновляем результаты с новыми данными
      const newResultsData = generateResultsData(finalUpdatedModel);
      setResultsData(newResultsData);
      
      console.log('Formulas recalculated after assumptions update');
    }

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
      console.error('Error updating cell on server:', error);
      // Не блокируем локальное обновление при ошибке сервера
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

  // Применение изменений - пересчет только формул в модели, сохранение пользовательских данных
  const handleApplyChanges = async () => {
    if (!currentModel) return;

    console.log('Применение изменений к модели:', currentModel.id);
    
    try {
      // Создаем обновленную модель с пересчитанными формулами
      const updatedSheets = currentModel.sheets.map(sheet => {
        // Для листа предпосылок (assumptions) не пересчитываем формулы - сохраняем пользовательские данные
        if (sheet.id === 'assumptions') {
          return sheet; // Возвращаем лист предпосылок без изменений
        }
        
        const updatedData = sheet.data.map((row, rowIndex) => {
          return row.map((cell, colIndex) => {
            // Если ячейка содержит формулу, пересчитываем её
            if (typeof cell === 'string' && cell.startsWith('=')) {
              try {
                const result = evaluateFormula(cell, currentModel.sheets, sheet.data);
                return result;
              } catch (error) {
                console.warn(`Ошибка при вычислении формулы ${cell}:`, error);
                return cell; // Возвращаем исходную формулу при ошибке
              }
            }
            return cell;
          });
        });
        
        return {
          ...sheet,
          data: updatedData
        };
      });

      // Обновляем модель
      const updatedModel = {
        ...currentModel,
        sheets: updatedSheets,
        lastModified: new Date().toISOString()
      };

      // Пересчитываем результаты для всех страниц
      const newResultsData = generateResultsData(updatedModel);
      
      // ИСПРАВЛЕНИЕ: Обновляем состояние модели сразу
      setCurrentModel(updatedModel);
      setResultsData(newResultsData);
      
      // ИСПРАВЛЕНИЕ: Принудительно обновляем компонент результатов
      if (activeSheet === 'results') {
        console.log('Forcing results page refresh');
        // Используем более надежный способ обновления
        const currentActiveSheet = activeSheet;
        setActiveSheet('assumptions');
        await new Promise(resolve => setTimeout(resolve, 50));
        setActiveSheet(currentActiveSheet);
      }
      
      // Отправляем обновления на сервер
      try {
        await fetch('/api/model/apply-changes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: currentModel.id,
            sheets: updatedSheets
          })
        });
      } catch (serverError) {
        console.warn('Ошибка при отправке на сервер:', serverError);
        // Не блокируем локальное обновление при ошибке сервера
      }

      console.log('Изменения успешно применены, результаты обновлены');
      
    } catch (error) {
      console.error('Ошибка при применении изменений:', error);
    }
  };





  return (
    <div className="min-h-screen bg-background">
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
        <div className="fixed inset-0 bg-background/75 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                🤖 ИИ создает вашу модель
              </h3>
              <p className="text-muted-foreground text-sm">
                Анализируем ваш бизнес и строим финансовую модель...
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentModel ? (
        // Лендинг страница
        <LandingPage 
          templates={implementedTemplatesList.slice(0, 6)}
          onTemplateSelect={loadTemplate}
          onShowTemplateGallery={() => setShowTemplateGallery(true)}
          onShowModelGenerator={() => setShowModelGenerator(true)}
          onBackToDashboard={() => window.history.back()}
        />
      ) : (
        // Интерфейс редактора модели
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="p-6 bg-card backdrop-blur-sm border border-border rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-fade-in shadow-lg mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentModel(null)}
                  className="w-12 h-12 bg-surface/50 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                >
                  <span>←</span>
                </button>
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{currentModel?.name}</h1>
                  <p className="text-muted-foreground">
                    Создано: {currentModel && currentModel.createdAt ? new Date(currentModel.createdAt).toLocaleDateString('ru-RU') : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  🤖 ИИ Помощник
                </button>
              </div>
            </header>

            {/* Main Content */}
            <div className="flex h-screen">
              {/* Left Sidebar - Sheets - скрыта на странице результатов */}
              {activeSheet !== 'results' && (
                <ModelSidebar 
                  currentModel={currentModel}
                  activeSheet={activeSheet}
                  onSheetSelect={setActiveSheet}
                  onShowTemplateGallery={() => setShowTemplateGallery(true)}
                  onShowModelGenerator={() => setShowModelGenerator(true)}
                  onShowResults={() => setActiveSheet('results')}
                />
              )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col bg-card rounded-r-xl shadow-lg ${activeSheet === 'results' ? 'w-full' : ''}`}>
                {/* Кнопка результатов в заголовке */}
                <div className="bg-surface/50 border-b border-border p-4 flex justify-between items-center rounded-tr-xl">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {currentModel?.name || 'Финансовая модель'}
                  </h1>
                  <p className="text-muted-foreground text-sm">
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
                      className="px-4 py-2 rounded-lg font-medium transition-colors bg-muted dark:bg-surface-accent text-foreground dark:text-foreground hover:bg-muted/80 dark:hover:bg-surface-hover"
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
                <ModelEditor 
                  currentModel={currentModel}
                  activeSheet={activeSheet}
                  onCellUpdate={handleCellUpdate}
                  onExportExcel={exportToExcel}
                  onExportPDF={exportToPDF}
                  onExportGoogleSheets={exportToGoogleSheets}
                  onShowResults={() => setActiveSheet('results')}
                  onContextMenu={handleContextMenu}
                  onApplyChanges={handleApplyChanges}
                />


              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Выберите лист для редактирования</h3>
                    <p>Используйте боковую панель для навигации по листам модели</p>
                  </div>
                </div>
              )}
            </div>
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
