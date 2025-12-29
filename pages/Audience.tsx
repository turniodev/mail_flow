

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/storageAdapter';
import { automationService } from '../services/automationService';
import { Subscriber, Segment, Flow } from '../types';
import { 
    Download, Search, UserPlus, Layers, Users, 
    List, Plus, Check, Trash2, Tag, Filter, TrendingUp, UserMinus, 
    FileText, ChevronDown, X, ShieldCheck
} from 'lucide-react';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Tabs from '../components/common/Tabs';
import Select from '../components/common/Select';
import Toast, { ToastType } from '../components/common/Toast';
import CustomerProfileModal from '../components/audience/CustomerProfileModal';
import SegmentBuilderModal from '../components/audience/SegmentBuilderModal';
import ListFormModal from '../components/audience/ListFormModal';
import ImportSubscribersModal from '../components/audience/ImportSubscribersModal';
import GroupDetailModal from '../components/audience/GroupDetailModal'; // New Import
import ListsTab from '../components/audience/tabs/ListsTab';
import SegmentsTab from '../components/audience/tabs/SegmentsTab';
import ContactsTab from '../components/audience/tabs/ContactsTab';
import ConfirmationModal from '../components/common/ConfirmationModal';
// @ts-ignore: `useNavigate` is a named export of `react-router-dom/dist/index.js`
import { useNavigate } from 'react-router-dom/dist/index.js';

const ITEMS_PER_PAGE = 100;

const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Chưa có dữ liệu';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);
    if (diffSeconds < 60) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

