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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/jobservice', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error('MongoDB connection error', { error: err });
  process.exit(1);
});

// Job Schema with GenAI Analysis
const jobSchema = new mongoose.Schema({
  job_id: String,
  title: String,
  description: String,
  company: { name: String, display_name: String },
  location: { area: [String], display_name: String },
  category: { label: String, tag: String },
  salary_min: Number,
  salary_max: Number,
  salary_is_predicted: Boolean,
  redirect_url: String,
  created: Date,
  source: { type: String, default: 'adzuna' },
  
  // GenAI Job Analysis
  jobAnalysis: {
    roleContext: {
      teamDynamics: String,
      technicalChallenges: [String],
      decisionMakingStyle: String,
      impactScope: String
    },
    culturalEnvironment: {
      workStyle: String,
      collaborationPattern: String,
      learningCulture: String,
      diversityFocus: String
    },
    successCriteria: {
      technicalDeliverables: [String],
      leadershipExpectations: [String],
      businessOutcomes: [String]
    },
    growthOpportunities: {
      skillDevelopment: [String],
      careerProgression: String,
      projectExposure: [String]
    },
    requiredCompetencies: [{
      skill: String,
      proficiencyLevel: String,
      importance: String,
      contextualEvidence: String
    }]
  },
  lastAnalyzed: Date,
  analysisVersion: { type: Number, default: 1 }
});

const Job = mongoose.model('Job', jobSchema);

// JWT middleware
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use((req, res, next) => {
	logger.info('Incoming request', {
		method: req.method,
		url: req.originalUrl,
		headers: req.headers
	});
	next();
});


// Health endpoint
app.get('/health', (req, res) => {
	try {
		logger.info('Health check requested');
		res.json({ 
			status: 'Job Service healthy',
			timestamp: new Date().toISOString(),
			genAI: 'Available',
			database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
		});
	} catch (err) {
		logger.error('Health check failed', { error: err });
		res.status(500).json({ status: 'Job Service unhealthy', error: err.message });
	}
});

// Fetch jobs from Adzuna API
app.get('/jobs/fetch', authenticateJWT, async (req, res) => {
	const { 
		keywords = '', 
		location = '', 
		results_per_page = 50, 
		page = 1,
		category = '',
		salary_min = '',
		salary_max = ''
	} = req.query;
	
	const country = 'in'; // You can make this configurable
	const app_id = process.env.ADZUNA_APP_ID || 'c79063b9';
	const app_key = process.env.ADZUNA_APP_KEY || '81b47b675b2f143436020e3cfe21770a';
	const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
	
	try {
		logger.info('Fetching jobs from Adzuna', { keywords, location, page });
		
		const params = {
			app_id,
			app_key,
			results_per_page: Math.min(results_per_page, 50), // Adzuna limit
			what: keywords,
			where: location
		};
		
		if (category) params.category = category;
		if (salary_min) params.salary_min = salary_min;
		if (salary_max) params.salary_max = salary_max;
		
		const response = await axios.get(url, { params });
		
		// Store jobs in MongoDB for later analysis
		const jobs = response.data.results;
		const savedJobs = [];
		
		for (const job of jobs) {
			const existingJob = await Job.findOne({ job_id: job.id });
			if (!existingJob) {
				const newJob = new Job({
					job_id: job.id,
					title: job.title,
					description: job.description,
					company: job.company,
					location: job.location,
					category: job.category,
					salary_min: job.salary_min,
					salary_max: job.salary_max,
					salary_is_predicted: job.salary_is_predicted,
					redirect_url: job.redirect_url,
					created: new Date(job.created)
				});
				await newJob.save();
				savedJobs.push(newJob);
			} else {
				savedJobs.push(existingJob);
			}
		}
		
		res.json({
			count: response.data.count,
			total_jobs_fetched: jobs.length,
			jobs_saved: savedJobs.length,
			jobs: savedJobs,
			mean_salary: response.data.mean
		});
		
	} catch (err) {
		logger.error('Adzuna job fetch error', { error: err });
		res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
	}
});

