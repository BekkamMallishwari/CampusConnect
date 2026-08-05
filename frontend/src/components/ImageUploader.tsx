import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, RefreshCw, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

type ImageUploaderProps = {
  images?: string[];
  onChange?: (images: string[]) => void;
  onFilesChange?: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
};

// Client-side image compression using HTML Canvas
const compressImage = (file: File, maxWidth = 1600, quality = 0.82): Promise<{ file: File; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ file, dataUrl: e.target?.result as string });

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve({ file, dataUrl: canvas.toDataURL('image/jpeg', quality) });
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({ file: compressedFile, dataUrl: canvas.toDataURL('image/jpeg', quality) });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
  });
};

export default function ImageUploader({
  images = [],
  onChange,
  onFilesChange,
  maxImages = 5,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error(`"${file.name}" is not a supported format (JPG, PNG, WEBP, GIF).`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`);
      return false;
    }
    return true;
  };

  const processFiles = async (files: File[]) => {
    const currentCount = images.length;
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum limit of ${maxImages} images reached.`);
      return;
    }

    const validFiles = files.filter(validateFile).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setUploading(true);
    setProgress(20);

    try {
      const compressedResults = await Promise.all(
        validFiles.map((file) => compressImage(file))
      );

      setProgress(75);

      const newUrls = compressedResults.map((res) => res.dataUrl);
      const newFiles = compressedResults.map((res) => res.file);

      const updatedUrls = [...images, ...newUrls];
      const updatedFiles = [...selectedFiles, ...newFiles];

      setSelectedFiles(updatedFiles);
      if (onChange) onChange(updatedUrls);
      if (onFilesChange) onFilesChange(updatedFiles);

      setProgress(100);
      toast.success(`${validFiles.length} image(s) processed and ready for Cloudinary upload!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process image file.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 400);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (replaceIndex === null || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!validateFile(file)) return;

    try {
      setUploading(true);
      const compressed = await compressImage(file);
      const updatedUrls = [...images];
      updatedUrls[replaceIndex] = compressed.dataUrl;

      const updatedFiles = [...selectedFiles];
      if (replaceIndex < updatedFiles.length) {
        updatedFiles[replaceIndex] = compressed.file;
      }

      setSelectedFiles(updatedFiles);
      if (onChange) onChange(updatedUrls);
      if (onFilesChange) onFilesChange(updatedFiles);
      toast.success('Image replaced successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to replace image.');
    } finally {
      setUploading(false);
      setReplaceIndex(null);
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updatedUrls = images.filter((_, i) => i !== index);
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);

    setSelectedFiles(updatedFiles);
    if (onChange) onChange(updatedUrls);
    if (onFilesChange) onFilesChange(updatedFiles);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      toast.error(`Maximum limit of ${maxImages} images reached.`);
      return;
    }
    const updatedUrls = [...images, urlInput.trim()];
    if (onChange) onChange(updatedUrls);
    setUrlInput('');
    toast.success('Image URL added.');
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleReplaceFileChange}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-7 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-600 bg-blue-50/80 shadow-[0_20px_40px_rgba(37,99,235,0.15)] dark:border-blue-400 dark:bg-blue-950/40'
            : 'border-slate-300 bg-white/90 hover:border-blue-400 hover:bg-slate-50/60 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-500'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)] transition-transform duration-300 group-hover:scale-110">
          {uploading ? <Loader2 className="animate-spin" size={28} /> : <Upload size={28} />}
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {dragActive ? 'Drop images here to upload' : 'Click to upload or drag & drop images'}
        </h4>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          High-resolution photos increase AI match accuracy. Supports PNG, JPG, WEBP (Max {maxSizeMB}MB each).
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <Sparkles size={12} className="text-blue-500" />
            Cloudinary Fast CDN
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/50 dark:text-blue-300">
            <CheckCircle2 size={12} />
            {images.length} / {maxImages} uploaded
          </span>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Compressing & Optimizing...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* URL Input Fallback */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <ImageIcon size={16} />
          </div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="Or paste an image web link..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-xs transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || images.length >= maxImages}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-blue-500 dark:hover:text-white"
        >
          Add Web Link
        </button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((imgUrl, idx) => (
            <div
              key={`preview-${idx}-${imgUrl.slice(-15)}`}
              className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950 shadow-sm transition hover:shadow-md dark:border-slate-800"
            >
              <img
                src={imgUrl}
                alt={`Uploaded image ${idx + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
              />

              {/* Action Buttons */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/60 opacity-0 backdrop-blur-xs transition duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  title="Replace image"
                  onClick={() => {
                    setReplaceIndex(idx);
                    replaceInputRef.current?.click();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition hover:bg-white hover:text-blue-600"
                >
                  <RefreshCw size={14} />
                </button>

                <button
                  type="button"
                  title="Remove image"
                  onClick={() => handleRemove(idx)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Badge */}
              <div className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-950/70 px-2 py-0.5 backdrop-blur-xs">
                <span className="text-[10px] font-semibold text-white">Image {idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
