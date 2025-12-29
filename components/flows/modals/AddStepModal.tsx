
import React from 'react';
import { Mail, Clock, GitMerge, Tag, Sparkles, AlertTriangle, Ban, Link as LinkIcon, Beaker, UserMinus, Trash2, List } from 'lucide-react';
import Modal from '../../common/Modal';
import { FlowStep } from '../../../types';

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: any) => void;
  parentStep?: FlowStep;
  isInsert?: boolean;
}

const STEP_TYPES = [
  { 
    id: 'action', 
    label: 'Gửi Email', 
    desc: 'Gửi bản tin, khuyến mãi.', 
    icon: Mail, 
    color: 'bg-blue-600 text-white shadow-blue-200' 
  },
  { 
    id: 'wait', 
    label: 'Chờ (Wait)', 
    desc: 'Tạm dừng quy trình.', 
    icon: Clock, 
    color: 'bg-amber-500 text-white shadow-amber-200' 
  },
  { 
    id: 'condition', 
    label: 'Rẽ nhánh Logic', 
    desc: 'Kiểm tra hành vi khách.', 
    icon: GitMerge, 
    color: 'bg-indigo-600 text-white shadow-indigo-200',
    requiresAction: true 
  },
  { 
    id: 'list_action', 
    label: 'Quản lý Danh sách', 
    desc: 'Thêm/Gỡ khỏi List.', 
    icon: List, 
    color: 'bg-orange-600 text-white shadow-orange-200' 
  },
  { 
    id: 'update_tag', 
    label: 'Gắn Tag khách', 
    desc: 'Phân loại tự động.', 
    icon: Tag, 
    color: 'bg-emerald-600 text-white shadow-emerald-200' 
  },
  { 
    id: 'split_test', 
    label: 'A/B Split Test', 
    desc: 'Thử nghiệm luồng.', 
    icon: Beaker, 
    color: 'bg-violet-600 text-white shadow-violet-200' 
  },
  { 
    id: 'remove_action', 
    label: 'Dọn dẹp (Cleanup)', 
    desc: 'Hủy đăng ký/Xóa vĩnh viễn.', 
    icon: UserMinus, 
    color: 'bg-rose-600 text-white shadow-rose-200' 
  },
  { 
    id: 'link_flow', 
    label: 'Chuyển kịch bản', 
    desc: 'Kết nối automation khác.', 
    icon: LinkIcon, 
    color: 'bg-slate-700 text-white shadow-slate-200' 
  }
];

const AddStepModal: React.FC<AddStepModalProps> = ({ isOpen, onClose, onAdd, parentStep, isInsert }) => {
  
  const isTypeDisabled = (typeId: string) => {
    // Restriction when inserting between nodes (isInsert = true)
    if (isInsert && ['condition', 'split_test', 'link_flow', 'remove_action'].includes(typeId)) {
        return "Không hỗ trợ chèn vào giữa.";
    }

    if (typeId === 'condition') {
      // Condition requires an immediate preceding Action (Email) step
      if (!parentStep || parentStep.type !== 'action') {
        return "Cần bước Email trước đó.";
      }
    }

    if (typeId === 'remove_action') {
      // Remove action MUST follow a Condition step (for safety)
      if (!parentStep || parentStep.type !== 'condition') {
        return "Chỉ được đặt sau bước Rẽ nhánh (Condition).";
      }
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isInsert ? "Chèn bước vào giữa" : "Thêm bước tiếp theo"}
      size="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
        {STEP_TYPES.map((type) => {
          const disabledReason = isTypeDisabled(type.id);
          const isDisabled = !!disabledReason;

          return (
            <button 
              key={type.id}
              onClick={() => { if (!isDisabled) { onAdd(type.id as any); onClose(); } }}
              disabled={isDisabled}
              className={`
                flex flex-col items-center text-center p-6 rounded-[32px] border-2 transition-all relative group
                ${isDisabled 
                  ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' 
                  : 'bg-white border-slate-100 hover:border-[#ffa900] hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1'}
              `}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4 transition-all duration-300 ${isDisabled ? 'bg-slate-200 text-slate-400' : `${type.color} group-hover:scale-110 group-hover:rotate-3`}`}>
                <type.icon className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h4 className={`font-black text-sm uppercase tracking-tight ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}>{type.label}</h4>
                <p className={`text-[10px] font-medium leading-relaxed px-2 ${isDisabled ? 'text-slate-300' : 'text-slate-500'}`}>{type.desc}</p>
              </div>

              {isDisabled && (
                <div className="mt-3 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2 border border-slate-200">
                    <AlertTriangle className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{disabledReason}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default AddStepModal;
