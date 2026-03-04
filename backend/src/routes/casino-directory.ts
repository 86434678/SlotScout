import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, desc, and, sql, not, or, gt } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'Crowdsourced from players — floors change daily. Not official casino data.';

// Pre-populate casino machines data
const CASINO_MACHINES_DATA = [
  {
    casinoName: 'MGM Grand',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Buffalo Gold', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
    ],
  },
  {
    casinoName: 'Bellagio',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Huff n\' More Puff', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$5' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo Grand', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '50¢' },
    ],
  },
  {
    casinoName: 'Caesars Palace',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'IGT', gameTitle: 'Double Diamond', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
    ],
  },
  {
    casinoName: 'Venetian',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Lobstermania', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
    ],
  },
  {
    casinoName: 'Wynn',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Buffalo Grand', denom: '$1' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$5' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
    ],
  },
  {
    casinoName: 'Aria',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '50¢' },
      { brand: 'Aristocrat', gameTitle: 'Huff n\' More Puff', denom: '1¢' },
    ],
  },
  {
    casinoName: 'Planet Hollywood',
    area: 'Strip',
    machines: [
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Double Diamond', denom: '50¢' },
    ],
  },
  {
    casinoName: 'Flamingo',
    area: 'Strip',
    machines: [
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
    ],
  },
  {
    casinoName: 'Resorts World',
    area: 'Strip',
    machines: [
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo Grand', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'Aristocrat', gameTitle: 'Huff n\' More Puff', denom: '1¢' },
    ],
  },
  {
    casinoName: 'Circa',
    area: 'Downtown',
    machines: [
      { brand: 'IGT', gameTitle: 'Quick Hit', denom: '25¢' },
      { brand: 'Aristocrat', gameTitle: 'Buffalo', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Lightning Link', denom: '1¢' },
      { brand: 'Aristocrat', gameTitle: 'Dragon Link', denom: '1¢' },
      { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
      { brand: 'IGT', gameTitle: 'Double Diamond', denom: '50¢' },
    ],
  },
];

// Helper function to format date as YYYY-MM-DD
function formatDateAsYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to parse YYYY-MM-DD to Date at start of day UTC
function parseDateToUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export async function register(app: App, fastify: FastifyInstance) {
  // Pre-populate casinos and machines
  const existingCasinos = await app.db
    .select()
    .from(schema.casinos)
    .limit(1);

  if (existingCasinos.length === 0) {
    app.logger.info({}, 'Initializing casino directory with seed data');

    // Create casinos first
    for (const casinoData of CASINO_MACHINES_DATA) {
      await app.db
        .insert(schema.casinos)
        .values({
          name: casinoData.casinoName,
          area: casinoData.area,
          location: casinoData.area === 'Downtown' ? 'Downtown Las Vegas' : 'Las Vegas Strip',
          reportedCount: 0,
        });
    }

    // Then add machines
    const now = new Date();
    for (const casinoData of CASINO_MACHINES_DATA) {
      for (const machine of casinoData.machines) {
        await app.db
          .insert(schema.casinoMachines)
          .values({
            casinoName: casinoData.casinoName,
            brand: machine.brand,
            gameTitle: machine.gameTitle,
            denom: machine.denom,
            lastSeen: now,
            photoUrl: null,
            notes: null,
            userId: null,
          });
      }
    }

    app.logger.info({}, 'Casino directory initialized with seed data');
  }

  // GET /api/casino-directory/casinos - List all casinos
  fastify.get('/api/casino-directory/casinos', {
    schema: {
      description: 'Get all casinos with reported machine counts',
      tags: ['casino-directory'],
      response: {
        200: {
          type: 'object',
          properties: {
            casinos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  area: { type: ['string', 'null'] },
                  reportedCount: { type: 'integer' },
                  location: { type: ['string', 'null'] },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (): Promise<any> => {
    app.logger.info({}, 'Fetching casino directory');

    const casinos = await app.db
      .select({
        id: schema.casinos.id,
        name: schema.casinos.name,
        area: schema.casinos.area,
        reportedCount: schema.casinos.reportedCount,
        location: schema.casinos.location,
      })
      .from(schema.casinos)
      .orderBy(schema.casinos.name);

    app.logger.info({ count: casinos.length }, 'Casinos retrieved');
    return { casinos, disclaimer: DISCLAIMER };
  });

  // GET /api/casino-directory/casinos/:casinoName/machines - Get machines at a casino
  fastify.get('/api/casino-directory/casinos/:casinoName/machines', {
    schema: {
      description: 'Get all machines reported at a specific casino',
      tags: ['casino-directory'],
      params: {
        type: 'object',
        required: ['casinoName'],
        properties: {
          casinoName: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            machines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  casinoName: { type: 'string' },
                  brand: { type: 'string' },
                  gameTitle: { type: 'string' },
                  denom: { type: 'string' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  photoUrl: { type: ['string', 'null'] },
                  notes: { type: ['string', 'null'] },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { casinoName: string } }>
  ): Promise<any> => {
    const { casinoName } = request.params;
    app.logger.info({ casinoName }, 'Fetching machines for casino');

    const machines = await app.db
      .select({
        id: schema.casinoMachines.id,
        casinoName: schema.casinoMachines.casinoName,
        brand: schema.casinoMachines.brand,
        gameTitle: schema.casinoMachines.gameTitle,
        denom: schema.casinoMachines.denom,
        lastSeen: schema.casinoMachines.lastSeen,
        photoUrl: schema.casinoMachines.photoUrl,
        notes: schema.casinoMachines.notes,
        createdAt: schema.casinoMachines.createdAt,
      })
      .from(schema.casinoMachines)
      .where(eq(schema.casinoMachines.casinoName, casinoName))
      .orderBy(desc(schema.casinoMachines.lastSeen));

    app.logger.info({ casinoName, count: machines.length }, 'Casino machines retrieved');
    return { machines, disclaimer: DISCLAIMER };
  });

  // POST /api/casino-directory/report-machine - Report a new machine sighting
  fastify.post('/api/casino-directory/report-machine', {
    schema: {
      description: 'Report a machine sighting at a casino',
      tags: ['casino-directory'],
      body: {
        type: 'object',
        required: ['casinoName', 'brand', 'gameTitle', 'denom'],
        properties: {
          casinoName: { type: 'string' },
          brand: { type: 'string' },
          gameTitle: { type: 'string' },
          denom: { type: 'string' },
          photoUrl: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          lastSeen: { type: 'string', description: 'YYYY-MM-DD format, defaults to today' },
          latitude: { type: ['number', 'null'], description: 'GPS latitude of machine location' },
          longitude: { type: ['number', 'null'], description: 'GPS longitude of machine location' },
          detectedCasino: { type: ['string', 'null'], description: 'Auto-detected casino name from geofencing' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            machine: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                casinoName: { type: 'string' },
                brand: { type: 'string' },
                gameTitle: { type: 'string' },
                denom: { type: 'string' },
                lastSeen: { type: 'string', format: 'date-time' },
                photoUrl: { type: ['string', 'null'] },
                notes: { type: ['string', 'null'] },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            casino: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                area: { type: ['string', 'null'] },
                reportedCount: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        casinoName: string;
        brand: string;
        gameTitle: string;
        denom: string;
        photoUrl?: string | null;
        notes?: string | null;
        lastSeen?: string;
        latitude?: number | null;
        longitude?: number | null;
        detectedCasino?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { casinoName, brand, gameTitle, denom, photoUrl, notes, lastSeen, latitude, longitude, detectedCasino } = request.body;
    app.logger.info({ casinoName, gameTitle, denom, latitude, longitude }, 'Reporting machine sighting');

    try {
      // Determine last_seen date
      let lastSeenDate: Date;
      if (lastSeen) {
        lastSeenDate = parseDateToUTC(lastSeen);
      } else {
        // Use today's date
        const today = new Date();
        lastSeenDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
      }

      // Use detectedCasino as casinoName if casinoName is empty
      const finalCasinoName = casinoName || detectedCasino || 'Unknown Casino';

      // Create the machine entry
      const [machine] = await app.db
        .insert(schema.casinoMachines)
        .values({
          casinoName: finalCasinoName,
          brand,
          gameTitle,
          denom,
          lastSeen: lastSeenDate,
          photoUrl: photoUrl || null,
          notes: notes || null,
          userId: null,
          latitude: latitude ? String(latitude) : null,
          longitude: longitude ? String(longitude) : null,
          detectedCasino: detectedCasino || null,
        })
        .returning();

      // Find the casino, or create it if it doesn't exist
      let [casino] = await app.db
        .select()
        .from(schema.casinos)
        .where(eq(schema.casinos.name, casinoName))
        .limit(1);

      if (!casino) {
        // Create new casino with default area "Off-Strip"
        const [newCasino] = await app.db
          .insert(schema.casinos)
          .values({
            name: casinoName,
            area: 'Off-Strip',
            location: 'Las Vegas',
            reportedCount: 1,
          })
          .returning();
        casino = newCasino;
      } else {
        // Increment reported_count for existing casino
        await app.db
          .update(schema.casinos)
          .set({ reportedCount: (casino.reportedCount || 0) + 1 })
          .where(eq(schema.casinos.name, casinoName));
        // Update the local casino object with new count
        casino.reportedCount = (casino.reportedCount || 0) + 1;
      }

      app.logger.info({ machineId: machine.id, casinoName }, 'Machine sighting reported');
      reply.status(201);
      return {
        success: true,
        machine: {
          id: machine.id,
          casinoName: machine.casinoName,
          brand: machine.brand,
          gameTitle: machine.gameTitle,
          denom: machine.denom,
          lastSeen: machine.lastSeen,
          photoUrl: machine.photoUrl,
          notes: machine.notes,
          createdAt: machine.createdAt,
        },
        casino: casino ? {
          id: casino.id,
          name: casino.name,
          area: casino.area,
          reportedCount: casino.reportedCount || 0,
        } : null,
      };
    } catch (error) {
      app.logger.error({ err: error, casinoName }, 'Failed to report machine');
      throw error;
    }
  });

  // POST /api/casino-directory/machines/:id/saw-this - Update last_seen
  fastify.post('/api/casino-directory/machines/:id/saw-this', {
    schema: {
      description: 'Report seeing this machine again - updates last_seen timestamp',
      tags: ['casino-directory'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          userId: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            machine: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                casinoName: { type: 'string' },
                brand: { type: 'string' },
                gameTitle: { type: 'string' },
                denom: { type: 'string' },
                lastSeen: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { userId?: string | null };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { id } = request.params;
    app.logger.info({ id }, 'Updating machine last_seen');

    try {
      const [existing] = await app.db
        .select()
        .from(schema.casinoMachines)
        .where(eq(schema.casinoMachines.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'Machine not found' });
      }

      // Set lastSeen to today's date at midnight UTC
      const today = new Date();
      const lastSeenDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
      const updatedAt = new Date();

      const [updated] = await app.db
        .update(schema.casinoMachines)
        .set({ lastSeen: lastSeenDate, updatedAt })
        .where(eq(schema.casinoMachines.id, id))
        .returning();

      // Increment casino's reported_count if not already set
      const [casino] = await app.db
        .select()
        .from(schema.casinos)
        .where(eq(schema.casinos.name, updated.casinoName))
        .limit(1);

      if (casino && (casino.reportedCount || 0) === 0) {
        await app.db
          .update(schema.casinos)
          .set({ reportedCount: 1 })
          .where(eq(schema.casinos.name, updated.casinoName));
      }

      app.logger.info({ id }, 'Machine last_seen updated');
      return {
        success: true,
        machine: {
          id: updated.id,
          casinoName: updated.casinoName,
          brand: updated.brand,
          gameTitle: updated.gameTitle,
          denom: updated.denom,
          lastSeen: updated.lastSeen,
        },
      };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update machine');
      throw error;
    }
  });

  // POST /api/casino-directory/machines - Add a new machine sighting
  fastify.post('/api/casino-directory/machines', {
    schema: {
      description: 'Add a new machine sighting',
      tags: ['casino-directory'],
      body: {
        type: 'object',
        required: ['casino_name', 'brand', 'game_title', 'denom'],
        properties: {
          casino_name: { type: 'string' },
          brand: { type: 'string' },
          game_title: { type: 'string' },
          denom: { type: 'string' },
          photo_url: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          userId: { type: ['string', 'null'] },
          latitude: { type: ['number', 'null'], description: 'GPS latitude of machine location' },
          longitude: { type: ['number', 'null'], description: 'GPS longitude of machine location' },
          detected_casino: { type: ['string', 'null'], description: 'Auto-detected casino name from geofencing' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            casinoName: { type: 'string' },
            brand: { type: 'string' },
            gameTitle: { type: 'string' },
            denom: { type: 'string' },
            lastSeen: { type: 'string', format: 'date-time' },
            photoUrl: { type: ['string', 'null'] },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        casino_name: string;
        brand: string;
        game_title: string;
        denom: string;
        photo_url?: string | null;
        notes?: string | null;
        userId?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        detected_casino?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { casino_name, brand, game_title, denom, photo_url, notes, userId, latitude, longitude, detected_casino } = request.body;
    app.logger.info({ casino_name, game_title, latitude, longitude }, 'Adding new machine sighting');

    try {
      const now = new Date();
      const [result] = await app.db
        .insert(schema.casinoMachines)
        .values({
          casinoName: casino_name,
          brand,
          gameTitle: game_title,
          denom,
          lastSeen: now,
          photoUrl: photo_url || null,
          notes: notes || null,
          userId: userId || null,
          latitude: latitude ? String(latitude) : null,
          longitude: longitude ? String(longitude) : null,
          detectedCasino: detected_casino || null,
        })
        .returning();

      // Increment casino's reported_count
      const [casino] = await app.db
        .select()
        .from(schema.casinos)
        .where(eq(schema.casinos.name, casino_name))
        .limit(1);

      if (casino) {
        await app.db
          .update(schema.casinos)
          .set({ reportedCount: (casino.reportedCount || 0) + 1 })
          .where(eq(schema.casinos.name, casino_name));
      }

      app.logger.info({ id: result.id }, 'Machine sighting created');
      reply.status(201);
      return {
        id: result.id,
        casinoName: result.casinoName,
        brand: result.brand,
        gameTitle: result.gameTitle,
        denom: result.denom,
        lastSeen: result.lastSeen,
        photoUrl: result.photoUrl,
        notes: result.notes,
        createdAt: result.createdAt,
      };
    } catch (error) {
      app.logger.error({ err: error, casino_name }, 'Failed to create machine sighting');
      throw error;
    }
  });

  // GET /api/casino-directory/machines/search - Search machines
  fastify.get('/api/casino-directory/machines/search', {
    schema: {
      description: 'Search machines by game title or brand',
      tags: ['casino-directory'],
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            machines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  casinoName: { type: 'string' },
                  brand: { type: 'string' },
                  gameTitle: { type: 'string' },
                  denom: { type: 'string' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  photoUrl: { type: ['string', 'null'] },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Querystring: { query?: string };
    }>
  ): Promise<any> => {
    const { query = '' } = request.query as any;
    app.logger.info({ query }, 'Searching machines');

    const machines = await app.db
      .select({
        id: schema.casinoMachines.id,
        casinoName: schema.casinoMachines.casinoName,
        brand: schema.casinoMachines.brand,
        gameTitle: schema.casinoMachines.gameTitle,
        denom: schema.casinoMachines.denom,
        lastSeen: schema.casinoMachines.lastSeen,
        photoUrl: schema.casinoMachines.photoUrl,
      })
      .from(schema.casinoMachines)
      .where(
        query
          ? and(
              ilike(schema.casinoMachines.gameTitle, `%${query}%`),
            )
          : undefined
      );

    app.logger.info({ query, count: machines.length }, 'Search results');
    return { machines, disclaimer: DISCLAIMER };
  });

  // GET /api/casino-directory/machines/by-game/:gameTitle - Get casinos with a specific game
  fastify.get('/api/casino-directory/machines/by-game/:gameTitle', {
    schema: {
      description: 'Get all casinos where a specific game has been reported',
      tags: ['casino-directory'],
      params: {
        type: 'object',
        required: ['gameTitle'],
        properties: {
          gameTitle: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            casinos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  casinoName: { type: 'string' },
                  area: { type: ['string', 'null'] },
                  brand: { type: 'string' },
                  denom: { type: 'string' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  count: { type: 'integer' },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { gameTitle: string } }>
  ): Promise<any> => {
    const { gameTitle } = request.params;
    app.logger.info({ gameTitle }, 'Fetching casinos for game');

    const machines = await app.db
      .select({
        casinoName: schema.casinoMachines.casinoName,
        brand: schema.casinoMachines.brand,
        denom: schema.casinoMachines.denom,
        lastSeen: schema.casinoMachines.lastSeen,
      })
      .from(schema.casinoMachines)
      .where(eq(schema.casinoMachines.gameTitle, gameTitle))
      .orderBy(desc(schema.casinoMachines.lastSeen));

    // Get unique casinos with the area and count
    const casinoMap = new Map<string, any>();
    for (const machine of machines) {
      if (!casinoMap.has(machine.casinoName)) {
        const [casino] = await app.db
          .select()
          .from(schema.casinos)
          .where(eq(schema.casinos.name, machine.casinoName))
          .limit(1);

        casinoMap.set(machine.casinoName, {
          casinoName: machine.casinoName,
          area: casino?.area || null,
          brand: machine.brand,
          denom: machine.denom,
          lastSeen: machine.lastSeen,
          count: 1,
        });
      } else {
        const entry = casinoMap.get(machine.casinoName);
        entry.count += 1;
      }
    }

    const casinos = Array.from(casinoMap.values());
    app.logger.info({ gameTitle, count: casinos.length }, 'Casinos for game retrieved');
    return { casinos, disclaimer: DISCLAIMER };
  });

  // PUT /api/casino-directory/machines/:id - Update machine (admin only)
  fastify.put('/api/casino-directory/machines/:id', {
    schema: {
      description: 'Update machine details (admin only)',
      tags: ['casino-directory'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          brand: { type: ['string', 'null'] },
          game_title: { type: ['string', 'null'] },
          denom: { type: ['string', 'null'] },
          photo_url: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            casinoName: { type: 'string' },
            brand: { type: 'string' },
            gameTitle: { type: 'string' },
            denom: { type: 'string' },
            lastSeen: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        brand?: string | null;
        game_title?: string | null;
        denom?: string | null;
        photo_url?: string | null;
        notes?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { id } = request.params;
    const { brand, game_title, denom, photo_url, notes } = request.body;

    app.logger.info({ id }, 'Updating machine');

    try {
      const [existing] = await app.db
        .select()
        .from(schema.casinoMachines)
        .where(eq(schema.casinoMachines.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'Machine not found' });
      }

      const updateData: any = {};
      if (brand !== undefined) updateData.brand = brand;
      if (game_title !== undefined) updateData.gameTitle = game_title;
      if (denom !== undefined) updateData.denom = denom;
      if (photo_url !== undefined) updateData.photoUrl = photo_url;
      if (notes !== undefined) updateData.notes = notes;
      updateData.updatedAt = new Date();

      const [updated] = await app.db
        .update(schema.casinoMachines)
        .set(updateData)
        .where(eq(schema.casinoMachines.id, id))
        .returning();

      app.logger.info({ id }, 'Machine updated');
      return {
        id: updated.id,
        casinoName: updated.casinoName,
        brand: updated.brand,
        gameTitle: updated.gameTitle,
        denom: updated.denom,
        lastSeen: updated.lastSeen,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update machine');
      throw error;
    }
  });

  // DELETE /api/casino-directory/machines/:id - Delete machine (admin only)
  fastify.delete('/api/casino-directory/machines/:id', {
    schema: {
      description: 'Delete a machine entry (admin only)',
      tags: ['casino-directory'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { id } = request.params;
    app.logger.info({ id }, 'Deleting machine');

    try {
      const [existing] = await app.db
        .select()
        .from(schema.casinoMachines)
        .where(eq(schema.casinoMachines.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({ error: 'Machine not found' });
      }

      await app.db
        .delete(schema.casinoMachines)
        .where(eq(schema.casinoMachines.id, id));

      app.logger.info({ id }, 'Machine deleted');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to delete machine');
      throw error;
    }
  });

  // POST /api/casino-directory/bulk-insert-aristocrat - Bulk insert Aristocrat games (admin only)
  fastify.post('/api/casino-directory/bulk-insert-aristocrat', {
    schema: {
      description: 'Bulk insert Aristocrat games from public sources (admin only)',
      tags: ['casino-directory'],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            inserted: { type: 'integer' },
            casinos: { type: 'integer' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    app.logger.info({}, 'Starting bulk insert of Aristocrat games');

    try {
      const casinoMachinesData = [
        {
          casinoName: 'MGM Grand',
          games: [
            { gameTitle: 'Dragon Link Golden Century', denom: '1¢' },
            { gameTitle: 'Buffalo Gold', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
            { gameTitle: 'Phoenix Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Bellagio',
          games: [
            { gameTitle: 'Dragon Link Golden Century', denom: '1¢' },
            { gameTitle: 'Buffalo Gold Cash', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Caesars Palace',
          games: [
            { gameTitle: 'Dragon Link Golden Century', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
            { gameTitle: 'Bonus Boost 888', denom: '$1' },
          ],
        },
        {
          casinoName: 'Venetian',
          games: [
            { gameTitle: 'Dragon Link', denom: '1¢' },
            { gameTitle: 'Buffalo Diamond Extreme', denom: '1¢' },
            { gameTitle: 'Phoenix Link', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Wynn',
          games: [
            { gameTitle: 'Phoenix Link', denom: '1¢' },
            { gameTitle: 'House of the Dragon', denom: '$1' },
            { gameTitle: 'Dragon Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Aria',
          games: [
            { gameTitle: 'Buffalo Gold Cash', denom: '1¢' },
            { gameTitle: 'Bonus Boost 888', denom: '$1' },
            { gameTitle: 'Wild Wild Buffalo', denom: '1¢' },
            { gameTitle: 'Phoenix Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Planet Hollywood',
          games: [
            { gameTitle: 'Dragon Link', denom: '1¢' },
            { gameTitle: 'Buffalo series', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Flamingo',
          games: [
            { gameTitle: 'Dragon Link', denom: '1¢' },
            { gameTitle: 'Lightning Link', denom: '1¢' },
            { gameTitle: 'Buffalo series', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Resorts World',
          games: [
            { gameTitle: 'Lightning Dollar Link', denom: '$1' },
            { gameTitle: 'Midnight Express', denom: '1¢' },
            { gameTitle: 'Phoenix Link', denom: '1¢' },
            { gameTitle: 'Wild Wild Buffalo', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Circa',
          games: [
            { gameTitle: 'Millioni$er Outback Jack', denom: '$1' },
            { gameTitle: 'Millioni$er Buffalo', denom: '$1' },
            { gameTitle: 'Dune Movie slots', denom: '1¢' },
            { gameTitle: 'Phoenix Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Fremont',
          games: [
            { gameTitle: 'Mo Mummy', denom: '1¢' },
            { gameTitle: 'Lightning Jackpots', denom: '1¢' },
            { gameTitle: 'Triple Red Hot 7s', denom: '1¢' },
          ],
        },
      ];

      const lastSeenDate = new Date('2026-02-01T00:00:00.000Z');
      const notes = 'Aggregated from public web sources like Aristocrat locator and videos — verify on-site.';
      let totalInserted = 0;

      for (const casinoData of casinoMachinesData) {
        const [casino] = await app.db
          .select()
          .from(schema.casinos)
          .where(eq(schema.casinos.name, casinoData.casinoName))
          .limit(1);

        if (!casino) {
          app.logger.warn({ casino: casinoData.casinoName }, 'Casino not found for bulk insert');
          continue;
        }

        let insertedForCasino = 0;
        for (const game of casinoData.games) {
          await app.db
            .insert(schema.casinoMachines)
            .values({
              casinoName: casinoData.casinoName,
              brand: 'Aristocrat',
              gameTitle: game.gameTitle,
              denom: game.denom,
              lastSeen: lastSeenDate,
              photoUrl: null,
              notes,
              userId: null,
            });
          insertedForCasino += 1;
        }

        // Increment casino's reported_count
        if (insertedForCasino > 0) {
          await app.db
            .update(schema.casinos)
            .set({ reportedCount: (casino.reportedCount || 0) + insertedForCasino })
            .where(eq(schema.casinos.name, casinoData.casinoName));

          totalInserted += insertedForCasino;
          app.logger.info(
            { casino: casinoData.casinoName, count: insertedForCasino },
            'Aristocrat games inserted for casino'
          );
        }
      }

      reply.status(201);
      app.logger.info({ total: totalInserted }, 'Bulk insert completed');
      return {
        success: true,
        inserted: totalInserted,
        casinos: casinoMachinesData.length,
        message: `Successfully inserted ${totalInserted} Aristocrat games across ${casinoMachinesData.length} casinos`,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to bulk insert Aristocrat games');
      throw error;
    }
  });

  // POST /api/casino-directory/bulk-insert-non-aristocrat - Bulk insert non-Aristocrat games (admin only)
  fastify.post('/api/casino-directory/bulk-insert-non-aristocrat', {
    schema: {
      description: 'Bulk insert non-Aristocrat games from public sources (admin only)',
      tags: ['casino-directory'],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            machinesAdded: { type: 'integer' },
            casinosUpdated: { type: 'integer' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    app.logger.info({}, 'Starting bulk insert of non-Aristocrat games');

    try {
      const casinoMachinesData = [
        {
          casinoName: 'MGM Grand',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune Super Cash Link', denom: '$1' },
            { brand: 'IGT', gameTitle: 'Megabucks Mega Vault', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Huff n\' Even More Puff Grand', denom: '1¢' },
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
            { brand: 'IGT', gameTitle: 'Lobstermania', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Cleopatra', denom: '1¢' },
            { brand: 'Light & Wonder', gameTitle: 'Spooky Link', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Bellagio',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune Triple Gold', denom: '$5' },
            { brand: 'Light & Wonder', gameTitle: 'Huff n\' More Puff', denom: '1¢' },
            { brand: 'Light & Wonder', gameTitle: 'Dancing Drums Explosion', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Triple Red Hot 7s', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Caesars Palace',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
            { brand: 'Light & Wonder', gameTitle: 'Invaders from the Planet Moolah', denom: '1¢' },
            { brand: 'Light & Wonder', gameTitle: 'Bonus Boost 888', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Venetian',
          games: [
            { brand: 'Light & Wonder', gameTitle: 'Dancing Drums Explosion', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Wheel of Fortune Cash Machine', denom: '$1' },
            { brand: 'IGT', gameTitle: 'Lobstermania', denom: '1¢' },
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Triple Pop', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Wynn',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Huff n\' More Puff', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
          ],
        },
        {
          casinoName: 'Aria',
          games: [
            { brand: 'Light & Wonder', gameTitle: 'Dancing Drums Explosion', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Planet Hollywood',
          games: [
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Huff n\' Puff', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Flamingo',
          games: [
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
            { brand: 'IGT', gameTitle: 'Cleopatra', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Lobstermania', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Resorts World',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Dancing Drums', denom: '1¢' },
          ],
        },
        {
          casinoName: 'Circa',
          games: [
            { brand: 'IGT', gameTitle: 'Wheel of Fortune', denom: '$1' },
            { brand: 'IGT', gameTitle: 'Megabucks', denom: '$1' },
            { brand: 'Light & Wonder', gameTitle: 'Huff n\' Puff', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
          ],
        },
        {
          casinoName: 'Fremont',
          games: [
            { brand: 'Light & Wonder', gameTitle: 'Triple Red Hot 7s', denom: '1¢' },
            { brand: 'Scientific Games', gameTitle: 'Quick Hit', denom: '1¢' },
            { brand: 'IGT', gameTitle: 'Double Diamond', denom: '25¢' },
            { brand: 'IGT', gameTitle: 'Lobstermania', denom: '1¢' },
          ],
        },
      ];

      const lastSeenDate = new Date('2026-02-01T00:00:00.000Z');
      const notes = 'Popular non-Aristocrat games from public reports/videos — verify on-site.';
      let totalInserted = 0;
      let casinosUpdated = 0;

      for (const casinoData of casinoMachinesData) {
        const [casino] = await app.db
          .select()
          .from(schema.casinos)
          .where(eq(schema.casinos.name, casinoData.casinoName))
          .limit(1);

        if (!casino) {
          app.logger.warn({ casino: casinoData.casinoName }, 'Casino not found for bulk insert');
          continue;
        }

        let insertedForCasino = 0;
        for (const game of casinoData.games) {
          await app.db
            .insert(schema.casinoMachines)
            .values({
              casinoName: casinoData.casinoName,
              brand: game.brand,
              gameTitle: game.gameTitle,
              denom: game.denom,
              lastSeen: lastSeenDate,
              photoUrl: null,
              notes,
              userId: null,
            });
          insertedForCasino += 1;
        }

        // Increment casino's reported_count
        if (insertedForCasino > 0) {
          await app.db
            .update(schema.casinos)
            .set({ reportedCount: (casino.reportedCount || 0) + insertedForCasino })
            .where(eq(schema.casinos.name, casinoData.casinoName));

          totalInserted += insertedForCasino;
          casinosUpdated += 1;
          app.logger.info(
            { casino: casinoData.casinoName, count: insertedForCasino },
            'Non-Aristocrat games inserted for casino'
          );
        }
      }

      reply.status(201);
      app.logger.info({ total: totalInserted, casinos: casinosUpdated }, 'Non-Aristocrat bulk insert completed');
      return {
        success: true,
        message: 'Non-Aristocrat games bulk inserted successfully!',
        machinesAdded: totalInserted,
        casinosUpdated,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to bulk insert non-Aristocrat games');
      throw error;
    }
  });

  // GET /api/casino-directory/activity-stats - Get aggregated sighting statistics per casino
  fastify.get('/api/casino-directory/activity-stats', {
    schema: {
      description: 'Get aggregated sighting statistics per casino from community reports',
      tags: ['casino-directory'],
      querystring: {
        type: 'object',
        properties: {
          sortBy: {
            type: 'string',
            enum: ['totalWins', 'reportCount', 'recentActivity'],
            description: 'Sort order: totalWins (default), reportCount, or recentActivity',
          },
          recentOnly: {
            type: 'boolean',
            description: 'Filter to casinos with reports from the last 7 days',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            stats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  casinoName: { type: 'string' },
                  totalWinAmount: { type: 'number' },
                  reportCount: { type: 'integer' },
                  lastReportDate: { type: ['string', 'null'], format: 'date-time' },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Querystring: { sortBy?: string; recentOnly?: boolean };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { sortBy = 'totalWins', recentOnly = false } = request.query as any;
    app.logger.info({ sortBy, recentOnly }, 'Fetching casino activity statistics');

    try {
      // Calculate 7 days ago for recent filter
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Build where clause to exclude test/demo casinos and optionally filter recent
      let whereClause: any;
      const filters = [
        not(
          or(
            ilike(schema.communityReports.casino, '%test%'),
            ilike(schema.communityReports.casino, '%demo%'),
            ilike(schema.communityReports.casino, '%delete%'),
            ilike(schema.communityReports.casino, '%sample%')
          )
        ),
      ];

      if (recentOnly) {
        filters.push(gt(schema.communityReports.createdAt, sevenDaysAgo));
      }

      whereClause = and(...filters);

      // Group by casino and sum win amounts, count reports
      const activityStats = await app.db
        .select({
          casinoName: schema.communityReports.casino,
          totalWinAmount: sql<number>`cast(coalesce(sum(cast(${schema.communityReports.winAmount} as numeric)), 0) as integer)`,
          reportCount: sql<number>`cast(count(*) as integer)`,
          lastReportDate: sql<string>`max(${schema.communityReports.createdAt})`,
        })
        .from(schema.communityReports)
        .where(whereClause)
        .groupBy(schema.communityReports.casino);

      // Sort based on sortBy parameter
      let sorted = activityStats;
      if (sortBy === 'reportCount') {
        sorted = activityStats.sort((a, b) => b.reportCount - a.reportCount);
      } else if (sortBy === 'recentActivity') {
        sorted = activityStats.sort((a, b) => {
          const dateA = a.lastReportDate ? new Date(a.lastReportDate).getTime() : 0;
          const dateB = b.lastReportDate ? new Date(b.lastReportDate).getTime() : 0;
          return dateB - dateA;
        });
      } else {
        // Default: totalWins (descending)
        sorted = activityStats.sort((a, b) => b.totalWinAmount - a.totalWinAmount);
      }

      const stats = sorted.slice(0, 15).map((item) => ({
        casinoName: item.casinoName,
        totalWinAmount: item.totalWinAmount,
        reportCount: item.reportCount,
        lastReportDate: item.lastReportDate || null,
      }));

      app.logger.info({ casinos: stats.length, sortBy, recentOnly }, 'Casino activity statistics retrieved');

      return {
        stats,
        disclaimer: 'This shows aggregated reported win amounts at each casino — NOT actual win rates or hot/cold status. Reports are anecdotal and biased toward big events. Every slot spin is random. Play responsibly.',
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch casino activity statistics');
      throw error;
    }
  });

  // GET /api/casinos/locations - Get all casinos with coordinates for map display
  fastify.get('/api/casinos/locations', {
    schema: {
      description: 'Get all casinos with their coordinates for map display',
      tags: ['casinos'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              latitude: { type: ['string', 'null'] },
              longitude: { type: ['string', 'null'] },
              area: { type: ['string', 'null'] },
              reportedCount: { type: 'integer' },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any[]> => {
    app.logger.info({}, 'Fetching casino locations for map');

    try {
      const casinos = await app.db
        .select({
          id: schema.casinos.id,
          name: schema.casinos.name,
          latitude: schema.casinos.latitude,
          longitude: schema.casinos.longitude,
          area: schema.casinos.area,
          reportedCount: schema.casinos.reportedCount,
        })
        .from(schema.casinos)
        .orderBy(schema.casinos.name);

      app.logger.info({ count: casinos.length }, 'Casino locations retrieved');
      return casinos;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch casino locations');
      throw error;
    }
  });
}
