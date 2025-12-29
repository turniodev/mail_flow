

import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Save, History, FileText, Mail, MousePointer2, 
    Tag, User, List, Trash2, Plus, MailOpen, UserPlus, Layers, GitMerge,
    Phone, Globe, CheckCircle2, Edit3, Briefcase, Building, MapPin, Activity, Cake, UserMinus,
    Zap, UserCircle, Search, Clock, MessageSquare, AlertOctagon, Send, AlertTriangle,
    // @ts-ignore: Added missing ShoppingCart and ArrowRight icons
    ShoppingCart, ArrowRight
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Tabs from '../common/Tabs';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast, { ToastType } from '../common/Toast';
import { api } from '../../services/storageAdapter';
// @ts-ignore: `Subscriber`, `Segment`, `Flow`, `SubscriberNote` are exported from types.ts
import { Subscriber, Segment, Flow, SubscriberNote } from '../../types';

interface CustomerProfileModalProps {
  subscriber: Subscriber | null;
  onClose: () => void;
  onUpdate: (updated: Subscriber) => void;
  onDelete: (id: string) => void;
  allLists: any[];
  allSegments: Segment[];
  allFlows: Flow[];
  allTags?: string[];
  checkMatch: (sub: Subscriber, criteria: string) => boolean;
  onAddToList: (subId: string, listId: string) => void;
  onRemoveFromList: (subId: string, listId: string) => void;
}

