import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, gt, sql } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const MAP_DISCLAIMER = 'Machine locations are community-reported and may not be 100% accurate. Always verify with casino staff.';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/map/machines - Get all reported machines with location data
  fastify.get('/api/map/machines', {
    schema: {
      description: 'Get all reported machines with location data for map display',
      tags: ['map'],
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
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  photoUrl: { type: ['string', 'null'] },
                  notes: { type: ['string', 'null'] },
                },
              },
            },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    app.logger.info({}, 'Fetching all machines with location data for map');

    try {
      const machines = await app.db
        .select({
          id: schema.casinoMachines.id,
          casinoName: schema.casinoMachines.casinoName,
          brand: schema.casinoMachines.brand,
          gameTitle: schema.casinoMachines.gameTitle,
          denom: schema.casinoMachines.denom,
          latitude: schema.casinoMachines.latitude,
          longitude: schema.casinoMachines.longitude,
          lastSeen: schema.casinoMachines.lastSeen,
          photoUrl: schema.casinoMachines.photoUrl,
          notes: schema.casinoMachines.notes,
        })
        .from(schema.casinoMachines)
        .where(and(
          sql`${schema.casinoMachines.latitude} IS NOT NULL`,
          sql`${schema.casinoMachines.longitude} IS NOT NULL`
        ))
        .orderBy(desc(schema.casinoMachines.lastSeen));

      // Convert decimal to number for lat/long
      const machinesWithNumbers = machines.map((machine) => ({
        ...machine,
        latitude: machine.latitude ? Number(machine.latitude) : null,
        longitude: machine.longitude ? Number(machine.longitude) : null,
      }));

      app.logger.info({ count: machinesWithNumbers.length }, 'Machines with location data retrieved');

      return {
        machines: machinesWithNumbers,
        disclaimer: MAP_DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch machines with location data');
      throw error;
    }
  });

  // GET /api/map/machines/recent - Get machines reported in last N days
  fastify.get('/api/map/machines/recent', {
    schema: {
      description: 'Get machines reported in the last N days',
      tags: ['map'],
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 30, description: 'Number of days to look back' },
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
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  photoUrl: { type: ['string', 'null'] },
                  notes: { type: ['string', 'null'] },
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
      Querystring: {
        days?: number;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const { days = 30 } = request.query;
    app.logger.info({ days }, 'Fetching recent machines with location data');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const machines = await app.db
        .select({
          id: schema.casinoMachines.id,
          casinoName: schema.casinoMachines.casinoName,
          brand: schema.casinoMachines.brand,
          gameTitle: schema.casinoMachines.gameTitle,
          denom: schema.casinoMachines.denom,
          latitude: schema.casinoMachines.latitude,
          longitude: schema.casinoMachines.longitude,
          lastSeen: schema.casinoMachines.lastSeen,
          photoUrl: schema.casinoMachines.photoUrl,
          notes: schema.casinoMachines.notes,
        })
        .from(schema.casinoMachines)
        .where(and(
          gt(schema.casinoMachines.lastSeen, cutoffDate),
          sql`${schema.casinoMachines.latitude} IS NOT NULL`,
          sql`${schema.casinoMachines.longitude} IS NOT NULL`
        ))
        .orderBy(desc(schema.casinoMachines.lastSeen));

      // Convert decimal to number for lat/long
      const machinesWithNumbers = machines.map((machine) => ({
        ...machine,
        latitude: machine.latitude ? Number(machine.latitude) : null,
        longitude: machine.longitude ? Number(machine.longitude) : null,
      }));

      app.logger.info({ count: machinesWithNumbers.length, days }, 'Recent machines with location data retrieved');

      return {
        machines: machinesWithNumbers,
        disclaimer: MAP_DISCLAIMER,
      };
    } catch (error) {
      app.logger.error({ err: error, days }, 'Failed to fetch recent machines with location data');
      throw error;
    }
  });

  // GET /api/map/casinos - Get all casinos with their coordinates
  fastify.get('/api/map/casinos', {
    schema: {
      description: 'Get all casinos with their coordinates for map markers',
      tags: ['map'],
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
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  area: { type: ['string', 'null'] },
                  reportedCount: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    app.logger.info({}, 'Fetching all casinos with coordinates');

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

      // Convert decimal to number for lat/long
      const casinosWithNumbers = casinos.map((casino) => ({
        ...casino,
        latitude: casino.latitude ? Number(casino.latitude) : 0,
        longitude: casino.longitude ? Number(casino.longitude) : 0,
        reportedCount: casino.reportedCount || 0,
      }));

      app.logger.info({ count: casinosWithNumbers.length }, 'Casinos with coordinates retrieved');

      return {
        casinos: casinosWithNumbers,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch casinos with coordinates');
      throw error;
    }
  });
}
