const FinancialModelService = require('../services/financialModelService');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Тест генерации финансовой модели кофейни
async function testCoffeeShopModel() {
  console.log('🧪 Тестирование генерации финансовой модели кофейни...');
  
  try {
    const testData = {
      template: 'coffee-shop',
      period: 5,
      currency: 'KZT',
      language: 'ru',
      assumptions: {
        seats: 25,
        avg_check: 2000,
        working_hours: 14,
        working_days: 365,
        tax_rate: 0.20,
        rent_per_month: 600000,
        staff_cost: 400000,
        food_cost_percent: 0.30,
        growth_rate: 0.12,
        wacc: 0.15,
        occupancy_rate: 0.65,
        operating_expenses_percent: 0.20
      }
    };
    
    console.log('📊 Входные данные:', JSON.stringify(testData, null, 2));
    
    const result = await FinancialModelService.generateModel(testData);
    
    if (result.success) {
      console.log('✅ Модель успешно сгенерирована!');
      console.log('📁 Имя файла:', result.filename);
      console.log('📏 Размер буфера:', result.buffer.length, 'байт');
      console.log('🏷️ Метаданные:', result.metadata);
      
      // Сохраняем файл для проверки
      const testDir = path.join(__dirname, 'output');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const filePath = path.join(testDir, result.filename);
      fs.writeFileSync(filePath, result.buffer);
      console.log('💾 Файл сохранен:', filePath);
      
      // Проверяем содержимое Excel файла
      await validateExcelContent(result.buffer);
      
    } else {
      console.error('❌ Ошибка генерации модели:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error(error.stack);
  }
}

// Проверка содержимого Excel файла
async function validateExcelContent(buffer) {
  console.log('\n🔍 Проверка содержимого Excel файла...');
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    console.log('📋 Листы в файле:');
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`  ${sheetId}. ${worksheet.name}`);
    });
    
    // Проверяем лист предпосылок
    const assumptionsSheet = workbook.getWorksheet('Предпосылки');
    if (assumptionsSheet) {
      console.log('\n⚙️ Предпосылки:');
      const taxRate = assumptionsSheet.getCell('B2').value;
      const avgCheck = assumptionsSheet.getCell('B5').value;
      const seats = assumptionsSheet.getCell('B6').value;
      
      console.log(`  Налоговая ставка: ${taxRate}`);
      console.log(`  Средний чек: ${avgCheck}`);
      console.log(`  Количество мест: ${seats}`);
    }
    
    // Проверяем лист выручки
    const revenueSheet = workbook.getWorksheet('Выручка');
    if (revenueSheet) {
      console.log('\n💰 Выручка (Год 1):');
      const visitors = revenueSheet.getCell('B2').value;
      const avgCheck = revenueSheet.getCell('B3').value;
      const dailyRevenue = revenueSheet.getCell('B4').value;
      const yearlyRevenue = revenueSheet.getCell('B6').value;
      
      console.log(`  Посетителей в день: ${visitors}`);
      console.log(`  Средний чек: ${avgCheck}`);
      console.log(`  Выручка в день: ${dailyRevenue}`);
      console.log(`  Выручка в год: ${yearlyRevenue}`);
    }
    
    // Проверяем лист P&L
    const pnlSheet = workbook.getWorksheet('Отчет о прибылях и убытках');
    if (pnlSheet) {
      console.log('\n📋 P&L (Год 1):');
      const revenue = pnlSheet.getCell('B2').value;
      const expenses = pnlSheet.getCell('B3').value;
      const ebitda = pnlSheet.getCell('B4').value;
      const ebit = pnlSheet.getCell('B6').value;
      const taxes = pnlSheet.getCell('B7').value;
      const netProfit = pnlSheet.getCell('B8').value;
      const profitability = pnlSheet.getCell('B9').value;
      
      console.log(`  Выручка: ${revenue}`);
      console.log(`  Операционные расходы: ${expenses}`);
      console.log(`  EBITDA: ${ebitda}`);
      console.log(`  EBIT: ${ebit}`);
      console.log(`  Налоги: ${taxes}`);
      console.log(`  Чистая прибыль: ${netProfit}`);
      console.log(`  Рентабельность: ${profitability}`);
      
      // Проверяем, что формулы работают корректно
      if (typeof taxes === 'object' && taxes.formula) {
        console.log(`  ✅ Формула налогов: ${taxes.formula}`);
      }
      if (typeof profitability === 'object' && profitability.formula) {
        console.log(`  ✅ Формула рентабельности: ${profitability.formula}`);
      }
    }
    
    console.log('\n✅ Проверка Excel файла завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке Excel файла:', error.message);
  }
}

// Тест доступных шаблонов
function testAvailableTemplates() {
  console.log('\n🏗️ Тестирование доступных шаблонов...');
  
  try {
    const templates = FinancialModelService.getAvailableTemplates();
    console.log(`📋 Найдено шаблонов: ${templates.length}`);
    
    templates.forEach((template, index) => {
      console.log(`\n${index + 1}. ${template.name} (${template.id})`);
      console.log(`   Описание: ${template.description}`);
      console.log(`   Предпосылки: ${template.assumptions.join(', ')}`);
      console.log(`   Листы: ${template.sheets.map(s => s.name).join(', ')}`);
    });
    
    console.log('\n✅ Тест шаблонов завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании шаблонов:', error.message);
  }
}

// Запуск всех тестов
async function runAllTests() {
  console.log('🚀 Запуск тестов финансовой модели\n');
  console.log('=' .repeat(50));
  
  testAvailableTemplates();
  await testCoffeeShopModel();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Все тесты завершены!');
}

// Запускаем тесты, если файл выполняется напрямую
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCoffeeShopModel,
  testAvailableTemplates,
  validateExcelContent,
  runAllTests
};
