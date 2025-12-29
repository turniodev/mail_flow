
import React from 'react';
import { Zap, Mail, Clock, GitMerge, Tag, Link as LinkIcon, Edit3, AlertOctagon, Beaker, Hourglass, MousePointer2, MailOpen, MoreHorizontal, MessageSquare, UserMinus, Filter, Calendar, FileInput, Users, CheckCircle2, Send, Plus, Minus, Trash2, List, ShoppingCart, Layers, Cake, Snowflake } from 'lucide-react';
import { FlowStep, Flow, FormDefinition } from '../../../types';

interface NodeProps {
  step: FlowStep;
  isGhost?: boolean;
  isDraggable?: boolean;
  isDragTarget?: boolean;
  isViewMode?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
  allFlows?: Flow[];
  allForms?: FormDefinition[];
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const QuickEdit = ({ onClick }: { onClick: () => void }) => (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
       <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="p-1.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-[#ffa900] hover:shadow-md transform hover:scale-110 transition-all">
          <MoreHorizontal className="w-4 h-4" />
       </button>
    </div>
);

const ValidationBadge = ({ type }: { type: 'error' | 'warning' }) => (
    <div className={`absolute -top-2.5 -right-2.5 p-1.5 rounded-full shadow-xl z-[60] animate-bounce ring-4 ring-white ${type === 'error' ? 'bg-rose-600 text-white' : 'bg-amber-50 text-white'}`}>
        <AlertOctagon className="w-4 h-4" />
    </div>
);

export const GhostNode = ({ label }: { label: string }) => (
    <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 border-dashed text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-500">
        {label}
    </div>
);

export const TriggerNode: React.FC<NodeProps> = ({ step, onClick, isViewMode, allForms = [] }) => {
    const hasFilter = !!step.config.filterSegmentId;
    const triggerType = step.config.type || 'segment';
    
    // Kiểm tra xem Form có bị xóa không
    const isFormDeleted = triggerType === 'form' && step.config.targetId && !allForms.find(f => f.id === step.config.targetId);

    const getTriggerStyle = () => {
        if (isFormDeleted) return { icon: AlertOctagon, color: 'from-rose-500 to-red-700', label: 'LỖI LIÊN KẾT' };
        
        switch(triggerType) {
            case 'segment': return { icon: Layers, color: 'from-orange-500 to-[#ca7900]', label: 'Segment Entry' };
            case 'form': return { icon: FileInput, color: 'from-amber-400 to-orange-500', label: 'Form Submit' };
            case 'purchase': return { icon: ShoppingCart, color: 'from-pink-500 to-rose-600', label: 'Purchase Event' };
            case 'custom_event': return { icon: Zap, color: 'from-violet-500 to-purple-600', label: 'Custom Event' };
            case 'tag': return { icon: Tag, color: 'from-emerald-500 to-teal-600', label: 'Tag Added' };
            case 'campaign': return { icon: Send, color: 'from-indigo-500 to-blue-600', label: 'Campaign Sent' };
            case 'date': 
                if (step.config.dateField === 'lastActivity') return { icon: Snowflake, color: 'from-cyan-500 to-blue-600', label: 'Inactivity' };
                if (step.config.dateField === 'dateOfBirth') return { icon: Cake, color: 'from-rose-400 to-pink-500', label: 'Birthday' };
                return { icon: Calendar, color: 'from-blue-500 to-indigo-600', label: 'Date Event' };
            default: return { icon: Zap, color: 'from-slate-700 to-slate-900', label: 'Trigger' };
        }
    };

    const { icon: Icon, color: gradient, label: typeLabel } = getTriggerStyle();
    
    return (
        <div 
          onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }} 
          className={`flow-interactive relative group z-30 ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <div className={`relative flex flex-col gap-0 rounded-[28px] text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] bg-[#1e293b] border border-white/10 ring-1 ring-white/5 transition-all overflow-hidden min-w-[240px] ${!isViewMode ? 'hover:scale-105 hover:-translate-y-1' : ''} ${isFormDeleted ? 'ring-2 ring-rose-500' : ''}`}>
                <div className="flex items-center gap-4 pl-4 pr-8 py-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg ring-2 ring-[#1e293b] transition-transform ${!isViewMode ? 'group-hover:rotate-3' : ''}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full ${isFormDeleted ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
                            <p className={`text-[9px] uppercase font-bold tracking-[0.2em] ${isFormDeleted ? 'text-rose-400' : 'text-slate-400'}`}>{typeLabel}</p>
                        </div>
                        <p className="text-sm font-bold whitespace-nowrap tracking-tight text-white mt-0.5 truncate max-w-[180px]" title={step.label}>
                            {isFormDeleted ? `Form [${step.config.targetId.substring(0,8)}] đã bị xóa` : step.label}
                        </p>
                    </div>
                </div>

                {hasFilter && (
                    <div className="bg-emerald-500/10 border-t border-white/5 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-tight">Segment Filter</span>
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                )}
                
                {isFormDeleted && (
                    <div className="bg-rose-500/20 border-t border-white/5 px-4 py-2 flex items-center gap-2">
                        <AlertOctagon className="w-3 h-3 text-rose-500" />
                        <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Cần chọn lại Form</span>
                    </div>
                )}
            </div>
            {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
        </div>
    );
};

export const ActionNode: React.FC<NodeProps> = ({ step, hasError, hasWarning, onClick, isDraggable, onDragStart, onDragOver, onDrop, isViewMode }) => {
  const isTag = step.type === 'update_tag';
  const tagAction = step.config.action || 'add';
  const tags = step.config.tags || [];
  
  const incomplete = isTag ? tags.length === 0 : (!step.config.subject || (!step.config.templateId && !step.config.customHtml));

  return (
    <div 
      draggable={isDraggable && !isViewMode} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }}
      className={`
        flow-interactive relative w-[260px] p-5 rounded-[28px] bg-white z-20 group transition-all duration-300 border border-slate-100
        ${isViewMode ? 'shadow-sm cursor-default' : (incomplete || hasError) 
            ? 'ring-2 ring-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.15)] hover:-translate-y-1.5 cursor-pointer' 
            : isTag 
                ? 'hover:ring-2 hover:ring-emerald-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:-translate-y-1.5 cursor-pointer' 
                : 'hover:ring-2 hover:ring-blue-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 cursor-pointer'}
      `}
    >
        <div className="flex items-start gap-4">
           <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform 
                ${!isViewMode ? 'group-hover:scale-110 group-hover:rotate-3' : ''}
                ${isTag 
                    ? (tagAction === 'remove' ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-200' : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200') 
                    : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-200'}
           `}>
              {isTag ? <Tag className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
           </div>
           
           <div className="flex-1 overflow-hidden pt-0.5">
                <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-2 ${isTag ? (tagAction === 'remove' ? 'text-rose-600' : 'text-emerald-600') : 'text-blue-600'}`}>
                    {isTag ? (tagAction === 'remove' ? 'Remove Tag' : 'Add Tag') : 'Send Email'}
                </p>
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{step.label}</p>
                
