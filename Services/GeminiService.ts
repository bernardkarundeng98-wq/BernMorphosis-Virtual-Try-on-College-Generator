// Client-side helper to call our Vercel Function
export async function generateWithGemini(params: {
  prompt: string;
  imageBase64: string; // data URL allowed
}): Promise<{ output: string }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  return res.json();
}
