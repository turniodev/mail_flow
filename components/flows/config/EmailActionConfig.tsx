
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Layout, Mail, Info, User, ShieldCheck, Zap, FileText, Code, Check, Braces, ChevronDown } from 'lucide-react';
import { api } from '../../../services/storageAdapter';
import { Template } from '../../../types';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Select from '../../common/Select';
import TemplateSelector from '../TemplateSelector';
import EmailPreviewDrawer from './EmailPreviewDrawer';

interface EmailActionConfigProps {
  config: Record<string, any>;
  onChange: (newConfig: Record<string, any>) => void;
  disabled?: boolean;
}

const MERGE_TAGS = [
    { label: 'Họ tên', value: '{{full_name}}' },
    { label: 'Tên', value: '{{first_name}}' },
    { label: 'Họ', value: '{{last_name}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Công ty', value: '{{company}}' },
    { label: 'Chức danh', value: '{{job_title}}' },
    { label: 'Số điện thoại', value: '{{phone}}' },
    { label: 'Hủy đăng ký (Bắt buộc)', value: '{{unsubscribe_url}}' },
];

const EmailActionConfig: React.FC<EmailActionConfigProps> = ({ config, onChange, disabled }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [verifiedEmails, setVerifiedEmails] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [previewData, setPreviewData] = useState<{ template: Template | null, html?: string } | null>(null);
  const [showPersonalization, setShowPersonalization] = useState<{ target: 'subject' | 'body' | null }>({ target: null });
  
  // HTML Mode State
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 'template' or 'html'
  const sourceMode = config.sourceMode || (config.templateId ? 'template' : 'html');

  useEffect(() => {
    api.get<Template[]>('templates').then(res => res.success && setTemplates(res.data));
    const savedEmails = JSON.parse(localStorage.getItem('mailflow_verified_emails') || '["support@mailflow.pro"]');
    setVerifiedEmails(savedEmails.map((e: string) => ({ value: e, label: e })));
  }, []);

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  const injectTag = (tag: string, target?: 'subject' | 'body') => {
    if (disabled) return;
    
    // Determine target based on context
    if (target) {
        const targetKey = target === 'subject' ? 'subject' : 'contentBody';
        const current = config[targetKey] || '';
        onChange({ ...config, [targetKey]: current + ' ' + tag });
        setShowPersonalization({ target: null });
        return;
    }

    // Default to customHtml if in HTML mode and no specific target
    if (sourceMode === 'html') {
        const textarea = textAreaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const current = config.customHtml || '';
            const newText = current.substring(0, start) + tag + current.substring(end);
            onChange({ ...config, customHtml: newText });
            setShowVarDropdown(false);
        } else {
            const current = config.customHtml || '';
            onChange({ ...config, customHtml: current + tag });
        }
    }
  };

  const handleModeChange = (mode: 'template' | 'html') => {
      onChange({ ...config, sourceMode: mode });
  };

  return (
    <div className="space-y-6">
      {/* 1. SENDER & SUBJECT */}
      <div className="space-y-4">
        <div className="relative">
          <Input 
            label="Tiêu đề Email (Subject)" 
            placeholder="VD: 🎁 Quà tặng cho {{first_name}}..."
            value={config.subject || ''}
            onChange={(e) => onChange({ ...config, subject: e.target.value })}
            error={!config.subject ? "Tiêu đề không được để trống" : ""}
            disabled={disabled}
          />
          <button 
            onClick={() => setShowPersonalization({ target: showPersonalization.target === 'subject' ? null : 'subject' })}
            className={`absolute right-4 top-10 p-1.5 transition-colors ${showPersonalization.target === 'subject' ? 'text-[#ca7900]' : 'text-slate-400 hover:text-[#ca7900]'}`}
            title="Cá nhân hóa tiêu đề"
            disabled={disabled}
          >
            <User className="w-4 h-4" />
          </button>
          
          {showPersonalization.target === 'subject' && (
            <div className="absolute right-0 top-20 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in zoom-in-95">
              <p className="text-[9px] font-black uppercase text-slate-400 p-2 tracking-widest">Cá nhân hóa tiêu đề</p>
              <div className="grid grid-cols-1 gap-1">
                {MERGE_TAGS.map(tag => (
                    <button 
                    key={tag.value} 
                    onClick={() => injectTag(tag.value, 'subject')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-xs font-bold text-slate-700 transition-colors flex justify-between items-center"
                    >
                    {tag.label} <code className="text-[9px] text-orange-500 font-mono">{tag.value}</code>
                    </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Chọn Email gửi đi</label>
            <div className="grid grid-cols-1 gap-2">
                {verifiedEmails.length > 0 ? verifiedEmails.map((email) => (
                    <button 
                        key={email.value}
                        onClick={() => { if (!disabled) onChange({ ...config, senderEmail: email.value }); }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${config.senderEmail === email.value ? 'border-[#ffa900] bg-orange-50/50 ring-4 ring-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${config.senderEmail === email.value ? 'bg-[#ffa900] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">{email.label}</p>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Đã xác minh</p>
                            </div>
                        </div>
                        {config.senderEmail === email.value && <Zap className="w-4 h-4 text-[#ffa900] fill-[#ffa900]" />}
                    </button>
                )) : (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                        <Info className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold">Chưa có email xác minh. Hãy vào Cài đặt để thêm.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. CONTENT SOURCE SELECTOR */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Nội dung Email</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => handleModeChange('template')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sourceMode === 'template' ? 'bg-white text-[#ca7900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                disabled={disabled}
             >
                 <Layout className="w-3.5 h-3.5" /> Chọn Mẫu (Visual)
             </button>
             <button 
                onClick={() => handleModeChange('html')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${sourceMode === 'html' ? 'bg-white text-[#ca7900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                disabled={disabled}
             >
                 <Code className="w-3.5 h-3.5" /> HTML Code
             </button>
          </div>

          {/* MODE: TEMPLATE */}
          {sourceMode === 'template' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {selectedTemplate ? (
                  <div className="group relative rounded-[24px] border border-slate-200 hover:border-[#ffa900] transition-all overflow-hidden bg-white shadow-sm hover:shadow-lg">
                    <div className="aspect-[21/9] bg-slate-50 relative overflow-hidden">
                       <img src={selectedTemplate.thumbnail} className="w-full h-full object-cover transition-all duration-500 opacity-80 group-hover:opacity-100" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div>
                            <h4 className="font-bold text-white text-sm">{selectedTemplate.name}</h4>
                            <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest">{selectedTemplate.category}</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => setShowPicker(true)} className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-[#ca7900] transition-all">Đổi mẫu</button>
                              <button onClick={() => setPreviewData({ template: selectedTemplate })} className="px-3 py-1.5 bg-[#ffa900] text-white rounded-lg text-[10px] font-bold uppercase hover:bg-[#ca7900] transition-all flex items-center gap-1"><Eye className="w-3 h-3" /> Xem</button>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowPicker(true)} 
                    className={`w-full py-12 border-2 border-dashed border-slate-200 rounded-[28px] bg-slate-50/50 text-slate-400 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-[#ffa900] hover:text-[#ca7900] transition-all group shadow-inner ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={disabled}
                  >
                     <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Layout className="w-6 h-6" /></div>
                     <span className="text-xs font-bold uppercase tracking-wider">Chọn mẫu từ thư viện</span>
                  </button>
                )}

                {/* Optional Override for Template Mode */}
                <div className="relative space-y-2 pt-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Ghi đè nội dung (Optional)</label>
                    <div className="relative group">
                        <textarea 
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#ffa900] focus:ring-4 focus:ring-orange-50/5 transition-all min-h-[100px] leading-relaxed"
                            placeholder="Chào {{first_name}}, ghi chú thêm vào template..."
                            value={config.contentBody || ''}
                            onChange={(e) => onChange({ ...config, contentBody: e.target.value })}
                            disabled={disabled}
                        />
                        <button 
                            onClick={() => setShowPersonalization({ target: showPersonalization.target === 'body' ? null : 'body' })}
                            className={`absolute right-4 top-4 p-1.5 transition-colors ${showPersonalization.target === 'body' ? 'text-[#ca7900]' : 'text-slate-400 hover:text-[#ca7900]'}`}
                            title="Cá nhân hóa nội dung"
                            disabled={disabled}
                        >
                            <User className="w-4 h-4" />
                        </button>
                        {showPersonalization.target === 'body' && (
                            <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in zoom-in-95">
                                <div className="grid grid-cols-1 gap-1">
                                    {MERGE_TAGS.map(tag => (
                                        <button 
                                        key={tag.value} 
                                        onClick={() => injectTag(tag.value, 'body')}
                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-xs font-bold text-slate-700 transition-colors flex justify-between items-center"
                                        >
                                        {tag.label} <code className="text-[9px] text-orange-500 font-mono">{tag.value}</code>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium px-1 italic">Nội dung này sẽ thay thế vào vùng `{'{{body}}'}` của template.</p>
                </div>
              </div>
          )}

          {/* MODE: HTML CODE */}
          {sourceMode === 'html' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="relative">
                      <div className="absolute top-0 right-0 z-10 flex gap-2">
                          {/* VARIABLE DROPDOWN */}
                          <div className="relative">
                              <button 
                                  onClick={() => !disabled && setShowVarDropdown(!showVarDropdown)}
                                  disabled={disabled}
                                  className="bg-slate-700 text-white px-3 py-1.5 rounded-bl-xl text-[10px] font-bold uppercase hover:bg-slate-600 transition-colors flex items-center gap-1 border-r border-slate-600"
                              >
                                  <Braces className="w-3.5 h-3.5 text-[#ffa900]" />
                                  Biến động (Click to Insert)
                                  <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                              </button>
                              {showVarDropdown && (
                                  <>
                                      <div className="fixed inset-0 z-20" onClick={() => setShowVarDropdown(false)}></div>
                                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-in fade-in zoom-in-95">
                                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click để chèn</p>
                                          </div>
                                          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                              {MERGE_TAGS.map((tag) => (
                                                  <button
                                                      key={tag.value}
                                                      onClick={() => injectTag(tag.value)}
                                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors rounded-lg"
                                                  >
                                                      <span className="text-xs font-bold text-slate-700">{tag.label}</span>
                                                      <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono group-hover:text-[#ca7900] group-hover:bg-orange-50">{tag.value}</code>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  </>
                              )}
                          </div>

                          <button 
                            onClick={() => setPreviewData({ template: null, html: config.customHtml })}
                            className="bg-[#ffa900] text-white px-3 py-1.5 rounded-bl-xl text-[10px] font-bold uppercase hover:bg-[#ca7900] transition-colors flex items-center gap-1"
                          >
                              <Eye className="w-3 h-3" /> Preview HTML
                          </button>
                      </div>
                      <textarea 
                          ref={textAreaRef}
                          className="w-full h-64 bg-[#1e293b] text-indigo-100 font-mono text-xs p-4 pt-10 rounded-xl outline-none border-2 border-transparent focus:border-[#ffa900] transition-all resize-y leading-relaxed custom-scrollbar"
                          placeholder="<html><body><h1>Paste your HTML here...</h1></body></html>"
                          value={config.customHtml || ''}
                          onChange={(e) => onChange({ ...config, customHtml: e.target.value })}
                          spellCheck={false}
                          disabled={disabled}
                      />
                  </div>
              </div>
          )}
      </div>

      {showPicker && (
        <div className="p-1 bg-white rounded-[32px] border-2 border-[#ffa900]/10 shadow-2xl animate-in zoom-in-95 duration-200 fixed inset-x-4 top-20 bottom-20 z-[100] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Chọn mẫu Email</h3>
                <button onClick={() => setShowPicker(false)} className="p-2 hover:bg-slate-100 rounded-full"><FileText className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <TemplateSelector 
                    templates={templates} 
                    selectedId={config.templateId} 
                    onSelect={(t) => { if (!disabled) { onChange({ ...config, templateId: t.id }); setShowPicker(false); } }}
                />
            </div>
        </div>
      )}

      {/* Overlay for Picker Backdrop */}
      {showPicker && <div className="fixed inset-0 bg-black/20 z-[90]" onClick={() => setShowPicker(false)}></div>}

      <EmailPreviewDrawer 
        template={previewData?.template || null} 
        htmlContent={previewData?.html}
        isOpen={!!previewData} 
        onClose={() => setPreviewData(null)} 
      />
    </div>
  );
};

export default EmailActionConfig;
