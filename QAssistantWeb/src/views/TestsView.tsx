import { useState, useMemo } from "react";
import { Button } from "../components/ui/Button";
import { useApp, TestPlan, TestCase, TestExecution, ProjectTask } from "../context/AppContext";
import {
    Plus, Trash2, FileText, ChevronDown, ChevronRight, Play,
    Activity, Archive, ArchiveRestore, Copy, Edit2, Upload, RotateCcw, Bug
} from "lucide-react";

const TABS = ["Test Case Generation", "Test Runs", "Reports", "Coverage Matrix", "Regression Builder"];

// Helper components for UI badges
const PriorityBadge = ({ p }: { p: number }) => {
    switch (p) {
        case 0: return <span className="bg-[#1f2937] text-gray-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">LOW</span>;
        case 1: return <span className="bg-[#312e81] text-indigo-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">MEDIUM</span>;
        case 2: return <span className="bg-[#7c2d12] text-orange-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">HIGH</span>;
        case 3: return <span className="bg-[#7f1d1d] text-red-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">BLOCKER</span>;
        default: return null;
    }
};

const StatusBadge = ({ s }: { s: number }) => {
    switch (s) {
        case 0: return <span className="bg-[#1f2937] text-gray-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">NOT RUN</span>;
        case 1: return <span className="bg-[#064e3b] text-emerald-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">PASSED</span>;
        case 2: return <span className="bg-[#7f1d1d] text-red-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">FAILED</span>;
        case 3: return <span className="bg-[#7c2d12] text-orange-400 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">BLOCKED</span>;
        case 4: return <span className="bg-[#374151] text-gray-300 px-2 py-1 rounded text-[10px] font-semibold tracking-wider">SKIPPED</span>;
        default: return null;
    }
};

