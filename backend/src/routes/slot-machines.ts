import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or, ilike, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'All stats are public aggregates from NGCB reports or user-reported. Not a guarantee of future results. For entertainment only.';

// Popular slot machines data
const POPULAR_SLOT_MACHINES = [
  {
    brand: 'IGT',
    gameTitle: 'Buffalo Gold',
    commonDenoms: ['$0.01', '$0.02', '$0.05'],
    casinoExamples: 'Bellagio, MGM Grand, Caesars Palace',
    description: 'Popular buffalo-themed slot with free spins and multipliers',
  },
  {
    brand: 'Aristocrat',
    gameTitle: 'Lightning Link',
    commonDenoms: ['$0.01', '$0.02', '$0.05', '$0.25'],
    casinoExamples: 'Aria, Cosmopolitan, Venetian',
    description: 'Hold & Spin feature with progressive jackpots',
  },
  {
    brand: 'IGT',
    gameTitle: 'Quick Hit',
    commonDenoms: ['$0.01', '$0.05', '$0.25', '$1.00'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Classic slot with Quick Hit symbols and free games',
  },
  {
    brand: 'IGT',
    gameTitle: 'Wheel of Fortune',
    commonDenoms: ['$0.01', '$0.25', '$1.00'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Iconic wheel bonus with progressive jackpots',
  },
  {
    brand: 'Aristocrat',
    gameTitle: 'Dragon Link',
    commonDenoms: ['$0.01', '$0.02', '$0.05'],
    casinoExamples: 'Bellagio, Wynn, Encore',
    description: 'Asian-themed with Hold & Spin feature',
  },
  {
    brand: 'IGT',
    gameTitle: 'Cleopatra',
    commonDenoms: ['$0.01', '$0.05', '$0.25'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Egyptian theme with free spins multipliers',
  },
  {
    brand: 'Konami',
    gameTitle: 'China Shores',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'MGM properties, Caesars',
    description: 'Action Stacked Symbols feature',
  },
  {
    brand: 'Light & Wonder',
    gameTitle: '88 Fortunes',
    commonDenoms: ['$0.01', '$0.02', '$0.05'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Asian theme with Fu Bat Jackpot feature',
  },
  {
    brand: 'IGT',
    gameTitle: 'Triple Red Hot 777',
    commonDenoms: ['$0.25', '$1.00', '$5.00'],
    casinoExamples: 'High limit rooms',
    description: 'Classic 3-reel with multipliers',
  },
  {
    brand: 'Aristocrat',
    gameTitle: 'Buffalo',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Original buffalo game with free spins',
  },
  {
    brand: 'IGT',
    gameTitle: 'Siberian Storm',
    commonDenoms: ['$0.01', '$0.02', '$0.05'],
    casinoExamples: 'MGM Grand, Bellagio',
    description: 'MultiWay Xtra with 720 ways to win',
  },
  {
    brand: 'Konami',
    gameTitle: 'Lion Festival',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'Caesars, MGM properties',
    description: 'Boosted Reels feature',
  },
  {
    brand: 'Light & Wonder',
    gameTitle: 'Fu Dao Le',
    commonDenoms: ['$0.01', '$0.02', '$0.05'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Asian theme with progressive jackpots',
  },
  {
    brand: 'IGT',
    gameTitle: 'Texas Tea',
    commonDenoms: ['$0.01', '$0.05', '$0.25'],
    casinoExamples: 'Caesars, Venetian',
    description: 'Oil derrick bonus feature',
  },
  {
    brand: 'Aristocrat',
    gameTitle: 'More Chilli',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'Downtown casinos',
    description: 'Mexican theme with free spins',
  },
  {
    brand: 'Konami',
    gameTitle: 'Chili Chili Fire',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'Most Vegas casinos',
    description: 'Action Stacked Symbols',
  },
  {
    brand: 'IGT',
    gameTitle: 'Double Diamond',
    commonDenoms: ['$0.25', '$1.00', '$5.00'],
    casinoExamples: 'High limit rooms',
    description: 'Classic 3-reel multiplier',
  },
  {
    brand: 'Light & Wonder',
    gameTitle: 'Invaders from Planet Moolah',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'MGM properties',
    description: 'Cascading reels feature',
  },
  {
    brand: 'Aristocrat',
    gameTitle: '50 Lions',
    commonDenoms: ['$0.01', '$0.02'],
    casinoExamples: 'Most Vegas casinos',
    description: 'African theme with free spins',
  },
  {
    brand: 'IGT',
    gameTitle: 'Davinci Diamonds',
    commonDenoms: ['$0.01', '$0.05', '$0.25'],
    casinoExamples: 'Bellagio, Wynn',
    description: 'Tumbling reels feature',
  },
];

export async function register(app: App, fastify: FastifyInstance) {
  // Initialize slot machines on startup
  try {
    const existing = await app.db.select().from(schema.slotMachines).limit(1);

    if (existing.length === 0) {
      for (const machine of POPULAR_SLOT_MACHINES) {
        await app.db.insert(schema.slotMachines).values({
          brand: machine.brand,
          gameTitle: machine.gameTitle,
          commonDenoms: JSON.stringify(machine.commonDenoms),
          casinoExamples: machine.casinoExamples,
          description: machine.description,
          imageUrl: null,
        });
      }
      app.logger.info({ count: POPULAR_SLOT_MACHINES.length }, 'Slot machines initialized');
    }
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to initialize slot machines');
  }

  // GET /api/slot-machines - List all slot machines
  fastify.get('/api/slot-machines', {
    schema: {
      description: 'Get all slot machines in database',
      tags: ['slot-machines'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              brand: { type: 'string' },
              gameTitle: { type: 'string' },
              commonDenoms: { type: 'array', items: { type: 'string' } },
              casinoExamples: { type: ['string', 'null'] },
              description: { type: ['string', 'null'] },
              imageUrl: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  }, async (): Promise<any[]> => {
    app.logger.info({}, 'Fetching all slot machines');

    const results = await app.db.select().from(schema.slotMachines);

    const formatted = results.map((machine) => ({
      id: machine.id,
      brand: machine.brand,
      gameTitle: machine.gameTitle,
      commonDenoms: JSON.parse(machine.commonDenoms || '[]'),
      casinoExamples: machine.casinoExamples,
      description: machine.description,
      imageUrl: machine.imageUrl,
    }));

    app.logger.info({ count: formatted.length }, 'Slot machines retrieved');
    return formatted;
  });

  // GET /api/slot-machines/:id - Get specific slot machine
  fastify.get('/api/slot-machines/:id', {
    schema: {
      description: 'Get specific slot machine details',
      tags: ['slot-machines'],
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
          properties: {
            id: { type: 'string', format: 'uuid' },
            brand: { type: 'string' },
            gameTitle: { type: 'string' },
            commonDenoms: { type: 'array', items: { type: 'string' } },
            casinoExamples: { type: ['string', 'null'] },
            description: { type: ['string', 'null'] },
            imageUrl: { type: ['string', 'null'] },
          },
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
    app.logger.info({ id }, 'Fetching slot machine');

    const result = await app.db
      .select()
      .from(schema.slotMachines)
      .where(eq(schema.slotMachines.id, id))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({ error: 'Slot machine not found' });
    }

    const machine = result[0];
    return {
      id: machine.id,
      brand: machine.brand,
      gameTitle: machine.gameTitle,
      commonDenoms: JSON.parse(machine.commonDenoms || '[]'),
      casinoExamples: machine.casinoExamples,
      description: machine.description,
      imageUrl: machine.imageUrl,
    };
  });

  // POST /api/slot-machines/search - Search slot machines
  fastify.post('/api/slot-machines/search', {
    schema: {
      description: 'Search slot machines by text',
      tags: ['slot-machines'],
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              brand: { type: 'string' },
              gameTitle: { type: 'string' },
              confidence: { type: 'number' },
              casinoExamples: { type: ['string', 'null'] },
              description: { type: ['string', 'null'] },
            },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { query: string } }>,
    reply: FastifyReply
  ): Promise<any[]> => {
    const { query } = request.body;
    app.logger.info({ query }, 'Searching slot machines');

    let results;

    // If query is empty, return all machines
    if (!query || query.trim().length === 0) {
      results = await app.db.select().from(schema.slotMachines);

      // All machines get 0 confidence when no query
      const matches = results.map((machine) => ({
        id: machine.id,
        brand: machine.brand,
        gameTitle: machine.gameTitle,
        confidence: 0,
        casinoExamples: machine.casinoExamples,
        description: machine.description,
      }));

      app.logger.info({ count: matches.length }, 'All slot machines retrieved');
      return matches;
    }

    // Search for matches
    const searchTerm = `%${query}%`;
    results = await app.db
      .select()
      .from(schema.slotMachines)
      .where(
        or(
          ilike(schema.slotMachines.brand, searchTerm),
          ilike(schema.slotMachines.gameTitle, searchTerm),
          ilike(schema.slotMachines.description, searchTerm)
        )
      );

    // Calculate confidence scores
    const matches = results.map((machine) => {
      let confidence = 0;

      // Exact matches get highest score
      if (machine.brand?.toLowerCase() === query.toLowerCase()) {
        confidence = 100;
      } else if (machine.gameTitle?.toLowerCase() === query.toLowerCase()) {
        confidence = 100;
      } else {
        // Partial matches based on word similarity
        const queryWords = query.toLowerCase().split(/\s+/);
        const titleWords = machine.gameTitle?.toLowerCase().split(/\s+/) || [];
        const brandWords = machine.brand?.toLowerCase().split(/\s+/) || [];

        const matchedWords = queryWords.filter(
          (word) =>
            titleWords.some((w) => w.includes(word)) ||
            brandWords.some((w) => w.includes(word))
        );

        confidence = Math.round((matchedWords.length / queryWords.length) * 100);
      }

      return {
        id: machine.id,
        brand: machine.brand,
        gameTitle: machine.gameTitle,
        confidence,
        casinoExamples: machine.casinoExamples,
        description: machine.description,
      };
    });

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    app.logger.info({ query, count: matches.length }, 'Search results retrieved');
    return matches;
  });

  // POST /api/slot-machines/report-unknown - Report unknown machine
  fastify.post('/api/slot-machines/report-unknown', {
    schema: {
      description: 'Report an unknown slot machine for community review',
      tags: ['slot-machines'],
      body: {
        type: 'object',
        required: ['imageUrl'],
        properties: {
          brand: { type: ['string', 'null'] },
          gameTitle: { type: ['string', 'null'] },
          imageUrl: { type: 'string' },
          notes: { type: ['string', 'null'] },
          userId: { type: ['string', 'null'] },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        brand?: string | null;
        gameTitle?: string | null;
        imageUrl: string;
        notes?: string | null;
        userId?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { brand, gameTitle, imageUrl, notes, userId } = request.body;
    app.logger.info({ brand, gameTitle }, 'Reporting unknown slot machine');

    try {
      const [result] = await app.db
        .insert(schema.pendingSlotMachines)
        .values({
          brand: brand || null,
          gameTitle: gameTitle || null,
          imageUrl,
          notes: notes || null,
          userId: userId || null,
          status: 'pending_review',
        })
        .returning();

      app.logger.info({ id: result.id }, 'Unknown machine reported');

      reply.status(201);
      return {
        id: result.id,
        status: result.status,
        message: 'Thank you for reporting! Our community reviewers will verify this machine.',
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to report unknown machine');
      throw error;
    }
  });
}
