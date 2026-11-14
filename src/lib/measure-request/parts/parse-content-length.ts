/**
 * Ожидаемый размер тела из `Content-Length`.
 *
 * @returns `undefined`, если заголовка нет, он не целое неотрицательное число
 *          или ответ сжат (`Content-Length` тогда — размер сжатого тела).
 */
export function parseContentLength(headers: Headers): number | undefined {
  const encoding = headers.get('content-encoding')?.trim().toLowerCase();

  if (encoding && encoding !== 'identity') {
    return undefined;
  }

  const raw = headers.get('content-length')?.trim();

  if (!raw || !/^\d+$/.test(raw)) {
    return undefined;
  }

  const size = Number(raw);

  if (!Number.isSafeInteger(size)) {
    return undefined;
  }

  return size;
}
