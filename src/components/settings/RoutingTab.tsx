import { Plus, X } from 'lucide-react';
import { Toggle, NumberField, TextField } from './shared';
import type { TabProps, EngineSettingsModelRoute, EngineSettingsEmbeddingRoute } from './types';

export default function RoutingTab({ settings, updateSettings }: TabProps) {
    const addModelRoute = () => {
        const routes = [...settings.model_routes, { hint: '', provider: '', model: '', api_key: '' }];
        updateSettings('model_routes' as any, '', routes);
    };
    const removeModelRoute = (i: number) => {
        const routes = settings.model_routes.filter((_, j) => j !== i);
        updateSettings('model_routes' as any, '', routes);
    };
    const updateModelRoute = (i: number, field: keyof EngineSettingsModelRoute, value: any) => {
        const routes = [...settings.model_routes];
        routes[i] = { ...routes[i], [field]: value };
        updateSettings('model_routes' as any, '', routes);
    };

    const addEmbeddingRoute = () => {
        const routes = [...settings.embedding_routes, { hint: '', provider: '', model: '', dimensions: 1536 }];
        updateSettings('embedding_routes' as any, '', routes);
    };
    const removeEmbeddingRoute = (i: number) => {
        const routes = settings.embedding_routes.filter((_, j) => j !== i);
        updateSettings('embedding_routes' as any, '', routes);
    };
    const updateEmbeddingRoute = (i: number, field: keyof EngineSettingsEmbeddingRoute, value: any) => {
        const routes = [...settings.embedding_routes];
        routes[i] = { ...routes[i], [field]: value };
        updateSettings('embedding_routes' as any, '', routes);
    };

    return (
        <div className="space-y-6">
            {/* Model Routes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Model Routes</h3>
                    <button onClick={addModelRoute} className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors">
                        <Plus size={12} /> Add Route
                    </button>
                </div>
                {settings.model_routes.length === 0 && (
                    <p className="text-xs text-zinc-600 italic">No model routes configured. Default provider will be used.</p>
                )}
                {settings.model_routes.map((route, i) => (
                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Route #{i + 1}</span>
                            <button onClick={() => removeModelRoute(i)} className="text-zinc-500 hover:text-red-400"><X size={12} /></button>
                        </div>
                        <TextField label="Hint (keyword)" value={route.hint} onChange={(v) => updateModelRoute(i, 'hint', v)} placeholder="e.g. code, creative, fast" />
                        <TextField label="Provider" value={route.provider} onChange={(v) => updateModelRoute(i, 'provider', v)} placeholder="e.g. anthropic, openai" />
                        <TextField label="Model" value={route.model} onChange={(v) => updateModelRoute(i, 'model', v)} placeholder="e.g. claude-sonnet-4-6" />
                    </div>
                ))}
            </div>

            <div className="border-t border-white/5" />

            {/* Embedding Routes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Embedding Routes</h3>
                    <button onClick={addEmbeddingRoute} className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors">
                        <Plus size={12} /> Add Route
                    </button>
                </div>
                {settings.embedding_routes.length === 0 && (
                    <p className="text-xs text-zinc-600 italic">No embedding routes configured. Default embedding model will be used.</p>
                )}
                {settings.embedding_routes.map((route, i) => (
                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Embedding #{i + 1}</span>
                            <button onClick={() => removeEmbeddingRoute(i)} className="text-zinc-500 hover:text-red-400"><X size={12} /></button>
                        </div>
                        <TextField label="Hint" value={route.hint} onChange={(v) => updateEmbeddingRoute(i, 'hint', v)} placeholder="e.g. code, text" />
                        <TextField label="Provider" value={route.provider} onChange={(v) => updateEmbeddingRoute(i, 'provider', v)} placeholder="e.g. openai" />
                        <TextField label="Model" value={route.model} onChange={(v) => updateEmbeddingRoute(i, 'model', v)} placeholder="text-embedding-3-small" />
                        <NumberField label="Dimensions" value={route.dimensions} onChange={(v) => updateEmbeddingRoute(i, 'dimensions', v)} min={64} max={4096} />
                    </div>
                ))}
            </div>

            <div className="border-t border-white/5" />

            {/* Query Classification */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Query Classification</h3>
                <Toggle label="Enabled" value={settings.query_classification.enabled} onChange={(v) => updateSettings('query_classification', 'enabled', v)} />
                <p className="text-[10px] text-zinc-600">Automatically classifies incoming queries to route them to the most appropriate model.</p>
            </div>
        </div>
    );
}