// Analyze job with GenAI
app.post('/jobs/:jobId/analyze', authenticateJWT, async (req, res) => {
	try {
		const job = await Job.findOne({ job_id: req.params.jobId });
		if (!job) {
			return res.status(404).json({ error: 'Job not found' });
		}

		if (!job.description) {
			return res.status(400).json({ error: 'Job description not available for analysis' });
		}

		logger.info('Starting GenAI job analysis', { job_id: req.params.jobId });

		// Create comprehensive job analysis prompt
		const analysisPrompt = `
Analyze this job posting comprehensively and provide a detailed opportunity profile analysis.

Job Title: ${job.title}
Company: ${job.company?.display_name || job.company?.name || 'Not specified'}
Location: ${job.location?.display_name || 'Not specified'}
Category: ${job.category?.label || 'Not specified'}

Job Description:
${job.description}

Please analyze and return a JSON response with the following structure:
{
  "roleContext": {
    "teamDynamics": "Description of team structure and collaboration",
    "technicalChallenges": ["Challenge 1", "Challenge 2"],
    "decisionMakingStyle": "How decisions are made in this role",
    "impactScope": "Scope of impact this role will have"
  },
  "culturalEnvironment": {
    "workStyle": "Remote/Hybrid/Office and work culture",
    "collaborationPattern": "How teams collaborate",
    "learningCulture": "Learning and development opportunities",
    "diversityFocus": "Diversity and inclusion indicators"
  },
  "successCriteria": {
    "technicalDeliverables": ["Deliverable 1", "Deliverable 2"],
    "leadershipExpectations": ["Leadership aspect 1", "Leadership aspect 2"],
    "businessOutcomes": ["Business outcome 1", "Business outcome 2"]
  },
  "growthOpportunities": {
    "skillDevelopment": ["Skill 1", "Skill 2"],
    "careerProgression": "Career advancement path",
    "projectExposure": ["Project type 1", "Project type 2"]
  },
  "requiredCompetencies": [
    {
      "skill": "Technology/Skill name",
      "proficiencyLevel": "Beginner/Intermediate/Advanced/Expert",
      "importance": "Critical/Important/Nice-to-have",
      "contextualEvidence": "Evidence from job description"
    }
  ]
}

Focus on extracting specific requirements and understanding the role context.`;

		// Generate analysis using GenAI
		const analysisResponse = await genAI.generateResponse(analysisPrompt, {
			temperature: 0.3,
			max_tokens: 3000
		});

		// Parse the response
		let jobAnalysis;
		try {
			let cleanResponse = analysisResponse.trim();
			if (cleanResponse.startsWith('```json')) {
				cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
			} else if (cleanResponse.startsWith('```')) {
				cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
			}
			
			jobAnalysis = JSON.parse(cleanResponse);
		} catch (parseError) {
			logger.error('Failed to parse GenAI job analysis response', { error: parseError, response: analysisResponse });
			return res.status(500).json({ 
				error: 'Failed to parse AI analysis response',
				rawResponse: analysisResponse
			});
		}

		// Update job with analysis
		await Job.updateOne(
			{ job_id: req.params.jobId },
			{
				jobAnalysis,
				lastAnalyzed: new Date(),
				analysisVersion: 1
			}
		);

		logger.info('GenAI job analysis completed', { job_id: req.params.jobId });

		res.json({
			job_id: req.params.jobId,
			title: job.title,
			company: job.company?.display_name || job.company?.name,
			jobAnalysis,
			lastAnalyzed: new Date(),
			message: 'Job analysis completed successfully'
		});

	} catch (err) {
		logger.error('Error during GenAI job analysis', { error: err, job_id: req.params.jobId });
		res.status(500).json({ error: 'Failed to analyze job', details: err.message });
	}
});

