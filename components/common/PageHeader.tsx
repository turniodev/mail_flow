import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: string[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, breadcrumbs }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
      <div>
        {breadcrumbs && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb}>
                        <span>{crumb}</span>
                        {idx < breadcrumbs.length - 1 && <span>/</span>}
                    </React.Fragment>
                ))}
            </div>
        )}
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {title}
            <span className="block h-1.5 w-12 bg-gradient-to-r from-[#ffa900] to-[#ca7900] rounded-full mt-2"></span>
        </h2>
        {description && <p className="text-slate-500 mt-2 font-medium">{description}</p>}
      </div>
      {action && (
        <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
            {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;