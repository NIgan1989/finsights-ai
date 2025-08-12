const Joi = require('joi');

// Схемы валидации для различных типов данных
const schemas = {
  // Валидация для создания финансовой модели
  createModel: Joi.object({
    template: Joi.string().valid('coffee-shop').required(),
    period: Joi.number().integer().min(1).max(10).default(5),
    currency: Joi.string().valid('KZT', 'USD', 'EUR', 'RUB').default('KZT'),
    language: Joi.string().valid('ru', 'en', 'kk').default('ru'),
    assumptions: Joi.object({
      seats: Joi.number().integer().min(1).max(1000),
      avg_check: Joi.number().min(0),
      working_hours: Joi.number().min(1).max(24),
      working_days: Joi.number().integer().min(1).max(365),
      tax_rate: Joi.number().min(0).max(1),
      rent_per_month: Joi.number().min(0),
      staff_cost: Joi.number().min(0),
      food_cost_percent: Joi.number().min(0).max(1),
      growth_rate: Joi.number().min(-1).max(5),
      wacc: Joi.number().min(0).max(1),
      occupancy_rate: Joi.number().min(0).max(1),
      operating_expenses_percent: Joi.number().min(0).max(1)
    }).default({})
  }),
  
  // Валидация для чата с AI
  chatMessage: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    context: Joi.object({
      modelData: Joi.object().optional(),
      previousMessages: Joi.array().items(Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().required()
      })).max(10).default([])
    }).default({})
  }),
  
  // Валидация для прогнозирования
  forecast: Joi.object({
    data: Joi.object({
      revenue: Joi.array().items(Joi.number()).min(1).max(60).required(),
      expenses: Joi.array().items(Joi.number()).min(1).max(60).required(),
      period: Joi.string().valid('monthly', 'quarterly', 'yearly').default('monthly')
    }).required(),
    forecastPeriods: Joi.number().integer().min(1).max(24).default(12),
    includeSeasonality: Joi.boolean().default(true),
    confidenceLevel: Joi.number().min(0.8).max(0.99).default(0.95)
  })
};

// Функции валидации
const validate = {
  createModel: (data) => {
    const { error, value } = schemas.createModel.validate(data, { 
      allowUnknown: false,
      stripUnknown: true 
    });
    
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }
    
    return value;
  },
  
  chatMessage: (data) => {
    const { error, value } = schemas.chatMessage.validate(data, { 
      allowUnknown: false,
      stripUnknown: true 
    });
    
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }
    
    return value;
  },
  
  forecast: (data) => {
    const { error, value } = schemas.forecast.validate(data, { 
      allowUnknown: false,
      stripUnknown: true 
    });
    
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }
    
    return value;
  }
};

// Дополнительные валидаторы
const customValidators = {
  // Проверка корректности финансовых данных
  validateFinancialData: (data) => {
    const errors = [];
    
    // Проверяем, что выручка больше расходов хотя бы в одном периоде
    const hasProfit = data.revenue.some((rev, index) => rev > (data.expenses[index] || 0));
    if (!hasProfit) {
      errors.push('Revenue should exceed expenses in at least one period');
    }
    
    // Проверяем на отрицательные значения
    if (data.revenue.some(val => val < 0)) {
      errors.push('Revenue values cannot be negative');
    }
    
    if (data.expenses.some(val => val < 0)) {
      errors.push('Expense values cannot be negative');
    }
    
    // Проверяем длину массивов
    if (data.revenue.length !== data.expenses.length) {
      errors.push('Revenue and expenses arrays must have the same length');
    }
    
    if (errors.length > 0) {
      throw new Error(`Financial data validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  },
  
  // Проверка бизнес-логики для кофейни
  validateCoffeeShopAssumptions: (assumptions) => {
    const errors = [];
    
    // Проверяем разумность значений
    if (assumptions.occupancy_rate && assumptions.occupancy_rate > 0.9) {
      errors.push('Occupancy rate above 90% might be unrealistic');
    }
    
    if (assumptions.food_cost_percent && assumptions.food_cost_percent > 0.6) {
      errors.push('Food cost percentage above 60% might be too high');
    }
    
    if (assumptions.growth_rate && assumptions.growth_rate > 1) {
      errors.push('Growth rate above 100% might be unrealistic');
    }
    
    if (assumptions.working_hours && assumptions.working_hours > 18) {
      errors.push('Working hours above 18 per day might be unrealistic');
    }
    
    if (errors.length > 0) {
      console.warn(`Business logic warnings: ${errors.join(', ')}`);
    }
    
    return true;
  }
};

module.exports = {
  validate,
  customValidators,
  schemas
};
