import { Window } from '@tauri-apps/api/window';
import { Minus, Square, Copy, X } from 'lucide-react';

const appWindow = new Window('main');

interface TitlebarProps {
    isMaximized: boolean;
}

export default function Titlebar({ isMaximized }: TitlebarProps) {
    const handleClose = async () => {
        await appWindow.hide();
    };

    return (
        <div
            data-tauri-drag-region
            className="h-10 bg-transparent flex justify-between items-center fixed top-0 left-0 right-0 z-50 select-none text-zinc-400"
        >
            <div data-tauri-drag-region className="flex-1 px-4 flex items-center h-full text-xs font-semibold tracking-wide text-zinc-500">
                PocketClaw
            </div>
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    className="w-12 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    onClick={() => appWindow.minimize()}
                    title="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    className="w-12 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    onClick={() => appWindow.toggleMaximize()}
                    title={isMaximized ? 'Restore' : 'Maximize'}
                >
                    {isMaximized ? <Copy size={13} className="opacity-70" /> : <Square size={14} />}
                </button>
                <button
                    className="w-12 h-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    onClick={handleClose}
                    title="Close to tray"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
