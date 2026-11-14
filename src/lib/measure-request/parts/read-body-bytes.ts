/**
 * Считает байты тела по чанкам, не держа тело в памяти.
 * `onChunk` — на каждый чанк, с накопленным числом байт.
 */
export async function readBodyBytes(
  body: ReadableStream<Uint8Array> | null,
  onChunk: (received: number) => void,
): Promise<number> {
  let bytes = 0;

  if (!body) {
    return bytes;
  }

  for await (const chunk of body) {
    bytes += chunk.byteLength;
    onChunk(bytes);
  }

  return bytes;
}
