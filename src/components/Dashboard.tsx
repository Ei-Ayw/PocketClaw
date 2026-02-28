import { Bot, Send, UploadCloud, Square, Paperclip, Copy, Check, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Sidebar, { ViewType } from './Sidebar';
import ProvidersView from './ProvidersView';
import ChannelsView from './ChannelsView';
import ToolsView from './ToolsView';
import StatusView from './StatusView';
import WorkspaceView from './WorkspaceView';
import MemoryView from './MemoryView';
import ProfileView from './ProfileView';
import SettingsDialog from './SettingsDialog';

import { useAppStore } from '../store';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
    tools?: {
        name: string;
        args?: any;
        result?: any;
        status: 'running' | 'success' | 'error';
    }[];
};

type AuthRequest = {
    id: string;
    tool: string;
    arguments: any;
};

const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.json', '.csv', '.doc', '.docx', '.py', '.rs', '.ts', '.tsx', '.js', '.jsx', '.toml', '.yaml', '.yml'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Copy-to-clipboard button for code blocks */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard API may fail in some contexts */ }
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
            title="Copy code"
        >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
    );
}

/** Render markdown-like text with code blocks, bold, italic, and links */
function renderMarkdown(text: string) {
    if (!text) return null;

    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
        // Code block
        if (part.startsWith('```') && part.endsWith('```')) {
            const content = part.slice(3, -3);
            const firstNewline = content.indexOf('\n');
            const lang = firstNewline > 0 ? content.slice(0, firstNewline).trim() : '';
            const code = firstNewline > 0 ? content.slice(firstNewline + 1) : content;
            return (
                <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-4 py-1.5 flex items-center justify-between border-b border-white/5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                            {lang || 'code'}
                        </span>
                        <CopyButton text={code} />
                    </div>
                    <pre className="bg-black/40 p-4 overflow-x-auto text-xs leading-relaxed">
                        <code className="text-zinc-300">{code}</code>
                    </pre>
                </div>
            );
        }

        // Inline markdown: bold, italic, inline code, links
        const inlineParts = part.split(/(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/g);
        return (
            <span key={i}>
                {inlineParts.map((segment, j) => {
                    if (segment.startsWith('**') && segment.endsWith('**')) {
                        return <strong key={j} className="font-semibold text-white">{segment.slice(2, -2)}</strong>;
                    }
                    if (segment.startsWith('`') && segment.endsWith('`')) {
                        return <code key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-accent text-xs font-mono">{segment.slice(1, -1)}</code>;
                    }
                    const linkMatch = segment.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                        return <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80">{linkMatch[1]}</a>;
                    }
                    return segment;
                })}
            </span>
        );
    });
}

