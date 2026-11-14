/** Считает байты тела по чанкам, не держа тело в памяти. `onChunk` — на каждый чанк. */
export async function readBodyBytes(
  body: ReadableStream<Uint8Array> | null,
  onChunk: () => void,
): Promise<number> {
  let bytes = 0;

  if (!body) {
    return bytes;
  }

  for await (const chunk of body) {
    bytes += chunk.byteLength;
    onChunk();
  }

  return bytes;
}
