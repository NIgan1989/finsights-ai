import React, { useState, useEffect } from 'react';

interface FormulaBarProps {
  currentCell: { row: number; col: number; value: string };
  isEditing: boolean;
  onFormulaChange: (formula: string) => void;
  onEnter: () => void;
  onCancel: () => void;
}

const FormulaBar: React.FC<FormulaBarProps> = ({
  currentCell,
  isEditing,
  onFormulaChange,
  onEnter,
  onCancel
}) => {
  const [formula, setFormula] = useState(currentCell.value);

  useEffect(() => {
    setFormula(currentCell.value);
  }, [currentCell]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFormulaChange(formula);
      onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFormula(currentCell.value);
      onCancel();
    }
  };

  const getCellAddress = () => {
    const colLetter = String.fromCharCode(65 + currentCell.col); // A, B, C, etc.
    return `${colLetter}${currentCell.row + 1}`;
  };

  return (
    <div className="bg-surface-accent border-b border-border p-2 flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-foreground">fx</span>
        <span className="text-sm font-mono text-muted-foreground bg-surface px-2 py-1 rounded border border-border">
          {getCellAddress()}
        </span>
      </div>
      
      <div className="flex-1">
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onFormulaChange(formula)}
          className="w-full px-3 py-1 border border-border rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-foreground"
          placeholder="Введите формулу или значение..."
        />
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onFormulaChange(formula)}
          className="px-3 py-1 bg-success text-success-foreground text-sm rounded hover:bg-success/90 transition"
        >
          ✓
        </button>
        <button
          onClick={() => {
            setFormula(currentCell.value);
            onCancel();
          }}
          className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/90 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FormulaBar;
