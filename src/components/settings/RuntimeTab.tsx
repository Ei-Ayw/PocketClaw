import { Toggle, NumberField, TextField, SelectField, SliderField } from './shared';
import type { TabProps } from './types';

export default function RuntimeTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-6">
            {/* Runtime */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Runtime</h3>
                <SelectField
                    label="Runtime Kind"
                    value={settings.runtime.kind}
                    onChange={(v) => updateSettings('runtime', 'kind', v)}
                    options={[
                        { value: 'native', label: 'Native (Default)' },
                        { value: 'docker', label: 'Docker Container' },
                    ]}
                />
                {settings.runtime.kind === 'docker' && (
                    <>
                        <TextField label="Docker Image" value={settings.runtime.docker_image} onChange={(v) => updateSettings('runtime', 'docker_image', v)} placeholder="zeroclaw/runtime:latest" />
                        <TextField label="Docker Network" value={settings.runtime.docker_network} onChange={(v) => updateSettings('runtime', 'docker_network', v)} placeholder="bridge" />
                        <NumberField label="Memory Limit (MB)" value={settings.runtime.docker_memory_mb} onChange={(v) => updateSettings('runtime', 'docker_memory_mb', v)} min={128} max={16384} />
                        <SliderField label="CPU Limit" value={settings.runtime.docker_cpu_limit} onChange={(v) => updateSettings('runtime', 'docker_cpu_limit', v)} min={0.1} max={16} step={0.1} />
                        <Toggle label="Read-Only Filesystem" value={settings.runtime.docker_readonly_fs} onChange={(v) => updateSettings('runtime', 'docker_readonly_fs', v)} />
                        <TextField label="Workspace Mount" value={settings.runtime.docker_workspace_mount} onChange={(v) => updateSettings('runtime', 'docker_workspace_mount', v)} placeholder="/workspace" />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Scheduler */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Scheduler</h3>
                <Toggle label="Enabled" value={settings.scheduler.enabled} onChange={(v) => updateSettings('scheduler', 'enabled', v)} />
                {settings.scheduler.enabled && (
                    <>
                        <NumberField label="Max Tasks" value={settings.scheduler.max_tasks} onChange={(v) => updateSettings('scheduler', 'max_tasks', v)} min={1} max={100} />
                        <NumberField label="Max Concurrent" value={settings.scheduler.max_concurrent} onChange={(v) => updateSettings('scheduler', 'max_concurrent', v)} min={1} max={20} />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Heartbeat */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Heartbeat</h3>
                <Toggle label="Enabled" value={settings.heartbeat.enabled} onChange={(v) => updateSettings('heartbeat', 'enabled', v)} />
                {settings.heartbeat.enabled && (
                    <NumberField label="Interval (seconds)" value={settings.heartbeat.interval_secs} onChange={(v) => updateSettings('heartbeat', 'interval_secs', v)} min={5} max={600} />
                )}
            </div>
        </div>
    );
}
