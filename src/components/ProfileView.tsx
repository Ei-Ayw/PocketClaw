import { User, Key, Cpu, HardDrive, Shield, ChevronRight, Check, X as XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function ProfileView({ onNavigate }: { onNavigate: (view: string) => void }) {
    const selectedProvider = useAppStore((state) => state.selectedProvider);
    const selectedModel = useAppStore((state) => state.selectedModel);
    const isConfigured = useAppStore((state) => state.isConfigured);
    const engineOnline = useAppStore((state) => state.engineOnline);
    const availableProviders = useAppStore((state) => state.availableProviders);

    const currentProvider = availableProviders.find((p) => p.id === selectedProvider);

    // Check which providers have keys configured
    const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
    useEffect(() => {
        const checkProviders = async () => {
            const status: Record<string, boolean> = {};
            for (const p of availableProviders) {
                if (!p.needsKey) {
                    status[p.id] = true; // Ollama doesn't need a key
                    continue;
                }
                try {
                    const result = await invoke<string>('load_config', { providerId: p.id });
                    let parsed: any;
                    try { parsed = JSON.parse(result); } catch { parsed = {}; }
                    status[p.id] = !!parsed.has_api_key;
                } catch {
                    status[p.id] = false;
                }
            }
            setProviderStatus(status);
        };
        checkProviders();
    }, []);

    const configuredCount = Object.values(providerStatus).filter(Boolean).length;

    const sections = [
        {
            title: 'Engine Status',
            items: [
                { label: 'Status', value: engineOnline ? 'Online' : 'Idle', color: engineOnline ? 'text-emerald-400' : 'text-zinc-500' },
                { label: 'Version', value: 'v0.1.0-alpha', color: 'text-zinc-400' },
                { label: 'Runtime', value: 'ZeroClaw Engine', color: 'text-zinc-400' },
            ],
        },
        {
            title: 'Active Provider',
            items: [
                { label: 'Provider', value: currentProvider?.name || selectedProvider, color: 'text-zinc-200' },
                { label: 'Model', value: selectedModel, color: 'text-accent' },
                { label: 'API Key', value: isConfigured ? 'Configured' : 'Not Set', color: isConfigured ? 'text-emerald-400' : 'text-amber-400' },
            ],
        },
    ];

    const quickLinks = [
        { label: 'Manage Providers', desc: 'Add, remove, or switch AI model providers', icon: Key, view: 'providers' },
        { label: 'Tools & Skills', desc: 'Configure capabilities and install skills', icon: Cpu, view: 'tools' },
        { label: 'Workspace', desc: 'Manage your working directory and files', icon: HardDrive, view: 'workspace' },
        { label: 'Security & Supervisor', desc: 'View engine audit logs and metrics', icon: Shield, view: 'status' },
    ];

    return (
        <div className="flex-1 flex flex-col bg-black/10 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-black/20">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <User className="text-accent" />
                    Profile
                </h1>
                <p className="text-zinc-400 text-sm">Overview of your PocketClaw configuration and quick links.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 text-white">
                {/* Avatar + Identity */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-6 p-6 bg-secondary/20 border border-white/5 rounded-2xl"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/20">
                        <User size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">PocketClaw User</h2>
                        <p className="text-zinc-500 text-sm mt-1">Local instance &middot; {currentProvider?.name || selectedProvider} &middot; {selectedModel}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${engineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                <span className="text-xs text-zinc-500">{engineOnline ? 'Engine Online' : 'Engine Idle'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Key size={12} className="text-zinc-600" />
                                <span className="text-xs text-zinc-500">{configuredCount}/{availableProviders.length} providers ready</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Provider Status Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Provider Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {availableProviders.map((p, i) => {
                            const ready = providerStatus[p.id];
                            const isActive = selectedProvider === p.id;
                            return (
                                <motion.button
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 + i * 0.03 }}
                                    onClick={() => onNavigate('providers')}
                                    className={`p-4 rounded-2xl border text-center transition-all hover:bg-white/5 ${isActive ? 'border-accent/30 bg-accent/5' : 'border-white/5 bg-secondary/10'}`}
                                >
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        {ready ? (
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Check size={10} className="text-emerald-400" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-zinc-700/50 flex items-center justify-center">
                                                <XIcon size={10} className="text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-accent' : 'text-zinc-300'}`}>{p.name}</p>
                                    <p className="text-[10px] text-zinc-600 mt-0.5">{ready ? 'Ready' : 'Not Set'}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Status Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sections.map((section, si) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + si * 0.1 }}
                            className="p-6 bg-secondary/20 border border-white/5 rounded-2xl"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">{section.title}</h3>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">{item.label}</span>
                                        <span className={`text-sm font-semibold font-mono ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quickLinks.map((link, i) => {
                            const Icon = link.icon;
                            return (
                                <motion.button
                                    key={link.view}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    onClick={() => onNavigate(link.view)}
                                    className="flex items-center gap-4 p-4 bg-secondary/10 border border-white/5 rounded-2xl hover:bg-secondary/20 hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-zinc-200">{link.label}</h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">{link.desc}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
