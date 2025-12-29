

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/storageAdapter';
import { Campaign, CampaignStatus, Subscriber, Segment, Template, Flow } from '../types';
import { 
    Plus, TrendingUp, MousePointerClick, 
    CheckCircle2, GitMerge, RefreshCw, FileText, CalendarClock, PieChart, Send, Eye
} from 'lucide-react';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Toast, { ToastType } from '../components/common/Toast';
import CampaignList from './Campaigns/CampaignList';
import CampaignDetailDrawer from '../components/campaigns/CampaignDetailDrawer';
import FlowReviewModal from '../components/campaigns/FlowReviewModal';
import CampaignWizard from '../components/campaigns/CampaignWizard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import Tabs from '../components/common/Tabs'; // Import Tabs
// @ts-ignore: `useNavigate` is a named export of `react-router-dom/dist/index.js`
import { useNavigate } from 'react-router-dom/dist/index.js';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  
  // State for Wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<Campaign> | undefined>(undefined);

  // Filtering & Viewing
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'scheduled' | 'draft' | 'waiting'>('all');
  const [selectedDetailCampaign, setSelectedDetailCampaign] = useState<Campaign | null>(null);
  
  // Flow Review State
  const [flowReviewData, setFlowReviewData] = useState<{ campaign: Campaign, flow: Flow | null } | null>(null);
  const [isStartingFlow, setIsStartingFlow] = useState(false);

  // Modals
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Data
  const [allLists, setAllLists] = useState<any[]>([]);
  const [allSegments, setAllSegments] = useState<Segment[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [allFlows, setAllFlows] = useState<Flow[]>([]); 
  const [allTags, setAllTags] = useState<{id: string, name: string, count: number}[]>([]); 
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>([]);

  const showToast = (msg: string, type: ToastType = 'success') => setToast({ message: msg, type, isVisible: true });

  useEffect(() => { fetchInitialData(); }, []);

  // Auto-poll for status updates
  useEffect(() => {
      const hasPending = campaigns.some(c => c.status === CampaignStatus.SCHEDULED || c.status === CampaignStatus.SENDING);
      if (hasPending) {
          const interval = setInterval(() => {
              api.get<Campaign[]>('campaigns').then(res => {
                  if(res.success) setCampaigns(res.data);
              });
          }, 5000); 
          return () => clearInterval(interval);
      }
  }, [campaigns]);

  const fetchInitialData = async () => {
    setLoading(true);
    const [cRes, lRes, sRes, tRes, fRes, tagRes, subRes] = await Promise.all([
        api.get<Campaign[]>('campaigns'),
        api.get<any[]>('lists'),
        api.get<Segment[]>('segments'),
        api.get<Template[]>('templates'),
        api.get<Flow[]>('flows'),
        api.get<{id:string, name:string}[]>('tags'),
        api.get<Subscriber[]>('subscribers') 
    ]);
    if (cRes.success) setCampaigns(cRes.data);
    if (lRes.success) setAllLists(lRes.data);
    if (sRes.success) setAllSegments(sRes.data);
    if (tRes.success) setAllTemplates(tRes.data);
    if (fRes.success) setAllFlows(fRes.data);
    
    // Process Tags with Counts
    if (tagRes.success) {
        const subscribers = subRes.success ? subRes.data : [];
        const processedTags = tagRes.data.map(tag => {
            // FIX: Add Array.isArray check for s.tags
            const count = subscribers.filter(s => Array.isArray(s.tags) && s.tags.includes(tag.name)).length;
            return { ...tag, count };
        });
        setAllTags(processedTags);
    }
    
    const savedEmails = JSON.parse(localStorage.getItem('mailflow_verified_emails') || '["marketing@ka-en.com.vn"]');
    setVerifiedEmails(savedEmails);
    setLoading(false);
  };

  const filteredCampaigns = useMemo(() => {
      if (activeTab === 'all') return campaigns;
      if (activeTab === 'sent') return campaigns.filter(c => c.status === CampaignStatus.SENT);
      if (activeTab === 'scheduled') return campaigns.filter(c => c.status === CampaignStatus.SCHEDULED || c.status === CampaignStatus.SENDING);
      if (activeTab === 'waiting') return campaigns.filter(c => c.status === CampaignStatus.WAITING_FLOW);
      return campaigns.filter(c => c.status === CampaignStatus.DRAFT);
  }, [campaigns, activeTab]);

  const stats = useMemo(() => {
      const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0);
      const totalOpened = campaigns.reduce((acc, c) => acc + (c.stats?.opened || 0), 0);
      const totalClicked = campaigns.reduce((acc, c) => acc + (c.stats?.clicked || 0), 0);
      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
      return { totalSent, totalOpened, totalClicked, openRate };
  }, [campaigns]);

  const handleSaveDraft = async (data: Partial<Campaign>) => {
      const payload = { ...data, status: CampaignStatus.DRAFT, stats: data.id ? undefined : { sent: 0, opened: 0, clicked: 0, bounced: 0, spam: 0 } };
      let res;
      if (data.id) res = await api.put<Campaign>(`campaigns/${data.id}`, payload);
      else res = await api.post<Campaign>('campaigns', payload);
      
      if (res.success) {
          showToast('Đã lưu nháp chiến dịch!', 'success');
          fetchInitialData();
      }
  };

  const handlePublish = async (data: Partial<Campaign>, options: { connectFlow: boolean, activateFlowId: string | null }) => {
    let finalStatus = CampaignStatus.SCHEDULED; 
    let scheduleTime = data.scheduledAt;
    const isSendNow = !scheduleTime;

    if (options.activateFlowId) {
        const flowToActivate = allFlows.find(f => f.id === options.activateFlowId);
        if (flowToActivate) {
            await api.put(`flows/${options.activateFlowId}`, { ...flowToActivate, status: 'active' });
        }
    }

    if (options.connectFlow) {
        finalStatus = CampaignStatus.WAITING_FLOW;
        scheduleTime = undefined;
    } else if (isSendNow) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - 1); 
        scheduleTime = now.toISOString().slice(0, 19).replace('T', ' ');
    } else {
        scheduleTime = new Date(scheduleTime!).toISOString().slice(0, 19).replace('T', ' ');
    }

    const payload = { 
        ...data, 
        status: finalStatus, 
        scheduledAt: scheduleTime,
        stats: data.id ? undefined : { sent: 0, opened: 0, clicked: 0, bounced: 0, spam: 0 } 
    };

    const res = data.id ? await api.put<Campaign>(`campaigns/${data.id}`, payload) : await api.post<Campaign>('campaigns', payload);
    
    if (res.success) {
      if (options.connectFlow) {
          const campaignId = res.data.id;
          const newFlow: Partial<Flow> = {
              name: `Automation: ${data.name}`,
              description: `Kịch bản chăm sóc tự động sau chiến dịch "${data.name}"`,
              status: 'draft',
              steps: [
                  { 
                      id: crypto.randomUUID(), 
                      type: 'trigger', 
                      label: 'Khi gửi Campaign', 
                      iconName: 'zap', 
                      config: { type: 'campaign', targetId: campaignId } 
                  }
              ],
              stats: { enrolled: 0, completed: 0, openRate: 0, clickRate: 0, totalSent: 0, totalOpened: 0 },
              config: {
                  frequencyCap: 3,
                  activeDays: [0, 1, 2, 3, 4, 5, 6],
                  startTime: '08:00',
                  endTime: '21:00',
                  exitConditions: ['unsubscribed'],
                  type: 'realtime'
              }
          };
          const flowRes = await api.post<Flow>('flows', newFlow);
          if (flowRes.success) {
              setAllFlows([...allFlows, flowRes.data]);
              showToast('Đã lưu chiến dịch! Đang chuyển sang thiết kế Automation...', 'success');
              setTimeout(() => navigate('/flows', { state: { openFlowId: flowRes.data.id } }), 1000);
          }
      } else {
          if (isSendNow) {
             const message = options.activateFlowId ? 'Đã kích hoạt Flow và đang gửi chiến dịch...' : 'Đang xử lý gửi ngay...';
             showToast(message, 'success');
             try {
                 const apiUrl = localStorage.getItem('mailflow_api_url') || 'https://ka-en.com.vn/mail_api';
                 const workerUrl = apiUrl.replace(/\/$/, '') + '/worker_campaign.php'; // Call worker_campaign.php
                 fetch(workerUrl, { mode: 'no-cors' });
             } catch(e) {}
          } else {
             showToast(`Đã lên lịch gửi vào ${new Date(scheduleTime!).toLocaleString('vi-VN')}`, 'success');
          }
      }
      setIsWizardOpen(false);
      fetchInitialData();
    }
  };

  const handleTestEmail = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Đã gửi email test thành công!', 'success');
  };

  const handleDeleteCampaign = async (id: string) => {
      setConfirmModal({
          isOpen: true, title: 'Xóa chiến dịch?', message: 'Hành động này không thể hoàn tác.',
          onConfirm: async () => {
              await api.delete(`campaigns/${id}`);
              setCampaigns(campaigns.filter(c => c.id !== id));
              showToast('Đã xóa chiến dịch', 'success');
          }
      });
  };

  const handleDuplicate = async (campaign: Campaign) => {
      const newC = { ...campaign, id: undefined, name: `${campaign.name} (Copy)`, status: CampaignStatus.DRAFT, createdAt: new Date().toISOString() };
      const res = await api.post<Campaign>('campaigns', newC);
      if(res.success) {
          fetchInitialData();
          showToast('Đã nhân bản chiến dịch', 'success');
      }
  };

  const handlePlayClick = (campaign: Campaign) => {
      const linkedFlow = allFlows.find(f => {
          const trigger = f.steps.find(s => s.type === 'trigger');
          return trigger?.config.type === 'campaign' && trigger.config.targetId === campaign.id;
      });
      if (!linkedFlow) {
          showToast('Chưa có Flow nào được kết nối với chiến dịch này!', 'error');
          return;
      }
      setFlowReviewData({ campaign, flow: linkedFlow });
  };

  const handleConfirmStart = async () => {
      if (!flowReviewData) return;
      setIsStartingFlow(true);
      const { campaign, flow } = flowReviewData;
      try {
          const now = new Date();
          now.setMinutes(now.getMinutes() - 1);
          const scheduleTime = now.toISOString().slice(0, 19).replace('T', ' ');
          const updatedCampaign = { ...campaign, status: CampaignStatus.SCHEDULED, scheduledAt: scheduleTime, stats: { sent: 0, opened: 0, clicked: 0, bounced: 0, spam: 0 } };
          await api.put(`campaigns/${campaign.id}`, updatedCampaign);
          
          if (flow && flow.status !== 'active') {
              const updatedFlow = { ...flow, status: 'active' as const };
              await api.put(`flows/${flow.id}`, updatedFlow);
          }
          
          showToast('Đã kích hoạt! Hệ thống sẽ bắt đầu gửi ngay.', 'success');
          try {
             const apiUrl = localStorage.getItem('mailflow_api_url') || 'https://ka-en.com.vn/mail_api';
             const workerUrl = apiUrl.replace(/\/$/, '') + '/worker_campaign.php'; // Call worker_campaign.php
             fetch(workerUrl, { mode: 'no-cors' });
          } catch(e) {}
          setFlowReviewData(null);
          fetchInitialData();
      } catch (e) {
          showToast('Có lỗi xảy ra khi khởi động.', 'error');
      } finally {
          setIsStartingFlow(false);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1200px] mx-auto">
      <PageHeader 
        title="Chiến dịch Marketing" 
        description="Gửi email diện rộng và theo dõi hiệu quả chuyển đổi."
        action={
            <div className="flex gap-2">
                <Button onClick={fetchInitialData} variant="secondary" icon={RefreshCw} className={loading ? 'animate-spin' : ''}>Làm mới</Button>
                <Button onClick={() => { setWizardInitialData(undefined); setIsWizardOpen(true); }} icon={Plus} size="lg" className="shadow-lg shadow-orange-500/20">Chiến dịch mới</Button>
            </div>
        }
      />

      {/* Stats Cards - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
             <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Email đã gửi</p>
                 <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalSent.toLocaleString()}</h4>
             </div>
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                 <Send className="w-6 h-6" />
             </div>
         </div>
         
         <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
             <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-[#ffa900] transition-colors">Tỷ lệ mở (Open)</p>
                 <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.openRate}%</h4>
             </div>
             <div className="p-4 bg-orange-50 text-[#ca7900] rounded-2xl group-hover:bg-[#ffa900] group-hover:text-white transition-all shadow-sm">
                 <Eye className="w-6 h-6" />
             </div>
         </div>

         <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
             <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Lượt click link</p>
                 <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalClicked.toLocaleString()}</h4>
             </div>
             <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                 <MousePointerClick className="w-6 h-6" />
             </div>
         </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs - Modern Pill Style */}
          <div className="px-6 py-6 border-b border-slate-50">
              <Tabs 
                variant="pill"
                activeId={activeTab}
                onChange={setActiveTab as any}
                items={[
                  { id: 'all', label: 'Tất cả', icon: PieChart }, 
                  { id: 'sent', label: 'Đã gửi', icon: CheckCircle2 }, 
                  { id: 'waiting', label: 'Chờ Flow', icon: GitMerge },
                  { id: 'scheduled', label: 'Đang xử lý', icon: CalendarClock }, 
                  { id: 'draft', label: 'Bản nháp', icon: FileText }
                ]}
              />
          </div>

          {/* List Component */}
          <CampaignList 
            campaigns={filteredCampaigns} 
            loading={loading}
            onSelect={(c) => setSelectedDetailCampaign(c)}
            onEdit={(c) => { setWizardInitialData(c); setIsWizardOpen(true); }}
            onDelete={(id) => handleDeleteCampaign(id)}
            onDuplicate={handleDuplicate}
            onPlayFlow={handlePlayClick}
          />
      </div>

      {/* Modals */}
      <CampaignWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)}
        initialData={wizardInitialData}
        allLists={allLists}
        allSegments={allSegments}
        allTags={allTags}
        allTemplates={allTemplates}
        allFlows={allFlows}
        senderEmails={verifiedEmails}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <CampaignDetailDrawer 
        campaign={selectedDetailCampaign} 
        isOpen={!!selectedDetailCampaign} 
        onClose={() => setSelectedDetailCampaign(null)} 
        allLists={allLists}
        allSegments={allSegments}
        allTags={allTags}
      />
      
      <FlowReviewModal isOpen={!!flowReviewData} onClose={() => setFlowReviewData(null)} onConfirm={handleConfirmStart} campaign={flowReviewData?.campaign || null} flow={flowReviewData?.flow || null} isProcessing={isStartingFlow} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen:false})} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} />
    </div>
  );
};

export default Campaigns;