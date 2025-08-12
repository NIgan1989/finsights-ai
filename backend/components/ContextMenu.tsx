import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string) => void;
  cellValue: string | number;
  rowIndex: number;
  colIndex: number;
  sheetType?: string;
}

interface MenuAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  shortcut?: string;
  danger?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onAction,
  cellValue,
  rowIndex,
  colIndex,
  sheetType
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Определяем доступные действия в зависимости от контекста
  const getMenuActions = (): MenuAction[] => {
    const actions: MenuAction[] = [];

    // Базовые действия для всех ячеек
    actions.push(
      {
        id: 'edit',
        label: 'Редактировать',
        icon: '✏️',
        description: 'Изменить значение ячейки',
        shortcut: 'Двойной клик'
      },
      {
        id: 'copy',
        label: 'Копировать',
        icon: '📋',
        description: 'Скопировать значение в буфер',
        shortcut: 'Ctrl+C'
      }
    );

    // Действия для числовых ячеек
    if (typeof cellValue === 'number' || !isNaN(parseFloat(String(cellValue)))) {
      actions.push(
        {
          id: 'format-currency',
          label: 'Формат: Валюта',
          icon: '💰',
          description: 'Форматировать как валюту'
        },
        {
          id: 'format-percent',
          label: 'Формат: Проценты',
          icon: '%',
          description: 'Форматировать как проценты'
        }
      );
    }

    // Действия с формулами
    if (String(cellValue).startsWith('=')) {
      actions.push(
        {
          id: 'show-formula',
          label: 'Показать формулу',
          icon: 'fx',
          description: 'Отобразить формулу в ячейке'
        },
        {
          id: 'evaluate-formula',
          label: 'Вычислить формулу',
          icon: '🧮',
          description: 'Показать результат формулы'
        }
      );
    } else if (colIndex > 0) {
      // Предложения формул для числовых ячеек
      actions.push({
        id: 'create-formula',
        label: 'Создать формулу',
        icon: '⚡',
        description: 'Превратить в формулу'
      });
    }

    // Действия со строками
    if (rowIndex > 0) {
      actions.push(
        {
          id: 'insert-row-above',
          label: 'Вставить строку выше',
          icon: '⬆️',
          description: 'Добавить новую строку выше текущей'
        },
        {
          id: 'insert-row-below',
          label: 'Вставить строку ниже',
          icon: '⬇️',
          description: 'Добавить новую строку ниже текущей'
        }
      );

      if (rowIndex > 1) { // Не удаляем заголовок
        actions.push({
          id: 'delete-row',
          label: 'Удалить строку',
          icon: '🗑️',
          description: 'Удалить текущую строку',
          danger: true
        });
      }
    }

    // Контекстные действия по типу листа
    if (sheetType === 'revenue') {
      actions.push({
        id: 'add-revenue-item',
        label: 'Добавить источник дохода',
        icon: '💚',
        description: 'Создать новую статью дохода'
      });
    }

    if (sheetType === 'expenses') {
      actions.push({
        id: 'add-expense-item',
        label: 'Добавить статью расходов',
        icon: '💸',
        description: 'Создать новую статью расходов'
      });
    }

    // Дополнительные быстрые формулы
    if (colIndex > 0 && rowIndex > 0) {
      actions.push(
        {
          id: 'quick-sum',
          label: 'Сумма выше',
          icon: '∑',
          description: 'Сумма всех ячеек выше'
        },
        {
          id: 'quick-growth',
          label: 'Рост 15%',
          icon: '📈',
          description: 'Рост на 15% от предыдущего года'
        },
        {
          id: 'quick-percent',
          label: '% от выручки',
          icon: '📊',
          description: 'Процент от выручки'
        }
      );
    }

    return actions;
  };

  const handleActionClick = (actionId: string) => {
    onAction(actionId);
    onClose();
  };

  const menuActions = getMenuActions();

  // Корректировка позиции чтобы меню не выходило за экран
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 280),
    y: Math.min(position.y, window.innerHeight - (menuActions.length * 40 + 20))
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[250px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* Заголовок меню */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Ячейка: {String.fromCharCode(65 + colIndex)}{rowIndex + 1}
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {String(cellValue) || 'Пустая ячейка'}
        </div>
      </div>

      {/* Группы действий */}
      <div className="py-1">
        {menuActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-between group ${
              action.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{action.icon}</span>
              <div>
                <div className="text-sm font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                )}
              </div>
            </div>
            {action.shortcut && (
              <div className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition">
                {action.shortcut}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Дополнительная информация */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500">
          💡 Совет: Используйте Ctrl+D для заполнения вниз
        </div>
      </div>
    </div>
  );
};

export default ContextMenu; 
