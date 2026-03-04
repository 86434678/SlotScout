import { pgTable, uuid, text, timestamp, decimal, integer, foreignKey, boolean, jsonb } from 'drizzle-orm/pg-core';

export const slotIdentifications = pgTable('slot_identifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  imageUrl: text('image_url').notNull(),
  imageKey: text('image_key'),
  manufacturer: text('manufacturer'),
  gameTitle: text('game_title'),
  denomination: text('denomination'),
  casino: text('casino'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const communityReports = pgTable('community_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  slotIdentificationId: uuid('slot_identification_id'),
  imageUrl: text('image_url').notNull(),
  manufacturer: text('manufacturer'),
  gameTitle: text('game_title'),
  casino: text('casino').notNull(),
  winAmount: decimal('win_amount'),
  jackpotType: text('jackpot_type'),
  notes: text('notes'),
  flagged: boolean('flagged').default(false).notNull(),
  flagCount: integer('flag_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const casinos = pgTable('casinos', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  area: text('area'), // "Strip", "Downtown", "Off-Strip"
  location: text('location'),
  latitude: decimal('latitude'),
  longitude: decimal('longitude'),
  ngcbArea: text('ngcb_area'),
  reportedCount: integer('reported_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const slotMachines = pgTable('slot_machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand: text('brand').notNull(),
  gameTitle: text('game_title').notNull(),
  commonDenoms: text('common_denoms').notNull(), // JSON string array
  casinoExamples: text('casino_examples'),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pendingSlotMachines = pgTable('pending_slot_machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand: text('brand'),
  gameTitle: text('game_title'),
  imageUrl: text('image_url').notNull(),
  notes: text('notes'),
  userId: text('user_id'),
  status: text('status').default('pending_review').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ngcbStats = pgTable('ngcb_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportMonth: text('report_month').notNull(),
  locationArea: text('location_area').notNull(),
  denomination: text('denomination').notNull(),
  avgRtpPercent: decimal('avg_rtp_percent', { precision: 5, scale: 2 }).notNull(),
  holdPercent: decimal('hold_percent', { precision: 5, scale: 2 }).notNull(),
  numMachines: text('num_machines').notNull(), // Store as text to match decimal handling
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const parSheets = pgTable('par_sheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameTitle: text('game_title').notNull(),
  brand: text('brand').notNull(),
  rtpRangeLow: text('rtp_range_low').notNull(),
  rtpRangeHigh: text('rtp_range_high').notNull(),
  volatility: text('volatility').notNull(),
  typicalDenoms: text('typical_denoms').notNull(),
  notes: text('notes').notNull(),
  sourceLink: text('source_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const jackpotFeed = pgTable('jackpot_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  jackpotName: text('jackpot_name').notNull(),
  currentAmount: text('current_amount').notNull(),
  location: text('location').notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
  trackerLink: text('tracker_link').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const casinoSlotMachines = pgTable('casino_slot_machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  casinoId: uuid('casino_id').notNull(),
  slotMachineId: uuid('slot_machine_id').notNull(),
  quantity: integer('quantity'),
  floorLocation: text('floor_location'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  casinoFk: foreignKey({
    columns: [table.casinoId],
    foreignColumns: [casinos.id],
  }),
  slotMachineFk: foreignKey({
    columns: [table.slotMachineId],
    foreignColumns: [slotMachines.id],
  }),
}));

export const casinoMachines = pgTable('casino_machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  casinoName: text('casino_name').notNull(),
  brand: text('brand').notNull(),
  gameTitle: text('game_title').notNull(),
  denom: text('denom').notNull(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).notNull(),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  userId: text('user_id'),
  latitude: decimal('latitude'),
  longitude: decimal('longitude'),
  detectedCasino: text('detected_casino'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mustHitProgressives = pgTable('must_hit_progressives', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameTitle: text('game_title').notNull(),
  casino: text('casino').notNull(),
  minorCap: decimal('minor_cap', { precision: 10, scale: 2 }).notNull(),
  majorCap: decimal('major_cap', { precision: 10, scale: 2 }).notNull(),
  currentMinor: decimal('current_minor', { precision: 10, scale: 2 }).notNull(),
  currentMajor: decimal('current_major', { precision: 10, scale: 2 }).notNull(),
  lastReported: timestamp('last_reported', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  badgeName: text('badge_name').notNull(),
  dateUnlocked: timestamp('date_unlocked', { withTimezone: true }).notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userPoints = pgTable('user_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  totalPoints: integer('total_points').default(0),
  lastLoginDate: timestamp('last_login_date', { withTimezone: true }),
  loginStreak: integer('login_streak').default(0),
  machinesReported: integer('machines_reported').default(0),
  casinosScouted: integer('casinos_scouted').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const monthlyLeaderboards = pgTable('monthly_leaderboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  photoUrl: text('photo_url'),
  highestWin: decimal('highest_win', { precision: 12, scale: 2 }).default('0'),
  machinesReported: integer('machines_reported').default(0),
  casinosScouted: integer('casinos_scouted').default(0),
  month: text('month').notNull(), // YYYY-MM format
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ngcbTrends = pgTable('ngcb_trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportMonth: text('report_month').notNull(), // YYYY-MM format
  locationArea: text('location_area').notNull(), // "Las Vegas Strip", "Downtown Las Vegas", "Boulder Strip", "Statewide Nevada"
  holdPercent: decimal('hold_percent', { precision: 5, scale: 2 }).notNull(), // e.g., 7.57 for 7.57%
  rtpPercent: decimal('rtp_percent', { precision: 5, scale: 2 }).notNull(), // 100 - holdPercent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tripPassPurchases = pgTable('trip_pass_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull().default('com.slotscout.trippass'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('6.99'),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  platform: text('platform'), // 'ios', 'android', 'web'
  transactionId: text('transaction_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const slotRecognitionCache = pgTable('slot_recognition_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: text('cache_key').notNull().unique(),
  manufacturer: text('manufacturer'),
  gameTitle: text('game_title'),
  denomination: text('denomination'),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  cachedResult: jsonb('cached_result').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  hitCount: integer('hit_count').default(1),
});

export const dataUpdates = pgTable('data_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataType: text('data_type').notNull(), // 'ngcb_stats', 'jackpots', 'par_sheets'
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
  recordsAffected: integer('records_affected'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learnArticles = pgTable('learn_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // 'slot_basics', 'hold_pct', 'rtp', 'volatility', 'myths', 'responsible_play'
  relatedGameTypes: text('related_game_types'), // JSON array of game types
  difficulty: text('difficulty').default('beginner'), // 'beginner', 'intermediate', 'advanced'
  source: text('source'), // Attribution for content
  externalUrl: text('external_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  casinoName: text('casino_name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  latitude: decimal('latitude'),
  longitude: decimal('longitude'),
  sourceUrl: text('source_url'),
  eventType: text('event_type'), // 'free_play', 'promotion', 'tournament', 'other'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const casinoReviews = pgTable('casino_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  casinoName: text('casino_name').notNull(),
  averageRating: decimal('average_rating', { precision: 3, scale: 1 }),
  totalReviews: integer('total_reviews').default(0),
  slotsRating: decimal('slots_rating', { precision: 3, scale: 1 }),
  cleanliness: decimal('cleanliness', { precision: 3, scale: 1 }),
  atmosphere: decimal('atmosphere', { precision: 3, scale: 1 }),
  sourceUrl: text('source_url'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessionLogs = pgTable('session_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  casinoName: text('casino_name'),
  sessionDate: timestamp('session_date', { withTimezone: true }).notNull(),
  playTimeMinutes: integer('play_time_minutes'),
  budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
