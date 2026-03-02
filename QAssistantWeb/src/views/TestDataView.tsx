import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Plus, Database, ChevronRight, Server, FileText, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["All", "Products", "Customers", "Promotions", "Stock", "Catalog"];

const TEMPLATES = [
    { id: 1, category: "Products", name: "Create Base Product", code: "INSERT_UPDATE Product; code[unique=true]; name[lang=en]; catalogVersion(catalog(id),version)[unique=true]\n; prod1 ; \"Test Product\" ; Default:Staged" },
    { id: 2, category: "Customers", name: "Create B2B Customer", code: "INSERT_UPDATE B2BCustomer; uid[unique=true]; name; groups(uid)\n; test@b2b.com ; \"Test User\" ; b2bgroup" },
    { id: 3, category: "Stock", name: "Update Stock Level", code: "INSERT_UPDATE StockLevel; productCode[unique=true]; available; warehouse(code)[unique=true]\n; prod1 ; 100 ; default" },
];

export function TestDataView() {
    const { activeProject, refreshProjects } = useApp();
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");

    // Fetch new group logic
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // Fetch new entry logic
    const [isCreatingEntry, setIsCreatingEntry] = useState(false);
    const [newEntryKey, setNewEntryKey] = useState("");
    const [newEntryValue, setNewEntryValue] = useState("");
    const [newEntryDesc, setNewEntryDesc] = useState("");

    // Set first group as active initially
    useEffect(() => {
        if (activeProject?.testDataGroups?.length && !activeGroupId) {
            setActiveGroupId(activeProject.testDataGroups[0].id);
        } else if (!activeProject?.testDataGroups?.length) {
            setActiveGroupId(null);
        }
    }, [activeProject, activeGroupId]);

    const filteredTemplates = activeCategory === "All"
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === activeCategory);

    const handleCreateGroup = async () => {
        if (!activeProject || !newGroupName.trim()) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testdatagroups`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName })
            });
            setNewGroupName("");
            setIsCreatingGroup(false);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!activeProject) return;
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testdatagroups/${groupId}`, { method: "DELETE" });
            if (activeGroupId === groupId) setActiveGroupId(null);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateEntry = async () => {
        if (!activeProject || !activeGroupId || !newEntryKey.trim()) return;
        const group = activeProject.testDataGroups?.find(g => g.id === activeGroupId);
        if (!group) return;

        const newEntry = {
            id: crypto.randomUUID(),
            key: newEntryKey,
            value: newEntryValue,
            description: newEntryDesc,
            environment: "All",
            tags: "New"
        };

        const updatedGroup = { ...group, entries: [...(group.entries || []), newEntry] };

        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testdatagroups/${activeGroupId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedGroup)
            });
            setNewEntryKey(""); setNewEntryValue(""); setNewEntryDesc("");
            setIsCreatingEntry(false);
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!activeProject || !activeGroupId) return;
        const group = activeProject.testDataGroups?.find(g => g.id === activeGroupId);
        if (!group) return;

        const updatedGroup = { ...group, entries: (group.entries || []).filter(e => e.id !== entryId) };

        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/testdatagroups/${activeGroupId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedGroup)
            });
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    const activeGroup = activeProject?.testDataGroups?.find(g => g.id === activeGroupId);
    const activeEntries = activeGroup?.entries || [];

    return (
        <div className="flex h-full bg-bg-base relative">
            {/* Sidebar - Data Groups */}
            <div className="w-64 border-r border-border-subtle bg-bg-surface shrink-0 flex flex-col">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Data Groups</h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingGroup(!isCreatingGroup)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                {isCreatingGroup && (
                    <div className="p-2 border-b border-border-subtle flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-bg-base border border-border-subtle rounded px-2 py-1 text-xs outline-none focus:border-brand"
                            placeholder="Group name..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateGroup();
                                }
                            }}
                        />
                        <Button variant="brand" size="sm" onClick={handleCreateGroup} className="px-2">Add</Button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {activeProject?.testDataGroups?.map(g => (
                        <div key={g.id} className="group flex items-center justify-between">
                            <button
                                onClick={() => setActiveGroupId(g.id)}
                                className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left truncate ${activeGroupId === g.id ? "bg-bg-surface-hover text-white font-medium shadow-sm" : "text-text-muted hover:text-white hover:bg-bg-surface-hover/50"
                                    }`}
                            >
                                <Database className="w-4 h-4 shrink-0" />
                                <span className="truncate">{g.name}</span>
                            </button>
                            <button
                                onClick={() => handleDeleteGroup(g.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-rose transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {(!activeProject?.testDataGroups || activeProject.testDataGroups.length === 0) && (
                        <div className="p-3 text-xs text-text-muted text-center">No groups found.</div>
                    )}
                </div>
                <div className="p-4 border-t border-border-subtle">
                    <Button variant="ghost" className="w-full justify-between" onClick={() => setShowTemplates(!showTemplates)}>
                        <span>SAP ImpEx Templates</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${showTemplates ? "rotate-90" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Main Content - Key/Value Editor */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${showTemplates ? "h-[60%]" : "h-full"}`}>
                <div className="p-6 border-b border-border-subtle bg-bg-base flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">{activeGroup?.name || "Select a group"}</h1>
                        <p className="text-sm text-text-muted">Manage test data entries and variables for this group.</p>
                    </div>
                    <Button variant="brand" onClick={() => setIsCreatingEntry(!isCreatingEntry)} disabled={!activeGroup}>
                        <Plus className="w-4 h-4 mr-2" /> Add Entry
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isCreatingEntry && (
                        <div className="bg-bg-surface border-2 border-brand/50 rounded-md p-4 flex gap-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-text-muted mb-1 block">Key</label>
                                        <input type="text" value={newEntryKey} onChange={e => setNewEntryKey(e.target.value)} placeholder="e.g. test_user_email" className="w-full bg-bg-base border border-border-subtle rounded px-3 py-1.5 text-sm outline-none focus:border-brand text-brand font-mono" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-text-muted mb-1 block">Value</label>
                                        <input type="text" value={newEntryValue} onChange={e => setNewEntryValue(e.target.value)} placeholder="e.g. admin@test.com" className="w-full bg-bg-base border border-border-subtle rounded px-3 py-1.5 text-sm outline-none focus:border-brand" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                                    <input type="text" value={newEntryDesc} onChange={e => setNewEntryDesc(e.target.value)} placeholder="Optional description..." className="w-full bg-transparent border-none px-0 py-1 text-sm outline-none text-text-muted placeholder:text-text-muted/50 focus:text-white" />
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingEntry(false)}>Cancel</Button>
                                    <Button variant="brand" size="sm" onClick={handleCreateEntry}>Save Entry</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeEntries.length === 0 && !isCreatingEntry ? (
                        <div className="text-center py-12 text-text-muted border border-dashed border-border-subtle rounded-md">
                            No entries in this group. Click "Add Entry" to create one.
                        </div>
                    ) : (
                        activeEntries.map(entry => (
                            <div key={entry.id} className="bg-bg-surface border border-border-subtle rounded-md p-4 flex gap-4 group relative">
                                <button
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="absolute top-4 right-4 text-text-muted hover:text-accent-rose opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Entry"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex-1 space-y-3 pr-8">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-text-muted mb-1 block">Key</label>
                                            <input type="text" defaultValue={entry.key} readOnly className="w-full bg-bg-base border border-border-subtle rounded px-3 py-1.5 text-sm outline-none text-brand font-mono" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-text-muted mb-1 block">Value</label>
                                            <input type="text" defaultValue={entry.value} readOnly className="w-full bg-bg-base border border-border-subtle rounded px-3 py-1.5 text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Description</label>
                                        <input type="text" defaultValue={entry.description} readOnly className="w-full bg-transparent border-none px-0 py-1 text-sm outline-none text-text-muted placeholder:text-text-muted/50" />
                                    </div>
                                </div>
                                <div className="w-48 flex flex-col gap-3 border-l border-border-subtle pl-4 pr-6">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 flex items-center gap-1"><Server className="w-3 h-3" /> Environment</label>
                                        <select disabled defaultValue={entry.environment} className="w-full bg-bg-base border border-border-subtle rounded px-2 py-1 text-sm outline-none opacity-80">
                                            <option>All Environments</option>
                                            <option>Staging</option>
                                            <option>Production</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Tags</label>
                                        {entry.tags ? (
                                            entry.tags.split(',').map(tag => (
                                                <span key={tag} className="inline-block bg-accent-emerald/20 text-accent-emerald px-2 py-0.5 rounded text-xs border border-accent-emerald/30 mr-1 mb-1">{tag.trim()}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-text-muted">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Slide-up Panel - SAP ImpEx Templates */}
            <div className={`absolute bottom-0 left-64 right-0 bg-bg-surface border-t border-border-subtle transition-all duration-300 shadow-2xl z-10 ${showTemplates ? "h-[40%] translate-y-0" : "h-0 translate-y-full overflow-hidden"}`}>
                <div className="p-4 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-bg-surface shrink-0">
                    <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-brand" /> SAP ImpEx Templates</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveCategory(c)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeCategory === c ? "bg-brand border-brand text-white" : "border-border-subtle text-text-muted hover:text-white hover:border-text-muted"}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                    <div className="grid grid-cols-2 gap-4">
                        {filteredTemplates.map(t => (
                            <div key={t.id} className="bg-bg-base border border-border-subtle rounded-md overflow-hidden flex flex-col group">
                                <div className="px-3 py-2 bg-bg-surface-hover border-b border-border-subtle flex justify-between items-center">
                                    <span className="text-sm font-medium">{t.name}</span>
                                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">Copy</Button>
                                </div>
                                <pre className="p-3 text-xs font-mono text-text-muted overflow-x-auto">
                                    {t.code}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
