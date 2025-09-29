import React, { useCallback } from "react";

interface ImageUploaderProps {
  onFileChange: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, previewUrl }) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("[Uploader] onChange file:", file?.name, file?.type, file?.size);
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar (jpg/png/webp)");
        return;
      }
      onFileChange(file);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      console.log("[Uploader] onDrop file:", file?.name, file?.type, file?.size);
      if (file && file.type.startsWith("image/")) {
        onFileChange(file);
      }
    },
    [onFileChange]
  );

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-300"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="object-contain h-full w-full rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            {/* ikon dihilangkan supaya tetap jalan walau belum ada */}
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> atau drag & drop
            </p>
            <p className="text-xs">PNG / JPG / WEBP sampai ±10MB</p>
          </div>
        )}
        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
      </label>
    </div>
  );
};

export default ImageUploader;