                {isTag && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {tags.slice(0, 3).map((t: string) => (
                            <span key={t} className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5 ${tagAction === 'remove' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                {tagAction === 'remove' ? <Minus className="w-2 h-2" /> : <Plus className="w-2 h-2" />} {t}
                            </span>
                        ))}
                        {tags.length > 3 && <span className="text-[9px] text-slate-400 font-medium pt-0.5">+{tags.length - 3}</span>}
                    </div>
                )}

                {!isTag && (
                    <div className="space-y-1 mt-2">
                        <div className={`text-[10px] truncate px-2 py-1 rounded-lg border ${incomplete ? 'bg-rose-50 border-rose-100 text-rose-600 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500 font-medium'}`}>
                            {step.config.subject || (isViewMode ? 'No Subject' : 'Chưa cấu hình')}
                        </div>
                        {!step.config.senderEmail && !isViewMode && (
                            <div className="text-[9px] text-slate-400 font-bold bg-slate-50/50 px-2 py-0.5 rounded border border-transparent w-fit">
                                Email Mặc định
                            </div>
                        )}
                    </div>
                )}
           </div>
        </div>
        
        {!isViewMode && (incomplete || hasError) && <ValidationBadge type="error" />}
        {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
    </div>
  );
};

export const RemoveNode: React.FC<NodeProps> = ({ step, onClick, isViewMode, isDraggable, onDragStart, onDragOver, onDrop }) => {
    const actionType = step.config.actionType || 'unsubscribe'; // Default changed to unsubscribe
    const isDelete = actionType === 'delete_contact';
    
    const getActionLabel = () => {
        if (isDelete) return 'Delete Forever'; 
        return 'Unsubscribe';
    };

    return (
        <div 
            draggable={isDraggable && !isViewMode} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
            onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }}
            className={`flow-interactive relative w-[240px] p-4 rounded-[24px] bg-white z-20 group transition-all border border-rose-100 shadow-[0_4px_15px_rgba(244,63,94,0.05)] ${isViewMode ? 'shadow-sm' : 'hover:border-rose-400 hover:shadow-[0_10px_30px_-5px_rgba(244,63,94,0.15)] hover:-translate-y-1 cursor-pointer'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${isDelete ? 'bg-gradient-to-br from-rose-500 to-red-700 text-white' : 'bg-rose-50 text-rose-600'}`}>
                    {isDelete ? <Trash2 className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                </div>
                <div>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest leading-none mb-1">
                        {getActionLabel()}
                    </p>
                    <p className="text-xs font-bold text-slate-800">{step.label}</p>
                </div>
            </div>
            {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
        </div>
    );
};