const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Không có';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa có';
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);
    if (diffSeconds < 60) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ 
    subscriber, onClose, onUpdate, onDelete, allLists, allSegments, allFlows, allTags = [], checkMatch,
    onAddToList, onRemoveFromList
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [newNote, setNewNote] = useState('');
  const [tagPickerValue, setTagPickerValue] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const [fullActivity, setFullActivity] = useState<any[]>([]);

  // Config for Delete Confirmation
  const [confirmConfig, setConfirmConfig] = useState<{
      isOpen: boolean; title: string; message: string; variant: 'danger' | 'warning'; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  // Config for Automation Trigger Warning
  const [triggerWarning, setTriggerWarning] = useState<{
      isOpen: boolean;
      triggeredFlows: Flow[];
      actionName: string;
      onConfirm: () => void;
  }>({ isOpen: false, triggeredFlows: [], actionName: '', onConfirm: () => {} });

  const resetState = async () => {
    if (subscriber) {
        setFormData(JSON.parse(JSON.stringify(subscriber)));
        setIsEditing(false);
        setNewNote('');
        setTagPickerValue('');
        
        // Fetch full subscriber data including activity, always fresh on open
        const res = await api.get<any>(`subscribers/${subscriber.id}`);
        if (res.success) {
            // Ensure formData reflects latest from API, but keep notes from prop if it's more up-to-date
            setFormData({ ...res.data, notes: Array.isArray(subscriber.notes) ? subscriber.notes : [] }); 
            setFullActivity(res.data.activity || []);
        } else {
            // Fallback to prop if API fails
            setFullActivity(subscriber.activity || []);
        }
    }
  };

  useEffect(() => { 
    if (subscriber) {
        resetState(); 
    }
  }, [subscriber]);

  // When formData.notes changes, ensure the subscriber prop's notes are also up-to-date (for other parts of the app)
  // This useEffect ensures consistency if external changes happen via `onUpdate` prop call
  useEffect(() => {
      // FIX: Ensure subscriber.notes and formData.notes are arrays for comparison
      const subscriberNotes = Array.isArray(subscriber?.notes) ? subscriber!.notes : [];
      const formDataNotes = Array.isArray(formData.notes) ? formData.notes : [];

      if (subscriber && JSON.stringify(subscriberNotes) !== JSON.stringify(formDataNotes)) {
          // If notes in prop are different from local, update local to match prop (e.g. after onUpdate in parent)
          setFormData(prev => ({ ...prev, notes: subscriberNotes }));
      }
  }, [subscriber?.notes, formData.notes]);


  const showToast = (message: string, type: ToastType = 'success') => setToast({ message: message, type: type, isVisible: true });

  const memberInsights = useMemo(() => {
    if (!subscriber) return { segments: [], flows: [] };
    const matchedSegments = allSegments.filter(seg => checkMatch(subscriber, seg.criteria));
    const matchedSegmentIds = new Set(matchedSegments.map(s => s.id));
    const activeFlows = allFlows.filter(flow => {
        const trigger = flow.steps.find(s => s.type === 'trigger');
        return trigger && trigger.config.type === 'segment' && matchedSegmentIds.has(trigger.config.targetId);
    });
    return { segments: matchedSegments, flows: activeFlows };
  }, [subscriber, allSegments, allFlows, checkMatch]);

  const activities = useMemo(() => {
    if (!fullActivity || fullActivity.length === 0) {
        if (!subscriber) return [];
        return [{ id: 'join', date: subscriber.joinedAt, label: 'Gia nhập hệ thống', detail: `Nguồn: ${subscriber.source || 'Manual'}`, icon: UserPlus, color: 'text-blue-500 bg-blue-50' }];
    }

    return fullActivity.map((act, i) => {
        let icon = Activity;
        let color = 'text-slate-500 bg-slate-50';
        let label = 'Hoạt động';

        switch(act.type) {
            case 'open_email': 
                icon = MailOpen; color = 'text-orange-500 bg-orange-50'; label = 'Mở Email'; 
                break;
            case 'click_link': 
                icon = MousePointer2; color = 'text-emerald-500 bg-emerald-50'; label = 'Click Link'; 
                break;
            case 'reply_email':
                icon = MessageSquare; color = 'text-indigo-600 bg-indigo-50 border-indigo-100'; label = 'Đã Phản hồi';
                break;
            case 'unsubscribe':
                icon = UserMinus; color = 'text-rose-600 bg-rose-50 border-rose-100'; label = 'Hủy đăng ký';
                break;
            case 'join_list': 
                icon = List; color = 'text-blue-500 bg-blue-50'; label = 'Vào Danh sách'; 
                break;
            case 'enter_segment': 
                icon = Layers; color = 'text-purple-500 bg-purple-50'; label = 'Vào Phân khúc'; 
                break;
            case 'enter_flow':
                icon = Zap; color = 'text-yellow-500 bg-yellow-50'; label = 'Vào Automation';
                break;
            case 'note_added':
                icon = FileText; color = 'text-slate-500 bg-slate-50'; label = 'Ghi chú';
                break;
            case 'form_submit': // Added for Form Submissions
                icon = FileText; color = 'text-amber-500 bg-amber-50'; label = 'Gửi Form';
                break;
            case 'purchase': // Added for Purchase Events
                // @ts-ignore: ShoppingCart is now imported
                icon = ShoppingCart; color = 'text-pink-500 bg-pink-50'; label = 'Mua hàng'; 
                break;
            case 'custom_event': // Added for Custom Events
                icon = Zap; color = 'text-violet-500 bg-violet-50'; label = 'Custom Event';
                break;
            case 'tag_added': // Added for Tag Added
                icon = Tag; color = 'text-emerald-500 bg-emerald-50'; label = 'Gắn Tag';
                break;
            case 'exit_flow': // Added for Flow Exit
                // @ts-ignore: ArrowRight is now imported
                icon = ArrowRight; color = 'text-red-500 bg-red-50'; label = 'Thoát Flow'; 
                break;
        }

        return {
            id: i,
            date: act.created_at, // Changed from `date` to `created_at`
            label: act.type === 'reply_email' ? 'Khách hàng phản hồi' : (act.type === 'unsubscribe' ? 'Đã hủy đăng ký' : `${label}: ${act.label || act.reference_name || ''}`),
            detail: act.details || '',
            icon, color
        };
    });
  }, [fullActivity, subscriber]);

  if (!subscriber || !formData) return null;

  const handleSave = () => {
      if (!formData.email) {
          showToast('Email là bắt buộc', 'error');
          return;
      }
      const payload = { ...formData };
      if (!payload.dateOfBirth) payload.dateOfBirth = null;
      if (!payload.anniversaryDate) payload.anniversaryDate = null;
      
      onUpdate(payload as Subscriber);
      setIsEditing(false);
      showToast('Đã cập nhật hồ sơ!', 'success');
  };

  const handleAddNote = () => {
      if (!newNote.trim()) return;

      const newNoteEntry: SubscriberNote = {
          id: crypto.randomUUID(),
          content: newNote.trim(),
          createdAt: new Date().toISOString(),
          createdBy: 'Admin' // Assuming 'Admin' for now
      };
      
      // FIX: Ensure subscriber.notes and formData.notes are arrays
      const currentSubscriberNotes = Array.isArray(subscriber.notes) ? subscriber.notes : [];
      const currentFormDataNotes = Array.isArray(formData.notes) ? formData.notes : [];

      const updatedSubscriberNotes = [newNoteEntry, ...currentSubscriberNotes]; 
      const updatedFormDataNotes = [newNoteEntry, ...currentFormDataNotes];

      onUpdate({ ...subscriber, notes: updatedSubscriberNotes }); // Update parent state
      setFormData(prev => ({ ...prev, notes: updatedFormDataNotes })); // Update local state
      setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
      // FIX: Ensure subscriber.notes and formData.notes are arrays
      const updatedSubscriberNotes = (Array.isArray(subscriber.notes) ? subscriber.notes : []).filter((n: SubscriberNote) => n.id !== noteId); 
      const updatedFormDataNotes = (Array.isArray(formData.notes) ? formData.notes : []).filter((n: SubscriberNote) => n.id !== noteId);

      onUpdate({ ...subscriber, notes: updatedSubscriberNotes }); // Update parent state
      setFormData(prev => ({ ...prev, notes: updatedFormDataNotes })); // Update local state
  };

  // --- Automation Check Logic ---
  const findTriggeringFlows = (type: 'tag' | 'list', targetId: string) => {
      return allFlows.filter(flow => {
          if (flow.status !== 'active') return false;
          const trigger = flow.steps.find(s => s.type === 'trigger');
          if (!trigger) return false;

          if (type === 'tag') {
              return trigger.config.type === 'tag' && trigger.config.targetId === targetId;
          }
          if (type === 'list') {
              // List trigger is typically type='segment' subtype='list' or dedicated list type
              return trigger.config.type === 'segment' && 
                     trigger.config.targetSubtype === 'list' && 
                     trigger.config.targetId === targetId;
          }
          return false;
      });
  };

  const handleAddTag = (tag: string) => {
    if (!tag) return;
    
    // Check if adding this tag triggers any active flows
    const triggeredFlows = findTriggeringFlows('tag', tag);

    const executeAdd = () => {
        // FIX: Ensure formData.tags is an array
        const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
        if (!currentTags.includes(tag)) {
            setFormData({ ...formData, tags: [...currentTags, tag] });
        }
        setTagPickerValue('');
    };

    if (triggeredFlows.length > 0) {
        setTriggerWarning({
            isOpen: true,
            triggeredFlows,
            actionName: `Gắn nhãn "${tag}"`,
            onConfirm: executeAdd
        });
    } else {
        executeAdd();
    }
  };

  const handleLocalAddList = (listId: string) => {
      if (!listId) return;

      const triggeredFlows = findTriggeringFlows('list', listId);
      const listName = allLists.find(l => l.id === listId)?.name || 'Danh sách';

      const executeAdd = () => {
          // FIX: Ensure formData.listIds is an array
          const currentListIds = Array.isArray(formData.listIds) ? formData.listIds : [];
          if (!currentListIds.includes(listId)) {
              setFormData({ ...formData, listIds: [...currentListIds, listId] });
          }
      };

      if (triggeredFlows.length > 0) {
          setTriggerWarning({
              isOpen: true,
              triggeredFlows,
              actionName: `Thêm vào "${listName}"`,
              onConfirm: executeAdd
          });
      } else {
          executeAdd();
      }
  };

  const handleLocalRemoveList = (listId: string) => {
      // FIX: Ensure formData.listIds is an array
      setFormData({ ...formData, listIds: (Array.isArray(formData.listIds) ? formData.listIds : []).filter((id: string) => id !== listId) });
  };

  return (
    <>
        <Modal
        isOpen={!!subscriber} onClose={onClose} title="Hồ sơ chi tiết" size="lg"
        footer={
            <div className="flex justify-between w-full items-center">
                <Button variant="danger" icon={Trash2} onClick={() => setConfirmConfig({ isOpen: true, title: "Xóa hồ sơ?", message: "Hành động này không thể hoàn tác.", variant: 'danger', onConfirm: () => { onDelete(subscriber.id); onClose(); }})} className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none px-4">Xóa</Button>
                <div className="flex gap-3">
                    {isEditing ? (
                        <><Button variant="ghost" onClick={resetState}>Hủy</Button><Button icon={Save} onClick={handleSave}>Lưu cập nhật</Button></>
                    ) : ( <Button variant="secondary" onClick={onClose}>Đóng</Button> )}
                </div>
            </div>
        }
        >
            <div className="flex flex-col">
                {/* Header Summary */}
                <div className="flex items-center gap-5 mb-8 px-1 shrink-0">
                    <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#ffa900] to-[#ca7900] flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-orange-500/20 shrink-0">
                        {(formData.firstName || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-800 truncate tracking-tight">{formData.firstName || 'Chưa đặt tên'}</h2>
                            <Badge variant={formData.status === 'active' ? 'success' : 'danger'} className="text-[9px] px-2 py-0.5">{formData.status === 'active' ? 'Hoạt động' : 'Đã Unsub'}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-slate-500 font-bold text-xs tracking-tight">
                            <span className="flex items-center gap-1.5 text-blue-600 lowercase"><Mail className="w-3.5 h-3.5" />{formData.email}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-slate-400">Tham gia: {formatRelativeTime(formData.joinedAt)}</span>
                        </div>
                    </div>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-black border border-slate-200 transition-all flex items-center gap-2 hover:shadow-sm"><Edit3 className="w-3.5 h-3.5" /> Sửa hồ sơ</button>}
                </div>

                <div className="shrink-0 mb-4">
                    <Tabs activeId={activeTab} onChange={setActiveTab} items={[
                        { id: 'info', label: 'Cá nhân', icon: User },
                        { id: 'automation', label: 'Tương tác', icon: Activity, count: memberInsights.segments.length + (Array.isArray(formData.listIds) ? formData.listIds.length : 0) },
                        { id: 'activity', label: 'Hành trình', icon: History },
                        { id: 'notes', label: 'Ghi chú', icon: FileText, count: (Array.isArray(formData.notes) ? formData.notes.length : 0) },
                    ]} />
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="mt-2">
                    <div key={activeTab} className="animate-in fade-in slide-in-from-right-2 duration-300 pb-10">
                        
                        {activeTab === 'info' && (
                            <div className="space-y-10">
                                {/* Nhóm 1: Định danh */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-4 h-px bg-slate-200"></div> Thông tin định danh
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                                        <div className="col-span-1 md:col-span-2">
                                            <Input label="Họ và tên" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} disabled={!isEditing} placeholder="Nhập đầy đủ họ tên..." required />
                                        </div>
                                        <Select 
                                            label="Giới tính" 
                                            options={[{value:'male', label:'Nam'}, {value:'female', label:'Nữ'}, {value:'other', label:'Khác'}]} 
                                            value={formData.gender || ''} 
                                            onChange={(v) => setFormData({...formData, gender: v})} 
                                            disabled={!isEditing} 
                                            variant="outline"
                                        />
                                        <Input label="Điện thoại" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} disabled={!isEditing} icon={Phone} />
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 text-slate-400">Ngày sinh</label>
                                            <input type="date" value={formData.dateOfBirth || ''} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} disabled={!isEditing} className="w-full h-[42px] bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold focus:border-[#ffa900] outline-none disabled:bg-slate-50 transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 text-slate-400">Ngày đặc biệt</label>
                                            <input type="date" value={formData.anniversaryDate || ''} onChange={(e) => setFormData({...formData, anniversaryDate: e.target.value})} disabled={!isEditing} className="w-full h-[42px] bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold focus:border-[#ffa900] outline-none disabled:bg-slate-50 transition-all" />
                                        </div>
                                        {/* NEW: Source Field */}
                                        <Input 
                                            label="Nguồn gốc (Source)" 
                                            value={formData.source || ''} 
                                            onChange={(e) => setFormData({...formData, source: e.target.value})} 
                                            disabled={!isEditing} 
                                            icon={Globe} 
                                            placeholder="VD: Web Form, Import CSV..."
                                        />
                                    </div>
                                </section>

                                {/* Nhóm 2: Công việc */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-4 h-px bg-slate-200"></div> Công việc & Công ty
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                                        <Input label="Chức danh" value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} disabled={!isEditing} icon={Briefcase} />
                                        <Input label="Tên Công ty" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} disabled={!isEditing} icon={Building} />
                                    </div>
                                </section>

                                {/* Nhóm 3: Địa lý */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-4 h-px bg-slate-200"></div> Địa lý
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                                        <Input label="Quốc gia" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} disabled={!isEditing} icon={MapPin} />
                                        <Input label="Thành phố" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!isEditing} icon={MapPin} />
                                    </div>
                                </section>

                                {/* Nhóm 4: Tags */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-4 h-px bg-slate-200"></div> Nhãn phân loại (Tags)
                                    </h4>
                                    <div className="p-6 bg-slate-50/50 rounded-[28px] border border-slate-200 border-dashed">
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {(Array.isArray(formData.tags) ? formData.tags : []).map((tag: string) => (
                                                <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 shadow-sm uppercase tracking-tight group/tag transition-all hover:border-orange-200 hover:bg-orange-50/30">
                                                    <Tag className="w-3 h-3 text-[#ca7900]" /> {tag}
                                                    {isEditing && <button onClick={() => setFormData({...formData, tags: (Array.isArray(formData.tags) ? formData.tags : []).filter((t:string) => t !== tag)})} className="text-slate-300 hover:text-rose-500 transition-colors ml-1"><X className="w-3 h-3" /></button>}
                                                </span>
                                            ))}
                                            {(!Array.isArray(formData.tags) || formData.tags.length === 0) && <p className="text-xs text-slate-400 font-bold italic">Chưa gắn nhãn.</p>}
                                        </div>
                                        {isEditing && (
                                            <div className="max-w-xs">
                                                <Select placeholder="Thêm nhãn mới..." options={allTags.filter(t => !(Array.isArray(formData.tags) ? formData.tags : []).includes(t)).map(t => ({value:t, label:t}))} value={tagPickerValue} onChange={handleAddTag} variant="outline" direction="top" />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'automation' && (
                            <div className="space-y-10">
                                {/* Lists Section */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <List className="w-3.5 h-3.5" /> Danh sách tham gia
                                    </h4>
                                    <div className="space-y-3">
                                        {(Array.isArray(formData.listIds) ? formData.listIds : []).map((lId: string) => {
                                            const list = allLists.find(x => x.id === lId);
                                            return list && (
                                                <div key={lId} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100"><List className="w-5 h-5" /></div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{list.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Static List</p>
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <button 
                                                            onClick={() => handleLocalRemoveList(lId)} 
                                                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Gỡ khỏi danh sách (Cần lưu để áp dụng)"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(!Array.isArray(formData.listIds) || formData.listIds.length === 0) && (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-xs font-bold uppercase tracking-widest">Trống</div>
                                        )}
                                        
                                        {/* Chỉ hiện nút Ghi danh khi đang Edit */}
                                        {isEditing && (
                                            <div className="pt-2 mt-4 animate-in fade-in slide-in-from-bottom-1 w-full">
                                                <div className="w-full">
                                                    <Select 
                                                        placeholder="Ghi danh vào danh sách..." 
                                                        options={allLists.filter(l => !(Array.isArray(formData.listIds) ? formData.listIds : []).includes(l.id)).map(l => ({value:l.id, label:l.name}))} 
                                                        value="" 
                                                        onChange={handleLocalAddList} 
                                                        variant="ghost" 
                                                        icon={UserPlus}
                                                        className="border-2 border-dashed border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-blue-400 transition-all py-1 w-full" 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Segments Section */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5" /> Phân khúc đang khớp
                                    </h4>
                                    <div className="space-y-2">
                                        {memberInsights.segments.length > 0 ? memberInsights.segments.map(seg => (
                                            <div key={seg.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <Layers className="w-5 h-5 text-[#ca7900]" />
                                                    <span className="text-sm font-bold text-slate-800">{seg.name}</span>
                                                </div>
                                                <Badge variant="brand" className="text-[8px] uppercase tracking-tighter">Auto-Matched</Badge>
                                            </div>
                                        )) : <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 font-bold uppercase tracking-widest">Không khớp phân khúc nào</p>}
                                    </div>
                                </section>
                                
                                {/* Flows Section */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <GitMerge className="w-3.5 h-3.5" /> Automation đang chạy
                                    </h4>
                                    <div className="space-y-3">
                                        {memberInsights.flows.map(flow => (
                                            <div key={flow.id} className="p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between shadow-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><Zap className="w-5 h-5 text-[#ffa900] fill-[#ffa900]" /></div>
                                                    <div>
                                                        <span className="text-sm font-bold">{flow.name}</span>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Active Journey</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Progress</span>
                                                </div>
                                            </div>
                                        ))}
                                        {memberInsights.flows.length === 0 && <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 font-bold uppercase tracking-widest">Chưa tham gia quy trình nào</p>}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="relative pl-12 space-y-12 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                {activities.map((act, i) => (
                                    <div key={i} className="relative animate-in slide-in-from-left-2" style={{ animationDelay: `${i*50}ms` }}>
                                        <div className={`absolute -left-12 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 ${act.color}`}>
                                            <act.icon className="w-4 h-4" />
                                        </div>
                                        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className="text-sm font-black text-slate-800">{act.label}</h5>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">{formatRelativeTime(act.date)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{act.detail}</p>
                                        </div>
                                    </div>
                                ))}
                                {activities.length === 0 && <div className="text-center py-20 opacity-40"><Activity className="w-12 h-12 mx-auto mb-4" /><p className="text-sm font-bold uppercase tracking-widest">Chưa ghi nhận tương tác</p></div>}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-8">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1">Nhật ký tư vấn / Ghi chú</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-50/5 focus:border-[#ffa900] focus:bg-white transition-all min-h-[140px] shadow-inner" 
                                        placeholder="Nhập ghi chú cho khách hàng này..." 
                                        value={newNote} 
                                        onChange={(e) => setNewNote(e.target.value)} 
                                        // Removed disabled={!isEditing}
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button 
                                            onClick={handleAddNote} 
                                            disabled={!newNote.trim()} 
                                            icon={Plus}
                                            // Removed disabled={!isEditing}
                                        >
                                            Lưu ghi chú
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {(Array.isArray(subscriber.notes) ? subscriber.notes : []).map((n: SubscriberNote) => (
                                        <div key={n.id} className="bg-white p-5 rounded-[24px] border-l-4 border-l-orange-400 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                                            <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap leading-relaxed">{n.content}</p>
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                                <Badge variant="neutral" className="text-[8px] font-black">{n.createdBy}</Badge>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{formatRelativeTime(n.createdAt)}</span>
                                                    <button 
                                                        onClick={() => handleDeleteNote(n.id)} 
                                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                                                        title="Xóa ghi chú"
                                                        // Removed disabled={!isEditing}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!Array.isArray(subscriber.notes) || subscriber.notes.length === 0) && (
                                        <div className="text-center py-8 opacity-40">
                                            <FileText className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Chưa có ghi chú nào</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
        
        {/* AUTOMATION TRIGGER WARNING MODAL */}
        <ConfirmationModal 
            isOpen={triggerWarning.isOpen}
            onClose={() => setTriggerWarning({ ...triggerWarning, isOpen: false })}
            onConfirm={triggerWarning.onConfirm}
            variant="warning"
            title="Xác nhận Kích hoạt Flow"
            message={
                <div className="text-left space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-900 mb-1">Hành động {triggerWarning.actionName} sẽ kích hoạt tự động:</p>
                            <ul className="text-[11px] list-disc pl-4 text-amber-800 space-y-1">
                                {triggerWarning.triggeredFlows.map(f => (
                                    <li key={f.id}>Automation: <b>{f.name}</b></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Bạn có chắc chắn muốn thực hiện hành động này và để các quy trình trên chạy cho khách hàng này không?</p>
                </div>
            }
            confirmLabel="Xác nhận & Kích hoạt"
        />

        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
        <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig({...confirmConfig, isOpen: false})} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} variant={confirmConfig.variant} />
    </>
  );
};

export default CustomerProfileModal;