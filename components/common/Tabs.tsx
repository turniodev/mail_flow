
import React, { useRef, useState, useEffect } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: any) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, variant = 'underline', className = '' }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (variant === 'underline') {
        const activeIndex = items.findIndex(item => item.id === activeId);
        const currentTab = tabsRef.current[activeIndex];
        
        if (currentTab) {
        setIndicatorStyle({
            left: currentTab.offsetLeft,
            width: currentTab.clientWidth
        });
        }
    }
  }, [activeId, items, variant]);

  if (variant === 'pill') {
      return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {items.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={`
                            px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border
                            ${isActive 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200' 
                                : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
                            }
                        `}
                    >
                        {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ffa900]' : 'text-slate-400'}`} />}
                        {item.label}
                        {item.count !== undefined && (
                            <span className={`
                                ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black
                                ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}
                            `}>
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
      );
  }

  // Variant: Underline (Default)
  return (
    <div className={`flex border-b border-slate-200 mb-6 relative px-1 overflow-x-auto scrollbar-hide no-wrap ${className}`}>
      {items.map((item, idx) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            ref={el => { tabsRef.current[idx] = el; }}
            onClick={() => onChange(item.id)}
            className={`
              relative pb-3 px-3 text-[12px] font-black flex items-center gap-1.5 transition-colors duration-300 whitespace-nowrap shrink-0
              ${isActive ? 'text-[#ca7900]' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ffa900]' : 'text-slate-300'}`} />}
            {item.label}
            {item.count !== undefined && (
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black
                ${isActive ? 'bg-[#fff4e0] text-[#ca7900]' : 'bg-slate-100 text-slate-400'}
              `}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
      
      {/* Indicator */}
      <span 
          className="absolute bottom-0 h-[2px] bg-[#ffa900] transition-all duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
    </div>
  );
};

export default Tabs;
