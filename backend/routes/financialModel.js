const express = require('express');
const FinancialModelService = require('../services/financialModelService');
const logger = require('../utils/logger');

const router = express.Router();

// Генерация финансовой модели
router.post('/generate', async (req, res) => {
  try {
    logger.info('Generating financial model with data:', req.body);
    
    const result = await FinancialModelService.generateModel(req.body);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } else {
      res.status(400).json({ error: 'Failed to generate model', details: result.error });
    }
  } catch (error) {
    logger.error('Error generating financial model:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Получение доступных шаблонов
router.get('/templates', (req, res) => {
  try {
    const templates = FinancialModelService.getAvailableTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    logger.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Получение конкретного шаблона
router.get('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    const template = FinancialModelService.getTemplateById(templateId);
    
    res.json(template);
  } catch (error) {
    logger.error('Error getting template:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: 'Template not found' });
    } else {
      res.status(500).json({ error: 'Failed to get template' });
    }
  }
});

// Валидация данных модели
router.post('/validate', async (req, res) => {
  try {
    const result = await FinancialModelService.validateModelData(req.body);
    res.json({ success: true, valid: true, result });
  } catch (error) {
    logger.error('Validation error:', error);
    res.status(400).json({ 
      success: false, 
      valid: false, 
      error: error.message 
    });
  }
});

// Расчет KPI
router.post('/kpis', (req, res) => {
  try {
    const kpis = FinancialModelService.calculateKPIs(req.body);
    res.json({ success: true, kpis });
  } catch (error) {
    logger.error('Error calculating KPIs:', error);
    res.status(500).json({ error: 'Failed to calculate KPIs' });
  }
});

module.exports = router;
