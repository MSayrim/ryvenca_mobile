import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { LocalImageFile } from '../api/endpoints';
import { UPLOAD_JPEG_QUALITY, resizeActionFor } from './resize';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Downscales a picked photo to max 1600px on the long edge and re-encodes it as JPEG (0.85).
 * Re-encoding also normalizes HEIC/PNG inputs so the backend always receives a JPEG.
 */
export async function prepareImageForUpload(image: PickedImage): Promise<LocalImageFile & { width: number; height: number }> {
  const context = ImageManipulator.manipulate(image.uri);
  const resize = resizeActionFor({ width: image.width, height: image.height });
  if (resize) context.resize(resize);
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: UPLOAD_JPEG_QUALITY, format: SaveFormat.JPEG });
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: 'image/jpeg',
    fileName: `ryvenca-${Date.now()}.jpg`,
  };
}
