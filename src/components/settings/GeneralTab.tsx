import { SliderField, NumberField, SelectField } from './shared';
import { useAppStore } from '../../store';

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'o3-mini', label: 'o3 Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
    anthropic: [
        { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
        { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
        { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
    ollama: [
        { value: 'llama3', label: 'Llama 3' },
        { value: 'mistral', label: 'Mistral' },
        { value: 'codellama', label: 'Code Llama' },
        { value: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' },
    ],
    groq: [
        { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
    custom: [
        { value: 'custom-default', label: 'Default Model' },
    ],
};

export default function GeneralTab({ temperature, setTemperature, maxTokens, setMaxTokens, localModel, setLocalModel }: {
    temperature: number;
    setTemperature: (v: number) => void;
    maxTokens: number;
    setMaxTokens: (v: number) => void;
    localModel: string;
    setLocalModel: (v: string) => void;
}) {
    const selectedProvider = useAppStore((state) => state.selectedProvider);
    const models = MODEL_OPTIONS[selectedProvider] || MODEL_OPTIONS.openai;

    return (
        <div className="space-y-5">
            <SelectField
                label={`Model (${selectedProvider})`}
                value={localModel}
                onChange={setLocalModel}
                options={models}
            />
            <SliderField label="Temperature" value={temperature} onChange={setTemperature} min={0} max={2} step={0.1} />
            <NumberField label="Max Tokens" value={maxTokens} onChange={setMaxTokens} min={256} max={128000} step={256} />
            <p className="text-[10px] text-zinc-600">Temperature controls creativity (0=precise, 2=creative). Max tokens limits response length.</p>
        </div>
    );
}

export { MODEL_OPTIONS };
