
import React, { useState } from 'react';
import { EmailBlock, EmailBodyStyle, EmailBlockStyle } from '../../../types';
import { 
    Settings, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    Trash2, Copy, X, ChevronDown, Palette, Type, Layout, 
    Maximize, Image as ImageIcon, Link as LinkIcon, 
    ArrowUp, ArrowRight as ArrowRightIcon, ArrowDown, ArrowLeft,
    Bold, Italic, Underline, Lock, Unlock, Monitor, Smartphone,
    Box, Sliders
} from 'lucide-react';
import RichText from './RichText';

interface EmailPropertiesProps {
    blocks: EmailBlock[]; 
    selectedBlock: EmailBlock | null;
    bodyStyle: EmailBodyStyle;
    deviceMode: 'desktop' | 'mobile';
    onUpdateBlock: (id: string, data: Partial<EmailBlock>) => void;
    onUpdateBodyStyle: (style: EmailBodyStyle) => void;
    onDeleteBlock: (id: string) => void;
    onDuplicateBlock: (block: EmailBlock) => void;
    onDeselect: () => void;
}

const Accordion = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-3 px-1 hover:bg-slate-50 transition-colors rounded-lg group">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ffa900]" />}
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide group-hover:text-slate-900">{title}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pb-4 pt-1 space-y-4 px-1">{children}</div>}
        </div>
    );
};

