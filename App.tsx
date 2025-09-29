import React, { useState, useCallback, useRef } from "react";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback((file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus gambar (jpg/png/webp).");
      return;
    }
    const url = URL.createObjectURL(file);
    setImage(url);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFiles(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFiles(file);
  };

  const handleReset = () => {
    setImage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ fontFamily: "system-ui, Arial", minHeight: "100vh" }}>
      {/* Navbar */}
      <header
        style={{
          background: "#222",
          color: "#fff",
          padding: "14px 20px",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>👕 Virtual Try-On Generator</h1>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
        {/* Dropzone */}
        {!image && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            style={{
              border: `2px dashed ${dragOver ? "#4f46e5" : "#bbb"}`,
              background: dragOver ? "rgba(79,70,229,0.06)" : "#fafafa",
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
              <strong>Drag & Drop</strong> gambar kamu ke sini
            </p>
            <p style={{ color: "#666", marginTop: 0, marginBottom: 16 }}>
              atau
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                background: "#4f46e5",
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
            <p style={{ color: "#888", marginTop: 14, fontSize: 12 }}>
              (JPG/PNG/WebP, disarankan &lt; 10MB)
            </p>
          </div>
        )}

        {/* Preview */}
        {image && (
          <section style={{ textAlign: "center", marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Preview</h3>
            <img
              src={image}
              alt="Uploaded"
              style={{
                maxWidth: "100%",
                width: 420,
                height: "auto",
                borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,.08)",
                border: "1px solid #eee",
              }}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
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
              >
                Reset Gambar
              </button>
              <button
                onClick={() => alert("Nanti tombol ini dipakai untuk Generate AI")}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: 0,
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Generate (AI)
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
