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
    return `https://community.cloudflare.steamstatic.com/economy/image/${url}`;
  }

  // For any other case, add HTTPS protocol and use Cloudflare CDN
  return `https://community.cloudflare.steamstatic.com/economy/image/${url}`;
}

/**
 * Gets a fallback image URL for when Steam images fail to load
 */
export function getFallbackImageUrl(): string {
  return '/fallback.svg';
}

/**
 * Primary Steam CDN URL generator - now uses reliable Cloudflare CDN
 */
export function getSteamIconUrl(iconPath: string): string {
  // If it's already a complete URL (from our mapping), return as is
  if (iconPath.startsWith('https://')) {
    return iconPath;
  }
  
  // Handle the Steam CDN hash format
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    // Use reliable Cloudflare CDN
    return `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}`;
  }
  
  // Fallback to old format for legacy icon paths
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`;
}

/**
 * Get alternative Steam image URL (fallback CDN)
 */
export function getAlternativeSteamIconUrl(iconPath: string): string {
  // If it's already a complete URL, try alternative CDN
  if (iconPath.startsWith('https://community.cloudflare.steamstatic.com/')) {
    return iconPath.replace('community.cloudflare.steamstatic.com', 'steamcommunity-a.akamaihd.net');
  }
  
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    // Use alternative Steam CDN
    return `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`;
  }
  
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`;
}

/**
 * Get multiple Steam CDN URLs for maximum reliability
 */
export function getAllSteamIconUrls(iconPath: string): string[] {
  // If it's already a complete URL, provide alternatives
  if (iconPath.startsWith('https://')) {
    return [
      iconPath,
      iconPath.replace('community.cloudflare.steamstatic.com', 'steamcommunity-a.akamaihd.net'),
      iconPath.replace('community.cloudflare.steamstatic.com', 'community.akamai.steamstatic.com'),
      getFallbackImageUrl()
    ];
  }
  
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return [
      `https://community.cloudflare.steamstatic.com/economy/image/${iconPath}`,
      `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`,
      `https://community.akamai.steamstatic.com/economy/image/${iconPath}`,
      getFallbackImageUrl()
    ];
  }
  
  return [
    `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`,
    `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`,
    getFallbackImageUrl()
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
  // Check for complete URL
  if (iconPath.startsWith('https://')) {
    return iconPath.includes('steamstatic.com') || iconPath.includes('akamaihd.net');
  }
  
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
  
  // For complete URLs, we can't modify the size easily
  if (iconPath.startsWith('https://')) {
    return baseUrl;
  }
  
  // For modern Steam CDN URLs, we can append size parameters
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    return `${baseUrl}/${size}`;
  }
  
  return baseUrl;
} 