
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Clock, Settings2, Power, Zap, Shield, Calendar, Target, Users, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Flow } from '../../../types';
import Card from '../../common/Card';
import Input from '../../common/Input';
import Badge from '../../common/Badge';
import ExitConditions from '../config/ExitConditions';
import Button from '../../common/Button';

interface FlowSettingsTabProps {
  flow: Flow;
  onUpdate: (data: Partial<Flow>, isSilent?: boolean) => void;
}

const FlowSettingsTab: React.FC<FlowSettingsTabProps> = ({ flow, onUpdate }) => {
  const triggerStep = flow.steps.find(s => s.type === 'trigger');
  
  // Check Form, Purchase, and Custom Event triggers as Priority
  const isPriorityTrigger = ['form', 'purchase', 'custom_event'].includes(triggerStep?.config?.type || '');

  // --- LOCAL STATE FOR MANUAL SAVE ---
  const [localName, setLocalName] = useState(flow.name);
  const [localDesc, setLocalDesc] = useState(flow.description);
  const [localConfig, setLocalConfig] = useState(flow.config || {
    frequencyCap: 3,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '08:00',
    endTime: '21:00',
    exitConditions: ['unsubscribed'],
    type: 'realtime' as const
  });
  const [isModified, setIsModified] = useState(false);

  // Sync state if prop changes externally (e.g. refresh)
  useEffect(() => {
      setLocalName(flow.name);
      setLocalDesc(flow.description);
      setLocalConfig(flow.config || {
        frequencyCap: 3,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        startTime: '08:00',
        endTime: '21:00',
        exitConditions: ['unsubscribed'],
        type: 'realtime' as const
      });
      setIsModified(false);
  }, [flow.id]); 

  const handleSave = () => {
      onUpdate({
          name: localName,
          description: localDesc,
          config: localConfig
      }, false); 
      setIsModified(false);
  };

  const updateConfig = (key: string, value: any) => {
      setLocalConfig(prev => ({ ...prev, [key]: value }));
      setIsModified(true);
  };

  const handleCapping = (delta: number) => {
    if (isPriorityTrigger) return;
    const current = localConfig.frequencyCap || 1;
    const next = Math.max(1, Math.min(5, current + delta));
    updateConfig('frequencyCap', next);
  };

  const toggleDay = (dayIdx: number) => {
    if (isPriorityTrigger) return;
    const currentDays = localConfig.activeDays || [];
    const nextDays = currentDays.includes(dayIdx)
      ? currentDays.filter((d: number) => d !== dayIdx)
      : [...currentDays, dayIdx].sort();
    updateConfig('activeDays', nextDays);
  };

  const timeToPercent = (timeStr: string) => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  };

  const scheduleBarStyles = useMemo(() => {
    if (isPriorityTrigger) return { left: '0%', width: '100%' };
    const start = timeToPercent(localConfig.startTime);
    const end = timeToPercent(localConfig.endTime);
    return {
      left: `${start}%`,
      width: `${Math.max(2, end - start)}%`
    };
  }, [localConfig.startTime, localConfig.endTime, isPriorityTrigger]);

  const days = [
    { label: 'T2', id: 0 }, { label: 'T3', id: 1 }, { label: 'T4', id: 2 },
    { label: 'T5', id: 3 }, { label: 'T6', id: 4 }, { label: 'T7', id: 5 }, { label: 'CN', id: 6 },
  ];

  const getPriorityLabel = () => {
      const type = triggerStep?.config?.type;
      if (type === 'purchase') return 'Hành động Mua hàng';
      if (type === 'custom_event') return 'Sự kiện Tùy chỉnh';
      return 'Form Đăng ký';
  };

  return (
    <div className="p-5 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      
      {/* WARNING FOR PRIORITY TRIGGER */}
      {isPriorityTrigger && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                  <p className="text-xs font-black text-orange-900 uppercase tracking-tight">Chế độ ưu tiên (Real-time Transaction)</p>
                  <p className="text-[11px] font-medium text-orange-800 leading-relaxed mt-1">
                      Kịch bản này được kích hoạt bởi <b>{getPriorityLabel()}</b>. 
                      Hệ thống sẽ <b>bỏ qua</b> các giới hạn về khung giờ, ngày nghỉ và tần suất gửi để đảm bảo phản hồi ngay lập tức cho khách hàng.
                  </p>
              </div>
          </div>
      )}

      {/* GENERAL CONFIG */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center gap-2 px-1">
           <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm"><Settings2 className="w-3.5 h-3.5" /></div>
           <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Thông tin chung</h3>
        </div>
        <Card className="rounded-[20px] border border-slate-200 shadow-sm p-5 bg-white" noPadding>
           <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <Input 
                    label="Tên định danh Flow" 
                    value={localName} 
                    onChange={(e) => { setLocalName(e.target.value); setIsModified(true); }}
                    className="shadow-none border-slate-200 focus:border-blue-500"
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mô tả / Ghi chú</label>
                    <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all min-h-[80px]"
                        value={localDesc}
                        onChange={(e) => { setLocalDesc(e.target.value); setIsModified(true); }}
                        placeholder="Mục tiêu chiến dịch..."
                    />
                  </div>
              </div>
              <div className="space-y-4">
                  <div>
                      <h4 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Loại quy trình</h4>
                      <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => updateConfig('type', 'realtime')}
                            className={`p-3 rounded-xl text-left transition-all border-2 flex items-center gap-3 ${localConfig.type !== 'batch' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                          >
                              <div className={`p-1.5 rounded-lg ${localConfig.type !== 'batch' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-[10px] font-black uppercase ${localConfig.type !== 'batch' ? 'text-blue-700' : 'text-slate-600'}`}>Real-time</p>
                                <p className="text-[9px] text-slate-400 font-medium">Xử lý ngay</p>
                              </div>
                          </button>
                          <button 
                             onClick={() => updateConfig('type', 'batch')}
                             className={`p-3 rounded-xl text-left transition-all border-2 flex items-center gap-3 ${localConfig.type === 'batch' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                          >
                              <div className={`p-1.5 rounded-lg ${localConfig.type === 'batch' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-[10px] font-black uppercase ${localConfig.type === 'batch' ? 'text-indigo-700' : 'text-slate-600'}`}>Batch</p>
                                <p className="text-[9px] text-slate-400 font-medium">Theo lô</p>
                              </div>
                          </button>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <p className="text-[10px] text-slate-500 font-medium">Tự động gắn UTM tag: <span className="font-bold text-slate-700">{localName}</span></p>
                  </div>
              </div>
           </div>
        </Card>
      </section>

      {/* SCHEDULING - DISABLED IF PRIORITY */}
      <section className={`mb-6 space-y-3 transition-opacity ${isPriorityTrigger ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="flex items-center gap-2 px-1">
           <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 shadow-sm"><Calendar className="w-3.5 h-3.5" /></div>
           <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Lịch trình gửi</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-[20px] border border-slate-200 shadow-sm p-5 bg-white md:col-span-1" noPadding>
                <div className="p-5 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-700 uppercase">Tần suất (Cap)</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">Giới hạn số email tối đa gửi cho 1 người / 24h.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <button onClick={() => handleCapping(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-500 shadow-sm active:scale-90 transition-all font-bold text-lg">-</button>
                        <div className="flex-1 text-center">
                            <span className="text-xl font-black text-slate-800">{localConfig.frequencyCap}</span>
                        </div>
                        <button onClick={() => handleCapping(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-500 shadow-sm active:scale-90 transition-all font-bold text-lg">+</button>
                    </div>
                </div>
            </Card>

            <Card className="rounded-[20px] border border-slate-200 shadow-sm md:col-span-2 bg-white" noPadding>
                <div className="p-5 space-y-5">
                    {/* Time Range */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khung giờ vàng</span>
                            <Badge variant={isPriorityTrigger ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0">GMT+7</Badge>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full relative overflow-hidden mb-4">
                            <div 
                                className={`absolute h-full rounded-full shadow-sm ${isPriorityTrigger ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={scheduleBarStyles}
                            ></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <input 
                                    type="time" 
                                    value={localConfig.startTime} 
                                    onChange={(e) => updateConfig('startTime', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-amber-500 outline-none text-center"
                                />
                            </div>
                            <span className="text-slate-300 font-black">-</span>
                            <div className="flex-1">
                                <input 
                                    type="time" 
                                    value={localConfig.endTime} 
                                    onChange={(e) => updateConfig('endTime', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-amber-500 outline-none text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Days */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Ngày hoạt động</label>
                        <div className="flex gap-1.5">
                            {days.map((day) => {
                                const isActive = (localConfig.activeDays || []).includes(day.id);
                                return (
                                    <button 
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`
                                            flex-1 py-2.5 rounded-lg text-[10px] font-bold border transition-all shadow-sm
                                            ${isActive 
                                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}
                                        `}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </section>

      {/* SMART INTERRUPTS */}
      <section className="mb-8 space-y-3">
        <div className="flex items-center gap-2 px-1">
           <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shadow-sm"><Power className="w-3.5 h-3.5" /></div>
           <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Quy tắc ngắt luồng</h3>
        </div>
        <Card className="rounded-[20px] border border-slate-200 shadow-sm p-5 bg-white" noPadding>
            <div className="p-5">
                <ExitConditions 
                  conditions={localConfig.exitConditions || []} 
                  onChange={(c) => updateConfig('exitConditions', c)} 
                />
            </div>
        </Card>
      </section>

      {/* MANUAL SAVE BUTTON AREA */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button 
            size="lg" 
            onClick={handleSave} 
            icon={Save}
            disabled={!isModified}
            className={`
                px-8 h-12 rounded-xl shadow-xl transition-all
                ${isModified 
                    ? 'bg-slate-900 text-white hover:bg-black shadow-slate-300' 
                    : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'}
            `}
          >
              {isModified ? 'Lưu cấu hình' : 'Đã đồng bộ'}
          </Button>
      </div>
    </div>
  );
};

export default FlowSettingsTab;
