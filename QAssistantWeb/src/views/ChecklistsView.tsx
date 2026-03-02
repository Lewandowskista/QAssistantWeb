import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { CheckSquare, Circle, Plus, Trash2 } from "lucide-react";
import { useApp, ChecklistTemplate, ChecklistItem } from "../context/AppContext";

export function ChecklistsView() {
    const { activeProject, refreshProjects } = useApp();
    const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);

    // Create new checklist state
    const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
    const [newChecklistName, setNewChecklistName] = useState("");

    // Create new item state
    const [isCreatingItem, setIsCreatingItem] = useState(false);
    const [newItemText, setNewItemText] = useState("");
    const [newItemPriority, setNewItemPriority] = useState<number>(1);
    const [newItemNotes, setNewItemNotes] = useState("");

    // Set first checklist as active initially
    useEffect(() => {
        if (activeProject?.checklists?.length && !activeChecklistId) {
            setActiveChecklistId(activeProject.checklists[0].id);
        } else if (!activeProject?.checklists?.length) {
            setActiveChecklistId(null);
        }
    }, [activeProject, activeChecklistId]);

    const handleCreateChecklist = async () => {
        if (!activeProject || !newChecklistName.trim()) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/checklists`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newChecklistName,
                    description: "",
                    category: "General",
                    isBuiltIn: false,
                    items: []
                })
            });
            setNewChecklistName("");
            setIsCreatingChecklist(false);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!activeProject) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/checklists/${checklistId}`, { method: "DELETE" });
            if (activeChecklistId === checklistId) setActiveChecklistId(null);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateItem = async () => {
        if (!activeProject || !activeChecklistId || !newItemText.trim()) return;
        try {
            const activeChecklist = activeProject.checklists?.find(c => c.id === activeChecklistId);
            if (!activeChecklist) return;

            const newItem: ChecklistItem = {
                id: crypto.randomUUID(),
                text: newItemText,
                isChecked: false,
                notes: newItemNotes,
                priority: newItemPriority as any
            };

            const updatedItems = [...(activeChecklist.items || []), newItem];
            const updatedChecklist = { ...activeChecklist, items: updatedItems };

            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/checklists/${activeChecklistId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedChecklist)
            });

            setNewItemText("");
            setNewItemNotes("");
            setNewItemPriority(1);
            setIsCreatingItem(false);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleItem = async (itemId: string) => {
        if (!activeProject || !activeChecklistId) return;
        try {
            const activeChecklist = activeProject.checklists?.find(c => c.id === activeChecklistId);
            if (!activeChecklist || !activeChecklist.items) return;

            const updatedItems = activeChecklist.items.map(i =>
                i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
            );

            const updatedChecklist = { ...activeChecklist, items: updatedItems };

            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/checklists/${activeChecklistId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedChecklist)
            });

            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!activeProject || !activeChecklistId) return;
        try {
            const activeChecklist = activeProject.checklists?.find(c => c.id === activeChecklistId);
            if (!activeChecklist || !activeChecklist.items) return;

            const updatedItems = activeChecklist.items.filter(i => i.id !== itemId);
            const updatedChecklist = { ...activeChecklist, items: updatedItems };

            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/checklists/${activeChecklistId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedChecklist)
            });

            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const calculateProgress = (items?: ChecklistItem[]) => {
        if (!items || items.length === 0) return 0;
        return Math.round((items.filter(i => i.isChecked).length / items.length) * 100);
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 3: return "text-accent-rose bg-accent-rose/10"; // Blocker
            case 2: return "text-orange-400 bg-orange-500/10"; // High
            case 0: return "text-gray-400 bg-gray-500/10"; // Low
            default: return "text-blue-400 bg-blue-500/10"; // Normal
        }
    };
    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 3: return "Blocker";
            case 2: return "High";
            case 0: return "Low";
            default: return "Normal";
        }
    };

    const activeChecklist = activeProject?.checklists?.find(c => c.id === activeChecklistId);
    const items = activeChecklist?.items || [];
    const progress = calculateProgress(items);

    return (
        <div className="flex h-full bg-bg-base">
            <div className="w-64 border-r border-border-subtle bg-bg-surface shrink-0 flex flex-col">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-surface sticky top-0 z-10">
                    <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Checklists</h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingChecklist(!isCreatingChecklist)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                {isCreatingChecklist && (
                    <div className="p-2 border-b border-border-subtle flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-bg-base border border-border-subtle rounded px-2 py-1 text-xs outline-none focus:border-brand"
                            placeholder="Checklist name..."
                            value={newChecklistName}
                            onChange={(e) => setNewChecklistName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateChecklist();
                                }
                            }}
                        />
                        <Button variant="brand" size="sm" onClick={handleCreateChecklist} className="px-2">Add</Button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {activeProject?.checklists?.map((c: ChecklistTemplate) => {
                        const cProg = calculateProgress(c.items);
                        return (
                            <div key={c.id} className="group flex items-center justify-between">
                                <button
                                    onClick={() => setActiveChecklistId(c.id)}
                                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left truncate ${activeChecklistId === c.id ? "bg-bg-surface-hover text-brand font-medium shadow-sm" : "text-text-muted hover:text-text-main hover:bg-bg-surface-hover/50"
                                        }`}
                                >
                                    <span className="truncate">{c.name}</span>
                                    {cProg === 100 && <span className="text-[10px] bg-brand/20 text-brand px-1.5 py-0.5 rounded ml-auto">Done</span>}
                                </button>
                                <button
                                    onClick={() => handleDeleteChecklist(c.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                    {(!activeProject?.checklists || activeProject.checklists.length === 0) && (
                        <div className="p-3 text-xs text-text-muted text-center">No checklists found.</div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {activeChecklist ? (
                    <div className="max-w-3xl">
                        <div className="mb-8 flex items-end justify-between">
                            <div className="flex-1 pr-8">
                                <h1 className="text-2xl font-bold mb-2">{activeChecklist.name}</h1>
                                {activeChecklist.description && <p className="text-sm text-text-muted mb-4">{activeChecklist.description}</p>}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                                        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-brand">{progress}%</span>
                                </div>
                            </div>
                            <Button variant="brand" onClick={() => setIsCreatingItem(!isCreatingItem)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                        </div>

                        {isCreatingItem && (
                            <div className="mb-6 bg-bg-surface border border-brand/50 rounded-lg p-4 space-y-3">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Task description..."
                                        className="flex-1 bg-bg-base border border-border-subtle rounded-md px-3 py-2 text-sm outline-none focus:border-brand"
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        autoFocus
                                    />
                                    <select
                                        className="bg-bg-base border border-border-subtle rounded-md px-3 py-2 text-sm outline-none"
                                        value={newItemPriority}
                                        onChange={(e) => setNewItemPriority(Number(e.target.value))}
                                    >
                                        <option value={0}>Low</option>
                                        <option value={1}>Normal</option>
                                        <option value={2}>High</option>
                                        <option value={3}>Blocker</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Notes (optional)..."
                                    className="w-full bg-bg-base border border-border-subtle rounded-md px-3 py-2 text-sm outline-none focus:border-brand"
                                    value={newItemNotes}
                                    onChange={(e) => setNewItemNotes(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsCreatingItem(false)}>Cancel</Button>
                                    <Button variant="brand" onClick={handleCreateItem}>Save Item</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {items.length === 0 && !isCreatingItem ? (
                                <div className="py-12 text-center text-text-muted border border-dashed border-border-subtle rounded-md">
                                    No tasks in this checklist. Click "Add Task" to create one.
                                </div>
                            ) : (
                                items.map(item => (
                                    <div
                                        key={item.id}
                                        className={`group flex items-start p-4 rounded-lg border transition-colors cursor-pointer ${item.isChecked ? "bg-bg-surface border-brand/30 opacity-75" : "bg-bg-base border-border-subtle hover:border-border-subtle"
                                            }`}
                                        onClick={() => handleToggleItem(item.id)}
                                    >
                                        <div className="mt-0.5 mr-4 shrink-0">
                                            {item.isChecked ? <CheckSquare className="w-5 h-5 text-brand" /> : <Circle className="w-5 h-5 text-text-muted" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`font-medium ${item.isChecked ? "text-text-muted line-through" : "text-white"}`}>
                                                    {item.text}
                                                </div>
                                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                                                    {getPriorityLabel(item.priority)}
                                                </span>
                                            </div>
                                            {item.notes && (
                                                <div className="text-sm text-text-muted mt-1">{item.notes}</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-accent-rose transition-opacity ml-4"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted">
                        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-4">
                            <CheckSquare className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg">Select or create a checklist to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
