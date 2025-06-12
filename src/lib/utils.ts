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

export function getSteamIconUrl(iconPath: string): string {
  // Handle the new Steam CDN URL format (starts with base64-like string)
  // All Steam economy images start with this pattern
  if (iconPath.startsWith('-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgp')) {
    // Use Steam CDN directly (more reliable than Cloudflare)
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
    // Use Steam CDN as alternative
    return `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`;
  }
  
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/default_generated/${iconPath}`;
} 