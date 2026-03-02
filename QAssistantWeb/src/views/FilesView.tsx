import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { UploadCloud, File, Trash2, DownloadCloud, Loader2 } from "lucide-react";

export function FilesView() {
    const { activeProject, refreshProjects } = useApp();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!activeProject) return null;

    const handleUpload = async (file: globalThis.File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/files/upload`, {
                method: "POST",
                body: formData,
            });
            await refreshProjects();
        } catch (e) {
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            await fetch(`http://localhost:5123/api/projects/${activeProject.id}/files/${fileId}`, {
                method: "DELETE"
            });
            await refreshProjects();
        } catch (e) { console.error(e); }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-8 h-full overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto space-y-8 flex flex-col items-center">

                {/* Upload Zone */}
                <div
                    className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging
                            ? "border-brand bg-brand/10 shadow-lg scale-[1.02]"
                            : "border-border-strong bg-bg-surface hover:border-text-muted hover:bg-bg-surface-hover"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {isUploading ? (
                        <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
                    ) : (
                        <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragging ? "text-brand" : "text-text-muted"}`} />
                    )}
                    <h2 className="text-lg font-medium text-white mb-2">
                        {isUploading ? "Uploading..." : "Click or drag file to this area to upload"}
                    </h2>
                    <p className="text-sm text-text-muted text-center max-w-sm">
                        Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
                    </p>
                </div>

                {/* Files Grid */}
                <div className="w-full">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                        Attached Files ({activeProject.files?.length || 0})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {activeProject.files?.map((file) => (
                            <div key={file.id} className="bg-bg-surface border border-border-subtle rounded-lg p-4 group relative flex flex-col hover:border-brand/50 transition-colors">
                                <div className="w-12 h-12 rounded bg-bg-base border border-border-subtle flex items-center justify-center mb-3">
                                    <File className="w-6 h-6 text-brand" />
                                </div>
                                <h4 className="text-sm font-medium text-white truncate pr-6" title={file.fileName}>{file.fileName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-text-muted">{formatSize(file.size)}</span>
                                    <span className="w-1 h-1 rounded-full bg-border-strong" />
                                    <span className="text-[10px] text-text-muted uppercase px-1.5 py-0.5 rounded border border-border-subtle inline-block">
                                        {file.contentType.split('/')[1] || "File"}
                                    </span>
                                </div>

                                <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                    <a
                                        href={`http://localhost:5123/api/files/download?path=${encodeURIComponent(file.filePath)}`}
                                        download={file.fileName}
                                        className="p-1.5 rounded hover:bg-bg-base text-text-muted hover:text-white"
                                        title="Download"
                                    >
                                        <DownloadCloud className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-1.5 rounded hover:bg-red-400/10 text-text-muted hover:text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!activeProject.files?.length && (
                        <div className="text-center py-8 text-text-muted">
                            No files have been attached to this project yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
