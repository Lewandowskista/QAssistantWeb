import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
    CheckSquare, AlertTriangle, TrendingUp, Bug, Clock, FileText,
    BarChart2, ListChecks
} from "lucide-react";

interface Metric { label: string; value: string | number; sub?: string; color: string; icon: React.ComponentType<{ size?: number }> }

export function DashboardView() {
    const { activeProject } = useApp();
    const projectName = activeProject?.name ?? "No Project Selected";

    const metrics: Metric[] = useMemo(() => [
        { label: "Open Tasks", value: 0, sub: "0 are Blockers", color: "#60a5fa", icon: CheckSquare },
        { label: "Test Pass Rate", value: "—", sub: "No runs recorded", color: "#34d399", icon: TrendingUp },
        { label: "Failing Tests", value: 0, sub: "From latest run", color: "#f87171", icon: Bug },
        { label: "Overdue Items", value: 0, sub: "Past due date", color: "#f59e0b", icon: AlertTriangle },
    ], []);

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-full text-text-muted text-sm flex-col gap-3">
                <BarChart2 size={40} className="opacity-20" />
                <p>Select a project to see its dashboard.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-[#1f1f22]">
                <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Dashboard</p>
                <h1 className="text-2xl font-bold text-text-main">{projectName}</h1>
                <p className="text-text-muted text-sm mt-1">Project overview and health summary</p>
            </div>

            <div className="p-8 space-y-8 flex-1">
                {/* Metric Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {metrics.map(m => (
                        <MetricCard key={m.label} {...m} />
                    ))}
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-2 gap-6">
                    <Section title="Task Status" icon={CheckSquare}>
                        <StatusRow label="Backlog" count={0} total={1} color="#4b5563" />
                        <StatusRow label="In Progress" count={0} total={1} color="#60a5fa" />
                        <StatusRow label="In Review" count={0} total={1} color="#f59e0b" />
                        <StatusRow label="Done" count={0} total={1} color="#34d399" />
                        <StatusRow label="Blocked" count={0} total={1} color="#f87171" />
                    </Section>

                    <Section title="Project Info" icon={FileText}>
                        <InfoRow label="Project ID" value={activeProject.id.slice(0, 8) + "…"} />
                        <InfoRow label="Color" value={
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: activeProject.color }} />
                                {activeProject.color}
                            </span>
                        } />
                        <InfoRow label="Description" value={activeProject.description || "No description"} />
                    </Section>

                    <Section title="Upcoming Due Dates" icon={Clock}>
                        <EmptyState label="No items with due dates" />
                    </Section>

                    <Section title="Recent Test Activity" icon={ListChecks}>
                        <EmptyState label="No test runs recorded yet" />
                    </Section>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, sub, color, icon: Icon }: Metric) {
    return (
        <div className="bg-[#12121a] border border-[#1f1f22] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2a2a35] transition-colors">
            <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
                    <Icon size={14} />
                </div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-text-muted">{sub}</p>}
        </div>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number }>; children: React.ReactNode }) {
    return (
        <div className="bg-[#12121a] border border-[#1f1f22] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2">
                <Icon size={14} />
                {title}
            </h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function StatusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-24 flex-shrink-0">{label}</span>
            <div className="flex-1 bg-[#1a1a22] rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs text-text-muted w-6 text-right">{count}</span>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <span className="text-text-muted w-28 flex-shrink-0">{label}</span>
            <span className="text-text-main">{value}</span>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return <p className="text-xs text-text-muted text-center py-4">{label}</p>;
}
