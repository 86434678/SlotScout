import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

const LEARN_ARTICLES = [
  {
    title: 'Understanding Hold Percentage',
    content: 'Hold percentage is the percentage of money wagered that a casino keeps as profit. It\'s calculated by dividing the casino\'s win by total wagering and multiplying by 100. Higher hold % means better odds for the casino, lower hold % is better for players. Nevada slot machines average around 7.5% hold.',
    category: 'hold_pct',
    difficulty: 'beginner',
    source: 'Nevada Gaming Control Board',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'What is RTP (Return to Player)?',
    content: 'RTP is the percentage of all wagered money that a slot machine is programmed to return to players over time. For example, a 95% RTP slot means that over a very long time period, players should expect to get back $95 for every $100 wagered. The remaining 5% is the house edge. Individual sessions can vary wildly from this average.',
    category: 'rtp',
    difficulty: 'beginner',
    source: 'Nevada Gaming Control Board',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Volatility Explained: Low vs High Variance Slots',
    content: 'Volatility (or variance) measures how much a slot\'s payouts fluctuate. Low volatility slots pay out smaller amounts more frequently, providing steadier gameplay. High volatility slots have fewer, larger payouts and longer dry spells. Choose low volatility for longer playtime on a budget, high volatility if you\'re chasing big wins.',
    category: 'volatility',
    difficulty: 'beginner',
    source: 'Slot Machine Design Principles',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Myth: Machines Are "Hot" or "Cold"',
    content: 'MYTH: Some slots are "hot" (about to pay out big) or "cold" (not paying). FACT: Each spin is independent. A machine that just paid a jackpot has exactly the same odds on the next spin as one that hasn\'t paid in weeks. Past results don\'t influence future spins. The casino can\'t program machines to cycle between wins and losses.',
    category: 'myths',
    difficulty: 'beginner',
    source: 'Gaming Research Center',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Myth: Betting Max Coins Improves Your Odds',
    content: 'MYTH: Betting max coins gives you better odds of winning. FACT: Max bet typically only unlocks bonus multipliers on specific winning combinations, not overall odds. The RTP is the same regardless of bet size. Bet what you can afford to lose, not what you think will help you win.',
    category: 'myths',
    difficulty: 'beginner',
    source: 'Gaming Research Center',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'How Slot Machine RNG Works',
    content: 'Slots use Random Number Generators (RNG) - computer algorithms that produce unpredictable sequences. The RNG generates thousands of number combinations per second. When you press spin, you\'re just capturing the current output. The result is determined instantly, not by the reels spinning. This ensures every spin is truly random and cannot be predicted.',
    category: 'slot_basics',
    difficulty: 'intermediate',
    source: 'Nevada Gaming Commission',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Understanding Paylines and Winning Combinations',
    content: 'Modern slots have multiple paylines - the patterns in which matching symbols create wins. Classic 3-reel machines have 1-3 paylines. Modern video slots have 5, 9, 15, 25, or more paylines. More paylines = more ways to win, but also typically requires higher bets to activate all lines. Always check the pay table to understand how winning combinations work.',
    category: 'slot_basics',
    difficulty: 'beginner',
    source: 'Slot Machine Design Principles',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Responsible Gambling: Setting Limits',
    content: 'Set a budget before you gamble and stick to it. Decide how much money you can afford to lose, not how much you hope to win. Set time limits too - it\'s easy to lose track of time while playing. Never gamble to recover losses or with money meant for bills, rent, or essentials. If you feel you\'re losing control, seek help.',
    category: 'responsible_play',
    difficulty: 'beginner',
    source: '1-800-GAMBLER',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Signs of Problem Gambling',
    content: 'Warning signs include: gambling more than intended, thinking about gambling constantly, needing to gamble with increasing amounts for excitement, feeling anxious when not gambling, using gambling to escape problems, lying about gambling, losing relationships due to gambling, or having financial problems from gambling. If you recognize these signs, professional help is available.',
    category: 'responsible_play',
    difficulty: 'beginner',
    source: '1-800-GAMBLER / NCPG',
    relatedGameTypes: ['all_slots'],
  },
  {
    title: 'Know When to Walk Away',
    content: 'Set win and loss limits before you start playing. Decide: "I\'ll stop when I\'ve won $X" or "I\'ll stop when I\'ve lost $Y". Stick to these limits religiously. Winning streaks end. Chasing losses is the fastest way to lose more money. The house always has a mathematical edge. The only guaranteed win is quitting while ahead.',
    category: 'responsible_play',
    difficulty: 'beginner',
    source: '1-800-GAMBLER',
    relatedGameTypes: ['all_slots'],
  },
];

