/**
 * OGImageCropper Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 * Task: Create OGImageCropper component (AC2)
 *
 * Features:
 * - Fixed 1200x630 aspect ratio crop interface
 * - Grid overlay and dimension indicators
 * - "Save Crop" button triggers upload via image upload pipeline
 * - Upload progress indicator
 * - Cancel button discards crop
 *
 * Uses a simple canvas-based crop approach to avoid additional dependencies.
 * The react-image-crop library was evaluated but a lightweight custom solution
 * is preferred to keep bundle size minimal.
 *
 * @see AC2 - OG image crop at 1200x630 aspect ratio
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { OG_WIDTH, OG_HEIGHT, OG_ASPECT_RATIO, calculateDefaultCrop, cropToOGDimensions } from '@/utils/ogImageUtils';

interface OGImageCropperProps {
  imageUrl: string;
  onSave: (croppedBlob: Blob) => Promise<void>;
  onCancel: () => void;
  uploading?: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function OGImageCropper({ imageUrl, onSave, onCancel, uploading = false }: OGImageCropperProps) {
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize crop when image loads
  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    const defaultCrop = calculateDefaultCrop(img.naturalWidth, img.naturalHeight);
    setCrop(defaultCrop);
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  }, []);

  // Handle save crop
  const handleSaveCrop = useCallback(async () => {
    const img = imageRef.current;
    if (!img) return;

    try {
      const croppedBlob = await cropToOGDimensions(img, crop);
      await onSave(croppedBlob);
    } catch (error) {
      console.error('[OGImageCropper] Crop failed:', error);
    }
  }, [crop, onSave]);

  // Simple crop adjustment via drag (simplified for now)
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
    };
  }, [crop.x, crop.y]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !imageRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - crop.width, dragStartRef.current.cropX + deltaX));
      const newY = Math.max(0, Math.min(100 - crop.height, dragStartRef.current.cropY + deltaY));

      setCrop(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, crop.width, crop.height]);

  return (
    <div className="space-y-4" data-testid="og-image-cropper">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Crop OG Image</h4>
        <span className="text-xs text-gray-500" data-testid="crop-dimensions">
          {OG_WIDTH} x {OG_HEIGHT}px
        </span>
      </div>

      {/* Image crop area */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-gray-100 rounded-md border border-gray-200 cursor-move select-none"
        style={{ aspectRatio: `${OG_ASPECT_RATIO}` }}
        data-testid="crop-container"
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Image to crop"
          className="w-full h-full object-contain"
          onLoad={handleImageLoad}
          data-testid="crop-image"
          draggable={false}
        />

        {/* Crop overlay */}
        {imageLoaded && (
          <div
            className="absolute inset-0"
            onMouseDown={handleMouseDown}
            data-testid="crop-overlay"
          >
            {/* Darkened areas outside crop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Crop window */}
            <div
              className="absolute border-2 border-white"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                backgroundColor: 'transparent',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              }}
              data-testid="crop-window"
            >
              {/* Grid overlay (rule of thirds) */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
                <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image dimensions info */}
      {imageLoaded && (
        <p className="text-xs text-gray-500" data-testid="image-dimensions">
          Original: {imageDimensions.width} x {imageDimensions.height}px
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          data-testid="crop-cancel-button"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveCrop}
          disabled={!imageLoaded || uploading}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
          data-testid="crop-save-button"
        >
          {uploading ? (
            <>
              <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" data-testid="crop-upload-spinner" />
              Uploading...
            </>
          ) : (
            'Save Crop'
          )}
        </button>
      </div>
    </div>
  );
}
