
import React, { useState, useEffect } from 'react';
import { MailOpen, MousePointer2, MessageSquare, RefreshCw, Unlink, MailCheck, UserMinus, Clock, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { Flow } from '../../../types';
import { api } from '../../../services/storageAdapter';
import Radio from '../../common/Radio';
import Input from '../../common/Input';
import Select from '../../common/Select';
import { compileHTML } from '../../templates/EmailEditor/index';

interface ConditionConfigProps {
  config: Record<string, any>;
  onChange: (newConfig: Record<string, any>) => void;
  flow?: Flow;
  stepId?: string;
  disabled?: boolean;
}

const ConditionConfig: React.FC<ConditionConfigProps> = ({ config, onChange, flow, stepId, disabled }) => {
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [parentEmailStep, setParentEmailStep] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  // Convert old single linkTarget to array if needed
  const selectedLinks: string[] = Array.isArray(config.linkTargets) 
    ? config.linkTargets 
    : (config.linkTarget ? [config.linkTarget] : []);

  const unitOptions = [
    { value: 'hours', label: 'Giờ' },
    { value: 'days', label: 'Ngày' },
    { value: 'weeks', label: 'Tuần' },
  ];

  useEffect(() => {
    if (!flow || !stepId) return;
    
    const findParentEmail = (currentId: string, visited: Set<string>): any => {
        if (visited.has(currentId)) return null;
        visited.add(currentId);
        // Find steps that point TO currentId
        const parentCandidates = flow.steps.filter(s => 
            s.nextStepId === currentId || s.yesStepId === currentId || s.noStepId === currentId || s.pathAStepId === currentId || s.pathBStepId === currentId
        );
        for (const parent of parentCandidates) {
            if (parent.type === 'action') return parent;
            const foundInBranch = findParentEmail(parent.id, visited);
            if (foundInBranch) return foundInBranch;
        }
        return null;
    };

    const parentEmail = findParentEmail(stepId, new Set<string>());
    setParentEmailStep(parentEmail);

    if (parentEmail) {
        setScanning(true);
        const scanLinks = async () => {
            let htmlToCheck = parentEmail.config.customHtml || '';
            
            if (parentEmail.config.templateId && parentEmail.config.templateId !== 'custom-html') {
                const res = await api.get<any>(`templates/${parentEmail.config.templateId}`);
                if (res.success) {
                    const tpl = res.data;
                    if (tpl.blocks) {
                        htmlToCheck = compileHTML(tpl.blocks, tpl.bodyStyle, 'temp');
                    } else {
                        htmlToCheck = tpl.htmlContent || '';
                    }
                }
            }

            const links: any[] = [];
            // UPDATED REGEX: Supports attributes before href, and multiline content [\s\S]
            const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>([\s\S]*?)<\/a>/gi;
            
            let match;
            let idx = 0;
            while ((match = regex.exec(htmlToCheck)) !== null) {
                const url = match[2];
                // Strip HTML tags from label and trim whitespace/newlines
                const rawLabel = match[3];
                const label = rawLabel.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() || url; 
                
                if (!url.includes('{{unsubscribe_url}}') && !url.startsWith('#') && !url.startsWith('mailto:')) {
                    links.push({ id: `link-${idx++}`, label: label.substring(0, 50), url: url });
                }
            }
            
            const uniqueLinks = Array.from(new Map(links.map(item => [item.url, item])).values());
            setAvailableLinks(uniqueLinks);
            setScanning(false);
        };
        scanLinks();
    } else {
        setAvailableLinks([]);
    }
  }, [flow, stepId]);

  useEffect(() => {
    if (config.waitUnit === 'minutes') {
        onChange({ ...config, waitUnit: 'hours', waitDuration: 1 });
    }
  }, [config.waitUnit]);

  const handleTypeChange = (val: string) => {
    if (disabled) return;
    const updates: Record<string, any> = { 
      ...config, 
      conditionType: val, 
      linkTargets: val === 'clicked' ? selectedLinks : [] 
    };
    if (val === 'delivered') {
        updates.waitDuration = 1;
        updates.waitUnit = 'hours';
    } else {
        updates.waitDuration = 3;
        updates.waitUnit = 'days';
    }
    onChange(updates);
  };

  const toggleLink = (url: string) => {
      if (disabled) return;
      if (selectedLinks.includes(url)) {
          onChange({ ...config, linkTargets: selectedLinks.filter(l => l !== url) });
      } else {
          onChange({ ...config, linkTargets: [...selectedLinks, url] });
      }
  };

  const toggleAllLinks = () => {
      if (disabled) return;
      if (selectedLinks.length > 0) {
          onChange({ ...config, linkTargets: [] }); // Clear all = Match ANY (Behavior definition)
      } else {
          // Select specifically all found links (Restrictive)
          onChange({ ...config, linkTargets: availableLinks.map(l => l.url) });
      }
  };

  const getActionDescription = () => {
    switch(config.conditionType) {
      case 'opened': return 'mở mail';
      case 'clicked': return 'click link';
      case 'replied': return 'phản hồi';
      case 'delivered': return 'nhận được mail';
      case 'unsubscribed': return 'hủy đăng ký';
      default: return 'tương tác';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      {!parentEmailStep ? (
        <div className="p-8 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[32px] text-center space-y-4">
            <Unlink className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-sm font-black text-rose-700 uppercase">Thiếu nguồn Email</p>
            <p className="text-xs text-rose-500">Vui lòng nối bước này SAU một bước "Gửi Email".</p>
        </div>
      ) : (
        <>
            <div className="p-5 bg-indigo-50 text-indigo-700 rounded-[24px] border border-indigo-100 flex gap-4 items-center">
                <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Theo dõi Email:</p>
                    <p className="text-xs font-black">"{parentEmailStep.label}"</p>
                </div>
            </div>

            <Radio 
                label="Hành động kiểm tra:"
                options={[
                    { id: 'delivered', label: 'Đã nhận (Delivered)', icon: MailCheck, desc: 'Nếu KHÔNG -> Chuyển nhánh Sai' },
                    { id: 'opened', label: 'Khách mở Email', icon: MailOpen, desc: 'Theo dõi tỷ lệ đọc' },
                    { id: 'clicked', label: 'Khách Click Link', icon: MousePointer2, desc: 'Theo dõi chuyển đổi' },
                    { id: 'replied', label: 'Khách Phản hồi', icon: MessageSquare, desc: 'Chăm sóc 1-1' },
                    { id: 'unsubscribed', label: 'Hủy đăng ký', icon: UserMinus, desc: 'Phân loại khách rời đi' },
                ]}
                value={config.conditionType || 'opened'}
                onChange={handleTypeChange}
                disabled={disabled}
            />

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-[28px] space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Thời hạn kiểm tra (Timeout)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Nếu sau thời gian này khách vẫn chưa {getActionDescription()}, hệ thống sẽ đưa khách vào nhánh "SAI".
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Input 
                        type="number" min="1" 
                        value={config.waitDuration || 1} 
                        onChange={(e) => onChange({ ...config, waitDuration: parseInt(e.target.value) || 1 })} 
                        disabled={disabled}
                    />
                    <Select 
                        options={unitOptions} 
                        value={config.waitUnit || 'hours'} 
                        onChange={(val) => onChange({ ...config, waitUnit: val })} 
                        disabled={disabled}
                        direction="bottom"
                    />
                </div>
            </div>

            {config.conditionType === 'clicked' && (
                <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chọn Link cần theo dõi (OR Logic)</p>
                    {scanning ? (
                        <div className="h-20 bg-slate-100 animate-pulse rounded-2xl"></div>
                    ) : availableLinks.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {/* Option for ANY Link */}
                            <button 
                                onClick={() => { if (!disabled) onChange({ ...config, linkTargets: [] }); }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selectedLinks.length === 0 ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-100 bg-white hover:border-slate-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={disabled}
                            >
                                <div className="flex-1">
                                    <p className="text-xs font-black text-slate-800">Bất kỳ Link nào (Any)</p>
                                    <p className="text-[10px] text-slate-400">Click vào bất cứ link nào trong email đều tính là ĐÚNG</p>
                                </div>
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedLinks.length === 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200'}`}>
                                    {selectedLinks.length === 0 && <CheckSquare className="w-3.5 h-3.5" />}
                                </div>
                            </button>

                            {availableLinks.map((link) => {
                                const isSelected = selectedLinks.includes(link.url);
                                return (
                                    <button 
                                        key={link.id}
                                        onClick={() => toggleLink(link.url)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        disabled={disabled}
                                    >
                                        <div className="flex-1 overflow-hidden pr-2">
                                            <p className="text-xs font-black text-slate-800 truncate">{link.label}</p>
                                            <p className="text-[10px] text-slate-400 truncate font-mono text-blue-600">{link.url}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 bg-white'}`}>
                                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-transparent" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Không tìm thấy Link nào trong email này.
                        </div>
                    )}
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default ConditionConfig;
