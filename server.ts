import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDatabase } from './src/backend/db/database.ts';
import { authRouter } from './src/backend/routes/auth.ts';
import { readingsRouter } from './src/backend/routes/readings.ts';
import { reportsRouter } from './src/backend/routes/reports.ts';
import { aiRouter } from './src/backend/routes/ai.ts';
import { seedDatabase } from './scripts/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/readings', readingsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/ai', aiRouter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'Sweety – Blood Glucose Tracker',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Demo seed endpoint (useful for initial demo / testing)
  app.post('/api/demo/seed', async (req: Request, res: Response) => {
    try {
      await seedDatabase();
      res.json({
        message: 'Database seeded successfully with clinical demo data',
        demoCredentials: {
          email: 'demo@sweety.com',
          password: 'password123',
        },
      });
    } catch (err: any) {
      console.error('API seed error:', err);
      res.status(500).json({ error: 'Failed to seed database: ' + err.message });
    }
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

async function startServer() {
  const app = await createApp();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Ensure DB schema initialized
  try {
    await getDatabase();
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  if (!isProduction) {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Sweety server running on port ${port} (${isProduction ? 'production' : 'development'})`);
  });
}

// Start server if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer().catch(err => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
