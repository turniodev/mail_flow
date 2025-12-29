
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon: Icon, 
  className = '', 
  disabled,
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1 tracking-tight';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#ffa900] to-[#ca7900] text-white shadow-md shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 border border-transparent',
    secondary: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-[#ffa900] hover:text-[#ca7900]',
    outline: 'bg-transparent border-2 border-[#ffa900] text-[#ca7900] hover:bg-orange-50',
    ghost: 'bg-transparent text-slate-500 hover:bg-orange-50 hover:text-[#ca7900]',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-transparent hover:border-rose-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
