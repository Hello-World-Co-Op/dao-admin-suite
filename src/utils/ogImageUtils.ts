/**
 * OG Image Utilities
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 *
 * Provides:
 * - Auto-detection of suitable OG images from post content
 * - Canvas-based crop to 1200x630 aspect ratio
 * - Image dimension validation
 *
 * @see AC2 - OG image crop at 1200x630
 * @see AC3 - Auto-OG detection for first image >= 600px
 */

/** OG Image standard dimensions */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_ASPECT_RATIO = OG_WIDTH / OG_HEIGHT; // ~1.905

/** Minimum width for auto-OG candidate */
export const MIN_AUTO_OG_WIDTH = 600;

/**
 * Scan an HTML string for the first image with naturalWidth >= 600px.
 * Returns the src URL of the candidate image, or null if none found.
 *
 * This performs a DOM parse to find <img> tags in the content.
 * For client-side usage with Tiptap HTML output.
 */
export function findAutoOGCandidate(html: string): string | null {
  if (!html) return null;

  // Parse HTML to find img tags
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  for (const img of images) {
    const src = img.getAttribute('src');
    if (src) {
      // Check width attribute if present (for server-side detection)
      const widthAttr = img.getAttribute('width');
      if (widthAttr) {
        const width = parseInt(widthAttr, 10);
        if (width >= MIN_AUTO_OG_WIDTH) {
          return src;
        }
      } else {
        // No width attribute - return first image as candidate
        // Actual dimension check happens in the component with loaded image
        return src;
      }
    }
  }

  return null;
}

/**
 * Extract all image URLs from HTML content.
 * Used for scanning post body for OG image candidates.
 */
export function extractImageUrls(html: string): string[] {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  const urls: string[] = [];
  for (const img of images) {
    const src = img.getAttribute('src');
    if (src) {
      urls.push(src);
    }
  }

  return urls;
}

/**
 * Crop an image to 1200x630 aspect ratio using canvas.
 * Returns a Blob of the cropped image.
 *
 * @param imageSource - Image element or URL to crop
 * @param cropArea - Crop coordinates {x, y, width, height} as percentages (0-100)
 */
export async function cropToOGDimensions(
  imageElement: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Calculate source crop coordinates from percentage values
  const sourceX = (cropArea.x / 100) * imageElement.naturalWidth;
  const sourceY = (cropArea.y / 100) * imageElement.naturalHeight;
  const sourceWidth = (cropArea.width / 100) * imageElement.naturalWidth;
  const sourceHeight = (cropArea.height / 100) * imageElement.naturalHeight;

  ctx.drawImage(
    imageElement,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    OG_WIDTH,
    OG_HEIGHT
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Load an image from URL and return the HTMLImageElement.
 * Used for dimension checking and canvas operations.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Check if an image meets the minimum width requirement for auto-OG.
 */
export function isOGEligible(naturalWidth: number): boolean {
  return naturalWidth >= MIN_AUTO_OG_WIDTH;
}

/**
 * Calculate the default crop area for a given image to achieve 1200x630 aspect ratio.
 * Returns crop as percentages of original image dimensions.
 * Centers the crop area.
 */
export function calculateDefaultCrop(
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const imageAspect = imageWidth / imageHeight;

  if (imageAspect > OG_ASPECT_RATIO) {
    // Image is wider than OG ratio - crop width
    const cropWidth = (OG_ASPECT_RATIO / imageAspect) * 100;
    const cropX = (100 - cropWidth) / 2;
    return { x: cropX, y: 0, width: cropWidth, height: 100 };
  } else {
    // Image is taller than OG ratio - crop height
    const cropHeight = (imageAspect / OG_ASPECT_RATIO) * 100;
    const cropY = (100 - cropHeight) / 2;
    return { x: 0, y: cropY, width: 100, height: cropHeight };
  }
}
