
import React from 'react';
import { Users, MailCheck, MousePointerClick, Activity, TrendingUp } from 'lucide-react';

interface StatsGridProps {
  stats: {
    totalSubscribers: number;
    totalSent: number;
    avgOpenRate: number;
  };
  loading: boolean;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp, loading }: any) => (
  <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ffa900] to-[#ca7900] opacity-5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-[#fff4e0] group-hover:text-[#ca7900] group-hover:scale-110 transition-all duration-500">
        <Icon className="w-6 h-6" />
      </div>
      <span className={`flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
        {trend}
      </span>
    </div>
    <div className="relative z-10">
       <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{loading ? '...' : value}</h3>
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{title}</p>
    </div>
  </div>
);

const StatsGrid: React.FC<StatsGridProps> = ({ stats, loading }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Người đăng ký" value={stats.totalSubscribers.toLocaleString()} icon={Users} trend="+12%" trendUp={true} loading={loading} />
    <StatCard title="Email đã gửi" value={stats.totalSent.toLocaleString()} icon={MailCheck} trend="+5.4%" trendUp={true} loading={loading} />
    <StatCard title="Tỷ lệ mở TB" value={`${stats.avgOpenRate}%`} icon={Activity} trend="-2.1%" trendUp={false} loading={loading} />
    <StatCard title="Lượt click" value="1,294" icon={MousePointerClick} trend="+8%" trendUp={true} loading={loading} />
  </div>
);

export default StatsGrid;
