import React, { useState, useMemo, useEffect } from 'react';
import { Search, Users, Layers, List, Plus, CheckCircle2, Upload, FileText, X, ArrowRight, Sparkles, Tag } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';

interface AudienceSelectorProps {
  allLists: any[];
  allSegments: any[];
  allTags?: any[];
  selectedTarget: { listIds: string[], segmentIds: string[], tagIds?: string[] };
  onTargetChange: (target: { listIds: string[], segmentIds: string[], tagIds: string[] }) => void;
  // Fix: Removed onPasteData as the functionality is now handled by onImport
  // onPasteData: (subscribers: any[], mode: 'new' | 'existing', listIdOrName: string) => void;
  error?: boolean;
  // Fix: Added existingEmails and onImport to props
  existingEmails: Set<string>;
  onImport: (data: { 
      subscribers: any[], 
      targetListId: string | null, 
      newListName: string | null,
      duplicates: number
  }) => Promise<void>; // Changed return type to Promise<void>
}

const AudienceSelector: React.FC<AudienceSelectorProps> = ({ 
    allLists, allSegments, allTags = [], selectedTarget, onTargetChange, error,
    existingEmails, onImport // Destructure existingEmails and onImport
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'segments' | 'tags'>('lists');
  const [search, setSearch] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  // Fix: Renamed importStep to step for consistency with usage
  const [step, setStep] = useState(1); 
  const [rawData, setRawData] = useState('');
  const [fileName, setFileName] = useState('');
  // Fix: Add headers and setHeaders to state
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [targetListId, setTargetListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  
  // Fix: Add stats and setStats to state
  const [stats, setStats] = useState({ valid: 0, duplicates: 0, total: 0 });
  // Fix: Declare inputMethod state
  const [inputMethod, setInputMethod] = useState<'paste' | 'file'>('paste');

  // Fix: existingEmails is a Set, no need for .has property, it's a direct method
  // const existingEmailsSet = useMemo(() => new Set(existingEmails), [existingEmails]);

  // Fix: Changed useEffect dependency from `isOpen` to `isImporting`
  useEffect(() => {
    if (isImporting) {
        setStep(1);
        setRawData('');
        setParsedRows([]);
        setFileName('');
        setStats({ valid: 0, duplicates: 0, total: 0 });
        setNewListName('');
        setImportMode('new');
        // Fix: Use defaultTab prop for initial input method
        // setInputMethod(defaultTab);
        // The prop defaultTab is not passed to AudienceSelector, so keep it as 'paste' for now.
        // It's likely intended for the ImportSubscribersModal.
        // Fix: `setInputMethod` is a state setter, ensuring it's available.
        setInputMethod('paste'); 
    }
  }, [isImporting]);

  const filteredLists = allLists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const filteredSegs = allSegments.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  // FIX: Ensure allTags is an array before filtering
  const filteredTags = Array.isArray(allTags) ? allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase())) : [];

  const selectedListCount = selectedTarget.listIds?.length || 0;
  const selectedSegCount = selectedTarget.segmentIds?.length || 0;
  // FIX: Ensure selectedTarget.tagIds is an array before checking length
  const selectedTagCount = (Array.isArray(selectedTarget.tagIds) ? selectedTarget.tagIds : []).length || 0;

  const toggle = (type: 'list' | 'segment' | 'tag', id: string) => {
      const newTarget = { 
          listIds: selectedTarget.listIds || [],
          segmentIds: selectedTarget.segmentIds || [],
          // FIX: Ensure selectedTarget.tagIds is an array
          tagIds: Array.isArray(selectedTarget.tagIds) ? [...selectedTarget.tagIds] : []
      };
      
      const key = type === 'list' ? 'listIds' : (type === 'segment' ? 'segmentIds' : 'tagIds');
      
      if (newTarget[key].includes(id)) {
          newTarget[key] = newTarget[key].filter(x => x !== id);
      } else {
          newTarget[key] = [...newTarget[key], id];
      }
      onTargetChange(newTarget);
  };

  const calculateTotal = () => {
      let total = 0;
      (selectedTarget.listIds || []).forEach(id => {
          const l = allLists.find(x => x.id === id);
          if (l) total += (l.count || 0);
      });
      (selectedTarget.segmentIds || []).forEach(id => {
          const s = allSegments.find(x => x.id === id);
          if (s) total += (s.count || 0);
      });
      // FIX: Ensure selectedTarget.tagIds is an array before iterating
      (Array.isArray(selectedTarget.tagIds) ? selectedTarget.tagIds : []).forEach(id => {
          const t = allTags.find(x => x.name === id || x.id === id); // Assuming tag.id or tag.name could be used
          if (t) total += (t.count || 0);
      });
      return total;
  };

  const formatNameFromEmail = (email: string) => {
      if (!email) return 'User';
      const localPart = email.split('@')[0];
      // Loại bỏ số và ký tự đặc biệt, chỉ giữ lại chữ cái
      const cleaned = localPart.replace(/[^a-zA-Z]/g, '');
      if (!cleaned) return 'User';
      // Viết hoa chữ đầu, còn lại viết thường
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  const parseData = () => {
      if (!rawData.trim()) return;

      const delimiter = detectDelimiter(rawData);
      const lines = rawData.trim().split('\n');
      const headerRow = lines[0].split(delimiter).map(h => h.trim().replace(/['"]+/g, ''));
      // Fix: Use setHeaders for state update
      setHeaders(headerRow);

      const dataRows = lines.slice(1).map(line => {
          if (!line.trim()) return null;
          const values = line.split(delimiter).map(v => v.trim().replace(/['"]+/g, ''));
          const rowObj: any = {};
          headerRow.forEach((header, index) => {
              let key = header.toLowerCase();
              if (key.includes('mail')) key = 'email';
              else if (key.includes('first') || key.includes('tên')) key = 'firstName';
              else if (key.includes('last') || key.includes('họ')) key = 'lastName';
              else if (key.includes('tag')) key = 'tags';
              else if (key.includes('date') || key.includes('ngày')) key = 'joinedAt';
              
              rowObj[key] = values[index] || '';
          });
          
          // Tự động đặt tên nếu trống
          if (rowObj.email && !rowObj.firstName) {
              rowObj.firstName = formatNameFromEmail(rowObj.email);
          }

          return rowObj;
      }).filter(r => r && r.email && r.email.includes('@'));

      let dupCount = 0;
      const validRows: any[] = [];
      
      dataRows.forEach((row: any) => {
          // FIX: existingEmails is a Set, .has() is correct.
          // The issue might have been if row.email was not a string or malformed.
          // But that's handled by filter(r => r && r.email && r.email.includes('@')).
          // Fix: Use the existingEmails prop directly
          if (existingEmails.has(row.email)) {
              dupCount++;
          } else {
              validRows.push(row);
          }
      });

      setParsedRows(validRows);
      // Fix: Use setStats for state update
      setStats({ total: dataRows.length, valid: validRows.length, duplicates: dupCount });
      // Fix: Use setStep for state update
      setStep(2);
  };

  const detectDelimiter = (str: string) => {
      const firstLine = str.split('\n')[0];
      if (firstLine.includes('\t')) return '\t';
      if (firstLine.includes(';')) return ';';
      return ',';
  };

  const handleFinishImport = async () => {
      // Fix: Use onImport prop
      await onImport({
          subscribers: parsedRows,
          // Fix: Use importMode and targetListId from state
          targetListId: importMode === 'existing' ? targetListId : null,
          newListName: importMode === 'new' ? newListName : null,
          // Fix: Use stats from state
          duplicates: stats.duplicates
      });
      setIsImporting(false);
      setStep(1);
      setRawData('');
      setNewListName('');
  };

  return (
    <div className={`relative bg-white rounded-[24px] border shadow-sm overflow-hidden transition-all min-h-[400px] flex flex-col ${error ? 'border-rose-500 ring-4 ring-rose-50' : 'border-slate-200'}`}>
      <div className="px-6 pt-6 pb-2 flex justify-between items-center border-b border-slate-100">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveTab('lists')} className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'lists' ? 'border-[#ffa900] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <List className="w-4 h-4" /> Danh sách ({filteredLists.length})
                  {selectedListCount > 0 && <span className="ml-1 bg-[#ffa900] text-white text-[9px] px-1.5 py-0.5 rounded-full">{selectedListCount}</span>}
              </button>
              <button onClick={() => setActiveTab('segments')} className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'segments' ? 'border-[#ffa900] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <Layers className="w-4 h-4" /> Phân khúc ({filteredSegs.length})
                  {selectedSegCount > 0 && <span className="ml-1 bg-[#ffa900] text-white text-[9px] px-1.5 py-0.5 rounded-full">{selectedSegCount}</span>}
              </button>
              <button onClick={() => setActiveTab('tags')} className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'tags' ? 'border-[#ffa900] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <Tag className="w-4 h-4" /> Nhãn ({filteredTags.length})
                  {selectedTagCount > 0 && <span className="ml-1 bg-[#ffa900] text-white text-[9px] px-1.5 py-0.5 rounded-full">{selectedTagCount}</span>}
              </button>
          </div>
          <div className="pb-2 pl-4">
             <button onClick={() => setIsImporting(true)} className="text-[10px] font-bold uppercase tracking-wider text-[#ca7900] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap">
                 <Plus className="w-3.5 h-3.5" /> Import Nhanh
             </button>
          </div>
      </div>

      <div className="flex-1 p-4 bg-slate-50/50 relative">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={activeTab === 'lists' ? "Tìm danh sách..." : (activeTab === 'segments' ? "Tìm phân khúc..." : "Tìm nhãn...")} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ffa900] transition-all" />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {activeTab === 'lists' && (
                  filteredLists.length > 0 ? filteredLists.map(l => (
                      <div key={l.id} onClick={() => toggle('list', l.id)} className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedTarget.listIds?.includes(l.id) ? 'bg-[#fff9f0] border-orange-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTarget.listIds?.includes(l.id) ? 'bg-[#ffa900] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <List className="w-4 h-4" />
                              </div>
                              <div><p className="text-xs font-bold text-slate-800">{l.name}</p><p className="text-[9px] text-slate-400 font-semibold">{l.count.toLocaleString()} liên hệ</p></div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedTarget.listIds?.includes(l.id) ? 'border-[#ffa900] bg-[#ffa900] text-white' : 'border-slate-300'}`}>{selectedTarget.listIds?.includes(l.id) && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
                      </div>
                  )) : <div className="text-center py-8 text-xs text-slate-400 font-medium">Không tìm thấy danh sách nào.</div>
              )}
              {activeTab === 'segments' && (
                  filteredSegs.length > 0 ? filteredSegs.map(s => (
                      <div key={s.id} onClick={() => toggle('segment', s.id)} className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedTarget.segmentIds?.includes(s.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTarget.segmentIds?.includes(s.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Layers className="w-4 h-4" />
                              </div>
                              <div><p className="text-xs font-bold text-slate-800">{s.name}</p><p className="text-[9px] text-slate-400 font-semibold">{s.count.toLocaleString()} liên hệ</p></div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedTarget.segmentIds?.includes(s.id) ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>{selectedTarget.segmentIds?.includes(s.id) && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
                      </div>
                  )) : <div className="text-center py-8 text-xs text-slate-400 font-medium">Không tìm thấy phân khúc nào.</div>
              )}
              {activeTab === 'tags' && (
                  filteredTags.length > 0 ? filteredTags.map(t => (
                      <div key={t.id} onClick={() => toggle('tag', t.name)} className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedTarget.tagIds?.includes(t.name) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTarget.tagIds?.includes(t.name) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  <Tag className="w-4 h-4" />
                              </div>
                              <div><p className="text-xs font-bold text-slate-800">{t.name}</p><p className="text-[9px] text-slate-400 font-semibold">{t.count.toLocaleString()} liên hệ</p></div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedTarget.tagIds?.includes(t.name) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>{selectedTarget.tagIds?.includes(t.name) && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
                      </div>
                  )) : <div className="text-center py-8 text-xs text-slate-400 font-medium">Không tìm thấy nhãn nào.</div>
              )}
          </div>

          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 group cursor-help">
              <Sparkles className="w-3.5 h-3.5 text-[#ffa900] animate-pulse" />
              <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ước tính:</span>
                  <span className="text-sm font-bold">{calculateTotal().toLocaleString()}</span>
              </div>
          </div>

          {isImporting && (
              <div className="absolute inset-0 bg-white z-20 animate-in slide-in-from-bottom-full duration-300 flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div><h4 className="text-sm font-bold text-slate-800">Import Nhanh</h4><p className="text-[10px] text-slate-500 font-medium">Dán email để thêm vào chiến dịch.</p></div>
                      <button onClick={() => setIsImporting(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                      {step === 1 ? (
                          <div className="space-y-4">
                              <textarea value={rawData} onChange={e => setRawData(e.target.value)} placeholder="Dán danh sách email (mỗi dòng 1 email)..." className="w-full h-40 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono focus:border-[#ffa900] outline-none resize-none" autoFocus />
                              <Button fullWidth onClick={parseData} disabled={!rawData.trim()} icon={ArrowRight}>Kiểm tra dữ liệu</Button>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 className="w-4 h-4" /></div>
                                  <div><p className="text-xs font-bold text-emerald-800">Tìm thấy {parsedRows.length} liên hệ</p><p className="text-[10px] text-emerald-600">Tên sẽ được tự động tạo từ Email (loại bỏ số).</p></div>
                              </div>
                              <Input label="Tên danh sách mới" placeholder="VD: Khách hàng tháng 10..." value={newListName} onChange={e => setNewListName(e.target.value)} autoFocus icon={Plus} />
                              <div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(1)}>Quay lại</Button><Button fullWidth onClick={handleFinishImport} disabled={!newListName.trim()}>Hoàn tất & Chọn</Button></div>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default AudienceSelector;