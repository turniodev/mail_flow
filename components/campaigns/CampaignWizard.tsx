import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings2, Mail, Users, BellRing, CheckCircle2, Wand2, Check, X, 
    ShieldCheck, Code, FileCode, Eye, Save, ChevronRight, ChevronLeft, Calendar, Send, GitMerge, Layout, Braces, ChevronDown
} from 'lucide-react';
import { Campaign, CampaignStatus, Template, Segment, Flow, Subscriber } from '../../types'; // Fix: Import Subscriber
import { api } from '../../services/storageAdapter'; // Fix: Import api
import Button from '../common/Button';
import Input from '../common/Input';
import TemplateSelector from '../flows/TemplateSelector';
import AudienceSelector from './AudienceSelector';
import ReminderManager from './ReminderManager';
import LaunchPreview from './LaunchPreview';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Campaign>;
  allLists: any[];
  allSegments: Segment[];
  allTags: any[];
  allTemplates: Template[];
  allFlows: Flow[];
  senderEmails: string[];
  onSaveDraft: (data: Partial<Campaign>) => Promise<void>;
  onPublish: (data: Partial<Campaign>, options: { connectFlow: boolean, activateFlowId: string | null }) => Promise<void>;
}

const MERGE_TAGS = [
    { label: 'Họ tên', value: '{{full_name}}' },
    { label: 'Tên (First Name)', value: '{{first_name}}' },
    { label: 'Họ (Last Name)', value: '{{last_name}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Công ty', value: '{{company}}' },
    { label: 'Chức danh', value: '{{job_title}}' },
    { label: 'Số điện thoại', value: '{{phone}}' },
    { label: 'Link Hủy đăng ký', value: '{{unsubscribe_url}}' },
];

