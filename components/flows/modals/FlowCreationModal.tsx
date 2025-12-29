
import React, { useState } from 'react';
import { Sparkles, ArrowRight, Gift, Zap, Info, Cake, Tag, Users, RefreshCw, Send, PartyPopper, Ghost, Crown, UserPlus, Snowflake, Check, List, FileInput, Layers, ListPlus, ShoppingCart, Plug } from 'lucide-react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';

interface FlowCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (flowData: any) => void;
}

const FLOW_TEMPLATES = [
  {
    id: 'welcome_segment',
    name: 'Phân khúc động (Smart)',
    desc: 'Tự động chạy khi khách hàng thỏa mãn bộ lọc (VD: VIP, Mới mua hàng).',
    icon: Layers,
    theme: 'orange',
    gradient: 'from-orange-500 to-[#ca7900]',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi vào Phân khúc', iconName: 'zap', config: { type: 'segment', targetSubtype: 'segment', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Chăm sóc Phân khúc', iconName: 'mail', config: { subject: 'Chào mừng bạn đến với nhóm đặc quyền! ✨' } }
    ]
  },
  {
    id: 'welcome_list',
    name: 'Gia nhập Danh sách',
    desc: 'Kích hoạt khi khách hàng được thêm vào một danh sách tĩnh (VD: Import, API).',
    icon: ListPlus,
    theme: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi vào Danh sách', iconName: 'zap', config: { type: 'segment', targetSubtype: 'list', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Chào mừng', iconName: 'mail', config: { subject: 'Cảm ơn bạn đã tham gia cộng đồng! 👋' } }
    ]
  },
  {
    id: 'purchase_success',
    name: 'Cảm ơn Mua hàng',
    desc: 'Gửi thư cảm ơn xác nhận ngay khi khách hàng phát sinh đơn hàng mới.',
    icon: ShoppingCart,
    theme: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi Mua hàng', iconName: 'zap', config: { type: 'purchase', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Cảm ơn', iconName: 'mail', config: { subject: 'Xác nhận đơn hàng thành công! 🛍️' } }
    ]
  },
  {
    id: 'custom_event_flow',
    name: 'Sự kiện Tùy chỉnh',
    desc: 'Kích hoạt khi nhận được một API Event bất kỳ (VD: Click Banner, App Login).',
    icon: Zap,
    theme: 'violet',
    gradient: 'from-violet-500 to-indigo-600',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi có Custom Event', iconName: 'zap', config: { type: 'custom_event', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Phản hồi', iconName: 'mail', config: { subject: 'Chúng tôi nhận được tương tác của bạn! 🚀' } }
    ]
  },
  {
    id: 'tag_added',
    name: 'Khi được gắn Tag',
    desc: 'Kích hoạt ngay khi hồ sơ khách hàng được gắn một nhãn cụ thể.',
    icon: Tag,
    theme: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi được gắn nhãn', iconName: 'zap', config: { type: 'tag', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Phản hồi Tag', iconName: 'mail', config: { subject: 'Bạn vừa nhận được nhãn mới! Xem ngay ưu đãi' } }
    ]
  },
  {
    id: 'welcome_form',
    name: 'Chào mừng gửi Form',
    desc: 'Tự động phản hồi khách hàng ngay sau khi họ điền Form đăng ký.',
    icon: FileInput,
    theme: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi khách gửi Form', iconName: 'zap', config: { type: 'form', targetId: '' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Phản hồi Form', iconName: 'mail', config: { subject: 'Cảm ơn bạn đã quan tâm! Tài liệu của bạn đây' } }
    ]
  },
  {
    id: 'campaign_tracking',
    name: 'Chăm sóc sau Chiến dịch',
    desc: 'Kích hoạt ngay khi một email trong chiến dịch chính vừa được gửi đi.',
    icon: Send,
    theme: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    steps: [
      { id: 't1', type: 'trigger', label: 'Khi gửi Campaign', iconName: 'zap', config: { type: 'campaign', targetId: '' }, nextStepId: 'w1' },
      { id: 'w1', type: 'wait', label: 'Chờ 2 ngày', iconName: 'clock', config: { duration: 2, unit: 'days' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Follow-up', iconName: 'mail', config: { subject: 'Bạn có nhận được ưu đãi hôm trước không? 😉' } }
    ]
  },
  {
    id: 'winback',
    name: 'Khách hàng ngủ đông',
    desc: 'Kích hoạt khi khách hàng KHÔNG có tương tác (Mở/Click) trong 30 ngày.',
    icon: Snowflake,
    theme: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    steps: [
      { 
          id: 't1', 
          type: 'trigger', 
          label: 'Không hoạt động > 30 ngày', 
          iconName: 'zap', 
          config: { 
              type: 'date', 
              dateField: 'lastActivity', 
              inactiveAmount: 30,        
          }, 
          nextStepId: 'a1' 
      },
      { id: 'a1', type: 'action', label: 'Email Lôi kéo', iconName: 'mail', config: { subject: 'Chúng tôi nhớ bạn! Giảm ngay 20% khi quay lại' } }
    ]
  },
  {
    id: 'birthday',
    name: 'Chúc mừng Sinh nhật',
    desc: 'Tự động gửi quà tặng đúng ngày sinh nhật của khách hàng.',
    icon: Cake,
    theme: 'pink',
    gradient: 'from-pink-400 to-rose-500',
    steps: [
      { id: 't1', type: 'trigger', label: 'Đúng ngày sinh nhật', iconName: 'zap', config: { type: 'date', dateField: 'dateOfBirth' }, nextStepId: 'a1' },
      { id: 'a1', type: 'action', label: 'Email Tặng Quà', iconName: 'mail', config: { subject: 'Chúc mừng sinh nhật! Nhận quà ngay 🎂' } }
    ]
  }
];

const FlowCreationModal: React.FC<FlowCreationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState(1); 
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [flowName, setFlowName] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (selectedTemplate) {
          setFlowName(selectedTemplate.name); 
          setStep(2); 
      }
    } else if (step === 2) {
      createFlow();
    }
  };

  const createFlow = () => {
      const idMap: Record<string, string> = {};
      selectedTemplate.steps.forEach((s: any) => { idMap[s.id] = crypto.randomUUID(); });
      
      const finalSteps = selectedTemplate.steps.map((s: any) => {
          const newStep = { ...s, id: idMap[s.id] };
          if (s.nextStepId && idMap[s.nextStepId]) newStep.nextStepId = idMap[s.nextStepId];
          if (s.yesStepId && idMap[s.yesStepId]) newStep.yesStepId = idMap[s.yesStepId];
          if (s.noStepId && idMap[s.noStepId]) newStep.noStepId = idMap[s.noStepId];
          if (s.pathAStepId && idMap[s.pathAStepId]) newStep.pathAStepId = idMap[s.pathAStepId];
          if (s.pathBStepId && idMap[s.pathBStepId]) newStep.pathBStepId = idMap[s.pathBStepId];
          return newStep;
      });

      onCreate({ 
        name: flowName, 
        steps: finalSteps, 
        description: selectedTemplate?.desc || 'Kịch bản tự động hóa.' 
      });
      reset();
  };

  const reset = () => { setStep(1); setSelectedTemplate(null); setFlowName(''); };

  const getBorderClass = (theme: string, isSelected: boolean) => {
      if (!isSelected) return 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-1';
      
      switch(theme) {
          case 'cyan': return 'border-cyan-400 ring-4 ring-cyan-50 shadow-xl shadow-cyan-100 bg-cyan-50/30';
          case 'violet': return 'border-violet-400 ring-4 ring-violet-50 shadow-xl shadow-violet-100 bg-violet-50/30';
          case 'indigo': return 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl shadow-indigo-100 bg-indigo-50/30';
          case 'blue': return 'border-blue-400 ring-4 ring-blue-50 shadow-xl shadow-blue-100 bg-blue-50/30';
          case 'rose': return 'border-rose-400 ring-4 ring-rose-50 shadow-xl shadow-rose-100 bg-rose-50/30';
          case 'pink': return 'border-pink-400 ring-4 ring-pink-50 shadow-xl shadow-pink-100 bg-pink-50/30';
          case 'amber': case 'orange': return 'border-amber-400 ring-4 ring-amber-50 shadow-xl shadow-amber-100 bg-amber-50/30';
          case 'emerald': return 'border-emerald-400 ring-4 ring-emerald-50 shadow-xl shadow-emerald-100 bg-emerald-50/30';
          default: return 'border-slate-400 ring-4 ring-slate-100';
      }
  };

  const getCheckColor = (theme: string) => {
      switch(theme) {
          case 'cyan': return 'text-cyan-500';
          case 'violet': return 'text-violet-500';
          case 'indigo': return 'text-indigo-500';
          case 'blue': return 'text-blue-500';
          case 'rose': return 'text-rose-500';
          case 'pink': return 'text-pink-500';
          case 'amber': case 'orange': return 'text-amber-500';
          case 'emerald': return 'text-emerald-500';
          default: return 'text-slate-500';
      }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); reset(); }}
      title={step === 1 ? "Chọn mẫu kịch bản" : "Đặt tên kịch bản"}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          {step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>Quay lại</Button> : <div />}
          <Button disabled={(step === 1 && !selectedTemplate) || (step === 2 && !flowName)} onClick={handleNext} icon={step === 2 ? Zap : ArrowRight}>
            {step === 2 ? "Tạo kịch bản" : "Tiếp tục"}
          </Button>
        </div>
      }
    >
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
          {FLOW_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id;
            return (
                <div 
                    key={tpl.id} 
                    onClick={() => setSelectedTemplate(tpl)} 
                    className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col gap-5 relative overflow-hidden group ${getBorderClass(tpl.theme, isSelected)}`}
                >
                    <div className={`absolute top-4 right-4 bg-white rounded-full p-1.5 shadow-md border border-slate-50 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                        <Check className={`w-3.5 h-3.5 ${getCheckColor(tpl.theme)} stroke-[4px]`} />
                    </div>

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 bg-gradient-to-br ${tpl.gradient} ${isSelected ? 'scale-110 rotate-3 shadow-xl' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                        <tpl.icon className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-[15px] mb-1.5 tracking-tight group-hover:text-[#ca7900] transition-colors">{tpl.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{tpl.desc}</p>
                    </div>
                </div>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 p-1">
          <Input label="Tên kịch bản nội bộ" placeholder="VD: Chào mừng khách hàng từ Form Landing Page" value={flowName} onChange={(e) => setFlowName(e.target.value)} autoFocus />
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 shadow-inner">
             <Info className="w-4 h-4 text-blue-600 mt-1" />
             <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">Hệ thống sẽ tự động cấu hình các bước cơ bản theo logic của kịch bản "{selectedTemplate?.name}". Bạn có thể chỉnh sửa chi tiết sau khi tạo.</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default FlowCreationModal;
