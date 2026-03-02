import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Switch } from "./ui/Switch";

export function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // General
    const [sapCommerceContext, setSapCommerceContext] = useState(false);

    // CCv2
    const [sapCcv2Host, setSapCcv2Host] = useState("");
    const [sapCcv2ApiKey, setSapCcv2ApiKey] = useState("");

    // Automation
    const [automationApiEnabled, setAutomationApiEnabled] = useState(false);
    const [automationApiPort, setAutomationApiPort] = useState(5248);
    const [automationApiKey, setAutomationApiKey] = useState("");
    const [showAutoKey, setShowAutoKey] = useState(false);

    // Linear
    const [linearKey, setLinearKey] = useState("");
    const [linearTeamId, setLinearTeamId] = useState("");

    // Jira
    const [jiraDomain, setJiraDomain] = useState("");
    const [jiraEmail, setJiraEmail] = useState("");
    const [jiraKey, setJiraKey] = useState("");
    const [jiraProjectKey, setJiraProjectKey] = useState("");

    // Gemini
    const [geminiKey, setGeminiKey] = useState("");

    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("http://localhost:5123/api/settings");
            if (res.ok) {
                const data = await res.json();

                // Set all states
                setSapCommerceContext(data.sapCommerceContext || false);

                setSapCcv2Host(data.sapCcv2Host || "");
                setSapCcv2ApiKey(data.sapCcv2ApiKey || "");

                setAutomationApiEnabled(data.automationApiEnabled || false);
                setAutomationApiPort(data.automationApiPort || 5248);
                setAutomationApiKey(data.automationApiKey || "");

                setLinearKey(data.linearApiKey || "");
                setLinearTeamId(data.linearTeamId || "");
                setJiraDomain(data.jiraDomain || "");
                setJiraEmail(data.jiraEmail || "");
                setJiraKey(data.jiraApiToken || "");
                setJiraProjectKey(data.jiraProjectKey || "");
                setGeminiKey(data.geminiApiKey || "");
            }
        } catch (e) {
            console.error("Failed to fetch settings", e);
        }
    };

    const handleSaveGeneral = async (sapContext: boolean) => {
        setSapCommerceContext(sapContext);
        await savePartial({ sapCommerceContext: sapContext });
    };

    const handleSaveAutomation = async (enabled: boolean) => {
        setAutomationApiEnabled(enabled);
        await savePartial({ automationApiEnabled: enabled, automationApiPort, automationApiKey });
    };

    const handleRegenerateAutoKey = async () => {
        const newKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        setAutomationApiKey(newKey);
        await savePartial({ automationApiKey: newKey });
    };

    const savePartial = async (partialData: any) => {
        try {
            const res = await fetch("http://localhost:5123/api/settings");
            const currentSettings = await res.json();
            const updatedSettings = { ...currentSettings, ...partialData };

            await fetch("http://localhost:5123/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSettings)
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const handleSaveGroup = async (group: string) => {
        setLoading(`save_${group}`);
        try {
            const res = await fetch("http://localhost:5123/api/settings");
            const currentSettings = await res.json();
            let updatedSettings = { ...currentSettings };

            if (group === 'automation') {
                updatedSettings.automationApiPort = automationApiPort;
                updatedSettings.automationApiKey = automationApiKey;
            } else if (group === 'ccv2') {
                updatedSettings.sapCcv2Host = sapCcv2Host;
                updatedSettings.sapCcv2ApiKey = sapCcv2ApiKey;
            } else if (group === 'linear') {
                updatedSettings.linearApiKey = linearKey;
                updatedSettings.linearTeamId = linearTeamId;
            } else if (group === 'jira') {
                updatedSettings.jiraDomain = jiraDomain;
                updatedSettings.jiraEmail = jiraEmail;
                updatedSettings.jiraApiToken = jiraKey;
                updatedSettings.jiraProjectKey = jiraProjectKey;
            } else if (group === 'gemini') {
                updatedSettings.geminiApiKey = geminiKey;
            }

            const putRes = await fetch("http://localhost:5123/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSettings)
            });

            if (putRes.ok) {
                alert(`${group.toUpperCase()} settings saved successfully.`);
            } else {
                alert("Failed to save settings.");
            }
        } catch (e: any) {
            alert(e.message);
        }
        setLoading(null);
    };

    const handleTest = async (type: string) => {
        setLoading(`test_${type}`);
        try {
            let body: any = {};
            if (type === 'linear') {
                body = { apiKey: linearKey };
            } else if (type === 'jira') {
                body = { apiKey: jiraKey, extra1: jiraDomain, extra2: jiraEmail };
            } else if (type === 'gemini') {
                body = { apiKey: geminiKey };
            } else if (type === 'ccv2') {
                alert("CCv2 connection test not fully implemented in sidecar yet.");
                setLoading(null);
                return;
            }

            const res = await fetch(`http://localhost:5123/api/integrations/${type}/test`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            alert(data.message);
        } catch (e: any) {
            alert(e.message);
        }
        setLoading(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[550px] bg-bg-surface border-l border-border-subtle shadow-2xl p-6 z-50 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-brand-primary">Configuring keys for: My QA Project</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>×</Button>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="space-y-6 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">General</h3>

                    <div>
                        <Button variant="surface" className="text-xs" onClick={() => alert("Projects sidebar refreshed")}>Refresh Projects Sidebar</Button>
                        <p className="text-[10px] text-text-muted mt-2">If projects don't appear, click this button to manually refresh the sidebar.</p>
                    </div>

                    <div className="h-px bg-border-subtle my-2"></div>

                    <div className="flex justify-between items-start">
                        <div className="space-y-1 pr-4">
                            <h4 className="text-sm font-medium text-text-main">SAP Commerce Context</h4>
                            <p className="text-xs text-text-muted leading-relaxed">When enabled, SAP Commerce Cloud (Hybris) domain knowledge is included in AI prompts for platform-aware test case generation and analysis</p>
                        </div>
                        <Switch checked={sapCommerceContext} onChange={(e) => handleSaveGeneral(e.target.checked)} />
                    </div>
                </div>

                {/* Automation API */}
                <div className="space-y-6 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <div>
                        <h3 className="text-base font-semibold text-white">Automation API</h3>
                        <p className="text-xs text-text-muted mt-1">Expose a local REST API so automation suites (Playwright, Cypress, etc.) can query test cases and submit execution results.</p>
                    </div>

                    <div className="flex justify-between items-start mt-4">
                        <div className="space-y-1 pr-4">
                            <h4 className="text-sm font-medium text-text-main">Enable Automation API</h4>
                            <p className="text-xs text-text-muted">Starts a local HTTP server your test runners can call</p>
                        </div>
                        <Switch checked={automationApiEnabled} onChange={(e) => handleSaveAutomation(e.target.checked)} />
                    </div>

                    <div className="space-y-3 mt-4">
                        <div className="space-y-1">
                            <label className="text-xs text-text-muted">Port</label>
                            <div className="w-32">
                                <Input type="number" value={automationApiPort} onChange={(e) => setAutomationApiPort(parseInt(e.target.value))} />
                            </div>
                            <p className="text-[10px] text-text-muted">Default: 5248 · Changes take effect on next toggle or restart</p>
                        </div>
                        <Button variant="surface" className="text-xs" onClick={() => handleSaveGroup('automation')}>Save Port</Button>
                    </div>

                    <div className="space-y-3 mt-4">
                        <label className="text-xs text-text-muted">API Key</label>
                        <Input type={showAutoKey ? "text" : "password"} value={automationApiKey} readOnly className="font-mono text-xs opacity-70" />
                        <div className="flex gap-2">
                            <Button variant="surface" className="text-xs h-8" onClick={() => setShowAutoKey(!showAutoKey)}>
                                {showAutoKey ? "Hide Key" : "Show Key"}
                            </Button>
                            <Button variant="surface" className="text-xs h-8" onClick={() => { navigator.clipboard.writeText(automationApiKey); alert("Copied to clipboard") }}>Copy Key</Button>
                        </div>
                        <p className="text-[10px] text-text-muted pt-1">All requests must include: Authorization: Bearer &lt;key&gt;</p>
                        <Button variant="danger" className="text-xs mt-2" onClick={handleRegenerateAutoKey}>Regenerate Key</Button>
                    </div>

                    <div className="bg-[#0f0f13] border border-border-subtle rounded-md p-4 mt-4 font-mono text-[10px] text-text-muted whitespace-pre">
                        <span className="text-text-main font-semibold mb-2 block">ENDPOINTS</span>
                        GET   /api/projects
                        GET   /api/projects/{"{id}"}/testplans
                        GET   /api/projects/{"{id}"}/testcases
                        GET   /api/projects/{"{id}"}/testcases?planId={"guid"}
                        GET   /api/projects/{"{id}"}/testcases/{"{tcId}"}
                        GET   /api/projects/{"{id}"}/executions
                        POST  /api/projects/{"{id}"}/executions
                        POST  /api/projects/{"{id}"}/executions/batch

                        <span className="text-gray-500 mt-2 block">Header: Authorization: Bearer &lt;api-key&gt;
                            POST body: {"{ \"testCaseDisplayId\": \"TC-001\", \"result\": \"passed\", \"actualResult\": \"...\", \"notes\": \"...\" }"}</span>
                    </div>
                </div>

                {/* CCv2 */}
                <div className="space-y-4 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-base font-semibold text-white">SAP Commerce Cloud v2 (CCv2)</h3>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed pr-8">Enter your subscription code and a Management API token to enable the CCv2 Deployments panel on the SAP page.</p>
                        </div>
                        <Button variant="surface" className="text-xs shrink-0" onClick={() => window.open('https://help.sap.com/viewer/p/SAP_COMMERCE_CLOUD', '_blank')}>API Docs</Button>
                    </div>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs text-text-muted">Subscription Code</label>
                            <Input type="text" value={sapCcv2Host} onChange={(e) => setSapCcv2Host(e.target.value)} placeholder="Your CCv2 subscription code" />
                            <p className="text-[10px] text-text-muted">Found in the SAP Commerce Cloud Portal under your project settings</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-text-muted">API Token</label>
                            <Input type="password" value={sapCcv2ApiKey} onChange={(e) => setSapCcv2ApiKey(e.target.value)} placeholder="Bearer token from the CCv2 portal" />
                            <p className="text-[10px] text-text-muted">Generate in Cloud Portal → API Token Management</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="surface" className="text-xs" onClick={() => handleSaveGroup('ccv2')}>Save CCv2 Credentials</Button>
                            <Button variant="surface" className="text-xs" onClick={() => handleTest('ccv2')}>Test Connection</Button>
                            <Button variant="danger" className="text-xs" onClick={() => { setSapCcv2Host(""); setSapCcv2ApiKey(""); setTimeout(() => handleSaveGroup('ccv2'), 50); }}>Disconnect</Button>
                        </div>
                    </div>
                </div>

                {/* Project Sharing */}
                <div className="space-y-4 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <div>
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-2">Project Sharing</h3>
                        <p className="text-xs text-text-muted leading-relaxed">Export the current project to a JSON file to share with teammates, or import a project from a shared file. Credentials are never exported — they must be re-entered on the receiving machine.</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="surface" className="text-xs" onClick={() => alert("Export project feature not implemented in web UI yet.")}>Export Project...</Button>
                        <Button variant="surface" className="text-xs" onClick={() => alert("Import project feature not implemented in web UI yet.")}>Import Project...</Button>
                    </div>
                </div>

                {/* Legacy Integrations (Moved to bottom) */}
                <div className="space-y-6 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-2">Other Integrations</h3>

                    {/* Linear */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white">Linear</h4>
                        <div className="space-y-2">
                            <Input type="password" value={linearKey} onChange={(e) => setLinearKey(e.target.value)} placeholder="API Key" />
                            <Input type="text" value={linearTeamId} onChange={(e) => setLinearTeamId(e.target.value)} placeholder="Team ID" />
                            <div className="flex gap-2">
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleSaveGroup('linear')}>Save</Button>
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleTest('linear')}>Test</Button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border-subtle my-4"></div>

                    {/* Jira */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white">Jira</h4>
                        <div className="space-y-2">
                            <Input type="text" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} placeholder="Domain" />
                            <Input type="text" value={jiraEmail} onChange={(e) => setJiraEmail(e.target.value)} placeholder="Email" />
                            <Input type="password" value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} placeholder="API Token" />
                            <Input type="text" value={jiraProjectKey} onChange={(e) => setJiraProjectKey(e.target.value)} placeholder="Project Key" />
                            <div className="flex gap-2">
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleSaveGroup('jira')}>Save</Button>
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleTest('jira')}>Test</Button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border-subtle my-4"></div>

                    {/* Gemini */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white">Google AI Studio</h4>
                        <div className="space-y-2">
                            <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="API Key" />
                            <div className="flex gap-2">
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleSaveGroup('gemini')}>Save</Button>
                                <Button variant="surface" className="text-xs" disabled={loading !== null} onClick={() => handleTest('gemini')}>Test</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Diagnostics */}
                <div className="space-y-6 bg-bg-main p-6 rounded-xl border border-border-subtle">
                    <div>
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-2">Diagnostics</h3>
                        <p className="text-xs text-text-muted mt-1">View storage paths and logs to help debug data persistence issues.</p>
                        <Button className="mt-4 text-xs" variant="surface" onClick={() => alert("No sidecar logs available yet in Web mode.")}>
                            View Storage Diagnostics
                        </Button>
                    </div>

                    <div className="h-px bg-border-subtle my-2"></div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-white">Data Storage Path</h4>
                            <p className="text-xs font-mono text-brand-primary">C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-white">Log File Path</h4>
                            <p className="text-xs font-mono text-brand-primary">C:\Users\Stefan\AppData\Roaming\QAssistant\storage.log</p>
                        </div>
                        <Button className="mt-2 text-xs" variant="surface" onClick={() => alert("Log file opening not implemented in web UI.")}>Open Log File</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
