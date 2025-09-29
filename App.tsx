import React, { useCallback, useState } from "react";
import { generateCollage } from "./Services/geminiService";
import { fileToBase64 } from "./Utils/fileUtils";

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("File harus gambar (PNG/JPG).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setErr(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("File harus gambar (PNG/JPG).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setErr(null);
  }, []);

  const onGenerate = useCallback(async () => {
    if (!file) {
      setErr("Upload gambar dulu ya.");
      return;
    }
    setIsLoading(true);
    setErr(null);
    setResultUrl(null);
    try {
      const base64 = await fileToBase64(file);

      const prompt = `Tugas: Buat kolase foto ultra-fotorealistik 8K yang terdiri dari 9 bingkai (grid 3x3, rasio 9:16).
Aturan:
- Pertahankan 100% wajah, warna kulit, dan proporsi tubuh orang pada foto referensi.
- Jika memegang produk, pertahankan produk & cara memegangnya.
- Latar belakang: kotak kardus cokelat polos yang konsisten di tiap bingkai.
Tema: trendi, youthful, ekspresif, cocok estetika media sosial.
Detail 9 bingkai (unik tiap bingkai):
1. Hoodie pastel + bubble tea, ceria.
2. Cardigan burgundy + oles skincare dengan kapas, senyum lucu.
3. Sweater krem + baca majalah fashion, penasaran.
4. Jaket denim + headphone + makan ramen, fokus.
5. Atasan oranye-cokelat + pegang foto polaroid, melamun.
6. Kaos hijau mint + papan nama "BERN" + pose peace.
7. Piyama abu-abu + sandar bantal, mata terpejam.
8. Kaos garis + apron + tas belanja sayur, antusias.
9. Kaos lengan panjang pink bergrafis + selfie kamera polaroid, ceria.
Output: 1 gambar kolase tunggal 8K, karakter konsisten di 9 bingkai.`;

      const resultB64 = await generateCollage(prompt, base64, file.type);
      setResultUrl(`data:image/png;base64,${resultB64}`);
    } catch (e: any) {
      setErr(e?.message ?? "Gagal generate gambar.");
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const onReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setErr(null);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-900/80 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">👕</span>
          <h1 className="text-xl sm:text-2xl font-bold">
            Virtual Try-On Generator
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* Left: Uploader / Preview */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Preview</h2>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="group relative block w-full aspect-[3/4] rounded-xl border border-dashed border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 transition grid place-items-center overflow-hidden"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-center px-6 py-10 text-neutral-400">
                <div className="text-4xl mb-2">⬆️</div>
                <p className="font-medium">Klik untuk upload</p>
                <p className="text-sm opacity-80">atau drag & drop foto ke sini</p>
                <p className="text-xs mt-2 opacity-60">PNG/JPG hingga 10MB</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={onPick}
            />
          </label>

          <div className="mt-4 flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 font-medium"
            >
              Reset Gambar
            </button>
            <button
              onClick={onGenerate}
              disabled={!file || isLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold"
            >
              {isLoading ? "Generating…" : "Generate (AI)"}
            </button>
          </div>

          {err && (
            <p className="mt-3 text-sm text-red-400">
              ⚠️ {err}
            </p>
          )}
        </section>

        {/* Right: Hasil */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Hasil</h2>
          <div className="relative w-full min-h-[320px] rounded-xl border border-neutral-800 bg-neutral-800/50 grid place-items-center overflow-hidden">
            {isLoading && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-neutral-600 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-neutral-300 font-medium">Sedang membuat kolase 9 gaya…</p>
                <p className="text-neutral-400 text-sm mt-1">Mohon tunggu ya (± beberapa detik)</p>
              </div>
            )}

            {!isLoading && resultUrl && (
              <img
                src={resultUrl}
                alt="AI result"
                className="w-full h-full object-contain"
              />
            )}

            {!isLoading && !resultUrl && (
              <p className="text-neutral-400 text-sm">
                Hasil akan tampil di sini setelah proses selesai.
              </p>
            )}
          </div>

          {!isLoading && resultUrl && (
            <a
              href={resultUrl}
              download="virtual-try-on-collage.png"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold"
            >
              Download PNG
            </a>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} BernMorphosis — Demo Virtual Try-On
      </footer>
    </div>
  );
};

export default App;
