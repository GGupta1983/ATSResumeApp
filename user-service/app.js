// This service is stateless: no session storage, all state is in MongoDB.
// Configuration is loaded from environment variables using dotenv.
console.log('test');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = {
	openapi: '3.0.0',
	info: {
		title: 'User Service API',
		version: '1.0.0',
		description: 'API documentation for User Service'
	},
	paths: {
		'/users/register': {
			post: {
				summary: 'Register a new user',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									username: { type: 'string' },
									email: { type: 'string' },
									password: { type: 'string' },
									role: { type: 'string' }
								},
								required: ['username', 'email', 'password']
							}
						}
					}
				},
				responses: {
					201: { description: 'User registered successfully' },
					400: { description: 'Validation error' }
				}
			}
		},
		'/users/login': {
			post: {
				summary: 'Login user',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: { type: 'string' },
									password: { type: 'string' }
								},
								required: ['email', 'password']
							}
						}
					}
				},
				responses: {
					200: { description: 'JWT token returned' },
					400: { description: 'Validation error' }
				}
			}
		},
		'/users': {
			get: {
				summary: 'Get all users (admin only)',
				parameters: [
					{ name: 'page', in: 'query', schema: { type: 'integer' } },
					{ name: 'limit', in: 'query', schema: { type: 'integer' } }
				],
				responses: {
					200: { description: 'Paginated users' },
					403: { description: 'Forbidden' }
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
		// You can add file transports here if needed
	],
});
const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt');
const mongoose = require('mongoose');
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
app.use(express.json());
app.use(helmet());

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => {
	logger.info('Connected to MongoDB');
}).catch((err) => {
	logger.error('MongoDB connection error', { error: err });
	process.exit(1);
});

app.get('/health', (req, res) => {
		try {
			logger.info('Health check requested');
			res.json({ status: 'User Service healthy' });
		} catch (err) {
			logger.error('Health check failed', { error: err });
			res.status(500).json({ status: 'User Service unhealthy', error: err.message });
		}
});

const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);
// Protect profile route with JWT
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
app.use('/users/:id', jwtMiddleware({ secret: jwtSecret, algorithms: ['HS256'] }));

const PORT = process.env.USER_SERVICE_PORT || 4001;
// Error logging middleware
app.use((err, req, res, next) => {
	logger.error('Unhandled error', {
		error: err,
		method: req.method,
		url: req.originalUrl
	});
	res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => logger.info(`User Service listening on port ${PORT}`));

