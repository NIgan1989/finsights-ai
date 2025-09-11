import React, { useState } from 'react';
import FormulaBar from '../FormulaBar';
import DataTable from './DataTable';
import { FinancialModel, ModelSheet, ContextMenuState, DragState, CellPosition } from '../../models/financialModels';

interface ModelEditorProps {
  currentModel: FinancialModel;
  activeSheet: string;
  onCellUpdate: (sheetId: string, row: number, col: number, value: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportGoogleSheets?: () => void;
  onShowResults: () => void;
  onContextMenu: (row: number, col: number, event: React.MouseEvent) => void;
  onApplyChanges?: () => void;
}

const ModelEditor: React.FC<ModelEditorProps> = ({
  currentModel,
  activeSheet,
  onCellUpdate,
  onExportExcel,
  onExportPDF,
  onExportGoogleSheets,
  onShowResults,
  onContextMenu,
  onApplyChanges
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<CellPosition>({ row: -1, col: -1, value: '' });
  const [showFormulas, setShowFormulas] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedRow: null,
    targetRow: null
  });

  const currentSheetData = currentModel?.sheets?.find(s => s.id === activeSheet);

  // Обработчики для таблицы данных
  const handleCellClick = (row: number, col: number, value: string) => {
    setCurrentCell({ row, col, value });
  };

  const handleStartEdit = (row: number, col: number) => {
    setEditingCell({ row, col });
    setCurrentCell({ row, col, value: String(currentSheetData?.data[row]?.[col] || '') });
  };

