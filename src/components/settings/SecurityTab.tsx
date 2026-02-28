import { Toggle, NumberField, TextField, SelectField, TagsField, CollapsibleSection } from './shared';
import type { TabProps } from './types';

export default function SecurityTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-4">
            <Toggle label="Sandbox Enabled" value={settings.security.sandbox_enabled} onChange={(v) => updateSettings('security', 'sandbox_enabled', v)} />
            {settings.security.sandbox_enabled && (
                <SelectField
                    label="Sandbox Backend"
                    value={settings.security.sandbox_backend}
                    onChange={(v) => updateSettings('security', 'sandbox_backend', v)}
                    options={[
                        { value: 'Auto', label: 'Auto-detect' },
                        { value: 'Docker', label: 'Docker' },
                        { value: 'Firejail', label: 'Firejail' },
                        { value: 'Bubblewrap', label: 'Bubblewrap' },
                        { value: 'Landlock', label: 'Landlock' },
                        { value: 'None', label: 'None' },
                    ]}
                />
            )}
            <Toggle label="Audit Logging" value={settings.security.audit_enabled} onChange={(v) => updateSettings('security', 'audit_enabled', v)} />
            {settings.security.audit_enabled && (
                <TextField label="Audit Log Path" value={settings.security.audit_log_path} onChange={(v) => updateSettings('security', 'audit_log_path', v)} placeholder="audit.log" />
            )}
            <Toggle label="Emergency Stop (E-Stop)" value={settings.security.estop_enabled} onChange={(v) => updateSettings('security', 'estop_enabled', v)} />
            <NumberField label="Max Memory (MB)" value={settings.security.max_memory_mb} onChange={(v) => updateSettings('security', 'max_memory_mb', v)} min={128} max={8192} />
            <NumberField label="Max CPU Time (seconds)" value={settings.security.max_cpu_time_seconds} onChange={(v) => updateSettings('security', 'max_cpu_time_seconds', v)} min={10} max={3600} />

            <CollapsibleSection title="Advanced">
                <NumberField label="Max Subprocesses" value={settings.security.max_subprocesses} onChange={(v) => updateSettings('security', 'max_subprocesses', v)} min={1} max={100} />
                <Toggle label="Memory Monitoring" value={settings.security.memory_monitoring} onChange={(v) => updateSettings('security', 'memory_monitoring', v)} />
                <NumberField label="Audit Max Size (MB)" value={settings.security.audit_max_size_mb} onChange={(v) => updateSettings('security', 'audit_max_size_mb', v)} min={1} max={1024} />
                <Toggle label="Audit Sign Events" value={settings.security.audit_sign_events} onChange={(v) => updateSettings('security', 'audit_sign_events', v)} />
                <TextField label="E-Stop State File" value={settings.security.estop_state_file} onChange={(v) => updateSettings('security', 'estop_state_file', v)} placeholder="estop.state" />
                <Toggle label="E-Stop Require OTP to Resume" value={settings.security.estop_require_otp_to_resume} onChange={(v) => updateSettings('security', 'estop_require_otp_to_resume', v)} />
                <Toggle label="OTP Enabled" value={settings.security.otp_enabled} onChange={(v) => updateSettings('security', 'otp_enabled', v)} />
                {settings.security.otp_enabled && (
                    <>
                        <SelectField
                            label="OTP Method"
                            value={settings.security.otp_method}
                            onChange={(v) => updateSettings('security', 'otp_method', v)}
                            options={[
                                { value: 'totp', label: 'TOTP (Time-Based)' },
                                { value: 'hotp', label: 'HOTP (Counter-Based)' },
                            ]}
                        />
                        <NumberField label="OTP Token TTL (seconds)" value={settings.security.otp_token_ttl_secs} onChange={(v) => updateSettings('security', 'otp_token_ttl_secs', v)} min={10} max={600} />
                        <TagsField label="OTP Gated Actions" value={settings.security.otp_gated_actions} onChange={(v) => updateSettings('security', 'otp_gated_actions', v)} placeholder="e.g. config_save, shell_exec" />
                        <TagsField label="OTP Gated Domains" value={settings.security.otp_gated_domains} onChange={(v) => updateSettings('security', 'otp_gated_domains', v)} placeholder="e.g. production.api.com" />
                    </>
                )}
            </CollapsibleSection>
        </div>
    );
}
