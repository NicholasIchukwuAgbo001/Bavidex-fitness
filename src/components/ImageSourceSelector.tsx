import React, { useRef, useState } from "react";
import { uploadToSupabaseStorage } from "../lib/supabaseClient";
import { Upload, Image, X, RefreshCw, Check, AlertCircle } from "lucide-react";

interface ImageSourceSelectorProps {
  imageUrl: string;
  onImageSelected: (url: string) => void;
  bucket: "categories-images" | "products-images";
  idPrefix: string;
  label?: string;
}

export default function ImageSourceSelector({
  imageUrl,
  onImageSelected,
  bucket,
  idPrefix,
  label = "Visual Asset"
}: ImageSourceSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "fallback">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage("");

    const ext = file.name.split(".").pop() || "jpg";
    await handleImageProcessing(file, ext);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageProcessing = async (fileOrBlob: File | Blob, extension: string) => {
    const timestamp = Date.now();
    const fileName = `${idPrefix}-${timestamp}.${extension}`;

    try {
      const publicUrl = await uploadToSupabaseStorage(bucket, fileName, fileOrBlob);
      onImageSelected(publicUrl);
      setUploadStatus("success");
    } catch {
      // Base64 fallback
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelected(reader.result as string);
          setUploadStatus("fallback");
        };
        reader.onerror = () => setErrorMessage("Failed to read image data.");
        reader.readAsDataURL(fileOrBlob);
      } catch (fallbackErr: any) {
        setErrorMessage("Upload failed: " + fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    onImageSelected("");
    setUploadStatus("idle");
    setErrorMessage("");
  };

  return (
    <div id={`${idPrefix}-uploader-container`} className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-gray-400">
          {label}
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={clearImage}
            className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400 font-bold flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      {/* Preview / empty state */}
      <div className="relative min-h-[160px] w-full rounded border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
        {imageUrl ? (
          <div className="relative w-full">
            <img
              src={imageUrl}
              alt="Visual asset preview"
              className="w-full max-h-[220px] object-contain bg-neutral-900/40 p-1"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 right-2 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800/80 rounded px-2.5 py-1 text-[9px] font-mono tracking-wider text-neutral-400">
              {imageUrl.startsWith("data:") ? (
                <span className="text-amber-500 font-bold">Local Base64</span>
              ) : (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="h-2.5 w-2.5 inline" /> Cloud Supabase
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center flex flex-col items-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <Image className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-300">No Image Selected</p>
              <p className="text-[10px] text-neutral-500 max-w-[200px] leading-relaxed">
                Upload an image from your device gallery.
              </p>
            </div>
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={loading}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-5 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 text-neutral-400 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 text-neutral-400" />
              )}
              <span>{loading ? "Uploading…" : "Device Gallery"}</span>
            </button>
          </div>
        )}

        {/* Show upload button again when image is already set */}
        {imageUrl && (
          <div className="w-full px-3 pb-3">
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold uppercase tracking-widest py-2 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 text-neutral-400" />
              )}
              <span>{loading ? "Uploading…" : "Replace Image"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error feedback */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded flex items-start space-x-2 text-[11px] text-red-400 leading-normal">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
