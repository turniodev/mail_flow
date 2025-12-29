
import React, { useState, useEffect } from 'react';
import { Tag as TagIcon, Search, Trash2, Users, RefreshCw, Filter, ArrowRight, FileText, Info, Edit3, Check, X, AlertTriangle, Save, Plus } from 'lucide-react';
import { api } from '../services/storageAdapter';
import { Subscriber } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Toast, { ToastType } from '../components/common/Toast';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import GroupDetailModal from '../components/audience/GroupDetailModal';
import CustomerProfileModal from '../components/audience/CustomerProfileModal';

interface Tag {
    id: string;
    name: string;
    description?: string;
    subscriber_count?: number;
}

const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });

  // View Members State
  const [viewingTag, setViewingTag] = useState<Tag | null>(null);
  const [tagMembers, setTagMembers] = useState<Subscriber[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null); // For Profile View

  // Edit State
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation State
  const [confirmModal, setConfirmModal] = useState<{ 
      isOpen: boolean; 
      title: string; 
      message: React.ReactNode; 
      onConfirm: () => void;
      variant?: 'danger' | 'warning';
  }>({ 
      isOpen: false, 
      title: '', 
      message: '', 
      onConfirm: () => {},
      variant: 'danger'
  });

  useEffect(() => { fetchTags(); }, []);

  const fetchTags = async () => {
    setLoading(true);
    const res = await api.get<Tag[]>('tags');
    if (res.success) setTags(res.data);
    setLoading(false);
  };

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type, isVisible: true });

  const handleAdd = async () => {
    if (!newTag.name.trim()) return;
    setIsAdding(true);
    const res = await api.post<Tag>('tags', { 
        name: newTag.name.trim().toUpperCase().replace(/\s+/g, '_'),
        description: newTag.description.trim() 
    });
    if (res.success) {
      setTags([{...res.data, subscriber_count: 0}, ...tags]);
      setNewTag({ name: '', description: '' });
      showToast('Đã thêm nhãn mới');
    } else {
      showToast(res.message || 'Lỗi khi thêm nhãn', 'error');
    }
    setIsAdding(false);
  };

  const startEdit = (tag: Tag) => {
      setEditingTag(tag);
      setEditFormData({ name: tag.name, description: tag.description || '' });
  };

  const handleUpdate = async () => {
      if (!editingTag || !editFormData.name.trim()) return;
      
      const isRename = editingTag.name !== editFormData.name.trim().toUpperCase().replace(/\s+/g, '_');
      
      if (isRename) {
          if (!window.confirm(`CẢNH BÁO: Bạn đang đổi tên nhãn từ "${editingTag.name}" sang "${editFormData.name.trim().toUpperCase()}". \n\nHành động này sẽ cập nhật lại nhãn cho toàn bộ khách hàng đang sở hữu nhãn này. Bạn chắc chắn chứ?`)) return;
      }

      setIsUpdating(true);
      const res = await api.put<Tag>(`tags/${editingTag.id}`, {
          name: editFormData.name.trim().toUpperCase().replace(/\s+/g, '_'),
          description: editFormData.description.trim()
      });

      if (res.success) {
          showToast('Đã cập nhật dữ liệu nhãn trên toàn hệ thống');
          fetchTags();
          setEditingTag(null);
      } else {
          showToast(res.message || 'Lỗi cập nhật', 'error');
      }
      setIsUpdating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation();
    const subCount = tag.subscriber_count || 0;
    
    let messageContent: React.ReactNode;

    if (subCount > 0) {
        messageContent = (
            <div className="space-y-4">
                <p className="text-center text-slate-600 text-sm">
                    Nhãn <span className="font-bold text-slate-800">"{tag.name}"</span> đang được gắn cho <span className="font-bold text-rose-600">{subCount} khách hàng</span>.
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left shadow-inner">
                    <h4 className="text-xs font-bold text-rose-800 uppercase mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Hậu quả khi xóa:
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-rose-700 font-medium leading-relaxed">
                        <li>Hệ thống sẽ <b>GỠ BỎ</b> nhãn khỏi toàn bộ {subCount} khách hàng này.</li>
                        <li>Các <b>Automation Flow</b> có điều kiện lọc theo nhãn này sẽ bị dừng hoặc lỗi.</li>
                        <li>Bạn <b>KHÔNG THỂ</b> khôi phục lại liên kết dữ liệu cũ ngay cả khi tạo lại nhãn trùng tên.</li>
                    </ul>
                </div>
                <p className="text-center text-slate-500 text-xs italic">
                    Hãy cân nhắc <b>ĐỔI TÊN</b> thay vì xóa. Bạn vẫn chắc chắn muốn tiếp tục?
                </p>
            </div>
        );
    } else {
        messageContent = `Bạn có chắc chắn muốn xóa nhãn "${tag.name}"? Nhãn này hiện chưa gắn cho khách hàng nào.`;
    }

    setConfirmModal({
        isOpen: true,
        title: subCount > 0 ? 'CẢNH BÁO MẤT DỮ LIỆU' : 'Xóa nhãn này?',
        message: messageContent,
        variant: 'danger',
        onConfirm: async () => {
            const res = await api.delete(`tags/${tag.id}`);
            if (res.success) {
                setTags(tags.filter(t => t.id !== tag.id));
                showToast('Đã xóa nhãn và gỡ khỏi toàn bộ liên hệ');
            } else {
                showToast(res.message || 'Không thể xóa nhãn', 'error');
            }
        }
    });
  };

  const handleViewMembers = async (tag: Tag) => {
      setViewingTag(tag);
      setLoadingMembers(true);
      // Gọi API lấy danh sách subscriber có chứa tag này
      const res = await api.get<Subscriber[]>(`subscribers?tag=${encodeURIComponent(tag.name)}`);
      if (res.success) {
          setTagMembers(res.data);
      } else {
          showToast('Không thể tải danh sách thành viên', 'error');
          setTagMembers([]);
      }
      setLoadingMembers(false);
  };

  const handleRemoveTags = async (subscriberIds: string[]) => {
      if (!viewingTag || subscriberIds.length === 0) return;
      
      let successCount = 0;
      const idsToRemoveSet = new Set(subscriberIds);

      // Loop and update (Can be optimized to bulk update API later)
      for (const subId of subscriberIds) {
          const sub = tagMembers.find(s => s.id === subId);
          if (!sub) continue;

          const newTags = sub.tags.filter(t => t !== viewingTag.name);
          const res = await api.put(`subscribers/${subId}`, { ...sub, tags: newTags });
          
          if (res.success) {
              successCount++;
          }
      }

      if (successCount > 0) {
          // Update Local Members List
          setTagMembers(prev => prev.filter(s => !idsToRemoveSet.has(s.id)));
          
          // Update Tags Counts Locally
          const newCount = Math.max(0, (viewingTag.subscriber_count || 0) - successCount);
          setTags(prev => prev.map(t => t.id === viewingTag.id ? { ...t, subscriber_count: newCount } : t));
          setViewingTag(prev => prev ? { ...prev, subscriber_count: newCount } : null);

          showToast(`Đã gỡ nhãn khỏi ${successCount} khách hàng`);
      } else {
          showToast('Lỗi khi gỡ nhãn', 'error');
      }
  };

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-32 px-4">
      <PageHeader 
        title="Quản lý Nhãn (Tags)" 
        description="Định danh và phân loại khách hàng tự động trên toàn hệ thống."
        action={<Button onClick={fetchTags} variant="secondary" size="sm" icon={RefreshCw} className={loading ? 'animate-spin' : ''}>Làm mới</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LIST VIEW */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white p-1.5 rounded-[20px] border border-slate-200 flex items-center gap-2 shadow-sm focus-within:ring-4 focus-within:ring-emerald-50/5 transition-all">
             <div className="p-2.5 text-slate-400"><Search className="w-4 h-4" /></div>
             <input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Tìm tên nhãn hoặc mô tả..." 
                className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300" 
             />
             <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredTags.length} Tags</div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-white rounded-[28px] animate-pulse border border-slate-100" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTags.map(tag => (
                    <div 
                        key={tag.id} 
                        className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden cursor-pointer"
                        onClick={() => handleViewMembers(tag)}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-slate-900 rotate-12"><TagIcon className="w-24 h-24" /></div>
                        
                        <div className="flex justify-between items-start relative z-10 mb-4">
                            {/* Changed to Emerald Gradient to match Flow Creation Modal */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:rotate-6 transition-transform">
                                <TagIcon className="w-6 h-6" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); startEdit(tag); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Sửa nhãn"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDeleteClick(e, tag)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Xóa nhãn"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        
                        <div className="relative z-10 flex-1">
                            <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{tag.name}</h4>
                            {tag.description ? (
                                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-1 italic leading-relaxed" title={tag.description}>{tag.description}</p>
                            ) : (
                                <p className="text-[10px] text-slate-300 font-medium mt-1 italic">Không có mô tả</p>
                            )}
                        </div>

                        <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                <Users className="w-3 h-3" /> {tag.subscriber_count || 0} liên hệ
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* SIDEBAR: CREATE NEW TAG - REDESIGNED */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TagIcon className="w-32 h-32 text-white rotate-12" /></div>
                    <div className="relative z-10 text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-black text-xl tracking-tight leading-tight">Tạo nhãn mới</h3>
                        <p className="text-emerald-100 text-xs font-medium mt-1">Phân loại khách hàng để chăm sóc tốt hơn.</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6 space-y-5">
                    {/* Live Preview */}
                    <div className="flex justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        {newTag.name ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wide shadow-sm animate-in zoom-in">
                                <TagIcon className="w-3.5 h-3.5" /> {newTag.name.toUpperCase().replace(/\s+/g, '_')}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Xem trước thẻ tag...</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên nhãn (Mã ID)</label>
                        <div className="relative">
                            <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                placeholder="VD: VIP_MEMBER..." 
                                value={newTag.name} 
                                onChange={(e) => setNewTag({...newTag, name: e.target.value})} 
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mô tả / Ghi chú</label>
                        <textarea 
                            placeholder="Nhập mô tả mục đích sử dụng..." 
                            value={newTag.description} 
                            onChange={(e) => setNewTag({...newTag, description: e.target.value})}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none h-28 shadow-sm"
                        />
                    </div>

                    <Button fullWidth onClick={handleAdd} isLoading={isAdding} size="lg" className="h-12 bg-slate-900 text-white hover:bg-emerald-600 shadow-lg shadow-slate-200 border-none transition-all">
                        Thêm vào hệ thống
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal isOpen={!!editingTag} onClose={() => setEditingTag(null)} title="Chỉnh sửa thông tin Nhãn" size="md" 
        footer={<div className="flex justify-between w-full"><Button variant="ghost" onClick={() => setEditingTag(null)}>Hủy</Button><Button icon={Save} onClick={handleUpdate} isLoading={isUpdating}>Cập nhật hệ thống</Button></div>}>
          <div className="space-y-6">
              {editingTag?.name !== editFormData.name.trim().toUpperCase().replace(/\s+/g, '_') && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-800">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold leading-relaxed">Bạn đang thay đổi Tên định danh. Hệ thống sẽ quét và cập nhật lại nhãn này cho toàn bộ khách hàng đang sở hữu.</p>
                  </div>
              )}
              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên nhãn (ID)</label>
                      <input 
                        value={editFormData.name} 
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-emerald-500 transition-all"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả / Ghi chú</label>
                      <textarea 
                        value={editFormData.description} 
                        onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all h-32 resize-none"
                      />
                  </div>
              </div>
          </div>
      </Modal>

      {/* VIEW MEMBERS MODAL */}
      <GroupDetailModal 
        isOpen={!!viewingTag}
        onClose={() => setViewingTag(null)}
        group={viewingTag ? { id: viewingTag.id, name: viewingTag.name, type: 'tag', count: viewingTag.subscriber_count || 0 } : null}
        members={tagMembers}
        onRemoveFromList={() => {}} // Not used for tags
        onRemoveFromTag={handleRemoveTags}
        onViewProfile={(sub) => setSelectedSubscriber(sub)}
      />

      {/* CUSTOMER PROFILE MODAL (READ-ONLY/EDIT FROM LIST) */}
      {selectedSubscriber && (
          <CustomerProfileModal
            subscriber={selectedSubscriber}
            onClose={() => setSelectedSubscriber(null)}
            onUpdate={() => { handleViewMembers(viewingTag!); fetchTags(); }} // Refresh list on update
            onDelete={() => { handleViewMembers(viewingTag!); fetchTags(); }} // Refresh list on delete
            allLists={[]} // Minimal data needed
            allSegments={[]}
            allFlows={[]}
            allTags={tags.map(t => t.name)}
            checkMatch={() => false}
            onAddToList={() => {}}
            onRemoveFromList={() => {}}
          />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Xóa vĩnh viễn"
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({...toast, isVisible: false})} />
    </div>
  );
};

export default Tags;