const Audience: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'lists' | 'segments' | 'contacts'>('contacts');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [staticLists, setStaticLists] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isSegmentBuilderOpen, setSegmentBuilderOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  
  // Viewing Group State
  const [viewingGroup, setViewingGroup] = useState<{ id: string; name: string; type: 'list' | 'segment'; count: number } | null>(null);

  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [editingList, setEditingList] = useState<any | null>(null);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      variant?: 'danger' | 'warning';
      onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTag, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const [subRes, segRes, listRes, flowRes, tagRes] = await Promise.all([
        api.get<Subscriber[]>('subscribers'),
        api.get<Segment[]>('segments'),
        api.get<any[]>('lists'),
        api.get<Flow[]>('flows'),
        api.get<{id:string, name:string}[]>('tags')
    ]);

    if (subRes.success) setSubscribers(subRes.data);
    if (segRes.success) setSegments(segRes.data);
    if (listRes.success) setStaticLists(listRes.data);
    if (flowRes.success) setFlows(flowRes.data);
    if (tagRes.success) setTags(tagRes.data.map(t => t.name));
    
    setLoading(false);
  };

  const checkSegmentMatch = (sub: Subscriber, criteriaJson: string) => {
      try {
          const groups = JSON.parse(criteriaJson);
          if (!Array.isArray(groups)) return false;
          return groups.some((group: any) => {
              if (!group.conditions || group.conditions.length === 0) return true;
              return group.conditions.every((cond: any) => {
                  const val = cond.value.toString().toLowerCase();
                  let fieldData: any;
                  if (cond.field === 'tags') {
                      // FIX: Ensure sub.tags is an array before mapping
                      const tagsArray = Array.isArray(sub.tags) ? sub.tags : [];
                      const lowerCaseTags = tagsArray.map(t => t.toLowerCase());
                      return cond.operator === 'contains' ? lowerCaseTags.some(t => t.includes(val)) : !lowerCaseTags.some(t => t.includes(val));
                  }
                  if (cond.field === 'email') fieldData = sub.email;
                  else if (cond.field === 'status') fieldData = sub.status;
                  else if (cond.field === 'joinedAt') fieldData = sub.joinedAt;
                  else fieldData = (sub as any)[cond.field];
                  if (typeof fieldData === 'string') {
                      const strData = fieldData.toLowerCase();
                      if (cond.operator === 'contains') return strData.includes(val);
                      if (cond.operator === 'is') return strData === val;
                  }
                  return false;
              });
          });
      } catch (e) { return false; }
  };

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
        const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase()) || `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
        // FIX: Ensure sub.tags is an array before checking includes
        const matchesTag = filterTag === 'all' || (Array.isArray(sub.tags) && sub.tags.includes(filterTag));
        return matchesSearch && matchesStatus && matchesTag;
    });
  }, [subscribers, searchTerm, filterStatus, filterTag]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);
  const paginatedSubscribers = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredSubscribers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSubscribers, currentPage]);

  // Calculate members for the currently viewed group
  const viewingGroupMembers = useMemo(() => {
      if (!viewingGroup) return [];
      if (viewingGroup.type === 'list') {
          return subscribers.filter(s => s.listIds?.includes(viewingGroup.id));
      } else {
          // It's a segment
          const segment = segments.find(s => s.id === viewingGroup.id);
          if (!segment) return [];
          return subscribers.filter(sub => checkSegmentMatch(sub, segment.criteria));
      }
  }, [viewingGroup, subscribers, segments]);

  const handleUpdateSubscriber = async (updated: Subscriber) => {
      const oldSub = subscribers.find(s => s.id === updated.id);
      
      // FIX: Ensure oldSub?.tags is an array before filtering
      const oldTagsArray = Array.isArray(oldSub?.tags) ? oldSub!.tags : [];
      const addedTags = updated.tags.filter(t => !oldTagsArray.includes(t));

      const res = await api.put<Subscriber>(`subscribers/${updated.id}`, updated);
      if (res.success) {
          setSubscribers(subscribers.map(s => s.id === updated.id ? res.data : s));
          if (selectedSubscriber?.id === updated.id) setSelectedSubscriber(res.data);
          
          if (addedTags.length > 0) {
              for (const tag of addedTags) {
                  await automationService.triggerFlowsByEvent({
                      type: 'tag_added',
                      targetId: tag,
                      subscriberIds: [updated.id]
                  });
              }
          }
          showToast('Cập nhật hồ sơ thành công', 'success');
      }
  };

  const handleRemoveFromList = async (subscriberIds: string[], listId: string) => {
      let successCount = 0;
      let newSubscribers = [...subscribers];

      for (const subId of subscriberIds) {
          const sub = newSubscribers.find(s => s.id === subId);
          if (!sub) continue;
          
          // FIX: Ensure sub.listIds is an array before filtering
          const updatedListIds = Array.isArray(sub.listIds) ? sub.listIds.filter(id => id !== listId) : [];
          if (updatedListIds.length === (sub.listIds?.length || 0)) continue; 

          const updatedSub = { ...sub, listIds: updatedListIds };
          
          // Fire API (Could be optimized to bulk API)
          await api.put<Subscriber>(`subscribers/${sub.id}`, updatedSub);
          
          // Update Local
          newSubscribers = newSubscribers.map(s => s.id === sub.id ? updatedSub : s);
          successCount++;
      }

      if (successCount > 0) {
          setSubscribers(newSubscribers);
          
          // Update List State & Persistence
          setStaticLists(prev => prev.map(l => {
              if (l.id === listId) {
                  const newCount = Math.max(0, l.count - successCount);
                  api.put(`lists/${l.id}`, { ...l, count: newCount }); // Save to DB
                  return { ...l, count: newCount };
              }
              return l;
          }));

          if (viewingGroup && viewingGroup.type === 'list' && viewingGroup.id === listId) {
              setViewingGroup(prev => prev ? ({ ...prev, count: Math.max(0, prev.count - successCount) }) : null);
          }
          
          // Update selectedSubscriber if applicable
          if (selectedSubscriber && subscriberIds.includes(selectedSubscriber.id)) {
              const updated = newSubscribers.find(s => s.id === selectedSubscriber.id);
              if (updated) setSelectedSubscriber(updated);
          }

          showToast(`Đã xóa ${successCount} khách hàng khỏi danh sách`, 'success');
      }
  };

  const handleDeleteSubscriber = async (id: string) => {
      const subToDelete = subscribers.find(s => s.id === id);
      if (!subToDelete) return;

      const res = await api.delete(`subscribers/${id}`);
      if (res.success) {
          setSubscribers(prev => prev.filter(s => s.id !== id));
          
          // Update List Counts Persistently
          // FIX: Ensure subToDelete.listIds is an array before checking length and iterating
          if (Array.isArray(subToDelete.listIds) && subToDelete.listIds.length > 0) {
              setStaticLists(prev => prev.map(l => {
                  if (subToDelete.listIds.includes(l.id)) {
                      const newCount = Math.max(0, l.count - 1);
                      api.put(`lists/${l.id}`, { ...l, count: newCount }); // Save to DB
                      return { ...l, count: newCount };
                  }
                  return l;
              }));
          }

          setSegments(prev => prev.map(seg => {
              if (checkSegmentMatch(subToDelete, seg.criteria)) {
                  return { ...seg, count: Math.max(0, seg.count - 1) };
              }
              return seg;
          }));
          
          // Update viewing group count
          if (viewingGroup) {
              // FIX: Ensure subToDelete.listIds is an array before checking includes
              if (viewingGroup.type === 'list' && Array.isArray(subToDelete.listIds) && subToDelete.listIds.includes(viewingGroup.id)) {
                  setViewingGroup(prev => prev ? ({ ...prev, count: Math.max(0, prev.count - 1) }) : null);
              } else if (viewingGroup.type === 'segment') {
                  const seg = segments.find(s => s.id === viewingGroup.id);
                  if (seg && checkSegmentMatch(subToDelete, seg.criteria)) {
                      setViewingGroup(prev => prev ? ({ ...prev, count: Math.max(0, prev.count - 1) }) : null);
                  }
              }
          }
          
          if (selectedSubscriber?.id === id) {
              setSelectedSubscriber(null);
          }
          if (selectedIds.has(id)) {
              const newSet = new Set(selectedIds);
              newSet.delete(id);
              setSelectedIds(newSet);
          }
          
          showToast('Đã xóa khách hàng hoàn toàn khỏi hệ thống', 'success');
      }
  };

  const handleBulkDelete = async () => {
      setConfirmModal({
          isOpen: true,
          title: `Xóa ${selectedIds.size} liên hệ?`,
          message: 'Hành động này sẽ xóa vĩnh viễn các liên hệ đã chọn khỏi hệ thống. Không thể hoàn tác.',
          variant: 'danger',
          onConfirm: async () => {
              const ids = Array.from(selectedIds);
              let successCount = 0;
              
              // 1. Identify subscribers to delete to calculate List decrements
              const subsToDelete = subscribers.filter(s => selectedIds.has(s.id));
              
              // 2. Optimistic UI update for Subscribers
              setSubscribers(prev => prev.filter(s => !selectedIds.has(s.id)));
              setSelectedIds(new Set());

              // 3. Calculate list updates
              const listDecrements: Record<string, number> = {};
              subsToDelete.forEach(sub => {
                  // FIX: Ensure sub.listIds is an array before iterating
                  if (Array.isArray(sub.listIds)) {
                      sub.listIds.forEach(lid => {
                          listDecrements[lid] = (listDecrements[lid] || 0) + 1;
                      });
                  }
              });

              // 4. Update List State & Persistence
              const updatedLists = staticLists.map(list => {
                  if (listDecrements[list.id]) {
                      const newCount = Math.max(0, list.count - listDecrements[list.id]);
                      api.put(`lists/${list.id}`, { ...list, count: newCount }); // Save to DB
                      return { ...list, count: newCount };
                  }
                  return list;
              });
              setStaticLists(updatedLists);

              // 5. Delete Subscribers
              for (const id of ids) {
                  const res = await api.delete(`subscribers/${id}`);
                  if (res.success) successCount++;
              }
              
              showToast(`Đã xóa thành công ${successCount} liên hệ`, 'success');
          }
      });
  };

  // Bulk Delete Lists
  const handleBulkDeleteLists = async (ids: string[]) => {
      setConfirmModal({
          isOpen: true,
          title: `Xóa ${ids.length} danh sách?`,
          message: 'Hành động này sẽ xóa các danh sách đã chọn. Khách hàng trong danh sách sẽ KHÔNG bị xóa khỏi hệ thống.',
          variant: 'danger',
          onConfirm: async () => {
              let successCount = 0;
              for (const id of ids) {
                  const res = await api.delete(`lists/${id}`);
                  if (res.success) successCount++;
              }
              fetchData(); // Refresh all
              showToast(`Đã xóa ${successCount} danh sách`, 'success');
          }
      });
  };

  // Bulk Delete Segments
  const handleBulkDeleteSegments = async (ids: string[]) => {
      setConfirmModal({
          isOpen: true,
          title: `Xóa ${ids.length} phân khúc?`,
          message: 'Hành động này sẽ xóa các phân khúc động. Dữ liệu khách hàng không bị ảnh hưởng.',
          variant: 'danger',
          onConfirm: async () => {
              let successCount = 0;
              for (const id of ids) {
                  const res = await api.delete(`segments/${id}`);
                  if (res.success) successCount++;
              }
              fetchData();
              showToast(`Đã xóa ${successCount} phân khúc`, 'success');
          }
      });
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
       <PageHeader 
        title="Đối tượng & Khách hàng"
        description="Quản lý vòng đời khách hàng từ lúc đăng ký đến lúc chuyển đổi."
        action={<Button icon={UserPlus} size="lg" onClick={() => setImportModalOpen(true)}>Import liên hệ</Button>}
       />

       {/* Stats Grid - Same as before */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng liên hệ</p><h3 className="text-3xl font-bold text-slate-700 mt-1">{subscribers.length.toLocaleString()}</h3></div>
              <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl"><Users className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoạt động</p><h3 className="text-3xl font-bold text-emerald-500 mt-1">{subscribers.filter(s => s.status === 'active').length.toLocaleString()}</h3></div>
              <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl"><Check className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hủy đăng ký</p><h3 className="text-3xl font-bold text-rose-500 mt-1">{subscribers.filter(s => s.status === 'unsubscribed').length.toLocaleString()}</h3></div>
              <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><UserMinus className="w-6 h-6" /></div>
          </div>
       </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
        <Tabs 
            activeId={activeTab} 
            onChange={setActiveTab}
            items={[
                { id: 'contacts', label: 'Tất cả liên hệ', icon: Users, count: filteredSubscribers.length },
                { id: 'segments', label: 'Phân khúc (Segments)', icon: Layers, count: segments.length },
                { id: 'lists', label: 'Danh sách tĩnh (Lists)', icon: List, count: staticLists.length },
            ]}
        />

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1 relative group bg-white rounded-xl border border-slate-200 h-11 flex items-center overflow-hidden">
                    <Search className="w-4 h-4 ml-4 text-slate-400" />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tên, email..." className="w-full h-full bg-transparent border-none outline-none text-sm px-3 font-medium" />
                </div>
                {activeTab === 'contacts' && (
                    <div className="flex gap-2">
                        <div className="w-44">
                            <Select 
                                variant="ghost" 
                                icon={ShieldCheck}
                                value={filterStatus} 
                                onChange={setFilterStatus} 
                                options={[{value:'all', label:'Mọi trạng thái'}, {value:'active', label:'Active'}, {value:'unsubscribed', label:'Unsub'}]} 
                            />
                        </div>
                        <div className="w-48">
                            <Select 
                                variant="ghost" 
                                icon={Tag}
                                value={filterTag} 
                                onChange={setFilterTag} 
                                options={[{value:'all', label:'Mọi nhãn'}, ...tags.map((t:string)=>({value:t, label:t}))]} 
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 shrink-0">
                {activeTab === 'segments' && <Button size="sm" onClick={() => { setEditingSegment(null); setSegmentBuilderOpen(true); }}>Tạo phân khúc</Button>}
                {activeTab === 'lists' && <Button size="sm" onClick={() => setIsCreateListModalOpen(true)}>Tạo danh sách</Button>}
            </div>
        </div>

        <div className="animate-in fade-in duration-300">
            {activeTab === 'lists' && (
                <ListsTab 
                    lists={staticLists} 
                    onView={(list) => setViewingGroup({ id: list.id, name: list.name, type: 'list', count: list.count })}
                    onEdit={setEditingList} 
                    onDelete={(id) => setConfirmModal({ isOpen: true, title: 'Xóa danh sách?', message: 'Gỡ toàn bộ khách hàng khỏi danh sách này.', onConfirm: async () => { 
                        await api.delete(`lists/${id}`);
                        fetchData();
                        showToast('Đã xóa danh sách thành công', 'success');
                    }})} 
                    onBulkDelete={handleBulkDeleteLists}
                />
            )}
            {activeTab === 'segments' && (
                <SegmentsTab 
                    segments={segments} 
                    onView={(seg) => setViewingGroup({ id: seg.id, name: seg.name, type: 'segment', count: seg.count })}
                    onEdit={(seg) => { setEditingSegment(seg); setSegmentBuilderOpen(true); }} 
                    onDelete={(id) => setConfirmModal({ isOpen: true, title: 'Xóa phân khúc?', message: 'Dữ liệu phân khúc động sẽ bị xóa.', onConfirm: async () => { 
                        await api.delete(`segments/${id}`);
                        fetchData();
                        showToast('Đã xóa phân khúc thành công', 'success');
                    }})} 
                    onBulkDelete={handleBulkDeleteSegments}
                />
            )}
            {activeTab === 'contacts' && (
                <ContactsTab 
                    subscribers={paginatedSubscribers} // Pass ONLY current page
                    selectedIds={selectedIds} 
                    onToggleSelection={(id) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); }} 
                    onToggleSelectAll={() => {
                        // Select all ONLY on current page
                        const currentPageIds = paginatedSubscribers.map(s => s.id);
                        const allSelected = currentPageIds.every(id => selectedIds.has(id));
                        const newSet = new Set(selectedIds);
                        
                        if (allSelected) {
                            currentPageIds.forEach(id => newSet.delete(id));
                        } else {
                            currentPageIds.forEach(id => newSet.add(id));
                        }
                        setSelectedIds(newSet);
                    }} 
                    onSelectSubscriber={setSelectedSubscriber} 
                    formatRelativeTime={formatRelativeTime}
                    // Pagination Props
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    // Bulk Action
                    onBulkDelete={handleBulkDelete}
                />
            )}
        </div>
      </div>

      <SegmentBuilderModal isOpen={isSegmentBuilderOpen} onClose={() => setSegmentBuilderOpen(false)} onSave={async (seg) => { 
          const isNew = !seg.id;
          const res = isNew ? await api.post<Segment>('segments', seg) : await api.put<Segment>(`segments/${seg.id}`, seg);
          if (res.success) { fetchData(); showToast('Đã lưu phân khúc động', 'success'); }
      }} initialSegment={editingSegment} subscribers={subscribers} />
      
      <ListFormModal isOpen={isCreateListModalOpen || !!editingList} onClose={() => { setIsCreateListModalOpen(false); setEditingList(null); }} list={editingList} onSave={async (d, isNew) => {
          if (isNew) {
              await api.post('lists', { ...d, count: 0, source: 'Manual', created: new Date().toLocaleDateString('vi-VN') });
              showToast('Đã tạo danh sách tĩnh', 'success');
          } else {
              await api.put(`lists/${editingList.id}`, { ...editingList, ...d });
              showToast('Đã cập nhật danh sách', 'success');
          }
          fetchData();
      }} isNew={isCreateListModalOpen} />
      
      <ImportSubscribersModal 
        isOpen={isImportModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        existingLists={staticLists}
        existingEmails={new Set(subscribers.map(s => s.email))}
        onImport={async (d) => {
            const { subscribers: newSubs, targetListId, newListName, duplicates } = d;
            let finalListId = targetListId;
            if (newListName) {
                const lRes = await api.post<any>('lists', { 
                    name: newListName, 
                    count: 0, 
                    source: 'Import CSV', 
                    created: new Date().toLocaleDateString('vi-VN') 
                });
                if (lRes.success) finalListId = lRes.data.id;
            }

            if (newSubs.length > 0) {
                const subsPayload = newSubs.map(s => ({
                    ...s,
                    listIds: finalListId ? [finalListId] : [],
                    tags: s.tags ? s.tags.split(',').map((t: string) => t.trim()) : [],
                    joinedAt: new Date().toISOString(),
                    status: 'active',
                    stats: { emailsSent:0, emailsOpened:0, linksClicked:0 },
                    customAttributes: {}
                }));
                
                await api.post('subscribers_bulk', subsPayload);
                showToast(`Đã import thành công ${newSubs.length} liên hệ!`, 'success');
                fetchData();
            }
        }}
      />

      <GroupDetailModal 
        isOpen={!!viewingGroup}
        onClose={() => setViewingGroup(null)}
        group={viewingGroup}
        members={viewingGroupMembers}
        onRemoveFromList={(ids) => {
            if (viewingGroup?.type === 'list') {
                handleRemoveFromList(ids, viewingGroup.id);
            }
        }}
        onViewProfile={setSelectedSubscriber}
      />

      {/* CustomerProfileModal with Tags Prop */}
      <CustomerProfileModal 
        subscriber={selectedSubscriber} 
        onClose={() => setSelectedSubscriber(null)}
        onUpdate={handleUpdateSubscriber}
        onDelete={handleDeleteSubscriber}
        allLists={staticLists}
        allSegments={segments}
        allFlows={flows}
        allTags={tags} // PASSED HERE
        checkMatch={checkSegmentMatch}
        onAddToList={async (subId, listId) => {
            const sub = subscribers.find(s => s.id === subId);
            // FIX: Ensure sub.listIds is an array before checking includes
            if (sub && Array.isArray(sub.listIds) && !sub.listIds.includes(listId)) {
                await handleUpdateSubscriber({ ...sub, listIds: [...sub.listIds, listId] });
                fetchData();
            }
        }}
        onRemoveFromList={async (subId, listId) => {
            await handleRemoveFromList([subId], listId);
        }}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} />
    </div>
  );
};

export default Audience;