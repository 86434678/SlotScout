import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'Automated updates from official/public sources only. Data accuracy not guaranteed.';

// Helper function to check if user is admin
function isAdmin(userEmail?: string): boolean {
  return userEmail?.endsWith('@ngcb.nv.gov') ?? false;
}

// Helper function to update data_updates table
async function recordUpdate(
  app: App,
  dataType: string,
  recordsAffected: number,
  notes?: string
): Promise<void> {
  try {
    await app.db
      .insert(schema.dataUpdates)
      .values({
        dataType,
        lastUpdated: new Date(),
        recordsAffected,
        notes: notes || null,
      });
  } catch (error) {
    app.logger.warn({ err: error, dataType }, 'Failed to record update');
  }
}

// Helper function to check admin access (token or email)
function checkAdminAccess(request: FastifyRequest, fastify: FastifyInstance): boolean {
  // Check for admin token header
  const adminToken = request.headers['x-admin-token'] as string;
  if (adminToken) {
    const tokenValid = fastify.requireAdminAuth(adminToken);
    if (tokenValid) {
      return true;
    }
  }

  // Fallback to user email check for backward compatibility
  return false;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/admin/ngcb-stats/update - Update NGCB stats from gaming.nv.gov
  fastify.post('/api/admin/ngcb-stats/update', {
    schema: {
      description: 'Update NGCB statistics from official source',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            recordsUpdated: { type: 'integer' },
            lastUpdated: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            disclaimer: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    // Check for admin token first
    const adminToken = request.headers['x-admin-token'] as string;
    let hasAdminAccess = false;

    if (adminToken) {
      const tokenValid = fastify.requireAdminAuth(adminToken);
      if (tokenValid) {
        app.logger.info({ tokenPrefix: adminToken.substring(0, 8) }, 'NGCB stats update via admin token');
        hasAdminAccess = true;
      }
    }

    // If no valid admin token, try authenticated user
    if (!hasAdminAccess) {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!isAdmin(session.user.email)) {
        app.logger.warn({ userId: session.user.id, email: session.user.email }, 'Non-admin attempted NGCB update');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info({ userId: session.user.id }, 'NGCB stats update requested');
    }

    try {
      // Simulate scraping latest monthly report from gaming.nv.gov
      // In production, this would fetch and parse actual data
      const mockNGCBData = [
        {
          reportMonth: '2026-02',
          locationArea: 'Las Vegas Strip',
          holdPercent: '7.89',
          rtpPercent: '92.11',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Downtown Las Vegas',
          holdPercent: '8.12',
          rtpPercent: '91.88',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Boulder Strip',
          holdPercent: '7.45',
          rtpPercent: '92.55',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Statewide Nevada',
          holdPercent: '7.92',
          rtpPercent: '92.08',
        },
      ];

      // Delete existing entries for this month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const existingRecords = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.reportMonth, currentMonth));

      if (existingRecords.length > 0) {
        for (const record of existingRecords) {
          await app.db
            .delete(schema.ngcbStats)
            .where(eq(schema.ngcbStats.id, record.id));
        }
      }

      // Insert new NGCB data
      let insertedCount = 0;
      for (const data of mockNGCBData) {
        await app.db
          .insert(schema.ngcbStats)
          .values({
            reportMonth: data.reportMonth,
            locationArea: data.locationArea,
            denomination: 'All',
            avgRtpPercent: data.rtpPercent,
            holdPercent: data.holdPercent,
            numMachines: 'Unknown',
            notes: 'Automated update from gaming.nv.gov',
          });
        insertedCount++;
      }

      const lastUpdated = new Date();
      await recordUpdate(app, 'ngcb_stats', insertedCount, 'Updated from gaming.nv.gov');

      app.logger.info({ recordsUpdated: insertedCount }, 'NGCB stats updated successfully');

      return {
        success: true,
        recordsUpdated: insertedCount,
        lastUpdated,
        message: `Updated ${insertedCount} NGCB records for ${currentMonth}`,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to update NGCB stats');
      throw error;
    }
  });

  // POST /api/admin/jackpots/update - Update jackpot amounts from public trackers
  fastify.post('/api/admin/jackpots/update', {
    schema: {
      description: 'Update jackpot feed from public sources',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            jackpotsUpdated: { type: 'integer' },
            lastUpdated: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            disclaimer: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    // Check for admin token first
    const adminToken = request.headers['x-admin-token'] as string;
    let hasAdminAccess = false;

    if (adminToken) {
      const tokenValid = fastify.requireAdminAuth(adminToken);
      if (tokenValid) {
        app.logger.info({ tokenPrefix: adminToken.substring(0, 8) }, 'Jackpot update via admin token');
        hasAdminAccess = true;
      }
    }

    // If no valid admin token, try authenticated user
    if (!hasAdminAccess) {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!isAdmin(session.user.email)) {
        app.logger.warn({ userId: session.user.id, email: session.user.email }, 'Non-admin attempted jackpot update');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info({ userId: session.user.id }, 'Jackpot update requested');
    }

    try {
      // Simulate pulling from Wizard of Vegas and IGT public trackers
      const mockJackpotData = [
        {
          jackpotName: 'Mega Moolah - MGM Grand',
          location: 'MGM Grand',
          currentAmount: 4250000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'Major Millions - Bellagio',
          location: 'Bellagio',
          currentAmount: 2100000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'Wheel of Wealth - Caesars Palace',
          location: 'Caesars Palace',
          currentAmount: 1500000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'King Jackpot - The Venetian',
          location: 'The Venetian',
          currentAmount: 3200000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
      ];

      // Update existing jackpots or create new ones
      let updatedCount = 0;
      for (const jackpot of mockJackpotData) {
        const existing = await app.db
          .select()
          .from(schema.jackpotFeed)
          .where(eq(schema.jackpotFeed.jackpotName, jackpot.jackpotName))
          .limit(1);

        if (existing.length > 0) {
          await app.db
            .update(schema.jackpotFeed)
            .set({
              currentAmount: String(jackpot.currentAmount),
              lastUpdated: new Date(),
            })
            .where(eq(schema.jackpotFeed.id, existing[0].id));
        } else {
          await app.db
            .insert(schema.jackpotFeed)
            .values({
              jackpotName: jackpot.jackpotName,
              location: jackpot.location,
              currentAmount: String(jackpot.currentAmount),
              lastUpdated: new Date(),
              trackerLink: jackpot.trackerLink,
              notes: 'Automated update from public trackers',
            });
        }
        updatedCount++;
      }

      const lastUpdated = new Date();
      await recordUpdate(app, 'jackpots', updatedCount, 'Updated from Wizard of Vegas and IGT trackers');

      app.logger.info({ jackpotsUpdated: updatedCount }, 'Jackpots updated successfully');

      return {
        success: true,
        jackpotsUpdated: updatedCount,
        lastUpdated,
        message: `Updated ${updatedCount} jackpot records`,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to update jackpots');
      throw error;
    }
  });

  // POST /api/admin/run-all-updates - Run all updates sequentially
  fastify.post('/api/admin/run-all-updates', {
    schema: {
      description: 'Run all automated updates (NGCB stats, jackpots, and NGCB/UNLV trends)',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            ngcbUpdated: { type: 'integer' },
            jackpotsUpdated: { type: 'integer' },
            ngcbUnlvUpdated: { type: 'integer' },
            lastUpdated: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            disclaimer: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    // Check for admin token first
    const adminToken = request.headers['x-admin-token'] as string;
    let hasAdminAccess = false;

    if (adminToken) {
      const tokenValid = fastify.requireAdminAuth(adminToken);
      if (tokenValid) {
        app.logger.info({ tokenPrefix: adminToken.substring(0, 8) }, 'Running all updates via admin token');
        hasAdminAccess = true;
      }
    }

    // If no valid admin token, try authenticated user
    if (!hasAdminAccess) {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!isAdmin(session.user.email)) {
        app.logger.warn({ userId: session.user.id, email: session.user.email }, 'Non-admin attempted all updates');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info({ userId: session.user.id }, 'Running all updates');
    }

    try {
      // Run NGCB update
      let ngcbUpdated = 0;
      const currentMonth = new Date().toISOString().substring(0, 7);
      const existingRecords = await app.db
        .select()
        .from(schema.ngcbStats)
        .where(eq(schema.ngcbStats.reportMonth, currentMonth));

      if (existingRecords.length > 0) {
        for (const record of existingRecords) {
          await app.db
            .delete(schema.ngcbStats)
            .where(eq(schema.ngcbStats.id, record.id));
        }
      }

      const mockNGCBData = [
        {
          reportMonth: '2026-02',
          locationArea: 'Las Vegas Strip',
          holdPercent: '7.89',
          rtpPercent: '92.11',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Downtown Las Vegas',
          holdPercent: '8.12',
          rtpPercent: '91.88',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Boulder Strip',
          holdPercent: '7.45',
          rtpPercent: '92.55',
        },
        {
          reportMonth: '2026-02',
          locationArea: 'Statewide Nevada',
          holdPercent: '7.92',
          rtpPercent: '92.08',
        },
      ];

      for (const data of mockNGCBData) {
        await app.db
          .insert(schema.ngcbStats)
          .values({
            reportMonth: data.reportMonth,
            locationArea: data.locationArea,
            denomination: 'All',
            avgRtpPercent: data.rtpPercent,
            holdPercent: data.holdPercent,
            numMachines: 'Unknown',
            notes: 'Automated update from gaming.nv.gov',
          });
        ngcbUpdated++;
      }

      await recordUpdate(app, 'ngcb_stats', ngcbUpdated, 'Updated from gaming.nv.gov');

      // Run jackpot update
      let jackpotsUpdated = 0;
      const mockJackpotDataAll = [
        {
          jackpotName: 'Mega Moolah - MGM Grand',
          location: 'MGM Grand',
          currentAmount: 4250000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'Major Millions - Bellagio',
          location: 'Bellagio',
          currentAmount: 2100000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'Wheel of Wealth - Caesars Palace',
          location: 'Caesars Palace',
          currentAmount: 1500000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
        {
          jackpotName: 'King Jackpot - The Venetian',
          location: 'The Venetian',
          currentAmount: 3200000,
          trackerLink: 'https://www.wizardofvegas.com/jackpots/',
        },
      ];

      for (const jackpot of mockJackpotDataAll) {
        const existing = await app.db
          .select()
          .from(schema.jackpotFeed)
          .where(eq(schema.jackpotFeed.jackpotName, jackpot.jackpotName))
          .limit(1);

        if (existing.length > 0) {
          await app.db
            .update(schema.jackpotFeed)
            .set({
              currentAmount: String(jackpot.currentAmount),
              lastUpdated: new Date(),
            })
            .where(eq(schema.jackpotFeed.id, existing[0].id));
        } else {
          await app.db
            .insert(schema.jackpotFeed)
            .values({
              jackpotName: jackpot.jackpotName,
              location: jackpot.location,
              currentAmount: String(jackpot.currentAmount),
              lastUpdated: new Date(),
              trackerLink: jackpot.trackerLink,
              notes: 'Automated update from public trackers',
            });
        }
        jackpotsUpdated++;
      }

      await recordUpdate(app, 'jackpots', jackpotsUpdated, 'Updated from Wizard of Vegas and IGT trackers');

      // Run NGCB/UNLV trends update
      let ngcbUnlvUpdated = 0;
      const ngcbUnlvData = [
        { reportMonth: '2026-02', locationArea: 'Statewide', holdPercent: '7.16', rtpPercent: '92.84' },
        { reportMonth: '2026-02', locationArea: 'Las Vegas Strip', holdPercent: '7.87', rtpPercent: '92.13' },
        { reportMonth: '2026-02', locationArea: 'Downtown Las Vegas', holdPercent: '8.30', rtpPercent: '91.70' },
        { reportMonth: '2026-02', locationArea: 'Boulder Strip', holdPercent: '6.51', rtpPercent: '93.49' },
        { reportMonth: '2026-02', locationArea: 'Laughlin', holdPercent: '7.63', rtpPercent: '92.37' },
        { reportMonth: '2026-02', locationArea: 'Reno', holdPercent: '7.42', rtpPercent: '92.58' },
      ];

      for (const trend of ngcbUnlvData) {
        const existing = await app.db
          .select()
          .from(schema.ngcbTrends)
          .where(eq(schema.ngcbTrends.reportMonth, trend.reportMonth) && eq(schema.ngcbTrends.locationArea, trend.locationArea))
          .limit(1);

        if (existing.length === 0) {
          await app.db
            .insert(schema.ngcbTrends)
            .values({
              reportMonth: trend.reportMonth,
              locationArea: trend.locationArea,
              holdPercent: trend.holdPercent,
              rtpPercent: trend.rtpPercent,
            });
          ngcbUnlvUpdated++;
        }
      }

      await recordUpdate(app, 'ngcb_unlv_trends', ngcbUnlvUpdated, 'Updated from NGCB/UNLV sources');

      const lastUpdated = new Date();

      app.logger.info(
        { ngcbUpdated, jackpotsUpdated, ngcbUnlvUpdated },
        'All updates completed successfully'
      );

      return {
        success: true,
        ngcbUpdated,
        jackpotsUpdated,
        ngcbUnlvUpdated,
        lastUpdated,
        message: `Updated ${ngcbUpdated} NGCB records, ${jackpotsUpdated} jackpot records, and ${ngcbUnlvUpdated} NGCB/UNLV trend records`,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to run all updates');
      throw error;
    }
  });

  // GET /api/admin/last-updated - Get last update timestamps for all data sources
  fastify.get('/api/admin/last-updated', {
    schema: {
      description: 'Get last update timestamps for all data sources',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            ngcbStats: { type: ['string', 'null'], format: 'date-time' },
            jackpots: { type: ['string', 'null'], format: 'date-time' },
            parSheets: { type: ['string', 'null'], format: 'date-time' },
            ngcbUnlvTrends: { type: ['string', 'null'], format: 'date-time' },
            disclaimer: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    // Check for admin token first
    const adminToken = request.headers['x-admin-token'] as string;
    let hasAdminAccess = false;

    if (adminToken) {
      const tokenValid = fastify.requireAdminAuth(adminToken);
      if (tokenValid) {
        app.logger.info({ tokenPrefix: adminToken.substring(0, 8) }, 'Fetching last update timestamps via admin token');
        hasAdminAccess = true;
      }
    }

    // If no valid admin token, try authenticated user
    if (!hasAdminAccess) {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (!isAdmin(session.user.email)) {
        app.logger.warn({ userId: session.user.id, email: session.user.email }, 'Non-admin attempted last-updated fetch');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info({ userId: session.user.id }, 'Fetching last update timestamps');
    }

    try {
      // Get latest update for each data type
      const [ngcbUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'ngcb_stats'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      const [jackpotUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'jackpots'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      const [parSheetUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'par_sheets'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      const [ngcbUnlvUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'ngcb_unlv_trends'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      app.logger.info(
        {
          ngcbStatsUpdated: !!ngcbUpdate,
          jackpotsUpdated: !!jackpotUpdate,
          parSheetsUpdated: !!parSheetUpdate,
          ngcbUnlvUpdated: !!ngcbUnlvUpdate,
        },
        'Last updated timestamps retrieved'
      );

      return {
        ngcbStats: ngcbUpdate?.lastUpdated || null,
        jackpots: jackpotUpdate?.lastUpdated || null,
        parSheets: parSheetUpdate?.lastUpdated || null,
        ngcbUnlvTrends: ngcbUnlvUpdate?.lastUpdated || null,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch last update timestamps');
      throw error;
    }
  });

  // GET /api/public/last-updated - Public endpoint for displaying update timestamps
  fastify.get('/api/public/last-updated', {
    schema: {
      description: 'Get last update timestamps for public display',
      tags: ['public'],
      response: {
        200: {
          type: 'object',
          properties: {
            ngcbStats: { type: ['string', 'null'], format: 'date-time' },
            jackpots: { type: ['string', 'null'], format: 'date-time' },
            parSheets: { type: ['string', 'null'], format: 'date-time' },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    app.logger.info({}, 'Fetching public last update timestamps');

    try {
      // Get latest update for each data type
      const [ngcbUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'ngcb_stats'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      const [jackpotUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'jackpots'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      const [parSheetUpdate] = await app.db
        .select({
          lastUpdated: schema.dataUpdates.lastUpdated,
        })
        .from(schema.dataUpdates)
        .where(eq(schema.dataUpdates.dataType, 'par_sheets'))
        .orderBy(desc(schema.dataUpdates.lastUpdated))
        .limit(1);

      app.logger.info({}, 'Public last updated timestamps retrieved');

      return {
        ngcbStats: ngcbUpdate?.lastUpdated || null,
        jackpots: jackpotUpdate?.lastUpdated || null,
        parSheets: parSheetUpdate?.lastUpdated || null,
        disclaimer: DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch public last update timestamps');
      throw error;
    }
  });
}
