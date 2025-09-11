import React from 'react';
import EditableCell from '../EditableCell';
import { evaluateFormula } from '../../utils/formulaEvaluator';
import { ModelSheet } from '../../models/financialModels';

interface DataTableProps {
  currentSheet: ModelSheet;
  sheets: ModelSheet[];
  editingCell: { row: number; col: number } | null;
  currentCell: { row: number; col: number; value: string };
  showFormulas: boolean;
  dragState: {
    isDragging: boolean;
    draggedRow: number | null;
    targetRow: number | null;
  };
  onCellClick: (row: number, col: number, value: string) => void;
  onStartEdit: (row: number, col: number) => void;
  onSaveCell: (row: number, col: number, value: string) => void;
  onCancelEdit: () => void;
  onContextMenu: (row: number, col: number, event: React.MouseEvent) => void;
  onDragStart: (row: number, col: number) => void;
  onDragOver: (row: number, col: number) => void;
  onDrop: (row: number, col: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  currentSheet,
  sheets,
  editingCell,
  currentCell,
  showFormulas,
  dragState,
  onCellClick,
  onStartEdit,
  onSaveCell,
  onCancelEdit,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  if (!currentSheet) {
    return <div>Лист не найден</div>;
  }

  return (
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {currentSheet.data.map((row, rowIndex) => (
          <tr 
            key={rowIndex}
            onClick={(e) => {
              // Получаем индекс колонки из клика
              const target = e.target as HTMLElement;
              const td = target.closest('td');
              if (td) {
                const cellIndex = Array.from(td.parentElement?.children || []).indexOf(td);
                if (cellIndex >= 0) {
                  onCellClick(rowIndex, cellIndex, String(row[cellIndex] || ''));
                }
              }
            }}
            className={`
              ${rowIndex === 0 ? 'sticky top-0 z-10' : ''}
              ${rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted'}
              hover:bg-primary/10 transition-colors duration-150
            `}
          >
            {Array.isArray(row) ? row.map((cell, cellIndex) => {
              // Определяем значение для отображения
              let displayValue = cell || '';
              
              if (typeof cell === 'string' && cell.startsWith('=')) {
                if (showFormulas) {
                  // Показываем формулу как есть
                  displayValue = cell;
                } else {
                  // Вычисляем и показываем результат
                  try {
                    const result = evaluateFormula(cell, sheets, currentSheet.data);
                    // Проверяем, является ли это формулой рентабельности (деление на выручку)
                    if (typeof result === 'number' && cell.includes('/') && (cell.includes('B2') || cell.includes('C2') || cell.includes('D2'))) {
                      displayValue = `${Math.round(result * 100)}%`;
                    } else {
                      displayValue = result;
                    }
                  } catch (error) {
                    console.warn(`Ошибка при вычислении формулы ${cell}:`, error);
                    displayValue = cell; // Показываем формулу при ошибке
                  }
                }
              }
              
              return (
                <EditableCell
                  key={cellIndex}
                  value={displayValue}
                  rowIndex={rowIndex}
                  colIndex={cellIndex}
                  isEditing={editingCell?.row === rowIndex && editingCell?.col === cellIndex}
                  onStartEdit={(row, col) => {
                    onStartEdit(row, col);
                  }}
                  onSave={(row, col, value) => {
                    onSaveCell(row, col, value);
                  }}
                  onCancel={() => {
                    onCancelEdit();
                  }}
                  isHeader={rowIndex === 0 && cellIndex === 0}
                  isFormula={typeof cell === 'string' && cell.startsWith('=')}
                  sheetType={currentSheet.type}
                  onContextMenu={onContextMenu}
                  isDragging={dragState.isDragging && dragState.draggedRow === rowIndex}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  showFormulas={showFormulas}
                />
               );
             }) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;