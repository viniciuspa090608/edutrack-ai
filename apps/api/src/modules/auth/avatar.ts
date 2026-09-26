import sharp from 'sharp';
import { HttpError } from '../../shared/http-error.js';

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const invalid = () =>
  new HttpError(
    400,
    'INVALID_AVATAR',
    'Use JPEG, PNG ou WebP estático de até 2 MiB, entre 64 e 4096 pixels por lado e até 16 milhões de pixels.',
  );
// Avoid unlimited native image queues and bound each decoder's input pixels/time.
let processing = 0;
export async function processAvatar(
  bytes: Buffer,
  mime: string,
): Promise<Buffer> {
  if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) throw invalid();
  if (processing >= 4)
    throw new HttpError(
      503,
      'AVATAR_BUSY',
      'Aguarde e tente enviar a foto novamente.',
    );
  processing += 1;
  try {
    const image = sharp(bytes, {
      failOn: 'warning',
      limitInputPixels: 16_000_000,
    }).timeout({ seconds: 5 });
    const meta = await image.metadata();
    const types = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    if (
      !meta.format ||
      !(meta.format in types) ||
      types[meta.format as keyof typeof types] !== mime ||
      (meta.pages ?? 1) !== 1 ||
      !meta.width ||
      !meta.height ||
      meta.width < 64 ||
      meta.height < 64 ||
      meta.width > 4096 ||
      meta.height > 4096 ||
      meta.width * meta.height > 16_000_000
    )
      throw invalid();
    // APNG can be reported as a single page by decoders without APNG support.
    if (meta.format === 'png' && bytes.includes(Buffer.from('acTL')))
      throw invalid();
    const output = await image
      .rotate()
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    if (output.length > MAX_AVATAR_BYTES) throw invalid();
    return output;
  } catch {
    throw invalid();
  } finally {
    processing -= 1;
  }
}
