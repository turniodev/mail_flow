

import React from 'react';
import { Menu, Bell, ChevronRight, Search } from 'lucide-react';
// @ts-ignore: `useLocation` is a named export of `react-router-dom/dist/index.js`
import { useLocation } from 'react-router-dom/dist/index.js';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const path = location.pathname;

  const getBreadcrumb = () => {
    if (path.startsWith('/campaigns')) return 'Chiến dịch';
    if (path.startsWith('/flows')) return 'Automation';
    if (path.startsWith('/audience')) return 'Khách hàng';
    if (path.startsWith('/templates')) return 'Mẫu Email';
    if (path.startsWith('/reports')) return 'Báo cáo';
    if (path.startsWith('/settings')) return 'Cài đặt';
    return 'MailFlow Pro';
  };

  return (
    <header className="flex items-center justify-between h-20 px-6 lg:px-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="text-slate-500 hover:text-[#ca7900] lg:hidden p-2 hover:bg-orange-50 rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium tracking-tight">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">MailFlow</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-bold">{getBreadcrumb()}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="relative group hidden xl:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh..." 
              className="bg-slate-100/50 border-none rounded-full py-1.5 pl-9 pr-4 text-xs font-medium w-48 focus:ring-2 focus:ring-orange-500/10 focus:bg-white transition-all outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-400 hover:text-[#ca7900] rounded-xl hover:bg-orange-50 transition-all relative group">
          <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-50 transition-all group ring-1 ring-transparent hover:ring-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffa900] to-[#ca7900] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-none">Admin User</p>
            <p className="text-[9px] text-[#ca7900] uppercase font-bold tracking-widest mt-1">Enterprise</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;