import React from 'react';
import { Clock } from 'lucide-react';
import Input from '../../common/Input';
import Select from '../../common/Select';

interface WaitConfigProps {
  config: Record<string, any>;
  onChange: (newConfig: Record<string, any>, newLabel?: string) => void;
  disabled?: boolean; 
}

const WaitConfig: React.FC<WaitConfigProps> = ({ config, onChange, disabled }) => {
  const unitOptions = [
    { value: 'hours', label: 'Giờ' },
    { value: 'days', label: 'Ngày' },
    { value: 'weeks', label: 'Tuần' },
  ];

  const getAutoLabel = (duration: number, unit: string) => {
      const uLabel = unitOptions.find(o => o.value === unit)?.label || 'Giờ';
      return `Chờ ${duration} ${uLabel}`;
  };

  const handleValueChange = (val: string) => {
      if (disabled) return; 
      const numVal = Math.max(1, parseInt(val) || 1);
      const newConfig = { ...config, duration: numVal };
      onChange(newConfig, getAutoLabel(numVal, config.unit || 'hours'));
  };

  const handleUnitChange = (unit: string) => {
      if (disabled) return; 
      const newConfig = { ...config, unit };
      onChange(newConfig, getAutoLabel(config.duration || 1, unit));
  };

  // Tự động chuyển về 'hours' nếu config cũ đang là 'minutes'
  React.useEffect(() => {
    if (config.unit === 'minutes') {
        const newConfig = { ...config, unit: 'hours', duration: 1 };
        onChange(newConfig, getAutoLabel(1, 'hours'));
    }
  }, [config.unit]);

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-300">
      <div className="p-5 bg-amber-50 text-amber-700 rounded-[28px] border border-amber-100 flex gap-4 shadow-sm items-center">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
            <Clock className="w-6 h-6 shrink-0" />
        </div>
        <div className="flex-1">
            <p className="text-xs font-bold leading-relaxed">Thời gian tạm dừng</p>
            <p className="text-[10px] opacity-70 font-medium leading-tight mt-0.5">Khách hàng sẽ đứng ở bước này trước khi sang bước tiếp theo (Tối thiểu 1 giờ).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Giá trị" 
          type="number" 
          min="1"
          value={config.duration || 1} 
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
        />
        <Select 
          label="Đơn vị"
          options={unitOptions}
          value={config.unit || 'hours'}
          onChange={handleUnitChange}
          disabled={disabled}
          direction="bottom"
        />
      </div>
    </div>
  );
};

export default WaitConfig;