
import React, { useState } from 'react';
import { 
    Type, Image, Square, Minus, Layout, Share2, Columns, Code, Grid, 
    MousePointer2, Layers, Box, Video, Clock, Quote, Star, List, ShoppingBag, Search, LayoutTemplate
} from 'lucide-react';
import { EmailBlock } from '../../../types';

interface EmailToolboxProps {
    blocks: EmailBlock[];
    onDragStart: (e: React.DragEvent, type: string, layout?: string) => void;
    onSelectBlock: (id: string) => void;
    selectedBlockId: string | null;
    savedSections?: { id: string, name: string, data: EmailBlock }[];
}

const EmailToolbox: React.FC<EmailToolboxProps> = ({ onDragStart }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const layoutTools = [
        { id: '1', type: 'section', label: '1 Column', icon: Square, desc: 'Full width section' },
        { id: '2', type: 'row', layout: '2', label: '2 Columns', icon: Columns, desc: '50% - 50%' },
        { id: '3', type: 'row', layout: '3', label: '3 Columns', icon: Grid, desc: '33% - 33% - 33%' },
    ];

    const contentTools = [
        { id: 'text', label: 'Text', icon: Type },
        { id: 'image', label: 'Image', icon: Image },
        { id: 'button', label: 'Button', icon: MousePointer2 },
        { id: 'spacer', label: 'Spacer', icon: Layers },
        { id: 'divider', label: 'Divider', icon: Minus },
        { id: 'html', label: 'HTML', icon: Code },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-40">
            <div className="p-4 border-b border-slate-100">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ffa900] transition-all"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
                {/* Layouts */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Layouts</p>
                    <div className="space-y-2">
                        {layoutTools.map(t => (
                            <div 
                                key={t.id}
                                draggable 
                                onDragStart={(e) => onDragStart(e, t.type, t.layout)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#ffa900] hover:shadow-md cursor-grab transition-all group"
                            >
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-orange-50 group-hover:text-[#ca7900] transition-colors">
                                    <t.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">{t.label}</p>
                                    <p className="text-[10px] text-slate-400">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Elements</p>
                    <div className="grid grid-cols-2 gap-3">
                        {contentTools.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                            <div 
                                key={t.id}
                                draggable 
                                onDragStart={(e) => onDragStart(e, t.id)}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#ffa900] hover:shadow-md cursor-grab transition-all group h-24"
                            >
                                <div className="p-2 bg-slate-50 rounded-full text-slate-500 group-hover:bg-orange-50 group-hover:text-[#ca7900] transition-colors">
                                    <t.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailToolbox;
