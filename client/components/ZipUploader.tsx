import { useState, useRef } from "react";
import { FileArchive, Upload, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  projectName: string;
  onUploadComplete: (storageKey: string) => void;
}

export default function ZipUploader({ projectName, onUploadComplete }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    setError("");
    if (f.size > 52428800) {
      setError("File must be under 50MB");
      return;
    }
    if (!f.name.endsWith(".zip")) {
      setError("Only ZIP files are accepted");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(10);

    try {
      const timestamp = Date.now();
      const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
      const storageKey = `${user.id}/${safeName}_${timestamp}.zip`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(storageKey, file, {
          contentType: "application/zip",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      setProgress(100);
      setUploaded(true);
      onUploadComplete(storageKey);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploaded(false);
    setProgress(0);
    setError("");
  };

  if (uploaded && file) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB uploaded
            </p>
          </div>
          <button onClick={removeFile} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/10 bg-muted/30 hover:border-violet-500/20"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <FileArchive className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Drag and drop your ZIP file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Max 50MB</p>
      </div>

      {file && !uploaded && (
        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FileArchive className="h-4 w-4 shrink-0 text-violet-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={removeFile} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <button
              onClick={handleUpload}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
