// Mapping between mock skin IDs and real database IDs
// This helps bridge the gap between frontend mock data and real database

export const SKIN_ID_MAPPING: Record<string, string> = {
  // Mock ID -> Real Database ID
  'skin-1': 'cmbt4rwax0004tepcb8a2cadx', // AWP | Dragon Lore
  'skin-2': 'cmbuqg7gm0003tegseyjbj0ly', // AK-47 | Fire Serpent
  'skin-3': 'cmbuqg75p0000tegs9m9wwexe', // AWP | Asiimov
  'skin-4': 'cmbt4rwc80005tepc8yqhpxop', // M4A4 | Asiimov
  'skin-5': 'cmbuqg7b40001tegssfpbnwcn', // AK-47 | Vulcan
  'skin-6': 'cmbuqg7jf0004tegs4uu5fwq2', // M4A4 | Howl
  'skin-7': 'cmbuqg7m30005tegsmvc2j4qf', // AWP | Lightning Strike
  'skin-8': 'cmbuqg7wr0009tegsp4mol9ih', // Desert Eagle | Blaze
  'skin-9': 'cmbuqg7dt0002tegstt8o0tm2', // Glock-18 | Fade
  'skin-10': 'cmbuqg7or0006tegsquvf0cxv', // AWP | Fade
  'skin-11': 'cmbuqg7rf0007tegs7l5zz3k6', // M4A1-S | Knight
  'skin-12': 'cmbuqg7u30008tegs6g8sw59g', // M4A1-S | Hot Rod
  'skin-13': 'cmbuqg7zg000ategsw8kt5lhy', // USP-S | Kill Confirmed
  'skin-14': 'cmbuqg826000btegsmuajhi69', // AK-47 | Asiimov
  'skin-15': 'cmbuqg84u000ctegs34t7h33c', // AK-47 | The Empress
  'skin-16': 'cmbuqg87i000dtegs0kjd2tes', // AWP | Printstream
  'skin-17': 'cmbuqg8a5000etegsfc45b61r', // M4A1-S | Printstream
  'skin-18': 'cmbuqg8ct000ftegstq74wj80', // Desert Eagle | Printstream
  'skin-19': 'cmbuqg8fi000gtegsuym5mxuz', // USP-S | Printstream
};

// Reverse mapping for database ID -> mock ID
export const REVERSE_SKIN_ID_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(SKIN_ID_MAPPING).map(([mockId, realId]) => [realId, mockId])
);

/**
 * Convert a mock skin ID to a real database ID
 */
export function mapMockIdToRealId(mockId: string): string {
  return SKIN_ID_MAPPING[mockId] || mockId;
}

/**
 * Convert a real database ID to a mock skin ID
 */
export function mapRealIdToMockId(realId: string): string {
  return REVERSE_SKIN_ID_MAPPING[realId] || realId;
}

/**
 * Check if an ID is a mock ID
 */
export function isMockId(id: string): boolean {
  return id.startsWith('skin-');
}

/**
 * Get all available skin mappings
 */
export function getAllSkinMappings(): Array<{ mockId: string; realId: string }> {
  return Object.entries(SKIN_ID_MAPPING).map(([mockId, realId]) => ({
    mockId,
    realId
  }));
} 