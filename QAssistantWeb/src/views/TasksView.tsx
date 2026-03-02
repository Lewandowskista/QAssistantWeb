import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

const COLUMNS = [
    { id: 0, title: "Backlog" },
    { id: 1, title: "Todo" },
    { id: 2, title: "In Progress" },
    { id: 3, title: "In Review" },
    { id: 4, title: "Done" },
    { id: 5, title: "Canceled" },
    { id: 6, title: "Duplicate" },
];

export function TasksView() {
    const { activeProject } = useApp();
    const [source, setSource] = useState<"manual" | "linear" | "jira">("manual");
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeProject) return;
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:5123/api/tasks?source=${source}&projectId=${activeProject.id}`);
                const data = await res.json();
                setTasks(data);
            } catch (e) {
                console.error("Failed to load tasks", e);
            }
            setLoading(false);
        };
        fetchTasks();
    }, [activeProject, source]);

    if (!activeProject) return <div className="p-8 text-text-muted">No project selected.</div>;

    return (
        <div className="flex flex-col h-full bg-bg-base">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-surface shrink-0">
                <h2 className="text-lg font-medium text-white">Board</h2>
                <div className="flex items-center gap-2 bg-bg-base p-1 rounded-md border border-border-subtle">
                    {(["manual", "linear", "jira"] as const).map(src => (
                        <button
                            key={src}
                            className={`px-3 py-1 rounded text-sm transition-colors ${source === src ? "bg-bg-surface-hover text-white shadow" : "text-text-muted hover:text-white"
                                }`}
                            onClick={() => setSource(src)}
                        >
                            <span className="capitalize">{src}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">Loading tasks...</div>
                ) : (
                    COLUMNS.map(col => (
                        <div key={col.id} className="w-72 flex-shrink-0 flex flex-col max-h-full">
                            <div className="flex items-center justify-between mb-3 text-sm font-medium text-text-muted px-1">
                                <span className="uppercase tracking-wider text-xs">{col.title}</span>
                                <span className="bg-bg-surface px-2 py-0.5 rounded-full text-xs">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 pb-8">
                                {tasks.filter(t => t.status === col.id).map(task => (
                                    <div key={task.id} className="bg-bg-surface border border-border-subtle rounded-md p-3 shadow-sm hover:border-brand transition-colors group cursor-grab">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs font-mono text-text-muted bg-bg-base px-1.5 py-0.5 rounded">
                                                {task.issueIdentifier || task.externalId?.substring(0, 8) || "TASK"}
                                            </span>
                                        </div>
                                        <h3 className="text-sm text-text-main font-medium leading-snug">{task.title}</h3>
                                        <div className="mt-3 flex items-center gap-2">
                                            {task.priority === 3 && <span className="w-2 h-2 rounded-full bg-accent-rose"></span>}
                                            {task.priority === 2 && <span className="w-2 h-2 rounded-full bg-accent-amber"></span>}
                                            {task.priority === 1 && <span className="w-2 h-2 rounded-full bg-brand"></span>}
                                            {task.priority === 0 && <span className="w-2 h-2 rounded-full bg-text-muted"></span>}

                                            {task.assignee && (
                                                <div className="w-5 h-5 rounded-full bg-bg-base border border-border-subtle flex items-center justify-center text-[10px] ml-auto text-text-muted" title={task.assignee}>
                                                    {task.assignee.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
