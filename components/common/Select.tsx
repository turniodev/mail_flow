
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ElementType;
  disabled?: boolean;
  direction?: 'top' | 'bottom';
  className?: string;
  variant?: 'outline' | 'filled' | 'ghost';
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ 
    label, options, value, onChange, icon: Icon, disabled, 
    direction = 'bottom', className = '', variant = 'filled', placeholder = 'Chọn...' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonStyles = () => {
      const base = "flex items-center justify-between px-3.5 h-[42px] rounded-xl cursor-pointer transition-all duration-200 text-sm font-bold group relative overflow-hidden select-none shadow-sm";
      
      if (variant === 'outline') {
          return `${base} bg-white border border-slate-200 hover:border-slate-300 text-slate-700 ${isOpen ? 'border-[#ffa900] ring-4 ring-orange-500/10' : ''}`;
      }
      if (variant === 'filled') {
          return `${base} bg-slate-50 border border-transparent hover:bg-slate-100 text-slate-700 ${isOpen ? 'bg-white border-[#ffa900] shadow-md ring-4 ring-orange-500/10' : ''}`;
      }
      if (variant === 'ghost') {
          return `${base} border border-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none ${isOpen ? 'bg-white shadow-sm text-[#ca7900]' : 'bg-transparent'}`;
      }
      return base;
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 text-slate-400">
          {label}
        </label>
      )}
      <div 
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`
          ${getButtonStyles()}
          ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none grayscale' : ''}
        `}
      >
        <div className="flex items-center gap-2.5 overflow-hidden z-10">
          {Icon && (
             <div className={`transition-colors duration-300 ${variant === 'ghost' ? (isOpen ? 'text-[#ca7900]' : 'text-slate-400 group-hover:text-slate-500') : (isOpen ? 'text-[#ca7900]' : 'text-slate-400')}`}>
                 <Icon className="w-4 h-4" />
             </div>
          )}
          <span className={`truncate ${selectedOption ? '' : 'text-slate-300 font-medium'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-300 z-10 ${isOpen ? 'rotate-180 text-[#ca7900]' : 'text-slate-400'}`} />
      </div>

      {isOpen && !disabled && (
        <div className={`
            absolute z-[300] min-w-[200px] w-full bg-white border border-slate-100 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200
            ${direction === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 right-0 origin-top'}
        `}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer
                    ${isActive 
                        ? 'bg-orange-50 text-[#ca7900]' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </div>
              );
            })}
            {options.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400 font-medium">Không có tùy chọn</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
