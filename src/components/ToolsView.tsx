import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
    ShieldAlert, Terminal, FileCode2, SearchCode,
    Webhook, Plus, Trash2, RefreshCcw,
    Puzzle, Download, ExternalLink, Code2,
    Store, Star, ArrowDownCircle, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

type Skill = {
    name: string;
    description: string;
    version: string;
    author?: string;
    tags: string[];
    tools: any[];
    location?: string;
};

type HubSkill = {
    name: string;
    description: string;
    author: string;
    stars: number;
    url: string;
    tags: string[];
};

export default function ToolsView() {
    const addToast = useAppStore((state) => state.addToast);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [installSource, setInstallSource] = useState('');
    const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null);
    const [hubSearch, setHubSearch] = useState('');
    const [showHub, setShowHub] = useState(false);

    // ClawHub featured skills catalog (in production, fetched from API)
    const hubSkills: HubSkill[] = [
        { name: 'web-scraper', description: 'Extract structured data from any webpage using headless browser automation.', author: 'zeroclaw', stars: 342, url: 'https://github.com/zeroclaw/skill-web-scraper.git', tags: ['web', 'scraping', 'automation'] },
        { name: 'code-reviewer', description: 'AI-powered code review with security analysis and best-practice suggestions.', author: 'zeroclaw', stars: 289, url: 'https://github.com/zeroclaw/skill-code-reviewer.git', tags: ['code', 'review', 'security'] },
        { name: 'doc-writer', description: 'Generate comprehensive API documentation from source code automatically.', author: 'community', stars: 156, url: 'https://github.com/zeroclaw/skill-doc-writer.git', tags: ['docs', 'api', 'generation'] },
        { name: 'db-assistant', description: 'Natural language to SQL queries with schema-aware auto-completion.', author: 'community', stars: 203, url: 'https://github.com/zeroclaw/skill-db-assistant.git', tags: ['database', 'sql', 'query'] },
        { name: 'test-generator', description: 'Auto-generate unit and integration tests from existing source code.', author: 'zeroclaw', stars: 178, url: 'https://github.com/zeroclaw/skill-test-generator.git', tags: ['testing', 'unit', 'integration'] },
        { name: 'deploy-helper', description: 'One-click deployment to Docker, K8s, or cloud platforms with rollback support.', author: 'community', stars: 134, url: 'https://github.com/zeroclaw/skill-deploy-helper.git', tags: ['deploy', 'docker', 'cloud'] },
    ];

    const filteredHubSkills = hubSearch.trim()
        ? hubSkills.filter((s) =>
            s.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
            s.description.toLowerCase().includes(hubSearch.toLowerCase()) ||
            s.tags.some((t) => t.toLowerCase().includes(hubSearch.toLowerCase()))
        )
        : hubSkills;

    const handleHubInstall = async (skill: HubSkill) => {
        try {
            await invoke('install_skill', { source: skill.url });
            addToast('success', `${skill.name} installed from ClawHub.`);
            fetchSkills();
        } catch (err) {
            addToast('error', `Installation failed: ${String(err)}`);
        }
    };

    // D-02: Close modals on Escape
    useEffect(() => {
        if (!isInstallModalOpen && !isCreateModalOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isCreateModalOpen) setIsCreateModalOpen(false);
                else if (isInstallModalOpen) setIsInstallModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isInstallModalOpen, isCreateModalOpen]);

    const [createName, setCreateName] = useState('');
    const [createContent, setCreateContent] = useState('# New Skill\n\nDescribe what this skill does...');

    const [coreTools, setCoreTools] = useState([
        { id: 'shell', name: 'Shell Execution', desc: 'Allow agent to run bash/cmd scripts', risk: 'High', enabled: true, icon: Terminal },
        { id: 'fs_read', name: 'File System (Read)', desc: 'Allow reading files from workspace', risk: 'Low', enabled: true, icon: SearchCode },
        { id: 'fs_write', name: 'File System (Write)', desc: 'Allow modifying files in workspace', risk: 'Medium', enabled: true, icon: FileCode2 },
        { id: 'browser', name: 'Web Browser', desc: 'Allow agent to surf the web for info', risk: 'Low', enabled: false, icon: Webhook },
    ]);

    const handleToggle = async (id: string) => {
        const tool = coreTools.find((t) => t.id === id);
        if (!tool) return;

        try {
            await invoke('update_tool_config', { toolId: id, enabled: !tool.enabled });
            setCoreTools((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
        } catch (err) {
            addToast('error', `Failed to update tool config: ${String(err)}`);
        }
    };

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const result = await invoke<Skill[]>('list_skills');
            setSkills(result);
        } catch (err) {
            addToast('error', `Failed to load skills: ${String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('install_skill', { source: installSource });
            setIsInstallModalOpen(false);
            setInstallSource('');
            addToast('success', 'Skill installed successfully.');
            fetchSkills();
        } catch (err) {
            addToast('error', `Installation failed: ${String(err)}`);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleUninstall = async (name: string) => {
        try {
            await invoke('uninstall_skill', { name });
            addToast('success', `${name} uninstalled.`);
            setConfirmUninstall(null);
            fetchSkills();
        } catch (err) {
            addToast('error', `Uninstall failed: ${String(err)}`);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('create_skill', { name: createName, content: createContent });
            setIsCreateModalOpen(false);
            setCreateName('');
            setCreateContent('# New Skill\n\nDescribe what this skill does...');
            addToast('success', 'Skill created successfully.');
            fetchSkills();
        } catch (err) {
            addToast('error', `Creation failed: ${String(err)}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-black/10 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-start justify-between bg-black/20">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Puzzle className="text-accent" />
                        Tools Sandbox & Skills
                    </h1>
                    <p className="text-zinc-400 text-sm">Manage engine capabilities and extend functionality with plugins.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors">
                        <Plus size={18} /> New Skill
                    </button>
                    <button onClick={() => setIsInstallModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                        <Download size={18} /> Install Skill
                    </button>
                    <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-orange-400 text-sm">
                        <ShieldAlert size={16} /> <span>Strict Sandboxing Active</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 text-white">
                <section>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                        <ShieldAlert size={18} className="text-zinc-500" /> Core Capabilities
                    </h2>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {coreTools.map((t, i) => {
                            const Icon = t.icon;
                            return (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={t.id} className="p-5 border border-white/5 rounded-2xl bg-secondary/20 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400"><Icon size={20} /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-zinc-200">{t.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${t.risk === 'High' ? 'border-red-500/30 text-red-500 bg-red-500/5' : t.risk === 'Medium' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>{t.risk} Risk</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">{t.desc}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggle(t.id)} className={`w-10 h-5 rounded-full p-1 transition-colors ${t.enabled ? 'bg-accent' : 'bg-zinc-700'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${t.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                            <Puzzle size={18} className="text-zinc-500" /> Installed Skills
                        </h2>
                        <button onClick={fetchSkills} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {skills.length === 0 && !loading && (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-zinc-500">
                            <Code2 size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">No custom skills installed yet.</p>
                            <button onClick={() => setShowHub(true)} className="mt-4 text-accent text-xs font-semibold hover:underline">Browse ClawHub Repository</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {skills.map((skill, i) => (
                            <motion.div key={skill.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="group bg-secondary/10 border border-white/5 rounded-2xl p-6 hover:bg-secondary/20 transition-all hover:border-white/10 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Puzzle size={24} /></div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded italic">v{skill.version}</span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2 truncate">{skill.name}</h3>
                                <p className="text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">{skill.description}</p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {skill.tags.map((tag) => (<span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{tag}</span>))}
                                    {skill.tools.map((tool) => (<span key={tool.name} className="text-[9px] font-bold uppercase tracking-wider text-accent/60 bg-accent/5 px-2 py-0.5 rounded border border-accent/10">{tool.name}</span>))}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500"><Terminal size={12} />{skill.tools.length} Tools Loaded</div>
                                    {confirmUninstall === skill.name ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleUninstall(skill.name)} className="text-[10px] font-bold text-red-400 hover:underline">Confirm</button>
                                            <button onClick={() => setConfirmUninstall(null)} className="text-[10px] font-bold text-zinc-500 hover:underline">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmUninstall(skill.name)} className="text-zinc-500 hover:text-red-400 transition-colors p-1"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ClawHub Repository Browser */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                            <Store size={18} className="text-accent" /> ClawHub Repository
                        </h2>
                        <button
                            onClick={() => setShowHub(!showHub)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${showHub ? 'bg-white/10 text-white' : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20'}`}
                        >
                            {showHub ? 'Hide Catalog' : 'Browse Skills'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showHub && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative mb-6">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search size={16} className="text-zinc-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={hubSearch}
                                        onChange={(e) => setHubSearch(e.target.value)}
                                        placeholder="Search skills by name, description, or tag..."
                                        className="w-full bg-black/30 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredHubSkills.map((skill, i) => (
                                        <motion.div
                                            key={skill.name}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-secondary/10 border border-white/5 rounded-2xl p-5 hover:bg-secondary/20 hover:border-accent/20 transition-all flex flex-col"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                                    <Store size={20} />
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-400 text-xs">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="font-mono font-bold">{skill.stars}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-white font-bold mb-1 truncate">{skill.name}</h3>
                                            <p className="text-zinc-400 text-xs line-clamp-2 mb-3 flex-1">{skill.description}</p>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {skill.tags.map((tag) => (
                                                    <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <span className="text-[10px] text-zinc-600 font-mono">by {skill.author}</span>
                                                <button
                                                    onClick={() => handleHubInstall(skill)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg text-xs font-semibold transition-colors border border-accent/20"
                                                >
                                                    <ArrowDownCircle size={14} /> Install
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {filteredHubSkills.length === 0 && (
                                    <div className="text-center py-8 text-zinc-500 text-sm">
                                        No skills match your search.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            {/* Install Modal */}
            <AnimatePresence>
                {isInstallModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg modal-panel">
                            <form onSubmit={handleInstall} className="p-8">
                                <div className="flex items-center gap-3 mb-2 text-accent"><Download size={24} /><h3 className="text-xl font-bold text-white">Install New Skill</h3></div>
                                <p className="text-xs text-zinc-500 mb-6 font-medium uppercase tracking-wider">Expand your agent's neural roadmap.</p>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Skill Source (Git URL or Local Path)</label>
                                        <input required type="text" value={installSource} onChange={(e) => setInstallSource(e.target.value)} placeholder="https://github.com/user/my-skill.git" className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono" />
                                    </div>
                                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-start gap-4">
                                        <div className="mt-1 text-accent"><ExternalLink size={18} /></div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-1">Open Skills Repository</h4>
                                            <p className="text-xs text-zinc-500 leading-relaxed">Browse thousands of community-built skills for ZeroClaw.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setIsInstallModalOpen(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20">Initialize & Load</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl modal-panel">
                            <form onSubmit={handleCreate} className="p-8">
                                <div className="flex items-center gap-3 mb-2 text-accent"><Plus size={24} /><h3 className="text-xl font-bold text-white">Create Custom Skill</h3></div>
                                <p className="text-xs text-zinc-500 mb-6 font-medium uppercase tracking-wider">Define new prompts and instructions for your agent.</p>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Skill Name (Slug)</label>
                                        <input required type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="my-personal-assistant" className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Instructions (SKILL.md)</label>
                                        <textarea required rows={10} value={createContent} onChange={(e) => setCreateContent(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-accent font-mono resize-none" />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20">Save Skill</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
