import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const TranscribeInput = z.object({
  audioBlob: z.instanceof(Blob),
  mediaType: z.string().min(1).max(64),
  referenceText: z.string().max(2000).optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    // Handle FormData input from client
    if (input instanceof FormData) {
      const audioBlob = input.get('audioFile') as Blob | null;
      const mediaType = input.get('mediaType') as string | null;
      const referenceText = input.get('referenceText') as string | null;

      if (!audioBlob || !mediaType) {
        throw new Error("Missing audioFile or mediaType in FormData");
      }

      return {
        audioBlob,
        mediaType,
        referenceText: referenceText || undefined,
      };
    }

    return TranscribeInput.parse(input);
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    // Convert Blob to bytes (no Base64 intermediate!)
    const arrayBuffer = await data.audioBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

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
