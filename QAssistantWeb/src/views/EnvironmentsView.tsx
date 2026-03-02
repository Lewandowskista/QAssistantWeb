import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
    Plus, Trash2, Save, Globe, Server, Lock, Eye, EyeOff,
    CheckCircle, XCircle, Wifi, WifiOff, ShieldOff, Star
} from "lucide-react";

const SIDECAR = "http://localhost:5123";

interface Environment {
    id: string;
    name: string;
    type: string;
    baseUrl: string;
    healthCheckUrl: string;
    hacUrl: string;
    backofficeUrl: string;
    storefrontUrl: string;
    solrUrl: string;
    occPath: string;
    username: string;
    password: string;
    notes: string;
    isDefault: boolean;
    ignoreSsl: boolean;
}

const ENV_TYPES = ["Development", "Staging", "Production", "Custom"];

function makeEmptyEnv(): Environment {
    return {
        id: crypto.randomUUID(),
        name: "New Environment",
        type: "Development",
        baseUrl: "",
        healthCheckUrl: "",
        hacUrl: "",
        backofficeUrl: "",
        storefrontUrl: "",
        solrUrl: "",
        occPath: "/occ/v2",
        username: "",
        password: "",
        notes: "",
        isDefault: false,
        ignoreSsl: false,
    };
}

const TYPE_COLORS: Record<string, string> = {
    Development: "#60a5fa",
    Staging: "#f59e0b",
    Production: "#34d399",
    Custom: "#a78bfa",
};