  const handleSaveCell = (row: number, col: number, value: string) => {
    if (currentSheetData) {
      onCellUpdate(currentSheetData.id, row, col, value);
    }
    setEditingCell(null);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  // Обработчики для перетаскивания
  const handleDragStart = (row: number, col: number) => {
    if (col !== 0) return; // Только строки целиком
    setDragState({
      isDragging: true,
      draggedRow: row,
      targetRow: null
    });
  };

  const handleDragOver = (row: number, col: number) => {
    if (!dragState.isDragging || col !== 0) return;
    setDragState({
      ...dragState,
      targetRow: row
    });
  };

  const handleDrop = (row: number, col: number) => {
    if (!dragState.isDragging || !currentModel || dragState.draggedRow === null) return;

    const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
    if (!sheet) return;

    const newData = [...sheet.data];
    const draggedRowData = newData[dragState.draggedRow];
    
    // Удаляем исходную строку
    newData.splice(dragState.draggedRow, 1);
    
    // Вставляем в новое место
    const insertIndex = row > dragState.draggedRow ? row - 1 : row;
    newData.splice(insertIndex, 0, draggedRowData);

    const updatedSheets = currentModel?.sheets?.map(s => 
      s.id === activeSheet ? { ...s, data: newData } : s
    );

    // Здесь нужно обновить модель, но это должно происходить в родительском компоненте
    // Поэтому мы просто сбрасываем состояние перетаскивания
    
    setDragState({
      isDragging: false,
      draggedRow: null,
      targetRow: null
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Formula Bar */}
      <FormulaBar
        currentCell={currentCell}
        isEditing={editingCell !== null}
        onFormulaChange={(formula) => {
          if (editingCell && currentSheetData) {
            onCellUpdate(currentSheetData.id, editingCell.row, editingCell.col, formula);
          }
        }}
        onEnter={() => setEditingCell(null)}
        onCancel={() => setEditingCell(null)}
      />

      {/* Toolbar */}
      <div className="bg-muted dark:bg-surface border-b border-border dark:border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Быстрые действия:</span>
              <button
                onClick={() => {
                  const sheet = currentModel?.sheets?.find(s => s.id === activeSheet);
                  if (sheet && sheet.data && sheet.data.length > 0) {
                    const newRow = new Array(sheet.data[0]?.length || 4).fill('');
                    newRow[0] = 'Новая статья';
                    const newData = [...sheet.data, newRow];
                    const updatedSheet = { ...sheet, data: newData };
                    const updatedSheets = currentModel.sheets.map(s => 
                      s.id === activeSheet ? updatedSheet : s
                    );
                    // Здесь нужно обновить модель, но это должно происходить в родительском компоненте
                  }
                }}
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1 rounded text-sm transition"
              >
                ➕ Добавить строку
              </button>
              <button
                onClick={() => {
                  if (currentCell.row > 0 && currentCell.col > 0 && currentSheetData) {
                    const formula = `=SUM(${String.fromCharCode(65 + currentCell.col)}2:${String.fromCharCode(65 + currentCell.col)}${currentCell.row + 1})`;
                    onCellUpdate(currentSheetData.id, currentCell.row, currentCell.col, formula);
                  }
                }}
                className="bg-success hover:bg-success/90 text-success-foreground px-3 py-1 rounded text-sm transition"
              >
                ∑ Сумма
              </button>
              <button
                onClick={() => {
                  if (currentCell.row >= 0 && currentCell.col >= 0 && currentSheetData) {
                    if (currentCell.col > 1) {
                      // Формула для роста на 15% от предыдущего года
                      const formula = `=${String.fromCharCode(65 + currentCell.col - 1)}${currentCell.row + 1}*1.15`;
                      onCellUpdate(currentSheetData.id, currentCell.row, currentCell.col, formula);
                    } else if (currentCell.col === 1 && currentSheetData.data[currentCell.row]) {
                      // Для первого года - просто умножаем текущее значение на 1.15
                      const currentValue = currentSheetData.data[currentCell.row]?.[currentCell.col];
                      const numValue = parseFloat(String(currentValue || '0').replace(/[^\d.-]/g, ''));
                      if (!isNaN(numValue)) {
                        const newValue = String(Math.round(numValue * 1.15));
                        onCellUpdate(currentSheetData.id, currentCell.row, currentCell.col, newValue);
                      }
                    }
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-sm transition"
              >
                📈 Рост 15%
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-xs text-muted-foreground">
              💡 Кликните на ячейку для редактирования
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-success/20 border border-success/30 rounded"></div>
              <span className="text-xs text-muted-foreground">Доходы</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-destructive/20 border border-destructive/30 rounded"></div>
              <span className="text-xs text-muted-foreground">Расходы</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded"></div>
              <span className="text-xs text-muted-foreground">Формулы</span>
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                id="showFormulas"
                checked={showFormulas}
                onChange={(e) => setShowFormulas(e.target.checked)}
                className="w-3 h-3 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="showFormulas" className="text-xs text-muted-foreground cursor-pointer">
                Показывать формулы
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto relative">
        {currentSheetData ? (
          <DataTable
            currentSheet={currentSheetData}
            sheets={currentModel.sheets}
            editingCell={editingCell}
            currentCell={currentCell}
            showFormulas={showFormulas}
            dragState={dragState}
            onCellClick={handleCellClick}
            onStartEdit={handleStartEdit}
            onSaveCell={handleSaveCell}
            onCancelEdit={handleCancelEdit}
            onContextMenu={onContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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

      {/* Export Buttons */}
      <div className="bg-muted p-3 border-t border-border flex justify-between items-center">
        {/* Кнопка "Применить изменения" для страницы предпосылок */}
        {activeSheet === 'assumptions' && onApplyChanges && (
          <button
            onClick={onApplyChanges}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center space-x-2"
          >
            <span>⚡</span>
            <span>Применить изменения</span>
          </button>
        )}
        
        {/* Пустой div для выравнивания, если кнопка не показывается */}
        {!(activeSheet === 'assumptions' && onApplyChanges) && <div></div>}
        
        {/* Кнопки экспорта */}
        <div className="flex space-x-2">
          <button
            onClick={onShowResults}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded text-sm font-medium transition"
          >
            📊 Результаты
          </button>
          <button
            onClick={onExportExcel}
            className="bg-success hover:bg-success/90 text-success-foreground px-4 py-2 rounded text-sm font-medium transition"
          >
            📥 Экспорт Excel
          </button>
          <button
            onClick={onExportPDF}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded text-sm font-medium transition"
          >
            📄 Экспорт PDF
          </button>
          {onExportGoogleSheets && (
            <button
              onClick={onExportGoogleSheets}
              className="bg-muted-foreground hover:bg-muted-foreground/90 text-muted px-4 py-2 rounded text-sm font-medium transition"
            >
              🌐 Google Sheets
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelEditor;