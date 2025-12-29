
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isShowing, setIsShowing] = useState(false); // Controls toast slide-in/out CSS transition
  const [progressBarAnimating, setProgressBarAnimating] = useState(false); // Controls progress bar animation

  useEffect(() => {
    let slideInTimer: ReturnType<typeof setTimeout>;
    let slideOutTimer: ReturnType<typeof setTimeout>;
    let autoDismissTimer: ReturnType<typeof setTimeout>;
    let progressBarStartTimer: ReturnType<typeof setTimeout>;

    if (isVisible) {
      setIsRendered(true); // Mount to DOM

      // Allow DOM to update before starting slide-in transition
      slideInTimer = setTimeout(() => {
        setIsShowing(true); // Start slide-in transition (duration 500ms in CSS)

        // Start progress bar animation after toast has started showing (small delay for CSS to apply)
        progressBarStartTimer = setTimeout(() => {
          setProgressBarAnimating(true); // This will trigger width to 0% with transition
        }, 50); // Small delay to ensure 'isShowing' CSS is applied

        // Set auto-dismiss timer
        autoDismissTimer = setTimeout(() => {
          onClose(); // Request parent to hide toast
        }, 3000); // 3 seconds for toast display
      }, 10); // Very small delay to ensure initial render before transition
    } else {
      // isVisible is false, hide the toast
      setIsShowing(false); // Start slide-out transition (duration 500ms in CSS)
      setProgressBarAnimating(false); // Reset progress bar state instantly for next appearance

      // Unmount from DOM after slide-out transition completes
      slideOutTimer = setTimeout(() => {
        setIsRendered(false);
      }, 500); // Match CSS transition duration
    }

    // Cleanup function for all timers on component unmount or re-run of effect
    return () => {
      clearTimeout(slideInTimer);
      clearTimeout(slideOutTimer);
      clearTimeout(autoDismissTimer);
      clearTimeout(progressBarStartTimer);
    };
  }, [isVisible, onClose]); // Dependencies: isVisible changes, or onClose callback changes

  if (!isRendered) return null;

  const config = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500' },
    error: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', bar: 'bg-rose-500' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', bar: 'bg-blue-500' }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div 
        className={`
            fixed top-6 right-6 z-[9999] 
            transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform will-change-transform
            ${isShowing ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
        `}
    >
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-4 min-w-[320px] max-w-sm overflow-hidden group">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full shrink-0 ${style.bg} ${style.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 pt-0.5">
            <h4 className={`text-sm font-bold ${style.color} uppercase tracking-wide mb-0.5`}>
              {type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo'}
            </h4>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-slate-500 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full">
            <div 
                className={`h-full ${style.bar}`} 
                style={{ 
                    width: progressBarAnimating ? '0%' : '100%',
                    transition: progressBarAnimating ? 'width 3000ms linear' : 'none'
                }}
            />
        </div>
      </div>
    </div>
  );
};

export default Toast;