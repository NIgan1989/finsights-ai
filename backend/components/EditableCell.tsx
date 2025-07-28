import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string | number;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  isHeader?: boolean;
  isFormula?: boolean;
  cellType?: 'revenue' | 'expense' | 'profit' | 'loss' | 'neutral' | 'formula';
  sheetType?: string;
  onStartEdit: (row: number, col: number) => void;
  onSave: (row: number, col: number, value: string) => void;
  onCancel: () => void;
  onContextMenu?: (row: number, col: number, event: React.MouseEvent) => void;
  disabled?: boolean;
  isDragging?: boolean;
  onDragStart?: (row: number, col: number) => void;
  onDragOver?: (row: number, col: number) => void;
  onDrop?: (row: number, col: number) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  rowIndex,
  colIndex,
  isEditing,
  isHeader = false,
  isFormula = false,
  cellType = 'neutral',
  sheetType,
  onStartEdit,
  onSave,
  onCancel,
  onContextMenu,
  disabled = false,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [inputValue, setInputValue] = useState(String(value || ''));
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Определение типа ячейки по содержимому и позиции
  const detectCellType = (): 'revenue' | 'expense' | 'profit' | 'loss' | 'neutral' | 'formula' => {
    if (cellType !== 'neutral') return cellType;
    
    const strVal = String(value).toLowerCase();
    const numVal = parseFloat(String(value));
    
    // Формулы
    if (strVal.startsWith('=')) return 'formula';
    
    // По названиям строк
    if (colIndex === 0 && typeof value === 'string') {
      if (strVal.includes('выручка') || strVal.includes('доход') || strVal.includes('продаж')) {
        return 'revenue';
      }
      if (strVal.includes('расход') || strVal.includes('затрат') || strVal.includes('аренда') || 
          strVal.includes('зарплата') || strVal.includes('себестоимость')) {
        return 'expense';
      }
      if (strVal.includes('прибыль') || strVal.includes('ebitda') || strVal.includes('ebit')) {
        return 'profit';
      }
    }
    
    // По значениям в зависимости от листа
    if (typeof numVal === 'number' && !isNaN(numVal) && colIndex > 0) {
      if (sheetType === 'revenue' || sheetType === 'pnl') {
        if (rowIndex <= 10) return 'revenue'; // Первые строки - доходы
        if (numVal > 0) return 'profit';
        if (numVal < 0) return 'loss';
      }
      if (sheetType === 'expenses') {
        return 'expense';
      }
      if (sheetType === 'cashflow') {
        if (numVal > 0) return 'profit';
        if (numVal < 0) return 'loss';
      }
    }
    
    return 'neutral';
  };

  const handleDoubleClick = () => {
    console.log('Double click on cell:', { 
      rowIndex, 
      colIndex, 
      disabled, 
      isHeader, 
      value,
      canEdit: !disabled && !isHeader
    });
    if (!disabled && !isHeader) {
      onStartEdit(rowIndex, colIndex);
    } else {
      console.log('Edit blocked because:', { disabled, isHeader });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu && !isHeader) {
      onContextMenu(rowIndex, colIndex, e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    onSave(rowIndex, colIndex, inputValue);
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  const formatDisplayValue = (val: string | number): string => {
    if (val === '' || val === null || val === undefined) return '';
    
    const strVal = String(val);
    
    // Формулы показываем как есть при редактировании
    if (strVal.startsWith('=')) {
      return strVal;
    }
    
    // Числовое форматирование
    const numVal = parseFloat(strVal);
    if (!isNaN(numVal) && !isHeader && colIndex > 0) {
      // Проценты
      if (strVal.includes('%')) {
        return strVal;
      }
      
      // Большие числа с разделителями
      if (Math.abs(numVal) >= 1000) {
        return new Intl.NumberFormat('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numVal);
      }
      
      // Обычные числа
      if (numVal % 1 !== 0) {
        return numVal.toFixed(2);
      }
    }
    
    return strVal;
  };

  const getCellStyle = () => {
    const actualCellType = detectCellType();
    let baseStyle = "px-3 py-2 border-r border-b border-gray-200 dark:border-gray-600 text-sm min-w-[120px] h-[35px] relative transition-all duration-200 ";
    
    // Базовые стили для заголовков
    if (isHeader) {
      baseStyle += "bg-gray-100 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white sticky ";
      if (rowIndex === 0) baseStyle += "top-0 z-20 ";
      if (colIndex === 0) baseStyle += "left-0 z-10 ";
    } else {
      // Цветовое кодирование по типу ячейки
      switch (actualCellType) {
        case 'revenue':
          baseStyle += "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ";
          if (isHovered) baseStyle += "bg-green-100 dark:bg-green-900/30 ";
          break;
        case 'expense':
          baseStyle += "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 ";
          if (isHovered) baseStyle += "bg-red-100 dark:bg-red-900/30 ";
          break;
        case 'profit':
          baseStyle += "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 ";
          if (isHovered) baseStyle += "bg-blue-100 dark:bg-blue-900/30 ";
          break;
        case 'loss':
          baseStyle += "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 ";
          if (isHovered) baseStyle += "bg-orange-100 dark:bg-orange-900/30 ";
          break;
        case 'formula':
          baseStyle += "bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 font-mono ";
          if (isHovered) baseStyle += "bg-purple-100 dark:bg-purple-900/30 ";
          break;
        default:
          baseStyle += "bg-white dark:bg-gray-800 text-gray-900 dark:text-white ";
          if (isHovered && !disabled) baseStyle += "bg-gray-50 dark:bg-gray-700 ";
      }
    }
    
    // Состояния взаимодействия
    if (disabled) {
      baseStyle += "opacity-50 cursor-not-allowed ";
    } else if (!isHeader) {
      baseStyle += "cursor-pointer ";
    }
    
    if (isEditing) {
      baseStyle += "ring-2 ring-blue-500 shadow-md z-30 ";
    }
    
    if (isDragging) {
      baseStyle += "opacity-50 scale-95 ";
    }
    
    // Индикатор для формул
    if (actualCellType === 'formula' && !isEditing) {
      baseStyle += "relative ";
    }
    
    return baseStyle;
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && !isHeader && rowIndex > 0) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `${rowIndex},${colIndex}`);
      onDragStart(rowIndex, colIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver && !isHeader) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(rowIndex, colIndex);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop && !isHeader) {
      e.preventDefault();
      onDrop(rowIndex, colIndex);
    }
  };

  if (isEditing) {
    return (
      <td className={getCellStyle()}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent border-none outline-none text-sm"
          placeholder={isFormula ? "=A1+B1" : "Введите значение"}
        />
      </td>
    );
  }

  const handleCellClick = () => {
    // При клике также вызываем onStartEdit для обновления currentCell
    if (!isHeader && !disabled) {
      // Это обновит currentCell в родительском компоненте
      console.log('Cell clicked:', { rowIndex, colIndex, value });
    }
  };

  return (
    <td 
      className={getCellStyle()}
      onClick={handleCellClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!isHeader && !disabled && rowIndex > 0}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title={
        isFormula 
          ? `Формула: ${value}` 
          : detectCellType() !== 'neutral' 
            ? `Тип: ${detectCellType()}, Значение: ${value}`
            : String(value)
      }
    >
      <div className="w-full h-full flex items-center justify-between">
        <span className="flex-1">
          {formatDisplayValue(value)}
        </span>
        
        {/* Индикаторы */}
        <div className="flex items-center space-x-1 ml-2">
          {detectCellType() === 'formula' && !isEditing && (
            <span className="text-purple-500 text-xs">fx</span>
          )}
          {!isHeader && !disabled && isHovered && (
            <div className="flex space-x-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            </div>
          )}
        </div>
      </div>
    </td>
  );
};

export default EditableCell; 