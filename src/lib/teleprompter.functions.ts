import { createServerFn } from "@tanstack/react-start";

/**
 * Transcripción simulada (mock) para pruebas sin costo en la API de OpenAI/Whisper.
 * La llamada real a Whisper está comentada más abajo. Para reactivarla, descomentar
 * el bloque y eliminar el return simulado.
 */
export const transcribeAudio = createServerFn({
  method: "POST",
})
  .handler(async (formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Expected FormData with audioFile and sessionId");
    }

    const sessionId = formData.get("sessionId") as string | null;
    if (!sessionId) throw new Error("sessionId required");

    // --- MOCK TEMPORAL (sin costo de API) ---
    return {
      transcript: "Esta es una transcripción simulada desde Lovable.",
      confidence: 0.99,
    };

    // --- Llamada real a Whisper (comentada temporalmente) ---
    /*
    const audioFile = formData.get("audioFile") as File | null;
    const referenceText = formData.get("referenceText") as string | null;

    if (!audioFile) throw new Error("audioFile required");

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY no configurada");
    }

    const payload = new FormData();
    payload.append("file", audioFile);
    payload.append("model", "whisper-1");
    payload.append("language", "es");
    if (referenceText && referenceText.trim().length > 0) {
      payload.append("prompt", `Hint: "${referenceText}"`);
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey}` },
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI transcription error: ${response.status} ${response.statusText} ${errorText}`);
    }

    const data = (await response.json()) as { text?: string };
    const transcript = data.text?.trim() ?? "";
    return { transcript, confidence: 0.95 };
    */
  });
