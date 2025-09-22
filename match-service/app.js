require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const GenAIClient = require('../shared/genai-client');

// Initialize GenAI client
const genAI = new GenAIClient();

// Auto JWT Token Management
let CACHED_JWT_TOKEN = null;
let TOKEN_EXPIRY = null;

async function getValidJWTToken() {
  // Check if we have a valid cached token
  if (CACHED_JWT_TOKEN && TOKEN_EXPIRY && new Date() < TOKEN_EXPIRY) {
    return CACHED_JWT_TOKEN;
  }

  try {
    // Try to fetch token from Resume Service
    const response = await axios.get(`${process.env.RESUME_SERVICE_URL || 'http://localhost:4003'}/auth/token`);
    CACHED_JWT_TOKEN = response.data.token;
    
    // Set expiry to 23 hours from now (1 hour before actual expiry)
    TOKEN_EXPIRY = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    logger.info('✅ JWT Token fetched from Resume Service');
    return CACHED_JWT_TOKEN;
  } catch (error) {
    logger.warn('⚠️ Could not fetch JWT token from Resume Service, generating local token', { error: error.message });
    
    // Fallback: generate our own token
    const fallbackToken = jwt.sign(
      { 
        userId: 'match-service-fallback', 
        email: 'match-service@internal.com',
        role: 'service',
        service: 'match-service'
      }, 
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '24h' }
    );
    
    CACHED_JWT_TOKEN = fallbackToken;
    TOKEN_EXPIRY = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    return CACHED_JWT_TOKEN;
  }
}

