import { Key, Bot, Plus, Box as BoxIcon, HardDrive as HardDriveIcon, Zap as ZapIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';
import { useAppStore } from '../store';

export default function ProvidersView() {
    const selectedProvider = useAppStore((state) => state.selectedProvider);
    const setSelectedProvider = useAppStore((state) => state.setSelectedProvider);
    const addToast = useAppStore((state) => state.addToast);

    const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [customKey, setCustomKey] = useState('');

    // D-02: Close modal on Escape
    useEffect(() => {
        if (!isCustomModalOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCustomModalOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isCustomModalOpen]);

    const providers = [
        { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-3.5-turbo models.', icon: Bot },
        { id: 'anthropic', name: 'Anthropic', description: 'Claude 3 Opus, Sonnet, Haiku.', icon: BoxIcon },
        { id: 'ollama', name: 'Ollama', description: 'Local models like Llama 3, Mistral.', icon: HardDriveIcon },
        { id: 'groq', name: 'Groq', description: 'Ultra-fast LPU inference endpoints.', icon: ZapIcon },
    ];

    const handleKeyChange = (id: string, value: string) => {
        setProviderKeys((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveKey = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = providerKeys[id];
        if (!key) return;

        setIsSaving(true);
        try {
            await invoke('save_config', { apiKey: key, providerId: id, apiUrl: null });
            setProviderKeys((prev) => ({ ...prev, [id]: '' }));
            addToast('success', `API Key for ${id} stored in OS Secure Enclave.`);
        } catch (error) {
            addToast('error', `Failed to secure key: ${typeof error === 'string' ? error : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customKey.trim()) return;
        setIsSaving(true);
        try {
            await invoke('save_config', { apiKey: customKey.trim(), providerId: 'custom', apiUrl: customUrl.trim() || null });
            addToast('success', 'Custom provider saved with API URL.');
            setIsCustomModalOpen(false);
            setCustomUrl('');
            setCustomKey('');
            setSelectedProvider('custom');
        } catch (error) {
            addToast('error', `Failed: ${String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-black/10 overflow-hidden">
            <div className="p-8 border-b border-white/5">
                <h1 className="text-2xl font-bold text-white mb-2">Model Providers</h1>
                <p className="text-zinc-400 text-sm">Configure and manage AI model endpoints for ZeroClaw. Selected provider will be used for chat.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {providers.map((p, i) => {
                        const Icon = p.icon;
                        const isSelected = selectedProvider === p.id;
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={p.id}
                                onClick={() => setSelectedProvider(p.id)}
                                className={`relative group p-5 border rounded-2xl transition-all duration-300 cursor-pointer ${isSelected ? 'bg-primary/20 border-primary' : 'bg-secondary/40 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-zinc-500'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-200">{p.name}</h3>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isSelected ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {isSelected ? 'Selected' : 'Available'}
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-400 mb-6">{p.description}</p>

                                <div className="space-y-3">
                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Key size={14} className="text-zinc-600" />
                                            </div>
                                            <input
                                                type="password"
                                                value={providerKeys[p.id] || ''}
                                                onChange={(e) => handleKeyChange(p.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                placeholder={p.id === 'ollama' ? 'No key needed (local)' : 'Enter API Key'}
                                                disabled={isSaving || p.id === 'ollama'}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50"
                                            />
                                        </div>
                                        {p.id !== 'ollama' && (
                                            <button
                                                onClick={(e) => handleSaveKey(p.id, e)}
                                                disabled={!providerKeys[p.id] || isSaving}
                                                className="px-4 bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 border border-accent/20 rounded-xl text-xs font-medium transition-colors"
                                            >
                                                Secure
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => setIsCustomModalOpen(true)}
                        className="p-5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors cursor-pointer min-h-[200px]"
                    >
                        <Plus size={32} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Add Custom Provider</span>
                        <span className="text-xs mt-1 opacity-70">Support OpenAI-compatible endpoints</span>
                    </motion.div>
                </div>
            </div>

            {/* Custom Provider Modal */}
            <AnimatePresence>
                {isCustomModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-lg modal-panel"
                        >
                            <form onSubmit={handleSaveCustom} className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Add Custom Provider</h3>
                                    <button type="button" onClick={() => setIsCustomModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">API Base URL</label>
                                        <input
                                            type="url"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            placeholder="https://api.example.com/v1"
                                            className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">API Key</label>
                                        <input
                                            required
                                            type="password"
                                            value={customKey}
                                            onChange={(e) => setCustomKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setIsCustomModalOpen(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20 disabled:opacity-50">
                                        Save Provider
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
