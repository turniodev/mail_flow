
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, FileText, PauseCircle, PlayCircle, LayoutGrid, Clock, Filter, ChevronDown, Check } from 'lucide-react';
import { api } from '../services/storageAdapter';
import { logAction, getLogs, HistoryLog } from '../services/historyService';
import { validateFlow, ValidationError } from '../services/flowValidationService';
import { Flow, FlowStep, Campaign, Segment, FormDefinition, PurchaseEvent, CustomEvent } from '../types';

import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import FlowCard from '../components/flows/FlowCard';
import FlowBuilderTab from '../components/flows/tabs/FlowBuilderTab';
import FlowAnalyticsTab from '../components/flows/tabs/FlowAnalyticsTab';
import FlowSettingsTab from '../components/flows/tabs/FlowSettingsTab';
import StepEditor from '../components/flows/modals/StepEditor';
import FlowCreationModal from '../components/flows/modals/FlowCreationModal';
import AddStepModal from '../components/flows/modals/AddStepModal';
import Toast, { ToastType } from '../components/common/Toast';
import FlowEmptyState from '../components/flows/FlowEmptyState';
import FlowHeader from '../components/flows/builder/FlowHeader';
import FlowSidebar from '../components/flows/builder/FlowSidebar';
import ConfirmationModal from '../components/common/ConfirmationModal';
import Tabs from '../components/common/Tabs'; // Import Tabs
// @ts-ignore: `useLocation` is a named export of `react-router-dom/dist/index.js`
import { useLocation } from 'react-router-dom/dist/index.js';

type FlowFilter = 'all' | 'active' | 'draft' | 'paused' | 'archived';
type TriggerTypeFilter = 'all' | 'segment' | 'date' | 'campaign' | 'form' | 'tag';
type FlowViewTab = 'builder' | 'analytics' | 'settings';

