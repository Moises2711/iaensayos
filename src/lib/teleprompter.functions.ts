import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const TranscribeInput = z.object({
  audioBase64: z.string().min(1),
  mediaType: z.string().min(1).max(64),
  referenceText: z.string().max(2000).optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    // Decode base64 to bytes
    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const prompt = data.referenceText
      ? `Transcribe textualmente el audio en español. Texto de referencia esperado (úsalo solo como guía, no lo copies si difiere): "${data.referenceText}". Devuelve SOLO la transcripción literal de lo que se escucha, sin comillas ni comentarios.`
      : "Transcribe textualmente el audio en español. Devuelve SOLO la transcripción, sin comentarios.";

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: bytes, mediaType: data.mediaType },
          ],
        },
      ],
    });

    const transcript = result.text.trim();
    return { transcript };
  });
