import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'Official public aggregates from Nevada Gaming Control Board. Not a guarantee. For entertainment only.';

const NGCB_DATA = [
  {
    reportMonth: '2025-12',
    locationArea: 'Las Vegas Strip',
    denomination: 'All',
    avgRtpPercent: '92.78',
    holdPercent: '7.22',
    numMachines: '35336',
    notes: 'December 2025 NGCB report',
  },
  {
    reportMonth: '2025-12',
    locationArea: 'Downtown Las Vegas',
    denomination: 'All',
    avgRtpPercent: '91.48',
    holdPercent: '8.52',
    numMachines: '10040',
    notes: 'December 2025',
  },
  {
    reportMonth: '2025-12',
    locationArea: 'Boulder Strip',
    denomination: 'All',
    avgRtpPercent: '92.85',
    holdPercent: '7.15',
    numMachines: '14252',
    notes: 'December 2025',
  },
  {
    reportMonth: '2025-12',
    locationArea: 'Statewide Nevada',
    denomination: 'All',
    avgRtpPercent: '93.05',
    holdPercent: '6.95',
    numMachines: '125719',
    notes: 'December 2025',
  },
  {
    reportMonth: '2025-12',
    locationArea: 'Las Vegas Strip',
    denomination: '1¢',
    avgRtpPercent: '93.2',
    holdPercent: '6.8',
    numMachines: '18500',
    notes: 'Typical penny trend from NGCB patterns',
  },
  {
    reportMonth: '2025-11',
    locationArea: 'Las Vegas Strip',
    denomination: 'All',
    avgRtpPercent: '92.65',
    holdPercent: '7.35',
    numMachines: '35200',
    notes: 'November 2025',
  },
  {
    reportMonth: '2025-11',
    locationArea: 'Downtown Las Vegas',
    denomination: 'All',
    avgRtpPercent: '91.35',
    holdPercent: '8.65',
    numMachines: '10100',
    notes: 'November 2025',
  },
  {
    reportMonth: '2025-10',
    locationArea: 'Las Vegas Strip',
    denomination: 'All',
    avgRtpPercent: '92.55',
    holdPercent: '7.45',
    numMachines: '35100',
    notes: 'October 2025',
  },
  {
    reportMonth: '2025-10',
    locationArea: 'Statewide Nevada',
    denomination: 'All',
    avgRtpPercent: '92.95',
    holdPercent: '7.05',
    numMachines: '125500',
    notes: 'October 2025',
  },
  {
    reportMonth: '2025-09',
    locationArea: 'Las Vegas Strip',
    denomination: 'All',
    avgRtpPercent: '92.48',
    holdPercent: '7.52',
    numMachines: '35000',
    notes: 'September 2025',
  },
  {
    reportMonth: '2025-12',
    locationArea: 'Downtown Las Vegas',
    denomination: '25¢',
    avgRtpPercent: '93.2',
    holdPercent: '6.8',
    numMachines: '5020',
    notes: 'Quarter denomination Downtown',
  },
];