const CampaignWizard: React.FC<CampaignWizardProps> = ({ 
    isOpen, onClose, initialData, 
    allLists, allSegments, allTags, allTemplates, allFlows, senderEmails,
    onSaveDraft, onPublish
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Campaign>>({
      name: '', subject: '', senderEmail: '', templateId: '',
      target: { listIds: [], segmentIds: [], tagIds: [], individualIds: [] },
      reminders: [], trackingEnabled: true, status: CampaignStatus.DRAFT,
      contentBody: '',
      attachments: []
  });
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [isHtmlPreview, setIsHtmlPreview] = useState(false);
  const [connectFlow, setConnectFlow] = useState(false);
  const [activateFlowId, setActivateFlowId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Fix: Add state for all subscribers to create the existingEmailsSet
  const [allSubscribers, setAllSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
      if (isOpen) {
          if (initialData) {
              // FIX: Ensure initialData.target?.tagIds is an array
              const initialTagIds = Array.isArray(initialData.target?.tagIds) ? initialData.target.tagIds : [];

              setFormData({ 
                  ...initialData,
                  target: {
                      listIds: initialData.target?.listIds || [],
                      segmentIds: initialData.target?.segmentIds || [],
                      tagIds: initialTagIds, // Use the safely checked array
                      individualIds: initialData.target?.individualIds || []
                  },
                  reminders: initialData.reminders || [],
                  attachments: initialData.attachments || []
              });
          } else {
              setFormData({
                  name: '', subject: '', senderEmail: senderEmails[0] || '', templateId: '',
                  target: { listIds: [], segmentIds: [], tagIds: [], individualIds: [] }, // Initialize tagIds as empty array
                  reminders: [], trackingEnabled: true, status: CampaignStatus.DRAFT,
                  contentBody: '',
                  attachments: []
              });
          }
          setStep(1);
          setAttemptedNext(false);
          setConnectFlow(false);
          setActivateFlowId(null);
          // Fix: Fetch all subscribers when the wizard opens
          const fetchSubscribers = async () => {
            const res = await api.get<Subscriber[]>('subscribers');
            if (res.success) {
                setAllSubscribers(res.data);
            }
          };
          fetchSubscribers();
      }
  }, [isOpen, initialData, senderEmails]);

  const isStepValid = (currentStep: number) => {
    switch(currentStep) {
      case 1: return !!formData.name?.trim() && !!formData.senderEmail;
      case 2: return !!formData.subject?.trim() && (!!formData.templateId || !!formData.contentBody?.trim());
      case 3: 
        // FIX: Ensure formData.target?.tagIds is an array before checking length
        return (formData.target?.listIds.length || 0) + (formData.target?.segmentIds.length || 0) + (Array.isArray(formData.target?.tagIds) ? formData.target.tagIds.length : 0) > 0;
      default: return true;
    }
  };

  const handleStepClick = (stepId: number) => {
      if (stepId < step) setStep(stepId);
      else if (stepId === step + 1 && isStepValid(step)) setStep(stepId);
  };

  const handleNext = () => {
    setAttemptedNext(true);
    if (isStepValid(step)) {
        setStep(step + 1);
        setAttemptedNext(false);
    }
  };

  // Fix: Modified handleQuickImport to match the new onImport signature
  const handleQuickImport = async (data: { 
      subscribers: any[], 
      targetListId: string | null, 
      newListName: string | null,
      duplicates: number
  }) => {
      const { subscribers: newSubs, targetListId, newListName } = data;
      let finalListId = targetListId;
      
      // Tạo danh sách mới nếu cần
      if (newListName) {
          const lRes = await api.post<any>('lists', { 
              name: newListName, 
              count: 0, 
              source: 'Quick Import', 
              created: new Date().toLocaleDateString('vi-VN') 
          });
          if (lRes.success) finalListId = lRes.data.id;
      }

      if (newSubs.length > 0 && finalListId) {
          const subsPayload = newSubs.map(s => ({
              ...s,
              listIds: [finalListId],
              tags: s.tags ? s.tags.split(',').map((t: string) => t.trim()) : ['Quick Import'], // Ensure tags are handled
              joinedAt: new Date().toISOString(),
              status: 'active',
              stats: { emailsSent:0, emailsOpened:0, linksClicked:0 },
              customAttributes: {}
          }));
          
          await api.post('subscribers_bulk', subsPayload);
          
          // Tự động chọn danh sách vừa tạo/import vào target của campaign
          // FIX: Ensure formData.target.tagIds is an array
          const currentTagIds = Array.isArray(formData.target?.tagIds) ? formData.target!.tagIds : [];
          const newTarget = { ...formData.target!, listIds: Array.from(new Set([...(formData.target?.listIds || []), finalListId])), tagIds: currentTagIds };
          setFormData({ ...formData, target: newTarget });
          
          // Refresh all subscribers state to update existingEmailsSet
          const res = await api.get<Subscriber[]>('subscribers');
          if (res.success) {
              setAllSubscribers(res.data);
          }
      }
  };

  const handlePublishClick = async () => {
      setIsSubmitting(true);
      await onPublish(formData, { connectFlow, activateFlowId });
      setIsSubmitting(false);
  };

  const insertVariable = (tag: string) => {
      if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart;
          const end = textAreaRef.current.selectionEnd;
          const text = formData.contentBody || '';
          const newText = text.substring(0, start) + tag + text.substring(end);
          setFormData({ ...formData, contentBody: newText });
          setShowVarDropdown(false);
      }
  };

  const steps = [
    { id: 1, name: 'Cài đặt', icon: Settings2 },
    { id: 2, name: 'Nội dung', icon: Mail },
    { id: 3, name: 'Đối tượng', icon: Users },
    { id: 4, name: 'Nhắc nhở', icon: BellRing },
    { id: 5, name: 'Preview', icon: CheckCircle2 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end transition-opacity duration-300">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose}></div>
        <div className="relative w-full max-w-6xl bg-[#fdfdfd] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 cubic-bezier(0.16, 1, 0.3, 1) border-l border-slate-100">
            <div className="px-8 py-5 bg-white flex justify-between items-center shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md text-white"><Wand2 className="w-5 h-5" /></div>
                    <div><h3 className="text-lg font-bold text-slate-800">Chiến dịch mới</h3><p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Bước {step} / 5</p></div>
                </div>
                <div className="flex items-center gap-2">
                    {steps.map(s => {
                        const active = step === s.id;
                        const done = step > s.id;
                        return (
                            <div key={s.id} onClick={() => handleStepClick(s.id)} className={`flex items-center group ${done || active ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#ffa900] shadow-lg scale-110' : (done ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                                    {done ? <Check className="w-4 h-4 text-white" /> : <s.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />}
                                </div>
                                {s.id < steps.length && <div className={`w-6 h-0.5 mx-2 transition-all ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-800"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#f8fafc]">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400 max-w-3xl mx-auto">
                        <div className="text-center mb-6"><h4 className="text-2xl font-bold text-slate-800 tracking-tight">Cấu hình định danh</h4><p className="text-slate-500 text-sm mt-1">Thông tin cơ bản để nhận diện chiến dịch này.</p></div>
                        <div className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm space-y-6">
                            <Input label="Tên chiến dịch (Nội bộ)" required placeholder="VD: Khuyến mãi Black Friday 2024" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} error={attemptedNext && !formData.name?.trim() ? 'Vui lòng nhập tên' : ''} />
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Người gửi (Sender) <span className="text-rose-500">*</span></label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {senderEmails.map(email => (
                                        <button key={email} onClick={() => setFormData({...formData, senderEmail: email})} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${formData.senderEmail === email ? 'border-[#ffa900] bg-orange-50 shadow-md ring-1 ring-orange-200' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                            <div className="flex items-center gap-3 overflow-hidden"><ShieldCheck className={`w-4 h-4 ${formData.senderEmail === email ? 'text-[#ca7900]' : 'text-slate-400'}`} /><span className={`text-xs font-bold truncate ${formData.senderEmail === email ? 'text-slate-900' : 'text-slate-600'}`}>{email}</span></div>
                                            {formData.senderEmail === email && <div className="w-5 h-5 bg-[#ffa900] rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400 max-w-5xl mx-auto">
                        <div className="text-center"><h4 className="text-2xl font-bold text-slate-800 tracking-tight">Nội dung Email</h4></div>
                        
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-6">
                                <Input label="Tiêu đề hiển thị (Subject)" required placeholder="Món quà đặc biệt dành riêng cho bạn! 🎁" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} error={attemptedNext && !formData.subject?.trim() ? 'Vui lòng nhập tiêu đề' : ''} />
                                
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-widest">Loại nội dung</label>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setFormData({...formData, templateId: ''})} className={`flex-1 py-4 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${!formData.templateId && formData.templateId !== 'custom-html' ? 'border-[#ffa900] bg-orange-50 text-[#ca7900] shadow-sm' : 'border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                                            <div className="p-2 bg-white rounded-full"><Eye className="w-5 h-5" /></div>
                                            <span className="text-xs font-bold uppercase">Chọn mẫu (Visual)</span>
                                        </button>
                                        <button onClick={() => setFormData({...formData, templateId: 'custom-html'})} className={`flex-1 py-4 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${formData.templateId === 'custom-html' ? 'border-[#ffa900] bg-orange-50 text-[#ca7900] shadow-sm' : 'border-slate-100 hover:border-slate-300 text-slate-500'}`}>
                                            <div className="p-2 bg-white rounded-full"><Code className="w-5 h-5" /></div>
                                            <span className="text-xs font-bold uppercase">Mã HTML (Raw)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                {formData.templateId === 'custom-html' ? (
                                    <div className="bg-slate-900 rounded-[24px] p-6 shadow-2xl border-b-8 border-slate-800 relative overflow-visible flex flex-col h-[600px]">
                                        <div className="flex items-center justify-between mb-4 relative z-20 shrink-0">
                                            <div className="flex items-center gap-3"><FileCode className="w-5 h-5 text-indigo-400" /><h6 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">HTML Editor Pro</h6></div>
                                            <div className="flex gap-2">
                                                <div className="relative">
                                                    <button onClick={() => setShowVarDropdown(!showVarDropdown)} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-white/5"><Braces className="w-3.5 h-3.5 text-[#ffa900]" />Biến động <ChevronDown className="w-3 h-3 opacity-50" /></button>
                                                    {showVarDropdown && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setShowVarDropdown(false)}></div>
                                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-40 animate-in fade-in zoom-in-95">
                                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click để chèn</p></div>
                                                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                                    {MERGE_TAGS.map((tag) => (
                                                                        <button key={tag.value} onClick={() => insertVariable(tag.value)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors rounded-xl"><span className="text-xs font-bold text-slate-700">{tag.label}</span><code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono group-hover:text-[#ca7900] group-hover:bg-orange-50">{tag.value}</code></button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <button onClick={() => setIsHtmlPreview(!isHtmlPreview)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2">{isHtmlPreview ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{isHtmlPreview ? 'Sửa Code' : 'Xem trước'}</button>
                                            </div>
                                        </div>
                                        {isHtmlPreview ? <div className="flex-1 w-full bg-white rounded-2xl overflow-hidden shadow-inner relative z-10"><iframe className="w-full h-full" srcDoc={formData.contentBody} title="Preview" /></div> : <textarea ref={textAreaRef} value={formData.contentBody} onChange={e => setFormData({...formData, contentBody: e.target.value})} className="flex-1 w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-indigo-300 font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none shadow-inner custom-scrollbar relative z-10" placeholder="<html><body><h1>Nhập mã HTML tại đây...</h1></body></html>" spellCheck={false} />}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <TemplateSelector templates={allTemplates} selectedId={formData.templateId} onSelect={t => setFormData({...formData, templateId: t.id})} />
                                        <div className={`rounded-[24px] border shadow-md flex flex-col items-center justify-center text-center p-0 relative overflow-hidden transition-all h-[500px] bg-white ${attemptedNext && !formData.templateId ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}>
                                            {formData.templateId ? <div className="w-full h-full relative group"><img src={allTemplates.find(t=>t.id===formData.templateId)?.thumbnail} className="w-full h-full object-cover object-top" /><div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><span className="px-4 py-2 bg-white rounded-full text-xs font-bold shadow-lg text-slate-800">Đã chọn mẫu này</span></div></div> : <div className="opacity-40 p-10"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Layout className="w-8 h-8 text-slate-400" /></div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vui lòng chọn mẫu bên trên</p></div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400 max-w-4xl mx-auto">
                        <div className="text-center mb-6"><h4 className="text-2xl font-bold text-slate-800 tracking-tight">Đối tượng mục tiêu</h4></div>
                        <AudienceSelector 
                          allLists={allLists} 
                          allSegments={allSegments} 
                          allTags={allTags}
                          selectedTarget={formData.target as any} 
                          onTargetChange={t => setFormData({...formData, target: { ...formData.target!, ...t }})} 
                          // Fix: Pass existingEmails and onImport
                          existingEmails={new Set(allSubscribers.map(s => s.email))}
                          onImport={handleQuickImport} // This is the new handleQuickImport which uses onImport's signature
                          error={attemptedNext && ((formData.target?.listIds.length || 0) + (formData.target?.segmentIds.length || 0) + (Array.isArray(formData.target?.tagIds) ? formData.target.tagIds.length : 0)) === 0} 
                        />
                    </div>
                )}
                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400 max-w-4xl mx-auto">
                        <div className="text-center mb-6"><h4 className="text-2xl font-bold text-slate-800 tracking-tight">Kịch bản Nhắc nhở</h4></div>
                        <ReminderManager reminders={formData.reminders || []} templates={allTemplates} onChange={r => setFormData({...formData, reminders: r})} mainSubject={formData.subject || ''} />
                    </div>
                )}
                {step === 5 && (
                    <LaunchPreview 
                    formData={formData} 
                    allLists={allLists} 
                    allSegments={allSegments} 
                    allTags={allTags}
                    allTemplates={allTemplates}
                    allFlows={allFlows} 
                    onTestEmail={async () => {}} 
                    onConnectFlow={(connected) => setConnectFlow(connected)} 
                    onScheduleChange={(date) => setFormData({...formData, scheduledAt: date || undefined})}
                    onActivateFlow={(flowId, activate) => setActivateFlowId(activate ? flowId : null)}
                    onAttachmentsChange={(att) => setFormData({ ...formData, attachments: att })}
                    />
                )}
            </div>
            
            <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 z-20">
                <div><Button variant="ghost" onClick={() => step === 1 ? onClose() : setStep(step - 1)} className="px-6 h-11 rounded-xl text-[11px] font-bold uppercase flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Hủy bỏ' : 'Quay lại'}</Button></div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => { onSaveDraft(formData); onClose(); }} icon={Save} className="px-6 h-11 rounded-xl text-[11px] font-bold uppercase hidden sm:flex">Lưu nháp</Button>
                    {step < 5 ? <Button onClick={handleNext} className="px-10 h-11 rounded-xl shadow-lg transition-all bg-slate-900 text-white hover:bg-black uppercase text-[11px] tracking-widest font-bold flex items-center gap-2">Tiếp tục <ChevronRight className="w-4 h-4" /></Button> : <Button isLoading={isSubmitting} onClick={handlePublishClick} icon={connectFlow ? GitMerge : (formData.scheduledAt ? Calendar : Send)} size="lg" className="px-12 h-12 rounded-2xl shadow-xl shadow-orange-500/30 text-xs font-bold uppercase tracking-wider">{connectFlow ? 'Save & Build Flow' : (formData.scheduledAt ? 'Lên lịch gửi' : 'Gửi ngay')}</Button>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CampaignWizard;