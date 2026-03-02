import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export function LinksView() {
    const { activeProject, refreshProjects } = useApp();
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    if (!activeProject) return null;

    const handleAddLink = async () => {
        if (!newTitle.trim() || !newUrl.trim()) return;
        setIsAdding(true);
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/links`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    url: newUrl,
                    domain: new URL(newUrl).hostname.replace("www.", ""),
                    orderIndex: activeProject.links?.length || 0,
                }),
            });
            setNewTitle("");
            setNewUrl("");
            await refreshProjects();
        } catch (e) {
            console.error(e);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteLink = async (linkId: string) => {
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/links/${linkId}`, {
                method: "DELETE",
            });
            await refreshProjects();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Add Link Form */}
                <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle flex gap-4 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-text-muted font-medium uppercase tracking-wider">Title</label>
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Figma Design"
                            className="w-full h-9 bg-bg-base border border-border-subtle rounded pr-2 pl-3 text-sm focus:outline-none focus:border-brand transition-colors text-white"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-text-muted font-medium uppercase tracking-wider">URL</label>
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full h-9 bg-bg-base border border-border-subtle rounded pr-2 pl-3 text-sm focus:outline-none focus:border-brand transition-colors text-white"
                        />
                    </div>
                    <Button variant="brand" onClick={handleAddLink} disabled={isAdding || !newTitle || !newUrl}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                    </Button>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeProject.links?.map((link) => (
                        <div key={link.id} className="bg-bg-surface p-4 rounded-lg border border-border-subtle hover:border-brand/50 transition-colors group relative flex flex-col min-h-[120px]">
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-white truncate pr-6">{link.title}</h3>
                                <p className="text-sm text-text-muted truncate mt-1">{link.domain}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:text-brand/80 flex items-center gap-1">
                                    Open <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                            <button
                                onClick={() => handleDeleteLink(link.id)}
                                className="absolute top-4 right-4 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {!activeProject.links?.length && (
                        <div className="col-span-full py-12 text-center text-text-muted border border-dashed border-border-subtle rounded-lg">
                            No links added yet. Add important product links, design files, or wikis.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
