import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, queryAll } from './database/db.js';
import { seedDemoData } from './database/seed.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Smart Campus Network Simulator',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    await initDatabase();

    // Check if initial seeding is needed
    const devices = queryAll('SELECT id FROM devices LIMIT 1');
    if (devices.length === 0) {
      console.log('Database empty. Seeding initial Smart Campus Network data...');
      seedDemoData();
    } else {
      console.log('Database already populated with existing topology.');
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`SMART CAMPUS NETWORK BACKEND ENGINE`);
      console.log(`API Server listening on http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal error initializing backend server:', err);
    process.exit(1);
  }
}

startServer();
