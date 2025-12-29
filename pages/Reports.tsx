import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Calendar, Download, TrendingUp, Users, MousePointerClick, Eye, Activity } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';

const Reports: React.FC = () => {
  // Mock Data
  const engagementData = [
    { name: 'T2', openRate: 45, clickRate: 12 },
    { name: 'T3', openRate: 52, clickRate: 15 },
    { name: 'T4', openRate: 48, clickRate: 10 },
    { name: 'T5', openRate: 61, clickRate: 22 },
    { name: 'T6', openRate: 55, clickRate: 18 },
    { name: 'T7', openRate: 40, clickRate: 8 },
    { name: 'CN', openRate: 38, clickRate: 5 },
  ];

  const MetricCard = ({ title, value, subValue, icon: Icon, color }: any) => (
    <Card className="hover:-translate-y-1 transition-transform duration-300 border-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
                <p className={`text-xs font-bold mt-2 flex items-center ${subValue.includes('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {subValue.includes('+') ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                    {subValue} so với tuần trước
                </p>
            </div>
            <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </Card>
  );

  return (
    <div className="animate-fade-in space-y-8">
      
      <PageHeader 
        title="Báo cáo & Phân tích" 
        description="Số liệu chi tiết về hiệu quả chiến dịch email marketing."
        breadcrumbs={['Trang chủ', 'Báo cáo']}
        action={
            <div className="flex gap-2">
                <Button variant="secondary" icon={Calendar} size="sm">7 ngày qua</Button>
                <Button variant="outline" icon={Download} size="sm">Xuất báo cáo</Button>
            </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard title="Tổng Email Đã Gửi" value="12,540" subValue="+12%" icon={Users} color="bg-blue-600" />
         <MetricCard title="Tỷ lệ Mở (Open Rate)" value="42.5%" subValue="+5.2%" icon={Eye} color="bg-[#ffa900]" />
         <MetricCard title="Tỷ lệ Click (CTR)" value="12.8%" subValue="-1.4%" icon={MousePointerClick} color="bg-[#ca7900]" />
         <MetricCard title="Hủy đăng ký" value="0.4%" subValue="-0.1%" icon={Activity} color="bg-rose-600" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Trend */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-100" title="Xu hướng tương tác">
            <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffa900" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ffa900" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2c3e50" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2c3e50" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="openRate" name="Tỷ lệ mở (%)" stroke="#ffa900" strokeWidth={3} fill="url(#colorOpen)" />
                        <Area type="monotone" dataKey="clickRate" name="Tỷ lệ click (%)" stroke="#2c3e50" strokeWidth={3} fill="url(#colorClick)" />
                        <Legend verticalAlign="top" height={36}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Top Performing Campaigns */}
        <Card title="Top Chiến Dịch" className="shadow-sm border border-slate-100">
            <div className="space-y-6 mt-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-[#ca7900] transition-colors">Newsletter Tuần {40 + i}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Open: {60 - i*5}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-[#ffa900] to-[#ca7900] h-2 rounded-full" style={{ width: `${60 - i*5}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                            <span>Đã gửi: 2,400</span>
                            <span>Click: {20 - i}%</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <Button variant="ghost" size="sm" className="w-full">Xem tất cả báo cáo</Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;