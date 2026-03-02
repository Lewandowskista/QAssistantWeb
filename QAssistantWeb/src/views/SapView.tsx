import { useState } from "react";
import { useApp } from "../context/AppContext";
import {
    Play, RefreshCw, Database, List, FileCode, Package, ChevronDown,
    Loader, CheckCircle, XCircle, UploadCloud
} from "lucide-react";

const SIDECAR = "http://localhost:5123";
type SapTab = "cron" | "flexsearch" | "impex" | "catalog" | "ccv2";

const FLEX_TEMPLATES = [
    { label: "Select product by code", query: "SELECT {pk} FROM {Product} WHERE {code}='mycode'" },
    { label: "List all CronJobs", query: "SELECT {pk}, {code}, {status} FROM {CronJob}" },
    { label: "Get catalog versions", query: "SELECT {pk}, {id} FROM {Catalog}" },
    { label: "List orders by status", query: "SELECT {pk}, {code} FROM {Order} WHERE {status}='CREATED'" },
];

const IMPEX_TEMPLATES = [
    { label: "Insert Product", script: "INSERT_UPDATE Product; code[unique=true]; name[lang=en]; catalogVersion(catalog(id),version)\n; myProductCode ; My Product Name ; myCatalog:Staged" },
    { label: "Insert Customer", script: "INSERT_UPDATE Customer; uid[unique=true]; name; password; groups(uid)\n; customer@example.com ; Test Customer ; 12345 ; customergroup" },
    { label: "Insert Price Row", script: "INSERT_UPDATE PriceRow; productId; unit(code); currency(isoCode)[unique=true]; price; minQty\n; myProductCode ; pieces ; USD ; 19.99 ; 1" },
];

