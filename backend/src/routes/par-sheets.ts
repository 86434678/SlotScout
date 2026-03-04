import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const PAR_SHEETS_DATA = [
  {
    gameTitle: 'Buffalo Gold',
    brand: 'Aristocrat',
    rtpRangeLow: 85,
    rtpRangeHigh: 96,
    volatility: 'High',
    typicalDenoms: '1¢-5¢',
    notes: 'High volatility link game; casino config varies',
    sourceLink: 'https://wizardofodds.com/games/slots/',
  },
  {
    gameTitle: 'Lightning Link',
    brand: 'Aristocrat',
    rtpRangeLow: 87,
    rtpRangeHigh: 95,
    volatility: 'High',
    typicalDenoms: '1¢-5¢',
    notes: 'Hold & Spin feature',
    sourceLink: 'https://wizardofodds.com/',
  },
  {
    gameTitle: 'Dragon Link',
    brand: 'Aristocrat',
    rtpRangeLow: 88,
    rtpRangeHigh: 94,
    volatility: 'Medium-High',
    typicalDenoms: '1¢+',
    notes: 'Frequent jackpots',
    sourceLink: 'https://wizardofodds.com/',
  },
  {
    gameTitle: 'Wheel of Fortune',
    brand: 'IGT',
    rtpRangeLow: 88,
    rtpRangeHigh: 95,
    volatility: 'Medium',
    typicalDenoms: '25¢+',
    notes: 'Progressive bonuses',
    sourceLink: 'https://www.igtjackpots.com/wheel-of-fortune',
  },
  {
    gameTitle: 'Megabucks',
    brand: 'IGT',
    rtpRangeLow: 85,
    rtpRangeHigh: 90,
    volatility: 'Very High',
    typicalDenoms: '$1+',
    notes: 'Statewide progressive',
    sourceLink: 'https://www.igtjackpots.com/jackpot-library/megabucks-1s-nevada',
  },
  {
    gameTitle: 'Quick Hit',
    brand: 'Scientific Games',
    rtpRangeLow: 86,
    rtpRangeHigh: 94,
    volatility: 'High',
    typicalDenoms: '1¢-5¢',
    notes: 'Multipliers classic',
    sourceLink: '',
  },
  {
    gameTitle: 'Lobstermania',
    brand: 'IGT',
    rtpRangeLow: 90,
    rtpRangeHigh: 94,
    volatility: 'Medium',
    typicalDenoms: '1¢-5¢',
    notes: 'Public par sheet analysis',
    sourceLink: 'https://wizardofodds.com/games/slots/lobstermania/',
  },
];

