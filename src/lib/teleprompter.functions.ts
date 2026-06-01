import { createServerFn } from "@tanstack/react-start";

export const transcribeAudio = createServerFn({
  method: "POST",
})
  .handler(async (payloadObj: any) => {
    // 1. Recibimos los datos disfrazados de texto plano
    const { audioBase64, sessionId, referenceText } = payloadObj;

    if (!audioBase64 || !sessionId) {
      throw new Error("Faltan datos requeridos (audioBase64 o sessionId)");
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) throw new Error("OPENAI_API_KEY no configurada");

    // 2. Reconstruimos el audio real a partir del texto Base64
    const base64Data = audioBase64.split(',')[1] || audioBase64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });

    // 3. Empaquetamos para OpenAI (A ellos sí les gusta el FormData)
    const payload = new FormData();
    payload.append("file", audioBlob, "grabacion.webm");
    payload.append("model", "whisper-1");
    payload.append("language", "es");
    
    if (referenceText && referenceText.trim().length > 0) {
      payload.append("prompt", `Hint: "${referenceText}"`);
    }

    // 4. Enviamos a la IA
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey}` },
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI transcription error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { transcript: data.text?.trim() ?? "", confidence: 0.95 };
  });