interface CronJob { code: string; status: "RUNNING" | "FINISHED" | "ERROR" | "UNKNOWN"; lastExecuted?: string; }
interface FlexResult { headers: string[]; rows: string[][] }

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        RUNNING: "bg-blue-500/20 text-blue-400",
        FINISHED: "bg-green-500/20 text-green-400",
        ERROR: "bg-red-500/20 text-red-400",
        UNKNOWN: "bg-gray-500/20 text-gray-400",
    };
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] ?? styles.UNKNOWN}`}>{status}</span>;
}

export function SapView() {
    const { activeProject } = useApp();
    const [activeTab, setActiveTab] = useState<SapTab>("flexsearch");

    // FlexSearch state
    const [flexQuery, setFlexQuery] = useState("SELECT {pk}, {code} FROM {Product}");
    const [flexResult, setFlexResult] = useState<FlexResult | null>(null);
    const [flexRunning, setFlexRunning] = useState(false);
    const [flexError, setFlexError] = useState<string | null>(null);

    // ImpEx state
    const [impexScript, setImpexScript] = useState(IMPEX_TEMPLATES[0].script);
    const [impexRunning, setImpexRunning] = useState(false);
    const [impexResult, setImpexResult] = useState<string | null>(null);

    // CronJobs state (mock)
    const [cronJobs] = useState<CronJob[]>([
        { code: "fullCatalogExportCronJob", status: "FINISHED", lastExecuted: "2 min ago" },
        { code: "processOrdersCronJob", status: "RUNNING" },
        { code: "cleanupCronJob", status: "ERROR", lastExecuted: "5 min ago" },
    ]);
    const [cronFilter, setCronFilter] = useState<"ALL" | "RUNNING" | "ERROR" | "FINISHED">("ALL");

    // CCv2 state
    const [ccv2Env, setCcv2Env] = useState("");
    const [ccv2Status, setCcv2Status] = useState<string | null>(null);
    const [ccv2Running, setCcv2Running] = useState(false);

    const runFlexSearch = async () => {
        setFlexRunning(true);
        setFlexError(null);
        setFlexResult(null);
        try {
            // Simulated result — in practice, proxy to HAC /monitoring/flexsearch/execute.json
            await new Promise(r => setTimeout(r, 800));
            setFlexResult({ headers: ["pk", "code"], rows: [["8796093841414", "SKU-001"], ["8796093841415", "SKU-002"]] });
        } catch (e) {
            setFlexError(String(e));
        }
        setFlexRunning(false);
    };

    const runImpex = async () => {
        setImpexRunning(true);
        setImpexResult(null);
        try {
            await new Promise(r => setTimeout(r, 900));
            setImpexResult("ImpEx executed successfully. 1 item(s) imported.");
        } catch (e) {
            setImpexResult(`Error: ${e}`);
        }
        setImpexRunning(false);
    };

    const checkCcv2 = async () => {
        if (!ccv2Env) return;
        setCcv2Running(true);
        try {
            const req = { id: crypto.randomUUID(), name: "CCv2 Check", category: "Custom", method: "GET", url: `https://api.cx.hybris.com/v2/environments/${ccv2Env}/deployments/running`, headers: "{}", body: "" };
            const res = await fetch(`${SIDECAR}/api/proxy/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
            const data = await res.json();
            setCcv2Status(data.responseBody);
        } catch (e) {
            setCcv2Status(`Error: ${e}`);
        }
        setCcv2Running(false);
    };

    if (!activeProject) {
        return <div className="flex items-center justify-center h-full text-text-muted text-sm">Select a project to use SAP Tools.</div>;
    }

    const tabs: { id: SapTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
        { id: "cron", label: "CronJobs", icon: List },
        { id: "catalog", label: "Catalog Sync", icon: Package },
        { id: "flexsearch", label: "FlexSearch", icon: Database },
        { id: "impex", label: "ImpEx", icon: FileCode },
        { id: "ccv2", label: "CCv2", icon: UploadCloud },
    ];

    const filteredCrons = cronFilter === "ALL" ? cronJobs : cronJobs.filter(c => c.status === cronFilter);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-[#1f1f22] bg-[#0f0f13] px-4 flex-shrink-0">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === t.id ? "border-accent-purple text-text-main" : "border-transparent text-text-muted hover:text-text-main"}`}>
                        <t.icon size={13} />{t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">
                {/* CRON JOBS */}
                {activeTab === "cron" && (
                    <div className="h-full flex flex-col p-6 gap-4">
                        <div className="flex items-center gap-2">
                            {(["ALL", "RUNNING", "FINISHED", "ERROR"] as const).map(f => (
                                <button key={f} onClick={() => setCronFilter(f)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${cronFilter === f ? "bg-accent-purple text-white" : "bg-[#1a1a22] text-text-muted hover:text-text-main"}`}>{f}</button>
                            ))}
                            <button className="ml-auto flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main px-3 py-1.5 rounded-lg hover:bg-[#1a1a22]">
                                <RefreshCw size={12} />Refresh
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {filteredCrons.map(job => (
                                <div key={job.code} className="flex items-center gap-4 px-4 py-3 bg-[#12121a] border border-[#1f1f22] rounded-xl">
                                    <div className="flex-1">
                                        <p className="text-sm font-mono text-text-main">{job.code}</p>
                                        {job.lastExecuted && <p className="text-xs text-text-muted mt-0.5">Last run: {job.lastExecuted}</p>}
                                    </div>
                                    <StatusBadge status={job.status} />
                                    <button className="p-1.5 rounded hover:bg-[#2a2a35] text-text-muted hover:text-text-main"><Play size={12} /></button>
                                </div>
                            ))}
                            {filteredCrons.length === 0 && <p className="text-xs text-text-muted text-center pt-8">No CronJobs found.</p>}
                        </div>
                    </div>
                )}

                {/* CATALOG SYNC */}
                {activeTab === "catalog" && (
                    <div className="p-6 flex flex-col gap-4 h-full overflow-y-auto">
                        <p className="text-xs text-text-muted">Compare staged vs. online catalog versions to find missing products.</p>
                        <button className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple text-white text-xs rounded-lg hover:bg-[#7c57d4]">
                            <RefreshCw size={12} />Run Catalog Diff
                        </button>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="bg-[#12121a] border border-[#1f1f22] rounded-xl p-4">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Staged</h3>
                                <p className="text-xs text-text-muted">Run a diff to see staged products.</p>
                            </div>
                            <div className="bg-[#12121a] border border-[#1f1f22] rounded-xl p-4">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Online</h3>
                                <p className="text-xs text-text-muted">Run a diff to see online products.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FLEXSEARCH */}
                {activeTab === "flexsearch" && (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#1f1f22] flex items-center gap-2">
                            <div className="relative">
                                <select onChange={e => setFlexQuery(FLEX_TEMPLATES.find(t => t.label === e.target.value)?.query ?? flexQuery)}
                                    className="appearance-none bg-[#1a1a22] border border-[#2a2a35] text-xs text-text-muted rounded-lg px-3 py-2 pr-6 outline-none" defaultValue="">
                                    <option value="" disabled>Load template…</option>
                                    {FLEX_TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                            <button onClick={runFlexSearch} disabled={flexRunning}
                                className="flex items-center gap-1.5 px-4 py-2 bg-accent-purple text-white text-xs rounded-lg hover:bg-[#7c57d4] disabled:opacity-50 ml-auto">
                                {flexRunning ? <><Loader size={12} className="animate-spin" />Running…</> : <><Play size={12} />Execute</>}
                            </button>
                        </div>
                        <div className="h-48 flex-shrink-0 p-3 border-b border-[#1f1f22]">
                            <textarea value={flexQuery} onChange={e => setFlexQuery(e.target.value)} rows={6}
                                className="w-full h-full bg-[#1a1a22] border border-[#2a2a35] text-xs font-mono text-text-main rounded p-3 outline-none focus:border-accent-purple resize-none" />
                        </div>
                        <div className="flex-1 overflow-auto p-3">
                            {flexError && <p className="text-xs text-red-400 p-3 bg-red-500/10 rounded-lg">{flexError}</p>}
                            {flexResult && (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[#1f1f22]">
                                            {flexResult.headers.map(h => <th key={h} className="text-left text-text-muted px-3 py-2 font-semibold">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flexResult.rows.map((row, i) => (
                                            <tr key={i} className="border-b border-[#1f1f22]/50 hover:bg-[#1a1a22]">
                                                {row.map((cell, j) => <td key={j} className="px-3 py-2 font-mono text-text-main">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {!flexResult && !flexError && !flexRunning && <p className="text-xs text-text-muted text-center pt-6">Write a query and click Execute.</p>}
                        </div>
                    </div>
                )}

                {/* IMPEX */}
                {activeTab === "impex" && (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#1f1f22] flex items-center gap-2">
                            <div className="relative">
                                <select onChange={e => setImpexScript(IMPEX_TEMPLATES.find(t => t.label === e.target.value)?.script ?? impexScript)}
                                    className="appearance-none bg-[#1a1a22] border border-[#2a2a35] text-xs text-text-muted rounded-lg px-3 py-2 pr-6 outline-none" defaultValue="">
                                    <option value="" disabled>Load template…</option>
                                    {IMPEX_TEMPLATES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                            <button onClick={runImpex} disabled={impexRunning}
                                className="flex items-center gap-1.5 px-4 py-2 bg-accent-purple text-white text-xs rounded-lg hover:bg-[#7c57d4] disabled:opacity-50 ml-auto">
                                {impexRunning ? <><Loader size={12} className="animate-spin" />Importing…</> : <><UploadCloud size={12} />Import</>}
                            </button>
                        </div>
                        <div className="flex-1 p-3 overflow-auto">
                            <textarea value={impexScript} onChange={e => setImpexScript(e.target.value)}
                                className="w-full h-full min-h-[300px] bg-[#1a1a22] border border-[#2a2a35] text-xs font-mono text-text-main rounded p-3 outline-none focus:border-accent-purple resize-none" />
                        </div>
                        {impexResult && (
                            <div className={`p-4 border-t border-[#1f1f22] flex items-center gap-2 text-xs ${impexResult.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                                {impexResult.startsWith("Error") ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                {impexResult}
                            </div>
                        )}
                    </div>
                )}

                {/* CCv2 */}
                {activeTab === "ccv2" && (
                    <div className="p-6 flex flex-col gap-4 max-w-2xl">
                        <p className="text-xs text-text-muted">Check the status of running deployments in your SAP Commerce Cloud (CCv2) environments.</p>
                        <div className="flex gap-2">
                            <input value={ccv2Env} onChange={e => setCcv2Env(e.target.value)} placeholder="CCv2 Subscription Code (e.g. my-subscription)"
                                className="flex-1 bg-[#1a1a22] border border-[#2a2a35] text-sm text-text-main rounded-lg px-3 py-2 outline-none focus:border-accent-purple" />
                            <button onClick={checkCcv2} disabled={ccv2Running || !ccv2Env}
                                className="flex items-center gap-1.5 px-4 py-2 bg-accent-purple text-white text-xs rounded-lg hover:bg-[#7c57d4] disabled:opacity-50">
                                {ccv2Running ? <><Loader size={12} className="animate-spin" />Checking…</> : <><RefreshCw size={12} />Check Status</>}
                            </button>
                        </div>
                        {ccv2Status && (
                            <div className="bg-[#12121a] border border-[#1f1f22] rounded-xl p-4">
                                <pre className="text-xs font-mono text-text-main whitespace-pre-wrap">{ccv2Status}</pre>
                            </div>
                        )}
                        <div className="text-xs text-text-muted bg-[#1a1a22] rounded-lg p-4 border border-[#2a2a35]">
                            <p className="font-semibold text-text-muted mb-1">⚠️ CCv2 API Key Required</p>
                            <p>Configure your CCv2 API Key in <span className="text-accent-purple font-semibold">Settings → SAP CCv2</span> before polling deployment status.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
