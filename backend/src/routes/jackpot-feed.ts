import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'Amounts from public trackers like Wizard of Vegas — change constantly. Not guarantees. Entertainment only.';

const JACKPOT_DATA = [
  {
    jackpotName: 'Megabucks $1 Nevada',
    currentAmount: 10319410,
    location: 'Statewide Nevada (many Strip)',
    lastUpdated: '2026-02-19T00:00:00Z',
    trackerLink: 'https://wizardofvegas.com/jackpots/',
    notes: 'Biggest statewide progressive',
  },
  {
    jackpotName: 'Wheel of Fortune 1s Nevada',
    currentAmount: 2363098,
    location: 'Statewide',
    lastUpdated: '2026-02-19T00:00:00Z',
    trackerLink: 'https://wizardofvegas.com/jackpots/',
    notes: 'Frequent big hits',
  },
  {
    jackpotName: 'Dragon Link Grand',
    currentAmount: 1800000,
    location: 'Various Strip/Resorts World',
    lastUpdated: '2026-02-19T00:00:00Z',
    trackerLink: 'https://wizardofvegas.com/jackpots/',
    notes: 'Link progressive',
  },
  {
    jackpotName: 'Lightning Link Grand',
    currentAmount: 1200000,
    location: 'Various Strip',
    lastUpdated: '2026-02-19T00:00:00Z',
    trackerLink: 'https://wizardofvegas.com/jackpots/',
    notes: 'Aristocrat link',
  },
];

