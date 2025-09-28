// Services/geminiService.ts
// Client-side: memanggil serverless endpoint /api/generate
export async function generateCollage(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, mimeType }),
  });

  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error ?? "Generate gagal");
  }
  // Kembalikan base64 (tanpa prefix). App.tsx akan menambahkan "data:image/png;base64,"
  return data.imageBase64 as string;
}
