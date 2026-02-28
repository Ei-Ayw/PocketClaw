import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface AppState {
    // Auth
    apiKey: string | null;
    selectedProvider: string;
    selectedModel: string;
    availableProviders: { id: string; name: string; needsKey: boolean }[];
    setApiKey: (key: string) => void;
    setSelectedProvider: (provider: string) => void;
    setSelectedModel: (model: string) => void;
    isConfigured: boolean;

    // Hydration from Rust backend on startup
    hydrateFromBackend: (config: { isConfigured: boolean; providerId?: string; model?: string }) => void;

    // Engine status
    engineOnline: boolean;
    setEngineOnline: (online: boolean) => void;

    // Toasts
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

let toastCounter = 0;
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useAppStore = create<AppState>((set, get) => ({
    apiKey: null,
    selectedProvider: 'openai',
    selectedModel: 'gpt-4o',
    availableProviders: [
        { id: 'openai', name: 'OpenAI', needsKey: true },
        { id: 'anthropic', name: 'Anthropic', needsKey: true },
        { id: 'ollama', name: 'Ollama (Local)', needsKey: false },
        { id: 'groq', name: 'Groq', needsKey: true },
        { id: 'custom', name: 'Custom OpenAI-Compatible', needsKey: true },
    ],
    setApiKey: (key) => set({ apiKey: key, isConfigured: true }),
    setSelectedProvider: (provider) => set({ selectedProvider: provider }),
    setSelectedModel: (model) => set({ selectedModel: model }),
    isConfigured: false,

    hydrateFromBackend: (config) => set({
        isConfigured: config.isConfigured,
        ...(config.providerId ? { selectedProvider: config.providerId } : {}),
        ...(config.model ? { selectedModel: config.model } : {}),
        ...(config.isConfigured ? { apiKey: '***' } : {}),
    }),

    engineOnline: false,
    setEngineOnline: (online) => set({ engineOnline: online }),

    toasts: [],
    addToast: (type, message, duration = 4000) => {
        // Deduplicate: skip if same message is already showing
        if (get().toasts.some((t) => t.message === message && t.type === type)) return;

        const id = `toast-${++toastCounter}`;
        set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));
        if (duration > 0) {
            const timer = setTimeout(() => {
                toastTimers.delete(id);
                set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
            }, duration);
            toastTimers.set(id, timer);
        }
    },
    removeToast: (id) => {
        const timer = toastTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            toastTimers.delete(id);
        }
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));
