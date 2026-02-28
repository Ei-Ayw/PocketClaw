import { Toggle, NumberField, TextField, SelectField } from './shared';
import type { TabProps } from './types';

export default function IntegrationsTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-6">
            {/* Multimodal */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Multimodal (Images)</h3>
                <Toggle label="Enabled" value={settings.multimodal.enabled} onChange={(v) => updateSettings('multimodal', 'enabled', v)} />
                {settings.multimodal.enabled && (
                    <>
                        <NumberField label="Max Images per Message" value={settings.multimodal.max_images} onChange={(v) => updateSettings('multimodal', 'max_images', v)} min={1} max={20} />
                        <NumberField label="Max Image Size (MB)" value={settings.multimodal.max_image_size_mb} onChange={(v) => updateSettings('multimodal', 'max_image_size_mb', v)} min={1} max={50} />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Transcription */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Transcription (Voice)</h3>
                <Toggle label="Enabled" value={settings.transcription.enabled} onChange={(v) => updateSettings('transcription', 'enabled', v)} />
                {settings.transcription.enabled && (
                    <>
                        <SelectField
                            label="Provider"
                            value={settings.transcription.provider}
                            onChange={(v) => updateSettings('transcription', 'provider', v)}
                            options={[
                                { value: 'groq', label: 'Groq Whisper' },
                                { value: 'openai', label: 'OpenAI Whisper' },
                            ]}
                        />
                        <TextField label="Model" value={settings.transcription.model} onChange={(v) => updateSettings('transcription', 'model', v)} placeholder="whisper-large-v3" />
                        <TextField label="Language" value={settings.transcription.language} onChange={(v) => updateSettings('transcription', 'language', v)} placeholder="en" />
                        <NumberField label="Max Duration (seconds)" value={settings.transcription.max_duration_secs} onChange={(v) => updateSettings('transcription', 'max_duration_secs', v)} min={10} max={600} />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Hardware */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hardware</h3>
                <Toggle label="Enabled" value={settings.hardware.enabled} onChange={(v) => updateSettings('hardware', 'enabled', v)} />
                {settings.hardware.enabled && (
                    <>
                        <SelectField
                            label="Transport"
                            value={settings.hardware.transport}
                            onChange={(v) => updateSettings('hardware', 'transport', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'native', label: 'Native' },
                                { value: 'serial', label: 'Serial' },
                                { value: 'probe', label: 'Debug Probe' },
                            ]}
                        />
                        {settings.hardware.transport === 'serial' && (
                            <>
                                <TextField label="Serial Port" value={settings.hardware.serial_port} onChange={(v) => updateSettings('hardware', 'serial_port', v)} placeholder="/dev/ttyUSB0" />
                                <NumberField label="Baud Rate" value={settings.hardware.baud_rate} onChange={(v) => updateSettings('hardware', 'baud_rate', v)} min={9600} max={921600} />
                            </>
                        )}
                        {settings.hardware.transport === 'probe' && (
                            <TextField label="Probe Target" value={settings.hardware.probe_target} onChange={(v) => updateSettings('hardware', 'probe_target', v)} placeholder="STM32F411CEUx" />
                        )}
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Hooks */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Hooks</h3>
                <Toggle label="Enabled" value={settings.hooks.enabled} onChange={(v) => updateSettings('hooks', 'enabled', v)} />
                {settings.hooks.enabled && (
                    <Toggle label="Command Logger" value={settings.hooks.command_logger} onChange={(v) => updateSettings('hooks', 'command_logger', v)} />
                )}
            </div>
        </div>
    );
}