// Auto-fetch token on startup
(async () => {
  try {
    const token = await getValidJWTToken();
    console.log('🔑 Match Service JWT Token Ready:', token.substring(0, 20) + '...');
  } catch (error) {
    logger.error('Failed to initialize JWT token', { error: error.message });
  }
})();

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

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/matchservice', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error('MongoDB connection error', { error: err });
  process.exit(1);
});

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader) {
		const token = authHeader.split(' ')[1];
        
		jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.user = user;
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

// Match Schema - Stores individual match results
const matchSchema = new mongoose.Schema({
  match_id: { type: String, required: true, unique: true },
  resume_id: { type: String, required: true },
  job_id: { type: String, required: true },
  
  // Candidate Information
  candidate: {
    name: String,
    email: String,
    resume_filename: String
  },
  
  // Job Information
  job: {
    title: String,
    company: { name: String, display_name: String },
    location: { area: [String], display_name: String },
    category: { label: String, tag: String },
    salary_min: Number,
    salary_max: Number,
    redirect_url: String
  },
  
  // GenAI Matching Analysis
  matchingScore: {
    overallFit: { type: Number, min: 0, max: 1 }, // 0-1 score
    confidence: { type: Number, min: 0, max: 1 }, // AI confidence level
    
    // Detailed scoring breakdown
    skillsMatch: { type: Number, min: 0, max: 1 },
    experienceMatch: { type: Number, min: 0, max: 1 },
    educationMatch: { type: Number, min: 0, max: 1 },
    locationMatch: { type: Number, min: 0, max: 1 },
    salaryCompatibility: { type: Number, min: 0, max: 1 },
    
    // AI recommendations
    recommendation: { 
      type: String, 
      enum: ['highly_recommended', 'recommended', 'consider', 'not_recommended'],
      default: 'consider'
    },
    
    // Detailed analysis
    strengths: [String],
    concerns: [String],
    recommendations: [String],
    
    // GenAI Analysis Metadata
    reasoning: String,
    keyInsights: [String]
  },
  
  // Metadata
  analyzedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'analyzed', 'reviewed', 'shortlisted', 'rejected'], 
    default: 'analyzed' 
  },
  viewed: { type: Boolean, default: false },
  viewedAt: Date,
  bookmarked: { type: Boolean, default: false },
  bookmarkedAt: Date,
  
  // AI Model metadata
  modelVersion: String,
  processingTime: Number, // milliseconds
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
matchSchema.index({ resume_id: 1, job_id: 1 }, { unique: true });
matchSchema.index({ resume_id: 1 });
matchSchema.index({ job_id: 1 });
matchSchema.index({ 'matchingScore.overallFit': -1 });
matchSchema.index({ 'matchingScore.recommendation': 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ analyzedAt: -1 });

const Match = mongoose.model('Match', matchSchema);

// Helper function to generate unique match ID
function generateMatchId(resume_id, job_id) {
	const timestamp = Date.now();
	const hash = require('crypto').createHash('md5').update(`${resume_id}-${job_id}-${timestamp}`).digest('hex');
	return `match_${hash.substring(0, 12)}`;
}

// GenAI Intelligent Matching Function
async function performIntelligentMatch(candidateProfile, jobDetails, resume_id, job_id) {
	const startTime = Date.now();
	
	try {
		// DEBUG: Log the incoming data structure
		console.log('\n🔍 DEBUG performIntelligentMatch:');
		console.log('📋 Candidate Profile Keys:', Object.keys(candidateProfile || {}));
		console.log('📋 Job Details Keys:', Object.keys(jobDetails || {}));
		console.log('💼 Job Title:', jobDetails?.title);
		console.log('📄 Job Description Length:', jobDetails?.description?.length || 0);
		
		// Extract skills and experience from the Resume Service's structured profile
		const extractedSkills = candidateProfile?.coreCompetencies?.map(comp => ({
			name: comp.skill,
			level: comp.proficiencyLevel,
			experience: comp.yearsOfExperience,
			evidence: comp.contextualEvidence,
			impact: comp.impactIndicators
		})) || [];
		
		const experienceSummary = `
Leadership: ${candidateProfile?.leadershipProfile?.hasLeadershipExperience ? 'Yes' : 'No'} - ${candidateProfile?.leadershipProfile?.leadershipStyle || 'N/A'}
Career Level: ${candidateProfile?.careerProgression?.seniorityTrajectory || 'Unknown'}
Technical Depth: Architectural thinking: ${candidateProfile?.technicalDepth?.architecturalThinking ? 'Yes' : 'No'}
Key Achievements: ${candidateProfile?.achievementPatterns?.quantifiableImpacts?.join(', ') || 'None listed'}
		`.trim();
		
		// Prepare context for GenAI analysis with proper data mapping
		const matchingContext = {
			candidate: {
				skills: extractedSkills,
				experience: experienceSummary,
				education: candidateProfile?.education || [],
				summary: candidateProfile?.summary || experienceSummary,
				personalInfo: candidateProfile?.personalInfo || {},
				// Include rich profile data
				coreCompetencies: candidateProfile?.coreCompetencies || [],
				leadershipProfile: candidateProfile?.leadershipProfile || {},
				careerProgression: candidateProfile?.careerProgression || {},
				technicalDepth: candidateProfile?.technicalDepth || {},
				collaborationStyle: candidateProfile?.collaborationStyle || {},
				achievementPatterns: candidateProfile?.achievementPatterns || {}
			},
			job: {
				title: jobDetails?.title || '',
				description: jobDetails?.description || '',
				requirements: jobDetails?.requirements || [],
				company: jobDetails?.company || {},
				location: jobDetails?.location || {},
				category: jobDetails?.category || {},
				salary_min: jobDetails?.salary_min,
				salary_max: jobDetails?.salary_max
			}
		};
		
		console.log('🎯 Matching Context Created:');
		console.log('   - Candidate Skills Count:', matchingContext.candidate.skills.length);
		console.log('   - Job Description:', matchingContext.job.description.substring(0, 100) + '...');
		console.log('   - Experience Summary Length:', matchingContext.candidate.experience.length);

		// Create comprehensive matching prompt with structured candidate data
		const prompt = `
Analyze the compatibility between this candidate and job position. Provide a detailed matching analysis.

CANDIDATE PROFILE:
Core Competencies: ${JSON.stringify(matchingContext.candidate.coreCompetencies)}
Leadership Profile: ${JSON.stringify(matchingContext.candidate.leadershipProfile)}
Career Progression: ${JSON.stringify(matchingContext.candidate.careerProgression)}
Technical Depth: ${JSON.stringify(matchingContext.candidate.technicalDepth)}
Collaboration Style: ${JSON.stringify(matchingContext.candidate.collaborationStyle)}
Achievement Patterns: ${JSON.stringify(matchingContext.candidate.achievementPatterns)}
Experience Summary: ${matchingContext.candidate.experience}

JOB REQUIREMENTS:
- Title: ${matchingContext.job.title}
- Description: ${matchingContext.job.description}
- Requirements: ${JSON.stringify(matchingContext.job.requirements)}
- Company: ${JSON.stringify(matchingContext.job.company)}
- Location: ${JSON.stringify(matchingContext.job.location)}
- Category: ${JSON.stringify(matchingContext.job.category)}
- Salary Range: ${matchingContext.job.salary_min} - ${matchingContext.job.salary_max}

Please analyze and return a JSON response with the following structure:
{
  "overallFit": 0.0-1.0,
  "confidence": 0.0-1.0,
  "skillsMatch": 0.0-1.0,
  "experienceMatch": 0.0-1.0,
  "educationMatch": 0.0-1.0,
  "locationMatch": 0.0-1.0,
  "salaryCompatibility": 0.0-1.0,
  "recommendation": "highly_recommended|recommended|consider|not_recommended",
  "strengths": ["strength1", "strength2", ...],
  "concerns": ["concern1", "concern2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "reasoning": "detailed explanation of the match analysis",
  "keyInsights": ["insight1", "insight2", ...]
}

Focus on technical skills alignment, experience relevance, leadership potential, cultural fit, and growth opportunities.
Consider the candidate's 16 years of experience in engineering management, automation testing expertise, and proven track record of team leadership.
`;

		console.log('🤖 Calling GenAI with prompt length:', prompt.length);
		// Call GenAI for intelligent analysis
		const genaiResponse = await genAI.generateResponse(prompt);
		
		// Parse GenAI response with error handling
		let aiAnalysis;
		try {
			// Clean up the response - remove markdown code blocks if present
			let cleanResponse = genaiResponse.trim();
			if (cleanResponse.startsWith('```json')) {
				cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
			} else if (cleanResponse.startsWith('```')) {
				cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
			}
			
			aiAnalysis = JSON.parse(cleanResponse);
		} catch (parseError) {
			logger.error('Failed to parse GenAI response', { error: parseError.message, response: genaiResponse });
			// Use fallback analysis if parsing fails
			aiAnalysis = {
				overallFit: 0.5,
				confidence: 0.3,
				skillsMatch: 0.5,
				experienceMatch: 0.5,
				educationMatch: 0.5,
				locationMatch: 0.5,
				salaryCompatibility: 0.5,
				recommendation: 'consider',
				strengths: ['Analysis parsing failed'],
				concerns: ['GenAI response could not be parsed'],
				recommendations: ['Manual review recommended'],
				reasoning: 'GenAI analysis failed to parse properly',
				keyInsights: ['Automatic fallback used']
			};
		}

		// Validate and normalize the response
		const matchingScore = {
			overallFit: Math.max(0, Math.min(1, aiAnalysis.overallFit || 0.5)),
			confidence: Math.max(0, Math.min(1, aiAnalysis.confidence || 0.7)),
			skillsMatch: Math.max(0, Math.min(1, aiAnalysis.skillsMatch || 0.5)),
			experienceMatch: Math.max(0, Math.min(1, aiAnalysis.experienceMatch || 0.5)),
			educationMatch: Math.max(0, Math.min(1, aiAnalysis.educationMatch || 0.5)),
			locationMatch: Math.max(0, Math.min(1, aiAnalysis.locationMatch || 0.5)),
			salaryCompatibility: Math.max(0, Math.min(1, aiAnalysis.salaryCompatibility || 0.5)),
			recommendation: aiAnalysis.recommendation || 'consider',
			strengths: aiAnalysis.strengths || [],
			concerns: aiAnalysis.concerns || [],
			recommendations: aiAnalysis.recommendations || [],
			reasoning: aiAnalysis.reasoning || 'GenAI analysis completed',
			keyInsights: aiAnalysis.keyInsights || []
		};

		const processingTime = Date.now() - startTime;

		return {
			matchingScore,
			modelVersion: 'gpt-4o-mini',
			processingTime
		};

	} catch (error) {
		logger.error('GenAI matching failed', { error: error.message, resume_id, job_id });
		
		// Fallback scoring in case of GenAI failure
		const fallbackScore = {
			overallFit: 0.5,
			confidence: 0.3,
			skillsMatch: 0.5,
			experienceMatch: 0.5,
			educationMatch: 0.5,
			locationMatch: 0.5,
			salaryCompatibility: 0.5,
			recommendation: 'consider',
			strengths: ['Profile available for review'],
			concerns: ['Requires manual review'],
			recommendations: ['Conduct detailed manual assessment'],
			reasoning: 'Automated analysis temporarily unavailable - manual review recommended',
			keyInsights: ['GenAI analysis failed - fallback scoring applied']
		};

		return {
			matchingScore: fallbackScore,
			modelVersion: 'fallback',
			processingTime: Date.now() - startTime
		};
	}
}

// ========================================
// API ENDPOINTS
// ========================================

// GET /health - Service health check
app.get('/health', async (req, res) => {
	try {
		// Test database connection
		await mongoose.connection.db.admin().ping();
		
		// Test GenAI connection
		const genaiHealthy = await genAI.testConnection();
		
		res.json({ 
			status: 'Match Service healthy',
			timestamp: new Date().toISOString(),
			database: 'Connected',
			genAI: genaiHealthy ? 'Available' : 'Unavailable',
			version: '2.0.0-simplified'
		});
	} catch (err) {
		res.status(503).json({ 
			status: 'Match Service unhealthy',
			timestamp: new Date().toISOString(),
			error: err.message 
		});
	}
});

// GET /auth/token - Get current JWT token for testing
app.get('/auth/token', async (req, res) => {
	try {
		const token = await getValidJWTToken();
		res.json({
			token: token,
			authorization_header: 'Bearer ' + token,
			service: 'match-service',
			cached: CACHED_JWT_TOKEN ? true : false,
			expires_at: TOKEN_EXPIRY
		});
	} catch (error) {
		res.status(500).json({
			error: 'Failed to get JWT token',
			details: error.message
		});
	}
});

// GET /matches - Get matches with filtering and pagination
app.get('/matches', authenticateJWT, async (req, res) => {
	try {
		const {
			resume_id,
			job_id,
			min_score = 0,
			max_score = 1,
			recommendation,
			status,
			page = 1,
			limit = 20,
			sort_by = 'overallFit',
			sort_order = 'desc'
		} = req.query;

		// Build query filters
		const filters = {};
		if (resume_id) filters.resume_id = resume_id;
		if (job_id) filters.job_id = job_id;
		if (recommendation) filters['matchingScore.recommendation'] = recommendation;
		if (status) filters.status = status;
		
		// Score range filter
		filters['matchingScore.overallFit'] = {
			$gte: parseFloat(min_score),
			$lte: parseFloat(max_score)
		};

		// Build sort criteria
		const sortCriteria = {};
		if (sort_by === 'overallFit') {
			sortCriteria['matchingScore.overallFit'] = sort_order === 'asc' ? 1 : -1;
		} else if (sort_by === 'createdAt') {
			sortCriteria.createdAt = sort_order === 'asc' ? 1 : -1;
		} else {
			sortCriteria.createdAt = -1; // Default sort
		}

		// Execute query with pagination
		const skip = (page - 1) * limit;
		const [matches, total] = await Promise.all([
			Match.find(filters)
				.sort(sortCriteria)
				.skip(skip)
				.limit(parseInt(limit))
				.select('-__v'),
			Match.countDocuments(filters)
		]);

		res.json({
			matches,
			pagination: {
				current_page: parseInt(page),
				per_page: parseInt(limit),
				total_pages: Math.ceil(total / limit),
				total_matches: total
			}
		});

	} catch (err) {
		logger.error('Error fetching matches', { error: err.message });
		res.status(500).json({ error: 'Failed to fetch matches', details: err.message });
	}
});

// POST /matches/auto-match - Find best job matches for a candidate
app.post('/matches/auto-match', authenticateJWT, async (req, res) => {
	try {
		const { resume_id, filters = {} } = req.body;
		
		const schema = Joi.object({
			resume_id: Joi.string().required(),
			filters: Joi.object({
				min_score_threshold: Joi.number().min(0).max(1).default(0.6),
				max_matches: Joi.number().min(1).max(50).default(10),
				categories: Joi.array().items(Joi.string()),
				salary_range: Joi.object({
					min: Joi.number(),
					max: Joi.number()
				}),
				locations: Joi.array().items(Joi.string())
			}).default({})
		});
		
		const { error } = schema.validate(req.body);
		if (error) {
			return res.status(400).json({ error: error.details[0].message });
		}

		// Fetch candidate profile
		let candidateProfile;
		try {
			const token = await getValidJWTToken();
			const resumeResponse = await axios.get(`${process.env.RESUME_SERVICE_URL}/resumes/${resume_id}/profile`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			candidateProfile = resumeResponse.data.profileAnalysis;
		} catch (err) {
			logger.error('Failed to fetch candidate profile', { error: err.message, resume_id });
			return res.status(400).json({ 
				error: 'Unable to fetch candidate profile',
				details: 'Resume analysis may be required first'
			});
		}

		// Fetch available jobs from job service
		let jobs;
		try {
			const token = await getValidJWTToken();
			const jobsResponse = await axios.get(`${process.env.JOB_SERVICE_URL}/jobs`, {
				headers: { Authorization: `Bearer ${token}` },
				params: {
					limit: 100, // Get enough jobs to match against
					status: 'active'
				}
			});
			jobs = jobsResponse.data.jobs || [];
		} catch (err) {
			logger.error('Failed to fetch jobs', { error: err.message });
			return res.status(500).json({ 
				error: 'Unable to fetch jobs',
				details: err.message
			});
		}

		// Apply filters to jobs
		let filteredJobs = jobs;
		
		if (filters.categories && filters.categories.length > 0) {
			filteredJobs = filteredJobs.filter(job => 
				filters.categories.includes(job.category?.tag) || 
				filters.categories.includes(job.category?.label)
			);
		}
		
		if (filters.salary_range) {
			filteredJobs = filteredJobs.filter(job => {
				const jobMin = job.salary_min || 0;
				const jobMax = job.salary_max || Infinity;
				const filterMin = filters.salary_range.min || 0;
				const filterMax = filters.salary_range.max || Infinity;
				
				return jobMax >= filterMin && jobMin <= filterMax;
			});
		}
		
		if (filters.locations && filters.locations.length > 0) {
			filteredJobs = filteredJobs.filter(job =>
				filters.locations.some(location =>
					job.location?.display_name?.toLowerCase().includes(location.toLowerCase()) ||
					job.location?.area?.some(area => area.toLowerCase().includes(location.toLowerCase()))
				)
			);
		}

		// Process each job and create matches
		const matchPromises = filteredJobs.slice(0, filters.max_matches || 10).map(async (job) => {
			try {
				// Check if match already exists
				const existingMatch = await Match.findOne({ resume_id, job_id: job.job_id });
				if (existingMatch) {
					return existingMatch;
				}

				// Perform intelligent matching
				const matchResult = await performIntelligentMatch(candidateProfile, job, resume_id, job.job_id);

				// Apply score threshold filter
				if (matchResult.matchingScore.overallFit < (filters.min_score_threshold || 0.6)) {
					return null; // Skip matches below threshold
				}

				// Create and save match
				const match = new Match({
					match_id: generateMatchId(resume_id, job.job_id),
					resume_id,
					job_id: job.job_id,
					candidate: {
						name: candidateProfile?.personalInfo?.name || 'Unknown',
						email: candidateProfile?.personalInfo?.email || '',
						resume_filename: candidateProfile?.original_name || ''
					},
					job: {
						title: job.title,
						company: job.company,
						location: job.location,
						category: job.category,
						salary_min: job.salary_min,
						salary_max: job.salary_max,
						redirect_url: job.redirect_url
					},
					matchingScore: matchResult.matchingScore,
					analyzedAt: new Date(),
					status: 'analyzed',
					modelVersion: matchResult.modelVersion,
					processingTime: matchResult.processingTime
				});

				await match.save();
				return match;

			} catch (err) {
				logger.error('Error processing job match', { 
					error: err.message, 
					resume_id, 
					job_id: job.job_id 
				});
				return null;
			}
		});

		// Wait for all matches to complete
		const allMatches = await Promise.all(matchPromises);
		const validMatches = allMatches.filter(match => match !== null);

		// Sort by match score
		validMatches.sort((a, b) => b.matchingScore.overallFit - a.matchingScore.overallFit);

		logger.info('Auto-matching completed', { 
			resume_id, 
			jobs_processed: filteredJobs.length, 
			matches_created: validMatches.length 
		});

		res.json({
			resume_id,
			matches_found: validMatches.length,
			jobs_analyzed: filteredJobs.length,
			filters_applied: filters,
			matches: validMatches.map(match => ({
				match_id: match.match_id,
				job: {
					title: match.job.title,
					company: match.job.company,
					location: match.job.location,
					category: match.job.category,
					salary_range: {
						min: match.job.salary_min,
						max: match.job.salary_max
					},
					redirect_url: match.job.redirect_url
				},
				score: {
					overall: match.matchingScore.overallFit,
					skills: match.matchingScore.skillsMatch,
					experience: match.matchingScore.experienceMatch,
					recommendation: match.matchingScore.recommendation
				},
				strengths: match.matchingScore.strengths,
				concerns: match.matchingScore.concerns,
				analyzed_at: match.analyzedAt
			})),
			generated_at: new Date().toISOString()
		});

	} catch (err) {
		logger.error('Error in auto-matching', { error: err.message });
		res.status(500).json({ error: 'Failed to perform auto-matching', details: err.message });
	}
});

// Swagger documentation
const swaggerDocument = {
	openapi: '3.0.0',
	info: {
		title: 'Match Service API - Simplified',
		version: '2.0.0-simplified',
		description: 'Simplified ATS Match Service for finding job matches for resumes using GenAI'
	},
	servers: [
		{
			url: `http://localhost:${process.env.MATCH_SERVICE_PORT || 4004}`,
			description: 'Development server'
		}
	],
	paths: {
		'/health': {
			get: {
				summary: 'Service health check',
				responses: {
					'200': { description: 'Service is healthy' },
					'503': { description: 'Service is unhealthy' }
				}
			}
		},
		'/matches': {
			get: {
				summary: 'Get matches with filtering and pagination',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ name: 'resume_id', in: 'query', schema: { type: 'string' } },
					{ name: 'job_id', in: 'query', schema: { type: 'string' } },
					{ name: 'min_score', in: 'query', schema: { type: 'number' } },
					{ name: 'max_score', in: 'query', schema: { type: 'number' } },
					{ name: 'page', in: 'query', schema: { type: 'integer' } },
					{ name: 'limit', in: 'query', schema: { type: 'integer' } }
				],
				responses: {
					'200': { description: 'List of matches' },
					'401': { description: 'Unauthorized' },
					'500': { description: 'Internal server error' }
				}
			}
		},
		'/matches/auto-match': {
			post: {
				summary: 'Find best job matches for a candidate',
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									resume_id: { type: 'string' },
									filters: {
										type: 'object',
										properties: {
											min_score_threshold: { type: 'number' },
											max_matches: { type: 'integer' },
											categories: { type: 'array', items: { type: 'string' } },
											locations: { type: 'array', items: { type: 'string' } }
										}
									}
								}
							}
						}
					}
				},
				responses: {
					'200': { description: 'Matching jobs found' },
					'400': { description: 'Invalid request' },
					'401': { description: 'Unauthorized' },
					'500': { description: 'Internal server error' }
				}
			}
		}
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT'
			}
		}
	}
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.MATCH_SERVICE_PORT || 4004;
app.listen(PORT, () => {
  logger.info(`Match Service v2.0-simplified listening on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`Match Service v2.0-simplified listening on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