const SpacingControl = ({ label, values, onChange }: any) => {
    const [locked, setLocked] = useState(true);
    const getVal = (v: string) => parseInt(v) || 0;
    
    const updateAll = (val: string) => {
        const px = `${val}px`;
        onChange({ top: px, bottom: px, left: px, right: px });
    };

    const updateSide = (side: string, val: string) => {
        onChange({ ...values, [side]: `${val}px` });
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                <button onClick={() => setLocked(!locked)} className={`p-1 rounded transition-colors ${locked ? 'bg-[#ffa900]/10 text-[#ffa900]' : 'text-slate-300 hover:text-slate-500'}`}>
                    {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
            </div>
            {locked ? (
                <div className="flex items-center gap-2">
                    <input type="range" min="0" max="100" value={getVal(values.top)} onChange={(e) => updateAll(e.target.value)} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ffa900]" />
                    <input type="number" value={getVal(values.top)} onChange={(e) => updateAll(e.target.value)} className="w-12 text-right text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white focus:border-[#ffa900] outline-none" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {['top', 'right', 'bottom', 'left'].map(side => (
                        <div key={side} className="relative">
                            <input 
                                type="number" 
                                value={getVal(values[side])} 
                                onChange={(e) => updateSide(side, e.target.value)}
                                className="w-full pl-7 pr-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:border-[#ffa900] outline-none"
                            />
                            <div className="absolute left-2 top-2 text-slate-300 pointer-events-none">
                                {side === 'top' && <ArrowUp className="w-3 h-3" />}
                                {side === 'right' && <ArrowRightIcon className="w-3 h-3" />}
                                {side === 'bottom' && <ArrowDown className="w-3 h-3" />}
                                {side === 'left' && <ArrowLeft className="w-3 h-3" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ColorPicker = ({ label, value, onChange }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white focus-within:border-[#ffa900] transition-colors">
            <input type="color" value={value || '#ffffff'} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" />
            <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 text-xs border-none outline-none font-mono text-slate-600 bg-transparent uppercase" placeholder="#FFFFFF" />
        </div>
    </div>
);

const Select = ({ label, value, options, onChange }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ffa900]">
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
    </div>
);

const AlignmentControl = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div className="mb-6">
        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Alignment</label>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['left', 'center', 'right', 'justify'].map(align => (
                <button key={align} onClick={() => onChange(align)} className={`flex-1 p-1.5 rounded-lg flex justify-center transition-all ${value === align ? 'bg-white text-[#ffa900] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                    {align === 'justify' && <AlignJustify className="w-4 h-4" />}
                </button>
            ))}
        </div>
    </div>
);

const EmailProperties: React.FC<EmailPropertiesProps> = ({ 
    selectedBlock, bodyStyle, deviceMode, onUpdateBlock, onUpdateBodyStyle, onDeselect, onDeleteBlock, onDuplicateBlock 
}) => {
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');

    if (!selectedBlock) {
        // Body Settings
        return (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-40">
                <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase text-slate-800 flex items-center gap-2 bg-slate-50/50">
                    <Settings className="w-4 h-4 text-[#ffa900]" /> General Settings
                </div>
                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Width</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="range" min="300" max="900" step="10"
                                value={parseInt(bodyStyle.contentWidth)} 
                                onChange={(e) => onUpdateBodyStyle({...bodyStyle, contentWidth: `${e.target.value}px`})} 
                                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ffa900]"
                            />
                            <span className="text-xs font-mono text-slate-600 w-12 text-right font-bold bg-slate-50 px-1 rounded">{bodyStyle.contentWidth}</span>
                        </div>
                    </div>
                    
                    <ColorPicker label="Page Background" value={bodyStyle.backgroundColor} onChange={(v: string) => onUpdateBodyStyle({...bodyStyle, backgroundColor: v})} />
                    <ColorPicker label="Content Background" value={bodyStyle.contentBackgroundColor} onChange={(v: string) => onUpdateBodyStyle({...bodyStyle, contentBackgroundColor: v})} />
                    
                    <Select 
                        label="Global Font Family"
                        value={bodyStyle.fontFamily}
                        onChange={(v: string) => onUpdateBodyStyle({...bodyStyle, fontFamily: v})}
                        options={[
                            { value: 'Arial, sans-serif', label: 'Arial' },
                            { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
                            { value: "'Times New Roman', serif", label: 'Times New Roman' },
                            { value: "'Courier New', monospace", label: 'Courier New' },
                            { value: "Verdana, sans-serif", label: 'Verdana' },
                            { value: "Georgia, serif", label: 'Georgia' },
                            { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
                        ]}
                    />
                </div>
            </div>
        );
    }

    const s = selectedBlock.style;
    
    // Helper to get correct style based on device mode
    const getStyle = (key: keyof EmailBlockStyle) => {
        if (deviceMode === 'mobile' && s.mobile && s.mobile[key as keyof typeof s.mobile] !== undefined) {
            return s.mobile[key as keyof typeof s.mobile];
        }
        return s[key];
    };

    const updateStyle = (updates: Partial<EmailBlockStyle>) => {
        if (deviceMode === 'mobile') {
            onUpdateBlock(selectedBlock.id, { style: { ...s, mobile: { ...s.mobile, ...updates } } });
        } else {
            onUpdateBlock(selectedBlock.id, { style: { ...s, ...updates } });
        }
    };

    // Helper for input binding
    const bindInput = (key: keyof EmailBlockStyle, isPixel = false) => ({
        value: isPixel ? parseInt((getStyle(key) as string) || '0') : getStyle(key),
        onChange: (e: any) => updateStyle({ [key]: isPixel ? `${e.target.value}px` : e.target.value })
    });

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-40 animate-in slide-in-from-right-4 duration-300">
            {/* Header Actions */}
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                        {selectedBlock.type}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onDuplicateBlock(selectedBlock)} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-slate-400 transition-all" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDeleteBlock(selectedBlock.id)} className="p-1.5 hover:bg-white hover:text-rose-600 rounded-md text-slate-400 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button onClick={onDeselect} className="p-1.5 hover:bg-white hover:text-slate-800 rounded-md text-slate-400" title="Close"><X className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 m-3 bg-slate-100 rounded-xl">
                <button onClick={() => setActiveTab('content')} className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${activeTab === 'content' ? 'bg-white text-[#ffa900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Content</button>
                <button onClick={() => setActiveTab('style')} className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${activeTab === 'style' ? 'bg-white text-[#ffa900] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Style</button>
            </div>

            {/* Mobile Mode Warning */}
            {deviceMode === 'mobile' && activeTab === 'style' && (
                <div className="mx-4 mb-4 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[9px] font-bold text-blue-700 uppercase">Editing Mobile Styles</span>
                </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    {/* Text Specific */}
                    {selectedBlock.type === 'text' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editor</label>
                            <RichText value={selectedBlock.content} onChange={(v) => onUpdateBlock(selectedBlock.id, { content: v })} className="min-h-[200px] bg-white border-slate-200 focus:border-[#ffa900]" />
                        </div>
                    )}

                    {/* Button Specific */}
                    {selectedBlock.type === 'button' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Button Text</label>
                                <input type="text" value={selectedBlock.content} onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ffa900]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input type="text" value={selectedBlock.url || ''} onChange={(e) => onUpdateBlock(selectedBlock.id, { url: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#ffa900]" placeholder="https://" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Image Specific */}
                    {selectedBlock.type === 'image' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image Source (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input type="text" value={selectedBlock.content} onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#ffa900]" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alt Text</label>
                                <input type="text" value={selectedBlock.altText || ''} onChange={(e) => onUpdateBlock(selectedBlock.id, { altText: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#ffa900]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link (Optional)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input type="text" value={selectedBlock.url || ''} onChange={(e) => onUpdateBlock(selectedBlock.id, { url: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#ffa900]" placeholder="https://" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* STYLE TAB */}
            {activeTab === 'style' && (
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    
                    {/* Common: Alignment */}
                    <AlignmentControl value={getStyle('textAlign') as string} onChange={(v) => updateStyle({ textAlign: v as any })} />

                    {/* Image Controls */}
                    {selectedBlock.type === 'image' && (
                        <div className="mb-6 space-y-3 pb-6 border-b border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image Width</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" min="10" max="100" 
                                    value={parseInt(getStyle('width')?.replace('%', '') || '100')} 
                                    onChange={(e) => updateStyle({ width: `${e.target.value}%` })} 
                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ffa900]" 
                                />
                                <span className="text-xs font-bold w-10 text-right">{getStyle('width') || '100%'}</span>
                            </div>
                        </div>
                    )}

                    {/* Button Controls */}
                    {selectedBlock.type === 'button' && (
                        <div className="mb-6 space-y-3 pb-6 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Button Width</label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button onClick={() => updateStyle({ width: 'auto' })} className={`px-2 py-1 text-[9px] font-bold rounded ${getStyle('width') !== '100%' ? 'bg-white shadow text-[#ffa900]' : 'text-slate-400'}`}>Auto</button>
                                    <button onClick={() => updateStyle({ width: '100%' })} className={`px-2 py-1 text-[9px] font-bold rounded ${getStyle('width') === '100%' ? 'bg-white shadow text-[#ffa900]' : 'text-slate-400'}`}>Full</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Divider Controls */}
                    {selectedBlock.type === 'divider' && (
                        <Accordion title="Divider Style" icon={Sliders} defaultOpen>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Thickness</label>
                                    <input type="number" {...bindInput('borderTopWidth', true)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Style</label>
                                    <select value={getStyle('borderStyle') || 'solid'} onChange={(e) => updateStyle({ borderStyle: e.target.value as any })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]">
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                </div>
                                <ColorPicker label="Color" value={getStyle('borderColor')} onChange={(v: string) => updateStyle({ borderColor: v })} />
                            </div>
                        </Accordion>
                    )}

                    <Accordion title="Spacing & Layout" icon={Maximize} defaultOpen>
                        <SpacingControl 
                            label="Padding (Inner)" 
                            values={{ top: getStyle('paddingTop'), bottom: getStyle('paddingBottom'), left: getStyle('paddingLeft'), right: getStyle('paddingRight') }} 
                            onChange={(v: any) => updateStyle({ paddingTop: v.top, paddingBottom: v.bottom, paddingLeft: v.left, paddingRight: v.right })} 
                        />
                        <div className="h-2"></div>
                        <SpacingControl 
                            label="Margin (Outer)" 
                            values={{ top: getStyle('marginTop'), bottom: getStyle('marginBottom'), left: getStyle('marginLeft'), right: getStyle('marginRight') }} 
                            onChange={(v: any) => updateStyle({ marginTop: v.top, marginBottom: v.bottom, marginLeft: v.left, marginRight: v.right })} 
                        />
                    </Accordion>

                    <Accordion title="Colors" icon={Palette}>
                        <ColorPicker label="Text Color" value={getStyle('color')} onChange={(v: string) => updateStyle({ color: v })} />
                        <ColorPicker label="Background Color" value={getStyle('backgroundColor')} onChange={(v: string) => updateStyle({ backgroundColor: v })} />
                        {selectedBlock.type === 'button' && (
                            <ColorPicker label="Button Background" value={getStyle('contentBackgroundColor')} onChange={(v: string) => updateStyle({ contentBackgroundColor: v })} />
                        )}
                    </Accordion>

                    {(selectedBlock.type === 'text' || selectedBlock.type === 'button') && (
                        <Accordion title="Typography" icon={Type}>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Font Size (px)</label>
                                    <input type="number" {...bindInput('fontSize', true)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Line Height</label>
                                    <input type="number" step="0.1" value={getStyle('lineHeight')} onChange={(e) => updateStyle({ lineHeight: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]" />
                                </div>
                            </div>
                            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button onClick={() => updateStyle({ fontWeight: getStyle('fontWeight') === 'bold' ? 'normal' : 'bold' })} className={`flex-1 p-1.5 rounded flex justify-center ${getStyle('fontWeight') === 'bold' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Bold className="w-4 h-4" /></button>
                                <button onClick={() => updateStyle({ fontStyle: getStyle('fontStyle') === 'italic' ? 'normal' : 'italic' })} className={`flex-1 p-1.5 rounded flex justify-center ${getStyle('fontStyle') === 'italic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Italic className="w-4 h-4" /></button>
                                <button onClick={() => updateStyle({ textDecoration: getStyle('textDecoration') === 'underline' ? 'none' : 'underline' })} className={`flex-1 p-1.5 rounded flex justify-center ${getStyle('textDecoration') === 'underline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Underline className="w-4 h-4" /></button>
                            </div>
                        </Accordion>
                    )}

                    {selectedBlock.type !== 'divider' && (
                        <Accordion title="Border & Radius" icon={Layout}>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Radius (Rounded Corners)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="range" min="0" max="50" {...bindInput('borderRadius', true)} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ffa900]" />
                                        <span className="text-xs font-mono font-bold w-8 text-right">{parseInt(getStyle('borderRadius') || '0')}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Width</label>
                                        <input type="number" {...bindInput('borderTopWidth', true)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Style</label>
                                        <select value={getStyle('borderStyle') || 'solid'} onChange={(e) => updateStyle({ borderStyle: e.target.value as any })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-[#ffa900]">
                                            <option value="solid">Solid</option>
                                            <option value="dashed">Dashed</option>
                                            <option value="dotted">Dotted</option>
                                            <option value="none">None</option>
                                        </select>
                                    </div>
                                </div>
                                <ColorPicker label="Border Color" value={getStyle('borderColor')} onChange={(v: string) => updateStyle({ borderColor: v })} />
                            </div>
                        </Accordion>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmailProperties;
