
import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, List, Plus, X, Database, FileSpreadsheet, DownloadCloud } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import Badge from '../common/Badge';

interface ImportSubscribersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLists: any[];
  existingEmails: Set<string>;
  defaultTab?: 'paste' | 'file';
  onImport: (data: { 
      subscribers: any[], 
      targetListId: string | null, 
      newListName: string | null,
      duplicates: number
  }) => void;
}

const ImportSubscribersModal: React.FC<ImportSubscribersModalProps> = ({ 
    isOpen, onClose, existingLists, existingEmails, onImport, defaultTab = 'paste'
}) => {
  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<'paste' | 'file'>('paste');
  const [rawData, setRawData] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [targetListId, setTargetListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  
  const [stats, setStats] = useState({ valid: 0, duplicates: 0, total: 0 });

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setRawData('');
        setParsedRows([]);
        setFileName('');
        setStats({ valid: 0, duplicates: 0, total: 0 });
        setNewListName('');
        setImportMode('new');
        setInputMethod(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          setRawData(text);
      };
      reader.readAsText(file);
  };

  const detectDelimiter = (str: string) => {
      const firstLine = str.split('\n')[0];
      if (firstLine.includes('\t')) return '\t';
      if (firstLine.includes(';')) return ';';
      return ',';
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
          if (existingEmails.has(row.email)) {
              dupCount++;
          } else {
              validRows.push(row);
          }
      });

      setParsedRows(validRows);
      setStats({ total: dataRows.length, valid: validRows.length, duplicates: dupCount });
      setStep(2);
  };

  const handleFinish = () => {
      onImport({
          subscribers: parsedRows,
          targetListId: importMode === 'existing' ? targetListId : null,
          newListName: importMode === 'new' ? newListName : null,
          duplicates: stats.duplicates
      });
      onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import danh sách liên hệ"
      size="lg"
      footer={
          <div className="flex justify-between w-full items-center">
              <div className="flex gap-2">
                  {[1, 2].map(i => (
                      <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-[#ffa900]' : 'bg-slate-200'}`}></div>
                  ))}
              </div>
              <div className="flex gap-3">
                  {step === 2 && <Button variant="ghost" onClick={() => setStep(1)}>Quay lại</Button>}
                  {step === 1 ? (
                      <Button onClick={parseData} disabled={!rawData.trim()} icon={ArrowRight}>Tiếp tục</Button>
                  ) : (
                      <Button 
                        onClick={handleFinish} 
                        disabled={(importMode === 'new' && !newListName) || (importMode === 'existing' && !targetListId)} 
                        icon={CheckCircle2}
                      >
                          {importMode === 'new' ? 'Tạo & Import' : 'Cập nhật danh sách'}
                      </Button>
                  )}
              </div>
          </div>
      }
    >
      {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                  <button 
                    onClick={() => setInputMethod('paste')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${inputMethod === 'paste' ? 'bg-white text-[#ca7900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <FileText className="w-4 h-4" /> Copy & Paste
                  </button>
                  <button 
                    onClick={() => setInputMethod('file')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${inputMethod === 'file' ? 'bg-white text-[#ca7900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <FileSpreadsheet className="w-4 h-4" /> Upload CSV/Excel
                  </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                      <h4 className="text-sm font-bold text-blue-800">Quy định định dạng</h4>
                      <p className="text-xs text-blue-600 leading-relaxed">
                          Dòng đầu tiên phải là tên cột (Header). Nếu thiếu cột Tên, hệ thống sẽ tự đặt tên theo Email (loại bỏ số và ký tự).
                      </p>
                  </div>
              </div>

              {inputMethod === 'paste' ? (
                  <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Dán dữ liệu vào đây</label>
                      <textarea 
                          className="w-full h-64 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-xs focus:bg-white focus:border-[#ffa900] focus:ring-4 focus:ring-orange-50/10 outline-none transition-all resize-none placeholder:text-slate-400"
                          placeholder={`Email, First Name, Last Name, Tags, Joined Date\nalice@example.com, Alice, Doe, "VIP, New", 2023-10-25\nbob@gmail.com, , Smith, Lead, 2023-11-01\n...`}
                          value={rawData}
                          onChange={(e) => setRawData(e.target.value)}
                          autoFocus
                      />
                  </div>
              ) : (
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-[32px] h-64 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-[#ffa900] transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                      <input 
                        type="file" 
                        accept=".csv,.txt" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-[#ffa900]" />
                      </div>
                      {fileName ? (
                          <div className="text-center">
                              <p className="text-sm font-black text-slate-800">{fileName}</p>
                              <p className="text-xs text-emerald-500 font-bold mt-1">Đã tải lên thành công</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setRawData(''); setFileName(''); }}
                                className="mt-4 text-[10px] font-bold text-rose-500 hover:underline"
                              >
                                  Hủy bỏ
                              </button>
                          </div>
                      ) : (
                          <div className="text-center">
                              <p className="text-sm font-black text-slate-800">Bấm để tải tệp lên</p>
                              <p className="text-xs text-slate-400 mt-1 font-medium">Hỗ trợ định dạng .CSV hoặc .TXT (UTF-8)</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      )}

      {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-emerald-600">{stats.valid}</p>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Hợp lệ (Thêm mới)</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                      <p className="text-2xl font-black text-rose-500">{stats.duplicates}</p>
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Trùng lặp (Bỏ qua)</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-2xl font-black text-slate-700">{parsedRows.length > 0 ? Object.keys(parsedRows[0]).length : 0}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số trường (Cột)</p>
                  </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[24px] p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#ffa900]" />
                      Chọn nơi lưu trữ
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setImportMode('new')}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${importMode === 'new' ? 'border-[#ffa900] bg-orange-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300'}`}
                      >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${importMode === 'new' ? 'border-[#ffa900] bg-[#ffa900] text-white' : 'border-slate-300'}`}>
                              {importMode === 'new' && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-xs font-bold text-slate-700">Tạo danh sách mới</span>
                      </div>
                      <div 
                        onClick={() => setImportMode('existing')}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${importMode === 'existing' ? 'border-[#ffa900] bg-orange-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300'}`}
                      >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${importMode === 'existing' ? 'border-[#ffa900] bg-[#ffa900] text-white' : 'border-slate-300'}`}>
                              {importMode === 'existing' && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-xs font-bold text-slate-700">Thêm vào danh sách có sẵn</span>
                      </div>
                  </div>

                  {importMode === 'new' ? (
                      <Input 
                        placeholder="VD: Khách hàng sự kiện Tech Expo..." 
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        autoFocus
                        icon={Plus}
                      />
                  ) : (
                      <Select 
                        options={existingLists.map(l => ({ value: l.id, label: `${l.name} (${l.count} subscribers)` }))}
                        value={targetListId}
                        onChange={setTargetListId}
                        placeholder="Chọn danh sách đích..."
                        icon={List}
                      />
                  )}
              </div>

              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Xem trước 3 dòng đầu</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                              <tr>
                                  {parsedRows.length > 0 && Object.keys(parsedRows[0]).map((key, i) => (
                                      <th key={i} className="px-4 py-3">{key}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                              {parsedRows.slice(0, 3).map((row, i) => (
                                  <tr key={i}>
                                      {Object.values(row).map((val: any, j) => (
                                          <td key={j} className="px-4 py-2 text-slate-700">{val}</td>
                                      ))}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </Modal>
  );
};

export default ImportSubscribersModal;
