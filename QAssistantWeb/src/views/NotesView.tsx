import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Plus, Trash2, Clock, Check, Loader2 } from "lucide-react";

export function NotesView() {
    const { activeProject, refreshProjects } = useApp();
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Derive the currently selected note object
    const selectedNote = activeProject?.notes?.find(n => n.id === selectedNoteId);

    useEffect(() => {
        if (selectedNote) {
            setTitle(selectedNote.title);
            setContent(selectedNote.content);
        } else {
            setTitle("");
            setContent("");
        }
    }, [selectedNoteId, selectedNote?.id]);

    useEffect(() => {
        // Auto-select first note if none selected
        if (!selectedNoteId && activeProject?.notes && activeProject.notes.length > 0) {
            setSelectedNoteId(activeProject.notes[0].id);
        }
    }, [activeProject?.notes, selectedNoteId]);

    if (!activeProject) return null;

    const handleCreateNote = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:5123/api/projects/${activeProject.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "New Note",
                    content: "",
                    orderIndex: activeProject.notes?.length || 0,
                }),
            });

            if (response.ok) {
                const newNote = await response.json();
                await refreshProjects();
                setSelectedNoteId(newNote.id);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateNote = async () => {
        if (!selectedNoteId) return;
        setIsSaving(true);
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/notes/${selectedNoteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...selectedNote,
                    title,
                    content,
                    updatedAt: new Date().toISOString()
                }),
            });
            await refreshProjects();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(noteId);
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/notes/${noteId}`, {
                method: "DELETE",
            });
            if (selectedNoteId === noteId) {
                setSelectedNoteId(null);
            }
            await refreshProjects();
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="flex h-full w-full">
            {/* Note List Sidebar */}
            <div className="w-64 border-r border-border-subtle bg-bg-surface flex flex-col h-full flex-shrink-0">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                    <h2 className="text-sm font-medium">Notes</h2>
                    <Button variant="ghost" size="icon" className="w-6 h-6 p-0" onClick={handleCreateNote} disabled={isSaving}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {activeProject.notes?.map(note => (
                        <div
                            key={note.id}
                            onClick={() => setSelectedNoteId(note.id)}
                            className={`p-3 rounded-md cursor-pointer transition-colors group relative ${selectedNoteId === note.id ? "bg-[#2b2b3c] border border-border-strong" : "hover:bg-bg-surface-hover border border-transparent"
                                }`}
                        >
                            <h3 className="text-sm font-medium truncate pr-6">{note.title || "Untitled"}</h3>
                            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </p>

                            <button
                                className={`absolute top-2 right-2 p-1.5 rounded text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-all ${isDeleting === note.id ? "opacity-100" : ""}`}
                                onClick={(e) => handleDeleteNote(note.id, e)}
                                disabled={isDeleting === note.id}
                            >
                                {isDeleting === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ))}
                    {!activeProject.notes?.length && (
                        <div className="text-center p-4 text-sm text-text-muted">
                            No notes yet. Click + to create one.
                        </div>
                    )}
                </div>
            </div>

            {/* Note Editor */}
            <div className="flex-1 flex flex-col h-full bg-bg-base">
                {selectedNote ? (
                    <>
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Note Title"
                                className="bg-transparent border-none text-xl font-semibold outline-none focus:ring-0 w-full text-white placeholder-text-muted"
                                onBlur={handleUpdateNote}
                            />
                            <div className="flex items-center gap-2 text-sm text-text-muted whitespace-nowrap ml-4">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-brand" /> : <Check className="w-4 h-4 text-green-400" />}
                                {isSaving ? "Saving..." : "Saved"}
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onBlur={handleUpdateNote}
                                placeholder="Start typing your note here..."
                                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-white placeholder-text-muted leading-relaxed"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                        <Clock className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">Select a note to edit</p>
                    </div>
                )}
            </div>
        </div>
    );
}
