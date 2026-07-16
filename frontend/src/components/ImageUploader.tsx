import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

type ImageUploaderProps = {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  initialImages?: string[];
};

export default function ImageUploader({ onChange, maxFiles = 5, initialImages = [] }: ImageUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalFilesCount = selectedFiles.length + existingImages.length + files.length;

    if (totalFilesCount > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} images.`);
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    onChange(newFiles);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onChange(updatedFiles);

    // Clean up object URL memory leak
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(existingImages.filter((img) => img !== imageUrl));
    // Usually we would notify parent if an image needs deletion, but here we can just manage state locally.
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={triggerFileInput}
        className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/20 py-8 text-center transition hover:border-cyan-500/50 hover:bg-slate-900/30"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Upload size={20} />
        </div>
        <p className="mt-3 text-sm font-semibold text-white">Click or drag images to upload</p>
        <p className="mt-1 text-xs text-slate-400">PNG, JPG, JPEG or WEBP up to 10MB (max {maxFiles} images)</p>
      </div>

      {(existingImages.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Existing images (already stored on server) */}
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <img src={url} alt="Item" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(url)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-slate-350 hover:bg-black/90 hover:text-white transition"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {/* New files preview (selected but not uploaded yet) */}
          {previews.map((url, idx) => (
            <div key={`preview-${idx}`} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <img src={url} alt="Item Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-slate-355 hover:bg-black/90 hover:text-white transition"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-2 left-2 rounded bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
                NEW
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
