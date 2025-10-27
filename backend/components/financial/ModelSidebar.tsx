import React from 'react';
import { FinancialModel } from '../../models/financialModels';

interface ModelSidebarProps {
  currentModel: FinancialModel;
  activeSheet: string;
  onSheetSelect: (sheetId: string) => void;
  onShowTemplateGallery: () => void;
  onShowModelGenerator: () => void;
  onShowResults: () => void;
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  currentModel,
  activeSheet,
  onSheetSelect,
  onShowTemplateGallery,
  onShowModelGenerator,
  onShowResults
}) => {
  return (
    <div className="w-80 bg-card border-r border-border overflow-y-auto rounded-l-xl shadow-lg">
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">ЛИСТЫ МОДЕЛИ</h2>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={onShowTemplateGallery}
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-xs py-2 px-3 rounded transition"
            >
              📊 Шаблоны
            </button>
            <button
              onClick={onShowModelGenerator}
              className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-2 px-3 rounded transition"
            >
              🤖 ИИ Генератор
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {/* Кнопка результатов в боковой панели */}
          <button
            onClick={onShowResults}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
              activeSheet === 'results'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">📊</span>
              <span className="font-medium">Результаты</span>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              dashboard
            </span>
          </button>
          
          {/* Разделитель */}
          <div className="border-t border-border my-3"></div>
          
          {/* Листы модели */}
          {currentModel?.sheets?.filter(sheet => sheet.type !== 'results').map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => onSheetSelect(sheet.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                activeSheet === sheet.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{sheet.icon}</span>
                <span className="font-medium">{sheet.name}</span>
              </div>
              {sheet.type && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {sheet.type}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Model Stats */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-3">Статистика модели</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>Листов: {currentModel?.sheets?.length || 0}</div>
            <div>Создана: {currentModel && currentModel.createdAt ? new Date(currentModel.createdAt).toLocaleString('ru-RU') : ''}</div>
            <div>Изменена: {new Date().toLocaleString('ru-RU')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSidebar;