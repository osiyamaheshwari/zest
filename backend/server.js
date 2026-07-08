import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRouter from './routes/auth.js';
import marketplaceRouter from './routes/marketplace.js';
import hostelRouter from './routes/hostel.js';
import resourceRouter from './routes/resources.js';
import lostfoundRouter from './routes/lostfound.js';
import clubsRouter from './routes/clubs.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow higher payloads for base64 encoded profile pics / mock images

// Ensure uploads folder exists and is statically served
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Route bindings
app.use('/api/auth', authRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/hostels', hostelRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/lostfound', lostfoundRouter);
app.use('/api/clubs', clubsRouter);

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ZEST Campus Resource Management Platform API',
    status: 'online',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`ZEST API Server running on port ${PORT}`);
  console.log(`Environment variables loaded.`);
  console.log(`Static uploads folder set at: ${uploadsDir}`);
  console.log(`========================================================`);
});
