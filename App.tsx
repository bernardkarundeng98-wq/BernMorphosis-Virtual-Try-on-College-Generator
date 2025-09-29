import React, { useState, useCallback, useRef } from "react";
import { fileToBase64 } from "./Utils/fileUtils";
import { generateCollage } from "./Services/geminiService";

export default function App() {
  // state untuk input & hasil
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // preview gambar yang diupload
  const [file, setFile] = useState<File | null>(null);               // file asli
  const [dragOver, setDragOver] = useState(false);                   // efek drag-over
  const [isLoading, setIsLoading] = useState(false);                 // loading generate
  const [resultUrl, setResultUrl] = useState<string | null>(null);   // hasil AI (data URL)
  const [error, setError] = useState<string | null>(null);           // pesan error
  const inputRef = useRef<HTMLInputElement | null>(null);            // ref untuk input file

  // helper menangani file masuk (dari input maupun drop)
  const handleFiles = useCallback((f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("File harus gambar (jpg/png/webp).");
      return;
    }
    setFile(f);
    setResultUrl(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }, []);

  // event handlers untuk input
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files?.[0]);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files?.[0]);
  };

  // reset ke kondisi awal
  const handleReset = () => {
    setPreviewUrl(null);
    setFile(null);
    setResultUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // tombol Generate (AI)
  const handleGenerate = async () => {
    if (!file) {
      alert("Upload gambar dulu ya.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setResultUrl(null);

      // konversi file → base64 (tanpa prefix)
      const imgBase64 = await fileToBase64(file);

      // prompt contoh — silakan modifikasi sesuai kebutuhan kamu
      const prompt = `Buat 1 gambar kolase 3x3 vertikal (rasio 9:16), ultra-fotorealistik.
Pertahankan wajah & warna kulit dari foto referensi (jangan diubah).
Latar belakang setiap kotak: kardus cokelat polos yang konsisten.
Buat 9 gaya berbeda yang youthful & cocok untuk media sosial.`;

      // panggil model
      const resultBase64 = await generateCollage(prompt, imgBase64, file.type);

      // tampilkan hasil sebagai PNG
      setResultUrl(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal generate gambar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, Arial", minHeight: "100vh", background: "#0b0b0c", color: "#eaeaea" }}>
      {/* Navbar */}
      <header
        style={{
          background: "#111",
          borderBottom: "1px solid #1f1f1f",
          padding: "14px 20px",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>👕 Virtual Try-On Generator</h1>
      </header>

      {/* Container */}
      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "0 16px 40px" }}>
        {/* Dropzone (muncul kalau belum ada preview & belum ada hasil) */}
        {!previewUrl && !resultUrl && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            style={{
              border: `2px dashed ${dragOver ? "#8b5cf6" : "#3a3a3a"}`,
              background: dragOver ? "rgba(139,92,246,0.06)" : "#131316",
              borderRadius: 12,
              padding: 28,
              textAlign: "center",
              transition: "all .2s ease",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputRef.current) inputRef.current.click();
            }}
          >
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              <strong>Drag & Drop</strong> gambar ke sini
            </p>
            <p style={{ color: "#9ca3af", marginTop: 0, marginBottom: 16 }}>
              atau
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                background: "#8b5cf6",
                color: "#fff",
                border: 0,
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Pilih Gambar
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onInputChange}
              style={{ display: "none" }}
            />
            <p style={{ color: "#9ca3af", marginTop: 14, fontSize: 12 }}>
              (JPG/PNG/WebP, disarankan &lt; 10MB)
            </p>
          </div>
        )}

        {/* Preview input (sebelum hasil) */}
        {previewUrl && !resultUrl && (
          <section style={{ textAlign: "center", marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Preview</h3>
            <img
              src={previewUrl}
              alt="Uploaded"
              style={{
                maxWidth: "100%",
                width: 420,
                height: "auto",
                borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,.25)",
                border: "1px solid #262626",
                background: "#0f0f10",
              }}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleReset}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: 0,
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                Reset
              </button>
              <button
                onClick={handleGenerate}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: 0,
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate (AI)"}
              </button>
            </div>

            {error && (
              <p style={{ color: "#f87171", marginTop: 12, whiteSpace: "pre-wrap" }}>
                {error}
              </p>
            )}
          </section>
        )}

        {/* Hasil AI */}
        {resultUrl && (
          <section style={{ textAlign: "center", marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Hasil AI</h3>
            <img
              src={resultUrl}
              alt="Generated"
              style={{
                maxWidth: "100%",
                width: 420,
                height: "auto",
                borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,.25)",
                border: "1px solid #262626",
                background: "#0f0f10",
              }}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={resultUrl}
                download="virtual-try-on.png"
                style={{
                  background: "#0ea5e9",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                }}
              >
                Download
              </a>
              <button
                onClick={handleReset}
                style={{
                  background: "#6b7280",
                  color: "#fff",
                  border: 0,
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Upload Lagi
              </button>
            </div>

            {error && (
              <p style={{ color: "#f87171", marginTop: 12, whiteSpace: "pre-wrap" }}>
                {error}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
