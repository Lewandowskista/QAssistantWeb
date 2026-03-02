import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const COLORS = [
    "#818cf8", // Indigo
    "#fb7185", // Rose
    "#34d399", // Emerald
    "#60a5fa", // Blue
    "#c084fc", // Purple
    "#fbcfe8", // Pink
    "#fcd34d", // Amber
];

export function ProjectDialog({ isOpen, onClose, onSuccess }: ProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5123/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, color }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setName("");
                setDescription("");
                setColor(COLORS[0]);
            } else {
                alert("Failed to create project");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Project Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. E-Commerce QA"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Description (Optional)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the project"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Theme Color</label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-bg-surface flex items-center justify-center" : ""
                                        }`}
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && <div className="w-2 h-2 rounded-full bg-white opacity-80" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="surface" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="brand" disabled={loading || !name.trim()}>
                            {loading ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
