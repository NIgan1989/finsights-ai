import React, { useState, useEffect, useRef } from 'react';

interface FormulaAutocompleteProps {
  isVisible: boolean;
  position: { x: number; y: number };
  currentValue: string;
  onSelect: (formula: string) => void;
  onClose: () => void;
}

interface FormulaSuggestion {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: 'math' | 'financial' | 'statistical' | 'logical';
}

const FormulaAutocomplete: React.FC<FormulaAutocompleteProps> = ({
  isVisible,
  position,
  currentValue,
  onSelect,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<FormulaSuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<FormulaSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // База формул
  const formulaDatabase: FormulaSuggestion[] = [
    // Математические формулы
    {
      id: 'sum',
      name: 'СУММ',
      description: 'Сумма диапазона ячеек',
      formula: '=СУММ(B3:B7)',
      category: 'math'
    },
    {
      id: 'average',
      name: 'СРЗНАЧ',
      description: 'Среднее значение',
      formula: '=СРЗНАЧ(B3:B7)',
      category: 'math'
    },
    {
      id: 'multiply',
      name: 'УМНОЖ',
      description: 'Умножение',
      formula: '=B3*B4',
      category: 'math'
    },
    {
      id: 'divide',
      name: 'ДЕЛ',
      description: 'Деление',
      formula: '=B3/B4',
      category: 'math'
    },
    {
      id: 'percent',
      name: 'ПРОЦЕНТ',
      description: 'Процент от числа',
      formula: '=B3*0.12',
      category: 'math'
    },

    // Финансовые формулы
    {
      id: 'revenue',
      name: 'ВЫРУЧКА',
      description: 'Расчет выручки',
      formula: '=B3*B4*B5',
      category: 'financial'
    },
    {
      id: 'gross_profit',
      name: 'ВАЛОВАЯ_ПРИБЫЛЬ',
      description: 'Валовая прибыль',
      formula: '=B3-B4',
      category: 'financial'
    },
    {
      id: 'operating_profit',
      name: 'ОПЕРАЦИОННАЯ_ПРИБЫЛЬ',
      description: 'Операционная прибыль',
      formula: '=B6-B8-B9',
      category: 'financial'
    },
    {
      id: 'net_profit',
      name: 'ЧИСТАЯ_ПРИБЫЛЬ',
      description: 'Чистая прибыль',
      formula: '=B14-B15',
      category: 'financial'
    },
    {
      id: 'margin',
      name: 'МАРЖА',
      description: 'Расчет маржи',
      formula: '=(B6/B3)*100',
      category: 'financial'
    },
    {
      id: 'vat',
      name: 'НДС',
      description: 'Расчет НДС',
      formula: '=B7*0.12',
      category: 'financial'
    },

    // Статистические формулы
    {
      id: 'growth',
      name: 'РОСТ',
      description: 'Темп роста',
      formula: '=((B4-B3)/B3)*100',
      category: 'statistical'
    },
    {
      id: 'forecast',
      name: 'ПРОГНОЗ',
      description: 'Линейный прогноз',
      formula: '=ПРОГНОЗ(B4,A3:A4,B3:B4)',
      category: 'statistical'
    },

    // Логические формулы
    {
      id: 'if',
      name: 'ЕСЛИ',
      description: 'Условная формула',
      formula: '=ЕСЛИ(B3>1000000,"Высокая","Низкая")',
      category: 'logical'
    },
    {
      id: 'and',
      name: 'И',
      description: 'Логическое И',
      formula: '=И(B3>0,B4>0)',
      category: 'logical'
    },
    {
      id: 'or',
      name: 'ИЛИ',
      description: 'Логическое ИЛИ',
      formula: '=ИЛИ(B3>1000000,B4>500000)',
      category: 'logical'
    }
  ];

  // Фильтрация предложений на основе ввода
  useEffect(() => {
    if (currentValue.startsWith('=')) {
      const searchTerm = currentValue.substring(1).toLowerCase();
      const filtered = formulaDatabase.filter(formula =>
        formula.name.toLowerCase().includes(searchTerm) ||
        formula.description.toLowerCase().includes(searchTerm)
      );
      setFilteredSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredSuggestions([]);
    }
  }, [currentValue]);

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredSuggestions[selectedIndex]) {
            onSelect(filteredSuggestions[selectedIndex].formula);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredSuggestions, selectedIndex, onSelect, onClose]);

  // Клик вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible || filteredSuggestions.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math': return '🔢';
      case 'financial': return '💰';
      case 'statistical': return '📊';
      case 'logical': return '⚡';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'math': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'statistical': return 'bg-purple-100 text-purple-800';
      case 'logical': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '300px'
      }}
    >
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-700">Формулы</div>
        <div className="text-xs text-gray-500">Используйте стрелки для навигации, Enter для выбора</div>
      </div>
      
      <div className="py-1">
        {filteredSuggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition ${
              index === selectedIndex ? 'bg-blue-100' : ''
            }`}
            onClick={() => onSelect(suggestion.formula)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">{suggestion.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(suggestion.category)}`}>
                    {suggestion.category}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{suggestion.description}</div>
                <div className="text-xs font-mono text-blue-600 mt-1">{suggestion.formula}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="px-3 py-4 text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <div>Формулы не найдены</div>
          <div className="text-xs mt-1">Попробуйте другой поисковый запрос</div>
        </div>
      )}
    </div>
  );
};

export default FormulaAutocomplete; 