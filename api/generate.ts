// /api/generate.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Optional: perbesar limit body biar aman untuk gambar sedang
export const config = {
  maxDuration: 60, // detik
};

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

// Cari bagian image (inlineData) dari respons Gemini
function extractImageBase64(resp: any): string | undefined {
  try {
    const parts: any[] =
      resp?.response?.candidates?.[0]?.content?.parts ||
      resp?.candidates?.[0]?.content?.parts ||
      [];

    for (const p of parts) {
      // format baru (inlineData)
      if (p.inlineData?.data && p.inlineData?.mimeType?.startsWith("image/")) {
        return p.inlineData.data as string;
      }
      // beberapa versi menyimpan di 'image' atau 'binary'
      if (p.image?.data) return p.image.data as string;
      if (p.binary?.data) return p.binary.data as string;
    }
  } catch {
    // noop
  }
  return undefined;
}

// Ambil teks jika tidak ada gambar
function extractText(resp: any): string | undefined {
  try {
    const text = resp?.response?.text?.() ?? resp?.response?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      ?.filter(Boolean)
      ?.join("\n");

    if (typeof text === "string" && text.trim()) return text;
  } catch {
    // noop
  }
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, imageDataUrl, prompt } = req.body || {};

    if (!prompt || (!imageBase64 && !imageDataUrl)) {
      return res.status(400).json({ error: "Bad request: need image & prompt" });
    }

    const apiKey = getEnv("GEMINI_API_KEY");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Minta keluaran gambar. Gemini 1.5 mendukung output gambar melalui inlineData.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // generationConfig opsional; beberapa region sudah mendukung responseMimeType image/*
      generationConfig: {
        // @ts-ignore – properti baru pada beberapa release
        responseMimeType: "image/png",
      },
    });

    const base64 = imageBase64 || (imageDataUrl?.split(",")[1] ?? imageDataUrl);

    const result = await model.generateContent([
      {
        inlineData: { data: base64, mimeType: "image/png" }, // kirim sebagai png
      },
      {
        text: `
Anda adalah asisten pengolah gambar. Terapkan instruksi pengguna berikut
untuk memodifikasi penampilan (virtual try-on) pada foto yang diberikan.
Prompt pengguna: """${prompt}"""
Hasilkan satu gambar PNG sebagai output (inline/base64).`,
      },
    ]);

    // 1) coba ambil gambar base64
    const img = extractImageBase64(result);
    if (img) {
      return res.status(200).json({ imageBase64: img });
    }

    // 2) kalau tidak ada gambar, kirim teks (agar UI tetap menampilkan sesuatu)
    const text = extractText(result) ?? "Model tidak mengembalikan gambar.";
    return res.status(200).json({ output: text });
  } catch (err: any) {
    console.error("[/api/generate] error:", err);
    return res.status(500).json({
      error: "FUNCTION_INVOCATION_FAILED",
      message: err?.message || String(err),
    });
  }
}
