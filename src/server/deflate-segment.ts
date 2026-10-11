import zlib from "node:zlib";

/**
 * Deflates `text` to raw deflate blocks that end in a sync flush in place of a final block,
 * so segments join into one deflate stream. A segment deflated against `dictionary`
 * decodes only right after that text.
 */
export function deflateSegment(text: string, dictionary?: string): Buffer {
  return zlib.deflateRawSync(text, {
    finishFlush: zlib.constants.Z_SYNC_FLUSH,
    ...(dictionary !== undefined && {dictionary: Buffer.from(dictionary)}),
  });
}
