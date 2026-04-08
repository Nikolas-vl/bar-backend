/**
 * Central registry of all Redis cache keys.
 *
 * Conventions:
 *   - Namespace segments separated by ':'
 *   - Entity-level keys: 'entity:id'
 *   - List keys:         'entity:list:<hash or filter param>'
 *   - Always use factory functions — never inline key strings.
 */

export const CacheKeys = {
  // ── Dishes ────────────────────────────────────────────────────────────
  dishes: {
    list: (queryHash = 'default') => `dishes:list:${queryHash}` as const,
    detail: (id: number) => `dishes:detail:${id}` as const,
    all: 'dishes:*',
  },

  // ── Ingredients ───────────────────────────────────────────────────────
  ingredients: {
    list: () => 'ingredients:list' as const,
    detail: (id: number) => `ingredients:detail:${id}` as const,
    all: 'ingredients:*',
  },

  // ── Locations ─────────────────────────────────────────────────────────
  locations: {
    list: () => 'locations:list' as const,
    detail: (id: number) => `locations:detail:${id}` as const,
    all: 'locations:*',
  },

  // ── Settings ──────────────────────────────────────────────────────────
  settings: {
    global: () => 'settings:global' as const,
  },

  // ── Users ─────────────────────────────────────────────────────────────
  users: {
    profile: (id: number) => `users:profile:${id}` as const,
    all: 'users:*',
  },
} as const;

// ── TTL constants (seconds) ───────────────────────────────────────────────

export const CacheTTL = {
  LONG: 60 * 60, // 1 hour
  MEDIUM: 60 * 5, // 5 minutes
  SHORT: 60, // 1 minute
  NONE: 0,
} as const;