const Flows: React.FC = () => {
  const location = useLocation();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]); 
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [purchaseEvents, setPurchaseEvents] = useState<PurchaseEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [flowViewTab, setFlowViewTab] = useState<FlowViewTab>('builder');
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Filters - Changed default to 'active'
  const [activeTab, setActiveTab] = useState<FlowFilter>('active');
  const [filterType, setFilterType] = useState<TriggerTypeFilter>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [addStepContext, setAddStepContext] = useState<{ parentId: string; branch?: 'yes' | 'no' | 'A' | 'B'; isInsert?: boolean } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' 
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message: message, type: type, isVisible: true });

  useEffect(() => { 
    loadData();
    setHistoryLogs(getLogs());
  }, []);

  useEffect(() => {
    if (selectedFlow) {
        // Pass all flows to validation service to resolve linked flows
        const errors = validateFlow(selectedFlow, flows);
        setValidationErrors(errors);
    } else {
        setValidationErrors([]);
    }
  }, [selectedFlow, flows]);

  useEffect(() => {
      if (location.state?.openFlowId && flows.length > 0) {
          const targetFlow = flows.find(f => f.id === location.state.openFlowId);
          if (targetFlow) {
              setSelectedFlow(JSON.parse(JSON.stringify(targetFlow)));
              setFlowViewTab('builder');
              window.history.replaceState({}, document.title);
          }
      }
  }, [flows, location.state]);

  const loadData = async () => {
    setLoading(true);
    const [flowsRes, campaignsRes, formsRes, purchRes, customRes] = await Promise.all([
        api.get<Flow[]>('flows'), 
        api.get<Campaign[]>('campaigns'),
        api.get<FormDefinition[]>('forms'),
        api.get<PurchaseEvent[]>('purchase_events'),
        api.get<CustomEvent[]>('custom_events')
    ]);
    if (flowsRes.success) setFlows(flowsRes.data);
    if (campaignsRes.success) setCampaigns(campaignsRes.data);
    if (formsRes.success) setForms(formsRes.data);
    if (purchRes.success) setPurchaseEvents(purchRes.data);
    if (customRes.success) setCustomEvents(customRes.data);
    setLoading(false);
  };

  const filteredFlows = useMemo(() => {
    let result = flows;

    // 1. Status Filter
    if (activeTab === 'all') {
        result = result.filter(f => f.status !== 'archived');
    } else {
        result = result.filter(f => f.status === activeTab);
    }

    // 2. Trigger Type Filter
    if (filterType !== 'all') {
        result = result.filter(f => {
            const trigger = f.steps?.find(s => s.type === 'trigger');
            const type = trigger?.config?.type || 'segment';
            return type === filterType;
        });
    }

    return result;
  }, [flows, activeTab, filterType]);

  const handleUpdateFlow = async (updated: Flow, isSilent = true, logMsg?: string) => {
    if (!isSilent) setIsSaving(true);
    
    // Update main list immediately for UI responsiveness
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
    
    if (selectedFlow && selectedFlow.id === updated.id) {
        setSelectedFlow(updated);
    }

    await api.put(`flows/${updated.id}`, updated);
    
    if (logMsg) {
        const newLogs = logAction(logMsg, `Flow: ${updated.name}`);
        setHistoryLogs(newLogs);
    }
    if (!isSilent) setTimeout(() => setIsSaving(false), 500);
  };

  const handleRestoreFlow = async (flow: Flow) => {
      const updated = { ...flow, status: 'paused' as const, archivedAt: undefined };
      await api.put(`flows/${flow.id}`, updated);
      const newLogs = logAction("Khôi phục kịch bản", flow.name);
      setHistoryLogs(newLogs);
      showToast('Đã khôi phục kịch bản. Hãy kích hoạt lại để chạy.');
      loadData();
  };

  const handleDeleteFlow = (flow: Flow, permanent = false) => {
    if (permanent) {
        setConfirmModal({
            isOpen: true, title: 'Xóa vĩnh viễn?', message: 'Hành động này sẽ xóa sạch mọi dữ liệu liên quan.', variant: 'danger',
            onConfirm: async () => { await api.delete(`flows/${flow.id}`); logAction("Xóa vĩnh viễn kịch bản", flow.name); showToast('Đã xóa vĩnh viễn kịch bản.'); loadData(); }
        });
        return;
    }
    const isActive = flow.status === 'active';
    setConfirmModal({
        isOpen: true, title: isActive ? 'Kịch bản đang chạy!' : 'Xóa vào thùng rác?',
        message: isActive ? 'Nếu xóa, hệ thống sẽ ngừng xử lý các email đang chờ.' : 'Kịch bản sẽ được giữ trong thùng rác 30 ngày.',
        variant: isActive ? 'danger' : 'warning',
        onConfirm: async () => {
            const updated = { ...flow, status: 'archived' as const, archivedAt: new Date().toISOString() };
            await api.put(`flows/${flow.id}`, updated);
            logAction("Chuyển vào thùng rác", flow.name);
            showToast('Đã chuyển vào thùng rác.');
            loadData();
        }
    });
  };

  const handleAddStep = (type: any) => {
      if (!selectedFlow || !addStepContext) return;
      const { parentId, branch, isInsert } = addStepContext;
      const newStepId = crypto.randomUUID();
      const parentStep = selectedFlow.steps?.find(s => s.id === parentId);
      if (!parentStep) return;

      const getLabel = (t: string) => {
          switch(t) {
              case 'action': return 'Gửi Email';
              case 'wait': return 'Chờ đợi';
              case 'condition': return 'Kiểm tra';
              case 'split_test': return 'A/B Test';
              case 'link_flow': return 'Chuyển Flow';
              case 'remove_action': return 'Dọn dẹp';
              case 'update_tag': return 'Gắn nhãn';
              case 'list_action': return 'Cập nhật List';
              default: return 'Bước mới';
          }
      };

      const getIcon = (t: string): any => {
          switch(t) {
              case 'action': return 'mail';
              case 'wait': return 'clock';
              case 'condition': return 'git-merge';
              case 'split_test': return 'beaker';
              case 'link_flow': return 'link';
              case 'remove_action': return 'user-minus';
              case 'update_tag': return 'tag';
              case 'list_action': return 'list';
              default: return 'zap';
          }
      };

      const newStep: FlowStep = {
          id: newStepId, 
          type,
          label: getLabel(type),
          iconName: getIcon(type),
          config: {}
      };

      let updatedSteps = [...(selectedFlow.steps || []), newStep];
      let updatedParent = { ...parentStep };
      const linkKey = branch === 'yes' ? 'yesStepId' : (branch === 'no' ? 'noStepId' : (branch === 'A' ? 'pathAStepId' : (branch === 'B' ? 'pathBStepId' : 'nextStepId')));
      const oldNextId = (updatedParent as any)[linkKey];
      (updatedParent as any)[linkKey] = newStepId;
      if (isInsert && oldNextId) newStep.nextStepId = oldNextId;
      updatedSteps = updatedSteps.map(s => s.id === parentId ? updatedParent : s);
      handleUpdateFlow({ ...selectedFlow, steps: updatedSteps }, false, `Thêm bước ${newStep.label}`);
      
      // Removed auto-open modal for editingStep as requested
      // if (['action', 'condition', 'update_tag', 'split_test', 'link_flow', 'remove_action', 'list_action'].includes(type)) setEditingStep(newStep);
  };

  const handleQuickAddWait = (parentId: string, branch?: any) => {
      if (!selectedFlow) return;
      const parentStep = selectedFlow.steps?.find(s => s.id === parentId);
      if (!parentStep) return;
      const newStepId = crypto.randomUUID();
      const newStep: FlowStep = { id: newStepId, type: 'wait', label: 'Chờ 1 ngày', iconName: 'clock', config: { duration: 1, unit: 'days' } };
      let updatedSteps = [...(selectedFlow.steps || []), newStep];
      let updatedParent = { ...parentStep };
      const linkKey = branch === 'yes' ? 'yesStepId' : (branch === 'no' ? 'noStepId' : (branch === 'A' ? 'pathAStepId' : (branch === 'B' ? 'pathBStepId' : 'nextStepId')));
      const oldNextId = (updatedParent as any)[linkKey];
      (updatedParent as any)[linkKey] = newStepId;
      if (oldNextId) newStep.nextStepId = oldNextId;
      updatedSteps = updatedSteps.map(s => s.id === parentId ? updatedParent : s);
      handleUpdateFlow({ ...selectedFlow, steps: updatedSteps }, false, "Thêm bước Chờ nhanh");
  };

  const handleDeleteStep = (stepId: string) => {
      if (!selectedFlow) return;
      const steps = selectedFlow.steps || [];
      const stepToDelete = steps.find(s => s.id === stepId);
      if (!stepToDelete) return;

      // Smart Delete Logic: Find the child of the deleted step to bridge the gap
      // Only bridge for simple steps (Action, Wait, Tag, Link, List) that have a single output
      let bridgeId: string | undefined = undefined;
      if (['action', 'wait', 'update_tag', 'trigger', 'list_action'].includes(stepToDelete.type)) {
          bridgeId = stepToDelete.nextStepId;
      }
      // For conditions/split tests, bridging is ambiguous, so we break the link (bridgeId = undefined)

      const updatedSteps = steps.filter(s => s.id !== stepId).map(s => {
          const newS = { ...s };
          // If the parent pointed to the deleted step, point it to the bridgeId instead
          if (newS.nextStepId === stepId) newS.nextStepId = bridgeId;
          if (newS.yesStepId === stepId) newS.yesStepId = bridgeId;
          if (newS.noStepId === stepId) newS.noStepId = bridgeId;
          if (newS.pathAStepId === stepId) newS.pathAStepId = bridgeId;
          if (newS.pathBStepId === stepId) newS.pathBStepId = bridgeId;
          return newS;
      });

      handleUpdateFlow({ ...selectedFlow, steps: updatedSteps }, false, `Xóa bước ${stepToDelete?.label}`);
      setEditingStep(null);
  };

  const triggerTypes = [
      { id: 'all', label: 'Tất cả loại' },
      { id: 'campaign', label: 'Chiến dịch' },
      { id: 'segment', label: 'Phân khúc' },
      { id: 'date', label: 'Ngày/Sự kiện' },
      { id: 'form', label: 'Form submit' },
      { id: 'tag', label: 'Gắn Tag' },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Corrected PageHeader fix: only one call, no invalid truthiness test on void expression */}
      <PageHeader title="Automation Pro" description="Quản lý vòng đời khách hàng tự động và thông minh." action={<Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>Khởi tạo Flow</Button>} />

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-visible flex flex-col sm:flex-row justify-between items-center gap-2">
          {/* Status Tabs - Reordered */}
          <div className="w-full sm:w-auto">
              <Tabs 
                variant="pill"
                activeId={activeTab}
                onChange={setActiveTab as any}
                className="flex-nowrap overflow-x-auto scrollbar-hide"
                items={[
                  { id: 'active', label: 'Đang chạy', icon: PlayCircle },
                  { id: 'paused', label: 'Tạm dừng', icon: PauseCircle },
                  { id: 'draft', label: 'Bản nháp', icon: FileText },
                  { id: 'all', label: 'Tất cả', icon: LayoutGrid },
                  { id: 'archived', label: 'Thùng rác', icon: Trash2 },
                ]}
              />
          </div>

          {/* Type Filter */}
          <div className="relative w-full sm:w-48 shrink-0">
              <button 
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                  <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span>{triggerTypes.find(t => t.id === filterType)?.label}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              
              {isTypeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95">
                        {triggerTypes.map(type => (
                            <button 
                                key={type.id}
                                onClick={() => { setFilterType(type.id as TriggerTypeFilter); setIsTypeDropdownOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-left hover:bg-slate-50 transition-colors ${filterType === type.id ? 'text-[#ca7900] bg-orange-50' : 'text-slate-600'}`}
                            >
                                {type.label}
                                {filterType === type.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                  </>
              )}
          </div>
      </div>

      {filteredFlows.length === 0 && !loading ? (
         <div className="py-10"><FlowEmptyState onCreateClick={() => setIsCreateModalOpen(true)} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFlows.map(flow => {
                const trigger = flow.steps?.find(s => s.type === 'trigger');
                return (
                    <FlowCard 
                        key={flow.id} flow={flow} 
                        linkedCampaign={trigger?.config?.type === 'campaign' ? campaigns.find(c => c.id === trigger.config.targetId) : undefined}
                        linkedForm={trigger?.config?.type === 'form' ? forms.find(f => f.id === trigger.config.targetId) : undefined}
                        linkedPurchaseEvent={trigger?.config?.type === 'purchase' ? purchaseEvents.find(p => p.id === trigger.config.targetId) : undefined}
                        linkedCustomEvent={trigger?.config?.type === 'custom_event' ? customEvents.find(c => c.id === trigger.config.targetId) : undefined}
                        onClick={() => { if(flow.status !== 'archived') { setSelectedFlow(JSON.parse(JSON.stringify(flow))); setFlowViewTab('builder'); } }} 
                        onDelete={(p) => handleDeleteFlow(flow, p)} onRestore={() => handleRestoreFlow(flow)}
                    />
                );
            })}
        </div>
      )}

      {selectedFlow && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-300 overflow-hidden">
           <FlowHeader 
              flow={selectedFlow} isSaving={isSaving} hasCriticalErrors={validationErrors.length > 0} isViewMode={isViewMode} activeTab={flowViewTab} onBack={() => setSelectedFlow(null)} onTabChange={setFlowViewTab}
              onToggleStatus={() => handleUpdateFlow({...selectedFlow, status: selectedFlow.status === 'active' ? 'paused' : 'active'}, false, selectedFlow.status === 'active' ? "Tạm dừng" : "Kích hoạt")} 
              onToggleViewMode={() => setIsViewMode(!isViewMode)} onSave={() => { handleUpdateFlow(selectedFlow, false, "Lưu thủ công"); showToast('Đã lưu.'); }} onRestore={() => handleRestoreFlow(selectedFlow)}
           />
           <div className="flex-1 flex overflow-hidden">
              {/* VÙNG NỘI DUNG CHÍNH (THIẾT KẾ / BÁO CÁO) */}
              <div className="flex-1 relative flex flex-col bg-slate-50 overflow-hidden min-w-0">
                {flowViewTab === 'builder' && (
                  <FlowBuilderTab 
                      flow={selectedFlow} allFlows={flows} allForms={forms} isViewMode={isViewMode} onEditStep={setEditingStep} 
                      onAddStep={(parentId, branch, isInsert) => { setAddStepContext({ parentId, branch, isInsert }); setIsAddStepModalOpen(true); }} 
                      onQuickAddWait={handleQuickAddWait} onSwapSteps={(s, t) => {}}
                  />
                )}
                {flowViewTab === 'analytics' && <div className="h-full overflow-y-auto w-full"><FlowAnalyticsTab flow={selectedFlow} /></div>}
                {flowViewTab === 'settings' && <div className="h-full overflow-y-auto w-full"><FlowSettingsTab flow={selectedFlow} onUpdate={(d, silent) => handleUpdateFlow({...selectedFlow, ...d}, silent ?? true, silent ? undefined : "Cập nhật cài đặt")} /></div>}
              </div>
              
              {/* FLOW SIDEBAR - LUÔN LUÔN HIỂN THỊ VỚI CHIỀU RỘNG CỐ ĐỊNH */}
              <aside className="w-80 flex-shrink-0 h-full bg-white border-l border-slate-200 z-[110] shadow-[-4px_0_20px_rgba(0,0,0,0.02)]">
                <FlowSidebar 
                  validationErrors={validationErrors} logs={historyLogs} 
                  onSelectStep={(sid) => { setFlowViewTab('builder'); const step = selectedFlow.steps?.find(s=>s.id===sid); if(step) setEditingStep(step); }} 
                />
              </aside>
           </div>
        </div>
      )}

      <FlowCreationModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={async (data) => {
        const newFlow: Flow = { 
            ...data, 
            id: crypto.randomUUID(), 
            status: 'draft', 
            createdAt: new Date().toISOString(), 
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
        const res = await api.post<Flow>('flows', newFlow);
        if (res.success) {
            logAction("Tạo kịch bản mới", newFlow.name);
            await loadData();
            // IMPORTANT FIX: Use local newFlow object (with full steps) for immediate rendering.
            // API only returns ID, so using res.data would result in empty flow.
            setSelectedFlow(newFlow);
            setFlowViewTab('builder');
            setIsCreateModalOpen(false);
        }
      }} />

      <AddStepModal isOpen={isAddStepModalOpen} onClose={() => setIsAddStepModalOpen(false)} onAdd={handleAddStep} parentStep={selectedFlow?.steps?.find(s => s.id === addStepContext?.parentId)} isInsert={addStepContext?.isInsert} />
      <StepEditor step={editingStep} flow={selectedFlow || undefined} allFlows={flows} validationErrors={validationErrors} onClose={() => setEditingStep(null)} onSave={(s) => { let newSteps = (selectedFlow!.steps || []).map(st => st.id === s.id ? s : st); handleUpdateFlow({...selectedFlow!, steps: newSteps}, false, `Cập nhật ${s.label}`); setEditingStep(null); }} onDelete={handleDeleteStep} isFlowArchived={selectedFlow?.status === 'archived'} />
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({...toast, isVisible: false})} />
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen:false})} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} />
    </div>
  );
};

export default Flows;
