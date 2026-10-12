import React, { useState } from 'react';
import { Upload, X, Loader2, ExternalLink } from 'lucide-react';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../lib/cloudinary';

export const ImageUploader = ({ label, value, onChange, folder = 'EMS' }) => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const isCloudinaryUrl = value && value.startsWith('http');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
          isCloudinaryUrl 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : value 
            ? 'bg-amber-100 text-amber-800 border border-amber-200'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {isCloudinaryUrl ? 'Cloudinary CDN Connected' : value ? 'Preview Ready (Uploads on Save & Publish)' : 'Ready for Image'}
        </span>
      </div>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
          <div className="relative h-44 w-full flex items-center justify-center bg-white rounded-lg overflow-hidden border border-slate-200">
            <img 
              src={value} 
              alt={label} 
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white text-slate-800 hover:bg-slate-100 shadow-md transition-colors"
                title="View original image"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-md transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 truncate px-1 font-mono">
            URL: <span className="text-slate-800">{value}</span>
          </p>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            dragActive 
              ? 'border-brand-500 bg-brand-50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="text-xs text-slate-700 font-medium">Uploading image to Cloudinary...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to upload or drag & drop image
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  PNG, JPG, WEBP (Max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
