import { type ReactNode, forwardRef, useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder = 'Select an option',
      fullWidth = false,
      leftIcon,
      className = '',
      id,
      required,
      disabled,
      value,
      defaultValue,
      onChange,
      name,
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);
    
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    
    // Controlled vs uncontrolled
    const selectedValue = value !== undefined ? value : internalValue;
    const selectedOption = options.find(opt => opt.value === selectedValue);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
        const highlightedEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
        highlightedEl?.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (optionValue: string) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onChange?.({ target: { value: optionValue, name } });
      setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = options[highlightedIndex];
            if (!option.disabled) {
              handleSelect(option.value);
            }
          } else {
            setIsOpen(true);
            // Set initial highlight to selected or first option
            const idx = options.findIndex(opt => opt.value === selectedValue);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            const idx = options.findIndex(opt => opt.value === selectedValue);
            setHighlightedIndex(idx >= 0 ? idx : 0);
          } else {
            setHighlightedIndex(prev => {
              let next = prev + 1;
              while (next < options.length && options[next].disabled) next++;
              return next < options.length ? next : prev;
            });
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setHighlightedIndex(prev => {
              let next = prev - 1;
              while (next >= 0 && options[next].disabled) next--;
              return next >= 0 ? next : prev;
            });
          }
          break;
        case 'Home':
          event.preventDefault();
          if (isOpen) {
            const firstEnabled = options.findIndex(opt => !opt.disabled);
            setHighlightedIndex(firstEnabled);
          }
          break;
        case 'End':
          event.preventDefault();
          if (isOpen) {
            let lastEnabled = options.length - 1;
            while (lastEnabled >= 0 && options[lastEnabled].disabled) lastEnabled--;
            setHighlightedIndex(lastEnabled);
          }
          break;
      }
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`} ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {/* Hidden native select for form submission */}
          <select
            name={name}
            value={selectedValue}
            onChange={() => {}}
            required={required}
            disabled={disabled}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom select button */}
          <button
            ref={ref}
            type="button"
            id={selectId}
            role="combobox"
            aria-controls={`${selectId}-listbox`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`
              flex items-center justify-between w-full rounded-lg border
              px-4 py-2.5 text-base text-left
              transition-all duration-150
              ${leftIcon ? 'pl-10' : ''}
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : isOpen
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500'
              }
              ${disabled 
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-gray-900 cursor-pointer'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${className}
            `}
          >
            {leftIcon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {leftIcon}
              </span>
            )}
            
            <span className={`truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
              {selectedOption?.label || placeholder}
            </span>
            
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown options */}
          {isOpen && (
            <ul
              ref={listboxRef}
              id={`${selectId}-listbox`}
              role="listbox"
              aria-labelledby={selectId}
              className="
                absolute z-50 w-full mt-1.5
                bg-white border border-gray-200 rounded-lg shadow-lg
                max-h-60 overflow-auto
                py-1
                focus:outline-none
              "
            >
              {options.length === 0 ? (
                <li className="px-4 py-2.5 text-gray-500 text-sm">No options available</li>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = index === highlightedIndex;
                  
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                      className={`
                        flex items-center justify-between px-4 py-2.5 text-base
                        transition-colors duration-75 cursor-pointer
                        ${option.disabled 
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                          : isHighlighted
                            ? 'bg-blue-50 text-blue-900'
                            : isSelected
                              ? 'bg-blue-50/50 text-gray-900'
                              : 'text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
        
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
