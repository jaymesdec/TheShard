import { useRef, useState, useCallback } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useUpload from "@/utils/useUpload";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large (max 4MB)";
  }
  return null;
}

export default function ImageUploader({ onImageUploaded, disabled = false, children }) {
  const fileInputRef = useRef(null);
  const [upload, { loading: uploading }] = useUpload();

  const handleFile = useCallback(async (file) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    const result = await upload({ file });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onImageUploaded({ url: result.url });
  }, [upload, onImageUploaded]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [disabled, uploading, handleFile]);

  const handlePaste = useCallback((e) => {
    if (disabled || uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  }, [disabled, uploading, handleFile]);

  const triggerFileInput = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop} onPaste={handlePaste}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {children ? (
        children({ triggerFileInput, uploading })
      ) : (
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled || uploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          title="Attach image"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ImagePlus size={18} />
          )}
        </button>
      )}
    </div>
  );
}
