
import React, { useState, useEffect } from 'react';
import { 
    Code2, Plus, Globe, Copy, Check, Terminal, FileCode, Search, 
    Database, List, CheckCircle2, X, Layout, Info, Braces, ArrowRight, Trash2,
    Settings, MousePointer2, FileText, Edit3, ChevronDown, Monitor, BookOpen,
    Type, Mail, Phone, Calendar, Briefcase, Building, MapPin, Sparkles, FileInput
} from 'lucide-react';
import { api } from '../services/storageAdapter';
import { FormDefinition, FormField } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Toast, { ToastType } from '../components/common/Toast';
import Badge from '../components/common/Badge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import IntegrationGuideModal from '../components/flows/modals/IntegrationGuideModal';

const DB_FIELDS = [
    { value: 'email', label: 'Địa chỉ Email (Bắt buộc)', type: 'email', required: true, icon: Mail },
    { value: 'firstName', label: 'Tên khách hàng', type: 'text', required: false, icon: Type },
    { value: 'lastName', label: 'Họ khách hàng', type: 'text', required: false, icon: Type },
    { value: 'phoneNumber', label: 'Số điện thoại', type: 'tel', required: false, icon: Phone },
    { value: 'jobTitle', label: 'Chức danh', type: 'text', required: false, icon: Briefcase },
    { value: 'companyName', label: 'Công ty', type: 'text', required: false, icon: Building },
    { value: 'country', label: 'Quốc gia', type: 'text', required: false, icon: Globe },
    { value: 'city', label: 'Thành phố', type: 'text', required: false, icon: MapPin },
    { value: 'dateOfBirth', label: 'Ngày sinh', type: 'date', required: false, icon: Calendar },
];

