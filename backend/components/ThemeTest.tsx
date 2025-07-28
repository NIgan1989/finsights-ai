import React from 'react';
import { useTheme } from './ThemeProvider';

const ThemeTest: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Тест темной темы</h1>
          <p className="text-text-secondary mb-6">Текущая тема: {theme}</p>
          <button 
            onClick={toggleTheme}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition"
          >
            Переключить тему
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Карточки с разными цветами */}
          <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold mb-4">Поверхность (Surface)</h3>
            <p className="text-text-secondary">Это карточка с цветом поверхности</p>
          </div>

          <div className="bg-surface-accent p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold mb-4">Акцентная поверхность</h3>
            <p className="text-text-secondary">Это карточка с акцентным цветом</p>
          </div>

          <div className="bg-primary p-6 rounded-xl text-primary-foreground">
            <h3 className="text-lg font-semibold mb-4">Основной цвет</h3>
            <p>Это карточка с основным цветом</p>
          </div>

          <div className="bg-success p-6 rounded-xl text-success-foreground">
            <h3 className="text-lg font-semibold mb-4">Успех</h3>
            <p>Это карточка с цветом успеха</p>
          </div>
        </div>

        {/* Текст разных типов */}
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4">Типы текста</h3>
          <div className="space-y-2">
            <p className="text-text-primary">Основной текст (Primary)</p>
            <p className="text-text-secondary">Вторичный текст (Secondary)</p>
            <p className="text-text-disabled">Отключенный текст (Disabled)</p>
            <p className="text-destructive">Деструктивный текст (Destructive)</p>
            <p className="text-success">Успешный текст (Success)</p>
          </div>
        </div>

        {/* Градиенты */}
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-surface-accent dark:via-surface dark:to-background p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Градиентный фон</h3>
          <p className="text-text-secondary">Этот блок использует градиентный фон</p>
        </div>

        {/* Кнопки */}
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4">Кнопки</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition">
              Основная кнопка
            </button>
            <button className="px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-surface-accent transition">
              Вторичная кнопка
            </button>
            <button className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:opacity-90 transition">
              Успешная кнопка
            </button>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition">
              Деструктивная кнопка
            </button>
          </div>
        </div>

        {/* Формы */}
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4">Формы</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Текстовое поле
              </label>
              <input 
                type="text" 
                placeholder="Введите текст..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Выпадающий список
              </label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Опция 1</option>
                <option>Опция 2</option>
                <option>Опция 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest; 