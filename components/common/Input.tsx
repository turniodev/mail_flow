
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon: Icon, 
  fullWidth = true, 
  className = '', 
  disabled,
  ...props 
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 ${error ? 'text-rose-600' : 'text-slate-400'}`}>
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ca7900] transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input 
          className={`
            w-full h-[42px] bg-white border rounded-xl px-3.5 text-sm font-bold text-slate-700
            placeholder:text-slate-300 placeholder:font-medium
            transition-all duration-200 shadow-sm
            hover:border-slate-300
            focus:outline-none focus:border-[#ffa900] focus:ring-4 focus:ring-orange-500/10
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200'}
          `}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-rose-600 mt-1 ml-1 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
