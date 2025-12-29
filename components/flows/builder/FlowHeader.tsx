
import React from 'react';
import { ChevronLeft, Pause, Play, Lock, Save, RefreshCw, Eye, EyeOff, Layout, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { Flow } from '../../../types';

interface FlowHeaderProps {
  flow: Flow;
  isSaving: boolean;
  hasCriticalErrors: boolean;
  isViewMode: boolean;
  activeTab: 'builder' | 'analytics' | 'settings';
  onBack: () => void;
  onTabChange: (tab: 'builder' | 'analytics' | 'settings') => void;
  onToggleStatus: () => void;
  onToggleViewMode: () => void;
  onSave: () => void;
  onRestore: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({
  flow,
  isSaving,
  hasCriticalErrors,
  isViewMode,
  activeTab,
  onBack,
  onTabChange,
  onToggleStatus,
  onToggleViewMode,
  onSave,
  onRestore
}) => {
  const isArchived = flow.status === 'archived';

  return (
    <div className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 lg:px-8 flex items-center justify-between z-[110] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] sticky top-0 transition-all duration-300">
      <div className="flex items-center gap-5">
        <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 leading-none tracking-tight">{flow.name}</h2>
            {isViewMode && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest border border-blue-100">Preview Mode</span>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={flow.status === 'active' ? 'success' : (isArchived ? 'danger' : 'neutral')} className="text-[9px] px-2 py-0.5 uppercase font-bold tracking-wider">
              {flow.status === 'active' ? 'Đang chạy' : (isArchived ? 'Thùng rác' : 'Đã dừng')}
            </Badge>
            {isSaving && !isArchived && <span className="text-[10px] font-bold text-[#ffa900] animate-pulse ml-2 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#ffa900] rounded-full"></div>Saving...</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4">
          <div className="bg-slate-100/50 p-1 rounded-2xl flex gap-1 border border-slate-200/60 shadow-inner">
              {[
                  { id: 'builder', label: 'Thiết kế', icon: Layout },
                  { id: 'analytics', label: 'Báo cáo', icon: BarChart3 },
                  { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
              ].map(tab => (
                  <button 
                      key={tab.id} 
                      onClick={() => onTabChange(tab.id as any)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-[#ca7900] shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                  >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="flex items-center gap-3">
        {!isArchived && activeTab === 'builder' && (
          <button 
            onClick={onToggleStatus} 
            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border shadow-sm active:scale-95 ${
              flow.status === 'active' 
              ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300' 
              : (hasCriticalErrors ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300')
            }`}
          >
            {flow.status === 'active' ? <><Pause className="w-4 h-4" /> Dừng Flow</> : (hasCriticalErrors ? <><Lock className="w-4 h-4" /> Khóa lỗi</> : <><Play className="w-4 h-4" /> Kích hoạt</>)}
          </button>
        )}

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {activeTab === 'builder' && (
            <button 
              onClick={onToggleViewMode}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-2 border active:scale-95 ${isViewMode ? 'bg-orange-50 text-[#ca7900] border-orange-200' : 'border-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              title={isViewMode ? "Thoát chế độ xem" : "Xem trước"}
            >
              {isViewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        )}
        
        {isArchived ? (
          <Button size="md" icon={RefreshCw} onClick={onRestore} variant="primary">Khôi phục</Button>
        ) : (
          <Button size="md" icon={Save} onClick={onSave} disabled={isViewMode} className="shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40">Lưu</Button>
        )}
      </div>
    </div>
  );
};

export default FlowHeader;
