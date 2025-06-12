/**
 * Ensures a Steam image URL has the correct format and suffix
 * @param url The original Steam image URL
 * @returns The properly formatted Steam image URL with HTTPS protocol
 */
export function formatSteamImageUrl(url: string): string {
  // If it's already a complete URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a Steam CDN hash (starts with -9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp)
  if (url.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return `https://steamcommunity-a.akamaihd.net/economy/image/${url}`;
  }

  // If the URL already has the /image suffix, add HTTPS protocol
  if (url.endsWith('/image')) {
    return `https://steamcommunity-a.akamaihd.net/economy/image/${url}`;
  }

  // If the URL has /image.png suffix, add HTTPS protocol
  if (url.endsWith('/image.png')) {
    return `https://steamcommunity-a.akamaihd.net/economy/image/${url}`;
  }

  // If the URL has /360fx360f suffix, remove it and add /image with HTTPS
  if (url.endsWith('/360fx360f')) {
    const cleanUrl = url.replace('/360fx360f', '');
    return `https://steamcommunity-a.akamaihd.net/economy/image/${cleanUrl}`;
  }

  // For any other case, add HTTPS protocol and /image suffix
  return `https://steamcommunity-a.akamaihd.net/economy/image/${url}`;
}

/**
 * Gets a fallback image URL for when Steam images fail to load
 */
export function getFallbackImageUrl(): string {
  return '/fallback.svg';
}

/**
 * Primary Steam CDN URL generator with enhanced reliability
 */
export function getSteamIconUrl(iconPath: string): string {
  // Handle the new Steam CDN URL format (starts with base64-like string)
  // All Steam economy images start with this pattern
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    // Use primary Steam CDN (most reliable)
    return `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`;
  }
  
  // Fallback to old format for legacy icon paths
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`;
}

/**
 * Get alternative Steam image URL (fallback CDN)
 */
export function getAlternativeSteamIconUrl(iconPath: string): string {
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    // Use alternative Steam CDN
    return `https://community.akamai.steamstatic.com/economy/image/${iconPath}`;
  }
  
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`;
}

/**
 * Get multiple Steam CDN URLs for maximum reliability
 */
export function getAllSteamIconUrls(iconPath: string): string[] {
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return [
      `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`,
      `https://community.akamai.steamstatic.com/economy/image/${iconPath}`,
      `https://steamuserimages-a.akamaihd.net/ugc/${iconPath}`,
      `https://steamcdn-a.akamaihd.net/economy/image/${iconPath}`
    ];
  }
  
  return [
    `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`,
    `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`
  ];
}

/**
 * Enhanced image loading with automatic fallback
 */
export function createImageWithFallback(
  primaryUrl: string, 
  fallbackUrls: string[] = [], 
  finalFallback: string = getFallbackImageUrl()
): Promise<string> {
  return new Promise((resolve) => {
    const tryLoadImage = (url: string, remainingUrls: string[]) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(url);
      };
      
      img.onerror = () => {
        if (remainingUrls.length > 0) {
          const nextUrl = remainingUrls[0];
          const remaining = remainingUrls.slice(1);
          tryLoadImage(nextUrl, remaining);
        } else {
          resolve(finalFallback);
        }
      };
      
      img.src = url;
    };
    
    tryLoadImage(primaryUrl, fallbackUrls);
  });
}

/**
 * Validate if a Steam icon path is in the correct format
 */
export function isValidSteamIconPath(iconPath: string): boolean {
  // Check for modern Steam CDN format
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return iconPath.length > 100; // Modern hashes are quite long
  }
  
  // Check for legacy format
  return iconPath.length > 10 && !iconPath.includes(' ');
}

/**
 * Get optimized image size URL for Steam images
 */
export function getSteamIconUrlWithSize(iconPath: string, size: '96fx96f' | '128fx128f' | '256fx256f' | '360fx360f' = '256fx256f'): string {
  const baseUrl = getSteamIconUrl(iconPath);
  
  // For modern Steam CDN URLs, we can append size parameters
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return `${baseUrl}/${size}`;
  }
  
  return baseUrl;
} 