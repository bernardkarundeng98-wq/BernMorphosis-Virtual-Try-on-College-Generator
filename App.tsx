import React, { useState, useRef } from "react";
import { fileToBase64 } from "@utils/fileToBase64";
import { generateWithGemini } from "@services/geminiService";

export default function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("Beri saran outfit formal untuk foto ini.");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(""); setResultText("");
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImageDataUrl(b64);
  }

  function resetAll() {
    setImageDataUrl("");
    setResultText("");
    setError("");
    fileRef.current?.value && (fileRef.current.value = "");
  }

  async function onGenerate() {
    try {
      if (!imageDataUrl) {
        setError("Silakan pilih gambar dulu.");
        return;
      }
      setLoading(true); setError(""); setResultText("");
      const { output } = await generateWithGemini({ prompt, imageBase64: imageDataUrl });
      setResultText(output || "(kosong)");
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ alignItems: "center", marginBottom: 10 }}>
        <span className="badge">Virtual Try-On Generator</span>
        <div className="muted">Upload foto → tulis instruksi → klik Generate (AI)</div>
      </div>

      <div className="grid">
        {/* KIRI: Preview & kontrol */}
        <div className="card">
          <h3>Preview</h3>
          <div className="preview">
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="preview" />
            ) : (
              <div className="muted">Belum ada gambar</div>
            )}
          </div>

          <div style={{ height: 10 }} />

          <div className="row">
            <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
              Pilih Gambar
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPick}
                style={{ display: "none" }}
              />
            </label>
            <button className="btn btn-danger" onClick={resetAll}>Reset</button>
            <button className="btn btn-primary" onClick={onGenerate} disabled={loading}>
              {loading ? (<span className="row" style={{ alignItems: "center", gap: 8 }}>
                <span className="spinner" /> Memproses...
              </span>) : "Generate (AI)"}
            </button>
          </div>

          <div style={{ height: 10 }} />
          <div className="muted">
            Catatan: SDK Gemini mengembalikan <b>teks</b> (bukan gambar baru). Hasil akan tampil di panel kanan.
          </div>

          <div style={{ height: 12 }} />
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Instruksi (prompt):</div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Contoh: ubah outfit menjadi kemeja biru dan jas navy, gaya profesional."
            />
          </div>

          {error && (
            <>
              <div style={{ height: 10 }} />
              <div className="muted" style={{ color: "#fda4af" }}>
                Error: {error}
              </div>
            </>
          )}
        </div>

        {/* KANAN: Hasil */}
        <div className="card">
          <h3>Hasil</h3>
          <div className="resultBox">
            {resultText || "Result will appear here"}
          </div>
        </div>
      </div>
    </div>
  );
}
