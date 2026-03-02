import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
    Plus, Trash2, Send, Save, Copy, Clock, CheckCircle, AlertCircle, ChevronDown
} from "lucide-react";

const SIDECAR = "http://localhost:5123";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = typeof METHODS[number];
const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "#34d399", POST: "#60a5fa", PUT: "#f59e0b", PATCH: "#a78bfa", DELETE: "#f87171",
};

interface ApiRequest { id: string; name: string; category: string; method: string; url: string; headers: string; body: string; }
interface ApiHistory { id: string; requestId: string; executedAt: string; statusCode: number; durationMs: number; responseHeaders: string; responseBody: string; }
const CATEGORIES = ["OCC", "HAC", "Jira", "Linear", "Custom"];

function makeEmptyRequest(): ApiRequest {
    return { id: crypto.randomUUID(), name: "New Request", category: "Custom", method: "GET", url: "", headers: '{\n  "Content-Type": "application/json"\n}', body: "" };
}
function statusColor(code: number) {
    if (code === 0) return "#f87171";
    if (code < 300) return "#34d399";
    if (code < 400) return "#60a5fa";
    if (code < 500) return "#f59e0b";
    return "#f87171";
}
function tryFormatJson(s: string) { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } }

export function ApiPlaygroundView() {
    const { activeProject } = useApp();
    const [requests, setRequests] = useState<ApiRequest[]>([]);
    const [selected, setSelected] = useState<ApiRequest | null>(null);
    const [form, setForm] = useState<ApiRequest | null>(null);
    const [history, setHistory] = useState<ApiHistory[]>([]);
    const [reqTab, setReqTab] = useState<"body" | "headers" | "history">("body");
    const [resTab, setResTab] = useState<"body" | "headers">("body");
    const [sending, setSending] = useState(false);
    const [lastResponse, setLastResponse] = useState<ApiHistory | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!activeProject) return;
        const stored = localStorage.getItem(`api_req_${activeProject.id}`);
        if (stored) { const p: ApiRequest[] = JSON.parse(stored); setRequests(p); if (p.length > 0) { setSelected(p[0]); setForm({ ...p[0] }); } }
        const storedH = localStorage.getItem(`api_hist_${activeProject.id}`);
        if (storedH) setHistory(JSON.parse(storedH));
    }, [activeProject?.id]);

    const persist = (list: ApiRequest[]) => { if (activeProject) localStorage.setItem(`api_req_${activeProject.id}`, JSON.stringify(list)); };
    const persistH = (list: ApiHistory[]) => { if (activeProject) localStorage.setItem(`api_hist_${activeProject.id}`, JSON.stringify(list)); };

    const addRequest = () => { const r = makeEmptyRequest(); const nl = [...requests, r]; setRequests(nl); persist(nl); setSelected(r); setForm({ ...r }); setLastResponse(null); };
    const deleteRequest = () => {
        if (!selected) return;
        const nl = requests.filter(r => r.id !== selected.id); setRequests(nl); persist(nl);
        if (nl.length > 0) { setSelected(nl[0]); setForm({ ...nl[0] }); } else { setSelected(null); setForm(null); }
        setLastResponse(null);
    };
    const saveRequest = () => { if (!form) return; const nl = requests.map(r => r.id === form.id ? { ...form } : r); setRequests(nl); persist(nl); setSelected({ ...form }); };
    const upd = (f: Partial<ApiRequest>) => setForm(p => p ? { ...p, ...f } : null);

    const sendRequest = async () => {
        if (!form || !activeProject) return;
        setSending(true);
        try {
            const res = await fetch(`${SIDECAR}/api/proxy/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data: ApiHistory = await res.json();
            const entry = { ...data, id: crypto.randomUUID(), requestId: form.id };
            setLastResponse(entry);
            const nh = [entry, ...history].slice(0, 50); setHistory(nh); persistH(nh);
            setResTab("body");
        } catch (e) {
            const entry: ApiHistory = { id: crypto.randomUUID(), requestId: form.id, executedAt: new Date().toISOString(), statusCode: 0, durationMs: 0, responseHeaders: "{}", responseBody: String(e) };
            setLastResponse(entry);
        }
        setSending(false);
    };

    if (!activeProject) return <div className="flex items-center justify-center h-full text-text-muted text-sm">Select a project first.</div>;

    return (
        <div className="flex h-full overflow-hidden">
            {/* Saved Requests Sidebar */}
            <aside className="w-56 flex-shrink-0 border-r border-[#1f1f22] bg-[#0f0f13] flex flex-col">
                <div className="px-3 py-2.5 border-b border-[#1f1f22] flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Saved</span>
                    <button onClick={addRequest} className="p-1 rounded hover:bg-[#2a2a2f] text-text-muted hover:text-text-main"><Plus size={13} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {CATEGORIES.map(cat => {
                        const catReqs = requests.filter(r => r.category === cat);
                        if (!catReqs.length) return null;
                        return (
                            <div key={cat}>
                                <p className="text-[10px] text-text-muted uppercase tracking-widest px-1 py-1 mt-1">{cat}</p>
                                {catReqs.map(req => (
                                    <button key={req.id} onClick={() => { setSelected(req); setForm({ ...req }); setLastResponse(null); }}
                                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-all ${selected?.id === req.id ? "bg-[#1e1e24] text-text-main" : "text-text-muted hover:text-text-main hover:bg-[#17171b]"}`}>
                                        <span className="font-mono font-bold text-[10px]" style={{ color: METHOD_COLORS[req.method as HttpMethod] ?? "#a78bfa" }}>{req.method}</span>
                                        <span className="truncate">{req.name}</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                    {requests.length === 0 && <p className="text-xs text-text-muted text-center pt-6">No saved requests.<br />Click + to create one.</p>}
                </div>
            </aside>

            {form ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* URL Bar */}
                    <div className="border-b border-[#1f1f22] px-4 py-3 bg-[#0f0f13] flex items-center gap-2">
                        <input value={form.name} onChange={e => upd({ name: e.target.value })}
                            className="bg-transparent text-sm font-medium text-text-main outline-none border-b border-transparent focus:border-accent-purple w-36" />
                        <div className="relative">
                            <select value={form.method} onChange={e => upd({ method: e.target.value })}
                                className="appearance-none bg-[#1a1a22] border border-[#2a2a35] text-xs font-mono font-bold rounded-lg px-3 py-2 pr-6 outline-none"
                                style={{ color: METHOD_COLORS[form.method as HttpMethod] ?? "#a78bfa" }}>
                                {METHODS.map(m => <option key={m}>{m}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <input value={form.url} onChange={e => upd({ url: e.target.value })} placeholder="https://api.example.com/endpoint"
                            className="flex-1 bg-[#1a1a22] border border-[#2a2a35] text-sm text-text-main rounded-lg px-3 py-2 outline-none focus:border-accent-purple font-mono" />
                        <select value={form.category} onChange={e => upd({ category: e.target.value })}
                            className="bg-[#1a1a22] border border-[#2a2a35] text-xs text-text-muted rounded-lg px-2 py-2 outline-none">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button onClick={saveRequest} className="p-2 rounded-lg hover:bg-[#2a2a35] text-text-muted hover:text-text-main"><Save size={14} /></button>
                        <button onClick={deleteRequest} className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400"><Trash2 size={14} /></button>
                        <button onClick={sendRequest} disabled={sending || !form.url}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white text-xs font-semibold rounded-lg hover:bg-[#7c57d4] disabled:opacity-50">
                            <Send size={12} />{sending ? "Sending…" : "Send"}
                        </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Request Editor */}
                        <div className="flex flex-col w-1/2 border-r border-[#1f1f22]">
                            <div className="flex border-b border-[#1f1f22] px-4 bg-[#0f0f13]">
                                {(["body", "headers", "history"] as const).map(t => (
                                    <button key={t} onClick={() => setReqTab(t)}
                                        className={`px-3 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${reqTab === t ? "border-accent-purple text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}>{t}</button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-auto p-3">
                                {reqTab === "body" && <textarea value={form.body} onChange={e => upd({ body: e.target.value })} rows={20}
                                    className="w-full h-full min-h-[300px] bg-[#1a1a22] border border-[#2a2a35] text-xs font-mono text-text-main rounded p-3 outline-none focus:border-accent-purple resize-none"
                                    placeholder='{\n  "key": "value"\n}' />}
                                {reqTab === "headers" && <textarea value={form.headers} onChange={e => upd({ headers: e.target.value })} rows={20}
                                    className="w-full h-full min-h-[300px] bg-[#1a1a22] border border-[#2a2a35] text-xs font-mono text-text-main rounded p-3 outline-none focus:border-accent-purple resize-none"
                                    placeholder='{\n  "Authorization": "Bearer token"\n}' />}
                                {reqTab === "history" && (
                                    <div className="space-y-1.5">
                                        {history.filter(h => h.requestId === form.id).map(h => (
                                            <button key={h.id} onClick={() => setLastResponse(h)}
                                                className="w-full text-left px-3 py-2 rounded bg-[#1a1a22] hover:bg-[#22222a] flex items-center gap-3 text-xs">
                                                <span className="font-bold font-mono" style={{ color: statusColor(h.statusCode) }}>{h.statusCode || "ERR"}</span>
                                                <span className="text-text-muted flex-1">{new Date(h.executedAt).toLocaleTimeString()}</span>
                                                <span className="text-text-muted flex items-center gap-1"><Clock size={10} />{h.durationMs}ms</span>
                                            </button>
                                        ))}
                                        {history.filter(h => h.requestId === form.id).length === 0 && <p className="text-xs text-text-muted text-center pt-6">No history yet.</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Response Panel */}
                        <div className="flex flex-col w-1/2">
                            <div className="flex border-b border-[#1f1f22] px-4 bg-[#0f0f13] items-center justify-between">
                                <div className="flex">
                                    {(["body", "headers"] as const).map(t => (
                                        <button key={t} onClick={() => setResTab(t)}
                                            className={`px-3 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${resTab === t ? "border-accent-purple text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}>{t}</button>
                                    ))}
                                </div>
                                {lastResponse && (
                                    <div className="flex items-center gap-3 pr-2">
                                        <span className="text-xs font-mono font-bold flex items-center gap-1" style={{ color: statusColor(lastResponse.statusCode) }}>
                                            {lastResponse.statusCode === 0 ? <><AlertCircle size={12} />Error</> : <><CheckCircle size={12} />{lastResponse.statusCode}</>}
                                        </span>
                                        <span className="text-xs text-text-muted">{lastResponse.durationMs}ms</span>
                                        <button onClick={() => { navigator.clipboard.writeText(tryFormatJson(lastResponse.responseBody)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                            className="p-1 rounded hover:bg-[#2a2a35] text-text-muted hover:text-text-main">
                                            {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto p-3">
                                {lastResponse
                                    ? <pre className="text-xs font-mono text-text-main whitespace-pre-wrap break-all">{resTab === "body" ? tryFormatJson(lastResponse.responseBody) : tryFormatJson(lastResponse.responseHeaders)}</pre>
                                    : <div className="flex items-center justify-center h-full text-text-muted text-xs flex-col gap-2"><Send size={24} className="opacity-20" /><p>Send a request to see the response.</p></div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm flex-col gap-3">
                    <Send size={32} className="opacity-20" />
                    <p>Create a new request or select one from the list.</p>
                    <button onClick={addRequest} className="px-4 py-2 bg-accent-purple text-white text-xs rounded-lg hover:bg-[#7c57d4] flex items-center gap-2"><Plus size={14} />New Request</button>
                </div>
            )}
        </div>
    );
}
