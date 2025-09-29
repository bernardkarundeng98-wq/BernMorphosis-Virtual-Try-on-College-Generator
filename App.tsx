// App.tsx
import React, { useCallback, useState } from "react";

// Komponen UI
import ImageUploader from "./Component/ImageUploader";
import GeneratedImage from "./Component/Generatedimage";
import Loader from "./Component/Loader";

// Layanan & util
import { generateCollage } from "./Services/geminiService";
import { fileToBase64 } from "./Utils/fileUtils";

const App: React.FC = () => {
  // ======= State =======
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ======= Handlers =======
  const handleFileChange = (file: File | null) => {
    console.log("[UI] handleFileChange:", file?.name, file?.type, file?.size);
    if (file) {
      setSourceFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImageUrl(null);
      setError(null);
    }
  };

  const handleReset = () => {
    console.log("[UI] Reset ditekan");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSourceFile(null);
    setPreviewUrl(null);
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError("Please upload an image first.");
      console.warn("[UI] Generate ditekan tanpa file.");
      return;
    }

    console.log("[UI] Generate diklik. File:", {
      name: sourceFile.name,
      type: sourceFile.type,
      size: sourceFile.size,
    });

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const imageBase64 = await fileToBase64(sourceFile);
      console.log("[UI] Base64 length:", imageBase64.length);

      // === Prompt kolase (boleh kamu modifikasi nanti) ===
      const prompt = `Tugas: Buat kolase foto ultra-fotorealistik 8K yang terdiri dari 9 bingkai dalam susunan grid 3x3 vertikal (rasio aspek keseluruhan 9:16).

Input Referensi: Gunakan gambar yang diunggah sebagai referensi utama.

Aturan Mutlak:
1) Wajah & tubuh harus 100% sama seperti foto referensi (tanpa beautify).
2) Jika memegang produk, pertahankan produk dan posisi pegangnya di semua bingkai.
3) Latar belakang: setiap bingkai di dalam kotak kardus sederhana cokelat polos yang konsisten.

Tema: trendi, youthful, ekspresif, cocok untuk media sosial.

Detail 9 Bingkai:
1) Hoodie pastel + bubble tea, ekspresi ceria.
2) Cardigan burgundy + kapas skincare, senyum lucu.
3) Sweater krem + membaca majalah fashion, tatapan penasaran.
4) Jaket denim + headphone + makan ramen, ekspresi fokus.
5) Atasan oranye-cokelat + memegang polaroid, ekspresi melamun.
6) Kaos hijau mint + papan nama "BERN" + tanda peace.
7) Piyama abu-abu + bersandar bantal, mata terpejam rileks.
8) Kaos bergaris + apron + tas belanja sayur, ekspresi antusias.
9) Kaos lengan panjang pink bergrafis + selfie kamera polaroid, senyum ceria.

Output: satu gambar kolase tunggal 8K, karakter konsisten di seluruh bingkai.`;

      console.log("[UI] Memanggil generateCollage...");
      const resultBase64 = await generateCollage(prompt, imageBase64, sourceFile.type);
      console.log("[UI] Sukses generate. Hasil base64 length:", resultBase64?.length);

      setGeneratedImageUrl(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      console.error("[UI] Error generate:", err);
      setError(err?.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile]);

  // ======= Render =======
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-gray-800 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            <span role="img" aria-label="shirt">👕</span>{" "}
            Virtual Try-On Generator
          </h1>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
        {/* Kiri: Upload + tombol */}
        <section className="lg:w-1/3 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Preview</h2>
          <ImageUploader onFileChange={handleFileChange} previewUrl={previewUrl} />

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md"
            >
              Reset Gambar
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !sourceFile}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-md"
            >
              {isLoading ? "Generating..." : "Generate (AI)"}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-md p-3">
              <strong>Generation Failed:</strong> {error}
            </div>
          )}
        </section>

        {/* Kanan: Hasil */}
        <section className="lg:w-2/3 flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg min-h-[420px]">
          {isLoading ? (
            <Loader />
          ) : generatedImageUrl ? (
            <GeneratedImage imageUrl={generatedImageUrl} />
          ) : (
            <div className="text-center text-gray-400 p-8">
              <h3 className="text-2xl font-semibold mb-2">Your collage will appear here</h3>
              <p>Upload an image dan klik <em>Generate (AI)</em> untuk mulai.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
