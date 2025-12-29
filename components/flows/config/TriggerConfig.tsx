
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Tag, Target, Loader2, FileInput, Calendar, Clock, 
    CheckCircle2, Send, Cake, Lock, 
    List, Snowflake, History, Layers, Search, 
    Info, Filter, ArrowRight, MousePointer2, Check, ShoppingCart, Zap
} from 'lucide-react';
import { api } from '../../../services/storageAdapter';
import { Campaign, Flow, Segment, FormDefinition, PurchaseEvent, CustomEvent } from '../../../types';
import IntegrationGuideModal from '../modals/IntegrationGuideModal';

interface TriggerConfigProps {
  config: Record<string, any>;
  onChange: (newConfig: Record<string, any>, newLabel?: string) => void;
  disabled?: boolean;
  locked?: boolean;
  allFlows?: Flow[];
  currentFlowId?: string;
}

const TriggerConfig: React.FC<TriggerConfigProps> = ({ config, onChange, disabled, locked }) => {
  const [triggerType, setTriggerType] = useState<'segment' | 'tag' | 'form' | 'date' | 'campaign' | 'purchase' | 'custom_event'>(config.type || 'segment');
  const [targetSubtype, setTargetSubtype] = useState<'list' | 'segment'>(config.targetSubtype || 'list');
  const [lists, setLists] = useState<any[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);
        const [listRes, segRes, campRes, tagRes, formRes, purchRes, customRes] = await Promise.all([
            api.get<any[]>('lists'),
            api.get<Segment[]>('segments'),
            api.get<Campaign[]>('campaigns'),
            api.get<any[]>('tags'),
            api.get<FormDefinition[]>('forms'),
            api.get<PurchaseEvent[]>('purchase_events'),
            api.get<CustomEvent[]>('custom_events')
        ]);
        if (listRes.success) setLists(listRes.data);
        if (segRes.success) setSegments(segRes.data);
        if (campRes.success) setCampaigns(campRes.data);
        if (tagRes.success) setTags(tagRes.data);
        if (formRes.success) setForms(formRes.data);
        if (purchRes.success) setPurchases(purchRes.data);
        if (customRes.success) setCustomEvents(customRes.data);
        setLoading(false);
    };
    loadInitialData();
  }, []);

  const triggerOptions = [
    { id: 'segment', label: 'Phân khúc động', icon: Layers, color: 'orange', desc: 'Bộ lọc thông minh' },
    { id: 'form', label: 'Gửi Biểu mẫu', icon: FileInput, color: 'amber', desc: 'Từ Landing Page' },
    { id: 'purchase', label: 'Khách hàng Mua', icon: ShoppingCart, color: 'pink', desc: 'Sự kiện API' },
    { id: 'custom_event', label: 'Custom Event', icon: Zap, color: 'violet', desc: 'Sự kiện tùy chỉnh' },
    { id: 'tag', label: 'Được gắn nhãn', icon: Tag, color: 'emerald', desc: 'Phân loại thủ công' },
    { id: 'date', label: 'Ngày / Sự kiện', icon: Calendar, color: 'blue', desc: 'Sinh nhật, Ngủ đông' },
    { id: 'campaign', label: 'Sau Chiến dịch', icon: Send, color: 'indigo', desc: 'Tương tác Email' },
  ];

  const getLabelForType = (type: string, targetId: string, subtype?: string, dateField?: string) => {
    switch(type) {
        case 'segment':
            if (subtype === 'segment') {
                const seg = segments.find(s => s.id === targetId);
                return seg ? `Vào Phân khúc: ${seg.name}` : 'Khi vào Phân khúc';
            }
            const list = lists.find(l => l.id === targetId);
            return list ? `Vào Danh sách: ${list.name}` : 'Khi vào Danh sách';
        case 'form':
            const form = forms.find(f => f.id === targetId);
            return form ? `Gửi Form: ${form.name}` : 'Khi gửi Biểu mẫu';
        case 'purchase':
            const purch = purchases.find(p => p.id === targetId);
            return purch ? `Mua hàng: ${purch.name}` : 'Khi khách Mua hàng';
        case 'custom_event':
            const ce = customEvents.find(c => c.id === targetId);
            return ce ? `Sự kiện: ${ce.name}` : 'Khi có sự kiện tùy chỉnh';
        case 'tag':
            return targetId ? `Được gắn Tag: ${targetId}` : 'Khi được gắn nhãn';
        case 'campaign':
            const camp = campaigns.find(c => c.id === targetId);
            return camp ? `Sau Campaign: ${camp.name}` : 'Tương tác chiến dịch';
        case 'date':
            if (dateField === 'dateOfBirth') return 'Mừng Sinh nhật';
            if (dateField === 'lastActivity') return 'Khách hàng ngủ đông';
            return 'Sự kiện theo ngày';
        default: return 'Bắt đầu Flow';
    }
  };

  const handleTypeChange = (type: string) => {
    if (disabled || locked) return;
    setTriggerType(type as any);
    setSearchTerm('');
    const newLabel = getLabelForType(type, '', type === 'segment' ? 'list' : undefined);
    onChange({ ...config, type, targetId: '', targetSubtype: type === 'segment' ? 'list' : undefined }, newLabel);
  };

  const handleTargetChange = (id: string, subtype?: string) => {
    if (disabled) return;
    const finalSubtype = subtype || targetSubtype;
    const newLabel = getLabelForType(triggerType, id, finalSubtype, config.dateField);
    onChange({ ...config, targetId: id, targetSubtype: finalSubtype }, newLabel);
  };

  const getOptionClasses = (color: string, isSelected: boolean) => {
      const colors: any = {
          orange: isSelected ? 'border-orange-500 bg-orange-50 ring-orange-50' : 'hover:border-orange-200',
          amber: isSelected ? 'border-amber-500 bg-amber-50 ring-amber-50' : 'hover:border-amber-200',
          pink: isSelected ? 'border-pink-500 bg-pink-50 ring-pink-50' : 'hover:border-pink-200',
          emerald: isSelected ? 'border-emerald-500 bg-emerald-50 ring-emerald-50' : 'hover:border-emerald-200',
          blue: isSelected ? 'border-blue-500 bg-blue-50 ring-blue-50' : 'hover:border-blue-200',
          violet: isSelected ? 'border-violet-500 bg-violet-50 ring-violet-50' : 'hover:border-violet-200',
          indigo: isSelected ? 'border-indigo-500 bg-indigo-50 ring-indigo-50' : 'hover:border-indigo-200',
      };
      return colors[color] || '';
  };

  const getIconClasses = (color: string, isSelected: boolean) => {
      const colors: any = {
          orange: isSelected ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500',
          amber: isSelected ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500',
          pink: isSelected ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-500',
          emerald: isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500',
          blue: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500',
          violet: isSelected ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-500',
          indigo: isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-500',
      };
      return colors[color] || '';
  };

  const ConfigItem = ({ label, desc, icon: Icon, isSelected, onClick }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300 group
        ${isSelected 
            ? 'border-[#ffa900] bg-[#fff9f2] shadow-sm ring-2 ring-[#ffa900]/10' 
            : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all duration-300 ${isSelected ? 'bg-[#ffa900] text-white shadow-md' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-left overflow-hidden">
                <p className={`text-[13px] font-semibold transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{label}</p>
                {desc && <p className={`text-[9px] font-medium uppercase tracking-tight mt-0.5 transition-colors ${isSelected ? 'text-[#ca7900]/80' : 'text-slate-400'}`}>{desc}</p>}
            </div>
        </div>
        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-[#ffa900] bg-[#ffa900] text-white' : 'border-slate-300 bg-white'}`}>
            {isSelected && <CheckCircle2 className="w-3 h-3" />}
        </div>
    </button>
  );

  const selectedForm = forms.find(f => f.id === config.targetId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      {locked && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-[22px] flex items-center gap-4 shadow-sm animate-in zoom-in-95 mb-4">
              <div className="p-2.5 bg-white rounded-xl text-amber-500 shadow-sm"><Lock className="w-4.5 h-4.5" /></div>
              <div>
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Trigger đã bị khóa</p>
                  <p className="text-[10px] font-medium text-amber-700 leading-tight">Quy trình đã có khách tham gia, không thể thay đổi điểm bắt đầu.</p>
              </div>
          </div>
      )}

      {/* 1. TINH TẾ: EVENT SELECTOR (GRID 2 CỘT) */}
      <div className="space-y-3.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] px-1">Chọn sự kiện khởi đầu</label>
        <div className="grid grid-cols-2 gap-2.5">
            {triggerOptions.map((opt) => {
                const isSelected = triggerType === opt.id;
                return (
                    <button
                        key={opt.id}
                        disabled={disabled || locked}
                        onClick={() => handleTypeChange(opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-[20px] border-2 transition-all duration-300 relative group overflow-hidden
                        ${getOptionClasses(opt.color, isSelected)} 
                        ${isSelected ? 'shadow-sm ring-2' : 'bg-white border-slate-100'}
                        ${disabled || locked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 ${getIconClasses(opt.color, isSelected)} ${isSelected ? 'shadow-md' : 'group-hover:scale-105'}`}>
                            <opt.icon className="w-4 h-4" />
                        </div>
                        <div className="text-left overflow-hidden">
                            <p className={`text-xs font-bold leading-none mb-1 tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{opt.label}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight truncate">{opt.desc}</p>
                        </div>
                    </button>
                );
            })}
        </div>
      </div>

      {/* 2. ĐỒNG BỘ: DETAILED CONFIGURATION */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                <Target className="w-3 h-3" /> Chi tiết nguồn dữ liệu
            </h4>
            {triggerType === 'form' && config.targetId && (
                <button onClick={() => setShowGuide(true)} className="text-[9px] font-bold text-blue-600 hover:underline">Hướng dẫn tích hợp API</button>
            )}
        </div>

        {loading ? (
            <div className="py-20 text-center animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-slate-200 mx-auto" /></div>
        ) : (
            <div className="space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
                
                {/* SUB-TAB FOR SEGMENT/LIST */}
                {triggerType === 'segment' && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg w-full mb-1">
                        <button onClick={() => { setTargetSubtype('list'); handleTargetChange(''); }} className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${targetSubtype === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List className="w-3 h-3" /> Danh sách
                        </button>
                        <button onClick={() => { setTargetSubtype('segment'); handleTargetChange(''); }} className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${targetSubtype === 'segment' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Layers className="w-3 h-3" /> Phân khúc
                        </button>
                    </div>
                )}

                {/* SEARCH BAR */}
                {triggerType !== 'date' && (
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-[#ffa900] transition-colors" />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm nhanh..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#ffa900] transition-all" />
                    </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar p-0.5">
                    {/* CASE: SEGMENT / LIST */}
                    {triggerType === 'segment' && (targetSubtype === 'list' ? lists : segments)
                        .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(item => (
                            <ConfigItem
                                key={item.id}
                                label={item.name}
                                desc={`${item.count || 0} liên hệ`}
                                icon={targetSubtype === 'list' ? List : Layers}
                                isSelected={config.targetId === item.id}
                                onClick={() => handleTargetChange(item.id)}
                            />
                        ))
                    }

                    {/* CASE: FORM SUBMIT */}
                    {triggerType === 'form' && forms
                        .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(f => (
                            <ConfigItem
                                key={f.id}
                                label={f.name}
                                desc={`${f.stats?.submissions || 0} lượt đăng ký`}
                                icon={FileInput}
                                isSelected={config.targetId === f.id}
                                onClick={() => handleTargetChange(f.id)}
                            />
                        ))
                    }

                    {/* CASE: PURCHASE EVENT */}
                    {triggerType === 'purchase' && purchases
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(p => (
                            <ConfigItem
                                key={p.id}
                                label={p.name}
                                desc={`Event ID: ${p.id.substring(0, 8)}...`}
                                icon={ShoppingCart}
                                isSelected={config.targetId === p.id}
                                onClick={() => handleTargetChange(p.id)}
                            />
                        ))
                    }

                    {/* CASE: CUSTOM EVENT */}
                    {triggerType === 'custom_event' && customEvents
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(c => (
                            <ConfigItem
                                key={c.id}
                                label={c.name}
                                desc={`ID: ${c.id.substring(0, 8)}...`}
                                icon={Zap}
                                isSelected={config.targetId === c.id}
                                onClick={() => handleTargetChange(c.id)}
                            />
                        ))
                    }

                    {/* CASE: TAG ADDED */}
                    {triggerType === 'tag' && tags
                        .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(t => (
                            <ConfigItem
                                key={t.id}
                                label={t.name}
                                desc={`Kích hoạt khi gắn nhãn này`}
                                icon={Tag}
                                isSelected={config.targetId === t.name}
                                onClick={() => handleTargetChange(t.name)}
                            />
                        ))
                    }

                    {/* CASE: CAMPAIGN */}
                    {triggerType === 'campaign' && campaigns
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(c => (
                            <ConfigItem
                                key={c.id}
                                label={c.name}
                                desc={`Trạng thái: ${c.status}`}
                                icon={Send}
                                isSelected={config.targetId === c.id}
                                onClick={() => handleTargetChange(c.id)}
                            />
                        ))
                    }

                    {/* CASE: DATE / EVENTS */}
                    {triggerType === 'date' && (
                        <div className="space-y-3">
                            <ConfigItem
                                label="Chúc mừng Sinh nhật"
                                desc="Chạy đúng ngày sinh khách hàng"
                                icon={Cake}
                                isSelected={config.dateField === 'dateOfBirth'}
                                onClick={() => {
                                    const newLabel = getLabelForType('date', '', undefined, 'dateOfBirth');
                                    onChange({ ...config, dateField: 'dateOfBirth' }, newLabel);
                                }}
                            />
                            <ConfigItem
                                label="Khách hàng ngủ đông"
                                desc="Khi khách không tương tác quá lâu"
                                icon={Snowflake}
                                isSelected={config.dateField === 'lastActivity'}
                                onClick={() => {
                                    const newLabel = getLabelForType('date', '', undefined, 'lastActivity');
                                    onChange({ ...config, dateField: 'lastActivity', inactiveAmount: config.inactiveAmount || 30 }, newLabel);
                                }}
                            />

                            {config.dateField === 'lastActivity' && (
                                <div className="p-5 bg-white border border-[#ffa900]/20 rounded-[24px] space-y-4 animate-in slide-in-from-top-2 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-lg text-[#ca7900]"><History className="w-4 h-4" /></div>
                                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Thời gian không tương tác</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="number" 
                                            className="w-24 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-base text-slate-800 focus:border-[#ffa900] focus:bg-white outline-none transition-all"
                                            value={config.inactiveAmount || 30}
                                            onChange={(e) => onChange({...config, inactiveAmount: parseInt(e.target.value) || 30})}
                                            disabled={disabled}
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày liên tục</span>
                                    </div>
                                    <div className="p-3.5 bg-blue-50/50 rounded-xl flex items-start gap-2.5 border border-blue-100/50">
                                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">Hệ thống sẽ quét định kỳ những khách hàng không Mở hoặc Click link trong {config.inactiveAmount || 30} ngày để đưa vào luồng.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <IntegrationGuideModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
        formId={config.targetId} 
        formName={selectedForm?.name || 'Form'} 
        fields={selectedForm?.fields || []}
      />
    </div>
  );
};

export default TriggerConfig;
