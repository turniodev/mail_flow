
import React, { useState } from 'react';
import { ChevronLeft, Undo2, Redo2, Layout, Code, Monitor, Smartphone, Eye, Save, Loader2 } from 'lucide-react';
import Button from '../../common/Button';

interface EmailTopBarProps {
    name: string;
    setName: (name: string) => void;
    editorMode: 'visual' | 'code';
    setEditorMode: (mode: 'visual' | 'code') => void;
    viewMode: 'desktop' | 'mobile';
    setViewMode: (mode: 'desktop' | 'mobile') => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onCancel: () => void;
    onPreview: () => void;
}

const EmailTopBar: React.FC<EmailTopBarProps> = ({ 
    name, setName, editorMode, setEditorMode, viewMode, setViewMode, 
    canUndo, canRedo, onUndo, onRedo, onSave, onCancel, onPreview 
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-50 relative">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="text-base font-bold text-slate-800 outline-none bg-transparent hover:bg-slate-50 px-2 rounded transition-all border border-transparent hover:border-slate-200 focus:border-blue-500"
              />
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('desktop')} className={`p-2 rounded transition-all ${viewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Monitor className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('mobile')} className={`p-2 rounded transition-all ${viewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Smartphone className="w-4 h-4" /></button>
            </div>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <button onClick={onUndo} disabled={!canUndo} className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
            <button onClick={onRedo} disabled={!canRedo} className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <button onClick={onPreview} className="p-2 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-2 text-xs font-bold uppercase"><Eye className="w-4 h-4" /> Preview</button>
            <Button icon={isSaving ? Loader2 : Save} onClick={handleSave} isLoading={isSaving} className="h-9 px-6 text-xs">Save Template</Button>
        </div>
    </div>
  );
};

export default EmailTopBar;
