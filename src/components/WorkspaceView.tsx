import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { File, Folder, HardDrive, RefreshCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

type FileInfo = {
    name: string;
    is_dir: boolean;
    size: number;
};

export default function WorkspaceView() {
    const addToast = useAppStore((state) => state.addToast);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const refreshFiles = async () => {
        setLoading(true);
        try {
            const result = await invoke<FileInfo[]>('list_workspace_files');
            setFiles(result);
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (name: string) => {
        try {
            await invoke('delete_file', { name });
            addToast('success', `${name} deleted.`);
            setConfirmDelete(null);
            refreshFiles();
        } catch (err) {
            addToast('error', `Delete failed: ${String(err)}`);
        }
    };

    useEffect(() => {
        refreshFiles();
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex-1 flex flex-col p-8 overflow-hidden bg-black/20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <HardDrive className="text-accent" /> Workspace Explorer
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Direct access to ZeroClaw's local sandbox environment.</p>
                </div>
                <button onClick={refreshFiles} disabled={loading} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-6 text-sm">{error}</div>
            )}

            <div className="flex-1 overflow-y-auto bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right pr-20">Size</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {files.length === 0 && !loading && (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <HardDrive size={48} className="mb-4" />
                                            <p className="italic text-sm">Workspace is empty. Drop files in chat to see them here.</p>
                                        </div>
                                    </td>
                                </motion.tr>
                            )}
                            {files.map((file, idx) => (
                                <motion.tr layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ delay: idx * 0.02 }} key={file.name} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {file.is_dir ? <Folder size={16} className="text-amber-500" /> : <File size={16} className="text-accent" />}
                                            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate max-w-md">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-500 uppercase tracking-tighter">{file.is_dir ? 'Directory' : 'File'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500 font-mono text-right pr-20">{file.is_dir ? '--' : formatSize(file.size)}</td>
                                    <td className="px-6 py-4 text-right">
                                        {confirmDelete === file.name ? (
                                            <div className="flex items-center gap-2 justify-end">
                                                <button onClick={() => handleDelete(file.name)} className="text-[10px] font-bold text-red-400 hover:underline">Delete</button>
                                                <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold text-zinc-500 hover:underline">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDelete(file.name)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
