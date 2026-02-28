import { Toggle, NumberField, TextField, SelectField, PasswordField, TagsField, CollapsibleSection } from './shared';
import type { TabProps } from './types';

export default function ToolsTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-6">
            {/* Web Search */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Web Search</h3>
                <Toggle label="Enabled" value={settings.web_search.enabled} onChange={(v) => updateSettings('web_search', 'enabled', v)} />
                {settings.web_search.enabled && (
                    <>
                        <SelectField
                            label="Provider"
                            value={settings.web_search.provider}
                            onChange={(v) => updateSettings('web_search', 'provider', v)}
                            options={[
                                { value: 'duckduckgo', label: 'DuckDuckGo (Free)' },
                                { value: 'brave', label: 'Brave Search (API Key)' },
                            ]}
                        />
                        {settings.web_search.provider === 'brave' && (
                            <PasswordField label="Brave API Key" value={settings.web_search.api_key} onChange={(v) => updateSettings('web_search', 'api_key', v)} placeholder="BSA-xxx..." />
                        )}
                        <NumberField label="Max Results" value={settings.web_search.max_results} onChange={(v) => updateSettings('web_search', 'max_results', v)} min={1} max={20} />
                        <NumberField label="Timeout (seconds)" value={settings.web_search.timeout_secs} onChange={(v) => updateSettings('web_search', 'timeout_secs', v)} min={5} max={60} />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Browser */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Browser</h3>
                <Toggle label="Enabled" value={settings.browser.enabled} onChange={(v) => updateSettings('browser', 'enabled', v)} />
                {settings.browser.enabled && (
                    <>
                        <SelectField
                            label="Backend"
                            value={settings.browser.backend}
                            onChange={(v) => updateSettings('browser', 'backend', v)}
                            options={[
                                { value: 'auto', label: 'Auto' },
                                { value: 'agent_browser', label: 'Agent Browser' },
                                { value: 'rust_native', label: 'Rust Native' },
                                { value: 'computer_use', label: 'Computer Use' },
                            ]}
                        />
                        <Toggle label="Headless" value={settings.browser.headless} onChange={(v) => updateSettings('browser', 'headless', v)} />
                        <NumberField label="Page Timeout (seconds)" value={settings.browser.page_timeout_secs} onChange={(v) => updateSettings('browser', 'page_timeout_secs', v)} min={5} max={120} />

                        <CollapsibleSection title="Advanced Browser">
                            <TextField label="WebDriver URL" value={settings.browser.webdriver_url} onChange={(v) => updateSettings('browser', 'webdriver_url', v)} placeholder="http://localhost:9515" />
                            <TextField label="Chrome Path" value={settings.browser.chrome_path} onChange={(v) => updateSettings('browser', 'chrome_path', v)} placeholder="/usr/bin/chromium" />
                            <Toggle label="Computer Use Enabled" value={settings.browser.computer_use_enabled} onChange={(v) => updateSettings('browser', 'computer_use_enabled', v)} />
                            {settings.browser.computer_use_enabled && (
                                <>
                                    <NumberField label="Sidecar Port" value={settings.browser.computer_use_sidecar_port} onChange={(v) => updateSettings('browser', 'computer_use_sidecar_port', v)} min={1024} max={65535} />
                                    <TextField label="Display" value={settings.browser.computer_use_display} onChange={(v) => updateSettings('browser', 'computer_use_display', v)} placeholder=":1" />
                                </>
                            )}
                        </CollapsibleSection>
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* HTTP Request */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">HTTP Request Tool</h3>
                <Toggle label="Enabled" value={settings.http_request.enabled} onChange={(v) => updateSettings('http_request', 'enabled', v)} />
                {settings.http_request.enabled && (
                    <>
                        <TagsField label="Allowed Domains" value={settings.http_request.allowed_domains} onChange={(v) => updateSettings('http_request', 'allowed_domains', v)} placeholder="e.g. api.example.com" />
                        <NumberField label="Max Response (bytes)" value={settings.http_request.max_response_bytes} onChange={(v) => updateSettings('http_request', 'max_response_bytes', v)} min={1024} max={104857600} step={1024} />
                        <NumberField label="Timeout (seconds)" value={settings.http_request.timeout_secs} onChange={(v) => updateSettings('http_request', 'timeout_secs', v)} min={5} max={300} />
                    </>
                )}
            </div>

            <div className="border-t border-white/5" />

            {/* Composio */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Composio (OAuth Tools)</h3>
                <Toggle label="Enabled" value={settings.composio.enabled} onChange={(v) => updateSettings('composio', 'enabled', v)} />
                {settings.composio.enabled && (
                    <>
                        <PasswordField label="API Key" value={settings.composio.api_key} onChange={(v) => updateSettings('composio', 'api_key', v)} placeholder="cmp_xxx..." />
                        <TextField label="Entity ID" value={settings.composio.entity_id} onChange={(v) => updateSettings('composio', 'entity_id', v)} placeholder="default" />
                    </>
                )}
            </div>
        </div>
    );
}
