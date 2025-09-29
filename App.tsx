import React, { useCallback, useMemo, useState } from "react";

/**
 * Util: baca file sebagai DataURL (data:image/...;base64,XXXX)
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Util: ekstrak mimeType dan base64 "bersih" dari DataURL
 * contoh: "data:image/png;base64,AAA..." -> { mimeType: "image/png", base64: "AAA..." }
 */
function parseDataURL(dataUrl: string) {
  // data:[mime];base64,[payload]
  const [header, payload = ""] = dataUrl.split(",");
  const mimeMatch = header.match(/^data:(.*?);base64$/i);
  const mimeType = mimeMatch?.[1] || "image/png";
  return { mimeType, base64: payload };
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // prompt default — bisa kamu ganti sesuai kebutuhan
  const prompt = useMemo(
    () =>
      "Ganti pakaian orang pada foto menjadi kemeja formal putih rapi, pencahayaan studio, kualitas tinggi. Hasilkan sebagai gambar PNG.",
    []
  );

  const onPickFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setResultImage("");
    const f = e.target.files?.[0];
    if (!f) return;
    // batasi ukuran (opsional)
    if (f.size > 8 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (maks 8MB).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const onReset = useCallback(() => {
    setFile(null);
    setPreviewUrl("");
    setResultImage("");
    setError("");
  }, []);

  const onClearResult = useCallback(() => {
    setResultImage("");
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      setError("");
      setResultImage("");
      if (!file) {
        setError("Silakan pilih gambar terlebih dahulu.");
        return;
      }
      setLoading(true);

      // baca sebagai dataURL lalu ekstrak base64 & mime
      const dataUrl = await readFileAsDataURL(file);
      const { base64, mimeType } = parseDataURL(dataUrl);

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageBase64: base64,
          mimeType,
        }),
      });

      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail?.error || `Request failed (${resp.status})`);
      }

      const json: { output: string } = await resp.json();

      // Catatan: API kita saat ini mengembalikan "output" sebagai TEKS (bukan gambar).
      // Jika modelmu mengembalikan URI gambar base64, kamu bisa set langsung.
      // Di sini diasumsikan "output" adalah URL data:image/png;base64,xxx ATAU link publik.
      // Kita coba deteksi:
      if (json.output?.startsWith("data:image/")) {
        setResultImage(json.output);
      } else if (/^https?:\/\//i.test(json.output)) {
        setResultImage(json.output);
      } else {
        // jika teks biasa, tampilkan sebagai error sementara
        setError("Model mengembalikan teks: " + json.output.slice(0, 200));
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses.");
    } finally {
      setLoading(false);
    }
  }, [file, prompt]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>👕</span>
        <h1 style={styles.title}>Virtual Try-On Generator</h1>
      </header>

      <main style={styles.main}>
        <section style={styles.column}>
          <h2 style={styles.sectionTitle}>Preview</h2>
          <div style={styles.previewBox}>
            {previewUrl ? (
              <img src={previewUrl} alt="preview" style={styles.img} />
            ) : (
              <div style={styles.placeholder}>Belum ada gambar</div>
            )}
          </div>

          <div style={styles.row}>
            <label style={styles.uploadBtn}>
              Pilih Gambar
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                style={{ display: "none" }}
              />
            </label>

            <button style={styles.resetBtn} onClick={onReset} disabled={!file && !previewUrl}>
              Reset
            </button>

            <button style={styles.generateBtn} onClick={handleGenerate} disabled={loading || !file}>
              {loading ? "Memproses..." : "Generate (AI)"}
            </button>
          </div>

          <p style={styles.note}>
            Catatan: proses bisa 15–60 detik tergantung ukuran gambar & antrean model.
          </p>

          {error && <p style={styles.error}>Error: {error}</p>}
        </section>

        <section style={styles.column}>
          <h2 style={styles.sectionTitle}>Hasil</h2>
          <div style={styles.resultBox}>
            {resultImage ? (
              <img src={resultImage} alt="result" style={styles.img} />
            ) : (
              <div style={styles.placeholder}>Hasil akan tampil di sini</div>
            )}
          </div>

          <div style={styles.row}>
            <button style={styles.clearBtn} onClick={onClearResult} disabled={!resultImage}>
              Clear Hasil
            </button>
            {resultImage && (
              <a href={resultImage} download="virtual-try-on.png" style={styles.downloadBtn}>
                Download
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================== Styles (inline) ================== */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #111 0%, #1a1a1a 100%)",
    color: "#e9eef5",
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    background: "#0f0f10",
    borderBottom: "1px solid #2a2a2a",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: { fontSize: 22 },
  title: { margin: 0, fontWeight: 800, letterSpacing: 0.4 },
  main: {
    maxWidth: 1200,
    margin: "24px auto",
    padding: "0 16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  column: {
    background: "#161718",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,.25)",
  },
  sectionTitle: { margin: "4px 0 14px 0", opacity: 0.9 },
  previewBox: {
    height: 420,
    borderRadius: 12,
    border: "1px dashed #3a3a3a",
    background: "#0f0f11",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  resultBox: {
    height: 420,
    borderRadius: 12,
    border: "1px solid #2f2f2f",
    background: "#0e0f10",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "contain" },
  placeholder: { opacity: 0.5, fontSize: 14 },
  row: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  uploadBtn: {
    background: "#2c6fef",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid #2a62cf",
    fontWeight: 600,
  },
  resetBtn: {
    background: "#3a3a3a",
    color: "#eee",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid #2e2e2e",
    fontWeight: 600,
  },
  generateBtn: {
    background: "#12a150",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid #108b45",
    fontWeight: 700,
  },
  clearBtn: {
    background: "#5a2a2a",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid #4a2020",
    fontWeight: 700,
  },
  downloadBtn: {
    background: "#2b2f54",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    border: "1px solid #26305a",
    fontWeight: 700,
  },
  note: { marginTop: 10, opacity: 0.7, fontSize: 12 },
  error: { marginTop: 8, color: "#ff7a7a", fontWeight: 700 },
};
