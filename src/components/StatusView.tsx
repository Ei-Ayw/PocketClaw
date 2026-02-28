import { Activity, Cpu, Database, Network, Clock, HardDrive, Puzzle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

type SystemMetrics = {
    memory_used_mb: number;
    memory_total_mb: number;
    cpu_usage: number;
    uptime_seconds: number;
    knowledge_units: number;
    active_skills: number;
    gateway_status: string;
};

type LogEntry = {
    timestamp: string;
    level: string;
    message: string;
};

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export default function StatusView() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const result = await invoke<SystemMetrics>('get_system_metrics');
            setMetrics(result);
        } catch {
            // Silently fail — metrics may not be available yet
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const result = await invoke<LogEntry[]>('get_logs');
            setLogs(result);
        } catch {
            // Silently fail
        }
    };

    // Poll metrics every 3 seconds
    useEffect(() => {
        fetchMetrics();
        fetchLogs();
        const interval = setInterval(() => {
            fetchMetrics();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Listen for real-time logs
    useEffect(() => {
        let unlisten: (() => void) | undefined;
        listen<LogEntry>('zeroclaw-log', (event) => {
            setLogs((prev) => {
                const next = [...prev, event.payload];
                return next.length > 200 ? next.slice(-200) : next;
            });
        }).then((fn) => { unlisten = fn; });
        return () => { if (unlisten) unlisten(); };
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const memPercent = metrics ? Math.round((metrics.memory_used_mb / metrics.memory_total_mb) * 100) : 0;

    const metricCards = [
        {
            icon: Cpu,
            label: 'Memory Usage',
            value: metrics ? `${Math.round(metrics.memory_used_mb)}` : '--',
            unit: metrics ? `/ ${Math.round(metrics.memory_total_mb)} MB` : 'MB',
            sub: metrics ? `${memPercent}%` : null,
            color: memPercent > 80 ? 'text-red-400' : memPercent > 50 ? 'text-amber-400' : 'text-emerald-400',
        },
        {
            icon: Clock,
            label: 'Session Uptime',
            value: metrics ? formatUptime(metrics.uptime_seconds) : '--:--:--',
            unit: '',
            sub: null,
            color: 'text-white',
        },
        {
            icon: Database,
            label: 'Knowledge Ingested',
            value: metrics ? `${metrics.knowledge_units}` : '--',
            unit: 'Units',
            sub: null,
            color: 'text-accent',
        },
        {
            icon: Puzzle,
            label: 'Active Skills',
            value: metrics ? `${metrics.active_skills}` : '--',
            unit: 'Loaded',
            sub: null,
            color: 'text-accent',
        },
        {
            icon: HardDrive,
            label: 'CPU Usage',
            value: metrics ? `${metrics.cpu_usage.toFixed(1)}` : '--',
            unit: '%',
            sub: null,
            color: metrics && metrics.cpu_usage > 80 ? 'text-red-400' : 'text-emerald-400',
        },
        {
            icon: Network,
            label: 'Gateway',
            value: metrics?.gateway_status || '--',
            unit: '',
            sub: null,
            color: metrics?.gateway_status === 'Online' ? 'text-emerald-400' : 'text-zinc-500',
        },
    ];

    return (
        <div className="flex-1 flex flex-col bg-black/10 overflow-hidden text-white">
            <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Activity className="text-accent" />
                        Supervisor Status
                    </h1>
                    <p className="text-zinc-400 text-sm">Real-time ZeroClaw engine metrics and event logs.</p>
                </div>
                <button
                    onClick={() => { fetchMetrics(); fetchLogs(); }}
                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {metricCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 border border-white/5 bg-secondary/30 rounded-2xl shadow-xl"
                            >
                                <div className="flex items-center gap-2 text-zinc-400 mb-3">
                                    <Icon size={14} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest truncate">{card.label}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</span>
                                    {card.unit && <span className="text-xs text-zinc-600">{card.unit}</span>}
                                </div>
                                {card.sub && <span className="text-[10px] text-zinc-500 font-mono mt-1">{card.sub}</span>}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Logs terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="border border-white/5 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[400px] shadow-2xl"
                >
                    <div className="bg-white/5 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-zinc-500 flex items-center justify-between uppercase tracking-[0.2em]">
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/30 ring-1 ring-red-400/20"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/30 ring-1 ring-yellow-400/20"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400/30 ring-1 ring-green-400/20"></div>
                        </div>
                        <span className="font-mono">zeroclaw-supervisor.log &middot; {logs.length} entries</span>
                    </div>
                    <div className="p-6 font-mono text-xs text-zinc-400 space-y-1 overflow-y-auto flex-1">
                        {logs.length === 0 && (
                            <div className="text-zinc-700 italic">No log entries yet. Send a message to start generating logs.</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4">
                                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                                <span className={
                                    log.level === 'error' ? 'text-red-400' :
                                    log.level === 'warn' || log.level === 'warning' ? 'text-amber-500' :
                                    log.level === 'debug' ? 'text-blue-400' :
                                    log.level === 'success' ? 'text-emerald-400' :
                                    'text-emerald-400/80'
                                }>
                                    [{log.level.toUpperCase()}]
                                </span>
                                <span className="break-all">{log.message}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
