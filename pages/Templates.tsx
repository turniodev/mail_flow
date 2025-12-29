import React, { useEffect, useState } from 'react';
import { api } from '../services/storageAdapter';
import { Template } from '../types';
import { Edit3, Copy, Trash2, Plus, Layout, Eye, Sparkles, FolderOpen, Globe, Search, Filter } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import EmailEditor, { compileHTML } from '../components/templates/EmailEditor/index';
import Toast, { ToastType } from '../components/common/Toast';
import EmailPreviewDrawer from '../components/flows/config/EmailPreviewDrawer';
import Tabs from '../components/common/Tabs';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { SYSTEM_TEMPLATES } from '../services/systemTemplates';

const Templates: React.FC = () => {
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
  
  // Preview & Interaction State
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  // Filter State
  const [libraryType, setLibraryType] = useState<'system' | 'personal'>('system');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirm Delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  const showToast = (msg: string, type: ToastType = 'success') => setToast({ message: msg, type, isVisible: true });

  useEffect(() => {
    fetchUserTemplates();
  }, []);

  const fetchUserTemplates = async () => {
    setLoading(true);
    const res = await api.get<Template[]>('templates');
    if (res.success) setUserTemplates(res.data);
    setLoading(false);
  };

  const handleSaveTemplate = async (data: Partial<Template>, shouldExit: boolean = false) => {
      let res;
      // If editing an existing USER template
      if (editingTemplate && editingTemplate.id && !editingTemplate.id.startsWith('sys_')) {
          res = await api.put(`templates/${editingTemplate.id}`, { ...editingTemplate, ...data, lastModified: new Date().toISOString() });
          if (res.success) showToast('Đã cập nhật mẫu email');
      } else {
          // Creating new or saving a copy
          res = await api.post('templates', { 
              ...data, 
              category: data.category || 'promotional',
              thumbnail: data.thumbnail || 'https://placehold.co/600x400/f1f5f9/94a3b8?text=Email+Template' 
          });
          if (res.success) {
            showToast('Đã tạo mẫu email mới');
            // Update the local state with the new template ID if we stay in editor
            setEditingTemplate(res.data); 
          }
      }
      
      if (shouldExit) {
          setIsEditorOpen(false);
          setEditingTemplate(undefined);
          fetchUserTemplates(); // Refresh list
          setLibraryType('personal'); // Switch to personal tab to see new template
      }
  };

  const handleDelete = async (id: string) => {
      const res = await api.delete(`templates/${id}`);
      if (res.success) {
          setUserTemplates(userTemplates.filter(t => t.id !== id));
          showToast('Đã xóa mẫu email', 'info');
      }
  };

  const handleDuplicate = async (tpl: Template) => {
      // Determine name
      const baseName = tpl.name.replace(' (Copy)', '');
      const newName = `${baseName} (Copy)`;
      
      // If duplicating a system template, we must ensure it has HTML content generated
      let htmlContent = tpl.htmlContent;
      if (!htmlContent && tpl.blocks) {
          htmlContent = compileHTML(tpl.blocks, tpl.bodyStyle, tpl.name);
      }

      const newTpl = { 
          name: newName,
          category: tpl.category,
          thumbnail: tpl.thumbnail,
          blocks: tpl.blocks,
          bodyStyle: tpl.bodyStyle,
          htmlContent: htmlContent
      };

      const res = await api.post('templates', newTpl);
      if (res.success) {
          await fetchUserTemplates();
          setLibraryType('personal');
          showToast('Đã nhân bản mẫu thành công', 'success');
      }
  };

  // --- Filtering Logic ---
  const sourceTemplates = libraryType === 'system' ? SYSTEM_TEMPLATES : userTemplates;
  
  const filteredTemplates = sourceTemplates.filter(t => {
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  // Calculate compiled HTML for preview if missing (for system templates)
  const getPreviewHTML = (tpl: Template | null) => {
      if (!tpl) return '';
      if (tpl.htmlContent) return tpl.htmlContent;
      if (tpl.blocks) return compileHTML(tpl.blocks, tpl.bodyStyle, tpl.name);
      return '';
  };

  const getCategoryLabel = (cat: string) => {
      switch(cat) {
          case 'welcome': return 'Chào mừng';
          case 'promotional': return 'Khuyến mãi';
          case 'newsletter': return 'Bản tin';
          case 'transactional': return 'Giao dịch';
          case 'event': return 'Sự kiện';
          default: return cat;
      }
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'welcome': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
          case 'promotional': return 'bg-orange-50 text-orange-600 border-orange-100';
          case 'newsletter': return 'bg-blue-50 text-blue-600 border-blue-100';
          case 'transactional': return 'bg-slate-50 text-slate-600 border-slate-200';
          case 'event': return 'bg-purple-50 text-purple-600 border-purple-100';
          default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
  };

  if (isEditorOpen) {
      return (
          <EmailEditor 
              template={editingTemplate} 
              onSave={handleSaveTemplate} 
              onCancel={() => { setIsEditorOpen(false); setEditingTemplate(undefined); }} 
          />
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="Thư viện Mẫu Email" 
        description="Quản lý các mẫu thiết kế (Templates) để tái sử dụng trong chiến dịch và automation."
        action={<Button icon={Plus} size="lg" onClick={() => { setEditingTemplate(undefined); setIsEditorOpen(true); }}>Tạo mẫu mới</Button>}
      />

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
          
          <Tabs 
            activeId={libraryType} 
            onChange={setLibraryType as any}
            items={[
                { id: 'system', label: 'Mẫu hệ thống', icon: Globe },
                { id: 'personal', label: 'Mẫu của tôi', icon: FolderOpen, count: userTemplates.length },
            ]}
          />

          <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ffa900] transition-colors" />
                  <input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Tìm kiếm mẫu..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#ffa900] transition-all" 
                  />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {['all', 'newsletter', 'promotional', 'welcome', 'event', 'transactional'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                          {cat === 'all' ? 'Tất cả' : getCategoryLabel(cat)}
                      </button>
                  ))}
              </div>
          </div>

          {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[24px] animate-pulse" />)}
              </div>
          ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200">
                  <Layout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-500">Không tìm thấy mẫu phù hợp</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTemplates.map(tpl => (
                      <div key={tpl.id} className="group bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 flex flex-col">
                          <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                              <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                  <button onClick={() => setPreviewTemplate(tpl)} className="p-3 bg-white rounded-xl hover:bg-[#ffa900] hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300"><Eye className="w-5 h-5" /></button>
                                  {libraryType === 'personal' && (
                                      <button onClick={() => { setEditingTemplate(tpl); setIsEditorOpen(true); }} className="p-3 bg-white rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"><Edit3 className="w-5 h-5" /></button>
                                  )}
                                  <button onClick={() => handleDuplicate(tpl)} className="p-3 bg-white rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-100"><Copy className="w-5 h-5" /></button>
                              </div>
                              <div className="absolute top-3 left-3">
                                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getCategoryColor(tpl.category)} bg-white`}>
                                      {getCategoryLabel(tpl.category)}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1" title={tpl.name}>{tpl.name}</h4>
                                  {libraryType === 'personal' && (
                                      <button onClick={() => setDeleteConfirm({ isOpen: true, id: tpl.id })} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                  )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-auto flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-yellow-500" /> 
                                  {tpl.id.startsWith('sys_') ? 'System Template' : `Edited: ${new Date(tpl.lastModified).toLocaleDateString('vi-VN')}`}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <EmailPreviewDrawer 
        template={previewTemplate} 
        htmlContent={getPreviewHTML(previewTemplate)}
        isOpen={!!previewTemplate} 
        onClose={() => setPreviewTemplate(null)}
        onAction={() => { 
            if(previewTemplate) { 
                if (libraryType === 'personal') {
                    setEditingTemplate(previewTemplate); 
                    setIsEditorOpen(true); 
                } else {
                    handleDuplicate(previewTemplate);
                }
                setPreviewTemplate(null);
            } 
        }}
        actionLabel={libraryType === 'personal' ? 'Chỉnh sửa' : 'Sử dụng mẫu này'}
      />

      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen} 
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })} 
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)} 
        title="Xóa mẫu email?" 
        message="Hành động này không thể hoàn tác." 
        variant="danger" 
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
    </div>
  );
};

export default Templates;