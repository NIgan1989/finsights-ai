const ExcelUtils = require('../utils/excelUtils');
const { validate, customValidators } = require('../utils/validation');
const { getFinancialTemplates } = require('../templates/financialTemplates');

class FinancialModelService {
  static async generateModel(requestData) {
    try {
      // Валидация входных данных
      const validatedData = validate.createModel(requestData);
      
      // Дополнительная валидация бизнес-логики
      if (validatedData.template === 'coffee-shop') {
        customValidators.validateCoffeeShopAssumptions(validatedData.assumptions);
      }
      
      // Создание Excel файла
      const workbook = await ExcelUtils.createFinancialModel(
        validatedData.template,
        validatedData.assumptions
      );
      
      // Генерация буфера
      const buffer = await ExcelUtils.generateBuffer(workbook);
      
      return {
        success: true,
        buffer,
        filename: `financial_model_${validatedData.template}_${Date.now()}.xlsx`,
        metadata: {
          template: validatedData.template,
          period: validatedData.period,
          currency: validatedData.currency,
          language: validatedData.language,
          createdAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Error generating financial model:', error);
      throw new Error(`Failed to generate financial model: ${error.message}`);
    }
  }
  
  static getAvailableTemplates() {
    const templates = getFinancialTemplates();
    
    return Object.keys(templates).map(key => ({
      id: key,
      name: this.getTemplateName(key),
      description: this.getTemplateDescription(key),
      assumptions: Object.keys(templates[key].assumptions),
      sheets: templates[key].sheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        type: sheet.type,
        icon: sheet.icon
      }))
    }));
  }
  
  static getTemplateById(templateId) {
    const templates = getFinancialTemplates();
    const template = templates[templateId];
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return {
      id: templateId,
      name: this.getTemplateName(templateId),
      description: this.getTemplateDescription(templateId),
      assumptions: template.assumptions,
      sheets: template.sheets
    };
  }
  
  static getTemplateName(templateId) {
    const names = {
      'coffee-shop': 'Кофейня / Кафе',
      'saas-startup': 'SaaS / Подписки',
      'retail-store': 'Розничный магазин',
      'manufacturing': 'Производство',
      'ecommerce': 'Интернет-магазин',
      'consulting': 'Консалтинг / Услуги',
      'real-estate': 'Аренда недвижимости',
      'restaurant': 'Ресторан',
      'medical-clinic': 'Медицинская клиника',
      'education-courses': 'Образовательные курсы',
      'logistics-delivery': 'Логистика и доставка',
      'tourism-hotel': 'Отель / Гостиница',
      'auto-service': 'Автосервис',
      'beauty-salon': 'Салон красоты'
    };
    
    return names[templateId] || templateId;
  }
  
  static getTemplateDescription(templateId) {
    const descriptions = {
      'coffee-shop': 'Финансовая модель для кофейни или небольшого кафе с учетом посадочных мест, среднего чека и операционных расходов',
      'saas-startup': 'Модель для подписочного бизнеса (SaaS) с метриками MRR/ARR, CAC, LTV и Churn',
      'retail-store': 'Модель для розничного магазина с управлением запасами, товарооборотом и сезонностью',
      'manufacturing': 'Производственная модель с учетом мощностей, CAPEX и себестоимости единицы продукции',
      'ecommerce': 'E-commerce модель с воронкой трафика, конверсиями и логистикой',
      'consulting': 'Модель сервисного бизнеса с почасовой оплатой и загрузкой специалистов',
      'real-estate': 'Модель управления арендной недвижимостью с доходностью и ремонтом',
      'restaurant': 'Комплексная модель ресторана с учетом кухни, персонала и сезонности',
      'medical-clinic': 'Модель частной клиники с приемами пациентов и медицинскими услугами',
      'education-courses': 'Модель образовательного центра или онлайн-курсов с наборами студентов',
      'logistics-delivery': 'Модель службы доставки с автопарком, маршрутами и складом',
      'tourism-hotel': 'Модель гостиничного бизнеса с номерным фондом и сезонностью',
      'auto-service': 'Модель автосервиса со специализациями и продажей запчастей',
      'beauty-salon': 'Модель салона красоты с услугами, мастерами и абонементами'
    };
    
    return descriptions[templateId] || 'Описание недоступно';
  }
  
  static async validateModelData(modelData) {
    try {
      // Базовая валидация структуры
      if (!modelData || typeof modelData !== 'object') {
        throw new Error('Invalid model data structure');
      }
      
      // Проверка наличия обязательных листов
      const requiredSheets = ['assumptions', 'revenue', 'expenses', 'pnl'];
      const availableSheets = Object.keys(modelData);
      
      const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));
      if (missingSheets.length > 0) {
        throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
      }
      
      // Валидация данных по листам
      for (const [sheetName, sheetData] of Object.entries(modelData)) {
        if (!Array.isArray(sheetData) || sheetData.length === 0) {
          throw new Error(`Sheet ${sheetName} must contain data`);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Model validation error:', error);
      throw error;
    }
  }
  
  static calculateKPIs(modelData) {
    try {
      const kpis = {};
      
      // Извлекаем данные из P&L листа
      if (modelData.pnl && modelData.pnl.length > 1) {
        const pnlData = modelData.pnl;
        
        // Находим строки с ключевыми показателями
        const revenueRow = pnlData.find(row => row[0] && row[0].includes('Выручка'));
        const netProfitRow = pnlData.find(row => row[0] && row[0].includes('Чистая прибыль'));
        const profitabilityRow = pnlData.find(row => row[0] && row[0].includes('Рентабельность'));
        
        if (revenueRow && revenueRow.length > 1) {
          kpis.totalRevenue = revenueRow.slice(1).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
          kpis.averageRevenue = kpis.totalRevenue / (revenueRow.length - 1);
        }
        
        if (netProfitRow && netProfitRow.length > 1) {
          kpis.totalNetProfit = netProfitRow.slice(1).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
          kpis.averageNetProfit = kpis.totalNetProfit / (netProfitRow.length - 1);
        }
        
        if (profitabilityRow && profitabilityRow.length > 1) {
          const profitMargins = profitabilityRow.slice(1).map(val => parseFloat(val) || 0);
          kpis.averageProfitMargin = profitMargins.reduce((sum, val) => sum + val, 0) / profitMargins.length;
          kpis.maxProfitMargin = Math.max(...profitMargins);
          kpis.minProfitMargin = Math.min(...profitMargins);
        }
      }
      
      // Расчет ROI и payback period
      if (kpis.totalNetProfit && modelData.assumptions) {
        const initialInvestment = 5000000; // Примерная начальная инвестиция для кофейни
        kpis.roi = (kpis.totalNetProfit / initialInvestment) * 100;
        
        if (kpis.averageNetProfit > 0) {
          kpis.paybackPeriod = initialInvestment / kpis.averageNetProfit;
        }
      }
      
      return kpis;
      
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      return {};
    }
  }
}

module.exports = FinancialModelService;
