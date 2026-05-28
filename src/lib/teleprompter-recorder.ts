// Browser-only helpers for capturing microphone audio with MediaRecorder.

export type RecorderHandle = {
  stop: () => Promise<{ audioBase64: string; mediaType: string; durationMs: number }>;
  cancel: () => void;
};

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const mt of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mt)) {
      return mt;
    }
  }
  return "audio/webm";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function startMicRecording(): Promise<RecorderHandle> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Tu navegador no soporta acceso al micrófono.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaType = pickMimeType();
  const recorder = new MediaRecorder(stream, { mimeType: mediaType });
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();
  let cancelled = false;

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  recorder.start();

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
  };

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = async () => {
          cleanup();
          if (cancelled) return;
          try {
            const blob = new Blob(chunks, { type: mediaType });
            const audioBase64 = await blobToBase64(blob);
            resolve({
              audioBase64,
              mediaType: mediaType.split(";")[0],
              durationMs: Date.now() - startedAt,
            });
          } catch (err) {
            reject(err);
          }
        };
        if (recorder.state !== "inactive") recorder.stop();
      }),
    cancel: () => {
      cancelled = true;
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
    },
  };
}