export function EnvironmentsView() {
    const { activeProject } = useApp();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selected, setSelected] = useState<Environment | null>(null);
    const [form, setForm] = useState<Environment | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!activeProject) return;
        fetch(`${SIDECAR}/api/projects/${activeProject.id}/environments`)
            .then(r => r.json())
            .then(data => {
                setEnvironments(data);
                if (data.length > 0) { setSelected(data[0]); setForm(data[0]); }
            })
            .catch(() => setEnvironments([]));
    }, [activeProject?.id]);

    const selectEnv = (env: Environment) => {
        setSelected(env);
        setForm({ ...env });
        setTestStatus("idle");
        setShowPassword(false);
    };

    const addEnvironment = async () => {
        if (!activeProject) return;
        const env = makeEmptyEnv();
        await fetch(`${SIDECAR}/api/projects/${activeProject.id}/environments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(env),
        });
        const newList = [...environments, env];
        setEnvironments(newList);
        selectEnv(env);
    };

    const deleteEnvironment = async () => {
        if (!activeProject || !selected) return;
        await fetch(`${SIDECAR}/api/projects/${activeProject.id}/environments/${selected.id}`, { method: "DELETE" });
        const newList = environments.filter(e => e.id !== selected.id);
        setEnvironments(newList);
        if (newList.length > 0) { selectEnv(newList[0]); } else { setSelected(null); setForm(null); }
    };

    const saveEnvironment = async () => {
        if (!activeProject || !form) return;
        setIsSaving(true);
        await fetch(`${SIDECAR}/api/projects/${activeProject.id}/environments/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const newList = environments.map(e => e.id === form.id ? { ...form } : e);
        setEnvironments(newList);
        setSelected({ ...form });
        setIsSaving(false);
    };

    const testConnection = async () => {
        if (!form || !form.healthCheckUrl) return;
        setTestStatus("testing");
        try {
            // Use the proxy to avoid CORS
            const proxyPayload = { id: form.id, name: form.name, category: "Custom", method: "GET", url: form.healthCheckUrl, headers: "{}", body: "" };
            const res = await fetch(`${SIDECAR}/api/proxy/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(proxyPayload),
            });
            const data = await res.json();
            setTestStatus(data.statusCode >= 200 && data.statusCode < 500 ? "ok" : "fail");
        } catch {
            setTestStatus("fail");
        }
    };

    const updateForm = (field: keyof Environment, val: string | boolean) => {
        if (!form) return;
        setForm({ ...form, [field]: val });
    };

    if (!activeProject) return (
        <div className="flex items-center justify-center h-full text-text-muted text-sm">Select a project to manage environments.</div>
    );

    return (
        <div className="flex h-full overflow-hidden">
            {/* ---- LEFT SIDEBAR ---- */}
            <aside className="w-64 flex-shrink-0 border-r border-[#1f1f22] bg-[#0f0f13] flex flex-col">
                <div className="px-4 py-3 border-b border-[#1f1f22] flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Environments</span>
                    <button onClick={addEnvironment} className="p-1 rounded hover:bg-[#2a2a2f] text-text-muted hover:text-text-main transition-colors">
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {environments.map(env => (
                        <button
                            key={env.id}
                            onClick={() => selectEnv(env)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 ${selected?.id === env.id ? "bg-[#1e1e24] text-text-main" : "text-text-muted hover:text-text-main hover:bg-[#17171b]"}`}
                        >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[env.type] ?? "#a78bfa" }} />
                            <span className="text-sm truncate flex-1">{env.name}</span>
                            {env.isDefault && <Star size={10} className="text-yellow-400 flex-shrink-0" />}
                        </button>
                    ))}
                    {environments.length === 0 && (
                        <p className="text-xs text-text-muted text-center pt-6">No environments yet.<br />Click + to add one.</p>
                    )}
                </div>
            </aside>

            {/* ---- EDITOR PANEL ---- */}
            {form ? (
                <div className="flex-1 overflow-y-auto">
                    {/* Top bar */}
                    <div className="sticky top-0 z-10 bg-[#12121a] border-b border-[#1f1f22] px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Server size={16} style={{ color: TYPE_COLORS[form.type] ?? "#a78bfa" }} />
                            <input
                                value={form.name}
                                onChange={e => updateForm("name", e.target.value)}
                                className="bg-transparent font-semibold text-text-main text-sm outline-none border-b border-transparent focus:border-accent-purple"
                            />
                            <select
                                value={form.type}
                                onChange={e => updateForm("type", e.target.value)}
                                className="bg-[#1a1a22] text-xs text-text-muted rounded px-2 py-1 border border-[#2a2a35] outline-none"
                            >
                                {ENV_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Test connection */}
                            <div className="flex items-center gap-2">
                                {testStatus === "ok" && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} />Connected</span>}
                                {testStatus === "fail" && <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={12} />Failed</span>}
                                {testStatus === "testing" && <span className="text-xs text-text-muted animate-pulse">Testing…</span>}
                                <button
                                    onClick={testConnection}
                                    disabled={!form.healthCheckUrl || testStatus === "testing"}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a22] border border-[#2a2a35] text-xs text-text-muted rounded hover:text-text-main hover:border-accent-purple transition-all disabled:opacity-40"
                                >
                                    {testStatus === "testing" ? <Wifi size={12} className="animate-pulse" /> : form.ignoreSsl ? <WifiOff size={12} /> : <Wifi size={12} />}
                                    Test Connection
                                </button>
                            </div>
                            <button onClick={deleteEnvironment} className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                            </button>
                            <button
                                onClick={saveEnvironment}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple text-white text-xs rounded hover:bg-[#7c57d4] transition-colors disabled:opacity-50"
                            >
                                <Save size={12} />
                                {isSaving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-8 max-w-5xl">
                        {/* --- URLs Section --- */}
                        <div className="col-span-2">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Globe size={12} />
                                URLs
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Base URL" value={form.baseUrl} onChange={v => updateForm("baseUrl", v)} placeholder="https://commerce.example.com" />
                                <Field label="Health Check URL" value={form.healthCheckUrl} onChange={v => updateForm("healthCheckUrl", v)} placeholder="https://commerce.example.com/actuator/health" />
                                <Field label="HAC URL" value={form.hacUrl} onChange={v => updateForm("hacUrl", v)} placeholder="https://hac.example.com" />
                                <Field label="Backoffice URL" value={form.backofficeUrl} onChange={v => updateForm("backofficeUrl", v)} placeholder="https://bo.example.com" />
                                <Field label="Storefront URL" value={form.storefrontUrl} onChange={v => updateForm("storefrontUrl", v)} placeholder="https://storefront.example.com" />
                                <Field label="Solr URL" value={form.solrUrl} onChange={v => updateForm("solrUrl", v)} placeholder="http://solr.example.com:8983" />
                                <Field label="OCC API Path" value={form.occPath} onChange={v => updateForm("occPath", v)} placeholder="/occ/v2" />
                            </div>
                        </div>

                        {/* --- Credentials Section --- */}
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Lock size={12} />
                                Credentials
                            </h3>
                            <div className="space-y-3">
                                <Field label="Username" value={form.username} onChange={v => updateForm("username", v)} placeholder="admin" />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-text-muted">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={e => updateForm("password", e.target.value)}
                                            className="w-full bg-[#1a1a22] border border-[#2a2a35] text-sm text-text-main rounded px-3 py-2 pr-9 outline-none focus:border-accent-purple"
                                            placeholder="••••••••"
                                        />
                                        <button onClick={() => setShowPassword(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main">
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Options Section --- */}
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldOff size={12} />
                                Options
                            </h3>
                            <div className="space-y-3">
                                <Toggle label="Default Environment" sublabel="Used as default when no environment is specified" value={form.isDefault} onChange={v => updateForm("isDefault", v)} />
                                <Toggle label="Ignore SSL Errors" sublabel="Skip SSL certificate validation for dev environments" value={form.ignoreSsl} onChange={v => updateForm("ignoreSsl", v)} />
                            </div>
                        </div>

                        {/* --- Notes Section --- */}
                        <div className="col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => updateForm("notes", e.target.value)}
                                rows={3}
                                className="w-full bg-[#1a1a22] border border-[#2a2a35] text-sm text-text-main rounded px-3 py-2 outline-none focus:border-accent-purple resize-none"
                                placeholder="Optional notes about this environment…"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm flex-col gap-3">
                    <Server size={32} className="opacity-30" />
                    <p>Select an environment to edit, or add a new one.</p>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">{label}</label>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-[#1a1a22] border border-[#2a2a35] text-sm text-text-main rounded px-3 py-2 outline-none focus:border-accent-purple transition-colors"
            />
        </div>
    );
}

function Toggle({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <div
                onClick={() => onChange(!value)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${value ? "bg-accent-purple" : "bg-[#2a2a35]"}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
            </div>
            <div>
                <p className="text-sm text-text-main">{label}</p>
                {sublabel && <p className="text-xs text-text-muted">{sublabel}</p>}
            </div>
        </label>
    );
}