// Match jobs with candidate resume using GenAI
app.post('/jobs/match-candidate', authenticateJWT, async (req, res) => {
	const { resume_id, location_preference, keywords } = req.body;
	
	if (!resume_id) {
		return res.status(400).json({ error: 'resume_id is required' });
	}
	
	try {
		logger.info('Starting intelligent job matching', { resume_id });
		
		// Fetch candidate profile from Resume Service
		const resumeServiceUrl = process.env.RESUME_SERVICE_URL || 'http://localhost:4003';
		let candidateProfile;
		
		try {
			const resumeResponse = await axios.get(`${resumeServiceUrl}/resumes/${resume_id}/profile`, {
				headers: {
					'Authorization': req.headers.authorization
				}
			});
			candidateProfile = resumeResponse.data.profileAnalysis;
		} catch (resumeError) {
			logger.error('Failed to fetch candidate profile', { error: resumeError, resume_id });
			return res.status(400).json({ 
				error: 'Could not fetch candidate profile',
				details: 'Ensure the resume exists and has been analyzed'
			});
		}
		
		// Fetch relevant jobs from database (analyzed jobs)
		const jobQuery = {};
		if (location_preference) {
			jobQuery['location.display_name'] = new RegExp(location_preference, 'i');
		}
		
		// Get jobs that have been analyzed
		const jobs = await Job.find({ 
			...jobQuery,
			jobAnalysis: { $exists: true }
		}).limit(20);
		
		if (jobs.length === 0) {
			return res.json({
				message: 'No analyzed jobs found. Fetch and analyze some jobs first.',
				matches: [],
				candidateProfile: candidateProfile
			});
		}
		
		// Generate intelligent matches using GenAI
		const matches = [];
		
		for (const job of jobs) {
			const matchingPrompt = `
Analyze the compatibility between this candidate and job opportunity using contextual understanding.

CANDIDATE PROFILE:
Core Competencies: ${JSON.stringify(candidateProfile.coreCompetencies?.slice(0, 5) || [])}
Leadership Profile: ${JSON.stringify(candidateProfile.leadershipProfile || {})}
Career Progression: ${JSON.stringify(candidateProfile.careerProgression || {})}
Technical Depth: ${JSON.stringify(candidateProfile.technicalDepth || {})}
Achievement Patterns: ${JSON.stringify(candidateProfile.achievementPatterns || {})}

JOB OPPORTUNITY:
Title: ${job.title}
Company: ${job.company?.display_name || job.company?.name}
Required Competencies: ${JSON.stringify(job.jobAnalysis?.requiredCompetencies?.slice(0, 5) || [])}
Role Context: ${JSON.stringify(job.jobAnalysis?.roleContext || {})}
Growth Opportunities: ${JSON.stringify(job.jobAnalysis?.growthOpportunities || {})}
Success Criteria: ${JSON.stringify(job.jobAnalysis?.successCriteria || {})}

Provide a detailed matching analysis in JSON format:
{
  "overallFit": 0.85,
  "dimensions": {
    "technicalAlignment": {
      "score": 0.88,
      "reasoning": "Specific technical alignment explanation",
      "growthAreas": ["Area where candidate could grow"]
    },
    "culturalFit": {
      "score": 0.82,
      "reasoning": "Cultural compatibility explanation",
      "strengths": ["Cultural alignment strength"]
    },
    "careerAlignment": {
      "score": 0.90,
      "reasoning": "Career progression alignment",
      "opportunities": ["Growth opportunity"]
    },
    "impactPotential": {
      "score": 0.85,
      "reasoning": "Expected impact assessment",
      "expectedContributions": ["Contribution 1", "Contribution 2"]
    }
  },
  "riskFactors": ["Risk factor 1"],
  "successPredictors": ["Success predictor 1"],
  "recommendation": "Highly Recommended/Recommended/Consider/Not Recommended"
}`;

			try {
				const matchResponse = await genAI.generateResponse(matchingPrompt, {
					temperature: 0.2,
					max_tokens: 2000
				});
				
				let matchingScore;
				try {
					let cleanResponse = matchResponse.trim();
					if (cleanResponse.startsWith('```json')) {
						cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
					} else if (cleanResponse.startsWith('```')) {
						cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
					}
					
					matchingScore = JSON.parse(cleanResponse);
				} catch (parseError) {
					// Fallback scoring if JSON parsing fails
					matchingScore = {
						overallFit: 0.5,
						dimensions: {
							technicalAlignment: { score: 0.5, reasoning: "Analysis parsing failed" },
							culturalFit: { score: 0.5, reasoning: "Analysis parsing failed" },
							careerAlignment: { score: 0.5, reasoning: "Analysis parsing failed" },
							impactPotential: { score: 0.5, reasoning: "Analysis parsing failed" }
						},
						recommendation: "Consider"
					};
				}
				
				matches.push({
					job: {
						job_id: job.job_id,
						title: job.title,
						company: job.company,
						location: job.location,
						salary_min: job.salary_min,
						salary_max: job.salary_max,
						redirect_url: job.redirect_url,
						category: job.category
					},
					matchingScore,
					analyzedAt: new Date()
				});
				
			} catch (matchError) {
				logger.error('Error in job matching', { error: matchError, job_id: job.job_id });
			}
		}
		
		// Sort matches by overall fit score
		matches.sort((a, b) => (b.matchingScore?.overallFit || 0) - (a.matchingScore?.overallFit || 0));
		
		res.json({
			resume_id,
			total_jobs_analyzed: jobs.length,
			matches_found: matches.length,
			matches: matches.slice(0, 10), // Top 10 matches
			candidateProfile: {
				coreCompetencies: candidateProfile.coreCompetencies?.slice(0, 3),
				careerProgression: candidateProfile.careerProgression,
				leadershipProfile: candidateProfile.leadershipProfile
			},
			message: 'Intelligent job matching completed successfully'
		});
		
	} catch (err) {
		logger.error('Error in intelligent job matching', { error: err, resume_id });
		res.status(500).json({ error: 'Failed to match jobs with candidate', details: err.message });
	}
});

