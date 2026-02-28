import { Plus, X } from 'lucide-react';
import { Toggle, NumberField, SliderField, CollapsibleSection } from './shared';
import type { TabProps, EngineSettingsModelPricing } from './types';

export default function CostTab({ settings, updateSettings }: TabProps) {
    const addPricing = () => {
        const prices = [...settings.model_pricing, { model: '', input_price_per_1m: 0, output_price_per_1m: 0 }];
        updateSettings('model_pricing' as any, '', prices);
    };
    const removePricing = (i: number) => {
        const prices = settings.model_pricing.filter((_, j) => j !== i);
        updateSettings('model_pricing' as any, '', prices);
    };
    const updatePricing = (i: number, field: keyof EngineSettingsModelPricing, value: any) => {
        const prices = [...settings.model_pricing];
        prices[i] = { ...prices[i], [field]: value };
        updateSettings('model_pricing' as any, '', prices);
    };

    return (
        <div className="space-y-4">
            <Toggle label="Enable Cost Tracking" value={settings.cost.enabled} onChange={(v) => updateSettings('cost', 'enabled', v)} />
            {settings.cost.enabled && (
                <>
                    <NumberField label="Daily Limit (USD)" value={settings.cost.daily_limit_usd} onChange={(v) => updateSettings('cost', 'daily_limit_usd', v)} min={0} max={1000} step={0.5} />
                    <NumberField label="Monthly Limit (USD)" value={settings.cost.monthly_limit_usd} onChange={(v) => updateSettings('cost', 'monthly_limit_usd', v)} min={0} max={10000} step={1} />
                    <SliderField label="Warning Threshold" value={settings.cost.warn_at_percent} onChange={(v) => updateSettings('cost', 'warn_at_percent', v)} min={10} max={100} step={5} unit="%" />

                    <CollapsibleSection title="Advanced">
                        <Toggle label="Allow Override" value={settings.cost.allow_override} onChange={(v) => updateSettings('cost', 'allow_override', v)} />
                    </CollapsibleSection>

                    <CollapsibleSection title="Model Pricing">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-zinc-600">Custom per-model pricing (per 1M tokens).</p>
                                <button onClick={addPricing} className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors">
                                    <Plus size={12} /> Add Model
                                </button>
                            </div>
                            {settings.model_pricing.length === 0 && (
                                <p className="text-xs text-zinc-600 italic">No custom pricing. Engine defaults will be used.</p>
                            )}
                            {/* Table header */}
                            {settings.model_pricing.length > 0 && (
                                <div className="grid grid-cols-[1fr_100px_100px_30px] gap-2 px-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                    <span>Model</span>
                                    <span>Input $/1M</span>
                                    <span>Output $/1M</span>
                                    <span />
                                </div>
                            )}
                            {settings.model_pricing.map((p, i) => (
                                <div key={i} className="grid grid-cols-[1fr_100px_100px_30px] gap-2 items-center">
                                    <input
                                        value={p.model}
                                        onChange={(e) => updatePricing(i, 'model', e.target.value)}
                                        placeholder="model-name"
                                        className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                                    />
                                    <input
                                        type="number"
                                        value={p.input_price_per_1m}
                                        onChange={(e) => updatePricing(i, 'input_price_per_1m', Number(e.target.value))}
                                        step={0.01}
                                        min={0}
                                        className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                                    />
                                    <input
                                        type="number"
                                        value={p.output_price_per_1m}
                                        onChange={(e) => updatePricing(i, 'output_price_per_1m', Number(e.target.value))}
                                        step={0.01}
                                        min={0}
                                        className="bg-black/40 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                                    />
                                    <button onClick={() => removePricing(i)} className="text-zinc-500 hover:text-red-400 justify-self-center"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                </>
            )}
        </div>
    );
}
