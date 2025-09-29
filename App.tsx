import React, { useState } from "react";

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ketika upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!preview) return alert("Upload gambar dulu!");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", { method: "POST" });
      const data = await res.json();

      if (data.imageBase64) {
        setResult(`data:image/png;base64,${data.imageBase64}`);
      } else {
        alert("Gagal: tidak ada hasil dari API.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi error saat generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>👕 Virtual Try-On Generator 🚀</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div style={{ margin: "20px 0" }}>
        {preview ? (
          <img src={preview} alt="preview" width="250" />
        ) : (
          <p>Upload gambar untuk mulai</p>
        )}
      </div>

      <button onClick={handleReset} style={{ marginRight: "10px" }}>
        Reset
      </button>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate (AI)"}
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Hasil:</h3>
          <img src={result} alt="AI result" width="300" />
        </div>
      )}
    </div>
  );
}
