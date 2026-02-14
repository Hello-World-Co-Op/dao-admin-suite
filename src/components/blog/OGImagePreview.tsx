/**
 * OGImagePreview Component
 *
 * Story BL-008.3.6: Post Preview and OG Image Management
 * Task: Extend MetadataPanel with OG image section (AC2, AC3)
 *
 * Features:
 * - Shows current OG image (custom or auto-selected) at 1200x630 thumbnail
 * - "Upload Custom OG Image" button opens file picker -> OGImageCropper
 * - "Use Auto-Selected" button resets to first eligible image
 * - Auto-selection badge when using auto-detection
 * - Generic fallback OG preview when no image available
 * - Image dimensions and file size display
 *
 * @see AC2 - OG image upload with 1200x630 crop
 * @see AC3 - Auto-OG detection for first image >= 600px
 */

import { useState, useRef, useCallback } from 'react';
import { OGImageCropper } from './OGImageCropper';

interface OGImagePreviewProps {
  /** Custom OG image URL (set by author) */
  ogImageUrl: string | null;
  /** Auto-detected OG image URL (from post body) */
  autoOgImageUrl: string | null;
  /** Called when a new OG image is uploaded and saved */
  onOGImageChange: (url: string | null) => void;
  /** Oracle bridge URL for image upload */
  oracleBridgeUrl: string;
}

export function OGImagePreview({
  ogImageUrl,
  autoOgImageUrl,
  onOGImageChange,
  oracleBridgeUrl,
}: OGImagePreviewProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = ogImageUrl || autoOgImageUrl;
  const isAutoSelected = !ogImageUrl && !!autoOgImageUrl;

  // Handle file selection for custom OG image
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSourceUrl(objectUrl);
    setShowCropper(true);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle save from cropper
  const handleCropSave = useCallback(async (croppedBlob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', croppedBlob, 'og-image.jpg');
      formData.append('type', 'og');

      const response = await fetch(`${oracleBridgeUrl}/api/blog/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onOGImageChange(data.url);
      setShowCropper(false);

      // Clean up object URL
      if (cropSourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cropSourceUrl);
      }
    } catch (error) {
      console.error('[OGImagePreview] Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [oracleBridgeUrl, onOGImageChange, cropSourceUrl]);

  // Handle cancel crop
  const handleCancelCrop = useCallback(() => {
    setShowCropper(false);
    if (cropSourceUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropSourceUrl('');
  }, [cropSourceUrl]);

  // Handle clearing custom OG to use auto-selected
  const handleUseAutoSelected = useCallback(() => {
    onOGImageChange(null);
  }, [onOGImageChange]);

  // Handle removing OG image entirely
  const handleRemoveOG = useCallback(() => {
    onOGImageChange(null);
  }, [onOGImageChange]);

  return (
    <div className="space-y-3" data-testid="og-image-preview">
      <h4 className="text-sm font-medium text-gray-700">OG Image</h4>

      {showCropper ? (
        <OGImageCropper
          imageUrl={cropSourceUrl}
          onSave={handleCropSave}
          onCancel={handleCancelCrop}
          uploading={uploading}
        />
      ) : (
        <>
          {/* OG Image thumbnail */}
          {displayUrl ? (
            <div className="space-y-2">
              <div className="relative">
                <img
                  src={displayUrl}
                  alt="OG image preview"
                  className="w-full rounded-md border border-gray-200 object-cover"
                  style={{ aspectRatio: '1200/630' }}
                  data-testid="og-image-thumbnail"
                />
                {isAutoSelected && (
                  <span
                    className="absolute top-2 left-2 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"
                    data-testid="og-auto-badge"
                  >
                    Auto-Selected
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="og-upload-button"
                >
                  {ogImageUrl ? 'Replace' : 'Upload Custom'}
                </button>
                {ogImageUrl && autoOgImageUrl && (
                  <button
                    type="button"
                    onClick={handleUseAutoSelected}
                    className="flex-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="og-use-auto-button"
                  >
                    Use Auto-Selected
                  </button>
                )}
                {ogImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveOG}
                    className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500"
                    data-testid="og-remove-button"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Generic fallback */
            <div className="space-y-2">
              <div
                className="w-full rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-sm"
                style={{ aspectRatio: '1200/630' }}
                data-testid="og-image-fallback"
              >
                <div className="text-center p-4">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <p>No OG image set</p>
                  <p className="text-xs mt-1">1200 x 630px recommended</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="og-upload-button"
              >
                Upload OG Image
              </button>
            </div>
          )}
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="og-file-input"
      />
    </div>
  );
}