export async function register(app: App, fastify: FastifyInstance) {
  // Pre-populate learning articles
  const existingArticles = await app.db
    .select()
    .from(schema.learnArticles)
    .limit(1);

  if (existingArticles.length === 0) {
    app.logger.info({}, 'Initializing learn articles with seed data');

    for (const article of LEARN_ARTICLES) {
      await app.db
        .insert(schema.learnArticles)
        .values({
          title: article.title,
          content: article.content,
          category: article.category,
          difficulty: article.difficulty,
          source: article.source,
          relatedGameTypes: article.relatedGameTypes ? JSON.stringify(article.relatedGameTypes) : null,
          isActive: true,
        });
    }

    app.logger.info({ count: LEARN_ARTICLES.length }, 'Learn articles initialized');
  }

  // GET /api/learn/articles - List all learn articles
  fastify.get('/api/learn/articles', {
    schema: {
      description: 'Get educational articles about slot mechanics and responsible gambling',
      tags: ['learn'],
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['slot_basics', 'hold_pct', 'rtp', 'volatility', 'myths', 'responsible_play'],
            description: 'Filter by category',
          },
          difficulty: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            description: 'Filter by difficulty level',
          },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              category: { type: 'string' },
              difficulty: { type: 'string' },
              source: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Querystring: { category?: string; difficulty?: string };
    }>,
  ): Promise<any[]> => {
    const { category, difficulty } = request.query as any;
    app.logger.info({ category, difficulty }, 'Fetching learn articles');

    const filters = [];
    filters.push(eq(schema.learnArticles.isActive, true));

    if (category) {
      filters.push(eq(schema.learnArticles.category, category));
    }
    if (difficulty) {
      filters.push(eq(schema.learnArticles.difficulty, difficulty));
    }

    const whereCondition = filters.length > 0 ? filters : undefined;

    const articles = await app.db
      .select({
        id: schema.learnArticles.id,
        title: schema.learnArticles.title,
        content: schema.learnArticles.content,
        category: schema.learnArticles.category,
        difficulty: schema.learnArticles.difficulty,
        source: schema.learnArticles.source,
        createdAt: schema.learnArticles.createdAt,
      })
      .from(schema.learnArticles)
      .where(filters.length > 0 ? filters[0] : undefined)
      .orderBy(desc(schema.learnArticles.createdAt));

    app.logger.info({ count: articles.length }, 'Learn articles retrieved');
    return articles;
  });

  // GET /api/learn/articles/:id - Get specific learn article
  fastify.get('/api/learn/articles/:id', {
    schema: {
      description: 'Get a specific learning article by ID',
      tags: ['learn'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Article ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            difficulty: { type: 'string' },
            source: { type: ['string', 'null'] },
            relatedGameTypes: {
              type: ['array', 'null'],
              items: { type: 'string' },
            },
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
    }>,
    reply: FastifyReply,
  ): Promise<any> => {
    const { id } = request.params;
    app.logger.info({ articleId: id }, 'Fetching learn article');

    const [article] = await app.db
      .select({
        id: schema.learnArticles.id,
        title: schema.learnArticles.title,
        content: schema.learnArticles.content,
        category: schema.learnArticles.category,
        difficulty: schema.learnArticles.difficulty,
        source: schema.learnArticles.source,
        relatedGameTypes: schema.learnArticles.relatedGameTypes,
        createdAt: schema.learnArticles.createdAt,
      })
      .from(schema.learnArticles)
      .where(eq(schema.learnArticles.id, id))
      .limit(1);

    if (!article) {
      app.logger.warn({ articleId: id }, 'Article not found');
      return reply.status(404).send({ error: 'Article not found' });
    }

    const result = {
      ...article,
      relatedGameTypes: article.relatedGameTypes ? JSON.parse(article.relatedGameTypes) : null,
    };

    app.logger.info({ articleId: id }, 'Learn article retrieved');
    return result;
  });

  // GET /api/learn/random - Get 2-3 random learning tips
  fastify.get('/api/learn/random', {
    schema: {
      description: 'Get random learning articles for tips/education',
      tags: ['learn'],
      querystring: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Number of random articles (default 2)',
          },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              category: { type: 'string' },
              difficulty: { type: 'string' },
              source: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{
      Querystring: { count?: number };
    }>,
  ): Promise<any[]> => {
    const { count = 2 } = request.query as any;
    app.logger.info({ count }, 'Fetching random learn articles');

    const articles = await app.db
      .select({
        id: schema.learnArticles.id,
        title: schema.learnArticles.title,
        content: schema.learnArticles.content,
        category: schema.learnArticles.category,
        difficulty: schema.learnArticles.difficulty,
        source: schema.learnArticles.source,
        createdAt: schema.learnArticles.createdAt,
      })
      .from(schema.learnArticles)
      .where(eq(schema.learnArticles.isActive, true));

    // Randomly shuffle and select
    const shuffled = articles.sort(() => Math.random() - 0.5).slice(0, Math.min(count, articles.length));

    app.logger.info({ count: shuffled.length }, 'Random learn articles retrieved');
    return shuffled;
  });
}
