import { Bot, MessageSquare, Box, RadioReceiver, Wrench, Activity, Folder, Brain, Settings, User } from 'lucide-react';
import { useAppStore } from '../store';

export type ViewType = 'chat' | 'providers' | 'channels' | 'tools' | 'status' | 'workspace' | 'memory' | 'profile';

interface SidebarProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
    onOpenSettings: () => void;
}

export default function Sidebar({ currentView, onChangeView, onOpenSettings }: SidebarProps) {
    const engineOnline = useAppStore((state) => state.engineOnline);

    const navItems: { id: ViewType; label: string; icon: React.FC<any> }[] = [
        { id: 'chat', label: 'Agent Chat', icon: MessageSquare },
        { id: 'workspace', label: 'Workspace', icon: Folder },
        { id: 'memory', label: 'Brain Memory', icon: Brain },
        { id: 'providers', label: 'Providers', icon: Box },
        { id: 'channels', label: 'Channels', icon: RadioReceiver },
        { id: 'tools', label: 'Tools Sandbox', icon: Wrench },
        { id: 'status', label: 'Supervisor', icon: Activity },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="w-64 border-r border-white/5 bg-secondary/30 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/20">
                    <Bot size={18} className="text-white" />
                </div>
                <div className="font-bold tracking-wide text-zinc-200">ZeroClaw</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs text-zinc-500 font-medium mb-4 px-2 tracking-wider">WORKSPACE</div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-accent' : 'text-zinc-500'} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                        title="Engine Configuration"
                    >
                        <Settings size={16} />
                    </button>
                    <span className="text-xs text-zinc-500">v0.1.0-alpha</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className={`w-2 h-2 rounded-full ${engineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                    <span>{engineOnline ? 'Engine Online' : 'Engine Idle'}</span>
                </div>
            </div>
        </div>
    );
}
