import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
    Brain, Search, Plus, Trash2, RefreshCcw,
    ChevronRight, Tag, Calendar, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

type MemoryEntry = {
    id: string;
    key: string;
    content: string;
    category: any;
    timestamp: string;
    score?: number;
};

export default function MemoryView() {
    const addToast = useAppStore((state) => state.addToast);
    const [memories, setMemories] = useState<MemoryEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // D-02: Close modal on Escape
    useEffect(() => {
        if (!isAddModalOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsAddModalOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isAddModalOpen]);

    const [newKey, setNewKey] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('core');

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const result = await invoke<MemoryEntry[]>(searchQuery ? 'search_memories' : 'list_memories', {
                query: searchQuery,
                limit: 50,
            });
            setMemories(result);
        } catch (err) {
            console.error('Memory fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchMemories(); }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleForget = async (key: string) => {
        try {
            await invoke('forget_memory', { key });
            addToast('success', `Memory "${key}" forgotten.`);
            fetchMemories();
        } catch (err) {
            addToast('error', `Failed to forget memory: ${String(err)}`);
        }
    };

    const handleAddMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('store_memory', { key: newKey, content: newContent, category: newCategory });
            setIsAddModalOpen(false);
            setNewKey('');
            setNewContent('');
            addToast('success', 'Memory injected into brain.');
            fetchMemories();
        } catch (err) {
            addToast('error', `Failed to store memory: ${String(err)}`);
        }
    };

    const getCategoryIcon = (category: any) => {
        const cat = typeof category === 'string' ? category : 'custom';
        switch (cat) {
            case 'core': return <Database size={14} className="text-amber-400" />;
            case 'daily': return <Calendar size={14} className="text-emerald-400" />;
            case 'conversation': return <Tag size={14} className="text-blue-400" />;
            default: return <ChevronRight size={14} className="text-zinc-500" />;
        }
    };

    return (
        <div className="flex-1 flex flex-col p-8 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Brain className="text-accent" /> Brain Memory
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage ZeroClaw's long-term knowledge and learned facts.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                        <Plus size={18} /> Inject Memory
                    </button>
                    <button onClick={fetchMemories} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="text" placeholder="Search through learned knowledge..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Units:</span>
                    <span className="text-sm font-mono text-accent">{memories.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {memories.length === 0 && !loading && (
                    <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl">
                        <Brain size={48} className="opacity-20 mb-4" />
                        <p className="text-sm italic">No relevant memories found.</p>
                    </div>
                )}

                {memories.map((mem, i) => (
                    <motion.div key={mem.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="group bg-secondary/20 border border-white/5 rounded-2xl p-5 hover:bg-secondary/40 transition-all hover:border-white/10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="font-mono text-[10px] font-bold text-accent uppercase tracking-tighter bg-accent/10 px-2 py-0.5 rounded truncate max-w-[200px]">{mem.key}</div>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold uppercase text-zinc-500">
                                        {getCategoryIcon(mem.category)}
                                        {typeof mem.category === 'string' ? mem.category : 'custom'}
                                    </div>
                                    {mem.score && <div className="text-[9px] font-mono text-zinc-600">rel: {(mem.score * 100).toFixed(0)}%</div>}
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">{mem.content}</p>
                                <div className="mt-3 text-[10px] text-zinc-600 font-mono truncate">UID: {mem.id} &middot; Learned: {new Date(mem.timestamp).toLocaleString()}</div>
                            </div>
                            <button onClick={() => handleForget(mem.key)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 text-zinc-600 rounded-lg transition-all" title="Forget this memory">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg modal-panel">
                            <form onSubmit={handleAddMemory} className="p-8">
                                <h3 className="text-xl font-bold text-white mb-2">Inject Core Memory</h3>
                                <p className="text-xs text-zinc-500 mb-6">Manually guide the agent by adding persistent facts to its brain.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Topic Key</label>
                                        <input required type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. user_preference, project_context" className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Category</label>
                                        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-accent appearance-none">
                                            <option value="core" className="bg-zinc-900">Core (Permanent)</option>
                                            <option value="daily" className="bg-zinc-900">Daily (Contextual)</option>
                                            <option value="conversation" className="bg-zinc-900">Conversation</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Memory Content</label>
                                        <textarea required rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="The detailed fact or instruction to store..." className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20">Store in Brain</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
