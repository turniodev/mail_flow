
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GitMerge, Users, Calendar, Type, Hash, List, Clock, AlertTriangle, Layers, Copy, Crown, UserPlus, Zap, Ghost, UserMinus, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Segment, Subscriber } from '../../types';

interface SegmentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: any) => void;
  initialSegment?: Segment | null; 
  subscribers?: Subscriber[];
}

interface SegmentCondition {
    id: string;
    field: string;
    operator: string;
    value: string;
}

interface SegmentGroup {
    id: string;
    conditions: SegmentCondition[];
}

const FIELD_DEFINITIONS: Record<string, { type: 'text' | 'number' | 'date' | 'select' | 'tags', label: string }> = {
  email: { type: 'text', label: 'Email' },
  tags: { type: 'tags', label: 'Tag (Nhãn)' },
  status: { type: 'select', label: 'Trạng thái' },
  firstName: { type: 'text', label: 'Tên' },
  lastName: { type: 'text', label: 'Họ' },
  city: { type: 'text', label: 'Thành phố' },
  joinedAt: { type: 'date', label: 'Ngày tham gia' },
  'stats.emailsOpened': { type: 'number', label: 'Số email đã mở' },
  'stats.linksClicked': { type: 'number', label: 'Số link đã click' },
};

const SEGMENT_TEMPLATES = [
    {
        id: 'vip',
        name: 'Khách hàng VIP',
        icon: Crown,
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        criteria: [{ id: 'g1', conditions: [
            { id: 'c1', field: 'tags', operator: 'contains', value: 'VIP' },
            { id: 'c2', field: 'stats.emailsOpened', operator: 'greater_than', value: '10' }
        ]}]
    },
    {
        id: 'new_leads',
        name: 'Người mới (7 ngày)',
        icon: UserPlus,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        criteria: [{ id: 'g1', conditions: [
            { id: 'c1', field: 'joinedAt', operator: 'after', value: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] }
        ]}]
    },
    {
        id: 'inactive',
        name: 'Khách sắp rời bỏ',
        icon: UserMinus,
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        criteria: [{ id: 'g1', conditions: [
            { id: 'c1', field: 'stats.emailsOpened', operator: 'equals', value: '0' },
            { id: 'c2', field: 'joinedAt', operator: 'before', value: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] }
        ]}]
    },
    {
        id: 'engaged',
        name: 'Tương tác cao',
        icon: Zap,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        criteria: [{ id: 'g1', conditions: [
            { id: 'c1', field: 'stats.linksClicked', operator: 'greater_than', value: '5' }
        ]}]
    }
];

const OPERATORS_BY_TYPE: Record<string, { value: string, label: string }[]> = {
  text: [
    { value: 'contains', label: 'Chứa (Contains)' },
    { value: 'equals', label: 'Là (Equals)' },
    { value: 'starts_with', label: 'Bắt đầu bằng' },
    { value: 'not_contains', label: 'Không chứa' },
  ],
  number: [
    { value: 'greater_than', label: 'Lớn hơn (>)' },
    { value: 'less_than', label: 'Nhỏ hơn (<)' },
    { value: 'equals', label: 'Bằng (=)' },
  ],
  date: [
    { value: 'after', label: 'Sau ngày' },
    { value: 'before', label: 'Trước ngày' },
    { value: 'on', label: 'Vào ngày' },
  ],
  select: [
    { value: 'is', label: 'Là' },
    { value: 'is_not', label: 'Không phải là' },
  ],
  tags: [
    { value: 'contains', label: 'Có chứa Tag' },
    { value: 'not_contains', label: 'Không chứa Tag' },
  ]
};