export async function register(app: App, fastify: FastifyInstance) {
  // Initialize jackpot feed on startup
  try {
    for (const jackpot of JACKPOT_DATA) {
      // Check if this specific jackpot already exists
      const existing = await app.db
        .select()
        .from(schema.jackpotFeed)
        .where(eq(schema.jackpotFeed.jackpotName, jackpot.jackpotName))
        .limit(1);

      // Only insert if it doesn't exist
      if (existing.length === 0) {
        await app.db.insert(schema.jackpotFeed).values({
          jackpotName: jackpot.jackpotName,
          currentAmount: String(jackpot.currentAmount),
          location: jackpot.location,
          lastUpdated: new Date(jackpot.lastUpdated),
          trackerLink: jackpot.trackerLink,
          notes: jackpot.notes || null,
        });
      }
    }
    app.logger.info({ count: JACKPOT_DATA.length }, 'Jackpot feed initialized');
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to initialize jackpot feed');
  }

  // GET /api/jackpot-feed - Get all jackpots
  fastify.get('/api/jackpot-feed', {
    schema: {
      description: 'Get all jackpots ordered by current amount',
      tags: ['jackpot-feed'],
      response: {
        200: {
          type: 'object',
          properties: {
            jackpots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  jackpotName: { type: 'string' },
                  currentAmount: { type: 'number' },
                  location: { type: 'string' },
                  lastUpdated: { type: 'string', format: 'date-time' },
                  trackerLink: { type: 'string' },
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
  }, async (): Promise<any> => {
    app.logger.info({}, 'Fetching all jackpots');

    const results = await app.db
      .select()
      .from(schema.jackpotFeed)
      .orderBy(desc(schema.jackpotFeed.currentAmount));

    const formatted = results.map((jackpot) => ({
      id: jackpot.id,
      jackpotName: jackpot.jackpotName,
      currentAmount: parseFloat(jackpot.currentAmount),
      location: jackpot.location,
      lastUpdated: jackpot.lastUpdated.toISOString(),
      trackerLink: jackpot.trackerLink,
      notes: jackpot.notes,
      createdAt: jackpot.createdAt.toISOString(),
    }));

    app.logger.info({ count: formatted.length }, 'Jackpots retrieved');
    return {
      jackpots: formatted,
      disclaimer: DISCLAIMER,
    };
  });

  // POST /api/jackpot-feed - Create new jackpot
  fastify.post('/api/jackpot-feed', {
    schema: {
      description: 'Create new jackpot entry',
      tags: ['jackpot-feed'],
      body: {
        type: 'object',
        required: ['jackpotName', 'currentAmount', 'location', 'lastUpdated', 'trackerLink'],
        properties: {
          jackpotName: { type: 'string' },
          currentAmount: { type: 'number' },
          location: { type: 'string' },
          lastUpdated: { type: 'string', format: 'date-time' },
          trackerLink: { type: 'string' },
          notes: { type: ['string', 'null'] },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            jackpotName: { type: 'string' },
            currentAmount: { type: 'number' },
            location: { type: 'string' },
            lastUpdated: { type: 'string', format: 'date-time' },
            trackerLink: { type: 'string' },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            disclaimer: { type: 'string' },
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
        jackpotName: string;
        currentAmount: number;
        location: string;
        lastUpdated: string;
        trackerLink: string;
        notes?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { jackpotName, currentAmount, location, lastUpdated, trackerLink, notes } = request.body;
    app.logger.info({ jackpotName }, 'Creating jackpot entry');

    try {
      const [result] = await app.db
        .insert(schema.jackpotFeed)
        .values({
          jackpotName,
          currentAmount: String(currentAmount),
          location,
          lastUpdated: new Date(lastUpdated),
          trackerLink,
          notes: notes || null,
        })
        .returning();

      app.logger.info({ id: result.id }, 'Jackpot entry created');

      reply.status(201);
      return {
        id: result.id,
        jackpotName: result.jackpotName,
        currentAmount: parseFloat(result.currentAmount),
        location: result.location,
        lastUpdated: result.lastUpdated.toISOString(),
        trackerLink: result.trackerLink,
        notes: result.notes,
        createdAt: result.createdAt.toISOString(),
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to create jackpot entry');
      throw error;
    }
  });

  // PUT /api/jackpot-feed/:id - Update jackpot
  fastify.put('/api/jackpot-feed/:id', {
    schema: {
      description: 'Update jackpot entry',
      tags: ['jackpot-feed'],
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
          jackpotName: { type: 'string' },
          currentAmount: { type: 'number' },
          location: { type: 'string' },
          lastUpdated: { type: 'string', format: 'date-time' },
          trackerLink: { type: 'string' },
          notes: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            jackpotName: { type: 'string' },
            currentAmount: { type: 'number' },
            location: { type: 'string' },
            lastUpdated: { type: 'string', format: 'date-time' },
            trackerLink: { type: 'string' },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            disclaimer: { type: 'string' },
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
        jackpotName?: string;
        currentAmount?: number;
        location?: string;
        lastUpdated?: string;
        trackerLink?: string;
        notes?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { id } = request.params;
    app.logger.info({ id }, 'Updating jackpot entry');

    try {
      const existing = await app.db
        .select()
        .from(schema.jackpotFeed)
        .where(eq(schema.jackpotFeed.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Jackpot entry not found' });
      }

      const updateData: any = {};
      if (request.body.jackpotName !== undefined) updateData.jackpotName = request.body.jackpotName;
      if (request.body.currentAmount !== undefined) updateData.currentAmount = String(request.body.currentAmount);
      if (request.body.location !== undefined) updateData.location = request.body.location;
      if (request.body.lastUpdated !== undefined) updateData.lastUpdated = new Date(request.body.lastUpdated);
      if (request.body.trackerLink !== undefined) updateData.trackerLink = request.body.trackerLink;
      if (request.body.notes !== undefined) updateData.notes = request.body.notes;

      const [result] = await app.db
        .update(schema.jackpotFeed)
        .set(updateData)
        .where(eq(schema.jackpotFeed.id, id))
        .returning();

      app.logger.info({ id }, 'Jackpot entry updated');

      return {
        id: result.id,
        jackpotName: result.jackpotName,
        currentAmount: parseFloat(result.currentAmount),
        location: result.location,
        lastUpdated: result.lastUpdated.toISOString(),
        trackerLink: result.trackerLink,
        notes: result.notes,
        createdAt: result.createdAt.toISOString(),
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update jackpot entry');
      throw error;
    }
  });

  // DELETE /api/jackpot-feed/:id - Delete jackpot
  fastify.delete('/api/jackpot-feed/:id', {
    schema: {
      description: 'Delete jackpot entry',
      tags: ['jackpot-feed'],
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
            success: { type: 'boolean' },
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
    app.logger.info({ id }, 'Deleting jackpot entry');

    try {
      const existing = await app.db
        .select()
        .from(schema.jackpotFeed)
        .where(eq(schema.jackpotFeed.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Jackpot entry not found' });
      }

      await app.db.delete(schema.jackpotFeed).where(eq(schema.jackpotFeed.id, id));

      app.logger.info({ id }, 'Jackpot entry deleted');

      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to delete jackpot entry');
      throw error;
    }
  });
}
