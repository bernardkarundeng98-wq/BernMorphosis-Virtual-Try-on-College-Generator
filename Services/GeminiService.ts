// Services/geminiService.ts
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Ambil API key dari environment Vite.
 * Wajib diawali "VITE_" agar terbaca di browser build.
 */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!API_KEY) {
  throw new Error(
    "VITE_GEMINI_API_KEY belum di-set. Tambahkan di Vercel: Project → Settings → Environment Variables."
  );
}

// Inisialisasi client Gemini untuk pemakaian di browser.
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Meminta model menghasilkan 1 gambar (base64) berdasarkan foto referensi + prompt.
 * @param prompt    Instruksi teks untuk model
 * @param imageBase64 Base64 TANPA prefix (hasil dari FileReader)
 * @param mimeType  Contoh: "image/jpeg", "image/png", "image/webp"
 * @returns         Base64 (tanpa prefix) hasil generasi
 */
export async function generateCollage(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  console.log("[geminiService] generateCollage() called", {
    mimeType,
    inputSize: imageBase64?.length,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      // Minta model balas IMAGE (utama) dan TEXT (jika ada), supaya kita bisa tangani keduanya.
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    console.log("[geminiService] raw response:", response);

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("Model tidak mengembalikan kandidat (candidates kosong).");
    }

    // Kalau ada indikasi diblokir oleh safety filter (bergantung versi SDK)
    const finishReason = (candidate as any).finishReason;
    if (finishReason && String(finishReason).toLowerCase().includes("safety")) {
      throw new Error(
        "Permintaan diblokir oleh safety filter. Coba ubah prompt/gambar agar lebih aman."
      );
    }

    // Cari part image (inlineData)
    const parts = candidate.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p?.inlineData?.data);

    if (imagePart?.inlineData?.data) {
      console.log("[geminiService] success: got image inlineData");
      return imagePart.inlineData.data as string; // base64 tanpa prefix
    }

    // Kalau tidak ada image, mungkin model membalas TEXT (misal penjelasan error/kebijakan)
    const textPart = parts.find((p: any) => typeof p?.text === "string")?.text;
    if (textPart) {
      console.warn("[geminiService] model returned TEXT instead of IMAGE:", textPart);
      throw new Error(
        `Model tidak mengembalikan gambar. Pesan model: ${textPart}`
      );
    }

    throw new Error("Model tidak mengembalikan image maupun teks yang bisa dibaca.");
  } catch (err: any) {
    // Tangkap error jaringan/SDK/parse
    console.error("[geminiService] error:", err);

    // Buat pesan error yang lebih ramah di UI
    if (err?.message?.includes("Failed to fetch")) {
      throw new Error(
        "Gagal terhubung ke layanan Gemini (network error). Coba cek koneksi internet atau ulangi beberapa saat."
      );
    }
    if (err?.message?.toLowerCase().includes("unauthorized") || err?.status === 401) {
      throw new Error(
        "Unauthorized (401). Cek kembali VITE_GEMINI_API_KEY di Vercel dan lakukan redeploy."
      );
    }
    if (err?.status === 403) {
      throw new Error(
        "Forbidden (403). Periksa kuota/izin akses model di Google AI Studio."
      );
    }

    throw new Error(err?.message || "Terjadi kesalahan saat memanggil Gemini API.");
  }
}
