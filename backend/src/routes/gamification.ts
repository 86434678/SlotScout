import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, gte } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const DISCLAIMER = 'For entertainment & data sharing only. Play responsibly — this is not gambling advice.';

// Badge definitions
const BADGE_DEFINITIONS = [
  {
    name: 'Strip Scout',
    description: '10+ machines reported on the Strip',
    criteria: 'stripReports >= 10',
    icon: '🎰',
    points: 25,
  },
  {
    name: 'Downtown Detective',
    description: '10+ machines reported Downtown',
    criteria: 'downtownReports >= 10',
    icon: '🔍',
    points: 25,
  },
  {
    name: 'Aristocrat Expert',
    description: '25+ Aristocrat machines reported',
    criteria: 'aristocratReports >= 25',
    icon: '👑',
    points: 50,
  },
  {
    name: 'Daily Spotter',
    description: '7-day login streak',
    criteria: 'loginStreak >= 7',
    icon: '🔥',
    points: 30,
  },
  {
    name: 'Century Club',
    description: '100+ total machines reported',
    criteria: 'machinesReported >= 100',
    icon: '💯',
    points: 75,
  },
  {
    name: 'High Roller Reporter',
    description: 'Reported a win over $1000',
    criteria: 'highestWin > 1000',
    icon: '💎',
    points: 60,
  },
  {
    name: 'Casino Hopper',
    description: 'Reported machines at 5+ different casinos',
    criteria: 'casinosScouted >= 5',
    icon: '🏨',
    points: 40,
  },
  {
    name: 'Photo Pro',
    description: '50+ reports with photos',
    criteria: 'photoReports >= 50',
    icon: '📸',
    points: 45,
  },
];

// Helper function to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper function to check if user earned a badge
async function checkAndAwardBadges(
  app: App,
  userId: string,
  stats: {
    stripReports?: number;
    downtownReports?: number;
    aristocratReports?: number;
    loginStreak?: number;
    machinesReported?: number;
    highestWin?: number;
    casinosScouted?: number;
    photoReports?: number;
  }
): Promise<Array<{ badgeName: string; points: number }>> {
  const newBadges: Array<{ badgeName: string; points: number }> = [];

  for (const badge of BADGE_DEFINITIONS) {
    // Check if user already has this badge
    const [existing] = await app.db
      .select()
      .from(schema.userAchievements)
      .where(
        eq(schema.userAchievements.badgeName, badge.name) &&
          eq(schema.userAchievements.userId, userId)
      )
      .limit(1);

    if (existing) continue;

    let shouldAward = false;

    // Check badge criteria
    if (badge.name === 'Strip Scout' && (stats.stripReports || 0) >= 10) {
      shouldAward = true;
    } else if (badge.name === 'Downtown Detective' && (stats.downtownReports || 0) >= 10) {
      shouldAward = true;
    } else if (badge.name === 'Aristocrat Expert' && (stats.aristocratReports || 0) >= 25) {
      shouldAward = true;
    } else if (badge.name === 'Daily Spotter' && (stats.loginStreak || 0) >= 7) {
      shouldAward = true;
    } else if (badge.name === 'Century Club' && (stats.machinesReported || 0) >= 100) {
      shouldAward = true;
    } else if (badge.name === 'High Roller Reporter' && (stats.highestWin || 0) > 1000) {
      shouldAward = true;
    } else if (badge.name === 'Casino Hopper' && (stats.casinosScouted || 0) >= 5) {
      shouldAward = true;
    } else if (badge.name === 'Photo Pro' && (stats.photoReports || 0) >= 50) {
      shouldAward = true;
    }

    if (shouldAward) {
      await app.db
        .insert(schema.userAchievements)
        .values({
          userId,
          badgeName: badge.name,
          dateUnlocked: new Date(),
          points: badge.points,
        });

      newBadges.push({
        badgeName: badge.name,
        points: badge.points,
      });
    }
  }

  return newBadges;
}

