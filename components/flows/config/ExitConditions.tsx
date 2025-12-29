

import React from 'react';
import { MailOpen, UserMinus, ShoppingCart, Ban } from 'lucide-react';

interface ExitConditionsProps {
  conditions: string[];
  onChange: (conditions: string[]) => void;
}

const ExitConditions: React.FC<ExitConditionsProps> = ({ conditions, onChange }) => {
  const options = [
    { 
        id: 'purchased', 
        label: 'Khách hàng Mua hàng', 
        desc: 'Ngắt flow ngay lập tức nếu khách hàng thực hiện đơn hàng mới.', 
        icon: ShoppingCart,
        color: 'text-emerald-600 bg-emerald-100'
    },
    { 
        id: 'unsubscribed', 
        label: 'Hủy đăng ký (Unsubscribe)', 
        desc: 'Bắt buộc. Dừng gửi nếu khách hàng chọn hủy đăng ký.', 
        icon: UserMinus, 
        color: 'text-slate-600 bg-slate-200',
        disabled: true // Usually mandatory
    },
    { 
        id: 'bounced', 
        label: 'Email bị lỗi (Hard Bounce)', 
        desc: 'Dừng flow nếu email bị trả lại để bảo vệ điểm uy tín domain.', 
        icon: Ban, 
        color: 'text-rose-600 bg-rose-100'
    },
    { 
        id: 'replied', 
        label: 'Khách hàng phản hồi (Reply)', 
        desc: 'Chuyển sang quy trình chăm sóc thủ công nếu khách reply email.', 
        icon: MailOpen, 
        color: 'text-blue-600 bg-blue-100'
    },
  ];

  const toggle = (id: string) => {
    if (conditions.includes(id)) onChange(conditions.filter(c => c !== id));
    else onChange([...conditions, id]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((opt) => {
        // Ensure unsubscribed is always visually checked if disabled/mandatory
        const isChecked = conditions.includes(opt.id) || opt.disabled; 
        
        return (
          <div 
            key={opt.id}
            onClick={() => !opt.disabled && toggle(opt.id)}
            className={`
              relative p-5 rounded-[24px] border-2 transition-all duration-300 group
              ${isChecked ? 'bg-white border-[#ffa900] shadow-md' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'}
              ${opt.disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Toggle Switch Visual */}
            <div className="absolute top-5 right-5">
                <div className={`w-10 h-6 rounded-full transition-colors duration-300 relative ${isChecked ? 'bg-[#ffa900]' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${isChecked ? 'left-5' : 'left-1'}`}></div>
                </div>
            </div>

            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${opt.color}`}>
                <opt.icon className="w-5 h-5" />
            </div>
            
            <div>
              <h4 className={`text-sm font-black mb-1 ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>{opt.label}</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed pr-8">{opt.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExitConditions;