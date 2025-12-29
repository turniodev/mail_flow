
import React, { useState } from 'react';
import { Trash2, Save, Sparkles, Beaker, AlertCircle } from 'lucide-react';
import { FlowStep, Flow } from '../../../types';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import EmailActionConfig from '../config/EmailActionConfig';
import TriggerConfig from '../config/TriggerConfig';
import WaitConfig from '../config/WaitConfig';
import ConditionConfig from '../config/ConditionConfig';
import UpdateTagConfig from '../config/UpdateTagConfig';
import LinkFlowConfig from '../config/LinkFlowConfig';
import RemoveActionConfig from '../config/RemoveActionConfig'; 
import ListActionConfig from '../config/ListActionConfig'; // Import New Component
import Input from '../../common/Input';

const SplitTestConfig = ({ config, onChange, disabled }: any) => {
    const handleRatioChange = (val: string, isA: boolean) => {
        if (disabled) return;
        let v = parseInt(val);
        if (isNaN(v)) v = 50;
        if (v < 1) v = 1;
        if (v > 99) v = 99;

        if (isA) {
            onChange({...config, ratioA: v, ratioB: 100 - v});
        } else {
            onChange({...config, ratioB: v, ratioA: 100 - v});
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-5 bg-violet-50 text-violet-700 rounded-2xl border border-violet-100 flex gap-4">
                <Beaker className="w-6 h-6 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">Phân chia lưu lượng khách hàng ngẫu nhiên để thử nghiệm 2 kịch bản khác nhau.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Tỷ lệ nhánh A (%)</label>
                    <input 
                        type="number" 
                        value={config.ratioA || 50} 
                        onChange={(e) => handleRatioChange(e.target.value, true)} 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xl text-violet-600 outline-none focus:ring-2 focus:ring-violet-200 transition-all" 
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Tỷ lệ nhánh B (%)</label>
                    <input 
                        type="number" 
                        value={config.ratioB || 50} 
                        onChange={(e) => handleRatioChange(e.target.value, false)} 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xl text-slate-400 outline-none focus:ring-2 focus:ring-violet-200 transition-all" 
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

interface StepEditorProps {
  step: FlowStep | null;
  onClose: () => void;
  onSave: (updatedStep: FlowStep) => void;
  onDelete: (id: string) => void;
  currentFlowId?: string;
  flow?: Flow;
  allFlows?: Flow[];
  validationErrors?: any[];
  isFlowArchived?: boolean;
}

const StepEditor: React.FC<StepEditorProps> = ({ step, onClose, onSave, onDelete, currentFlowId, flow, allFlows = [], validationErrors = [], isFlowArchived }) => {
  const [localStep, setLocalStep] = useState<FlowStep | null>(step);

  React.useEffect(() => { setLocalStep(step); }, [step]);

  if (!localStep) return null;

  const handleConfigChange = (newConfig: any, newLabel?: string) => {
    if (isFlowArchived) return;
    setLocalStep(prev => {
        if (!prev) return null;
        const updated = { ...prev, config: newConfig };
        if (newLabel) updated.label = newLabel;
        return updated;
    });
  };

  const stepErrors = validationErrors.filter(e => e.stepId === localStep.id);
  
  // Logic: Nếu Flow đã có người tham gia (enrolled > 0), không cho sửa Trigger để bảo toàn dữ liệu
  const hasEnrollment = (flow?.stats?.enrolled || 0) > 0;
  const isTriggerLocked = localStep.type === 'trigger' && hasEnrollment;

  const renderConfig = () => {
    switch (localStep.type) {
      case 'trigger': return <TriggerConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived || isTriggerLocked} locked={isTriggerLocked} allFlows={allFlows} currentFlowId={flow?.id} />;
      case 'action': return <EmailActionConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} />;
      case 'wait': return <WaitConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} />;
      case 'condition': return <ConditionConfig config={localStep.config} onChange={handleConfigChange} flow={flow} stepId={localStep.id} disabled={isFlowArchived} />;
      case 'split_test': return <SplitTestConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} />;
      case 'update_tag': return <UpdateTagConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} allFlows={allFlows} currentFlowId={flow?.id} />;
      case 'list_action': return <ListActionConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} />;
      case 'link_flow': return <LinkFlowConfig config={localStep.config} onChange={handleConfigChange} currentFlowId={flow?.id || ''} disabled={isFlowArchived} />;
      case 'remove_action': return <RemoveActionConfig config={localStep.config} onChange={handleConfigChange} disabled={isFlowArchived} />;
      default: return null;
    }
  };

  const isTrigger = localStep.type === 'trigger';

  const getHeaderGradient = () => {
    switch (localStep.type) {
      case 'trigger': return 'from-slate-800 to-slate-950';
      case 'action': return 'from-blue-50 to-indigo-50'; // Background lighter for better text readability inside nodes, but here it's for header
      case 'update_tag': return 'from-emerald-500 to-emerald-700';
      case 'list_action': return 'from-orange-500 to-orange-700';
      case 'wait': return 'from-amber-400 to-amber-600';
      case 'condition': return 'from-indigo-500 to-indigo-700';
      case 'split_test': return 'from-violet-500 to-violet-700';
      case 'link_flow': return 'from-slate-700 to-slate-900';
      case 'remove_action': return 'from-rose-500 to-rose-700';
      default: return 'from-slate-800 to-slate-950';
    }
  };

  // Fixed colors for action step header
  const getHeaderStyle = () => {
      if (localStep.type === 'action') return 'from-blue-600 to-indigo-700';
      return getHeaderGradient();
  }

  return (
    <Modal
      isOpen={!!step}
      onClose={onClose}
      title={isTrigger ? "Bắt đầu quy trình" : "Cấu hình bước"}
      size="md"
      footer={
        !isFlowArchived && (
          <div className="flex justify-between w-full items-center">
            <div>
              {!isTrigger && (
                <Button variant="danger" size="md" icon={Trash2} onClick={() => onDelete(localStep.id)}>
                  Xóa bước
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
              <Button size="md" icon={Save} onClick={() => onSave(localStep)} disabled={isTriggerLocked}>Lưu thay đổi</Button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-6">
        <div className={`relative p-8 rounded-[32px] text-white shadow-2xl overflow-hidden bg-gradient-to-br ${getHeaderStyle()}`}>
           <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><Sparkles className="w-40 h-40" /></div>
           <div className="relative z-10">
              <input 
                className="text-2xl font-black bg-transparent border-none outline-none w-full placeholder:text-white/20 focus:ring-0 p-0 tracking-tight"
                placeholder="Tên gợi nhớ..."
                value={localStep.label}
                onChange={(e) => setLocalStep({...localStep, label: e.target.value})}
                disabled={isFlowArchived}
              />
              <p className="text-[10px] font-black uppercase text-white/40 mt-3 tracking-[0.3em]">{localStep.type.replace('_', ' ')}</p>
           </div>
        </div>

        {stepErrors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="space-y-1">
                    {stepErrors.map((e, i) => <p key={i} className="text-xs font-bold text-rose-700">{e.msg}</p>)}
                </div>
            </div>
        )}
        
        <div className="px-1 pt-2">
           {renderConfig()}
        </div>
      </div>
    </Modal>
  );
};

export default StepEditor;