// Get job analysis
app.get('/jobs/:jobId/analysis', authenticateJWT, async (req, res) => {
	try {
		const job = await Job.findOne({ job_id: req.params.jobId });
		if (!job) {
			return res.status(404).json({ error: 'Job not found' });
		}

		if (!job.jobAnalysis) {
			return res.status(404).json({ 
				error: 'Job analysis not available',
				message: 'Use POST /jobs/:jobId/analyze to generate job analysis first'
			});
		}

		res.json({
			job_id: job.job_id,
			title: job.title,
			company: job.company,
			jobAnalysis: job.jobAnalysis,
			lastAnalyzed: job.lastAnalyzed,
			analysisVersion: job.analysisVersion
		});

	} catch (err) {
		logger.error('Error fetching job analysis', { error: err });
		res.status(500).json({ error: 'Failed to fetch job analysis', details: err.message });
	}
});

// List all jobs in database
app.get('/jobs', authenticateJWT, async (req, res) => {
	try {
		const { page = 1, limit = 20, analyzed_only = false } = req.query;
		const skip = (page - 1) * limit;
		
		const query = analyzed_only === 'true' ? { jobAnalysis: { $exists: true } } : {};
		
		const jobs = await Job.find(query)
			.select('job_id title company location category salary_min salary_max created lastAnalyzed')
			.skip(skip)
			.limit(parseInt(limit))
			.sort({ created: -1 });
			
		const total = await Job.countDocuments(query);
		
		res.json({
			jobs,
			pagination: {
				current_page: parseInt(page),
				total_pages: Math.ceil(total / limit),
				total_jobs: total,
				jobs_per_page: parseInt(limit)
			}
		});
		
	} catch (err) {
		logger.error('Error fetching jobs', { error: err });
		res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
	}
});

// Swagger/OpenAPI docs
const swaggerDocument = {
	openapi: '3.0.0',
	info: {
		title: 'GenAI Job Service API',
		version: '2.0.0',
		description: 'API documentation for GenAI-powered Job Service with Adzuna integration'
	},
	paths: {
		'/health': {
			get: {
				summary: 'Health check',
				responses: { 200: { description: 'Service health status' } }
			}
		},
		'/jobs/fetch': {
			get: {
				summary: 'Fetch jobs from Adzuna API',
				parameters: [
					{ name: 'keywords', in: 'query', schema: { type: 'string' } },
					{ name: 'location', in: 'query', schema: { type: 'string' } },
					{ name: 'results_per_page', in: 'query', schema: { type: 'number' } }
				],
				responses: { 200: { description: 'Jobs fetched and stored' } }
			}
		},
		'/jobs/{jobId}/analyze': {
			post: {
				summary: 'Generate GenAI analysis for a job',
				parameters: [
					{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }
				],
				responses: { 200: { description: 'Job analysis completed' } }
			}
		},
		'/jobs/match-candidate': {
			post: {
				summary: 'Find matching jobs for a candidate using GenAI',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									resume_id: { type: 'string' },
									location_preference: { type: 'string' },
									keywords: { type: 'string' }
								},
								required: ['resume_id']
							}
						}
					}
				},
				responses: { 200: { description: 'Intelligent job matches' } }
			}
		},
		'/jobs': {
			get: {
				summary: 'List all jobs',
				parameters: [
					{ name: 'page', in: 'query', schema: { type: 'number' } },
					{ name: 'limit', in: 'query', schema: { type: 'number' } },
					{ name: 'analyzed_only', in: 'query', schema: { type: 'boolean' } }
				],
				responses: { 200: { description: 'List of jobs' } }
			}
		}
	}
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error logging middleware
app.use((err, req, res, next) => {
	logger.error('Unhandled error', {
		error: err,
		method: req.method,
		url: req.originalUrl
	});
	res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.JOB_SERVICE_PORT || 4002;
app.listen(PORT, () => logger.info(`Job Service listening on port ${PORT}`));
