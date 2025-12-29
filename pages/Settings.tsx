

import React, { useState, useEffect } from 'react';
import { 
    Save, Database, Mail, ShieldCheck, Globe, 
    Loader2, Play, FileText, CheckCircle2, AlertTriangle, 
    Server, Lock, Key, KeyRound, Zap, Cake, History, Inbox, Hash,
    FlaskConical, ArrowRight, UserPlus, Info, ShoppingCart, RefreshCcw, Terminal
} from 'lucide-react';
import { api } from '../services/storageAdapter';
import { FormDefinition, PurchaseEvent, CustomEvent } from '../types';
import Toast, { ToastType } from '../components/common/Toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Tabs from '../components/common/Tabs';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('mailflow_api_url') || 'https://ka-en.com.vn/mail_api');
  const [smtp, setSmtp] = useState({
      smtp_enabled: '0',
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_pass: '',
      smtp_encryption: 'tls',
      imap_enabled: '0',
      imap_host: 'imap.gmail.com',
      imap_port: '993',
      imap_user: '',
      imap_pass: ''
  });
  
  // Data for Selects
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [purchaseEvents, setPurchaseEvents] = useState<PurchaseEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);

  // Sandbox State
  const [sandboxTab, setSandboxTab] = useState<'form' | 'purchase' | 'custom'>('form');
  
  // Form Test State
  const [selectedFormId, setSelectedFormId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  
  // Purchase Test State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [testPurchaseEmail, setTestPurchaseEmail] = useState('');
  const [testPurchaseAmount, setTestPurchaseAmount] = useState('500000');

  // Custom Event Test State
  const [selectedCustomEventId, setSelectedCustomEventId] = useState('');
  const [testCustomEmail, setTestCustomEmail] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningEnrollment, setIsRunningEnrollment] = useState(false);
  const [engineResult, setEngineResult] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', type: 'info' as ToastType, isVisible: false });
  const [selectedWorkerLogType, setSelectedWorkerLogType] = useState('worker_enroll'); // New state for log type

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const res = await api.get<any>('settings');
    if (res.success) setSmtp(prev => ({ ...prev, ...res.data }));

    const formsRes = await api.get<FormDefinition[]>('forms');
    if (formsRes.success) setForms(formsRes.data);

    const purchRes = await api.get<PurchaseEvent[]>('purchase_events');
    if (purchRes.success) setPurchaseEvents(purchRes.data);

    const customRes = await api.get<CustomEvent[]>('custom_events');
    if (customRes.success) setCustomEvents(customRes.data);
  };

  const handleSave = async () => {
      setIsSaving(true);
      localStorage.setItem('mailflow_api_url', apiUrl);
      const res = await api.post('settings', smtp);
      if (res.success) {
          setToast({ message: 'Đã lưu cấu hình hệ thống!', type: 'success', isVisible: true });
      } else {
          setToast({ message: 'Lỗi khi lưu cấu hình server.', type: 'error', isVisible: true });
      }
      setIsSaving(false);
  };

  const handleTestForm = async () => {
    if (!selectedFormId) {
        setToast({ message: 'Vui lòng chọn một Form để test', type: 'error', isVisible: true });
        return;
    }
    setIsTesting(true);
    try {
        const endpoint = `${apiUrl.replace(/\/$/, '')}/forms.php?route=submit`;
        const emailToSubmit = testEmail.trim() || `test_${Math.floor(Math.random() * 1000)}@ka-en.com.vn`;
        
        const testData = {
            form_id: selectedFormId,
            email: emailToSubmit,
            firstName: 'Test User',
            lastName: 'Form Lead',
            source: 'Settings Sandbox'
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        const result = await response.json();

        if (result.success) {
            setToast({ message: `Gửi Form thành công cho ${emailToSubmit}!`, type: 'success', isVisible: true });
            // Since forms.php now directly calls worker_priority.php, no need to manually run engine here.
            // We can optionally refresh logs after a short delay to see the worker output.
            setTimeout(() => refreshWorkerLog('worker_priority'), 1000); 
        } else {
            setToast({ message: result.message || 'Lỗi khi gửi data test', type: 'error', isVisible: true });
        }
    } catch (e) {
        setToast({ message: 'Lỗi kết nối API.', type: 'error', isVisible: true });
    } finally {
        setIsTesting(false);
    }
  };

  const handleTestPurchase = async () => {
    if (!selectedEventId) {
        setToast({ message: 'Vui lòng chọn sự kiện mua hàng', type: 'error', isVisible: true });
        return;
    }
    setIsTesting(true);
    try {
        const endpoint = `${apiUrl.replace(/\/$/, '')}/purchase_events.php?route=track`;
        const emailToSubmit = testPurchaseEmail.trim() || `buyer_${Math.floor(Math.random() * 1000)}@ka-en.com.vn`;
        
        const payload = {
            event_id: selectedEventId,
            email: emailToSubmit,
            firstName: "Test Buyer",
            lastName: "VIP",
            total_value: parseFloat(testPurchaseAmount) || 0,
            currency: "VND",
            items: [
                { name: "Sản phẩm Test A", price: parseFloat(testPurchaseAmount) }
            ]
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            setToast({ message: `Ghi nhận đơn hàng thành công cho ${emailToSubmit}!`, type: 'success', isVisible: true });
            // purchase_events.php now directly calls worker_priority.php
            setTimeout(() => refreshWorkerLog('worker_priority'), 1000); 
        } else {
            setToast({ message: result.message || 'Lỗi API mua hàng', type: 'error', isVisible: true });
        }
    } catch (e) {
        setToast({ message: 'Lỗi kết nối API.', type: 'error', isVisible: true });
    } finally {
        setIsTesting(false);
    }
  };

  const handleTestCustomEvent = async () => {
    if (!selectedCustomEventId) {
        setToast({ message: 'Vui lòng chọn sự kiện tùy chỉnh', type: 'error', isVisible: true });
        return;
    }
    setIsTesting(true);
    try {
        const endpoint = `${apiUrl.replace(/\/$/, '')}/custom_events.php?route=track`;
        const emailToSubmit = testCustomEmail.trim() || `user_${Math.floor(Math.random() * 1000)}@ka-en.com.vn`;
        
        const payload = {
            event_id: selectedCustomEventId,
            email: emailToSubmit,
            firstName: "Custom",
            lastName: "User",
            properties: {
                test: true,
                source: "sandbox"
            }
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            setToast({ message: `Trigger sự kiện thành công cho ${emailToSubmit}!`, type: 'success', isVisible: true });
            // custom_events.php now directly calls worker_priority.php
            setTimeout(() => refreshWorkerLog('worker_priority'), 1000);
        } else {
            setToast({ message: result.message || 'Lỗi API Custom Event', type: 'error', isVisible: true });
        }
    } catch (e) {
        setToast({ message: 'Lỗi kết nối API.', type: 'error', isVisible: true });
    } finally {
        setIsTesting(false);
    }
  };

  const handleRunEnrollmentWorker = async () => {
      setIsRunningEnrollment(true);
      setEngineResult(null);
      try {
          const url = apiUrl.replace(/\/$/, '') + '/worker_enroll.php'; // Call the enrollment worker
          const response = await fetch(url);
          const text = await response.text();
          setEngineResult(text);
          setToast({ message: 'Đã thực thi bộ máy đăng ký Flow!', type: 'success', isVisible: true });
      } catch (e) {
          setEngineResult('Lỗi kết nối đến worker_enroll.php');
          setToast({ message: 'Lỗi thực thi bộ máy.', type: 'error', isVisible: true });
      } finally {
          setIsRunningEnrollment(false);
      }
  };

  const refreshLogs = async () => {
      const res = await api.get<any[]>('logs?type=delivery');
      if (res.success) setDeliveryLogs(res.data);
  };
  
  const refreshWorkerLog = async (workerType: string) => {
      setSelectedWorkerLogType(workerType); // Update selected log type state
      setEngineResult('Đang tải log...');
      try {
          const res = await api.get<any>(`logs?type=${workerType}`);
          if (res.success && res.data) {
              setEngineResult(res.data.content);
          } else {
              setEngineResult(`Không thể tải log cho ${workerType}.`);
          }
      } catch (e) {
          setEngineResult(`Lỗi kết nối khi tải log cho ${workerType}.`);
      }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-24">
      <div className="mb-12 flex justify-between items-end">
          <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Cài đặt hệ thống</h2>
              <p className="text-slate-500 mt-2 font-medium">Cấu hình kết nối máy chủ gửi & nhận Email.</p>
          </div>
          <Button icon={Save} isLoading={isSaving} onClick={handleSave} size="lg" className="shadow-orange-500/20">Lưu toàn bộ cấu hình</Button>
      </div>

      <div className="mb-8">
          <Tabs 
            activeId={activeTab} 
            onChange={setActiveTab}
            variant="pill"
            items={[
                { id: 'system', label: 'Máy chủ & Mail', icon: Server },
                { id: 'logs', label: 'Nhật ký gửi', icon: History },
            ]}
          />
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-8">
                
                {/* AUTOMATION TEST SANDBOX */}
                <div className="bg-white rounded-[40px] p-8 border-2 border-[#ffa900]/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffa900] opacity-10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="p-3 bg-orange-50 rounded-2xl text-[#ca7900] shadow-sm"><FlaskConical className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Automation Sandbox</h3>
                            <p className="text-xs text-slate-500">Giả lập hành động khách hàng để kiểm tra Flow.</p>
                        </div>
                    </div>

                    {/* Sub-tabs inside Sandbox */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative z-10 w-fit overflow-x-auto max-w-full no-scrollbar">
                        <button 
                            onClick={() => setSandboxTab('form')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${sandboxTab === 'form' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText className="w-3.5 h-3.5" /> Test Form
                        </button>
                        <button 
                            onClick={() => setSandboxTab('purchase')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${sandboxTab === 'purchase' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" /> Test Mua hàng
                        </button>
                        <button 
                            onClick={() => setSandboxTab('custom')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${sandboxTab === 'custom' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Zap className="w-3.5 h-3.5" /> Custom Event
                        </button>
                    </div>

                    {sandboxTab === 'form' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 items-end animate-in fade-in slide-in-from-left-2">
                            <Select 
                                label="1. Chọn Form liên kết"
                                options={forms.map(f => ({ value: f.id, label: f.name }))}
                                value={selectedFormId}
                                onChange={setSelectedFormId}
                                placeholder="Chọn biểu mẫu..."
                                variant="outline"
                                icon={FileText}
                            />
                            <Input 
                                label="2. Email nhận test"
                                placeholder="test@ka-en.com.vn"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                icon={Mail}
                            />
                            <div className="md:col-span-2 pt-2">
                                <Button 
                                    onClick={handleTestForm} 
                                    isLoading={isTesting} 
                                    disabled={!selectedFormId}
                                    fullWidth
                                    className="h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs tracking-widest"
                                    icon={ArrowRight}
                                >
                                    GIẢ LẬP ĐIỀN FORM
                                </Button>
                            </div>
                        </div>
                    )}

                    {sandboxTab === 'purchase' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 items-end animate-in fade-in slide-in-from-right-2">
                            <div className="md:col-span-2">
                                <Select 
                                    label="1. Chọn Sự kiện mua hàng"
                                    options={purchaseEvents.map(e => ({ value: e.id, label: e.name }))}
                                    value={selectedEventId}
                                    onChange={setSelectedEventId}
                                    placeholder="Chọn sự kiện..."
                                    variant="outline"
                                    icon={ShoppingCart}
                                />
                            </div>
                            <Input 
                                label="2. Email mua hàng"
                                placeholder="buyer@ka-en.com.vn"
                                value={testPurchaseEmail}
                                onChange={e => setTestPurchaseEmail(e.target.value)}
                                icon={Mail}
                            />
                            <Input 
                                label="3. Giá trị đơn (VNĐ)"
                                type="number"
                                value={testPurchaseAmount}
                                onChange={e => setTestPurchaseAmount(e.target.value)}
                                icon={Zap}
                            />
                            <div className="md:col-span-2 pt-2">
                                <Button 
                                    onClick={handleTestPurchase} 
                                    isLoading={isTesting} 
                                    disabled={!selectedEventId}
                                    fullWidth
                                    className="h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-xs tracking-widest shadow-lg shadow-pink-200"
                                    icon={ArrowRight}
                                >
                                    GIẢ LẬP MUA HÀNG THÀNH CÔNG
                                </Button>
                            </div>
                        </div>
                    )}

                    {sandboxTab === 'custom' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 items-end animate-in fade-in slide-in-from-right-2">
                            <div className="md:col-span-2">
                                <Select 
                                    label="1. Chọn Sự kiện tùy chỉnh"
                                    options={customEvents.map(e => ({ value: e.id, label: e.name }))}
                                    value={selectedCustomEventId}
                                    onChange={setSelectedCustomEventId}
                                    placeholder="Chọn sự kiện..."
                                    variant="outline"
                                    icon={Zap}
                                />
                            </div>
                            <Input 
                                label="2. Email user"
                                placeholder="user@ka-en.com.vn"
                                value={testCustomEmail}
                                onChange={e => setTestCustomEmail(e.target.value)}
                                icon={Mail}
                            />
                            <div className="md:col-span-2 pt-2">
                                <Button 
                                    onClick={handleTestCustomEvent} 
                                    isLoading={isTesting} 
                                    disabled={!selectedCustomEventId}
                                    fullWidth
                                    className="h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-xs tracking-widest shadow-lg shadow-violet-200"
                                    icon={ArrowRight}
                                >
                                    GIẢ LẬP SỰ KIỆN TÙY CHỈNH
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-3 relative z-10">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">
                            <b>Cơ chế:</b> Hệ thống sẽ gửi request API giả lập tới Backend -> Backend ghi nhận Subscriber mới -> Tự động kích hoạt các Flow đang "Active" có trigger tương ứng.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 border-2 border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Server className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Cấu hình Gửi (SMTP)</h3>
                                <p className="text-xs text-slate-500">Kết nối máy chủ để thực hiện gửi email.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={() => setSmtp({...smtp, smtp_enabled: smtp.smtp_enabled === '1' ? '0' : '1'})}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md ${smtp.smtp_enabled === '1' ? 'bg-[#ffa900] text-white ring-4 ring-orange-100' : 'bg-slate-200 text-slate-500'}`}
                            >
                                {smtp.smtp_enabled === '1' ? <><CheckCircle2 className="w-4 h-4" /> ĐANG BẬT</> : <><AlertTriangle className="w-4 h-4" /> ĐANG TẮT</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Máy chủ (Host)" placeholder="smtp-relay.brevo.com" value={smtp.smtp_host} onChange={e => setSmtp({...smtp, smtp_host: e.target.value})} icon={Globe} />
                        <Input label="Cổng (Port)" placeholder="587" value={smtp.smtp_port} onChange={e => setSmtp({...smtp, smtp_port: e.target.value})} icon={Hash} />
                        <Input label="Email gửi (Username)" placeholder="marketing@domain.com" value={smtp.smtp_user} onChange={e => setSmtp({...smtp, smtp_user: e.target.value})} icon={ShieldCheck} />
                        <Input label="Mật khẩu / API Key" type="password" placeholder="Mật khẩu ứng dụng..." value={smtp.smtp_pass} onChange={e => setSmtp({...smtp, smtp_pass: e.target.value})} icon={KeyRound} />
                    </div>
                </div>

                <div className="bg-[#0f172a] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500"><Zap className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-lg font-black">Automation Engine (Worker)</h3>
                            <p className="text-xs text-slate-400">Trình điều khiển bộ máy gửi mail, quét sinh nhật và xử lý kịch bản.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 items-center relative z-10">
                        <Button 
                            variant="primary" 
                            icon={Play} 
                            isLoading={isRunningEnrollment} 
                            onClick={handleRunEnrollmentWorker} // Calls the enrollment worker
                            className="px-8 py-4 rounded-2xl bg-[#ffa900] hover:bg-[#ca7900] text-white font-black"
                        >
                            CHẠY ENROLLMENT
                        </Button>
                        {/* Removed the "QUÉT SINH NHẬT" button */}
                    </div>

                    {engineResult && (
                        <div className="mt-6 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre animate-in zoom-in-95 max-h-64 custom-scrollbar">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                <History className="w-3 h-3" /> 
                                <span className="uppercase font-black text-slate-500">Output Log</span>
                                {/* New: Dropdown to select log file type */}
                                <Select 
                                    options={[
                                        {value: 'worker_enroll', label: 'Enrollment Worker'},
                                        {value: 'worker_flow', label: 'Flow Execution Worker'},
                                        {value: 'worker_priority', label: 'Priority Worker'},
                                        {value: 'webhook_debug', label: 'Webhook Debug'} // Added for webhook debug log
                                    ]}
                                    value={selectedWorkerLogType}
                                    onChange={(val) => refreshWorkerLog(val)}
                                    variant="ghost"
                                    className="ml-auto w-40 text-white/70"
                                    icon={Terminal}
                                />
                                <Button size="sm" icon={RefreshCcw} onClick={() => refreshWorkerLog(selectedWorkerLogType)} className="ml-2 bg-white/10 text-white hover:bg-white/20" />
                            </div>
                            {engineResult}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <Globe className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-45 transition-transform duration-1000" />
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-[#ffa900]" /> API Base URL</h3>
                    <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:border-[#ffa900] transition-all" />
                    <p className="text-[10px] text-slate-400 mt-3 font-medium leading-relaxed italic">*Đường dẫn máy chủ chứa các file .php xử lý dữ liệu.</p>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'logs' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                  <h3 className="text-lg font-bold text-slate-800">Nhật ký thực thi gần nhất</h3>
                  <Button variant="secondary" icon={RefreshCcw} onClick={refreshLogs}>Làm mới log</Button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Người nhận</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4">Chi tiết lỗi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {deliveryLogs.map((l, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold">{l.recipient}</td>
                                <td className="px-6 py-4">
                                    {l.status === 'success' ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> OK</span> : <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Failed</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-400">{l.sent_at}</td>
                                <td className="px-6 py-4 text-[10px] text-rose-500 font-black">{l.error_message || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({...toast, isVisible: false})} />
    </div>
  );
};

export default Settings;