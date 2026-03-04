import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';

// Import route registration functions
import * as slotsRoutes from './routes/slots.js';
import * as setupRoutes from './routes/setup.js';
import * as slotMachinesRoutes from './routes/slot-machines.js';
import * as ngcbRoutes from './routes/ngcb.js';
import * as parSheetsRoutes from './routes/par-sheets.js';
import * as jackpotFeedRoutes from './routes/jackpot-feed.js';
import * as casinoSlotMachinesRoutes from './routes/casino-slot-machines.js';
import * as casinoDirectoryRoutes from './routes/casino-directory.js';
import * as playerToolsRoutes from './routes/player-tools.js';
import * as gamificationRoutes from './routes/gamification.js';
import * as mapRoutes from './routes/map.js';
import * as ngcbTrendsRoutes from './routes/ngcb-trends.js';
import * as iconGeneratorRoutes from './routes/icon-generator.js';
import * as purchasesRoutes from './routes/purchases.js';
import * as adminRoutes from './routes/admin.js';
import * as adminAuthRoutes from './routes/admin-auth.js';
import * as ngcbUnlvRoutes from './routes/ngcb-unlv.js';
import * as learnRoutes from './routes/learn.js';
import * as eventsRoutes from './routes/events.js';
import * as sessionsRoutes from './routes/sessions.js';
import * as casinoReviewsRoutes from './routes/casino-reviews.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Increase body limit to 50MB to handle large image payloads for AI vision processing
app.fastify.register(async (fastify) => {
  fastify.addContentTypeParser('application/json', { bodyLimit: 50 * 1024 * 1024 }, async (request, body) => {
    let result;
    for await (const data of body) {
      result = data;
    }
    return JSON.parse(result?.toString() || '{}');
  });
});

// Enable authentication
app.withAuth();

// Enable file storage for image uploads
app.withStorage();

// Register setup routes first to initialize data
await setupRoutes.register(app, app.fastify);

// Register slot machines data initialization
await slotMachinesRoutes.register(app, app.fastify);

// Register NGCB stats initialization
await ngcbRoutes.register(app, app.fastify);

// Register par sheets initialization
await parSheetsRoutes.register(app, app.fastify);

// Register jackpot feed initialization
await jackpotFeedRoutes.register(app, app.fastify);

// Register casino-slot machines initialization
await casinoSlotMachinesRoutes.register(app, app.fastify);

// Register casino directory initialization
await casinoDirectoryRoutes.register(app, app.fastify);

// Register player tools initialization
await playerToolsRoutes.register(app, app.fastify);

// Register gamification initialization
await gamificationRoutes.register(app, app.fastify);

// Register map routes
mapRoutes.register(app, app.fastify);

// Register NGCB trends routes
await ngcbTrendsRoutes.register(app, app.fastify);

// Register icon generator routes
iconGeneratorRoutes.register(app, app.fastify);

// Register purchases routes
purchasesRoutes.register(app, app.fastify);

// Register admin routes
adminRoutes.register(app, app.fastify);

// Register admin auth routes
adminAuthRoutes.register(app, app.fastify);

// Register NGCB/UNLV routes
ngcbUnlvRoutes.register(app, app.fastify);

// Register learn routes
await learnRoutes.register(app, app.fastify);

// Register events routes
await eventsRoutes.register(app, app.fastify);

// Register sessions routes
sessionsRoutes.register(app, app.fastify);

// Register casino reviews routes
await casinoReviewsRoutes.register(app, app.fastify);

// Register all route modules
slotsRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
