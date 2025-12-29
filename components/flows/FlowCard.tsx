
import React from 'react';
import { GitMerge, Trash2, RotateCcw, Copy, Send, PlayCircle, PauseCircle, Users, Eye, Snowflake, Cake, Crown, Zap, Layers, AlertCircle, FileInput, Tag, ShoppingCart } from 'lucide-react';
import { Flow, Campaign, FormDefinition, PurchaseEvent, CustomEvent } from '../../types';

interface FlowCardProps {
  flow: Flow;
  linkedCampaign?: Campaign;
  linkedForm?: FormDefinition;
  linkedPurchaseEvent?: PurchaseEvent;
  linkedCustomEvent?: CustomEvent;
  onClick: () => void;
  onDelete: (permanent?: boolean) => void;
  onDuplicate?: (flow: Flow) => void;
  onRestore?: () => void;
}

const FlowCard: React.FC<FlowCardProps> = ({ 
    flow, linkedCampaign, linkedForm, linkedPurchaseEvent, linkedCustomEvent,
    onClick, onDelete, onDuplicate, onRestore 
}) => {
  const isArchived = flow.status === 'archived';
  const isActive = flow.status === 'active';
  const enrolled = flow.stats.enrolled || 0;
  const openRate = (flow.stats.totalSent || 0) > 0 
      ? Math.round(((flow.stats.totalOpened || 0) / flow.stats.totalSent) * 100) 
      : 0;
  const stepCount = flow.steps?.length || 0;

  const trigger = flow.steps?.find(s => s.type === 'trigger');
  const triggerConfig = trigger?.config || {};
  const triggerType = triggerConfig.type || 'segment';

  // --- THEME LOGIC (SYNCED WITH FLOW CREATION) ---
  const getTheme = () => {
      if (isArchived) return { 
          icon: GitMerge, 
          accent: 'slate', 
          gradientMain: 'from-slate-100 to-slate-200 text-slate-500', 
          label: 'Đã xóa' 
      };

      // 1. Winback / Ngủ đông (Blue)
      if (triggerType === 'date' && triggerConfig.dateField === 'lastActivity') {
          return {
              icon: Snowflake, 
              accent: 'blue', 
              gradientMain: 'from-blue-500 to-indigo-600', 
              label: `Ngủ đông > ${triggerConfig.inactiveAmount || 30} ngày`
          };
      }

      // 2. Birthday (Soft Rose)
      if (triggerType === 'date' && triggerConfig.dateField === 'dateOfBirth') {
          return {
              icon: Cake, 
              accent: 'pink', 
              gradientMain: 'from-pink-400 to-rose-500', 
              label: 'Sinh nhật'
          };
      }

      // 3. Form Entry (Amber)
      if (triggerType === 'form') {
          let formLabel = 'Đăng ký từ Form';
          let accent = 'amber';
          let gradient = 'from-amber-400 to-orange-500';

          if (linkedForm) {
              formLabel = `Liên kết Form: ${linkedForm.name}`;
          } else if (triggerConfig.targetId) {
              formLabel = `Form [${triggerConfig.targetId.substring(0,6)}] đã bị xóa`;
              accent = 'rose';
              gradient = 'from-rose-400 to-red-500';
          }

          return {
              icon: FileInput,
              accent: accent as any,
              gradientMain: gradient,
              label: formLabel
          };
      }

      // 4. Purchase Event (Pink)
      if (triggerType === 'purchase') {
          let label = 'Sự kiện mua hàng';
          let accent = 'pink';
          let gradient = 'from-pink-400 to-rose-500';

          if (linkedPurchaseEvent) {
              label = `Mua hàng: ${linkedPurchaseEvent.name}`;
          } else if (triggerConfig.targetId) {
              label = `Event Mua [${triggerConfig.targetId.substring(0,6)}] đã xóa`;
              accent = 'rose';
              gradient = 'from-rose-400 to-red-500';
          }

          return {
              icon: ShoppingCart, 
              accent: accent as any, 
              gradientMain: gradient, 
              label: label
          };
      }

      // 5. Custom Event (Violet)
      if (triggerType === 'custom_event') {
          let label = 'Sự kiện tùy chỉnh';
          let accent = 'violet';
          let gradient = 'from-violet-500 to-indigo-600';

          if (linkedCustomEvent) {
              label = `Custom Event: ${linkedCustomEvent.name}`;
          } else if (triggerConfig.targetId) {
              label = `Event [${triggerConfig.targetId.substring(0,6)}] đã xóa`;
              accent = 'rose';
              gradient = 'from-rose-400 to-red-500';
          }

          return {
              icon: Zap, 
              accent: accent as any, 
              gradientMain: gradient, 
              label: label
          };
      }

      // 6. Campaign (Royal Violet)
      if (triggerType === 'campaign') {
          const campaignName = linkedCampaign 
            ? `Liên kết: ${linkedCampaign.name}` 
            : (triggerConfig.targetId ? 'Liên kết: Chiến dịch đã xóa' : 'Chưa chọn chiến dịch');
          return {
              icon: Send, 
              accent: 'violet', 
              gradientMain: 'from-violet-500 to-purple-600', 
              label: campaignName
          };
      }

      // 7. VIP / Tag (Emerald)
      if (triggerType === 'tag') {
          return {
              icon: Tag, 
              accent: 'emerald', 
              gradientMain: 'from-emerald-500 to-teal-600', 
              label: triggerConfig.targetId ? `Tag: ${triggerConfig.targetId}` : 'Khi gắn nhãn'
          };
      }

      // Default (Orange/Segment)
      return {
          icon: Layers, 
          accent: 'orange', 
          gradientMain: 'from-orange-500 to-[#ca7900]', 
          label: 'Dựa trên phân khúc'
      };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const StatusPill = () => {
      if (isArchived) return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wide border border-slate-200">Archived</span>;
      if (isActive) return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</span>;
      return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wide border border-slate-200">Paused</span>;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        group relative bg-white rounded-[24px] border border-slate-200 transition-all duration-300 h-full flex flex-col cursor-pointer overflow-hidden
        ${isArchived ? 'opacity-60 grayscale' : 'hover:border-transparent hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1.5'}
      `}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradientMain} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="p-6 flex-1 relative z-10">
         <div className="flex justify-between items-start mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br ${theme.gradientMain}`}>
                <Icon className="w-6 h-6" />
            </div>
            <StatusPill />
         </div>

         <div>
            <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1.5 line-clamp-2 group-hover:text-[#ca7900] transition-colors">
               {flow.name}
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
               <span className={`w-1.5 h-1.5 rounded-full bg-${theme.accent}-500`}></span>
               <span className="truncate max-w-[220px]">{theme.label}</span>
            </div>
         </div>
      </div>

      <div className="px-6 pb-6 pt-2 relative z-10">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50/80 rounded-2xl border border-slate-100/50">
              <div className="flex flex-col items-center justify-center py-2 px-1 group/stat">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400 group-hover/stat:text-slate-600 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Steps</span>
                 </div>
                 <span className="text-sm font-black text-slate-700">{stepCount}</span>
              </div>
              <div className="flex flex-col items-center justify-center py-2 px-1 border-l border-slate-200/50 group/stat">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <Users className="w-3.5 h-3.5 text-blue-400 group-hover/stat:text-blue-600 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Users</span>
                 </div>
                 <span className="text-sm font-black text-slate-700">{enrolled.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center justify-center py-2 px-1 border-l border-slate-200/50 group/stat">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400 group-hover/stat:text-emerald-600 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open</span>
                 </div>
                 <span className={`text-sm font-black ${openRate > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{openRate}%</span>
              </div>
          </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 z-20">
         {isArchived ? (
            <>
                <button onClick={(e) => { e.stopPropagation(); onRestore?.(); }} className="w-8 h-8 flex items-center justify-center bg-white text-emerald-600 rounded-xl shadow-lg border border-slate-100 hover:bg-emerald-50 transition-colors" title="Khôi phục">
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(true); }} className="w-8 h-8 flex items-center justify-center bg-white text-rose-600 rounded-xl shadow-lg border border-slate-100 hover:bg-rose-50 transition-colors" title="Xóa vĩnh viễn">
                    <Trash2 className="w-4 h-4" />
                </button>
            </>
         ) : (
            <>
                 <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(flow); }} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-xl shadow-lg border border-slate-100 hover:bg-blue-50 transition-colors" title="Nhân bản">
                    <Copy className="w-4 h-4" />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(false); }} className="w-8 h-8 flex items-center justify-center bg-white text-rose-600 rounded-xl shadow-lg border border-slate-100 hover:bg-rose-50 rounded-xl transition-all" title="Thùng rác">
                    <Trash2 className="w-4 h-4" />
                 </button>
            </>
         )}
      </div>
    </div>
  );
};

export default FlowCard;