export async function register(app: App, fastify: FastifyInstance) {
  // Get auth middleware
  const requireAuth = app.requireAuth();

  // Initialize NGCB stats on startup
  try {
    for (const stat of NGCB_DATA) {
      // Check if this specific stat already exists
      const existing = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(
          and(
            eq(schema.ngcbStats.reportMonth, stat.reportMonth),
            eq(schema.ngcbStats.locationArea, stat.locationArea),
            eq(schema.ngcbStats.denomination, stat.denomination)
          )
        )
        .limit(1);

      // Only insert if it doesn't exist
      if (existing.length === 0) {
        await app.db.insert(schema.ngcbStats).values({
          reportMonth: stat.reportMonth,
          locationArea: stat.locationArea,
          denomination: stat.denomination,
          avgRtpPercent: stat.avgRtpPercent,
          holdPercent: stat.holdPercent,
          numMachines: stat.numMachines,
          notes: stat.notes,
        });
      }
    }
    app.logger.info({ count: NGCB_DATA.length }, 'NGCB stats initialized');
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to initialize NGCB stats');
  }

  // GET /api/ngcb-stats - Get all NGCB stats
  fastify.get('/api/ngcb-stats', {
    schema: {
      description: 'Get all NGCB statistics',
      tags: ['ngcb'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              reportMonth: { type: 'string' },
              locationArea: { type: 'string' },
              denomination: { type: 'string' },
              avgRtpPercent: { type: 'string' },
              holdPercent: { type: 'string' },
              numMachines: { type: 'string' },
              notes: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              disclaimer: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (): Promise<any[]> => {
    app.logger.info({}, 'Fetching all NGCB stats');

    const results = await app.db.select().from(schema.ngcbStats);

    const formatted = results.map((stat) => ({
      id: stat.id,
      reportMonth: stat.reportMonth,
      locationArea: stat.locationArea,
      denomination: stat.denomination,
      avgRtpPercent: stat.avgRtpPercent,
      holdPercent: stat.holdPercent,
      numMachines: stat.numMachines,
      notes: stat.notes,
      createdAt: stat.createdAt,
      disclaimer: DISCLAIMER,
    }));

    app.logger.info({ count: formatted.length }, 'NGCB stats retrieved');
    return formatted;
  });

  // GET /api/ngcb-stats/latest - Get latest stats for area and denomination
  fastify.get('/api/ngcb-stats/latest', {
    schema: {
      description: 'Get latest NGCB statistics for specific area and denomination',
      tags: ['ngcb'],
      querystring: {
        type: 'object',
        properties: {
          area: { type: 'string', description: 'Location area (e.g., Las Vegas Strip)' },
          denomination: { type: 'string', description: 'Denomination (e.g., All, 1¢, 25¢)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            reportMonth: { type: 'string' },
            locationArea: { type: 'string' },
            denomination: { type: 'string' },
            avgRtpPercent: { type: 'string' },
            holdPercent: { type: 'string' },
            numMachines: { type: 'string' },
            notes: { type: ['string', 'null'] },
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
    request: FastifyRequest<{ Querystring: { area?: string; denomination?: string } }>,
    reply: FastifyReply
  ): Promise<any> => {
    let { area, denomination } = request.query as any;
    app.logger.info({ area, denomination }, 'Fetching latest NGCB stats');

    // Map common area names to database area names
    const areaMap: Record<string, string> = {
      'Strip': 'Las Vegas Strip',
      'Downtown': 'Downtown Las Vegas',
      'Boulder Strip': 'Boulder Strip',
      'Statewide': 'Statewide Nevada',
    };

    // Map denomination names
    const denomMap: Record<string, string> = {
      'penny': '1¢',
      'nickel': '5¢',
      'quarter': '25¢',
      'dollar': '$1',
      'all': 'All',
    };

    // Convert area name if needed
    if (area) {
      area = areaMap[area] || area;
    }

    // Convert denomination name if needed
    if (denomination) {
      denomination = denomMap[denomination.toLowerCase()] || denomination;
    }

    let results;

    // If both area and denomination provided, search for exact match
    if (area && denomination) {
      results = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(
          and(
            eq(schema.ngcbStats.locationArea, area),
            eq(schema.ngcbStats.denomination, denomination)
          )
        )
        .orderBy(desc(schema.ngcbStats.reportMonth))
        .limit(1);
    }
    // If only area provided
    else if (area && !denomination) {
      results = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.locationArea, area))
        .orderBy(desc(schema.ngcbStats.reportMonth))
        .limit(1);
    }
    // If only denomination provided
    else if (!area && denomination) {
      results = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.denomination, denomination))
        .orderBy(desc(schema.ngcbStats.reportMonth))
        .limit(1);
    }
    // If neither provided, get the absolute latest stat
    else {
      results = await app.db
        .select()
        .from(schema.ngcbStats)
        .orderBy(desc(schema.ngcbStats.reportMonth))
        .limit(1);
    }

    if (results.length === 0) {
      return reply.status(404).send({ error: 'No stats found' });
    }

    const stat = results[0];
    return {
      reportMonth: stat.reportMonth,
      locationArea: stat.locationArea,
      denomination: stat.denomination,
      avgRtpPercent: stat.avgRtpPercent,
      holdPercent: stat.holdPercent,
      numMachines: stat.numMachines,
      notes: stat.notes,
      disclaimer: DISCLAIMER,
    };
  });

  // GET /api/ngcb-stats/report/:month - Get stats for specific month
  fastify.get('/api/ngcb-stats/report/:month', {
    schema: {
      description: 'Get NGCB statistics for specific month (YYYY-MM format)',
      tags: ['ngcb'],
      params: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', description: 'Month in YYYY-MM format' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locationArea: { type: 'string' },
              denomination: { type: 'string' },
              avgRtpPercent: { type: 'string' },
              holdPercent: { type: 'string' },
              numMachines: { type: 'string' },
              notes: { type: ['string', 'null'] },
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
    request: FastifyRequest<{ Params: { month: string } }>,
    reply: FastifyReply
  ): Promise<any[]> => {
    const { month } = request.params;
    app.logger.info({ month }, 'Fetching NGCB stats for month');

    // Validate YYYY-MM format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return reply.status(400).send({ error: 'Month must be in YYYY-MM format' });
    }

    const results = await app.db
      .select()
      .from(schema.ngcbStats)
      .where(eq(schema.ngcbStats.reportMonth, month));

    const formatted = results.map((stat) => ({
      locationArea: stat.locationArea,
      denomination: stat.denomination,
      avgRtpPercent: stat.avgRtpPercent,
      holdPercent: stat.holdPercent,
      numMachines: stat.numMachines,
      notes: stat.notes,
    }));

    app.logger.info({ month, count: formatted.length }, 'NGCB stats for month retrieved');
    return formatted;
  });

  // GET /api/ngcb-stats/{area}/{denomination} - Legacy endpoint for NGCB stats
  fastify.get('/api/ngcb-stats/:area/:denomination', {
    schema: {
      description: 'Get NGCB statistics for specific area and denomination (legacy endpoint)',
      tags: ['ngcb'],
      params: {
        type: 'object',
        required: ['area', 'denomination'],
        properties: {
          area: { type: 'string', description: 'Gaming area (e.g., Strip, Downtown)' },
          denomination: { type: 'string', description: 'Denomination (e.g., penny, quarter, dollar)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            area: { type: 'string' },
            denomination: { type: 'string' },
            averagePayback: { type: 'number' },
            month: { type: 'string' },
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
    request: FastifyRequest<{ Params: { area: string; denomination: string } }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { area, denomination } = request.params;
    app.logger.info({ area, denomination }, 'Fetching legacy NGCB stats');

    // Map common area names to database area names
    const areaMap: Record<string, string> = {
      'Strip': 'Las Vegas Strip',
      'Downtown': 'Downtown Las Vegas',
      'Boulder Strip': 'Boulder Strip',
      'Statewide': 'Statewide Nevada',
    };

    const dbArea = areaMap[area] || area;

    // Map denomination names
    const denomMap: Record<string, string> = {
      'penny': '1¢',
      'nickel': '5¢',
      'quarter': '25¢',
      'dollar': '$1',
      'all': 'All',
    };

    const dbDenom = denomMap[denomination.toLowerCase()] || denomination;

    const results = await app.db
      .select()
      .from(schema.ngcbStats)
      .where(
        and(
          eq(schema.ngcbStats.locationArea, dbArea),
          eq(schema.ngcbStats.denomination, dbDenom)
        )
      )
      .orderBy(desc(schema.ngcbStats.reportMonth))
      .limit(1);

    if (results.length === 0) {
      return reply.status(404).send({ error: 'No stats found for this area and denomination' });
    }

    const stat = results[0];
    const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      area,
      denomination,
      averagePayback: parseFloat(stat.avgRtpPercent),
      month,
      disclaimer: DISCLAIMER,
    };
  });

  // POST /api/ngcb-stats - Create new NGCB stat (protected)
  fastify.post('/api/ngcb-stats', {
    schema: {
      description: 'Create new NGCB statistic entry (requires authentication)',
      tags: ['ngcb'],
      body: {
        type: 'object',
        required: ['reportMonth', 'locationArea', 'denomination', 'avgRtpPercent', 'holdPercent', 'numMachines'],
        properties: {
          reportMonth: { type: 'string' },
          locationArea: { type: 'string' },
          denomination: { type: 'string' },
          avgRtpPercent: { type: ['number', 'string'] },
          holdPercent: { type: ['number', 'string'] },
          numMachines: { type: ['number', 'string'] },
          notes: { type: ['string', 'null'] },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reportMonth: { type: 'string' },
            locationArea: { type: 'string' },
            denomination: { type: 'string' },
            avgRtpPercent: { type: 'string' },
            holdPercent: { type: 'string' },
            numMachines: { type: 'string' },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            disclaimer: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        reportMonth: string;
        locationArea: string;
        denomination: string;
        avgRtpPercent: number | string;
        holdPercent: number | string;
        numMachines: number | string;
        notes?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    // Check authentication
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info(
      { reportMonth: request.body.reportMonth, locationArea: request.body.locationArea },
      'Creating NGCB stat'
    );

    try {
      const { reportMonth, locationArea, denomination, avgRtpPercent, holdPercent, numMachines, notes } = request.body;

      const [result] = await app.db
        .insert(schema.ngcbStats)
        .values({
          reportMonth,
          locationArea,
          denomination,
          avgRtpPercent: String(avgRtpPercent),
          holdPercent: String(holdPercent),
          numMachines: String(numMachines),
          notes: notes || null,
        })
        .returning();

      app.logger.info({ id: result.id }, 'NGCB stat created');

      reply.status(201);
      return {
        id: result.id,
        reportMonth: result.reportMonth,
        locationArea: result.locationArea,
        denomination: result.denomination,
        avgRtpPercent: result.avgRtpPercent,
        holdPercent: result.holdPercent,
        numMachines: result.numMachines,
        notes: result.notes,
        createdAt: result.createdAt,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to create NGCB stat');
      throw error;
    }
  });

  // PUT /api/ngcb-stats/:id - Update NGCB stat (protected)
  fastify.put('/api/ngcb-stats/:id', {
    schema: {
      description: 'Update NGCB statistic entry (requires authentication)',
      tags: ['ngcb'],
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
          reportMonth: { type: 'string' },
          locationArea: { type: 'string' },
          denomination: { type: 'string' },
          avgRtpPercent: { type: ['number', 'string'] },
          holdPercent: { type: ['number', 'string'] },
          numMachines: { type: ['number', 'string'] },
          notes: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reportMonth: { type: 'string' },
            locationArea: { type: 'string' },
            denomination: { type: 'string' },
            avgRtpPercent: { type: 'string' },
            holdPercent: { type: 'string' },
            numMachines: { type: 'string' },
            notes: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            disclaimer: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
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
        reportMonth?: string;
        locationArea?: string;
        denomination?: string;
        avgRtpPercent?: number | string;
        holdPercent?: number | string;
        numMachines?: number | string;
        notes?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    // Check authentication
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ id }, 'Updating NGCB stat');

    try {
      const existing = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'NGCB stat not found' });
      }

      const updateData: any = {};
      if (request.body.reportMonth !== undefined) updateData.reportMonth = request.body.reportMonth;
      if (request.body.locationArea !== undefined) updateData.locationArea = request.body.locationArea;
      if (request.body.denomination !== undefined) updateData.denomination = request.body.denomination;
      if (request.body.avgRtpPercent !== undefined) updateData.avgRtpPercent = String(request.body.avgRtpPercent);
      if (request.body.holdPercent !== undefined) updateData.holdPercent = String(request.body.holdPercent);
      if (request.body.numMachines !== undefined) updateData.numMachines = String(request.body.numMachines);
      if (request.body.notes !== undefined) updateData.notes = request.body.notes;

      const [result] = await app.db
        .update(schema.ngcbStats)
        .set(updateData)
        .where(eq(schema.ngcbStats.id, id))
        .returning();

      app.logger.info({ id }, 'NGCB stat updated');

      return {
        id: result.id,
        reportMonth: result.reportMonth,
        locationArea: result.locationArea,
        denomination: result.denomination,
        avgRtpPercent: result.avgRtpPercent,
        holdPercent: result.holdPercent,
        numMachines: result.numMachines,
        notes: result.notes,
        createdAt: result.createdAt,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update NGCB stat');
      throw error;
    }
  });

  // DELETE /api/ngcb-stats/:id - Delete NGCB stat (protected)
  fastify.delete('/api/ngcb-stats/:id', {
    schema: {
      description: 'Delete NGCB statistic entry (requires authentication)',
      tags: ['ngcb'],
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
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
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
    // Check authentication
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ id }, 'Deleting NGCB stat');

    try {
      const existing = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.id, id))
        .limit(1);

      if (existing.length === 0) {
        return reply.status(404).send({ error: 'NGCB stat not found' });
      }

      await app.db.delete(schema.ngcbStats).where(eq(schema.ngcbStats.id, id));

      app.logger.info({ id }, 'NGCB stat deleted');

      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to delete NGCB stat');
      throw error;
    }
  });
}
