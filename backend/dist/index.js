"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./database/db.js");
const seed_js_1 = require("./database/seed.js");
const api_js_1 = __importDefault(require("./routes/api.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api', api_js_1.default);
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
        await (0, db_js_1.initDatabase)();
        // Check if initial seeding is needed
        const devices = (0, db_js_1.queryAll)('SELECT id FROM devices LIMIT 1');
        if (devices.length === 0) {
            console.log('Database empty. Seeding initial Smart Campus Network data...');
            (0, seed_js_1.seedDemoData)();
        }
        else {
            console.log('Database already populated with existing topology.');
        }
        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(`SMART CAMPUS NETWORK BACKEND ENGINE`);
            console.log(`API Server listening on http://localhost:${PORT}`);
            console.log(`Health Check: http://localhost:${PORT}/health`);
            console.log(`=======================================================`);
        });
    }
    catch (err) {
        console.error('Fatal error initializing backend server:', err);
        process.exit(1);
    }
}
startServer();
