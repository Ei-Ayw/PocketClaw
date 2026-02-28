import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
    Smartphone, MessagesSquare, Hash, Workflow, Globe, Mail, Radio,
    Plus, Trash2, Power, PowerOff, Save, X, Key, Link, Edit3, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

type ChannelConfig = {
    id: string;
    name: string;
    enabled: boolean;
    token: string;
    webhook_url: string;
};

const CHANNEL_TEMPLATES = [
    { id: 'telegram', name: 'Telegram Bot', icon: Smartphone, color: 'text-blue-400', tokenLabel: 'Bot Token', tokenPlaceholder: '123456:ABC-DEF1234...', webhookLabel: 'Webhook URL (optional)', webhookPlaceholder: 'https://your-server.com/webhook/telegram' },
    { id: 'discord', name: 'Discord Bot', icon: Hash, color: 'text-indigo-400', tokenLabel: 'Bot Token', tokenPlaceholder: 'MTk4NjIy...', webhookLabel: 'Webhook URL', webhookPlaceholder: 'https://discord.com/api/webhooks/...' },
    { id: 'slack', name: 'Slack App', icon: Workflow, color: 'text-orange-400', tokenLabel: 'Bot OAuth Token', tokenPlaceholder: 'xoxb-...', webhookLabel: 'Webhook URL', webhookPlaceholder: 'https://hooks.slack.com/services/...' },
    { id: 'wechat', name: 'WeChat', icon: MessagesSquare, color: 'text-green-500', tokenLabel: 'App Secret', tokenPlaceholder: 'Your WeChat App Secret', webhookLabel: 'Callback URL', webhookPlaceholder: 'https://your-server.com/wechat/callback' },
    { id: 'mattermost', name: 'Mattermost', icon: MessageCircle, color: 'text-blue-300', tokenLabel: 'Bot Token', tokenPlaceholder: 'xxxx-xxxxxxxx', webhookLabel: 'Server URL', webhookPlaceholder: 'https://mattermost.example.com' },
    { id: 'matrix', name: 'Matrix', icon: Globe, color: 'text-emerald-400', tokenLabel: 'Access Token', tokenPlaceholder: 'syt_xxxx', webhookLabel: 'Homeserver URL', webhookPlaceholder: 'https://matrix.org' },
    { id: 'email', name: 'Email (SMTP)', icon: Mail, color: 'text-sky-400', tokenLabel: 'SMTP Password / App Password', tokenPlaceholder: 'Your email app password', webhookLabel: 'SMTP Server', webhookPlaceholder: 'smtp://smtp.gmail.com:587' },
    { id: 'webhook', name: 'Generic Webhook', icon: Globe, color: 'text-purple-400', tokenLabel: 'Secret Token', tokenPlaceholder: 'webhook-secret-xxx', webhookLabel: 'Endpoint URL', webhookPlaceholder: 'https://your-server.com/webhook' },
    { id: 'signal', name: 'Signal', icon: Radio, color: 'text-blue-500', tokenLabel: 'Signal CLI Token', tokenPlaceholder: 'signal-cli auth token', webhookLabel: 'Signal API URL', webhookPlaceholder: 'http://localhost:8080' },
    { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone, color: 'text-green-400', tokenLabel: 'API Token', tokenPlaceholder: 'whatsapp-business-token', webhookLabel: 'API Base URL', webhookPlaceholder: 'https://graph.facebook.com/v17.0' },
    { id: 'lark', name: 'Lark / Feishu', icon: MessageCircle, color: 'text-blue-400', tokenLabel: 'App Secret', tokenPlaceholder: 'lark-app-secret', webhookLabel: 'Webhook URL', webhookPlaceholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...' },
    { id: 'dingtalk', name: 'DingTalk', icon: MessageCircle, color: 'text-blue-500', tokenLabel: 'App Secret', tokenPlaceholder: 'dingtalk-secret', webhookLabel: 'Robot Webhook', webhookPlaceholder: 'https://oapi.dingtalk.com/robot/send?access_token=...' },
    { id: 'irc', name: 'IRC', icon: Hash, color: 'text-zinc-400', tokenLabel: 'NickServ Password', tokenPlaceholder: 'IRC password (optional)', webhookLabel: 'Server Address', webhookPlaceholder: 'irc.libera.chat:6697' },
    { id: 'qq', name: 'QQ', icon: MessagesSquare, color: 'text-blue-400', tokenLabel: 'Access Token', tokenPlaceholder: 'QQ bot token', webhookLabel: 'OneBot URL', webhookPlaceholder: 'ws://127.0.0.1:8080' },
    { id: 'nostr', name: 'Nostr', icon: Globe, color: 'text-purple-500', tokenLabel: 'Private Key (nsec)', tokenPlaceholder: 'nsec1...', webhookLabel: 'Relay URL', webhookPlaceholder: 'wss://relay.damus.io' },
    { id: 'nextcloud', name: 'Nextcloud Talk', icon: MessageCircle, color: 'text-blue-300', tokenLabel: 'App Password', tokenPlaceholder: 'nextcloud-app-password', webhookLabel: 'Server URL', webhookPlaceholder: 'https://cloud.example.com' },
    { id: 'imessage', name: 'iMessage', icon: Smartphone, color: 'text-blue-500', tokenLabel: 'N/A (macOS only)', tokenPlaceholder: 'No token needed', webhookLabel: 'Bridge URL', webhookPlaceholder: 'http://localhost:29318' },
];

export default function ChannelsView() {
    const addToast = useAppStore((state) => state.addToast);
    const [configs, setConfigs] = useState<ChannelConfig[]>([]);
    const [editingChannel, setEditingChannel] = useState<string | null>(null);
    const [editToken, setEditToken] = useState('');
    const [editWebhook, setEditWebhook] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Close editing on Escape
    useEffect(() => {
        if (!editingChannel) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setEditingChannel(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [editingChannel]);

    const fetchConfigs = async () => {
        try {
            const result = await invoke<ChannelConfig[]>('list_channel_configs');
            setConfigs(result);
        } catch {
            // Backend may not have configs yet
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const getConfig = (id: string) => configs.find((c) => c.id === id);

    const handleSave = async (templateId: string) => {
        setIsSaving(true);
        const template = CHANNEL_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        try {
            await invoke('save_channel_config', {
                config: {
                    id: templateId,
                    name: template.name,
                    enabled: true,
                    token: editToken,
                    webhook_url: editWebhook,
                },
            });
            addToast('success', `${template.name} configuration saved securely.`);
            setEditingChannel(null);
            setEditToken('');
            setEditWebhook('');
            fetchConfigs();
        } catch (err) {
            addToast('error', `Failed to save: ${String(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        const existing = getConfig(id);
        if (!existing) return;

        try {
            await invoke('save_channel_config', {
                config: { ...existing, enabled: !existing.enabled },
            });
            addToast('info', `${existing.name} ${existing.enabled ? 'disabled' : 'enabled'}.`);
            fetchConfigs();
        } catch (err) {
            addToast('error', `Toggle failed: ${String(err)}`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await invoke('delete_channel_config', { id });
            addToast('success', 'Channel configuration removed.');
            setConfirmDelete(null);
            fetchConfigs();
        } catch (err) {
            addToast('error', `Delete failed: ${String(err)}`);
        }
    };

    const startEditing = (id: string) => {
        const existing = getConfig(id);
        setEditToken(''); // Always empty — we never show real tokens
        setEditWebhook(existing?.webhook_url || '');
        setEditingChannel(id);
    };

    const hasToken = (id: string) => {
        const config = getConfig(id);
        return config?.token === 'HAS_TOKEN';
    };

    return (
        <div className="flex-1 flex flex-col bg-black/10 overflow-hidden">
            <div className="p-8 border-b border-white/5">
                <h1 className="text-2xl font-bold text-white mb-2">Communication Channels</h1>
                <p className="text-zinc-400 text-sm">Connect ZeroClaw to external messaging platforms. The engine acts as a unified brain for all channels.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {CHANNEL_TEMPLATES.map((template, i) => {
                    const Icon = template.icon;
                    const config = getConfig(template.id);
                    const isConfigured = !!config;
                    const isEditing = editingChannel === template.id;

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            key={template.id}
                            className={`border rounded-2xl transition-all ${isEditing ? 'bg-black/30 border-accent/20' : 'bg-black/20 border-white/5'}`}
                        >
                            {/* Header Row */}
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${template.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-200 text-lg mb-1">{template.name}</h3>
                                        <div className="flex items-center gap-2 text-xs">
                                            {isConfigured ? (
                                                <>
                                                    <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                                    <span className={config.enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                                                        {config.enabled ? 'Connected' : 'Disabled'}
                                                    </span>
                                                    <span className="text-zinc-700 mx-1">&middot;</span>
                                                    <span className={`font-mono ${hasToken(template.id) ? 'text-emerald-500' : 'text-zinc-600'}`}>Token: {hasToken(template.id) ? 'Configured' : 'Not Set'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 rounded-full bg-zinc-700" />
                                                    <span className="text-zinc-500">Not Configured</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isConfigured && (
                                        <>
                                            <button
                                                onClick={() => handleToggle(template.id)}
                                                className={`p-2 rounded-xl transition-colors border ${config.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'}`}
                                                title={config.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {config.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                                            </button>
                                            {confirmDelete === template.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(template.id)} className="text-[10px] font-bold text-red-400 hover:underline px-2">Delete</button>
                                                    <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold text-zinc-500 hover:underline px-2">Cancel</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(template.id)}
                                                    className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 border border-white/5 transition-colors"
                                                    title="Remove configuration"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <button
                                        onClick={() => isEditing ? setEditingChannel(null) : startEditing(template.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border ${isEditing ? 'bg-accent/20 text-accent border-accent/20' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border-white/5'}`}
                                    >
                                        {isEditing ? <><X size={14} /> Close</> : isConfigured ? <><Edit3 size={14} /> Edit</> : <><Plus size={14} /> Configure</>}
                                    </button>
                                </div>
                            </div>

                            {/* Edit Form */}
                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                                    <Key size={10} className="inline mr-1" />
                                                    {template.tokenLabel}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={editToken}
                                                    onChange={(e) => setEditToken(e.target.value)}
                                                    placeholder={hasToken(template.id) ? 'Token already configured — enter new to replace' : template.tokenPlaceholder}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                                                />
                                                {hasToken(template.id) && !editToken && (
                                                    <p className="text-[10px] text-emerald-500/70 mt-1">Current token is securely stored. Leave blank to keep it.</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                                    <Link size={10} className="inline mr-1" />
                                                    {template.webhookLabel}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={editWebhook}
                                                    onChange={(e) => setEditWebhook(e.target.value)}
                                                    placeholder={template.webhookPlaceholder}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                                                />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => setEditingChannel(null)}
                                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSave(template.id)}
                                                    disabled={(!editToken.trim() && !hasToken(template.id)) || isSaving}
                                                    className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <Save size={16} /> {isSaving ? 'Saving...' : 'Save & Secure'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                                                Tokens are stored in your OS secure enclave (Keyring). They are never sent to any external service.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
