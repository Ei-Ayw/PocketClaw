import {
    X, Save, Cpu, Shield, Brain, Globe, DollarSign, Sliders, RotateCcw,
    ChevronRight, Wrench, Server, Plug, GitBranch, Settings2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

import type { EngineSettings, TabId } from './settings/types';
import GeneralTab, { MODEL_OPTIONS } from './settings/GeneralTab';
import AgentTab from './settings/AgentTab';
import AutonomyTab from './settings/AutonomyTab';
import MemoryTab from './settings/MemoryTab';
import NetworkTab from './settings/NetworkTab';
import SecurityTab from './settings/SecurityTab';
import CostTab from './settings/CostTab';
import ToolsTab from './settings/ToolsTab';
import RuntimeTab from './settings/RuntimeTab';
import IntegrationsTab from './settings/IntegrationsTab';
import RoutingTab from './settings/RoutingTab';
import AdvancedTab from './settings/AdvancedTab';

const TABS: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'agent', label: 'Agent', icon: Cpu },
    { id: 'autonomy', label: 'Autonomy', icon: Shield },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'network', label: 'Network', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'cost', label: 'Cost', icon: DollarSign },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'runtime', label: 'Runtime', icon: Server },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'routing', label: 'Routing', icon: GitBranch },
    { id: 'advanced', label: 'Advanced', icon: Settings2 },
];

export default function SettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const selectedModel = useAppStore((state) => state.selectedModel);
    const setSelectedModel = useAppStore((state) => state.setSelectedModel);
    const selectedProvider = useAppStore((state) => state.selectedProvider);
    const addToast = useAppStore((state) => state.addToast);

    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [localModel, setLocalModel] = useState(selectedModel);
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(4096);
    const [settings, setSettings] = useState<EngineSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Track initial snapshot for dirty detection
    const initialSnapshot = useRef<string>('');

    const models = MODEL_OPTIONS[selectedProvider] || MODEL_OPTIONS.openai;

    // Load settings when dialog opens
    useEffect(() => {
        if (!isOpen) return;
        setLocalModel(selectedModel);
        setIsDirty(false);
        setIsLoading(true);
        invoke<EngineSettings>('get_engine_settings')
            .then((result) => {
                setSettings(result);
                initialSnapshot.current = JSON.stringify(result);
            })
            .catch(() => {/* Settings not available yet */})
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    // Reset model if provider changed
    useEffect(() => {
        if (isOpen && !models.some((m) => m.value === localModel)) {
            setLocalModel(models[0].value);
        }
    }, [selectedProvider, isOpen]);

    // Escape to close with dirty check
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, isDirty]);

    // Track dirty state
    useEffect(() => {
        if (!settings || !initialSnapshot.current) return;
        const current = JSON.stringify(settings);
        setIsDirty(current !== initialSnapshot.current || localModel !== selectedModel);
    }, [settings, localModel]);

    const updateSettings = <K extends keyof EngineSettings>(section: K, field: string, value: any) => {
        if (!settings) return;
        // Handle array-type sections (model_routes, embedding_routes) where field is '' and value is the whole array
        if (field === '' && Array.isArray(value)) {
            setSettings({ ...settings, [section]: value });
        } else {
            setSettings({
                ...settings,
                [section]: { ...(settings[section] as any), [field]: value },
            });
        }
    };

    const handleCloseAttempt = () => {
        if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            setSelectedModel(localModel);

            // Save inference params
            await invoke('save_inference_config', { temperature, maxTokens: maxTokens > 0 ? maxTokens : null });

            // Save engine settings if loaded
            if (settings) {
                await invoke('save_engine_settings', { settings });
            }

            initialSnapshot.current = JSON.stringify(settings);
            setIsDirty(false);
            addToast('success', 'All settings saved. Agent will reinitialize on next message.');
            onClose();
        } catch (err) {
            addToast('error', `Failed to save settings: ${String(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const renderTab = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">Loading engine settings...</div>;
        }

        switch (activeTab) {
            case 'general':
                return <GeneralTab temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} localModel={localModel} setLocalModel={setLocalModel} />;
            case 'agent':
                return settings ? <AgentTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'autonomy':
                return settings ? <AutonomyTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'memory':
                return settings ? <MemoryTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'network':
                return settings ? <NetworkTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'security':
                return settings ? <SecurityTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'cost':
                return settings ? <CostTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'tools':
                return settings ? <ToolsTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'runtime':
                return settings ? <RuntimeTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'integrations':
                return settings ? <IntegrationsTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'routing':
                return settings ? <RoutingTab settings={settings} updateSettings={updateSettings} /> : null;
            case 'advanced':
                return settings ? <AdvancedTab settings={settings} updateSettings={updateSettings} /> : null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseAttempt}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-3xl modal-panel backdrop-blur-xl flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-white">Engine Configuration</h2>
                                {isDirty && <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Unsaved</span>}
                            </div>
                            <button onClick={handleCloseAttempt} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body: Tabs + Content */}
                        <div className="flex flex-1 min-h-0">
                            {/* Tab sidebar */}
                            <div className="w-44 border-r border-white/5 py-2 shrink-0 overflow-y-auto">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all ${isActive ? 'text-white bg-white/10 border-r-2 border-accent' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                        >
                                            <Icon size={14} className={isActive ? 'text-accent' : ''} />
                                            {tab.label}
                                            {isActive && <ChevronRight size={12} className="ml-auto text-accent" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {renderTab()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 bg-black/20 border-t border-white/10 shrink-0">
                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    invoke<EngineSettings>('get_engine_settings')
                                        .then((result) => {
                                            setSettings(result);
                                            initialSnapshot.current = JSON.stringify(result);
                                            setIsDirty(false);
                                            addToast('info', 'Settings reset to current engine values.');
                                        })
                                        .catch(() => {})
                                        .finally(() => setIsLoading(false));
                                }}
                                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={handleCloseAttempt} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    <Save size={16} /> {isSaving ? 'Saving...' : 'Save All'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