const StatusDot = ({ status }: { status: number }) => {
    switch (status) {
        case 1: return <div className="w-2 h-2 rounded-full bg-emerald-400" />;
        case 2: return <div className="w-2 h-2 rounded-full bg-red-400" />;
        case 3: return <div className="w-2 h-2 rounded-full bg-orange-400" />;
        case 4: return <div className="w-2 h-2 rounded-full bg-gray-400" />;
        default: return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
};

const SourceTypeLabel = ({ source }: { source: number }) => {
    const labels = ["Manual", "Linear", "Jira", "CSV"];
    return <span>{labels[source] || "Unknown"}</span>;
};

export function TestsView() {
    const { activeProject, refreshProjects } = useApp();
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    // AI Generation State
    const [genSource, setGenSource] = useState("Linear");
    const [fetchedTasks, setFetchedTasks] = useState<ProjectTask[]>([]);

    // View Filters
    const [viewFilter, setViewFilter] = useState("AllPlans"); // AllPlans, RegressionSuites
    const [showArchived, setShowArchived] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<number | null>(null); // null = All, 0, 1, 2...

    // UI State
    const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

    const addLog = (msg: string) => setStatusMsg(msg);
    const togglePlan = (id: string) => setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));

    const handleFetchTasks = async () => {
        if (!activeProject) return;
        setLoading(true);
        addLog(`Fetching issues from ${genSource}...`);
        try {
            const res = await fetch(`http://localhost:5123/api/tasks?source=${genSource.toLowerCase()}&projectId=${activeProject.id}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setFetchedTasks(data);
            addLog(`Fetched ${data.length} issues.`);
        } catch (e: any) {
            addLog(`Error fetching issues: ${e.message}`);
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!activeProject || fetchedTasks.length === 0) return;
        setLoading(true);
        addLog(`Generating test cases via Gemini from ${fetchedTasks.length} ${genSource} issues...`);
        try {
            const res = await fetch("http://localhost:5123/api/ai/generate-test-cases", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasks: fetchedTasks, sourceName: genSource })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            // Auto-create a Test Plan for these cases
            const sourceCode = genSource === "Jira" ? 2 : genSource === "Linear" ? 1 : 0;
            const pRes = await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testplans`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testPlanId: `TP-${Date.now().toString().slice(-4)}`,
                    name: `${genSource} \u00B7 ${new Date().toLocaleTimeString()}`,
                    description: `Auto-generated from ${fetchedTasks.length} ${genSource} issue(s).`,
                    source: sourceCode,
                    isArchived: false,
                    isRegressionSuite: false
                })
            });
            const plan = await pRes.json();

            let tcCount = 0;
            for (const tc of data.testCases) {
                tc.testPlanId = plan.id;
                await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testcases`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tc)
                });
                tcCount++;
            }

            addLog(`Generated ${tcCount} test cases in ${plan.testPlanId} \u00B7 ${new Date().toLocaleTimeString()}`);
            await refreshProjects();
        } catch (e: any) {
            addLog("Generation failed: " + e.message);
        }
        setLoading(false);
    };

    const handleCreatePlan = async () => {
        if (!activeProject) return;
        const title = prompt("Enter Test Plan Name:");
        if (!title) return;

        setLoading(true);
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testplans`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testPlanId: `TP-${Date.now().toString().slice(-4)}`,
                    name: title,
                    description: "",
                    source: 0,
                    isArchived: false,
                    isRegressionSuite: false
                })
            });
            await refreshProjects();
            addLog(`Created new generic test plan ${title}`);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleDeletePlan = async (planId: string) => {
        if (!activeProject || !confirm("Delete this test plan? This action cannot be undone.")) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testplans/${planId}`, { method: "DELETE" });
            await refreshProjects();
        } catch (e) { console.error(e); }
    };

    const handleDeleteTestCase = async (tcId: string) => {
        if (!activeProject || !confirm("Delete this test case?")) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testcases/${tcId}`, { method: "DELETE" });
            await refreshProjects();
        } catch (e) { console.error(e); }
    };

    const handleArchivePlan = async (plan: TestPlan) => {
        if (!activeProject) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testplans/${plan.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...plan, isArchived: !plan.isArchived })
            });
            await refreshProjects();
        } catch (e) { console.error(e); }
    };

    const handleExecuteTestCase = async (tc: TestCase, plan: TestPlan) => {
        // Just mock updating status to PASSED for UI demonstration (1)
        if (!activeProject) return;
        const status = prompt(`Execute Test Case ${tc.testCaseId}\nEnter Status (0=NotRun, 1=Passed, 2=Failed, 3=Blocked, 4=Skipped):`, "1");
        const statusInt = parseInt(status || "1", 10);

        try {
            // Update the test case status directly
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testcases/${tc.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...tc, status: statusInt, actualResult: "Automatically recorded by quick-execute." })
            });

            // Log an execution
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testexecutions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    executionId: `TE-${Date.now().toString().slice(-4)}`,
                    testCaseId: tc.id,
                    testPlanId: plan.id,
                    result: statusInt,
                    actualResult: "Automatically recorded by quick-execute.",
                    executedAt: new Date().toISOString()
                })
            });

            await refreshProjects();
        } catch (e) { console.error(e); }
    };

    // Derived states
    const visiblePlans = useMemo(() => {
        let plans = activeProject?.testPlans || [];
        if (viewFilter === "RegressionSuites") plans = plans.filter(p => p.isRegressionSuite);
        if (!showArchived) plans = plans.filter(p => !p.isArchived);
        if (sourceFilter !== null) plans = plans.filter(p => p.source === sourceFilter);

        // Sort newest first roughly based on string ID parsing
        return plans.sort((a, b) => b.testPlanId.localeCompare(a.testPlanId));
    }, [activeProject, viewFilter, showArchived, sourceFilter]);

    return (
        <div className="flex flex-col h-full bg-bg-base font-sans text-sm text-text-main">
            {/* Top Tabs aligned with XAML Subtabs Toolbar */}
            <div className="flex border-b border-border-subtle bg-bg-surface px-6 pt-3 shrink-0 overflow-x-auto gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[13px] font-medium whitespace-nowrap rounded-t-md transition-colors ${activeTab === tab ? "bg-bg-surface-hover text-brand border-b-2 border-brand" : "text-text-muted hover:text-white"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === "Test Case Generation" ? (
                    <div className="flex flex-col h-full">

                        {/* Row 0 Toolbar: Primary Generation */}
                        <div className="px-6 py-3 bg-bg-surface border-b border-border-subtle flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-text-muted tracking-[0.15em]">SOURCE</span>
                                <select
                                    value={genSource}
                                    onChange={(e) => setGenSource(e.target.value)}
                                    className="bg-[#252535] border border-[#2A2A3A] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none min-w-[120px]"
                                >
                                    <option>Linear</option>
                                    <option>Jira</option>
                                </select>
                                <Button variant="brand" className="py-1.5" onClick={() => { handleFetchTasks().then(handleGenerate); }} disabled={loading}>
                                    Generate Test Cases
                                </Button>
                                <span className="text-xs text-text-muted">{statusMsg}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-text-muted tracking-[0.15em]">VIEW</span>
                                <select
                                    value={viewFilter}
                                    onChange={(e) => setViewFilter(e.target.value)}
                                    className="bg-[#252535] border border-[#2A2A3A] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none min-w-[160px]"
                                >
                                    <option value="AllPlans">All Plans</option>
                                    <option value="RegressionSuites">Regression Suites</option>
                                </select>
                                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-text-muted hover:text-white">
                                    <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded border-border-subtle bg-bg-base text-brand focus:ring-brand accent-brand" />
                                    Show Archived
                                </label>
                            </div>
                        </div>

                        {/* Row 1 Toolbar: Secondary Actions */}
                        <div className="px-6 py-2 bg-bg-surface border-b border-border-subtle flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-bold text-text-muted tracking-[0.15em] mr-1">SOURCE</span>
                            <div className="flex items-center gap-1 mr-2">
                                <button onClick={() => setSourceFilter(null)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${sourceFilter === null ? 'bg-brand/10 text-brand' : 'text-text-muted hover:bg-bg-base'}`}>All</button>
                                <button onClick={() => setSourceFilter(2)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${sourceFilter === 2 ? 'bg-brand/10 text-brand' : 'text-text-muted hover:bg-bg-base'}`}>Jira</button>
                                <button onClick={() => setSourceFilter(1)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${sourceFilter === 1 ? 'bg-brand/10 text-brand' : 'text-text-muted hover:bg-bg-base'}`}>Linear</button>
                                <button onClick={() => setSourceFilter(0)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${sourceFilter === 0 ? 'bg-brand/10 text-brand' : 'text-text-muted hover:bg-bg-base'}`}>Manual</button>
                            </div>

                            <div className="w-[1px] h-4 bg-border-subtle mx-1" />

                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-muted hover:bg-bg-base transition-colors">
                                <Upload className="w-3.5 h-3.5" /> Import CSV
                            </button>
                            <button onClick={handleCreatePlan} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-muted hover:bg-bg-base transition-colors">
                                <Plus className="w-3.5 h-3.5" /> New Plan
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-muted hover:bg-bg-base transition-colors">
                                <FileText className="w-3.5 h-3.5" /> Design Doc
                            </button>
                        </div>

                        {/* Scrollable Plans Container */}
                        <div className="flex-1 p-6 space-y-4">
                            {!activeProject?.testPlans || activeProject.testPlans.length === 0 ? (
                                <div className="mt-20 flex flex-col items-center justify-center space-y-3">
                                    <ArchiveRestore className="w-10 h-10 text-text-muted/50" />
                                    <h3 className="text-sm font-medium text-text-muted">No test plans yet</h3>
                                    <p className="text-xs text-text-muted/70 max-w-sm text-center">Select a source and click Generate to create test cases organized into a test plan</p>
                                </div>
                            ) : visiblePlans.map(plan => {
                                const cases = activeProject?.testCases?.filter(tc => tc.testPlanId === plan.id) || [];
                                const isCollapsed = expandedPlans[plan.id];

                                // Calculate status summary dots
                                const statusCounts = cases.reduce((acc, tc) => { acc[tc.status] = (acc[tc.status] || 0) + 1; return acc; }, {} as Record<number, number>);

                                return (
                                    <div key={plan.id} className={`bg-[#13131a] rounded-xl border border-[#2a2a3a] p-4 ${plan.isArchived ? 'opacity-60' : ''}`}>

                                        {/* Plan Card Header */}
                                        <div className="flex items-center justify-between">
                                            <button
                                                className="flex-1 flex items-center text-left"
                                                onClick={() => togglePlan(plan.id)}
                                            >
                                                <div className="text-brand mr-3">
                                                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-brand">{plan.testPlanId}</span>
                                                    <span className="text-sm font-semibold text-white">{plan.name}</span>
                                                    <span className="bg-[#1e1e32] text-gray-400 px-2 py-0.5 rounded text-[10px]">{cases.length} case(s)</span>
                                                    {plan.isArchived && <span className="bg-[#2d2010] text-[#fbbf24] px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider">ARCHIVED</span>}
                                                </div>

                                                {/* Dots Summary */}
                                                <div className="ml-6 flex gap-3">
                                                    {Object.entries(statusCounts).map(([status, count]) => (
                                                        <div key={status} className="flex items-center gap-1.5">
                                                            <StatusDot status={parseInt(status)} />
                                                            <span className="text-[10px] text-gray-500">{count} {["NotRun", "Passed", "Failed", "Blocked", "Skipped"][parseInt(status)]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>

                                            {/* Plan Actions Toolbar */}
                                            <div className="flex items-center gap-1 ml-4 opactiy-80">
                                                <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-white" title="Run all"><Play className="w-[14px] h-[14px]" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-white" title="Reset all"><RotateCcw className="w-[14px] h-[14px]" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-white" title="Duplicate"><Copy className="w-[14px] h-[14px]" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-white" title="Rename"><Edit2 className="w-[14px] h-[14px]" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleArchivePlan(plan)} className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-white" title="Archive">
                                                    {plan.isArchived ? <ArchiveRestore className="w-[14px] h-[14px]" /> : <Archive className="w-[14px] h-[14px]" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)} className="w-7 h-7 hover:bg-bg-base text-gray-400 hover:text-red-400" title="Delete"><Trash2 className="w-[14px] h-[14px]" /></Button>
                                            </div>
                                        </div>

                                        {/* Collapsible Body */}
                                        {!isCollapsed && (
                                            <div className="mt-4 ml-6 space-y-3">
                                                {cases.map(tc => (
                                                    <div key={tc.id} className="bg-[#1a1a24] rounded-lg border border-[#2a2a3a] p-4 text-[13px]">
                                                        {/* Target Card Header Row */}
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 pr-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-mono text-brand font-semibold">{tc.testCaseId}</span>
                                                                    <span className="text-white font-semibold text-[13px]">{tc.title}</span>
                                                                </div>
                                                                <div className="font-mono text-[10px] text-gray-500">{tc.testCaseId} → {plan.testPlanId}</div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button variant="surface" size="sm" onClick={() => handleExecuteTestCase(tc, plan)} className="bg-[#252535] text-emerald-400 border border-[#2a2a3a] text-xs h-7 hover:bg-[#2a2a3a]">
                                                                    Execute
                                                                </Button>
                                                                <PriorityBadge p={tc.priority} />
                                                                <StatusBadge s={tc.status} />
                                                                <Button onClick={() => handleDeleteTestCase(tc.id)} variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-red-400 ml-1">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="h-[1px] bg-[#2a2a3a] my-3" />

                                                        {/* Fields */}
                                                        <div className="space-y-3">
                                                            {tc.preConditions && (
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-text-muted tracking-[0.15em] mb-1">PRE-CONDITIONS</div>
                                                                    <div className="text-gray-300 font-mono text-[12px] whitespace-pre-wrap">{tc.preConditions}</div>
                                                                </div>
                                                            )}
                                                            {tc.testSteps && (
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-text-muted tracking-[0.15em] mb-1">TEST STEPS</div>
                                                                    <div className="text-gray-300 font-mono text-[12px] whitespace-pre-wrap">{tc.testSteps}</div>
                                                                </div>
                                                            )}
                                                            {tc.testData && (
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-text-muted tracking-[0.15em] mb-1">TEST DATA</div>
                                                                    <div className="text-gray-300 font-mono text-[12px] whitespace-pre-wrap">{tc.testData}</div>
                                                                </div>
                                                            )}
                                                            {tc.expectedResult && (
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-text-muted tracking-[0.15em] mb-1">EXPECTED RESULT</div>
                                                                    <div className="text-gray-300 font-mono text-[12px] whitespace-pre-wrap">{tc.expectedResult}</div>
                                                                </div>
                                                            )}
                                                            {tc.actualResult && (
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-text-muted tracking-[0.15em] mb-1">ACTUAL RESULT</div>
                                                                    <div className="text-[#9ca3af] font-mono text-[12px] whitespace-pre-wrap bg-bg-base/50 p-2 rounded border border-border-subtle">{tc.actualResult}</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className="flex items-center justify-between mt-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-[#1e1e32] px-2 py-0.5 rounded text-brand text-[10px]">
                                                                    <SourceTypeLabel source={tc.source} />
                                                                </div>
                                                                <span className="text-gray-500 text-[10px]">{new Date(tc.generatedAt).toLocaleString()}</span>
                                                            </div>
                                                            <Button variant="surface" size="sm" className="h-7 text-[11px] bg-[#14281c] text-emerald-400 border border-[#1e3c28]">
                                                                <Bug className="w-3 h-3 mr-1.5" /> Bug Report
                                                            </Button>
                                                        </div>

                                                    </div>
                                                ))}

                                                <button className="flex items-center gap-2 text-brand text-[11px] font-medium ml-2 hover:text-white transition-colors">
                                                    <Plus className="w-3.5 h-3.5" /> Add Test Case
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : activeTab === "Test Runs" ? (
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-3 bg-bg-surface border-b border-border-subtle flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold text-text-muted tracking-[0.15em]">EXECUTION HISTORY</span>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-text-muted hover:text-white">
                                    <input type="checkbox" className="rounded border-border-subtle bg-bg-base text-brand focus:ring-brand accent-brand" />
                                    Show Archived
                                </label>
                                <span className="text-xs text-text-muted">{activeProject?.testExecutions?.length || 0} execution(s)</span>
                            </div>
                        </div>

                        <div className="flex-1 p-6 space-y-4">
                            {!activeProject?.testExecutions || activeProject.testExecutions.length === 0 ? (
                                <div className="mt-20 flex flex-col items-center justify-center space-y-3">
                                    <Activity className="w-10 h-10 text-text-muted/50" />
                                    <h3 className="text-sm font-medium text-text-muted">No test executions yet</h3>
                                    <p className="text-xs text-text-muted/70 max-w-sm text-center">Execute test cases from the Test Case Generation tab to see history here</p>
                                </div>
                            ) : (
                                <div className="bg-[#13131a] rounded-xl border border-[#2a2a3a] p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-brand" />
                                        <span className="font-semibold text-white">Execution Groupings</span>
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-text-muted uppercase border-b border-[#2a2a3a]">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Execution ID</th>
                                                <th className="px-4 py-3 font-medium">Test Case</th>
                                                <th className="px-4 py-3 font-medium">Result</th>
                                                <th className="px-4 py-3 font-medium">Executed At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2a3a]">
                                            {activeProject?.testExecutions?.map((exec: TestExecution) => {
                                                const tc = activeProject.testCases?.find(t => t.id === exec.testCaseId);
                                                return (
                                                    <tr key={exec.id} className="hover:bg-[#1a1a24] transition-colors">
                                                        <td className="px-4 py-3 font-mono text-xs text-text-muted">{exec.executionId}</td>
                                                        <td className="px-4 py-3 font-medium text-white">{tc?.title || "Unknown logic"}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <StatusDot status={exec.result} />
                                                                <span className="text-xs">{["Not Run", "Passed", "Failed", "Blocked", "Skipped"][exec.result]}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-text-muted text-xs">{new Date(exec.executedAt).toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-text-muted space-y-4">
                        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center">
                            <span className="text-2xl opacity-50">🚧</span>
                        </div>
                        <h3 className="text-xl font-medium text-white">{activeTab}</h3>
                        <p className="text-center max-w-md">Analytics and matrices for {activeTab} will reside here to complete feature parity.</p>
                        <Button variant="surface">Open Original Desktop App</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
