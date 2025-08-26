const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

const router = express.Router();

// Экспорт в Excel
router.post('/excel', async (req, res) => {
  try {
    const { data, filename = 'financial_data.xlsx' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Данные для экспорта не предоставлены' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Финансовые данные');

    // Настройка заголовков
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);

    // Стилизация заголовков
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Добавление данных
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });

    // Автоподбор ширины колонок
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Генерация буфера
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

    logger.info('Excel файл успешно экспортирован');
  } catch (error) {
    logger.error('Ошибка экспорта в Excel:', error);
    res.status(500).json({ error: 'Ошибка при экспорте в Excel', details: error.message });
  }
});

// Экспорт в PDF
router.post('/pdf', async (req, res) => {
  try {
    const { data, title = 'Финансовый отчет', filename = 'financial_report.pdf' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Данные для экспорта не предоставлены' });
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
      logger.info('PDF файл успешно экспортирован');
    });

    // Заголовок
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();

    // Таблица данных
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const tableTop = doc.y;
      const itemHeight = 20;
      const columnWidth = (doc.page.width - 100) / headers.length;

      // Заголовки таблицы
      doc.fontSize(12).fillColor('black');
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * columnWidth, tableTop, {
          width: columnWidth,
          align: 'left'
        });
      });

      // Линия под заголовками
      doc.moveTo(50, tableTop + 15)
         .lineTo(doc.page.width - 50, tableTop + 15)
         .stroke();

      // Данные таблицы
      data.forEach((row, rowIndex) => {
        const y = tableTop + (rowIndex + 1) * itemHeight + 5;
        headers.forEach((header, colIndex) => {
          const value = row[header] || '';
          doc.text(String(value), 50 + colIndex * columnWidth, y, {
            width: columnWidth,
            align: 'left'
          });
        });
      });
    }

    doc.end();
  } catch (error) {
    logger.error('Ошибка экспорта в PDF:', error);
    res.status(500).json({ error: 'Ошибка при экспорте в PDF', details: error.message });
  }
});

// Экспорт в Google Sheets (заглушка)
router.post('/google-sheets', async (req, res) => {
  try {
    const { data, title = 'Финансовые данные' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Данные для экспорта не предоставлены' });
    }

    // Здесь должна быть интеграция с Google Sheets API
    // Пока возвращаем заглушку
    logger.info('Запрос на экспорт в Google Sheets получен');
    
    res.json({ 
      success: true, 
      message: 'Экспорт в Google Sheets временно недоступен. Функция будет добавлена в следующих обновлениях.',
      url: null
    });
  } catch (error) {
    logger.error('Ошибка экспорта в Google Sheets:', error);
    res.status(500).json({ error: 'Ошибка при экспорте в Google Sheets', details: error.message });
  }
});

module.exports = router;