import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs20.x" };

type Body = { prompt?: string; imageBase64: string };

function stripDataUrl(b64: string) {
  const i = b64.indexOf("base64,");
  return i >= 0 ? b64.slice(i + "base64,".length) : b64;
}
function mimeOf(b64: string) {
  if (b64.startsWith("data:image/jpeg") || b64.startsWith("data:image/jpg")) return "image/jpeg";
  if (b64.startsWith("data:image/webp")) return "image/webp";
  return "image/png";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { prompt = "Describe the outfit and propose improvements.", imageBase64 } = req.body as Body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const inlineData = { mimeType: mimeOf(imageBase64), data: stripDataUrl(imageBase64) };
    const result = await model.generateContent([
      { text: `You are a fashion stylist. Given the photo, respond in Indonesian with concrete outfit suggestions and step-by-step editing instructions. Prompt user request: ${prompt}` },
      { inlineData }
    ]);

    const output = result.response.text();
    return res.status(200).json({ output });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "FUNCTION_INVOCATION_FAILED", message: err?.message || String(err) });
  }
}
