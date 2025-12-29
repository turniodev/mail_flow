

import React, { useState } from 'react';
import { MoreHorizontal, Clock, MailOpen, MousePointer2, User, UserPlus, Calendar, Trash2, X, ChevronLeft, ChevronRight, Copy, Download, Mail, Check } from 'lucide-react';
import Badge from '../../common/Badge';
import { Subscriber } from '../../types';
import Button from '../../common/Button';
import Toast, { ToastType } from '../../common/Toast';

interface ContactsTabProps {
  subscribers: Subscriber[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectSubscriber: (sub: Subscriber) => void;
  formatRelativeTime: (dateString?: string) => string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBulkDelete: () => void;
}

const ContactsTab: React.FC<ContactsTabProps> = ({ 
    subscribers, selectedIds, onToggleSelection, onToggleSelectAll, onSelectSubscriber,
    formatRelativeTime, currentPage, totalPages, onPageChange, onBulkDelete
}) => {
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });

  // Calculate how many on current page are selected
  const currentPageIds = subscribers.map(s => s.id);
  const selectedOnPageCount = currentPageIds.filter(id => selectedIds.has(id)).length;
  const isAllPageSelected = currentPageIds.length > 0 && selectedOnPageCount === currentPageIds.length;

  const showToast = (message: string, type: ToastType) => setToast({ message, type, isVisible: true });

  const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

  // Helper to render Last Active nicely
  const renderLastActive = (sub: Subscriber) => {
      const lastClickDate = sub.stats?.lastClickAt ? new Date(sub.stats.lastClickAt) : null;
      const lastOpenDate = sub.stats?.lastOpenAt ? new Date(sub.stats.lastOpenAt) : null;
      const joinedDate = sub.joinedAt ? new Date(sub.joinedAt) : null;
      
      let latestActivity: { type: 'click' | 'open' | 'joined', date: Date } | null = null;

      // 1. Check Click
      if (lastClickDate && isValidDate(lastClickDate)) {
          latestActivity = { type: 'click', date: lastClickDate };
      }

      // 2. Check Open
      if (lastOpenDate && isValidDate(lastOpenDate)) {
          if (!latestActivity || lastOpenDate.getTime() > latestActivity.date.getTime()) {
              latestActivity = { type: 'open', date: lastOpenDate };
          }
      }

      // 3. Check Join
      if (joinedDate && isValidDate(joinedDate)) {
          if (!latestActivity || joinedDate.getTime() > latestActivity.date.getTime()) {
              latestActivity = { type: 'joined', date: joinedDate };
          }
      }
      
      if (!latestActivity) {
          return (
              <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-medium">Chưa tương tác</span>
                      <span className="text-[9px] opacity-70">gần đây</span>
                  </div>
              </div>
          );
      }

      const timeAgo = formatRelativeTime(latestActivity.date.toISOString());

      if (latestActivity.type === 'click') {
          return (
              <div className="flex items-center gap-2 text-emerald-600">
                  <MousePointer2 className="w-3.5 h-3.5" />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-bold">Vừa click link</span>
                      <span className="text-[9px] opacity-70">{timeAgo}</span>
                  </div>
              </div>
          );
      }
      if (latestActivity.type === 'open') {
          return (
              <div className="flex items-center gap-2 text-blue-600">
                  <MailOpen className="w-3.5 h-3.5" />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-bold">Đã mở mail</span>
                      <span className="text-[9px] opacity-70">{timeAgo}</span>
                  </div>
              </div>
          );
      }
      if (latestActivity.type === 'joined') {
          return (
              <div className="flex items-center gap-2 text-slate-600">
                  <UserPlus className="w-3.5 h-3.5" />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-medium">Tham gia</span>
                      <span className="text-[9px] opacity-70">{timeAgo}</span>
                  </div>
              </div>
          );
      }
      
      return null;
  };

  const renderJoinedDate = (dateStr: string) => {
      if (!dateStr) return <span className="text-xs font-medium text-slate-400">--</span>;
      const d = new Date(dateStr);
      if (!isValidDate(d)) return <span className="text-xs font-medium text-slate-400">Invalid Date</span>;
      return <span className="text-xs font-medium text-slate-500">{d.toLocaleDateString('vi-VN')}</span>;
  };

  const handleCopyEmails = () => {
      // Note: This only copies selected emails ON THE CURRENT PAGE because `subscribers` is paginated.
      // If full selection is needed across pages, state needs to move up or handle differently.
      // For now, this is consistent with the current architecture.
      const selectedMembers = subscribers.filter(s => selectedIds.has(s.id));
      const emails = selectedMembers.map(s => s.email).join(', ');
      navigator.clipboard.writeText(emails);
      showToast(`Đã sao chép ${selectedIds.size} email từ trang này`, 'success');
  };

  const handleExportCSV = () => {
      const selectedMembers = subscribers.filter(s => selectedIds.has(s.id));
      const header = ['ID', 'Email', 'First Name', 'Last Name', 'Status', 'Joined At', 'Tags'];
      const rows = selectedMembers.map(s => [s.id, s.email, s.firstName, s.lastName, s.status, s.joinedAt, (Array.isArray(s.tags) ? s.tags : []).join(';')]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [header, ...rows].map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `contacts_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Đã xuất ${selectedIds.size} liên hệ`, 'success');
  };

  const handleSendEmail = () => {
      const selectedMembers = subscribers.filter(s => selectedIds.has(s.id));
      const emails = selectedMembers.map(s => s.email).join(',');
      window.open(`mailto:?bcc=${emails}`);
  };

  return (
    <>
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-left sticky top-0 z-20 backdrop-blur-sm">
                    {selectedIds.size > 0 ? (
                        <tr className="bg-[#fffbf0] border-b border-orange-200 shadow-sm animate-in fade-in duration-200">
                            <th colSpan={7} className="px-6 py-3">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={onToggleSelectAll}
                                            className="p-1 hover:bg-orange-100 rounded text-orange-600 transition-colors"
                                            title="Bỏ chọn tất cả"
                                        >
                                            <div className="relative flex items-center justify-center">
                                                <input type="checkbox" checked readOnly className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-orange-400 bg-orange-400" />
                                                <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none" />
                                            </div>
                                        </button>
                                        <span className="text-xs font-bold text-slate-700">
                                            Đã chọn <span className="text-orange-600 font-black text-sm">{selectedIds.size}</span> liên hệ
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
                                        <button onClick={onBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg text-xs font-bold shadow-sm transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Xóa nhanh</span>
                                        </button>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    ) : (
                        <tr>
                            <th className="px-6 py-4 w-10 pl-8">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllPageSelected}
                                        onChange={onToggleSelectAll}
                                        className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-[#ffa900] checked:bg-[#ffa900] hover:border-[#ffa900]"
                                    />
                                    <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lần cuối hoạt động</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tham gia</th>
                            <th className="px-6 py-4 text-right pr-8"></th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {subscribers.map((sub) => (
                        <tr 
                            key={sub.id} 
                            className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedIds.has(sub.id) ? 'bg-orange-50/20' : ''}`}
                            onClick={() => onSelectSubscriber(sub)}
                        >
                            <td className="px-6 py-4 pl-8" onClick={(e) => e.stopPropagation()}>
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(sub.id)}
                                        onChange={() => onToggleSelection(sub.id)}
                                        className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-[#ffa900] checked:bg-[#ffa900] hover:border-[#ffa900]"
                                    />
                                    <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs mr-3 border border-slate-200 group-hover:from-[#fff4e0] group-hover:to-[#ffe8cc] group-hover:text-[#ca7900] transition-all shadow-sm">
                                        {(sub.firstName || '?')[0]}{(sub.lastName || '')[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-[#ca7900] transition-colors">{sub.firstName} {sub.lastName}</div>
                                        <div className="text-[11px] font-medium text-slate-400">{sub.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={sub.status === 'active' ? 'success' : 'danger'}>
                                    {sub.status === 'active' ? 'Active' : 'Unsub'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                {renderLastActive(sub)}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-1 flex-wrap">
                                    {/* FIX: Ensure sub.tags is an array before calling slice */}
                                    {(Array.isArray(sub.tags) ? sub.tags : []).slice(0, 2).map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">{tag}</span>
                                    ))}
                                    {/* FIX: Ensure sub.tags is an array before checking length */}
                                    {(Array.isArray(sub.tags) ? sub.tags : []).length > 2 && <span className="text-[10px] text-slate-400 font-bold px-1">+{((Array.isArray(sub.tags) ? sub.tags : []).length - 2)}</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {renderJoinedDate(sub.joinedAt)}
                            </td>
                            <td className="px-6 py-4 text-right pr-8">
                                <button className="text-slate-300 hover:text-[#ca7900] p-1.5 hover:bg-orange-50 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    ))}
                    {subscribers.length === 0 && (
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                                Không tìm thấy liên hệ nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                    Trang <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </>
  );
};

export default ContactsTab;