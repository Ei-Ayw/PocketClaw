import { AlertTriangle } from 'lucide-react';
import { Toggle, NumberField, SelectField, TagsField, CollapsibleSection } from './shared';
import type { TabProps } from './types';

export default function AutonomyTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-4">
            <SelectField
                label="Autonomy Level"
                value={settings.autonomy.level}
                onChange={(v) => updateSettings('autonomy', 'level', v)}
                options={[
                    { value: 'ReadOnly', label: 'Read Only — Observe but not act' },
                    { value: 'Supervised', label: 'Supervised — Requires approval for risky ops' },
                    { value: 'Full', label: 'Full — Autonomous execution within policy' },
                ]}
            />
            {settings.autonomy.level === 'Full' && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300">Full autonomy allows the agent to execute commands without asking for permission.</span>
                </div>
            )}
            <Toggle label="Workspace Only" value={settings.autonomy.workspace_only} onChange={(v) => updateSettings('autonomy', 'workspace_only', v)} />
            <NumberField label="Max Actions per Hour" value={settings.autonomy.max_actions_per_hour} onChange={(v) => updateSettings('autonomy', 'max_actions_per_hour', v)} min={1} max={1000} />
            <TagsField label="Allowed Commands" value={settings.autonomy.allowed_commands} onChange={(v) => updateSettings('autonomy', 'allowed_commands', v)} placeholder="e.g. ls, cat, git" />
            <TagsField label="Forbidden Paths" value={settings.autonomy.forbidden_paths} onChange={(v) => updateSettings('autonomy', 'forbidden_paths', v)} placeholder="e.g. /etc, ~/.ssh" />
            <TagsField label="Auto-Approve Tools" value={settings.autonomy.auto_approve} onChange={(v) => updateSettings('autonomy', 'auto_approve', v)} placeholder="e.g. file_read, web_search" />

            <CollapsibleSection title="Advanced">
                <NumberField label="Max Cost per Day (cents)" value={settings.autonomy.max_cost_per_day_cents} onChange={(v) => updateSettings('autonomy', 'max_cost_per_day_cents', v)} min={0} max={100000} />
                <Toggle label="Require Approval for Medium Risk" value={settings.autonomy.require_approval_for_medium_risk} onChange={(v) => updateSettings('autonomy', 'require_approval_for_medium_risk', v)} />
                <Toggle label="Block High Risk Commands" value={settings.autonomy.block_high_risk_commands} onChange={(v) => updateSettings('autonomy', 'block_high_risk_commands', v)} />
                <TagsField label="Shell Env Passthrough" value={settings.autonomy.shell_env_passthrough} onChange={(v) => updateSettings('autonomy', 'shell_env_passthrough', v)} placeholder="e.g. PATH, HOME" />
                <TagsField label="Always Ask (tools)" value={settings.autonomy.always_ask} onChange={(v) => updateSettings('autonomy', 'always_ask', v)} placeholder="e.g. shell, file_write" />
                <TagsField label="Allowed Roots" value={settings.autonomy.allowed_roots} onChange={(v) => updateSettings('autonomy', 'allowed_roots', v)} placeholder="e.g. /home/user/project" />
            </CollapsibleSection>
        </div>
    );
}
