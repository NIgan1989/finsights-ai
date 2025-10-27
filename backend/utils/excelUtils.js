const ExcelJS = require('exceljs');
const { getFinancialTemplates } = require('../templates/financialTemplates');

class ExcelUtils {
  static async createFinancialModel(templateName, customAssumptions = {}) {
    const templates = getFinancialTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const workbook = new ExcelJS.Workbook();
    
    // Объединяем базовые предпосылки с пользовательскими
    const assumptions = { ...template.assumptions, ...customAssumptions };
    
    // Создаем листы
    for (const sheetConfig of template.sheets) {
      const worksheet = workbook.addWorksheet(sheetConfig.name);
      
      // Добавляем данные
      sheetConfig.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = worksheet.getCell(rowIndex + 1, colIndex + 1);
          
          if (typeof cell === 'string' && cell.startsWith('=')) {
            // Это формула
            cellRef.value = { formula: cell.substring(1) };
          } else {
            cellRef.value = cell;
          }
        });
      });
      
      // Применяем формулы из конфигурации
      if (sheetConfig.formulas) {
        Object.entries(sheetConfig.formulas).forEach(([cellAddress, formula]) => {
          const cell = worksheet.getCell(cellAddress);
          if (typeof formula === 'string' && formula.startsWith('=')) {
            cell.value = { formula: formula.substring(1) };
          } else {
            cell.value = formula;
          }
        });
      }
      
      // Форматирование заголовков
      if (sheetConfig.data.length > 0) {
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
      }
      
      // Автоширина колонок
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    }
    
    return workbook;
  }
  
  static async generateBuffer(workbook) {
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
  
  static formatCurrency(value, currency = 'KZT') {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  }
  
  static formatPercentage(value) {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }
}

module.exports = ExcelUtils;
