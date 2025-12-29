

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Users, CheckCircle2, Mail, MousePointerClick, Activity, Filter, 
    X, Target, Zap, Search, Download, UserPlus, Tag, ListPlus, 
    MoreHorizontal, MailOpen, ChevronRight, Check, Plus, Save, 
    FastForward, UserMinus, RefreshCcw, ArrowRightLeft, Loader2, 
    Clock, History, CalendarClock, Layers, FileInput, Calendar, Send, 
    GitMerge, Beaker, Link as LinkIcon, Trash2, AlertOctagon, ShoppingCart, List
} from 'lucide-react';
import { Flow, Subscriber } from '../../../types';
import { api } from '../../../services/storageAdapter';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Toast, { ToastType } from '../../common/Toast';

const FlowAnalyticsTab: React.FC<{ flow: Flow }> = ({ flow }) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });

  const triggerStep = useMemo(() => flow.steps.find(s => s.type === 'trigger'), [flow.steps]);

  // Safe access to stats with defaults
  const stats = flow.stats || { enrolled: 0, completed: 0, totalSent: 0, totalOpened: 0 };

  // Calculate Rates
  const realOpenRate = (stats.totalSent || 0) > 0 
      ? Math.round(((stats.totalOpened || 0) / stats.totalSent) * 100) 
      : 0;
  
  const completionRate = (stats.enrolled || 0) > 0
      ? Math.round(((stats.completed || 0) / stats.enrolled) * 100)
      : 0;

  // --- HELPER: GET VISUAL STYLE FOR NODE ---
  const getNodeStyle = (step: any) => {
      const type = step.type;
      const config = step.config || {};

      // 1. TRIGGER STYLES
      if (type === 'trigger') {
          const tType = config.type || 'segment';
          switch(tType) {
              case 'segment': return { icon: Layers, gradient: 'from-orange-500 to-[#ca7900]', text: 'text-orange-600', bg: 'bg-orange-50', label: 'Segment Trigger' };
              case 'form': return { icon: FileInput, gradient: 'from-amber-400 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Form Trigger' };
              case 'purchase': return { icon: ShoppingCart, gradient: 'from-pink-500 to-rose-600', text: 'text-pink-600', bg: 'bg-pink-50', label: 'Purchase Trigger' };
              case 'custom_event': return { icon: Zap, gradient: 'from-violet-500 to-indigo-600', text: 'text-violet-600', bg: 'bg-violet-50', label: 'Custom Event' };
              case 'tag': return { icon: Tag, gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Tag Trigger' };
              case 'date': return { icon: Calendar, gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Date Event' };
              case 'campaign': return { icon: Send, gradient: 'from-violet-500 to-purple-600', text: 'text-violet-600', bg: 'bg-violet-50', label: 'Campaign Trigger' };
              default: return { icon: Zap, gradient: 'from-slate-700 to-slate-900', text: 'text-slate-600', bg: 'bg-slate-50', label: 'Trigger' };
          }
      }

      // 2. ACTION STYLES
      switch(type) {
          case 'action': return { icon: Mail, gradient: 'from-blue-600 to-indigo-700', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Email' };
          case 'wait': return { icon: Clock, gradient: 'from-amber-400 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Delay' };
          case 'condition': return { icon: GitMerge, gradient: 'from-indigo-500 to-purple-600', text: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Condition' };
          case 'split_test': return { icon: Beaker, gradient: 'from-violet-500 to-fuchsia-600', text: 'text-violet-600', bg: 'bg-violet-50', label: 'A/B Test' };
          case 'update_tag': return { icon: Tag, gradient: 'from-emerald-500 to-emerald-700', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Update Tag' };
          case 'list_action': return { icon: List, gradient: 'from-orange-500 to-orange-700', text: 'text-orange-600', bg: 'bg-orange-50', label: 'List Action' };
          case 'link_flow': return { icon: LinkIcon, gradient: 'from-slate-700 to-slate-900', text: 'text-slate-600', bg: 'bg-slate-50', label: 'Jump Flow' };
          case 'remove_action': return { icon: UserMinus, gradient: 'from-rose-500 to-red-600', text: 'text-rose-600', bg: 'bg-rose-50', label: 'Clean Up' };
          default: return { icon: CheckCircle2, gradient: 'from-slate-400 to-slate-500', text: 'text-slate-500', bg: 'bg-slate-50', label: 'Step' };
      }
  };

  // CHUYỂN ĐỔI DỮ LIỆU THỰC TẾ SANG FUNNEL (REAL-TIME LOGIC)
  const funnelData = useMemo(() => {
    // 1. Lấy danh sách các bước chính (Action steps)
    const actionSteps = flow.steps.filter(s => ['action', 'update_tag', 'condition', 'wait', 'list_action'].includes(s.type));
    
    // 2. Tạo Map index để biết thứ tự bước
    const stepIndexMap: Record<string, number> = {};
    actionSteps.forEach((s, idx) => { stepIndexMap[s.id] = idx; });

    // 3. Phân phối người tham gia hiện tại vào các bước
    // activeDistribution[i] = Số người ĐANG ĐỨNG TẠI bước i
    const activeDistribution = new Array(actionSteps.length).fill(0);
    
    participants.forEach(p => {
        const idx = stepIndexMap[p.stepId];
        if (idx !== undefined) {
            activeDistribution[idx]++;
        }
    });

    // 4. Tính toán lũy kế (Cumulative)
    let cumulativeCount = stats.completed || 0; 
    const funnelCounts = new Array(actionSteps.length).fill(0);

    for (let i = actionSteps.length - 1; i >= 0; i--) {
        cumulativeCount += activeDistribution[i];
        funnelCounts[i] = cumulativeCount;
    }

    // 5. Build Funnel Data
    return actionSteps.map((step, idx) => {
        const isEmail = step.type === 'action';
        const userCount = funnelCounts[idx]; 
        const waitingHere = activeDistribution[idx]; 

        let displayRate = 0;
        if (userCount > 0) {
            displayRate = isEmail ? realOpenRate : 100;
        }

        const style = getNodeStyle(step);

        return {
            id: step.id,
            type: step.type,
            stepLabel: style.label,
            label: step.label,
            users: userCount,
            waiting: waitingHere,
            rate: displayRate,
            style: style
        };
    });
  }, [flow.steps, stats, realOpenRate, participants]);

  useEffect(() => {
      fetchParticipants();
      fetchLogs();
  }, [flow.id]);

  const fetchParticipants = async () => {
      setLoadingList(true);
      const res = await api.get<any[]>(`flows?id=${flow.id}&route=participants`);
      if (res.success && Array.isArray(res.data)) {
          setParticipants(res.data);
      } else {
          setParticipants([]);
      }
      setLoadingList(false);
  };

  const fetchLogs = async () => {
      setLoadingLogs(true);
      const res = await api.get<any[]>(`flows?id=${flow.id}&route=history`);
      if (res.success && Array.isArray(res.data)) {
          setLogs(res.data);
      } else {
          setLogs([]);
      }
      setLoadingLogs(false);
  };

  const getStepName = (stepId: string) => {
      const s = flow.steps.find(x => x.id === stepId);
      return s ? s.label : 'Unknown Step';
  };

  const formatTime = (iso: string) => {
      if (!iso) return '--';
      return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
  };

  const calculateTimeRemaining = (dateStr: string) => {
      if (!dateStr) return '';
      const target = new Date(dateStr).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) return 'Sắp chạy ngay';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) return `Còn ${Math.floor(hours/24)} ngày`;
      if (hours > 0) return `Còn ${hours}h ${minutes}p`;
      return `Còn ${minutes} phút`;
  };

  const StatItem = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group cursor-default">
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{label}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
        {trend && <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-1.5 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>}
      </div>
      <div className={`w-12 h-12 ${color} rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-5 h-5"/>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 relative pb-20">
      
      {/* Real Stats Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-[#0f172a] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffa900] opacity-[0.08] rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                              <Target className="w-5 h-5 text-[#ffa900]" />
                          </div>
                          <h3 className="text-xl font-bold tracking-tight">Hiệu suất vận hành thực tế</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-2">Trigger kích hoạt</p>
                              {triggerStep ? (
                                  <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[10px] ${getNodeStyle(triggerStep).gradient}`}>
                                          {React.createElement(getNodeStyle(triggerStep).icon, { className: "w-3 h-3" })}
                                      </div>
                                      <p className="text-sm font-semibold text-slate-200">{triggerStep.label}</p>
                                  </div>
                              ) : (
                                  <p className="text-sm font-semibold text-slate-200">Chưa có</p>
                              )}
                          </div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-2">Đang xử lý (Active)</p>
                              <p className="text-sm font-semibold text-slate-200">{participants.length.toLocaleString()} khách hàng</p>
                          </div>
                      </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 min-w-[220px] text-center backdrop-blur-md">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-2">Đã hoàn tất Flow</p>
                      <p className="text-4xl font-bold text-[#ffa900] tracking-tighter">{completionRate}%</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">({stats.completed}/{stats.enrolled})</p>
                  </div>
              </div>
          </div>
          <div className="lg:col-span-1">
              <Card className="h-full rounded-[32px] border-slate-100 flex flex-col justify-center text-center p-6 bg-white">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-4xl font-bold text-slate-800">{realOpenRate}%</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tỷ lệ mở (Opened/Sent)</p>
              </Card>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem label="Tổng tham gia" value={(stats.enrolled || 0).toLocaleString()} icon={Users} color="bg-blue-600" />
        <StatItem label="Đã gửi (Emails)" value={(stats.totalSent || 0).toLocaleString()} icon={Mail} color="bg-[#ffa900]" />
        <StatItem label="Đã mở (Opens)" value={(stats.totalOpened || 0).toLocaleString()} icon={MailOpen} color="bg-indigo-600" />
        <StatItem label="Trạng thái" value={flow.status === 'active' ? 'LIVE' : 'OFF'} icon={Activity} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 space-y-8">
          
          {/* JOURNEY VISUALIZATION */}
          <Card className="rounded-[32px] border border-slate-100 shadow-sm overflow-hidden bg-white" noPadding>
             <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Hành trình khách hàng (Journey)</h3>
                    <p className="text-[10px] font-medium text-slate-400 italic mt-0.5">*Số liệu cộng dồn (Cumulative Flow)</p>
                </div>
             </div>
             
             <div className="p-8">
                {funnelData.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                        {funnelData.map((item, idx) => {
                            const Icon = item.style.icon;
                            return (
                                <div key={idx} className="relative group">
                                    {/* Timeline Connector Dot */}
                                    <div className={`absolute -left-[33px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center ${item.users > 0 ? 'bg-[#ffa900]' : 'bg-slate-200'}`}>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>

                                    {/* Step Card */}
                                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                                        
                                        {/* Left: Icon & Info */}
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${item.style.gradient} text-white shrink-0`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${item.style.bg} ${item.style.text}`}>
                                                        Step {idx + 1}: {item.style.label}
                                                    </span>
                                                    {item.waiting > 0 && (
                                                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md animate-pulse">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                            Processing: {item.waiting}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800">{item.label}</h4>
                                            </div>
                                        </div>

                                        {/* Right: Stats */}
                                        <div className="flex items-center gap-8 text-right">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Đã đi qua</p>
                                                <p className="text-lg font-black text-slate-800">{item.users.toLocaleString()}</p>
                                            </div>
                                            
                                            {/* Contextual Metric based on Type */}
                                            <div className="w-20">
                                                {item.type === 'action' && (
                                                    <>
                                                        <div className="flex justify-end items-center gap-1 mb-1">
                                                            <MailOpen className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-500">Open</span>
                                                        </div>
                                                        <div className="text-sm font-black text-[#ffa900]">{item.rate}%</div>
                                                    </>
                                                )}
                                                {item.type === 'wait' && (
                                                    <div className="flex flex-col items-end opacity-60">
                                                        <Clock className="w-4 h-4 text-slate-300 mb-1" />
                                                        <span className="text-[10px] font-bold text-slate-400">Delay</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-40">
                        <Activity className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu vận hành</p>
                    </div>
                )}
             </div>
          </Card>

          {/* PARTICIPANTS TABLE */}
          <Card className="rounded-[32px] border border-slate-100 shadow-sm overflow-hidden bg-white" noPadding>
             <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-800">Khách hàng đang xử lý ({participants.length})</h3>
                    <button onClick={fetchParticipants} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><RefreshCcw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} /></button>
                </div>
             </div>
             
             <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Khách hàng</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Bước hiện tại</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Thời gian chạy</th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400 text-right">Vào lúc</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loadingList ? (
                            <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">Đang tải danh sách...</td></tr>
                        ) : participants.length === 0 ? (
                            <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">Hiện không có khách nào đang chạy trong luồng.</td></tr>
                        ) : participants.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3">
                                    <p className="text-xs font-bold text-slate-700">{p.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-slate-400">{p.email}</p>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 w-fit">
                                            {getStepName(p.stepId)}
                                        </span>
                                        {p.status === 'waiting' && <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Waiting</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <CalendarClock className="w-3.5 h-3.5 text-indigo-500" />
                                        {formatTime(p.scheduledAt)}
                                    </div>
                                    <p className="text-[9px] text-indigo-600 font-medium pl-5">
                                        {calculateTimeRemaining(p.scheduledAt)}
                                    </p>
                                </td>
                                <td className="px-6 py-3 text-right text-[10px] font-mono text-slate-500">
                                    {formatTime(p.enteredAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="rounded-[32px] border border-slate-100 shadow-sm bg-white" title="Live Events">
              <div className="px-6 pb-2">
                  <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhật ký thực thi (Real-time)</span>
                      <button onClick={fetchLogs} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><RefreshCcw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} /></button>
                  </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {loadingLogs ? (
                      <p className="text-center py-10 text-[10px] text-slate-400 italic">Đang tải nhật ký...</p>
                  ) : logs.length === 0 ? (
                      <div className="text-center py-10 opacity-40">
                          <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-[10px] font-bold uppercase text-slate-400">Chưa có sự kiện nào</p>
                      </div>
                  ) : logs.map((log, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                              <p className="text-[11px] font-bold text-slate-700">{log.first_name} {log.last_name}</p>
                              <span className="text-[9px] font-mono text-slate-400">{new Date(log.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-0.5">{log.type.replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{log.details}</p>
                      </div>
                  ))}
              </div>
           </Card>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </div>
  );
};

export default FlowAnalyticsTab;