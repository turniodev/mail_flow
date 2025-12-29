
import React, { useState } from 'react';
import { EmailBlock, EmailBodyStyle, EmailBlockStyle } from '../../../types';
import { Trash2, Copy, Plus, Layout } from 'lucide-react';

interface EmailCanvasProps {
    mode: 'visual' | 'code';
    blocks: EmailBlock[];
    bodyStyle: EmailBodyStyle;
    viewMode: 'desktop' | 'mobile';
    customHtml: string;
    selectedBlockId: string | null;
    onSelectBlock: (id: string | null) => void;
    onUpdateBlocks: (blocks: EmailBlock[]) => void;
    setCustomHtml: (html: string) => void;
    onSaveSection?: (block: EmailBlock) => void;
}

const EmailCanvas: React.FC<EmailCanvasProps> = ({ 
    mode, blocks, bodyStyle, viewMode, customHtml, selectedBlockId, 
    onSelectBlock, onUpdateBlocks, setCustomHtml
}) => {
    const [dragTarget, setDragTarget] = useState<{ parentId: string, index: number } | null>(null);

    // --- HELPERS ---
    const updateBlockDeep = (currentBlocks: EmailBlock[], id: string, updater: (b: EmailBlock) => EmailBlock): EmailBlock[] => {
        return currentBlocks.map(b => {
            if (b.id === id) return updater(b);
            if (b.children) return { ...b, children: updateBlockDeep(b.children, id, updater) };
            return b;
        });
    };

    const deleteBlockDeep = (currentBlocks: EmailBlock[], id: string): EmailBlock[] => {
        return currentBlocks.filter(b => b.id !== id).map(b => ({
            ...b,
            children: b.children ? deleteBlockDeep(b.children, id) : undefined
        }));
    };

    const duplicateBlockDeep = (currentBlocks: EmailBlock[], id: string): EmailBlock[] => {
        const result: EmailBlock[] = [];
        for (const b of currentBlocks) {
            result.push(b);
            if (b.id === id) {
                const clone = JSON.parse(JSON.stringify(b));
                clone.id = crypto.randomUUID();
                result.push(clone);
            }
            if (b.children) {
                b.children = duplicateBlockDeep(b.children, id);
            }
        }
        return result;
    };

    const insertBlockDeep = (currentBlocks: EmailBlock[], parentId: string, index: number, newBlock: EmailBlock): EmailBlock[] => {
        if (parentId === 'root') {
            const newArr = [...currentBlocks];
            newArr.splice(index, 0, newBlock);
            return newArr;
        }
        return currentBlocks.map(b => {
            if (b.id === parentId) {
                const newChildren = [...(b.children || [])];
                newChildren.splice(index, 0, newBlock);
                return { ...b, children: newChildren };
            }
            if (b.children) return { ...b, children: insertBlockDeep(b.children, parentId, index, newBlock) };
            return b;
        });
    };

    // --- ACTIONS ---
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onUpdateBlocks(deleteBlockDeep(blocks, id));
        onSelectBlock(null);
    };

    const handleDuplicate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onUpdateBlocks(duplicateBlockDeep(blocks, id));
    };

    // --- DRAG & DROP ---
    const handleDragOver = (e: React.DragEvent, parentId: string, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        // Only update state if it changes to prevent flicker
        if (dragTarget?.parentId !== parentId || dragTarget?.index !== index) {
            setDragTarget({ parentId, index });
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Delay clearing to allow moving between close zones
        // setDragTarget(null); 
    };

    const handleDrop = (e: React.DragEvent, parentId: string, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragTarget(null);

        const type = e.dataTransfer.getData('type');
        const layout = e.dataTransfer.getData('layout');
        
        if (!type) return;

        let newBlock: EmailBlock = {
            id: crypto.randomUUID(),
            type: type as any,
            content: '',
            style: { paddingTop: '10px', paddingBottom: '10px', paddingLeft: '10px', paddingRight: '10px' },
            children: []
        };

        if (type === 'section') {
            newBlock.style = { ...newBlock.style, paddingTop: '20px', paddingBottom: '20px', paddingLeft: '0px', paddingRight: '0px', backgroundColor: 'transparent' };
            const col: EmailBlock = { id: crypto.randomUUID(), type: 'column', content: '', style: { width: '100%', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '10px', paddingRight: '10px' }, children: [] };
            const row: EmailBlock = { id: crypto.randomUUID(), type: 'row', content: '', style: { paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }, children: [col] };
            newBlock.children = [row];
        } else if (type === 'row') {
            const colCount = parseInt(layout || '1');
            const cols: EmailBlock[] = [];
            for(let i=0; i<colCount; i++) {
                cols.push({ id: crypto.randomUUID(), type: 'column', content: '', style: { width: `${100/colCount}%`, paddingTop: '5px', paddingBottom: '5px', paddingLeft: '5px', paddingRight: '5px' }, children: [] } as EmailBlock);
            }
            newBlock.children = cols;
        } else if (type === 'text') {
            newBlock.content = '<p style="margin:0; font-size: 16px; color: #333;">This is a new text block. Click to edit.</p>';
            newBlock.style = { ...newBlock.style, fontSize: '16px', color: '#333333', lineHeight: '1.5', paddingBottom: '10px' };
        } else if (type === 'button') {
            newBlock.content = 'Click Me';
            newBlock.style = { ...newBlock.style, backgroundColor: '#ffa900', color: '#ffffff', borderRadius: '4px', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px', display: 'inline-block', textAlign: 'center', width: 'auto' };
        } else if (type === 'image') {
            newBlock.content = 'https://placehold.co/600x300/e2e8f0/94a3b8?text=Image';
            newBlock.style = { ...newBlock.style, width: '100%', height: 'auto' };
        } else if (type === 'spacer') {
            newBlock.style = { ...newBlock.style, height: '20px' };
        } else if (type === 'divider') {
            newBlock.style = { ...newBlock.style, borderTopWidth: '1px', borderStyle: 'solid', borderColor: '#e2e8f0', width: '100%', marginTop: '10px', marginBottom: '10px', paddingTop: '10px', paddingBottom: '10px' };
        }

        onUpdateBlocks(insertBlockDeep(blocks, parentId, index, newBlock));
        onSelectBlock(newBlock.id);
    };

    // --- DROP ZONE COMPONENT ---
    const DropZone = ({ parentId, index }: { parentId: string, index: number }) => {
        const isActive = dragTarget?.parentId === parentId && dragTarget?.index === index;
        return (
            <div 
                className={`
                    relative w-full flex items-center justify-center transition-all duration-200 z-50
                    ${isActive ? 'h-10 my-2 opacity-100' : 'h-3 hover:h-8 my-0 opacity-0 hover:opacity-100'}
                `}
                onDragOver={(e) => handleDragOver(e, parentId, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, parentId, index)}
            >
                {/* Visual Line */}
                <div className={`
                    w-full h-1 rounded-full transition-all duration-300
                    ${isActive ? 'bg-[#ffa900] shadow-[0_0_15px_rgba(255,169,0,0.6)] scale-x-100' : 'bg-[#ffa900]/50 scale-x-95'}
                `}></div>
                
                {/* Badge */}
                {isActive && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#ffa900] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-in zoom-in duration-200">
                        Drop Here
                    </div>
                )}
            </div>
        );
    };

    const renderRecursive = (block: EmailBlock) => {
        const isSelected = selectedBlockId === block.id;
        
        const style: React.CSSProperties = {
            ...block.style,
            padding: `${block.style.paddingTop || 0} ${block.style.paddingRight || 0} ${block.style.paddingBottom || 0} ${block.style.paddingLeft || 0}`,
            margin: `${block.style.marginTop || 0} ${block.style.marginRight || 0} ${block.style.marginBottom || 0} ${block.style.marginLeft || 0}`,
            borderWidth: `${block.style.borderTopWidth || 0} ${block.style.borderRightWidth || 0} ${block.style.borderBottomWidth || 0} ${block.style.borderLeftWidth || 0}`,
        };

        if (viewMode === 'mobile' && block.style.mobile) {
            Object.assign(style, block.style.mobile);
        }

        // --- SECTION ---
        if (block.type === 'section') {
            return (
                <div 
                    key={block.id}
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                    className={`relative group/section transition-all border-2 ${isSelected ? 'border-[#ffa900] z-10' : 'border-transparent hover:border-slate-200'}`}
                    style={{ backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined, backgroundSize: style.backgroundSize }}
                >
                    <div className="max-w-[600px] mx-auto min-h-[50px] relative" style={{ backgroundColor: style.contentBackgroundColor }}>
                        {block.children?.map((child, i) => (
                            <React.Fragment key={child.id}>
                                <DropZone parentId={block.id} index={i} />
                                {renderRecursive(child)}
                            </React.Fragment>
                        ))}
                        <DropZone parentId={block.id} index={block.children?.length || 0} />
                        
                        {(!block.children || block.children.length === 0) && (
                            <div className="py-8 text-center text-slate-300 text-xs border-2 border-dashed border-slate-200 m-2 rounded bg-white">Drop a Row here</div>
                        )}
                    </div>

                    {isSelected && (
                        <div className="absolute top-0 right-0 transform -translate-y-full flex gap-1 z-20 pb-1">
                            <div className="bg-[#ffa900] text-white text-[9px] font-bold px-2 py-1 rounded-t uppercase mr-auto">Section</div>
                            <button onClick={(e) => handleDuplicate(e, block.id)} className="p-1 bg-[#ffa900] text-white rounded-t hover:bg-[#e09200]"><Copy className="w-3 h-3" /></button>
                            <button onClick={(e) => handleDelete(e, block.id)} className="p-1 bg-slate-800 text-white rounded-t hover:bg-black"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    )}
                </div>
            );
        }

        // --- ROW ---
        if (block.type === 'row') {
            return (
                <div 
                    key={block.id}
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                    className={`relative group/row flex flex-wrap transition-all outline-2 outline-dashed ${isSelected ? 'outline-[#ffa900] outline-offset-[-2px] z-10' : 'outline-transparent hover:outline-blue-200'}`}
                    style={style}
                >
                    {block.children?.map((col) => renderRecursive(col))}
                    
                    {isSelected && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex gap-1 z-20 pb-1">
                             <div className="bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded-t uppercase">Row</div>
                            <button onClick={(e) => handleDelete(e, block.id)} className="p-1 bg-slate-800 text-white rounded-t hover:bg-black"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    )}
                </div>
            );
        }

        // --- COLUMN ---
        if (block.type === 'column') {
            return (
                <div 
                    key={block.id}
                    className={`relative min-h-[50px] flex flex-col transition-all border border-transparent ${isSelected ? 'border-blue-300 bg-blue-50/10' : 'hover:border-blue-100'}`}
                    style={{ ...style, flex: '1 1 0', minWidth: '0' }}
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                >
                    {block.children?.map((child, i) => (
                        <React.Fragment key={child.id}>
                            <DropZone parentId={block.id} index={i} />
                            {renderRecursive(child)}
                        </React.Fragment>
                    ))}
                    <DropZone parentId={block.id} index={block.children?.length || 0} />
                    
                    {(!block.children || block.children.length === 0) && (
                        <div className="flex-1 flex items-center justify-center p-2">
                            <div className="text-[9px] text-slate-300 font-bold uppercase border-2 border-dashed border-slate-100 rounded w-full text-center py-3">Column</div>
                        </div>
                    )}
                </div>
            );
        }

        // --- CONTENT BLOCKS ---
        return (
            <div 
                key={block.id} 
                onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                className={`relative group/block transition-all cursor-pointer ring-2 ${isSelected ? 'ring-[#ffa900] z-20' : 'ring-transparent hover:ring-blue-200'}`}
            >
                <div style={style}>
                    {block.type === 'text' && <div dangerouslySetInnerHTML={{ __html: block.content }} />}
                    
                    {block.type === 'button' && (
                        <div style={{ textAlign: style.textAlign as any }}>
                            <a className="inline-block" style={{
                                backgroundColor: style.backgroundColor || '#ffa900', // Ensure fallback
                                color: style.color,
                                padding: style.padding,
                                borderRadius: style.borderRadius,
                                textDecoration: 'none',
                                fontWeight: style.fontWeight,
                                fontSize: style.fontSize,
                                fontFamily: style.fontFamily,
                                width: style.width
                            }}>{block.content}</a>
                        </div>
                    )}

                    {block.type === 'image' && (
                        <div style={{ textAlign: style.textAlign as any }}>
                            <img src={block.content} alt={block.altText} style={{ maxWidth: '100%', width: style.width, height: 'auto', borderRadius: style.borderRadius }} />
                        </div>
                    )}

                    {block.type === 'divider' && (
                        <hr style={{ borderTop: `${style.borderTopWidth} ${style.borderStyle} ${style.borderColor}`, margin: 0 }} />
                    )}

                    {block.type === 'spacer' && <div style={{ height: style.height }}></div>}
                </div>

                {isSelected && (
                    <div className="absolute top-0 right-0 transform -translate-y-full pb-1 flex gap-1 z-30">
                        <button onClick={(e) => handleDuplicate(e, block.id)} className="p-1 bg-[#ffa900] text-white rounded-t hover:bg-[#e09200]"><Copy className="w-3 h-3" /></button>
                        <button onClick={(e) => handleDelete(e, block.id)} className="p-1 bg-slate-800 text-white rounded-t hover:bg-black"><Trash2 className="w-3 h-3" /></button>
                    </div>
                )}
            </div>
        );
    };

    if (mode === 'code') {
        return (
            <div className="flex-1 bg-[#1e293b] p-4 h-full overflow-hidden">
                <textarea 
                    value={customHtml} 
                    onChange={e => setCustomHtml(e.target.value)} 
                    className="w-full h-full bg-transparent text-green-400 font-mono text-xs outline-none resize-none"
                    spellCheck={false}
                />
            </div>
        );
    }

    const isMobile = viewMode === 'mobile';

    return (
        <div className="flex-1 bg-[#e2e8f0] overflow-y-auto overflow-x-hidden flex justify-center py-10" onClick={() => onSelectBlock(null)}>
            <div 
                className={`transition-all duration-300 bg-white shadow-2xl ${isMobile ? 'w-[375px] min-h-[667px] rounded-[30px] border-[8px] border-slate-800' : 'w-[650px] min-h-[800px]'}`}
                style={{ backgroundColor: bodyStyle.backgroundColor, fontFamily: bodyStyle.fontFamily }}
            >
                <div className="min-h-full pb-20 relative">
                    <DropZone parentId="root" index={0} />
                    {blocks.map(renderRecursive)}
                    <DropZone parentId="root" index={blocks.length} />
                    
                    {blocks.length === 0 && (
                        <div 
                            className={`flex flex-col items-center justify-center py-24 text-slate-400 border-2 border-dashed m-4 rounded-xl transition-all duration-200
                                ${dragTarget?.parentId === 'root' ? 'border-[#ffa900] bg-orange-50 text-[#ca7900] scale-105 shadow-xl' : 'border-slate-300 bg-slate-50'}`}
                            onDragOver={(e) => handleDragOver(e, 'root', 0)}
                            onDrop={(e) => handleDrop(e, 'root', 0)}
                        >
                            <Layout className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-sm font-bold uppercase tracking-widest">Kéo thả phần tử vào đây</p>
                            <div className="mt-4 flex gap-2 text-xs opacity-60">
                                <span className="bg-white px-2 py-1 rounded border">Layout</span>
                                <span className="bg-white px-2 py-1 rounded border">Text</span>
                                <span className="bg-white px-2 py-1 rounded border">Image</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailCanvas;
