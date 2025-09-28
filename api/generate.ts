// api/generate.ts — Vercel serverless (Node 18+)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleAI, Modality } from "@google/genai";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB batas ukuran

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt, imageBase64, mimeType } = req.body ?? {};
    if (!prompt || !imageBase64 || !mimeType) {
      return res.status(400).json({ error: "payload tidak lengkap" });
    }

    // estimasi byte dari base64
    const approxBytes = Math.floor(imageBase64.length * 0.75);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: "Gambar terlalu besar, maksimum 8MB." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY belum diset di server." });

    const ai = new GoogleAI({ apiKey });

    const contents = [
      {
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
    ];

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents,
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const candidates = resp.candidates ?? [];
    const imgPart = candidates[0]?.content?.parts?.find((p: any) => p?.inlineData?.data)?.inlineData;

    if (imgPart?.data) {
      return res.status(200).json({ imageBase64: imgPart.data }); // base64 tanpa prefix
    }

    const txt = candidates[0]?.content?.parts?.find((p: any) => p?.text)?.text;
    return res.status(500).json({ error: txt ?? "Model tidak mengembalikan gambar." });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "server error" });
  }
}
