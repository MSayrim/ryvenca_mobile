export const MAX_UPLOAD_EDGE = 1600;
export const UPLOAD_JPEG_QUALITY = 0.85;

export interface Size {
  width: number;
  height: number;
}

/**
 * Computes the downscaled size so the longest edge is at most `maxEdge`, preserving aspect ratio.
 * Returns `null` when no resize is needed (or the input is invalid).
 */
export function computeResizeTarget(size: Size, maxEdge: number = MAX_UPLOAD_EDGE): Size | null {
  const { width, height } = size;
  if (!(width > 0) || !(height > 0) || !(maxEdge > 0)) return null;
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return null;
  const scale = maxEdge / longEdge;
  if (width >= height) {
    return { width: maxEdge, height: Math.max(1, Math.round(height * scale)) };
  }
  return { width: Math.max(1, Math.round(width * scale)), height: maxEdge };
}

/**
 * Resize action for expo-image-manipulator: pass only the long edge so the library keeps the
 * exact aspect ratio itself.
 */
export function resizeActionFor(size: Size, maxEdge: number = MAX_UPLOAD_EDGE): { width: number } | { height: number } | null {
  const target = computeResizeTarget(size, maxEdge);
  if (!target) return null;
  return size.width >= size.height ? { width: target.width } : { height: target.height };
}