export const WaitNode: React.FC<NodeProps> = ({ step, onClick, isViewMode }) => {
  const incomplete = !step.config.duration || !step.config.unit;
  const unitMap: any = { hours: 'Giờ', days: 'Ngày', weeks: 'Tuần' };
  const displayLabel = incomplete ? 'Chưa cấu hình' : `${step.config.duration} ${unitMap[step.config.unit] || 'Giờ'}`;

  return (
    <div 
        onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }} 
        className={`flow-interactive relative z-20 group ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
    >
       <div className={`
            relative flex items-center gap-4 bg-white border rounded-full pl-2 pr-8 py-2 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 w-fit min-w-[200px]
            ${incomplete ? 'border-rose-200 ring-4 ring-rose-50/50' : 'border-slate-100 hover:border-amber-400 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.25)]'}
            ${!isViewMode ? 'hover:-translate-y-1' : ''}
       `}>
          <div className={`
                w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300
                ${!isViewMode ? 'group-hover:scale-105 group-hover:rotate-12' : ''}
                ${incomplete ? 'bg-rose-100 text-rose-600' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'}
          `}>
             <Clock className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start overflow-hidden">
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-[0.2em] leading-none mb-1.5">Delay For</span>
              <span className={`text-sm font-bold truncate leading-none ${incomplete ? 'text-rose-600' : 'text-slate-900'}`}>
                {displayLabel}
              </span>
          </div>
       </div>
       {!isViewMode && incomplete && <ValidationBadge type="error" />}
       {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
    </div>
  );
};

export const ConditionNode: React.FC<NodeProps> = ({ step, onClick, isViewMode }) => {
  const incomplete = !step.config.conditionType || !step.config.waitDuration;
  const unitMap: any = { hours: 'giờ', days: 'ngày', weeks: 'tuần' };
  
  const getActionInfo = () => {
    switch(step.config.conditionType) {
      case 'opened': return { label: 'Đã mở Email?', icon: MailOpen };
      case 'clicked': return { label: 'Đã click Link?', icon: MousePointer2 };
      case 'replied': return { label: 'Đã phản hồi?', icon: MessageSquare };
      case 'unsubscribed': return { label: 'Hủy đăng ký?', icon: UserMinus };
      default: return { label: 'Đang theo dõi...', icon: Hourglass };
    }
  };

  const { label: actionText, icon: Icon } = getActionInfo();

  return (
    <div 
        onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }} 
        className={`flow-interactive relative z-20 group ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
    >
       <div className={`
            flex flex-col bg-white border rounded-[28px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 w-[240px]
            ${!isViewMode ? 'hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-5px_rgba(99,102,241,0.15)]' : ''}
            ${incomplete ? 'border-rose-200' : 'border-slate-100 hover:border-indigo-200'}
       `}>
          <div className="p-1 bg-slate-50 border-b border-slate-100 flex gap-1">
             <div className="h-1.5 flex-1 rounded-full bg-emerald-400"></div>
             <div className="h-1.5 flex-1 rounded-full bg-rose-400"></div>
          </div>
          <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <GitMerge className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">Logic</p>
                  </div>
              </div>
              <div className="mb-3">
                 <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{step.label}</p>
                 <div className="flex items-center gap-1.5 text-slate-500">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{actionText}</span>
                 </div>
              </div>
              {!incomplete ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                   <Hourglass className="w-3 h-3 text-amber-500" />
                   <span>Wait: {step.config.waitDuration} {unitMap[step.config.waitUnit] || 'giờ'}</span>
                </div>
              ) : (
                <div className="text-[10px] text-rose-600 font-bold bg-rose-50 px-3 py-2 rounded-xl text-center border border-rose-100">
                    {isViewMode ? 'Not configured' : 'Chưa cấu hình'}
                </div>
              )}
          </div>
       </div>
       {!isViewMode && incomplete && <ValidationBadge type="error" />}
       {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
    </div>
  );
};

