
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      
      // Use setTimeout with small delay to ensure DOM mount (opacity-0 state) 
      // is rendered before applying the transition to opacity-100.
      const timer = setTimeout(() => {
          setAnimateIn(true);
      }, 10);
      
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => {
          setIsVisible(false);
          document.body.style.overflow = 'unset';
      }, 400); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`
            absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out
            ${animateIn ? 'opacity-100' : 'opacity-0'}
        `} 
        onClick={onClose}
      />

      {/* Modal Content - Added cubic-bezier for "overshoot" zoom effect */}
      <div 
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        className={`
        relative bg-white rounded-[24px] shadow-2xl w-full flex flex-col max-h-[90vh] overflow-hidden
        transform transition-all duration-500 border border-slate-100
        ${sizeClasses[size]}
        ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}
      `}>
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
