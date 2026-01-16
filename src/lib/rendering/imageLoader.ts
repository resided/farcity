// ============================================================================
// IMAGE LOADING UTILITIES
// ============================================================================
// Handles loading and caching of sprite images with WebP optimization

// Image cache for building sprites
const imageCache = new Map<string, HTMLImageElement>();

// Track loading promises to avoid duplicate loads
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

// Track WebP support (detected once on first use)
let webpSupported: boolean | null = null;

// Event emitter for image loading progress
type ImageLoadCallback = () => void;
const imageLoadCallbacks = new Set<ImageLoadCallback>();

/**
 * Check if the browser supports WebP format
 */
async function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) {
    return webpSupported;
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupported = img.width > 0 && img.height > 0;
      resolve(webpSupported);
    };
    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };
    // Tiny 1x1 WebP image
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

/**
 * Get the WebP path for a PNG image
 */
function getWebPPath(src: string): string | null {
  if (src.endsWith('.png')) {
    return src.replace(/\.png$/, '.webp');
  }
  return null;
}

/**
 * Register a callback to be notified when images are loaded
 */
export function onImageLoaded(callback: ImageLoadCallback): () => void {
  imageLoadCallbacks.add(callback);
  return () => { imageLoadCallbacks.delete(callback); };
}

/**
 * Notify all registered callbacks that an image has loaded
 */
function notifyImageLoaded() {
  imageLoadCallbacks.forEach(cb => cb());
}

/**
 * Load an image directly without WebP optimization
 */
function loadImageDirect(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      notifyImageLoaded();
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Load an image from a source URL, preferring WebP if available
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  // Return cached image if available
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  
  // Return existing loading promise if already loading
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }
  
  // Check if we should try WebP
  const webpPath = getWebPPath(src);
  if (webpPath) {
    const supportsWebP = await checkWebPSupport();
    
    if (supportsWebP) {
      try {
        const promise = loadImageDirect(webpPath);
        loadingPromises.set(src, promise);
        const img = await promise;
        imageCache.set(src, img);
        return img;
      } catch {
        // WebP failed, fall back to PNG
      }
    }
  }
  
  // Load PNG directly
  const promise = loadImageDirect(src);
  loadingPromises.set(src, promise);
  return promise;
}

/**
 * Filter background color from sprite sheet (red background)
 */
export function filterBackgroundColor(img: HTMLImageElement, threshold: number = 155): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Target background color (red)
      const bgR = 255, bgG = 0, bgB = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const distance = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        );
        
        if (distance <= threshold) {
          data[i + 3] = 0; // Make transparent
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const filteredImg = new Image();
      filteredImg.onload = () => resolve(filteredImg);
      filteredImg.onerror = () => reject(new Error('Failed to create filtered image'));
      filteredImg.src = canvas.toDataURL();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Load a sprite image with optional background filtering
 */
export function loadSpriteImage(src: string, applyFilter: boolean = true): Promise<HTMLImageElement> {
  const cacheKey = applyFilter ? `${src}_filtered` : src;
  
  if (imageCache.has(cacheKey)) {
    return Promise.resolve(imageCache.get(cacheKey)!);
  }
  
  return loadImage(src).then((img) => {
    if (applyFilter) {
      return filterBackgroundColor(img).then((filteredImg) => {
        imageCache.set(cacheKey, filteredImg);
        return filteredImg;
      });
    }
    return img;
  });
}

/**
 * Check if an image is cached
 */
export function isImageCached(src: string, filtered: boolean = false): boolean {
  const cacheKey = filtered ? `${src}_filtered` : src;
  return imageCache.has(cacheKey);
}

/**
 * Get a cached image if available
 */
export function getCachedImage(src: string, filtered: boolean = false): HTMLImageElement | undefined {
  const cacheKey = filtered ? `${src}_filtered` : src;
  return imageCache.get(cacheKey);
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
  loadingPromises.clear();
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[], applyFilter: boolean = true): Promise<void> {
  await Promise.all(srcs.map(src => loadSpriteImage(src, applyFilter)));
}
