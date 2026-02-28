import { Toggle, NumberField, TextField, SelectField, SliderField, CollapsibleSection } from './shared';
import type { TabProps } from './types';

export default function MemoryTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-4">
            <SelectField
                label="Memory Backend"
                value={settings.memory.backend}
                onChange={(v) => updateSettings('memory', 'backend', v)}
                options={[
                    { value: 'sqlite', label: 'SQLite (Default)' },
                    { value: 'markdown', label: 'Markdown Files' },
                    { value: 'postgres', label: 'PostgreSQL' },
                    { value: 'none', label: 'Disabled' },
                ]}
            />
            <Toggle label="Auto Save" value={settings.memory.auto_save} onChange={(v) => updateSettings('memory', 'auto_save', v)} />
            <Toggle label="Memory Hygiene" value={settings.memory.hygiene_enabled} onChange={(v) => updateSettings('memory', 'hygiene_enabled', v)} />
            <Toggle label="Response Cache" value={settings.memory.response_cache_enabled} onChange={(v) => updateSettings('memory', 'response_cache_enabled', v)} />
            <Toggle label="Memory Snapshots" value={settings.memory.snapshot_enabled} onChange={(v) => updateSettings('memory', 'snapshot_enabled', v)} />
            <NumberField label="Archive After (days)" value={settings.memory.archive_after_days} onChange={(v) => updateSettings('memory', 'archive_after_days', v)} min={1} max={365} />
            <NumberField label="Purge After (days)" value={settings.memory.purge_after_days} onChange={(v) => updateSettings('memory', 'purge_after_days', v)} min={7} max={3650} />
            <TextField label="Embedding Provider" value={settings.memory.embedding_provider} onChange={(v) => updateSettings('memory', 'embedding_provider', v)} placeholder="none | openai | custom:URL" />
            <TextField label="Embedding Model" value={settings.memory.embedding_model} onChange={(v) => updateSettings('memory', 'embedding_model', v)} placeholder="text-embedding-3-small" />

            <CollapsibleSection title="Advanced">
                <NumberField label="Conversation Retention (days)" value={settings.memory.conversation_retention_days} onChange={(v) => updateSettings('memory', 'conversation_retention_days', v)} min={1} max={3650} />
                <NumberField label="Embedding Dimensions" value={settings.memory.embedding_dimensions} onChange={(v) => updateSettings('memory', 'embedding_dimensions', v)} min={64} max={4096} />
                <SliderField label="Vector Weight" value={settings.memory.vector_weight} onChange={(v) => updateSettings('memory', 'vector_weight', v)} min={0} max={1} step={0.05} />
                <SliderField label="Keyword Weight" value={settings.memory.keyword_weight} onChange={(v) => updateSettings('memory', 'keyword_weight', v)} min={0} max={1} step={0.05} />
                <SliderField label="Min Relevance Score" value={settings.memory.min_relevance_score} onChange={(v) => updateSettings('memory', 'min_relevance_score', v)} min={0} max={1} step={0.05} />
                <NumberField label="Embedding Cache Size" value={settings.memory.embedding_cache_size} onChange={(v) => updateSettings('memory', 'embedding_cache_size', v)} min={0} max={100000} />
                <NumberField label="Chunk Max Tokens" value={settings.memory.chunk_max_tokens} onChange={(v) => updateSettings('memory', 'chunk_max_tokens', v)} min={64} max={8192} />
                <NumberField label="Response Cache TTL (min)" value={settings.memory.response_cache_ttl_minutes} onChange={(v) => updateSettings('memory', 'response_cache_ttl_minutes', v)} min={1} max={10080} />
                <NumberField label="Response Cache Max Entries" value={settings.memory.response_cache_max_entries} onChange={(v) => updateSettings('memory', 'response_cache_max_entries', v)} min={10} max={100000} />
                <Toggle label="Snapshot on Hygiene" value={settings.memory.snapshot_on_hygiene} onChange={(v) => updateSettings('memory', 'snapshot_on_hygiene', v)} />
                <Toggle label="Auto Hydrate" value={settings.memory.auto_hydrate} onChange={(v) => updateSettings('memory', 'auto_hydrate', v)} />
            </CollapsibleSection>
        </div>
    );
}
