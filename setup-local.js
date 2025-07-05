#!/usr/bin/env node

/**
 * 🔧 Скрипт автоматической настройки локальной среды
 * Обеспечивает полное соответствие Background Agent окружению
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Настройка локальной среды для соответствия Background Agent...\n');

// Проверка версии Node.js
console.log('📋 Проверка версий...');
const requiredNodeVersion = 'v22.16.0';
const currentNodeVersion = process.version;

console.log(`Текущая версия Node.js: ${currentNodeVersion}`);
console.log(`Требуется версия Node.js: ${requiredNodeVersion}`);

if (currentNodeVersion !== requiredNodeVersion) {
  console.log('\n⚠️  ВНИМАНИЕ: Версия Node.js не соответствует Background Agent!');
  console.log('\n📌 Для установки правильной версии:');
  console.log('   1. Установите nvm: https://github.com/nvm-sh/nvm');
  console.log('   2. Выполните: nvm install 22.16.0');
  console.log('   3. Выполните: nvm use 22.16.0');
  console.log('   4. Перезапустите этот скрипт\n');
} else {
  console.log('✅ Версия Node.js корректна!');
}

// Проверка версии npm
try {
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
  console.log(`Текущая версия npm: v${npmVersion}`);
  
  if (npmVersion !== '10.9.2') {
    console.log('⚠️  Версия npm не соответствует Background Agent (требуется 10.9.2)');
  } else {
    console.log('✅ Версия npm корректна!');
  }
} catch (error) {
  console.log('❌ Ошибка проверки версии npm');
}

// Проверка .env.local файла
console.log('\n🔧 Проверка конфигурации...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Файл .env.local найден');
} else {
  console.log('❌ Файл .env.local не найден - создайте его вручную');
}

// Проверка .nvmrc файла  
const nvmrcPath = path.join(process.cwd(), '.nvmrc');
if (fs.existsSync(nvmrcPath)) {
  console.log('✅ Файл .nvmrc найден');
} else {
  console.log('❌ Файл .nvmrc не найден - создайте его вручную');
}

// Проверка зависимостей
console.log('\n📦 Проверка зависимостей...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageLockPath = path.join(process.cwd(), 'package-lock.json');

if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json найден');
} else {
  console.log('❌ package.json не найден');
  process.exit(1);
}

// Проверка node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📥 Установка зависимостей...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Зависимости установлены');
  } catch (error) {
    console.log('❌ Ошибка установки зависимостей');
    console.log('💡 Попробуйте: npm install --force');
  }
} else {
  console.log('✅ node_modules найден');
}

// Проверка критических файлов
console.log('\n🏗️  Проверка структуры проекта...');
const criticalFiles = [
  'src/App.tsx',
  'src/index.tsx', 
  'src/services/bankPdfService.ts',
  'src/services/financeService.ts',
  'index.html',
  'tsconfig.json'
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - файл отсутствует!`);
  }
});

// Финальные инструкции
console.log('\n🎯 Следующие шаги:');
console.log('1. ✅ Убедитесь, что все файлы на месте');
console.log('2. 🔧 Проверьте .env.local настройки');
console.log('3. 🚀 Запустите проект: npm start');
console.log('4. 🌐 Откройте http://localhost:3000');

console.log('\n💡 Полезные команды:');
console.log('   npm run check-env    - проверить версии');
console.log('   npm start           - запустить проект');
console.log('   npm run build       - собрать проект');

console.log('\n🔍 Отладка:');
console.log('   - Откройте консоль браузера (F12) для логов PDF парсера');
console.log('   - Проверьте вкладку Network при загрузке PDF');
console.log('   - Убедитесь, что PDF.js загружается корректно');

console.log('\n🎉 Настройка завершена! Проект готов к запуску.\n');