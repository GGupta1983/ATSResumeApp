require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Gateway',
    version: '1.0.0',
    description: 'API documentation for Gateway Service'
  },
  paths: {
    '/': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'API Gateway is running' }
        }
      }
    },
    '/login': {
      post: {
        summary: 'Login to get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'JWT token returned' },
          401: { description: 'Invalid credentials' }
        }
      }
    }
  }
};
const winston = require('winston');
// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
const jwt = require('jsonwebtoken');
const proxy = require('express-http-proxy');

const app = express();
// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Rate limiting: 100 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());
// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  });
  next();
});
app.use(helmet());
// Root route for health/status
app.get('/', (req, res) => {
  try {
    logger.info('Health check requested');
    res.json({ status: 'API Gateway is running' });
  } catch (err) {
    logger.error('Health check failed', { error: err });
    res.status(500).json({ status: 'API Gateway unhealthy', error: err.message });
  }
});
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// JWT middleware for gateway
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Missing token' });
  }
}

// Simple login endpoint (for demo)
// Proxy /login requests to user-service for authentication
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:4003';
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || 'http://localhost:4002';
const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || 'http://localhost:4004';
const CANDIDATE_SERVICE_URL = process.env.CANDIDATE_SERVICE_URL || 'http://localhost:4007';

// Proxy all /users* requests to user-service
app.use('/users', proxy(USER_SERVICE_URL, {
  proxyReqPathResolver: function(req) {
    // Forward the path and query string as-is
    return req.originalUrl.replace(/^\/users/, '/users');
  },
  proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
    // Forward the Authorization header if present
    if (srcReq.headers["authorization"]) {
      proxyReqOpts.headers["authorization"] = srcReq.headers["authorization"];
    }
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    // Log proxy response for debugging
    console.log('User Service Proxy response:', proxyRes.statusCode, proxyResData.toString());
    return proxyResData;
  }
}));

// Proxy all /resumes* requests to resume-service
// Protect all /resumes requests (GET, POST, DELETE, etc.) with JWT
app.use('/resumes', authenticateJWT, proxy(RESUME_SERVICE_URL, {
  proxyReqPathResolver: function(req) {
    // Forward the path and query string as-is
    return req.originalUrl.replace(/^\/resumes/, '/resumes');
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    // Log proxy response for debugging
    console.log('Proxy response:', proxyRes.statusCode, proxyResData.toString());
    return proxyResData;
  }
}));

// Proxy all /jobs* requests to job-service
app.use('/jobs', proxy(JOB_SERVICE_URL, {
  proxyReqPathResolver: function(req) {
    return req.originalUrl.replace(/^\/jobs/, '/jobs');
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    console.log('Job Service Proxy response:', proxyRes.statusCode, proxyResData.toString());
    return proxyResData;
  }
}));

// Proxy all /candidates* requests to candidate-service
app.use('/candidates', authenticateJWT, proxy(CANDIDATE_SERVICE_URL, {
  proxyReqPathResolver: function(req) {
    return req.originalUrl.replace(/^\/candidates/, '/candidates');
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    console.log('Candidate Service Proxy response:', proxyRes.statusCode, proxyResData.toString());
    return proxyResData;
  }
}));

// Proxy all /matches* requests to match-service
app.use('/matches', authenticateJWT, proxy(MATCH_SERVICE_URL, {
  proxyReqPathResolver: function(req) {
    return req.originalUrl.replace(/^\/matches/, '/matches');
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    console.log('Match Service Proxy response:', proxyRes.statusCode, proxyResData.toString());
    return proxyResData;
  }
}));

const PORT = process.env.GATEWAY_PORT || 4000;
// Error logging middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err,
    method: req.method,
    url: req.originalUrl
  });
  res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => logger.info(`API Gateway listening on port ${PORT}`));