const Forms: React.FC = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FormDefinition>>({
      name: '', targetListId: '', fields: [{ id: 'f-email', dbField: 'email', label: 'Địa chỉ Email', required: true, type: 'email' }]
  });

  const [selectedFormForCode, setSelectedFormForCode] = useState<FormDefinition | null>(null);

  // Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [formsRes, listsRes] = await Promise.all([
        api.get<FormDefinition[]>('forms'),
        api.get<any[]>('lists')
    ]);
    if (formsRes.success) setForms(formsRes.data);
    if (listsRes.success) setLists(listsRes.data);
    setLoading(false);
  };

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type, isVisible: true });

  const handleCreateNew = () => {
      setEditingFormId(null);
      setFormData({
          name: '', targetListId: '', fields: [{ id: 'f-email', dbField: 'email', label: 'Địa chỉ Email', required: true, type: 'email' }]
      });
      setIsModalOpen(true);
  };

  const handleEditClick = (form: FormDefinition) => {
      setEditingFormId(form.id);
      setFormData({
          name: form.name,
          targetListId: form.targetListId,
          fields: [...form.fields]
      });
      setIsModalOpen(true);
  };

  const handleAddField = () => {
      setFormData({ 
          ...formData, 
          fields: [...(formData.fields || []), { id: crypto.randomUUID(), dbField: 'firstName', label: 'Tên khách hàng', required: false, type: 'text' }]
      });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
      setFormData({
          ...formData,
          fields: formData.fields?.map(f => {
              if (f.id !== id) return f;
              const newF = { ...f, ...updates };
              if (updates.dbField) {
                  const def = DB_FIELDS.find(d => d.value === updates.dbField);
                  if (def) {
                      newF.label = def.label;
                      newF.type = def.type as any;
                  }
              }
              return newF;
          })
      });
  };

  const handleSaveForm = async () => {
      if (!formData.name || !formData.targetListId) {
          showToast('Vui lòng điền đủ tên và list đích', 'error');
          return;
      }
      setIsSubmitting(true);
      
      let res;
      if (editingFormId) {
          res = await api.put<FormDefinition>(`forms/${editingFormId}`, formData);
      } else {
          res = await api.post<FormDefinition>('forms', formData);
      }

      if (res.success) {
          setIsModalOpen(false);
          showToast(editingFormId ? 'Đã cập nhật Form thành công' : 'Đã lưu cấu hình Form mới');
          fetchInitialData();
      } else {
          showToast(res.message || 'Lỗi khi lưu Form', 'error');
      }
      setIsSubmitting(false);
  };

  const executeDelete = async () => {
      if (!confirmDeleteId) return;
      
      const res = await api.delete(`forms/${confirmDeleteId}`);
      if (res.success) {
          setForms(forms.filter(f => f.id !== confirmDeleteId));
          showToast('Đã xóa biểu mẫu và tạm dừng các Flow liên quan');
          setConfirmDeleteId(null);
      } else {
          showToast('Lỗi khi xóa Form', 'error');
      }
  };

  const getFieldIcon = (dbField: string) => {
      const field = DB_FIELDS.find(f => f.value === dbField);
      return field?.icon || Type;
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto pb-40">
      <PageHeader 
        title="Biểu mẫu & API" 
        description="Thu thập khách hàng tiềm năng từ Website và kích hoạt Automation ngay lập tức."
        action={<Button icon={Plus} size="lg" onClick={handleCreateNew}>Tạo Form mới</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[40px] animate-pulse border border-slate-100" />)}
           </div>
        ) : forms.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[50px] bg-white">
                <Code2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-500 font-black text-xl uppercase tracking-tight">Chưa có biểu mẫu nào</h3>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto text-sm">Tạo form để bắt đầu thu thập khách hàng từ website của bạn.</p>
                <Button variant="outline" className="mt-10 px-10 h-12 rounded-2xl" onClick={handleCreateNew}>Bắt đầu ngay</Button>
            </div>
        ) : forms.map(form => (
            <div key={form.id} className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-200 transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-amber-600 group-hover:scale-125 transition-transform"><Globe className="w-32 h-32" /></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Changed to Amber Gradient & FileInput Icon to match Flow Creation Modal */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:rotate-6 transition-transform">
                            <FileInput className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-800 leading-tight truncate pr-2" title={form.name}>{form.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                                    <List className="w-3 h-3" /> {lists.find(l => l.id === form.targetListId)?.name || 'Unknown List'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(form)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Chỉnh sửa">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(form.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-amber-50/50 group-hover:border-amber-100 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chuyển đổi</span>
                            <span className="text-sm font-black text-slate-700">{(form.stats?.submissions || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-400">leads</span></span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số trường</span>
                            <span className="text-sm font-black text-slate-700">{form.fields.length} <span className="text-[10px] font-medium text-slate-400">fields</span></span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedFormForCode(form)} 
                        className="w-full h-11 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 group/btn"
                    >
                        <Code2 className="w-4 h-4 text-[#ffa900] group-hover/btn:rotate-12 transition-transform" />
                        API & Nhúng
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL - REDESIGNED */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingFormId ? "Chỉnh sửa biểu mẫu" : "Thiết kế biểu mẫu mới"} 
        size="lg" 
        footer={<div className="flex justify-between w-full"><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button icon={CheckCircle2} onClick={handleSaveForm} isLoading={isSubmitting}>{editingFormId ? 'Cập nhật Form' : 'Lưu cấu hình Form'}</Button></div>}
      >
          <div className="space-y-8 py-2">
              {/* SECTION 1: General Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Tên định danh Form" 
                    placeholder="VD: Form Landing Page..." 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    autoFocus 
                    className="h-11" 
                  />
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách lưu trữ đích</label>
                      <Select 
                        options={lists.map(l => ({ value: l.id, label: l.name }))} 
                        value={formData.targetListId || ''} 
                        onChange={v => setFormData({...formData, targetListId: v})} 
                        placeholder="Chọn danh sách đích..."
                        icon={Database}
                        variant="outline"
                        className="h-11"
                      />
                  </div>
              </div>

              {/* SECTION 2: Fields Structure */}
              <div className="space-y-4">
                  <div className="flex justify-between items-end px-1 pb-2 border-b border-slate-100">
                    <div>
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <Braces className="w-4 h-4 text-[#ffa900]" /> Cấu trúc trường dữ liệu
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Định nghĩa các trường thông tin bạn muốn thu thập từ khách hàng.</p>
                    </div>
                    <button onClick={handleAddField} className="text-[10px] font-black text-blue-600 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 rounded-lg transition-all border border-blue-100 active:scale-95 shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> THÊM TRƯỜNG
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50/50 p-2 rounded-[24px] border border-slate-200/50 min-h-[200px]">
                      {formData.fields?.map((field, idx) => {
                          const FieldIcon = getFieldIcon(field.dbField);
                          return (
                            <div key={field.id} className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all animate-in slide-in-from-bottom-2 duration-300">
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 border-2 border-white shadow-sm z-10">{idx + 1}</div>
                                
                                <div className="pl-4 w-full sm:w-56 shrink-0">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Trường Database</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FieldIcon className="w-4 h-4" /></div>
                                            <select 
                                                value={field.dbField}
                                                onChange={e => updateField(field.id, { dbField: e.target.value })}
                                                disabled={field.dbField === 'email'}
                                                className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold appearance-none outline-none border-2 transition-all ${field.dbField === 'email' ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                                            >
                                                {DB_FIELDS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                        </div>
                                </div>

                                <div className="flex-1 w-full">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tiêu đề hiển thị (Label)</label>
                                        <input 
                                            value={field.label} 
                                            onChange={e => updateField(field.id, { label: e.target.value })} 
                                            className="w-full h-[40px] px-4 bg-slate-50 border-2 border-transparent rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#ffa900] transition-all placeholder:text-slate-300" 
                                            placeholder="Nhập tên trường..."
                                        />
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-6 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0">
                                        <div 
                                            onClick={() => field.dbField !== 'email' && updateField(field.id, { required: !field.required })}
                                            className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg transition-all select-none ${field.dbField === 'email' ? 'opacity-50 pointer-events-none bg-slate-100' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 flex items-center ${field.required ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${field.required ? 'text-emerald-600' : 'text-slate-400'}`}>Bắt buộc</span>
                                        </div>
                                        
                                        {field.dbField !== 'email' ? (
                                            <button onClick={() => setFormData({...formData, fields: formData.fields?.filter(f => f.id !== field.id)})} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                        ) : (
                                            <div className="w-8"></div>
                                        )}
                                </div>
                            </div>
                          );
                      })}
                      <div className="p-4 bg-white/40 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" /> Dữ liệu sẽ tự động đồng bộ vào hồ sơ khách hàng.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </Modal>

      {/* GET CODE MODAL */}
      {selectedFormForCode && (
          <IntegrationGuideModal 
            isOpen={!!selectedFormForCode} 
            onClose={() => setSelectedFormForCode(null)} 
            formId={selectedFormForCode.id} 
            formName={selectedFormForCode.name} 
            fields={selectedFormForCode.fields}
          />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={executeDelete}
        title="Xác nhận xóa biểu mẫu"
        message="Hành động này sẽ xóa vĩnh viễn biểu mẫu này. Mọi kịch bản Automation đang liên kết sẽ bị TẠM DỪNG ngay lập tức để bảo vệ dữ liệu."
        variant="danger"
        confirmLabel="Xóa vĩnh viễn"
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({...toast, isVisible: false})} />
    </div>
  );
};

export default Forms;