export async function register(app: App, fastify: FastifyInstance) {
  // Initialize par sheets on startup
  try {
    const existing = await app.db.select().from(schema.parSheets).limit(1);

    if (existing.length === 0) {
      for (const sheet of PAR_SHEETS_DATA) {
        await app.db.insert(schema.parSheets).values({
          gameTitle: sheet.gameTitle,
          brand: sheet.brand,
          rtpRangeLow: String(sheet.rtpRangeLow),
          rtpRangeHigh: String(sheet.rtpRangeHigh),
          volatility: sheet.volatility,
          typicalDenoms: sheet.typicalDenoms,
          notes: sheet.notes,
          sourceLink: sheet.sourceLink || null,
        });
      }
      app.logger.info({ count: PAR_SHEETS_DATA.length }, 'Par sheets initialized');
    }
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to initialize par sheets');
  }

  // GET /api/par-sheets - Get all par sheets
  fastify.get('/api/par-sheets', {
    schema: {
      description: 'Get all par sheets',
      tags: ['par-sheets'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              gameTitle: { type: 'string' },
              brand: { type: 'string' },
              rtpRangeLow: { type: 'string' },
              rtpRangeHigh: { type: 'string' },
              volatility: { type: 'string' },
              typicalDenoms: { type: 'string' },
              notes: { type: 'string' },
              sourceLink: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (): Promise<any[]> => {
    app.logger.info({}, 'Fetching all par sheets');

    const results = await app.db.select().from(schema.parSheets);

    const formatted = results.map((sheet) => ({
      id: sheet.id,
      gameTitle: sheet.gameTitle,
      brand: sheet.brand,
      rtpRangeLow: sheet.rtpRangeLow,
      rtpRangeHigh: sheet.rtpRangeHigh,
      volatility: sheet.volatility,
      typicalDenoms: sheet.typicalDenoms,
      notes: sheet.notes,
      sourceLink: sheet.sourceLink,
      createdAt: sheet.createdAt,
    }));

    app.logger.info({ count: formatted.length }, 'Par sheets retrieved');
    return formatted;
  });

  // GET /api/par-sheets/:id - Get specific par sheet
  fastify.get('/api/par-sheets/:id', {
    schema: {
      description: 'Get specific par sheet by ID',
      tags: ['par-sheets'],
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
            gameTitle: { type: 'string' },
            brand: { type: 'string' },
            rtpRangeLow: { type: 'string' },
            rtpRangeHigh: { type: 'string' },
            volatility: { type: 'string' },
            typicalDenoms: { type: 'string' },
            notes: { type: 'string' },
            sourceLink: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
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
    app.logger.info({ id }, 'Fetching par sheet');

    const result = await app.db
      .select()
      .from(schema.parSheets)
      .where(eq(schema.parSheets.id, id))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({ error: 'Par sheet not found' });
    }

    const sheet = result[0];
    return {
      id: sheet.id,
      gameTitle: sheet.gameTitle,
      brand: sheet.brand,
      rtpRangeLow: sheet.rtpRangeLow,
      rtpRangeHigh: sheet.rtpRangeHigh,
      volatility: sheet.volatility,
      typicalDenoms: sheet.typicalDenoms,
      notes: sheet.notes,
      sourceLink: sheet.sourceLink,
      createdAt: sheet.createdAt,
    };
  });

  // GET /api/par-sheets/search - Search par sheets by game title
  fastify.get('/api/par-sheets/search', {
    schema: {
      description: 'Search par sheets by game title',
      tags: ['par-sheets'],
      querystring: {
        type: 'object',
        properties: {
          gameTitle: { type: 'string', description: 'Game title to search for' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              gameTitle: { type: 'string' },
              brand: { type: 'string' },
              rtpRangeLow: { type: 'string' },
              rtpRangeHigh: { type: 'string' },
              volatility: { type: 'string' },
              typicalDenoms: { type: 'string' },
              notes: { type: 'string' },
              sourceLink: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Querystring: { gameTitle?: string } }>,
    reply: FastifyReply
  ): Promise<any[]> => {
    const { gameTitle } = request.query as any;
    app.logger.info({ gameTitle }, 'Searching par sheets');

    if (!gameTitle || gameTitle.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${gameTitle}%`;
    const results = await app.db
      .select()
      .from(schema.parSheets)
      .where(ilike(schema.parSheets.gameTitle, searchTerm));

    const formatted = results.map((sheet) => ({
      id: sheet.id,
      gameTitle: sheet.gameTitle,
      brand: sheet.brand,
      rtpRangeLow: sheet.rtpRangeLow,
      rtpRangeHigh: sheet.rtpRangeHigh,
      volatility: sheet.volatility,
      typicalDenoms: sheet.typicalDenoms,
      notes: sheet.notes,
      sourceLink: sheet.sourceLink,
      createdAt: sheet.createdAt,
    }));

    app.logger.info({ gameTitle, count: formatted.length }, 'Par sheet search results');
    return formatted;
  });

  // POST /api/par-sheets - Create new par sheet
  fastify.post('/api/par-sheets', {
    schema: {
      description: 'Create new par sheet',
      tags: ['par-sheets'],
      body: {
        type: 'object',
        required: ['gameTitle', 'brand', 'rtpRangeLow', 'rtpRangeHigh', 'volatility', 'typicalDenoms', 'notes'],
        properties: {
          gameTitle: { type: 'string' },
          brand: { type: 'string' },
          rtpRangeLow: { type: ['number', 'string'] },
          rtpRangeHigh: { type: ['number', 'string'] },
          volatility: { type: 'string' },
          typicalDenoms: { type: 'string' },
          notes: { type: 'string' },
          sourceLink: { type: ['string', 'null'] },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            gameTitle: { type: 'string' },
            brand: { type: 'string' },
            rtpRangeLow: { type: 'string' },
            rtpRangeHigh: { type: 'string' },
            volatility: { type: 'string' },
            typicalDenoms: { type: 'string' },
            notes: { type: 'string' },
            sourceLink: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
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
        gameTitle: string;
        brand: string;
        rtpRangeLow: number | string;
        rtpRangeHigh: number | string;
        volatility: string;
        typicalDenoms: string;
        notes: string;
        sourceLink?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { gameTitle, brand, rtpRangeLow, rtpRangeHigh, volatility, typicalDenoms, notes, sourceLink } = request.body;
    app.logger.info({ gameTitle, brand }, 'Creating par sheet');

    try {
      // Ensure RTP values are formatted with at least one decimal place
      const formatRtp = (value: number | string): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toFixed(1);
      };

      const [result] = await app.db
        .insert(schema.parSheets)
        .values({
          gameTitle,
          brand,
          rtpRangeLow: formatRtp(rtpRangeLow),
          rtpRangeHigh: formatRtp(rtpRangeHigh),
          volatility,
          typicalDenoms,
          notes,
          sourceLink: sourceLink || null,
        })
        .returning();

      app.logger.info({ id: result.id }, 'Par sheet created');

      reply.status(201);
      return {
        id: result.id,
        gameTitle: result.gameTitle,
        brand: result.brand,
        rtpRangeLow: result.rtpRangeLow,
        rtpRangeHigh: result.rtpRangeHigh,
        volatility: result.volatility,
        typicalDenoms: result.typicalDenoms,
        notes: result.notes,
        sourceLink: result.sourceLink,
        createdAt: result.createdAt,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to create par sheet');
      throw error;
    }
  });

  // PUT /api/par-sheets/:id - Update par sheet
  fastify.put('/api/par-sheets/:id', {
    schema: {
      description: 'Update par sheet',
      tags: ['par-sheets'],
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
          gameTitle: { type: 'string' },
          brand: { type: 'string' },
          rtpRangeLow: { type: ['number', 'string'] },
          rtpRangeHigh: { type: ['number', 'string'] },
          volatility: { type: 'string' },
          typicalDenoms: { type: 'string' },
          notes: { type: 'string' },
          sourceLink: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            gameTitle: { type: 'string' },
            brand: { type: 'string' },
            rtpRangeLow: { type: 'string' },
            rtpRangeHigh: { type: 'string' },
            volatility: { type: 'string' },
            typicalDenoms: { type: 'string' },
            notes: { type: 'string' },
            sourceLink: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
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
        gameTitle?: string;
        brand?: string;
        rtpRangeLow?: number | string;
        rtpRangeHigh?: number | string;
        volatility?: string;
        typicalDenoms?: string;
        notes?: string;
        sourceLink?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { id } = request.params;
    app.logger.info({ id }, 'Updating par sheet');

    try {
      const existing = await app.db
        .select()
        .from(schema.parSheets)
        .where(eq(schema.parSheets.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Par sheet not found' });
      }

      // Ensure RTP values are formatted with at least one decimal place
      const formatRtp = (value: number | string): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toFixed(1);
      };

      const updateData: any = {};
      if (request.body.gameTitle !== undefined) updateData.gameTitle = request.body.gameTitle;
      if (request.body.brand !== undefined) updateData.brand = request.body.brand;
      if (request.body.rtpRangeLow !== undefined) updateData.rtpRangeLow = formatRtp(request.body.rtpRangeLow);
      if (request.body.rtpRangeHigh !== undefined) updateData.rtpRangeHigh = formatRtp(request.body.rtpRangeHigh);
      if (request.body.volatility !== undefined) updateData.volatility = request.body.volatility;
      if (request.body.typicalDenoms !== undefined) updateData.typicalDenoms = request.body.typicalDenoms;
      if (request.body.notes !== undefined) updateData.notes = request.body.notes;
      if (request.body.sourceLink !== undefined) updateData.sourceLink = request.body.sourceLink;

      const [result] = await app.db
        .update(schema.parSheets)
        .set(updateData)
        .where(eq(schema.parSheets.id, id))
        .returning();

      app.logger.info({ id }, 'Par sheet updated');

      return {
        id: result.id,
        gameTitle: result.gameTitle,
        brand: result.brand,
        rtpRangeLow: result.rtpRangeLow,
        rtpRangeHigh: result.rtpRangeHigh,
        volatility: result.volatility,
        typicalDenoms: result.typicalDenoms,
        notes: result.notes,
        sourceLink: result.sourceLink,
        createdAt: result.createdAt,
      };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update par sheet');
      throw error;
    }
  });

  // DELETE /api/par-sheets/:id - Delete par sheet
  fastify.delete('/api/par-sheets/:id', {
    schema: {
      description: 'Delete par sheet',
      tags: ['par-sheets'],
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
    app.logger.info({ id }, 'Deleting par sheet');

    try {
      const existing = await app.db
        .select()
        .from(schema.parSheets)
        .where(eq(schema.parSheets.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'Par sheet not found' });
      }

      await app.db.delete(schema.parSheets).where(eq(schema.parSheets.id, id));

      app.logger.info({ id }, 'Par sheet deleted');

      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to delete par sheet');
      throw error;
    }
  });
}