export async function register(app: App, fastify: FastifyInstance) {
  // GET /api/gamification/badges - List all badge definitions
  fastify.get('/api/gamification/badges', {
    schema: {
      description: 'Get all available badge definitions',
      tags: ['gamification'],
      response: {
        200: {
          type: 'object',
          properties: {
            badges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  criteria: { type: 'string' },
                  icon: { type: 'string' },
                  points: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  }, async (): Promise<any> => {
    app.logger.info({}, 'Fetching badge definitions');
    return { badges: BADGE_DEFINITIONS };
  });

  // GET /api/gamification/user-achievements - Get user's earned badges (protected)
  fastify.get('/api/gamification/user-achievements', {
    schema: {
      description: 'Get user achievements (requires authentication)',
      tags: ['gamification'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              badgeName: { type: 'string' },
              dateUnlocked: { type: 'string', format: 'date-time' },
              points: { type: 'integer' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest): Promise<any> => {
    // Get user from session/auth
    const userId = 'user123'; // This would come from request.user in a real auth setup
    app.logger.info({ userId }, 'Fetching user achievements');

    const achievements = await app.db
      .select({
        id: schema.userAchievements.id,
        badgeName: schema.userAchievements.badgeName,
        dateUnlocked: schema.userAchievements.dateUnlocked,
        points: schema.userAchievements.points,
      })
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, userId))
      .orderBy(desc(schema.userAchievements.dateUnlocked));

    return achievements;
  });

  // GET /api/gamification/user-points - Get user's points summary (protected)
  fastify.get('/api/gamification/user-points', {
    schema: {
      description: 'Get user points and stats (requires authentication)',
      tags: ['gamification'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalPoints: { type: 'integer' },
            loginStreak: { type: 'integer' },
            machinesReported: { type: 'integer' },
            casinosScouted: { type: 'integer' },
            lastLoginDate: { type: ['string', 'null'], format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest): Promise<any> => {
    const userId = 'user123';
    app.logger.info({ userId }, 'Fetching user points');

    let [userPoints] = await app.db
      .select()
      .from(schema.userPoints)
      .where(eq(schema.userPoints.userId, userId))
      .limit(1);

    if (!userPoints) {
      [userPoints] = await app.db
        .insert(schema.userPoints)
        .values({
          userId,
          totalPoints: 0,
          loginStreak: 0,
          machinesReported: 0,
          casinosScouted: 0,
        })
        .returning();
    }

    return {
      totalPoints: userPoints.totalPoints,
      loginStreak: userPoints.loginStreak,
      machinesReported: userPoints.machinesReported,
      casinosScouted: userPoints.casinosScouted,
      lastLoginDate: userPoints.lastLoginDate,
    };
  });

  // POST /api/gamification/award-points - Award points for actions (protected)
  fastify.post('/api/gamification/award-points', {
    schema: {
      description: 'Award points for user actions (requires authentication)',
      tags: ['gamification'],
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['machine_report', 'big_win', 'daily_login'],
          },
          metadata: {
            type: 'object',
            properties: {
              winAmount: { type: 'number' },
              hasPhoto: { type: 'boolean' },
              casinoName: { type: 'string' },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            pointsAwarded: { type: 'integer' },
            newBadges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  badgeName: { type: 'string' },
                  points: { type: 'integer' },
                },
              },
            },
            totalPoints: { type: 'integer' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        action: 'machine_report' | 'big_win' | 'daily_login';
        metadata?: {
          winAmount?: number;
          hasPhoto?: boolean;
          casinoName?: string;
        };
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const userId = 'user123';
    const { action, metadata } = request.body;
    app.logger.info({ userId, action }, 'Awarding points');

    try {
      let pointsAwarded = 0;
      let machinesIncrement = 0;
      let casinosIncrement = 0;

      // Calculate points based on action
      if (action === 'machine_report') {
        pointsAwarded = metadata?.hasPhoto ? 10 : 5;
        machinesIncrement = 1;
      } else if (action === 'big_win') {
        pointsAwarded = 50;
      } else if (action === 'daily_login') {
        pointsAwarded = 5;
      }

      // Get or create user points
      let [userPoints] = await app.db
        .select()
        .from(schema.userPoints)
        .where(eq(schema.userPoints.userId, userId))
        .limit(1);

      if (!userPoints) {
        [userPoints] = await app.db
          .insert(schema.userPoints)
          .values({
            userId,
            totalPoints: pointsAwarded,
            machinesReported: machinesIncrement,
            casinosScouted: 0,
          })
          .returning();
      } else {
        // Update points
        const newTotal = (userPoints.totalPoints || 0) + pointsAwarded;
        const newMachinesReported = (userPoints.machinesReported || 0) + machinesIncrement;

        [userPoints] = await app.db
          .update(schema.userPoints)
          .set({
            totalPoints: newTotal,
            machinesReported: newMachinesReported,
            updatedAt: new Date(),
          })
          .where(eq(schema.userPoints.userId, userId))
          .returning();
      }

      // Check for new badges
      const newBadges = await checkAndAwardBadges(app, userId, {
        machinesReported: userPoints.machinesReported,
        photoReports: metadata?.hasPhoto ? 1 : 0,
      });

      app.logger.info({ userId, pointsAwarded }, 'Points awarded');
      return {
        pointsAwarded,
        newBadges,
        totalPoints: userPoints.totalPoints,
      };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to award points');
      throw error;
    }
  });

  // GET /api/gamification/leaderboards/:type - Get top 10 for current month
  fastify.get('/api/gamification/leaderboards/:type', {
    schema: {
      description: 'Get leaderboard for current month',
      tags: ['gamification'],
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['highest_win', 'machines_reported', 'casinos_scouted'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            leaderboard: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  photoUrl: { type: ['string', 'null'] },
                  score: { type: 'number' },
                  rank: { type: 'integer' },
                },
              },
            },
            month: { type: 'string' },
            disclaimer: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Params: { type: 'highest_win' | 'machines_reported' | 'casinos_scouted' };
    }>
  ): Promise<any> => {
    const { type } = request.params;
    const month = getCurrentMonth();
    app.logger.info({ type, month }, 'Fetching leaderboard');

    let entries = await app.db
      .select()
      .from(schema.monthlyLeaderboards)
      .where(eq(schema.monthlyLeaderboards.month, month));

    // Sort based on type and add rank
    let sorted = entries;
    if (type === 'highest_win') {
      sorted = entries.sort((a, b) => {
        const aWin = parseFloat(a.highestWin || '0');
        const bWin = parseFloat(b.highestWin || '0');
        return bWin - aWin;
      });
    } else if (type === 'machines_reported') {
      sorted = entries.sort((a, b) => (b.machinesReported || 0) - (a.machinesReported || 0));
    } else if (type === 'casinos_scouted') {
      sorted = entries.sort((a, b) => (b.casinosScouted || 0) - (a.casinosScouted || 0));
    }

    const leaderboard = sorted.slice(0, 10).map((entry, index) => {
      let score = 0;
      if (type === 'highest_win') {
        score = parseFloat(entry.highestWin || '0');
      } else if (type === 'machines_reported') {
        score = entry.machinesReported || 0;
      } else if (type === 'casinos_scouted') {
        score = entry.casinosScouted || 0;
      }

      return {
        userId: entry.userId,
        username: entry.username,
        photoUrl: entry.photoUrl,
        score,
        rank: index + 1,
      };
    });

    app.logger.info({ type, count: leaderboard.length }, 'Leaderboard retrieved');
    return {
      leaderboard,
      month,
      disclaimer: DISCLAIMER,
    };
  });

  // POST /api/gamification/update-leaderboard - Update user's leaderboard entry (protected)
  fastify.post('/api/gamification/update-leaderboard', {
    schema: {
      description: 'Update user leaderboard entry (requires authentication)',
      tags: ['gamification'],
      body: {
        type: 'object',
        required: ['type', 'value'],
        properties: {
          type: {
            type: 'string',
            enum: ['highest_win', 'machines_reported', 'casinos_scouted'],
          },
          value: { type: 'number' },
          photoProofUrl: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string' },
            score: { type: 'number' },
            rank: { type: 'integer' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Body: {
        type: 'highest_win' | 'machines_reported' | 'casinos_scouted';
        value: number;
        photoProofUrl?: string | null;
      };
    }>,
    reply: FastifyReply
  ): Promise<any> => {
    const userId = 'user123';
    const username = 'Player123';
    const { type, value, photoProofUrl } = request.body;
    const month = getCurrentMonth();

    app.logger.info({ userId, type, value, month }, 'Updating leaderboard');

    try {
      // For highest_win, require photo proof
      if (type === 'highest_win' && !photoProofUrl) {
        return reply.status(400).send({ error: 'Photo proof required for highest win entries' });
      }

      // Get or create leaderboard entry
      let [entry] = await app.db
        .select()
        .from(schema.monthlyLeaderboards)
        .where(
          eq(schema.monthlyLeaderboards.userId, userId) &&
            eq(schema.monthlyLeaderboards.month, month)
        )
        .limit(1);

      if (!entry) {
        const updateData: any = {
          userId,
          username,
          month,
          photoUrl: photoProofUrl || null,
        };

        if (type === 'highest_win') {
          updateData.highestWin = String(value);
        } else if (type === 'machines_reported') {
          updateData.machinesReported = value;
        } else if (type === 'casinos_scouted') {
          updateData.casinosScouted = value;
        }

        [entry] = await app.db
          .insert(schema.monthlyLeaderboards)
          .values(updateData)
          .returning();
      } else {
        // Update existing entry
        const updateData: any = { updatedAt: new Date() };

        if (type === 'highest_win') {
          const currentWin = parseFloat(entry.highestWin || '0');
          if (value > currentWin) {
            updateData.highestWin = String(value);
            updateData.photoUrl = photoProofUrl || entry.photoUrl;
          }
        } else if (type === 'machines_reported') {
          updateData.machinesReported = Math.max(entry.machinesReported || 0, value);
        } else if (type === 'casinos_scouted') {
          updateData.casinosScouted = Math.max(entry.casinosScouted || 0, value);
        }

        [entry] = await app.db
          .update(schema.monthlyLeaderboards)
          .set(updateData)
          .where(
            eq(schema.monthlyLeaderboards.userId, userId) &&
              eq(schema.monthlyLeaderboards.month, month)
          )
          .returning();
      }

      // Get current rank
      const allEntries = await app.db
        .select()
        .from(schema.monthlyLeaderboards)
        .where(eq(schema.monthlyLeaderboards.month, month));

      let rank = 1;
      if (type === 'highest_win') {
        const sorted = allEntries.sort((a, b) => {
          const aWin = parseFloat(a.highestWin || '0');
          const bWin = parseFloat(b.highestWin || '0');
          return bWin - aWin;
        });
        rank = sorted.findIndex((e) => e.userId === userId) + 1;
      } else if (type === 'machines_reported') {
        const sorted = allEntries.sort((a, b) => (b.machinesReported || 0) - (a.machinesReported || 0));
        rank = sorted.findIndex((e) => e.userId === userId) + 1;
      } else if (type === 'casinos_scouted') {
        const sorted = allEntries.sort((a, b) => (b.casinosScouted || 0) - (a.casinosScouted || 0));
        rank = sorted.findIndex((e) => e.userId === userId) + 1;
      }

      let score = 0;
      if (type === 'highest_win') {
        score = parseFloat(entry.highestWin || '0');
      } else if (type === 'machines_reported') {
        score = entry.machinesReported || 0;
      } else if (type === 'casinos_scouted') {
        score = entry.casinosScouted || 0;
      }

      app.logger.info({ userId, type, rank }, 'Leaderboard updated');
      return {
        userId: entry.userId,
        username: entry.username,
        score,
        rank,
      };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to update leaderboard');
      throw error;
    }
  });
}
