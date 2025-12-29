
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, UserMinus, Edit3, ShieldCheck, Tag, Filter, ChevronLeft, ChevronRight, Tags, CheckSquare, Square, Trash2, Copy, Download, Mail, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import Toast, { ToastType } from '../common/Toast';
import { Subscriber } from '../../types';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: { id: string; name: string; type: 'list' | 'segment' | 'tag'; count: number } | null;
  members: Subscriber[];
  onRemoveFromList: (subscriberIds: string[]) => void;
  onRemoveFromTag?: (subscriberIds: string[]) => void;
  onViewProfile: (subscriber: Subscriber) => void;
}

const ITEMS_PER_PAGE = 100;

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({ 
  isOpen, onClose, group, members, onRemoveFromList, onRemoveFromTag, onViewProfile 
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      ids: string[];
      message: string;
  }>({ isOpen: false, ids: [], message: '' });

  useEffect(() => {
      setSelectedIds(new Set());
  }, [group]);

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  // Filter Logic
  const filteredMembers = useMemo(() => {
    const s = search.toLowerCase();
    return members.filter(m => 
        m.email.toLowerCase().includes(s) || 
        `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase().includes(s)
    );
  }, [members, search]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  // Reset page when search changes
  useEffect(() => {
      setCurrentPage(1);
      setSelectedIds(new Set()); // Reset selection on filter change
  }, [search]);

  // Selection Logic
  const toggleSelectAll = () => {
      const currentPageIds = paginatedMembers.map(m => m.id);
      const allSelected = currentPageIds.every(id => selectedIds.has(id));
      const newSet = new Set(selectedIds);
      
      if (allSelected) {
          currentPageIds.forEach(id => newSet.delete(id));
      } else {
          currentPageIds.forEach(id => newSet.add(id));
      }
      setSelectedIds(newSet);
  };

  const toggleSelectOne = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const isAllPageSelected = paginatedMembers.length > 0 && paginatedMembers.every(m => selectedIds.has(m.id));

  // Action Handlers
  const handleRemoveClick = (ids: string[]) => {
      if (!group) return;
      const isList = group.type === 'list';
      const actionName = isList ? 'gỡ khỏi danh sách' : 'gỡ nhãn';
      const msg = ids.length === 1 
          ? `Bạn có chắc chắn muốn ${actionName} "${group.name}" khỏi khách hàng này?`
          : `Bạn có chắc chắn muốn ${actionName} "${group.name}" khỏi ${ids.length} khách hàng đã chọn?`;
      
      setConfirmState({
          isOpen: true,
          ids: ids,
          message: msg
      });
  };

  const executeRemove = () => {
      if (group?.type === 'list') {
          onRemoveFromList(confirmState.ids);
      } else if (group?.type === 'tag' && onRemoveFromTag) {
          onRemoveFromTag(confirmState.ids);
      }
      setSelectedIds(new Set());
      setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleCopyEmails = () => {
      const selectedMembers = members.filter(m => selectedIds.has(m.id));
      const emails = selectedMembers.map(m => m.email).join(', ');
      navigator.clipboard.writeText(emails);
      showToast(`Đã sao chép ${selectedIds.size} email`, 'success');
      setSelectedIds(new Set());
  };

  const handleExportCSV = () => {
      const selectedMembers = members.filter(m => selectedIds.has(m.id));
      const header = ['ID', 'Email', 'First Name', 'Last Name', 'Status', 'Joined At'];
      const rows = selectedMembers.map(m => [m.id, m.email, m.firstName, m.lastName, m.status, m.joinedAt]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [header, ...rows].map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `export_${group?.name}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(`Đã xuất ${selectedIds.size} liên hệ`, 'success');
      setSelectedIds(new Set());
  };

  const handleSendEmail = () => {
      const selectedMembers = members.filter(m => selectedIds.has(m.id));
      const emails = selectedMembers.map(m => m.email).join(',');
      window.open(`mailto:?bcc=${emails}`);
      setSelectedIds(new Set());
  };

  if (!group) return null;

  return (
    <>
        <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={group.type === 'list' ? 'Chi tiết Danh sách' : (group.type === 'tag' ? 'Thành viên gắn nhãn' : 'Chi tiết Phân khúc')}
        size="lg"
        footer={
            <div className="w-full flex justify-between items-center">
                <div className="text-xs text-slate-400 font-medium">
                    Hiển thị {paginatedMembers.length} / {filteredMembers.length} kết quả
                </div>
                <Button variant="secondary" onClick={onClose}>Đóng</Button>
            </div>
        }
        >
        <div className="flex flex-col h-full relative">
            
            {/* Header Summary */}
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 mb-6 shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={group.type === 'list' ? 'info' : (group.type === 'tag' ? 'success' : 'warning')} className="uppercase">
                                {group.type === 'list' ? 'Static List' : (group.type === 'tag' ? 'System Tag' : 'Dynamic Segment')}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {group.id}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            {group.type === 'tag' && <Tag className="w-5 h-5 text-emerald-600" />}
                            {group.name}
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-slate-800">{members.length.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thành viên</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 mb-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm thành viên trong nhóm này..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#ffa900] transition-all"
                    />
                </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl flex flex-col bg-white relative min-h-[400px]">
                <table className="w-full text-left">
                    <thead className="sticky top-0 z-20">
                        {selectedIds.size > 0 && group.type !== 'segment' ? (
                            <tr className="bg-[#fffbf0] border-b border-orange-200 shadow-sm animate-in fade-in duration-200">
                                <th colSpan={4} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setSelectedIds(new Set())}
                                                className="p-1 hover:bg-orange-100 rounded text-orange-600 transition-colors"
                                                title="Bỏ chọn tất cả"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input type="checkbox" checked readOnly className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-orange-400 bg-orange-400" />
                                                    <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none" />
                                                </div>
                                            </button>
                                            <span className="text-xs font-bold text-slate-700">
                                                Đã chọn <span className="text-orange-600 font-black text-sm">{selectedIds.size}</span> khách hàng
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleCopyEmails} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-blue-600 hover:shadow-sm transition-all" title="Sao chép Email">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleExportCSV} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-emerald-600 hover:shadow-sm transition-all" title="Xuất CSV">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleSendEmail} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 hover:shadow-sm transition-all" title="Gửi Email">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <div className="h-4 w-px bg-orange-200 mx-1"></div>
                                            <button onClick={() => handleRemoveClick(Array.from(selectedIds))} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg text-xs font-bold shadow-sm transition-all">
                                                {group.type === 'list' ? <UserMinus className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                <span>{group.type === 'list' ? 'Gỡ khỏi List' : 'Gỡ Tag'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        ) : (
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-4 py-3 w-10 pl-6">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isAllPageSelected}
                                            onChange={toggleSelectAll}
                                            className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-[#ffa900] checked:bg-[#ffa900] hover:border-[#ffa900]"
                                        />
                                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedMembers.map(member => (
                            <tr key={member.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(member.id) ? 'bg-orange-50/20' : ''}`}>
                                <td className="px-4 py-3 pl-6" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(member.id)}
                                            onChange={() => toggleSelectOne(member.id)}
                                            className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-[#ffa900] checked:bg-[#ffa900] hover:border-[#ffa900]"
                                        />
                                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="px-6 py-3 cursor-pointer" onClick={() => onViewProfile(member)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {(member.firstName || '?')[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{member.firstName} {member.lastName}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span className={`inline-flex w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={member.status}></span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    {group.type === 'list' ? (
                                        <button 
                                            onClick={() => handleRemoveClick([member.id])}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Xóa khỏi danh sách này"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    ) : group.type === 'tag' ? (
                                        <button 
                                            onClick={() => handleRemoveClick([member.id])}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Gỡ nhãn này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onViewProfile(member)}
                                            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Chỉnh sửa hồ sơ"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedMembers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-slate-400 text-xs font-medium italic">
                                    Không tìm thấy thành viên phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Segment Note */}
            {group.type === 'segment' && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-700 text-xs shrink-0">
                    <Filter className="w-4 h-4 shrink-0" />
                    <p><strong>Lưu ý:</strong> Phân khúc là nhóm động. Để loại bỏ thành viên, hãy chỉnh sửa hồ sơ của họ (ví dụ: gỡ Tag) để không còn khớp với điều kiện lọc.</p>
                </div>
            )}
        </div>
        </Modal>

        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />

        <ConfirmationModal 
            isOpen={confirmState.isOpen}
            onClose={() => setConfirmState({...confirmState, isOpen: false})}
            onConfirm={executeRemove}
            title={group.type === 'list' ? "Xác nhận gỡ khỏi danh sách" : "Xác nhận gỡ nhãn"}
            message={confirmState.message}
            variant="danger"
            confirmLabel="Thực hiện ngay"
        />
    </>
  );
};

export default GroupDetailModal;
