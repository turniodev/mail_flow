
import React, { useState } from 'react';
import { Layers, MoreVertical, RefreshCw, Filter, Edit3, Trash2, CheckSquare, Square, X } from 'lucide-react';
import Card from '../../common/Card';
import { Segment } from '../../../types';

interface SegmentsTabProps {
  segments: Segment[];
  onView: (segment: Segment) => void;
  onEdit: (segment: Segment) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

const SegmentsTab: React.FC<SegmentsTabProps> = ({ segments, onView, onEdit, onDelete, onBulkDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleSelectAll = () => {
      const allSelected = segments.every(s => selectedIds.has(s.id));
      if (allSelected) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(segments.map(s => s.id)));
      }
  };

  const toggleSelectOne = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeletingId(id);
      setTimeout(() => {
          onDelete(id);
          setDeletingId(null);
      }, 300);
  };

  const isAllSelected = segments.length > 0 && segments.every(s => selectedIds.has(s.id));

  return (
    <>
        <Card noPadding className="border-0 shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-left sticky top-0 z-20 backdrop-blur-sm">
                        {selectedIds.size > 0 ? (
                            <tr className="bg-[#fffbf0] border-b border-orange-200 shadow-sm animate-in fade-in duration-200">
                                <th colSpan={6} className="px-4 py-3">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <button onClick={toggleSelectAll} className="p-1 hover:bg-orange-100 rounded text-orange-600 transition-colors" title="Bỏ chọn tất cả">
                                                {isAllSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-orange-400" />}
                                            </button>
                                            <span className="text-xs font-bold text-slate-700">Đã chọn <span className="text-orange-600 font-black text-sm">{selectedIds.size}</span> phân khúc</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => { onBulkDelete && onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg text-xs font-bold shadow-sm transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Xóa nhanh</span>
                                            </button>
                                            <button 
                                                onClick={() => setSelectedIds(new Set())}
                                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600"
                                                title="Hủy chọn"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        {isAllSelected ? <CheckSquare className="w-5 h-5 text-[#ffa900]" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tên phân khúc</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Điều kiện lọc</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đồng bộ</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Kết quả</th>
                                <th className="px-6 py-4 w-28 text-right pr-8">Thao tác</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {segments.map(seg => {
                            const isDeleting = deletingId === seg.id;
                            const isSelected = selectedIds.has(seg.id);
                            return (
                                <tr 
                                    key={seg.id} 
                                    className={`group hover:bg-slate-50/50 transition-all duration-300 cursor-pointer ${isDeleting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'} ${isSelected ? 'bg-orange-50/20' : ''}`}
                                    onClick={() => onView(seg)}
                                >
                                    <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => toggleSelectOne(seg.id)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                            {isSelected ? <CheckSquare className="w-5 h-5 text-[#ffa900]" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 pl-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ca7900] flex items-center justify-center shrink-0 border border-orange-100 group-hover:bg-[#ffa900] group-hover:text-white transition-all">
                                                <Layers className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 group-hover:text-[#ca7900] transition-colors">{seg.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{seg.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate max-w-[150px]">
                                                {seg.criteria && seg.criteria.startsWith('[') ? 'Complex Logic' : (seg.criteria || 'Custom')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">
                                            <RefreshCw className="w-3 h-3 animate-spin-slow" />
                                            Auto-Sync
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full">{seg.count.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onEdit(seg); }}
                                                className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                title="Chỉnh sửa cấu hình"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, seg.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                                title="Xóa phân khúc"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    </>
  );
};

export default SegmentsTab;
