

import React from 'react';
// @ts-ignore: `NavLink`, `useLocation` are named exports of `react-router-dom/dist/index.js`
import { NavLink, useLocation } from 'react-router-dom/dist/index.js';
import { 
  Send, Users, FileEdit, BarChart3, 
  Settings, Mail, GitMerge, Tag, Webhook, 
  ExternalLink, Zap, ChevronRight, LogOut
} from 'lucide-react';

interface SidebarProps {
  onClose: () => void;
}

interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NavItem: React.FC<{ item: NavItemConfig; onClose: () => void }> = ({ item, onClose }) => {
  return (
    <NavLink
      to={item.href}
      onClick={onClose}
      className={({ isActive }) => `
        relative flex items-center justify-between px-5 py-3.5 mx-4 rounded-xl transition-all duration-300 group
        ${isActive 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <item.icon 
              className={`w-[20px] h-[20px] transition-transform duration-300 ${isActive ? 'text-[#ffa900]' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[14px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.name}
            </span>
          </div>
          
          {item.badge && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {item.badge}
            </span>
          )}

          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#ffa900] rounded-r-full"></div>
          )}
        </>
      )}
    </NavLink>
  );
};

const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h4 className="px-8 mb-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            {title}
        </h4>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const mainNav: NavItemConfig[] = [
    { name: 'Chiến dịch', href: '/campaigns', icon: Send },
    { name: 'Khách hàng', href: '/audience', icon: Users },
    { name: 'Automation', href: '/flows', icon: GitMerge },
    { name: 'Mẫu Email', href: '/templates', icon: FileEdit },
  ];

  const configNav: NavItemConfig[] = [
    { name: 'Quản lý Nhãn', href: '/tags', icon: Tag },
    { name: 'API Triggers', href: '/api-triggers', icon: Webhook, badge: 'Dev' },
  ];

  const analyticsNav: NavItemConfig[] = [
    { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* BRAND HEADER */}
      <div className="h-24 px-8 flex items-center shrink-0">
        <div className="flex items-center gap-4 w-full p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="relative w-11 h-11 flex items-center justify-center bg-gradient-to-br from-[#ffa900] to-[#e08900] rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <Mail className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-800 tracking-tight leading-none">MailFlow</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1 group-hover:text-[#ca7900] transition-colors">Pro Admin</span>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NAV */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-2">
        <SidebarSection title="Marketing">
            {mainNav.map((item) => <NavItem key={item.name} item={item} onClose={onClose} />)}
        </SidebarSection>

        <SidebarSection title="System">
            {configNav.map((item) => <NavItem key={item.name} item={item} onClose={onClose} />)}
        </SidebarSection>

        <SidebarSection title="Insights">
            {analyticsNav.map((item) => <NavItem key={item.name} item={item} onClose={onClose} />)}
        </SidebarSection>

        {/* PROMO / DOCS CARD */}
        <div className="px-6 mt-8">
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5 group cursor-pointer hover:border-[#ffa900]/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#ffa900]/10 transition-transform group-hover:scale-150"></div>
                
                <div className="relative z-10 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-[#ffa900]">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-slate-800">API Documentation</h5>
                        <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                            Tích hợp hệ thống CRM/ERP.
                        </p>
                    </div>
                </div>
                
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm border border-slate-100 group-hover:text-[#ca7900] transition-colors">
                    Xem tài liệu <ExternalLink className="h-3 w-3" />
                </button>
            </div>
        </div>
      </nav>

      {/* USER PROFILE FOOTER */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <NavLink 
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => `
            flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group
            ${isActive ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}
          `}
        >
            <div className="relative">
                <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                    <img 
                        src="https://ui-avatars.com/api/?name=Admin+User&background=0f172a&color=fff" 
                        alt="Admin" 
                        className="w-full h-full object-cover" 
                    />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 truncate">Admin User</span>
                    <Settings className="w-4 h-4 text-slate-400 group-hover:rotate-45 transition-transform" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                   Enterprise Plan <ChevronRight className="w-2.5 h-2.5" />
                </span>
            </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;