import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { Copy, Eye, EyeOff } from "lucide-react";

export function SettingsView() {
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
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("http://localhost:5123/api/settings");
            if (res.ok) {
                const data = await res.json();
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

    return (
        <div className="h-full bg-bg-base overflow-y-auto">
            <div className="max-w-[700px] mx-auto py-10 px-6 space-y-8">

                {/* General Settings */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em]">GENERAL</h2>

                        <div>
                            <Button variant="surface" className="text-sm px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => alert("Projects sidebar refreshed")}>
                                Refresh Projects Sidebar
                            </Button>
                            <p className="text-xs text-text-muted mt-2">If projects don't appear, click this button to manually refresh the sidebar.</p>
                        </div>

                        <div className="h-px bg-border-subtle my-2"></div>

                        <div className="flex justify-between items-center">
                            <div className="space-y-1 pr-6">
                                <h3 className="text-sm font-medium text-white">SAP Commerce Context</h3>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    When enabled, SAP Commerce Cloud (Hybris) domain knowledge is included in AI prompts for platform-aware test case generation and analysis
                                </p>
                            </div>
                            <div className="shrink-0">
                                <Switch checked={sapCommerceContext} onChange={(e) => handleSaveGeneral(e.target.checked)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation API */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-base font-semibold text-white">Automation API</h2>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                Expose a local REST API so automation suites (Playwright, Cypress, etc.) can query test cases and submit execution results.
                            </p>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="space-y-1 pr-6">
                                <h3 className="text-sm font-medium text-white">Enable Automation API</h3>
                                <p className="text-xs text-text-muted">Starts a local HTTP server your test runners can call</p>
                            </div>
                            <div className="shrink-0">
                                <Switch checked={automationApiEnabled} onChange={(e) => handleSaveAutomation(e.target.checked)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-text-muted">Port</label>
                            <Input
                                type="number"
                                value={automationApiPort}
                                onChange={(e) => setAutomationApiPort(parseInt(e.target.value))}
                                className="max-w-[120px] bg-bg-base border-border-subtle text-white p-2.5 rounded-lg"
                                placeholder="5248"
                            />
                            <p className="text-[11px] text-text-muted">Default: 5248 · Changes take effect on next toggle or restart</p>
                        </div>

                        <Button variant="surface" className="text-sm px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand w-fit" onClick={() => handleSaveGroup('automation')}>
                            Save Port
                        </Button>

                        <div className="space-y-3 pt-2">
                            <label className="text-xs text-text-muted">API Key</label>
                            <div className="relative">
                                <Input
                                    type={showAutoKey ? "text" : "password"}
                                    value={automationApiKey}
                                    readOnly
                                    className="w-full bg-bg-base border-border-subtle text-white p-2.5 rounded-lg font-mono text-xs opacity-70"
                                    disabled={!automationApiKey}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="surface" className="text-xs h-9 px-4 bg-[#2b2b36] hover:bg-[#363644] text-text-muted" onClick={() => setShowAutoKey(!showAutoKey)}>
                                    <div className="flex items-center gap-2">
                                        {showAutoKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        <span>{showAutoKey ? "Hide Key" : "Show Key"}</span>
                                    </div>
                                </Button>
                                <Button variant="surface" className="text-xs h-9 px-4 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => { navigator.clipboard.writeText(automationApiKey); }}>
                                    <div className="flex items-center gap-2">
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Key</span>
                                    </div>
                                </Button>
                            </div>
                            <p className="text-[11px] text-text-muted">All requests must include: Authorization: Bearer &lt;key&gt;</p>
                            <Button onClick={handleRegenerateAutoKey} className="text-xs h-9 px-4 bg-[#3f1a1a] hover:bg-[#4a1e1e] text-[#f87171] rounded-lg mt-2 font-medium">
                                Regenerate Key
                            </Button>
                        </div>

                        <div className="bg-bg-base border border-border-subtle rounded-lg p-4 mt-2 font-mono text-[11px] text-text-muted whitespace-pre-wrap">
                            <span className="text-text-muted font-semibold tracking-[0.15em] uppercase text-[10px] mb-3 block">ENDPOINTS</span>
                            <span className="text-white">GET  /api/projects</span>{"\n"}
                            <span className="text-white">GET  /api/projects/{"{id}"}/testplans</span>{"\n"}
                            <span className="text-white">GET  /api/projects/{"{id}"}/testcases</span>{"\n"}
                            <span className="text-white">GET  /api/projects/{"{id}"}/testcases?planId={"guid"}</span>{"\n"}
                            <span className="text-white">GET  /api/projects/{"{id}"}/testcases/{"{tcId}"}</span>{"\n"}
                            <span className="text-white">GET  /api/projects/{"{id}"}/executions</span>{"\n"}
                            <span className="text-white">POST /api/projects/{"{id}"}/executions</span>{"\n"}
                            <span className="text-white">POST /api/projects/{"{id}"}/executions/batch</span>{"\n\n"}
                            <span className="text-text-muted mt-1 block">Header: Authorization: Bearer &lt;api-key&gt;</span>
                            <span className="text-text-muted">POST body: {"{ \"testCaseDisplayId\": \"TC-001\", \"result\": \"passed\", \"actualResult\": \"...\", \"notes\": \"...\" }"}</span>
                        </div>
                    </div>
                </div>

                {/* Linear Section */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-6">
                                <h2 className="text-base font-semibold text-white">Linear</h2>
                                <p className="text-xs text-text-muted">Get your API key from linear.app → Settings → API → Personal API Keys</p>
                            </div>
                            <Button variant="surface" className="text-xs bg-[#2b2b36] hover:bg-[#363644] text-brand px-3 py-1.5 shrink-0" onClick={() => window.open('https://linear.app/settings/api', '_blank')}>
                                Get API Key
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-text-muted">API Key</label>
                            <Input
                                type="password"
                                value={linearKey}
                                onChange={(e) => setLinearKey(e.target.value)}
                                className="w-full bg-bg-base border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                placeholder="lin_api_..."
                            />
                        </div>

                        <div>
                            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em] mb-3">CONNECTIONS</h3>
                            {/* Connection logic would go here if lists were implemented in backend */}
                            <div className="space-y-4 bg-bg-base p-4 rounded-lg border border-border-subtle">
                                <h4 className="text-sm font-semibold text-white">Default Connection</h4>
                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">Team ID</label>
                                    <Input
                                        type="text"
                                        value={linearTeamId}
                                        onChange={(e) => setLinearTeamId(e.target.value)}
                                        className="w-full bg-[#1f1f2a] border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                        placeholder="Your Linear Team ID"
                                    />
                                    <p className="text-[11px] text-text-muted">Go to linear.app → Settings → Team → copy the ID from the URL</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" disabled={loading !== null} onClick={() => handleSaveGroup('linear')}>
                                        Save Connection
                                    </Button>
                                    <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-text-muted" disabled={loading !== null} onClick={() => handleTest('linear')}>
                                        Test
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jira Section */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-6">
                                <h2 className="text-base font-semibold text-white">Jira</h2>
                                <p className="text-xs text-text-muted">Get your API token from id.atlassian.com → Security → API tokens</p>
                            </div>
                            <Button variant="surface" className="text-xs bg-[#2b2b36] hover:bg-[#363644] text-brand px-3 py-1.5 shrink-0" onClick={() => window.open('https://id.atlassian.com/manage-profile/security/api-tokens', '_blank')}>
                                Get API Token
                            </Button>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em] mb-3">CONNECTIONS</h3>
                            {/* Connection logic would go here if lists were implemented in backend */}
                            <div className="space-y-4 bg-bg-base p-4 rounded-lg border border-border-subtle">
                                <h4 className="text-sm font-semibold text-white">Default Connection</h4>

                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">Domain</label>
                                    <Input
                                        type="text"
                                        value={jiraDomain}
                                        onChange={(e) => setJiraDomain(e.target.value)}
                                        className="w-full bg-[#1f1f2a] border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                        placeholder="your-company (from your-company.atlassian.net)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">Email</label>
                                    <Input
                                        type="text"
                                        value={jiraEmail}
                                        onChange={(e) => setJiraEmail(e.target.value)}
                                        className="w-full bg-[#1f1f2a] border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">API Token</label>
                                    <Input
                                        type="password"
                                        value={jiraKey}
                                        onChange={(e) => setJiraKey(e.target.value)}
                                        className="w-full bg-[#1f1f2a] border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                        placeholder="Your Jira API token (leave blank to keep existing)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">Project Key</label>
                                    <Input
                                        type="text"
                                        value={jiraProjectKey}
                                        onChange={(e) => setJiraProjectKey(e.target.value)}
                                        className="w-full bg-[#1f1f2a] border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                        placeholder="e.g. QA, DEV, PROJ"
                                    />
                                    <p className="text-[11px] text-text-muted">The short key shown before issue numbers e.g. QA-123</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" disabled={loading !== null} onClick={() => handleSaveGroup('jira')}>
                                        Save Connection
                                    </Button>
                                    <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-text-muted" disabled={loading !== null} onClick={() => handleTest('jira')}>
                                        Test
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Google AI Studio */}
                <div className="bg-[#1a1a24] rounded-xl p-6 border border-[#2a2a3a]">
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-6">
                                <h2 className="text-base font-semibold text-[#e2e8f0]">Google AI Studio</h2>
                                <p className="text-xs text-[#6b7280]">Get your API key from aistudio.google.com → API Keys</p>
                            </div>
                            <Button variant="surface" className="text-xs bg-[#2b2b36] hover:bg-[#363644] text-brand px-3 py-1.5 shrink-0" onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>
                                Get API Key
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[#9ca3af]">API Key</label>
                            <Input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="w-full bg-[#0f0f13] border-[#2a2a3a] text-[#e2e8f0] p-2.5 rounded-lg text-sm"
                                placeholder="Enter your Google AI Studio API key..."
                            />
                        </div>

                        <Button variant="surface" className="text-sm px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand w-fit" disabled={loading !== null} onClick={() => handleSaveGroup('gemini')}>
                            Save API Key
                        </Button>
                    </div>
                </div>

                {/* SAP CCv2 */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-6">
                                <h2 className="text-base font-semibold text-white">SAP Commerce Cloud v2 (CCv2)</h2>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    Enter your subscription code and a Management API token to enable the CCv2 Deployments panel on the SAP page.
                                </p>
                            </div>
                            <Button variant="surface" className="text-xs bg-[#2b2b36] hover:bg-[#363644] text-brand px-3 py-1.5 shrink-0" onClick={() => window.open('https://help.sap.com/viewer/p/SAP_COMMERCE_CLOUD', '_blank')}>
                                API Docs
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-text-muted">Subscription Code</label>
                            <Input
                                type="text"
                                value={sapCcv2Host}
                                onChange={(e) => setSapCcv2Host(e.target.value)}
                                className="w-full bg-bg-base border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                placeholder="Your CCv2 subscription code"
                            />
                            <p className="text-[11px] text-text-muted">Found in the SAP Commerce Cloud Portal under your project settings</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-text-muted">API Token</label>
                            <Input
                                type="password"
                                value={sapCcv2ApiKey}
                                onChange={(e) => setSapCcv2ApiKey(e.target.value)}
                                className="w-full bg-bg-base border-border-subtle text-white p-2.5 rounded-lg text-sm"
                                placeholder="Bearer token from the CCv2 portal"
                            />
                            <p className="text-[11px] text-text-muted">Generate in Cloud Portal → API Token Management</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => handleSaveGroup('ccv2')}>
                                Save CCv2 Credentials
                            </Button>
                            <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-text-muted" onClick={() => handleTest('ccv2')}>
                                Test Connection
                            </Button>
                            <Button className="text-xs h-9 px-4 bg-[#3f1a1a] hover:bg-[#4a1e1e] text-[#f87171] rounded-lg font-medium" onClick={() => { setSapCcv2Host(""); setSapCcv2ApiKey(""); setTimeout(() => handleSaveGroup('ccv2'), 50); }}>
                                Disconnect
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Diagnostics */}
                <div className="bg-[#1a1a24] rounded-xl p-6 border border-[#2a2a3a]">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-[0.15em]">DIAGNOSTICS</h2>

                        <div className="space-y-1.5">
                            <h3 className="text-[13px] font-semibold text-[#e2e8f0]">Data Storage Path</h3>
                            <p className="text-[11px] font-mono text-[#a78bfa] break-all">C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json</p>
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-[13px] font-semibold text-[#e2e8f0]">Log File Path</h3>
                            <p className="text-[11px] font-mono text-[#a78bfa] break-all">C:\Users\Stefan\AppData\Roaming\QAssistant\storage.log</p>
                        </div>

                        <div className="pt-2">
                            <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => alert("Log file opening not implemented in web UI.")}>
                                Open Log File
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Project Sharing */}
                <div className="bg-[#1f1f2a] rounded-xl p-6 border border-border-subtle">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em]">PROJECT SHARING</h2>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Export the current project to a JSON file to share with teammates, or import a project from a shared file. Credentials are never exported — they must be re-entered on the receiving machine.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => alert("Export project feature not implemented in web UI yet.")}>
                                Export Project…
                            </Button>
                            <Button variant="surface" className="text-xs px-4 py-2 bg-[#2b2b36] hover:bg-[#363644] text-brand" onClick={() => alert("Import project feature not implemented in web UI yet.")}>
                                Import Project…
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Watermark */}
                <div className="pt-2 pb-6 flex justify-center">
                    <p className="text-[11px] text-text-muted italic opacity-75">
                        © 2026 Lewandowskista · QAssistant
                    </p>
                </div>

            </div>
        </div>
    );
}
