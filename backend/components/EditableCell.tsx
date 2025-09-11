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
  showFormulas?: boolean;
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
  onDrop,
  showFormulas = false
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
      console.log('Starting edit for cell:', { rowIndex, colIndex });
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

  // Валидация и форматирование данных перед сохранением
  const validateAndFormatValue = (value: string): { isValid: boolean; formattedValue: string; errorMessage?: string } => {
    const trimmedValue = value.trim();
    
    console.log('Validating value:', { 
      originalValue: value, 
      trimmedValue, 
      rowIndex, 
      colIndex, 
      cellType: detectCellType() 
    });
    
    // Пустые значения разрешены
    if (!trimmedValue) {
      console.log('Empty value - valid');
      return { isValid: true, formattedValue: '' };
    }
    
    // Формулы должны начинаться с =
    if (trimmedValue.startsWith('=')) {
      console.log('Formula detected');
      // Базовая валидация формул
      const formula = trimmedValue.slice(1);
      if (!formula) {
        console.log('Empty formula - invalid');
        return { isValid: false, formattedValue: trimmedValue, errorMessage: 'Пустая формула' };
      }
      
      // Упрощенная проверка на недопустимые символы в формулах
      const dangerousPatterns = /eval|function|script|alert|document|window/i;
      if (dangerousPatterns.test(formula)) {
        console.log('Dangerous pattern in formula - invalid');
        return { isValid: false, formattedValue: trimmedValue, errorMessage: 'Недопустимые символы в формуле' };
      }
      
      console.log('Formula valid');
      return { isValid: true, formattedValue: trimmedValue };
    }
    
    // Упрощенная валидация - принимаем почти все значения
    // Проверка только на экстремально длинные строки
    if (trimmedValue.length > 1000) {
      console.log('Value too long - invalid');
      return { 
        isValid: false, 
        formattedValue: trimmedValue, 
        errorMessage: 'Значение слишком длинное (максимум 1000 символов)' 
      };
    }
    
    console.log('Value valid');
    return { isValid: true, formattedValue: trimmedValue };
  };

  const handleSave = () => {
    console.log('EditableCell handleSave called:', { 
      rowIndex, 
      colIndex, 
      inputValue, 
      originalValue: value 
    });
    
    const validation = validateAndFormatValue(inputValue);
    
    if (!validation.isValid) {
      // Показываем ошибку пользователю
      console.error('Validation failed:', validation.errorMessage);
      alert(`Ошибка валидации: ${validation.errorMessage}`);
      // Возвращаем фокус на поле ввода
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }
    
    console.log('Calling onSave with:', { 
      rowIndex, 
      colIndex, 
      formattedValue: validation.formattedValue 
    });
    
    onSave(rowIndex, colIndex, validation.formattedValue);
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  const formatDisplayValue = (val: string | number): string => {
    if (val === '' || val === null || val === undefined) return '';
    
    const strVal = String(val);
    
    // Формулы показываем как есть при редактировании или когда включен показ формул
    if (strVal.startsWith('=')) {
      if (isEditing || showFormulas) {
        return strVal;
      }
      // Если формула, но не в режиме редактирования - показываем результат
      // Результат должен приходить уже вычисленным из родительского компонента
      return strVal; // Возвращаем как есть, вычисления должны происходить выше
    }
    
    // Для заголовков и первой колонки всегда показываем как есть (включая единицы измерения)
    if (isHeader || colIndex === 0) {
      return strVal;
    }
    
    // Если строка содержит единицы измерения, показываем как есть
    if (strVal.includes('тенге') || strVal.includes('человек') || strVal.includes('шт') || 
        strVal.includes('часов') || strVal.includes('дней') || strVal.includes('%') ||
        strVal.includes('мес') || strVal.includes('год')) {
      return strVal;
    }
    
    // Обработка ошибок формул
    if (strVal.startsWith('#')) {
      return strVal;
    }
    
    // Числовое форматирование только для чистых чисел
    const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ''));
    if (!isNaN(numVal) && colIndex > 0) {
      // Большие числа с разделителями
      if (Math.abs(numVal) >= 1000) {
        return new Intl.NumberFormat('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numVal);
      }
      
      // Обычные числа с десятичными знаками
      if (numVal % 1 !== 0) {
        return numVal.toFixed(2);
      }
      
      return numVal.toString();
    }
    
    return strVal;
  };

  const getCellStyle = () => {
    const actualCellType = detectCellType();
    let baseStyle = "px-3 py-2 border-r border-b border-border text-sm min-w-[120px] h-[35px] relative transition-all duration-200 ";
    
    // Базовые стили для заголовков
    if (isHeader) {
      baseStyle += "bg-surface-accent font-semibold text-primary sticky ";
      if (rowIndex === 0) baseStyle += "top-0 z-20 ";
      if (colIndex === 0) baseStyle += "left-0 z-10 ";
    } else {
      // Цветовое кодирование по типу ячейки
      switch (actualCellType) {
        case 'revenue':
          baseStyle += "bg-success/10 text-success-foreground ";
          if (isHovered) baseStyle += "bg-success/20 ";
          break;
        case 'expense':
          baseStyle += "bg-destructive/10 text-destructive-foreground ";
          if (isHovered) baseStyle += "bg-destructive/20 ";
          break;
        case 'profit':
          baseStyle += "bg-primary/10 text-primary ";
          if (isHovered) baseStyle += "bg-primary/20 ";
          break;
        case 'loss':
          baseStyle += "bg-warning/20 text-warning-foreground ";
          if (isHovered) baseStyle += "bg-warning/30 ";
          break;
        case 'formula':
          baseStyle += "bg-accent/10 text-accent font-mono ";
          if (isHovered) baseStyle += "bg-accent/20 ";
          break;
        default:
          baseStyle += "bg-surface text-text-primary ";
          if (isHovered && !disabled) baseStyle += "bg-surface-hover ";
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
            <span className="text-accent text-xs">fx</span>
          )}
          {!isHeader && !disabled && isHovered && (
            <div className="flex space-x-1">
              <span className="w-1 h-1 bg-text-muted rounded-full"></span>
        <span className="w-1 h-1 bg-text-muted rounded-full"></span>
        <span className="w-1 h-1 bg-text-muted rounded-full"></span>
            </div>
          )}
        </div>
      </div>
    </td>
  );
};

export default EditableCell;
