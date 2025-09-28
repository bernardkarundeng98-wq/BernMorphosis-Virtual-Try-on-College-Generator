interface ImageUploaderProps {
  onFileChange: (file: File | null) => void; // ← boleh menerima null
  previewUrl: string | null;
}