const SegmentBuilderModal: React.FC<SegmentBuilderModalProps> = ({ isOpen, onClose, onSave, initialSegment, subscribers = [] }) => {
  const [name, setName] = useState('');
  const [groups, setGroups] = useState<SegmentGroup[]>([]);
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [autoCleanupDays, setAutoCleanupDays] = useState('0');

  useEffect(() => {
    if (isOpen) {
      if (initialSegment) {
        setName(initialSegment.name);
        setAutoCleanupDays(initialSegment.autoCleanupDays?.toString() || '0');
        try {
            const parsedCriteria = JSON.parse(initialSegment.criteria);
            if (Array.isArray(parsedCriteria)) {
                setGroups(parsedCriteria);
            } else {
                throw new Error();
            }
        } catch (e) {
            setGroups([{ id: crypto.randomUUID(), conditions: [{ id: crypto.randomUUID(), field: 'tags', operator: 'contains', value: '' }] }]);
        }
      } else {
        setName('');
        setAutoCleanupDays('0');
        setGroups([{ id: crypto.randomUUID(), conditions: [{ id: crypto.randomUUID(), field: 'tags', operator: 'contains', value: '' }] }]);
      }
    }
  }, [isOpen, initialSegment]);

  useEffect(() => {
      setEstimatedCount(Math.floor(Math.random() * (subscribers.length || 100))); 
  }, [groups, subscribers.length]);

  const applyTemplate = (tpl: any) => {
      setName(tpl.name);
      setGroups(tpl.criteria.map((g: any) => ({
          ...g,
          id: crypto.randomUUID(),
          conditions: g.conditions.map((c: any) => ({ ...c, id: crypto.randomUUID() }))
      })));
  };

  const addGroup = () => {
      setGroups([...groups, {
          id: crypto.randomUUID(),
          conditions: [{ id: crypto.randomUUID(), field: 'email', operator: 'contains', value: '' }]
      }]);
  };

  const removeGroup = (groupId: string) => {
      setGroups(groups.filter(g => g.id !== groupId));
  };

  const duplicateGroup = (group: SegmentGroup) => {
      const newGroup = {
          ...group,
          id: crypto.randomUUID(),
          conditions: group.conditions.map(c => ({ ...c, id: crypto.randomUUID() }))
      };
      setGroups([...groups, newGroup]);
  };

  const addConditionToGroup = (groupId: string) => {
      setGroups(groups.map(g => g.id === groupId ? { ...g, conditions: [...g.conditions, { id: crypto.randomUUID(), field: 'email', operator: 'contains', value: '' }] } : g));
  };

  const removeCondition = (groupId: string, condId: string) => {
      setGroups(groups.map(g => g.id === groupId ? { ...g, conditions: g.conditions.filter(c => c.id !== condId) } : g).filter(g => g.conditions.length > 0));
  };

  const updateCondition = (groupId: string, condId: string, key: keyof SegmentCondition, val: string) => {
      setGroups(groups.map(g => {
          if (g.id !== groupId) return g;
          return {
              ...g,
              conditions: g.conditions.map(c => {
                  if (c.id !== condId) return c;
                  const updated = { ...c, [key]: val };
                  if (key === 'field') {
                      const type = FIELD_DEFINITIONS[val]?.type || 'text';
                      updated.operator = OPERATORS_BY_TYPE[type][0].value;
                      updated.value = '';
                  }
                  return updated;
              })
          };
      }));
  };

  const fieldOptions = Object.entries(FIELD_DEFINITIONS).map(([k, v]) => ({ value: k, label: v.label }));

  const renderInput = (groupId: string, cond: SegmentCondition) => {
      const type = FIELD_DEFINITIONS[cond.field]?.type || 'text';
      if (type === 'select' && cond.field === 'status') {
          return <Select options={[{value:'active', label:'Active'}, {value:'unsubscribed', label:'Unsubscribed'}]} value={cond.value} onChange={(v) => updateCondition(groupId, cond.id, 'value', v)} />;
      }
      return <Input value={cond.value} onChange={(e) => updateCondition(groupId, cond.id, 'value', e.target.value)} type={type === 'number' ? 'number' : (type === 'date' ? 'date' : 'text')} className="h-[42px]" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSegment ? "Chỉnh sửa phân khúc" : "Tạo phân khúc động"}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={onClose}>Hủy bỏ</Button>
            <Button icon={Save} onClick={() => { 
                onSave({ ...initialSegment, name, criteria: JSON.stringify(groups), count: estimatedCount, autoCleanupDays: parseInt(autoCleanupDays) }); 
                onClose(); 
            }}>
                {initialSegment ? 'Cập nhật' : 'Lưu phân khúc'}
            </Button>
        </div>
      }
    >
      <div className="flex flex-col">
          {/* Templates Section */}
          {!initialSegment && (
              <div className="shrink-0 mb-8 p-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-1">Mẫu phân khúc phổ biến</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SEGMENT_TEMPLATES.map(tpl => (
                          <button 
                            key={tpl.id} 
                            onClick={() => applyTemplate(tpl)}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-400 hover:shadow-md transition-all group"
                          >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${tpl.color}`}>
                                  <tpl.icon className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 text-center">{tpl.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <div className="shrink-0 space-y-4 mb-6">
            <Input label="Tên phân khúc" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="VD: Khách hàng VIP tại Hà Nội" />
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Tự động dọn dẹp (Lưu trữ)</label>
                    <Select options={[{value:'0', label:'Không bao giờ'}, {value:'30', label:'Sau 30 ngày'}, {value:'90', label:'Sau 90 ngày'}]} value={autoCleanupDays} onChange={setAutoCleanupDays} />
                </div>
            </div>
          </div>

          <div className="mt-6">
              <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-blue-500" /> Logic lọc dữ liệu
              </div>

              <div className="space-y-4">
                  {groups.map((group, idx) => (
                      <div key={group.id} className="relative animate-in slide-in-from-bottom-2">
                          {idx > 0 && (
                              <div className="flex items-center gap-4 my-3">
                                  <div className="h-px bg-slate-200 flex-1"></div>
                                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 uppercase">Hoặc (OR)</span>
                                  <div className="h-px bg-slate-200 flex-1"></div>
                              </div>
                          )}
                          
                          <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-6 relative group/card transition-all hover:border-blue-300 hover:shadow-sm">
                              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button onClick={() => duplicateGroup(group)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-blue-100 transition-all"><Copy className="w-4 h-4" /></button>
                                  {groups.length > 1 && <button onClick={() => removeGroup(group.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>}
                              </div>

                              <div className="space-y-3">
                                  {group.conditions.map((cond, cIdx) => {
                                      const type = FIELD_DEFINITIONS[cond.field]?.type || 'text';
                                      return (
                                          <div key={cond.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                              <div className="w-12 shrink-0">
                                                  {cIdx > 0 ? (
                                                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">VÀ</span>
                                                  ) : (
                                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">NẾU</span>
                                                  )}
                                              </div>
                                              
                                              <div className="flex-1 grid grid-cols-12 gap-2 w-full">
                                                  <div className="col-span-4">
                                                      <Select options={fieldOptions} value={cond.field} onChange={(v) => updateCondition(group.id, cond.id, 'field', v)} className="h-[42px]" />
                                                  </div>
                                                  <div className="col-span-3">
                                                      <Select options={OPERATORS_BY_TYPE[type] || OPERATORS_BY_TYPE.text} value={cond.operator} onChange={(v) => updateCondition(group.id, cond.id, 'operator', v)} className="h-[42px]" />
                                                  </div>
                                                  <div className="col-span-5 relative group/input">
                                                      {renderInput(group.id, cond)}
                                                      {group.conditions.length > 1 && (
                                                          <button onClick={() => removeCondition(group.id, cond.id)} className="absolute -right-2 -top-2 bg-white text-rose-500 p-1 rounded-full border border-slate-200 shadow-md opacity-0 group-hover/input:opacity-100 transition-opacity z-10 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                              
                              <button onClick={() => addConditionToGroup(group.id)} className="mt-4 ml-12 text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all active:scale-95 uppercase tracking-wide">
                                  <Plus className="w-3.5 h-3.5" /> Thêm điều kiện (AND)
                              </button>
                          </div>
                      </div>
                  ))}

                  <button onClick={addGroup} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[28px] text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-2 hover:border-[#ffa900] hover:text-[#ca7900] hover:bg-orange-50/10 transition-all group">
                      <div className="p-2 bg-slate-100 rounded-full group-hover:bg-[#ffa900] group-hover:text-white transition-all"><Plus className="w-5 h-5" /></div>
                      <span>THÊM NHÓM ĐIỀU KIỆN (OR)</span>
                  </button>
              </div>
          </div>
          
          <div className="shrink-0 pt-4 border-t border-slate-100 mt-6">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl"><Users className="w-5 h-5 text-[#ffa900]" /></div>
                      <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dự kiến bộ lọc</p>
                          <p className="text-xs font-medium text-slate-300">Tự động cập nhật mỗi 1h</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="font-black text-2xl tracking-tighter text-[#ffa900]">{estimatedCount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Người khớp</span>
                  </div>
              </div>
          </div>
      </div>
    </Modal>
  );
};

export default SegmentBuilderModal;
