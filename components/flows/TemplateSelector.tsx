
import React, { useState } from 'react';
import { Check, Search, Layout, Filter } from 'lucide-react';
import { Template } from '../../types';
import Input from '../common/Input';

interface TemplateSelectorProps {
  templates: Template[];
  selectedId?: string;
  onSelect: (template: Template) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, selectedId, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input 
          placeholder="Tìm mẫu email theo tên hoặc loại..." 
          icon={Search} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="shadow-none border-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
        {filtered.length > 0 ? (
          filtered.map((template) => {
            const isSelected = template.id === selectedId;
            return (
              <div 
                key={template.id}
                onClick={() => onSelect(template)}
                className={`
                  relative group cursor-pointer rounded-[24px] border-2 transition-all overflow-hidden
                  ${isSelected ? 'border-orange-500 ring-4 ring-orange-50 shadow-lg' : 'border-slate-100 hover:border-slate-300 hover:shadow-md bg-white'}
                `}
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-white p-2.5 rounded-full shadow-xl text-orange-600 animate-in zoom-in duration-300">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-slate-500 border border-slate-100">
                    {template.category}
                  </div>
                </div>
                <div className="p-3 bg-white border-t border-slate-50">
                  <p className="text-xs font-black text-slate-800 truncate">{template.name}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Layout className="w-8 h-8 text-slate-200" /></div>
             <p className="text-slate-400 font-bold text-sm">Không tìm thấy mẫu phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
