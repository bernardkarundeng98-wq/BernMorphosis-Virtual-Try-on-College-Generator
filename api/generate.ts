import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

/**
 * Helper: validasi body
 */
function bad(res: VercelResponse, msg: string, code = 400) {
  return res.status(code).json({ error: msg });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya ijinkan POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return bad(res, "Method Not Allowed", 405);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return bad(res, "GEMINI_API_KEY tidak ditemukan di env Vercel", 500);

    const { prompt, imageBase64 } = req.body || {};
    if (!prompt || !imageBase64) return bad(res, "prompt dan imageBase64 wajib diisi");

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8
      }
    });

    // Kirim input multimodal (teks + gambar)
    const g = await model.generateContent([
      { text: `Ubah foto sesuai deskripsi berikut. Hasilkan satu gambar PNG. Deskripsi: ${prompt}` },
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/png"
        }
      }
    ]);

    // Ambil gambar base64 dari response
    const resp = g.response;
    const mime = resp.candidates?.[0]?.content?.parts?.find(p => (p as any).inlineData)?.inlineData?.mimeType || "image/png";
    const data = resp.candidates?.[0]?.content?.parts?.find(p => (p as any).inlineData)?.inlineData?.data;

    if (!data) return bad(res, "Model tidak mengembalikan gambar", 502);

    return res.status(200).json({ imageBase64: data, mime });
  } catch (err: any) {
    console.error("API error:", err?.message || err);
    return bad(res, err?.message || "FUNCTION_INVOCATION_FAILED", 500);
  }
}
