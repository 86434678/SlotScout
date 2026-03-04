import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export async function register(app: App, fastify: FastifyInstance) {
  // Initialize casinos with coordinates on startup
  const majorVegasCasinos = [
    { name: 'MGM Grand', location: '3799 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1028', long: '-115.1703' },
    { name: 'Bellagio', location: '3600 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1126', long: '-115.1767' },
    { name: 'Caesars Palace', location: '3570 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1162', long: '-115.1757' },
    { name: 'Venetian', location: '3355 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1211', long: '-115.1697' },
    { name: 'Wynn Las Vegas', location: '3131 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1265', long: '-115.1657' },
    { name: 'Aria', location: '3730 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1073', long: '-115.1767' },
    { name: 'Planet Hollywood', location: '3667 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1098', long: '-115.1720' },
    { name: 'Flamingo', location: '3555 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1153', long: '-115.1725' },
    { name: 'Resorts World', location: '3300 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1310', long: '-115.1645' },
    { name: 'The LINQ', location: '3535 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1175', long: '-115.1730' },
    { name: 'Harrah\'s', location: '3475 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1190', long: '-115.1700' },
    { name: 'Paris Las Vegas', location: '3655 Las Vegas Blvd S', area: 'Strip', ngcbArea: 'Strip', lat: '36.1125', long: '-115.1720' },
    { name: 'Circa', location: '1 S Main St', area: 'Downtown', ngcbArea: 'Downtown', lat: '36.1710', long: '-115.1400' },
    { name: 'Golden Nugget', location: '129 Fremont St', area: 'Downtown', ngcbArea: 'Downtown', lat: '36.1703', long: '-115.1425' },
    { name: 'Fremont', location: '200 Fremont St', area: 'Downtown', ngcbArea: 'Downtown', lat: '36.1714', long: '-115.1433' },
  ];

  const slotBrands = ['IGT', 'Aristocrat', 'Lightning Link', 'Buffalo', 'Quick Hit', 'Wheel of Fortune', 'Dancing Drums', 'Patriot Igloo'];
  const denominations = ['$0.01', '$0.25', '$0.50', '$1.00', '$5.00'];

  try {
    // Initialize casinos with coordinates
    for (const casino of majorVegasCasinos) {
      const existing = await app.db
        .select()
        .from(schema.casinos)
        .where(eq(schema.casinos.name, casino.name))
        .limit(1);

      if (existing.length === 0) {
        await app.db.insert(schema.casinos).values({
          name: casino.name,
          location: casino.location,
          area: casino.area,
          ngcbArea: casino.ngcbArea,
          latitude: casino.lat,
          longitude: casino.long,
        });
      }
    }
    app.logger.info({ count: majorVegasCasinos.length }, 'Casinos initialized');

    // Seed casino_machines data
    const casinoMachineData: Record<string, { count: number; winAmounts: number[] }> = {
      'MGM Grand': { count: 12, winAmounts: [8500, 6200, 4800, 9100, 5500, 7200, 3900, 6800, 4200, 5900, 7500, 2400] },
      'Bellagio': { count: 10, winAmounts: [5200, 4800, 3900, 6100, 4200, 5500, 3800, 4900, 3600, 3000] },
      'Caesars Palace': { count: 11, winAmounts: [4200, 3800, 2900, 4500, 3200, 3900, 2800, 3600, 3100, 2900, 3100] },
      'Venetian': { count: 9, winAmounts: [4100, 3600, 2800, 4200, 3400, 3800, 2900, 3700, 3500] },
      'Wynn Las Vegas': { count: 10, winAmounts: [4800, 4200, 3600, 4900, 3800, 4500, 3200, 4100, 3900, 4000] },
      'Aria': { count: 8, winAmounts: [3900, 3500, 2800, 4100, 3200, 3800, 3400, 3300] },
      'Planet Hollywood': { count: 9, winAmounts: [3200, 2900, 2400, 3400, 2700, 3100, 2600, 2900, 2800] },
      'Flamingo': { count: 10, winAmounts: [3300, 2900, 2500, 3500, 2800, 3200, 2700, 3000, 2800, 2300] },
      'Resorts World': { count: 8, winAmounts: [4800, 4200, 3800, 5100, 4000, 4600, 4200, 4300] },
      'Circa': { count: 11, winAmounts: [3200, 2900, 2500, 3400, 2700, 3100, 2600, 2900, 2800, 2700, 2200] },
      'Fremont': { count: 9, winAmounts: [2900, 2600, 2200, 3100, 2500, 2800, 2400, 2700, 2800] },
      'Golden Nugget': { count: 10, winAmounts: [3700, 3300, 2900, 3900, 3100, 3600, 3000, 3400, 3200, 2900] },
    };

    for (const [casinoName, machineData] of Object.entries(casinoMachineData)) {
      // Check if machines already exist for this casino
      const existingMachines = await app.db
        .select()
        .from(schema.casinoMachines)
        .where(eq(schema.casinoMachines.casinoName, casinoName))
        .limit(1);

      if (existingMachines.length === 0) {
        // Insert machines for this casino
        for (let i = 0; i < machineData.count; i++) {
          const brand = slotBrands[i % slotBrands.length];
          const denom = denominations[i % denominations.length];
          const dayOffset = Math.floor(Math.random() * 32); // 0-31 days back
          const lastSeen = new Date(2026, 1, 15 - dayOffset); // Jan-Feb 2026

          await app.db.insert(schema.casinoMachines).values({
            casinoName,
            brand,
            gameTitle: `${brand} Machine ${i + 1}`,
            denom,
            lastSeen,
            photoUrl: null,
            notes: null,
            userId: null,
            latitude: null,
            longitude: null,
            detectedCasino: null,
          });
        }
        app.logger.info({ casino: casinoName, count: machineData.count }, 'Casino machines seeded');
      }
    }
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to initialize casinos and machines');
  }
}
