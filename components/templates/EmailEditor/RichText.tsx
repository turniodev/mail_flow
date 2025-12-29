
import React, { useRef, useEffect } from 'react';

interface RichTextProps {
    value: string;
    onChange: (val: string) => void;
    className?: string;
}

const RichText: React.FC<RichTextProps> = ({ value, onChange, className = "" }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            contentEditable
            className={`border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none ${className}`}
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        />
    );
};

export default RichText;