export const SplitTestNode: React.FC<NodeProps> = ({ step, onClick, isViewMode }) => {
    const ratioA = step.config.ratioA || 50;
    const ratioB = step.config.ratioB || 50;

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }} 
            className={`flow-interactive relative z-20 group ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
        >
           <div className={`flex flex-col bg-white border border-slate-100 rounded-[28px] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] overflow-hidden transition-all w-[220px] ${!isViewMode ? 'hover:border-violet-300 hover:shadow-[0_20px_40px_-5px_rgba(139,92,246,0.15)] hover:-translate-y-1.5' : ''}`}>
              <div className="w-full h-1 bg-gradient-to-r from-violet-500 to-purple-400"></div>
              <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                          <Beaker className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">A/B Test</p>
                          <p className="text-xs font-bold text-slate-800">Chia nhóm</p>
                      </div>
                  </div>
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3 ring-1 ring-slate-200">
                      <div className="absolute left-0 top-0 h-full bg-violet-500" style={{ width: `${ratioA}%` }}></div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${ratioA}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-violet-600">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        A: {ratioA}%
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        B: {ratioB}%
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      </div>
                  </div>
              </div>
           </div>
           {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
        </div>
    );
};

export const LinkNode: React.FC<NodeProps> = ({ step, onClick, hasError, isViewMode }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }} 
        className={`flow-interactive relative z-20 group ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
    >
        <div className={`
            pl-2 pr-6 py-2 rounded-full border flex items-center gap-3 transition-all
            ${!isViewMode ? 'hover:scale-105' : ''}
            ${hasError 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-slate-800 border-slate-700 text-white shadow-xl shadow-slate-500/20'}
        `}>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <LinkIcon className="w-4 h-4" />
            </div>
            <div>
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 block">Jump to</span>
                <span className="text-xs font-bold">{hasError ? 'Lỗi liên kết' : 'Flow khác'}</span>
            </div>
        </div>
        {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
    </div>
);

export const ListActionNode: React.FC<NodeProps> = ({ step, onClick, isViewMode, isDraggable, onDragStart, onDragOver, onDrop }) => {
    const action = step.config.action || 'add';
    
    return (
        <div 
            draggable={isDraggable && !isViewMode} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
            onClick={(e) => { e.stopPropagation(); if(!isViewMode) onClick?.(); }}
            className={`
                flow-interactive relative w-[260px] p-5 rounded-[28px] bg-white z-20 group transition-all duration-300 border border-slate-100
                ${isViewMode ? 'shadow-sm cursor-default' : 'hover:ring-2 hover:ring-orange-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] hover:-translate-y-1.5 cursor-pointer'}
            `}
        >
            <div className="flex items-start gap-4">
               <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform 
                    ${!isViewMode ? 'group-hover:scale-110 group-hover:rotate-3' : ''}
                    bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200
               `}>
                  <List className="w-5 h-5" />
               </div>
               
               <div className="flex-1 overflow-hidden pt-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-2 text-orange-600">
                        {action === 'add' ? 'Add to List' : 'Remove from List'}
                    </p>
                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{step.label}</p>
               </div>
            </div>
            
            {!isViewMode && <QuickEdit onClick={onClick || (() => {})} />}
        </div>
    );
};
