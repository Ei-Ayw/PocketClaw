import { X, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-300">{label}</span>
            <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${value ? 'bg-accent' : 'bg-zinc-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

export function NumberField({ value, onChange, label, min, max, step }: { value: number; onChange: (v: number) => void; label: string; min?: number; max?: number; step?: number }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
            />
        </div>
    );
}

export function TextField({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
            />
        </div>
    );
}

export function PasswordField({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                />
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
}

export function SelectField({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white appearance-none outline-none focus:ring-1 focus:ring-accent/50"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>
                ))}
            </select>
        </div>
    );
}

export function TagsField({ value, onChange, label, placeholder }: { value: string[]; onChange: (v: string[]) => void; label: string; placeholder?: string }) {
    const [input, setInput] = useState('');
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {value.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300">
                        {tag}
                        <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-red-400"><X size={10} /></button>
                    </span>
                ))}
            </div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                        e.preventDefault();
                        onChange([...value, input.trim()]);
                        setInput('');
                    }
                }}
                placeholder={placeholder || 'Type and press Enter'}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
            />
        </div>
    );
}

export function SliderField({ value, onChange, label, min, max, step, unit }: { value: number; onChange: (v: number) => void; label: string; min: number; max: number; step: number; unit?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
                <span className="text-sm font-mono text-accent">{value}{unit || ''}</span>
            </div>
            <input
                type="range"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full accent-[var(--color-accent)] h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-600">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

export function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
            >
                <span className="font-medium">{title}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5">
                    {children}
                </div>
            )}
        </div>
    );
}

export function MapField({ value, onChange, label, keyPlaceholder, valuePlaceholder }: {
    value: Record<string, string[]>;
    onChange: (v: Record<string, string[]>) => void;
    label: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
}) {
    const [newKey, setNewKey] = useState('');
    const [newVal, setNewVal] = useState('');

    const addEntry = () => {
        if (!newKey.trim()) return;
        const vals = newVal.split(',').map(v => v.trim()).filter(Boolean);
        onChange({ ...value, [newKey.trim()]: [...(value[newKey.trim()] || []), ...vals] });
        setNewKey('');
        setNewVal('');
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</label>
            <div className="space-y-2">
                {Object.entries(value).map(([k, vals]) => (
                    <div key={k} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-xs text-accent font-mono">{k}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-xs text-zinc-300 font-mono flex-1">{vals.join(', ')}</span>
                        <button onClick={() => { const next = { ...value }; delete next[k]; onChange(next); }} className="text-zinc-500 hover:text-red-400"><X size={10} /></button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder={keyPlaceholder || 'Key'} className="flex-1 bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono" />
                <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder={valuePlaceholder || 'Values (comma-sep)'} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEntry(); } }} className="flex-1 bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono" />
                <button onClick={addEntry} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300 hover:bg-white/10">Add</button>
            </div>
        </div>
    );
}
