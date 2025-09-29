// App.tsx
import React, { useState, useRef } from "react";

// helper: File -> base64 dataURL
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt]   = useState<string>("");
  const [result, setResult]   = useState<string>(""); // dataURL image atau teks
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isResultImage =
    typeof result === "string" &&
    (result.startsWith("data:image/") || result.startsWith("http"));

  const pickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToBase64(f);
    setPreview(dataUrl);
    setResult("");
    setError("");
  };

  const onReset = () => {
    setPreview(null);
    setPrompt("");
    setResult("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDownload = () => {
    if (!isResultImage) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = "virtual-try-on.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onGenerate = async () => {
    if (!preview) return setError("Silakan pilih gambar dulu.");
    if (!prompt.trim()) return setError("Silakan isi prompt/instruksi.");

    setLoading(true);
    setError("");
    setResult("");

    try {
      const rawBase64 = preview.split(",")[1] || preview;

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: rawBase64, // tanpa prefix
          imageDataUrl: preview,  // dengan prefix (cadangan)
          prompt,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status} – ${txt}`);
      }

      const data = await resp.json();

      // Normalisasi output
      const outImg =
        data.imageDataUrl ||
        (data.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : null);

      if (outImg) {
        setResult(outImg);
      } else if (typeof data.output === "string") {
        setResult(data.output);
      } else {
        setResult("✅ Selesai, namun tidak ada image yang diterima dari model.");
      }
    } catch (e: any) {
      console.error(e);
      setError(`Terjadi error: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#111827",
          padding: "18px 24px",
          borderBottom: "1px solid #1f2937",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>👕 Virtual Try-On Generator</h1>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Kiri: Input */}
          <section
            style={{
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Preview</h3>

            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 12,
                border: "1px dashed #334155",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                background: "#0a0f1d",
                marginBottom: 12,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ opacity: 0.7 }}>Belum ada gambar</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
              <button onClick={pickImage} style={btn("#0ea5e9")} disabled={loading}>
                Pilih Gambar
              </button>
              <button onClick={onReset} style={btn("#ef4444")} disabled={loading}>
                Reset
              </button>
            </div>

            <div style={{ height: 12 }} />

            <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.9 }}>
              Prompt / Instruksi
            </label>
            <textarea
              placeholder="Contoh: Ganti kemeja jadi jas hitam elegan + dasi, latar belakang kantor modern."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: "100%",
                minHeight: 96,
                resize: "vertical",
                padding: 12,
                borderRadius: 10,
                outline: "none",
                border: "1px solid #334155",
                background: "#0a0f1d",
                color: "#e2e8f0",
              }}
            />

            <div style={{ height: 12 }} />
            <button onClick={onGenerate} style={btn("#22c55e")} disabled={loading}>
              {loading ? "Generating…" : "Generate (AI)"}
            </button>

            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
              Catatan: proses bisa 15–60 detik tergantung ukuran gambar & antrian model.
            </p>

            {error && (
              <div
                style={{
                  marginTop: 8,
                  background: "#1f2937",
                  border: "1px solid #4b5563",
                  color: "#fecaca",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
          </section>

          {/* Kanan: Hasil */}
          <section
            style={{
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Hasil</h3>

            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 12,
                border: "1px dashed #334155",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                background: "#0a0f1d",
              }}
            >
              {result ? (
                isResultImage ? (
                  <img
                    src={result}
                    alt="result"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      padding: 16,
                      whiteSpace: "pre-wrap",
                      maxHeight: "100%",
                      overflow: "auto",
                      width: "100%",
                    }}
                  >
                    {result}
                  </div>
                )
              ) : (
                <div style={{ opacity: 0.7 }}>🖼️ Result will appear here</div>
              )}
            </div>

            <div style={{ height: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setResult("")}
                style={btn("#ef4444")}
                disabled={loading || !result}
              >
                Clear Hasil
              </button>
              <button
                onClick={onDownload}
                style={btn("#0ea5e9")}
                disabled={!isResultImage || loading}
              >
                Download
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: "none",
    color: "white",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  };
}
