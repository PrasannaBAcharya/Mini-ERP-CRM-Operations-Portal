import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import challanRoutes from './routes/challans';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Always-allowed origin patterns (no env-var change needed for new Vercel deployments):
//   - any *.vercel.app subdomain
//   - localhost on ports 3000 and 5173
// To add more, comma-separate them in the CORS_ORIGIN env var on Render.
const VERCEL_PATTERN = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;
const ALWAYS_ALLOWED = [
  'http://localhost:3000',
  'http://localhost:5173',
];
const extraOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...ALWAYS_ALLOWED, ...extraOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, Render health-checks)
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app deployment URL (preview + production)
      if (VERCEL_PATTERN.test(origin)) return callback(null, true);
      // Allow exact-match origins (localhost + any extras in env)
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/users', userRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: err.name || 'Error',
    message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
