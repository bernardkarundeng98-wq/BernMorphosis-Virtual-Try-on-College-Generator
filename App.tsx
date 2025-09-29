import React, { useRef, useState } from "react";
import { fileToBase64 } from "./utils/fileToBase64";

type GenResponse = { imageBase64?: string; error?: string };

export default function App() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick() {
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[1] ?? e.target.files?.[0];
    if (!f) return;
    setResultUrl(null);
    setError("");
    setPreviewUrl(URL.createObjectURL(f));
  }

  function resetAll() {
    setPreviewUrl(null);
    setResultUrl(null);
    setPrompt("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onGenerate() {
    try {
      setLoading(true);
      setError("");

      const file = fileRef.current?.files?.[0];
      if (!file) {
        setError("Silakan pilih gambar dulu.");
        return;
      }
      if (!prompt.trim()) {
        setError("Silakan isi deskripsi (prompt) dulu.");
        return;
      }

      const imageBase64 = await fileToBase64(file);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageBase64 })
      });

      const data: GenResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      if (!data.imageBase64) {
        throw new Error("Respons tidak berisi gambar.");
      }

      setResultUrl(`data:image/png;base64,${data.imageBase64}`);
    } catch (err: any) {
      setError(err?.message || "Gagal generate.");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "virtual-try-on.png";
    a.click();
  }

  return (
    <>
      <header>👕 Virtual Try-On Generator</header>

      <main>
        {/* Left panel */}
        <section className="card">
          <div className="title">Preview</div>
          <div className="preview">
            {previewUrl ? <img src={previewUrl} /> : <span className="muted">Pilih gambar wajah kamu</span>}
          </div>

          <div className="controls">
            <button className="btn" onClick={onPick}>Pilih Gambar</button>
            <button className="btn danger" onClick={resetAll}>Reset</button>
            <button className="btn primary" onClick={onGenerate} disabled={loading}>
              {loading ? "Generating…" : "Generate (AI)"}
            </button>
          </div>

          <div className="muted">
            Catatan: proses bisa 15–60 detik tergantung ukuran gambar & antrean model.
          </div>

          {error && <div className="error" style={{marginTop: 8}}>Error: {error}</div>}

          <input type="file" ref={fileRef} accept="image/*" hidden onChange={onFile} />
        </section>

        {/* Right panel */}
        <section className="card">
          <div className="title">Hasil</div>
          <div className="result">
            {resultUrl ? <img src={resultUrl} /> : <span className="muted">Result will appear here</span>}
          </div>

          <div className="title" style={{marginTop: 16}}>Deskripsi (Prompt)</div>
          <textarea
            placeholder="Contoh: Kenakan kemeja batik coklat motif parang, setengah badan, latar netral…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="controls">
            <button className="btn danger" onClick={() => setResultUrl(null)}>Clear Hasil</button>
            <button className="btn primary" onClick={downloadResult} disabled={!resultUrl}>Download</button>
          </div>
        </section>
      </main>
    </>
  );
}
