import React, { useRef, useState } from "react";
import { MdUpload, MdDelete, MdCloudUpload } from "react-icons/md";
import { toast } from "react-toastify";

export const ImageUploader = ({ images = [], onUpload, onRemove, maxImages = 5, label = "Upload Images" }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        await onUpload(file);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <img src={img.url || img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => onRemove(img, idx)}
              className="absolute top-1 right-1 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
            >
              <MdDelete size={12} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center hover:border-violet-500 transition disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MdCloudUpload size={28} className="text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;