export default function Dashboard() {
    const selectedProvider = useAppStore((state) => state.selectedProvider);
    const selectedModel = useAppStore((state) => state.selectedModel);
    const isConfigured = useAppStore((state) => state.isConfigured);
    const addToast = useAppStore((state) => state.addToast);
    const setEngineOnline = useAppStore((state) => state.setEngineOnline);
    const [currentView, setCurrentView] = useState<ViewType>('chat');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Auth State
    const [pendingAuth, setPendingAuth] = useState<AuthRequest | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isAborting, setIsAborting] = useState(false);

    // Drag counter to prevent flicker
    const dragCounter = useRef(0);

    // Synchronous mutex ref to prevent concurrent sends (CHAOS-07)
    const sendingRef = useRef(false);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Input ref for focus management
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledUp = useRef(false);

    const scrollToBottom = useCallback(() => {
        if (!userScrolledUp.current && endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    // Detect if user scrolled up
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const unlisten = listen<AuthRequest>('zeroclaw-tool-auth-request', (event) => {
            setPendingAuth(event.payload);
        });
        return () => { unlisten.then((u) => u()); };
    }, []);

    // D-01: Global keyboard shortcuts
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            // Ctrl+, → Open settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                setIsSettingsOpen(true);
            }
            // Ctrl+L → Clear chat
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                if (!isTyping && messages.length > 0) {
                    setMessages([]);
                    addToast('info', 'Chat cleared.');
                }
            }
            // Escape → close settings
            if (e.key === 'Escape') {
                if (isSettingsOpen) setIsSettingsOpen(false);
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, [isTyping, messages.length, isSettingsOpen]);

    const handleClearChat = () => {
        if (isTyping) return;
        setMessages([]);
        addToast('info', 'Chat cleared.');
    };

    const handleAuthorize = async (approved: boolean) => {
        if (!pendingAuth) return;
        try {
            await invoke('authorize_tool', { id: pendingAuth.id, approved });
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            setPendingAuth(null);
        }
    };

    const handleAbort = async () => {
        setIsAborting(true);
        try {
            await invoke('abort_generation');
            sendingRef.current = false;
            setIsTyping(false);
            addToast('warning', 'Generation stopped.');
        } catch (err) {
            addToast('error', `Failed to stop generation: ${String(err)}`);
        } finally {
            setIsAborting(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || sendingRef.current) return;

        // If no provider key configured, guide user to Providers page
        if (!isConfigured && selectedProvider !== 'ollama') {
            addToast('warning', 'Please configure an API key first. Navigating to Providers...');
            setCurrentView('providers');
            return;
        }

        sendingRef.current = true;

        const userMsg = text.trim();
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setInput('');

        let accumulated = '';
        let unlistenDelta: (() => void) | null = null;
        let unlistenToolStart: (() => void) | null = null;
        let unlistenToolResult: (() => void) | null = null;

        try {
            setIsTyping(true);
            setEngineOnline(true);
            userScrolledUp.current = false;

            setMessages((prev) => [...prev, { role: 'assistant', content: '', tools: [] }]);

            unlistenDelta = await listen<string>('zeroclaw-delta', (event) => {
                accumulated += event.payload;
                setMessages((prev) => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    if (last && last.role === 'assistant') {
                        last.content = accumulated;
                    }
                    return newMsgs;
                });
            });

            unlistenToolStart = await listen<{ tool: string; arguments: any }>('zeroclaw-tool-start', (event) => {
                setMessages((prev) => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    if (last && last.role === 'assistant') {
                        last.tools = [
                            ...(last.tools || []),
                            { name: event.payload.tool, args: event.payload.arguments, status: 'running' },
                        ];
                    }
                    return newMsgs;
                });
            });

            unlistenToolResult = await listen<{ tool: string; success: boolean; output: string }>('zeroclaw-tool-result', (event) => {
                setMessages((prev) => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    if (last && last.role === 'assistant' && last.tools) {
                        for (let i = last.tools.length - 1; i >= 0; i--) {
                            if (last.tools[i].name === event.payload.tool && last.tools[i].status === 'running') {
                                last.tools[i] = {
                                    ...last.tools[i],
                                    status: event.payload.success ? 'success' : 'error',
                                    result: event.payload.output,
                                };
                                break;
                            }
                        }
                    }
                    return newMsgs;
                });
            });

            const response: string = await invoke('send_chat_message', {
                message: userMsg,
                providerId: selectedProvider,
                model: selectedModel,
            });

            setMessages((prev) => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last && last.role === 'assistant') {
                    last.content = response;
                }
                return newMsgs;
            });
        } catch (error) {
            const errorMsg = typeof error === 'string' ? error : error instanceof Error ? error.message : String(error);
            setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, isError: true }]);
            addToast('error', 'Engine returned an error. Check your API key and provider settings.');
        } finally {
            sendingRef.current = false;
            setIsTyping(false);
            if (unlistenDelta) unlistenDelta();
            if (unlistenToolStart) unlistenToolStart();
            if (unlistenToolResult) unlistenToolResult();
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        await sendMessage(input);
    };

    const validateAndProcessFile = async (file: File, skipTypingGuard = false) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
            addToast('error', `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            addToast('error', `File too large: ${formatFileSize(file.size)}. Maximum: ${formatFileSize(MAX_FILE_SIZE)}`);
            return;
        }

        const filePath = (file as any).path || file.name;
        setMessages((prev) => [...prev, { role: 'user', content: `Ingesting: ${file.name} (${formatFileSize(file.size)})` }]);

        if (!skipTypingGuard) setIsTyping(true);
        try {
            const result = await invoke<string>('process_document', { filePath });
            setMessages((prev) => [...prev, { role: 'assistant', content: result }]);
            addToast('success', `${file.name} ingested successfully.`);
        } catch (err) {
            const errMsg = typeof err === 'string' ? err : String(err);
            setMessages((prev) => [...prev, { role: 'assistant', content: `Failed to process ${file.name}: ${errMsg}`, isError: true }]);
        } finally {
            if (!skipTypingGuard) setIsTyping(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        addToast('info', `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`);
        setIsTyping(true);
        try {
            for (const file of files) {
                await validateAndProcessFile(file, true);
            }
        } finally {
            setIsTyping(false);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current++;
        if (dragCounter.current === 1) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDragging(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;
        addToast('info', `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`);
        setIsTyping(true);
        try {
            for (const file of files) {
                await validateAndProcessFile(file, true);
            }
        } finally {
            setIsTyping(false);
        }
    };

    // M-04: Suggestion cards auto-send
    const handleSuggestionClick = (text: string) => {
        setInput(text);
        sendMessage(text);
    };

    return (
        <div
            className="flex-1 flex bg-black/20"
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Sidebar currentView={currentView} onChangeView={setCurrentView} onOpenSettings={() => setIsSettingsOpen(true)} />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_EXTENSIONS.join(',')}
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Chat view is always mounted to preserve state during generation */}
                <div className={`absolute inset-0 flex flex-col ${currentView === 'chat' ? '' : 'invisible pointer-events-none'}`}>
                            <>
                                {/* Drag Overlay */}
                                <AnimatePresence>
                                    {isDragging && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-50 bg-accent/20 backdrop-blur-md border-4 border-dashed border-accent/40 flex flex-col items-center justify-center rounded-2xl m-6"
                                        >
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="w-24 h-24 bg-accent/30 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-accent/40 text-accent"
                                            >
                                                <UploadCloud size={48} />
                                            </motion.div>
                                            <p className="text-2xl font-bold text-white drop-shadow-lg">Feed the ZeroClaw Engine</p>
                                            <p className="text-zinc-400 mt-2 text-sm font-medium tracking-wide uppercase">Drop documents to process & memorize</p>
                                            <p className="text-zinc-600 mt-4 text-xs">{SUPPORTED_EXTENSIONS.join(' ')}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
                                            {!isConfigured && selectedProvider !== 'ollama' && (
                                                <button
                                                    onClick={() => setCurrentView('providers')}
                                                    className="w-full max-w-2xl mx-4 px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 hover:bg-amber-500/15 transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                                        <Bot size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-semibold text-amber-300">No API Key configured</p>
                                                        <p className="text-xs text-amber-400/60 mt-0.5">Click here to set up a provider in the Providers page, or use Ollama for local models.</p>
                                                    </div>
                                                </button>
                                            )}
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center mb-4 shadow-lg shadow-accent/10">
                                                    <Bot size={32} className="text-zinc-400" />
                                                </div>
                                                <h2 className="text-lg font-bold text-zinc-300 mb-1">Welcome to PocketClaw</h2>
                                                <p className="text-zinc-600 text-sm">Your AI desktop assistant. Ask anything or try a suggestion below.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                                                {[
                                                    { id: 'code', text: 'Write a React hook for local storage', icon: '>' },
                                                    { id: 'explain', text: 'Explain RAG in simple terms', icon: '?' },
                                                    { id: 'refactor', text: 'Analyze my workspace for bugs', icon: '#' },
                                                    { id: 'plan', text: 'Draft a product launch plan', icon: '*' },
                                                ].map((suggest) => (
                                                    <button
                                                        key={suggest.id}
                                                        onClick={() => handleSuggestionClick(suggest.text)}
                                                        className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl text-left hover:bg-white/10 hover:border-white/10 transition-all group"
                                                    >
                                                        <span className="text-lg font-mono text-accent/50 group-hover:text-accent transition-colors w-6 text-center">{suggest.icon}</span>
                                                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors line-clamp-1">{suggest.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-5 ${
                                                    msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-accent to-accent/80 text-white rounded-tr-sm shadow-lg shadow-accent/10'
                                                        : msg.isError
                                                          ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
                                                          : 'bg-secondary/40 backdrop-blur-md border border-white/5 text-zinc-200 rounded-tl-sm shadow-xl'
                                                }`}
                                            >
                                                {msg.role === 'assistant' && (
                                                    <div className="flex items-center gap-2 mb-3 text-accent">
                                                        <Bot size={16} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                                            {msg.isError ? 'Error' : 'ZeroClaw Assistant'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-accent/30">
                                                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                                                </div>

                                                {msg.tools && msg.tools.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {msg.tools.map((tool, ti) => (
                                                            <div key={ti} className="bg-black/30 rounded-2xl p-4 border border-white/5 text-[10px] shadow-inner">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className={`w-2 h-2 rounded-full ${
                                                                                tool.status === 'running'
                                                                                    ? 'bg-blue-400 animate-pulse ring-4 ring-blue-400/20'
                                                                                    : tool.status === 'success'
                                                                                      ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                                                                                      : 'bg-red-400 ring-4 ring-red-400/20'
                                                                            }`}
                                                                        />
                                                                        <span className="font-mono text-accent font-bold uppercase tracking-tight">{tool.name}</span>
                                                                    </div>
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                                            tool.status === 'running'
                                                                                ? 'bg-blue-400/10 text-blue-400'
                                                                                : tool.status === 'success'
                                                                                  ? 'bg-emerald-400/10 text-emerald-400'
                                                                                  : 'bg-red-400/10 text-red-500'
                                                                        }`}
                                                                    >
                                                                        {tool.status}
                                                                    </span>
                                                                </div>
                                                                {tool.args && (
                                                                    <div className="text-zinc-500 font-mono text-[9px] mb-2 truncate opacity-50 italic">
                                                                        &gt; {typeof tool.args === 'string' ? tool.args : JSON.stringify(tool.args)}
                                                                    </div>
                                                                )}
                                                                {tool.result && (
                                                                    <div className="text-zinc-300 font-mono text-[9px] bg-black/40 p-3 rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                                                                        {tool.result}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-secondary/30 backdrop-blur-sm border border-white/5 text-zinc-200 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                                                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-accent/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                <span className="text-[10px] font-bold text-zinc-500 ml-2 uppercase tracking-widest">Generating</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={endOfMessagesRef} className="h-4" />
                                </div>

                                {/* Input Area */}
                                <div className="p-6 bg-black/10 backdrop-blur-xl border-t border-white/5">
                                    <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center group">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute left-4 p-2 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-xl hover:scale-110 active:scale-95 border border-white/5"
                                            title="Attach files"
                                        >
                                            <Paperclip size={18} />
                                        </button>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            disabled={isTyping}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (input.trim() && !isTyping) handleSend();
                                                }
                                            }}
                                            placeholder={isTyping ? 'Engine is processing...' : 'Ask ZeroClaw anything or drop files here...'}
                                            className="w-full bg-secondary/30 border border-white/10 rounded-2xl py-4 pl-14 pr-28 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all placeholder:text-zinc-600"
                                        />
                                        <div className="absolute right-2 flex items-center gap-2">
                                            {/* M-02: Clear chat button */}
                                            {messages.length > 0 && !isTyping && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearChat}
                                                    className="p-2.5 text-zinc-500 hover:text-zinc-300 transition-colors hover:bg-white/5 rounded-xl"
                                                    title="Clear chat (Ctrl+L)"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            {isTyping && (
                                                <button
                                                    type="button"
                                                    onClick={handleAbort}
                                                    disabled={isAborting}
                                                    className="p-2.5 text-red-400 hover:text-red-500 transition-colors bg-red-400/10 rounded-xl border border-red-500/20 disabled:opacity-50"
                                                    title="Stop generation"
                                                >
                                                    <Square size={14} fill="currentColor" />
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || isTyping}
                                                className="bg-white text-black p-2.5 rounded-xl hover:bg-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-white/10 active:scale-95"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </form>
                                    <div className="text-center mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-700 select-none">
                                        Enter to send &middot; Ctrl+L to clear &middot; Drag files to ingest
                                    </div>
                                </div>
                            </>
                </div>

                {/* Other views rendered with AnimatePresence */}
                {currentView !== 'chat' && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.01 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {currentView === 'providers' && <ProvidersView />}
                            {currentView === 'channels' && <ChannelsView />}
                            {currentView === 'tools' && <ToolsView />}
                            {currentView === 'status' && <StatusView />}
                            {currentView === 'workspace' && <WorkspaceView />}
                            {currentView === 'memory' && <MemoryView />}
                            {currentView === 'profile' && <ProfileView onNavigate={(v) => setCurrentView(v as ViewType)} />}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Global Authorization Modal */}
            <AnimatePresence>
                {pendingAuth && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md modal-panel"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                                        <Bot size={20} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Tool Authorization</h3>
                                        <p className="text-xs text-zinc-400">ZeroClaw requests permission to execute a tool</p>
                                    </div>
                                </div>

                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tool Name</span>
                                        <span className="text-[10px] font-mono text-accent">{pendingAuth.tool}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payload</span>
                                        <pre className="text-[11px] font-mono text-zinc-300 bg-white/5 p-2 rounded-lg overflow-x-auto max-h-40">
                                            {JSON.stringify(pendingAuth.arguments, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAuthorize(false)}
                                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/5"
                                    >
                                        Deny
                                    </button>
                                    <button
                                        onClick={() => handleAuthorize(true)}
                                        className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
