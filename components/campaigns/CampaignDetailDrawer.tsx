
import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Calendar, Send, MousePointerClick, Eye, ShieldCheck, Mail, 
    BarChart2, Layers, List, CheckCircle2, AlertOctagon, UserMinus, 
    ExternalLink, MousePointer2, RefreshCw, Clock, History, Activity, Tag, Users, Zap
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { Campaign, CampaignStatus, Segment } from '../../types';
import Badge from '../common/Badge';
import Card from '../common/Card';
import Tabs from '../common/Tabs';
import { api } from '../../services/storageAdapter';

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  allLists: any[];
  allSegments: Segment[];
  allTags: any[];
}

const CampaignDetailDrawer: React.FC<CampaignDetailDrawerProps> = ({ 
    campaign, isOpen, onClose, allLists, allSegments, allTags 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
      if (campaign && isOpen && activeTab === 'activity') {
          fetchLogs();
      }
  }, [campaign, isOpen, activeTab]);

  const fetchLogs = async () => {
      if (!campaign) return;
      setLoadingLogs(true);
      // Reuse flow history API which filters by reference_id (Campaign ID)
      const res = await api.get<any[]>(`flows?route=history&id=${campaign.id}`);
      if (res.success) {
          setActivityLogs(res.data);
      }
      setLoadingLogs(false);
  };

  if (!campaign) return null;

  const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0, bounced: 0, spam: 0 };
  
  // Real Calculations
  const isSent = campaign.status === CampaignStatus.SENT;
  const sentCount = stats.sent || 0;
  const deliveredCount = Math.max(0, sentCount - (stats.bounced || 0));
  
  const openRate = sentCount > 0 ? ((stats.opened / sentCount) * 100).toFixed(1) : "0.0";
  const clickRate = sentCount > 0 ? ((stats.clicked / sentCount) * 100).toFixed(1) : "0.0";
  const clickToOpenRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : "0.0";
  
  const bounceRate = sentCount > 0 ? ((stats.bounced / sentCount) * 100).toFixed(2) : "0.00";
  const spamRate = sentCount > 0 ? ((stats.spam / sentCount) * 100).toFixed(2) : "0.00";
  const deliveryRate = sentCount > 0 ? ((deliveredCount / sentCount) * 100).toFixed(1) : "0.0";

  // Data for Funnel Chart
  const funnelData = [
    { name: 'Đã gửi (Sent)', value: sentCount, fill: '#94a3b8', icon: Send },
    { name: 'Đã nhận (Delivered)', value: deliveredCount, fill: '#3b82f6', icon: CheckCircle2 },
    { name: 'Đã mở (Opened)', value: stats.opened, fill: '#ffa900', icon: Eye },
    { name: 'Đã click (Clicked)', value: stats.clicked, fill: '#10b981', icon: MousePointer2 },
  ];

  // Data for Health Pie Chart
  const healthData = [
      { name: 'Hộp thư chính', value: deliveredCount, fill: '#10b981' },
      { name: 'Trả lại (Bounce)', value: stats.bounced, fill: '#f43f5e' },
      { name: 'Báo cáo Spam', value: stats.spam, fill: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Audience Details
  const targetLists = campaign.target?.listIds.map(id => allLists.find(l => l.id === id)).filter(Boolean) || [];
  const targetSegments = campaign.target?.segmentIds.map(id => allSegments.find(s => s.id === id)).filter(Boolean) || [];
  const targetTags = campaign.target?.tagIds?.map(name => allTags.find(t => t.name === name)).filter(Boolean) || [];
  
  const totalAudience = targetLists.reduce((acc, l) => acc + (l.count || 0), 0) + 
                        targetSegments.reduce((acc, s) => acc + (s.count || 0), 0) +
                        targetTags.reduce((acc, t) => acc + (t.count || 0), 0);

  const StatBox = ({ label, value, subValue, icon: Icon, colorClass, bgClass }: any) => (
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${bgClass} ${colorClass} opacity-20`}>
              <Icon className="w-6 h-6" />
          </div>
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{value}</h3>
          </div>
          {subValue && (
              <div className="flex items-center gap-1.5 mt-2">
                  <span className={`text-xs font-bold ${colorClass}`}>{subValue}</span>
              </div>
          )}
      </div>
  );

  return (
    <div className={`fixed inset-0 z-[150] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-6xl bg-[#f8fafc] shadow-2xl h-full flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-start shrink-0 shadow-sm z-20">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant={isSent ? 'success' : (campaign.status === CampaignStatus.SCHEDULED ? 'info' : 'neutral')} className="uppercase px-2.5 py-1 text-[10px]">
                        {campaign.status === CampaignStatus.WAITING_FLOW ? 'Waiting Flow' : campaign.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {campaign.sentAt ? `Gửi lúc: ${new Date(campaign.sentAt).toLocaleString('vi-VN')}` : (campaign.scheduledAt ? `Dự kiến: ${new Date(campaign.scheduledAt).toLocaleString('vi-VN')}` : 'Bản nháp')}
                    </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight max-w-2xl truncate">{campaign.name}</h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-2 bg-white border-b border-slate-100">
            <Tabs 
                activeId={activeTab} 
                onChange={setActiveTab} 
                items={[
                    { id: 'overview', label: 'Báo cáo Hiệu quả', icon: BarChart2 },
                    { id: 'audience', label: 'Đối tượng Gửi', icon: Users, count: totalAudience },
                    { id: 'activity', label: 'Hoạt động Live', icon: Activity },
                ]} 
            />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#f8fafc]">
            
            {activeTab === 'overview' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                    
                    {/* 1. KEY METRICS ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatBox 
                            label="Tỷ lệ Mở (Open Rate)" 
                            value={`${openRate}%`} 
                            subValue={`${stats.opened.toLocaleString()} lượt mở`}
                            icon={Eye} 
                            colorClass="text-[#ffa900]" 
                            bgClass="bg-orange-50"
                        />
                        <StatBox 
                            label="Tỷ lệ Click (CTR)" 
                            value={`${clickRate}%`} 
                            subValue={`${stats.clicked.toLocaleString()} lượt nhấn`}
                            icon={MousePointerClick} 
                            colorClass="text-emerald-500" 
                            bgClass="bg-emerald-50"
                        />
                        <StatBox 
                            label="Click / Open (CTOR)" 
                            value={`${clickToOpenRate}%`} 
                            subValue="Chất lượng nội dung"
                            icon={Activity} 
                            colorClass="text-blue-500" 
                            bgClass="bg-blue-50"
                        />
                        <StatBox 
                            label="Tỷ lệ Gửi thành công" 
                            value={`${deliveryRate}%`} 
                            subValue={`${deliveredCount.toLocaleString()} / ${sentCount.toLocaleString()}`}
                            icon={CheckCircle2} 
                            colorClass="text-indigo-500" 
                            bgClass="bg-indigo-50"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* 2. CONVERSION FUNNEL (LEFT - 2 COLS) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-slate-100 shadow-sm min-h-[400px]" noPadding>
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Phễu chuyển đổi (Funnel)</h3>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Hành trình tương tác của khách hàng</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Legend */}
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"></div><span className="text-[10px] font-bold text-slate-500">Sent</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ffa900]"></div><span className="text-[10px] font-bold text-slate-500">Open</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-500">Click</span></div>
                                    </div>
                                </div>
                                <div className="p-6 h-[320px]">
                                    {stats.sent > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={120} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: '#f8fafc'}}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                                                    {funnelData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <BarChart2 className="w-12 h-12 mb-3 opacity-50" />
                                            <p className="text-xs font-bold">Chưa có dữ liệu</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Detailed List */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {funnelData.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-500"><item.icon className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.name.split(' (')[0]}</p>
                                            <p className="text-sm font-black text-slate-800">{item.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. HEALTH & DELIVERY (RIGHT - 1 COL) */}
                        <div className="space-y-6">
                            <Card className="border-slate-100 shadow-sm" noPadding>
                                <div className="p-6 border-b border-slate-50">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sức khỏe gửi tin
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="h-40 relative">
                                        {stats.sent > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={healthData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={60}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {healthData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">Chưa có dữ liệu</div>
                                        )}
                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xl font-black text-slate-800">{deliveryRate}%</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Success</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                <span className="text-slate-600 font-bold">Email hỏng (Bounce)</span>
                                            </div>
                                            <span className="font-mono font-bold text-rose-500">{bounceRate}% ({stats.bounced})</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-slate-600 font-bold">Báo cáo Spam</span>
                                            </div>
                                            <span className="font-mono font-bold text-amber-500">{spamRate}% ({stats.spam})</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="p-5 bg-blue-50 border border-blue-100 rounded-[24px] relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-3">Thông tin gửi</h4>
                                <div className="space-y-2 text-[11px]">
                                    <div className="flex justify-between">
                                        <span className="text-blue-600/70 font-bold">Subject:</span>
                                        <span className="text-blue-900 font-bold truncate max-w-[150px]">{campaign.subject}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-600/70 font-bold">From:</span>
                                        <span className="text-blue-900 font-bold">{campaign.senderEmail}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-600/70 font-bold">Tracking:</span>
                                        <span className="text-blue-900 font-bold">{campaign.trackingEnabled ? 'ON' : 'OFF'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'audience' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                    <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-[24px] shadow-lg">
                        <div className="p-3 bg-white/10 rounded-xl text-[#ffa900]"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tổng khách hàng mục tiêu (Reach)</p>
                            <p className="text-2xl font-black">{totalAudience.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Danh sách & Phân khúc chi tiết</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {targetLists.map(l => (
                                <div key={l.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><List className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{l.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Static List</p>
                                        </div>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{l.count.toLocaleString()}</span>
                                </div>
                            ))}

                            {targetSegments.map(s => (
                                <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100"><Layers className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Segment</p>
                                        </div>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{s.count.toLocaleString()}</span>
                                </div>
                            ))}

                            {targetTags.map(t => (
                                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Tag className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{t.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tag Group</p>
                                        </div>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{t.count.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        
                        {totalAudience === 0 && (
                            <div className="text-center py-10 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                <AlertOctagon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="text-xs font-bold text-slate-400">Chưa có đối tượng nào được chọn hoặc danh sách trống.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#ffa900]" /> Nhật ký tương tác
                        </h4>
                        <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <Card noPadding className="border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loadingLogs ? (
                                        <tr><td colSpan={4} className="py-20 text-center text-slate-400 text-xs font-medium italic">Đang tải dữ liệu...</td></tr>
                                    ) : activityLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <History className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                                <p className="text-xs font-bold text-slate-400 uppercase">Chưa có hoạt động nào</p>
                                                <p className="text-[10px] text-slate-300 mt-1">Dữ liệu sẽ xuất hiện khi khách hàng mở mail hoặc click link.</p>
                                            </td>
                                        </tr>
                                    ) : activityLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{log.first_name} {log.last_name}</span>
                                                    <span className="text-[10px] text-slate-400">{log.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {log.type === 'open_email' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-wide">
                                                        <Eye className="w-3 h-3" /> Opened
                                                    </span>
                                                )}
                                                {log.type === 'click_link' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-wide">
                                                        <MousePointer2 className="w-3 h-3" /> Clicked
                                                    </span>
                                                )}
                                                {log.type === 'unsubscribe' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-wide">
                                                        <UserMinus className="w-3 h-3" /> Unsub
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]">{log.details || '--'}</p>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.created_at).toLocaleString('vi-VN')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailDrawer;
