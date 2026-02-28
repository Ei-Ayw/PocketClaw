import { Plus, X } from 'lucide-react';
import { NumberField, Toggle, TextField, SelectField, SliderField, CollapsibleSection } from './shared';
import type { TabProps, EngineSettingsDelegateAgent } from './types';

export default function AgentTab({ settings, updateSettings }: TabProps) {
    const addAgent = () => {
        const agents = [...settings.delegate_agents, { name: '', provider: '', model: '', system_prompt: '', temperature: 0.7, max_depth: 1, agentic: false }];
        updateSettings('delegate_agents' as any, '', agents);
    };
    const removeAgent = (i: number) => {
        const agents = settings.delegate_agents.filter((_, j) => j !== i);
        updateSettings('delegate_agents' as any, '', agents);
    };
    const updateAgent = (i: number, field: keyof EngineSettingsDelegateAgent, value: any) => {
        const agents = [...settings.delegate_agents];
        agents[i] = { ...agents[i], [field]: value };
        updateSettings('delegate_agents' as any, '', agents);
    };

    return (
        <div className="space-y-4">
            <NumberField label="Max Tool Iterations" value={settings.agent.max_tool_iterations} onChange={(v) => updateSettings('agent', 'max_tool_iterations', v)} min={1} max={100} />
            <NumberField label="Max History Messages" value={settings.agent.max_history_messages} onChange={(v) => updateSettings('agent', 'max_history_messages', v)} min={5} max={200} />
            <Toggle label="Parallel Tool Execution" value={settings.agent.parallel_tools} onChange={(v) => updateSettings('agent', 'parallel_tools', v)} />
            <Toggle label="Compact Context" value={settings.agent.compact_context} onChange={(v) => updateSettings('agent', 'compact_context', v)} />
            <p className="text-[10px] text-zinc-600">Controls how the agent handles conversations and tool calls. Higher iterations allow more complex tasks.</p>

            <CollapsibleSection title="Advanced">
                <SelectField
                    label="Tool Dispatcher"
                    value={settings.agent.tool_dispatcher}
                    onChange={(v) => updateSettings('agent', 'tool_dispatcher', v)}
                    options={[
                        { value: 'sequential', label: 'Sequential' },
                        { value: 'parallel', label: 'Parallel' },
                        { value: 'adaptive', label: 'Adaptive' },
                    ]}
                />
            </CollapsibleSection>

            <CollapsibleSection title="Delegate Agents">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-zinc-600">Sub-agents the main agent can delegate tasks to.</p>
                        <button onClick={addAgent} className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors">
                            <Plus size={12} /> Add Agent
                        </button>
                    </div>
                    {settings.delegate_agents.length === 0 && (
                        <p className="text-xs text-zinc-600 italic">No delegate agents configured.</p>
                    )}
                    {settings.delegate_agents.map((agent, i) => (
                        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{agent.name || `Agent #${i + 1}`}</span>
                                <button onClick={() => removeAgent(i)} className="text-zinc-500 hover:text-red-400"><X size={12} /></button>
                            </div>
                            <TextField label="Name" value={agent.name} onChange={(v) => updateAgent(i, 'name', v)} placeholder="e.g. coder, reviewer" />
                            <TextField label="Provider" value={agent.provider} onChange={(v) => updateAgent(i, 'provider', v)} placeholder="e.g. anthropic, openai" />
                            <TextField label="Model" value={agent.model} onChange={(v) => updateAgent(i, 'model', v)} placeholder="e.g. claude-sonnet-4-6" />
                            <TextField label="System Prompt" value={agent.system_prompt} onChange={(v) => updateAgent(i, 'system_prompt', v)} placeholder="You are a code reviewer..." />
                            <SliderField label="Temperature" value={agent.temperature} onChange={(v) => updateAgent(i, 'temperature', v)} min={0} max={2} step={0.1} />
                            <NumberField label="Max Depth" value={agent.max_depth} onChange={(v) => updateAgent(i, 'max_depth', v)} min={1} max={10} />
                            <Toggle label="Agentic Mode" value={agent.agentic} onChange={(v) => updateAgent(i, 'agentic', v)} />
                        </div>
                    ))}
                </div>
            </CollapsibleSection>
        </div>
    );
}
