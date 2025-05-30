/**
 * Helper script to extract Steam CDN image ID from full Steam URLs
 * Usage: node scripts/extract-steam-id.js "https://steamcommunity-a.akamaihd.net/economy/image/STEAM_ID_HERE"
 * 
 * Example:
 * node scripts/extract-steam-id.js "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0"
 */

function extractSteamId() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.log('Usage: node scripts/extract-steam-id.js "STEAM_URL"');
    console.log('');
    console.log('Example:');
    console.log('node scripts/extract-steam-id.js "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0"');
    process.exit(1);
  }

  const steamUrl = args[0];
  
  // Extract the Steam ID from the URL
  const match = steamUrl.match(/\/economy\/image\/(.+)$/);
  
  if (!match) {
    console.error('Error: Invalid Steam CDN URL format');
    console.error('Expected format: https://steamcommunity-a.akamaihd.net/economy/image/STEAM_ID');
    process.exit(1);
  }

  const steamId = match[1];
  
  console.log('✅ Extracted Steam ID:');
  console.log(steamId);
  console.log('');
  console.log('📋 Copy this ID to use with add-skin.js script');
  console.log('');
  console.log('🔗 Full URL verification:');
  console.log(`https://steamcommunity-a.akamaihd.net/economy/image/${steamId}`);
}

extractSteamId(); 