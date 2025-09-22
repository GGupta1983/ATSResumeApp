# ATS Match Service

GenAI-powered intelligent candidate-job matching microservice using Azure OpenAI.

## 🚀 Features

- **Intelligent Matching**: Multi-dimensional AI-powered candidate-job compatibility analysis
- **Batch Processing**: Handle multiple candidates/jobs simultaneously with concurrency control
- **Real-time Auto-Matching**: Automatically match new resumes with existing jobs
- **Analytics Dashboard**: Comprehensive matching performance metrics and insights
- **RESTful API**: Complete REST API with Swagger documentation
- **MongoDB Integration**: Efficient data storage with optimized indexes
- **JWT Authentication**: Secure API access
- **Winston Logging**: Comprehensive logging for monitoring and debugging

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB running locally or connection string
- Azure OpenAI API access
- Resume Service running (for candidate profiles)
- Job Service running (for job details)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory with:
   ```env
   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
   AZURE_OPENAI_API_KEY=your-api-key
   AZURE_OPENAI_API_VERSION=2024-08-01-preview
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
   AZURE_OPENAI_MODEL=gpt-4o-mini

   # Database
   MONGO_URI=mongodb://localhost:27017/matchservice

   # Service Configuration
   MATCH_SERVICE_PORT=4004
   JWT_SECRET=your-jwt-secret

   # External Services
   RESUME_SERVICE_URL=http://localhost:4003
   JOB_SERVICE_URL=http://localhost:4002
   ```

3. **Start the service:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Check service health:
```bash
npm run test:health
```

## 📚 API Documentation

Once the service is running, access the interactive API documentation at:
```
http://localhost:4004/api-docs
```

## 🔗 API Endpoints

### Core Matching
- `POST /matches/analyze` - Create and analyze a single match
- `GET /matches` - Get matches with filtering and pagination
- `GET /matches/:match_id` - Get specific match details
- `PUT /matches/:match_id/status` - Update match status
- `POST /matches/:match_id/bookmark` - Bookmark/unbookmark a match

### Batch Operations
- `POST /matches/batch-analyze` - Batch process multiple candidate-job combinations
- `POST /matches/auto-match` - Automatically match new resumes with existing jobs
- `GET /operations/:operation_id` - Check batch operation status

### Analytics
- `GET /analytics/dashboard` - Get match analytics dashboard data
- `GET /analytics/candidate/:resume_id` - Get analytics for specific candidate

### System
- `GET /health` - Health check endpoint

## 🏗️ Architecture

### Database Schemas

1. **Match** - Individual match results with AI analysis
2. **MatchHistory** - Track batch operations and performance
3. **MatchAnalytics** - Aggregated statistics and metrics

### AI Integration

The service uses Azure OpenAI GPT-4o-mini for:
- Multi-dimensional compatibility scoring
- Detailed reasoning and explanations
- Skill gap identification
- Career growth potential assessment

### Matching Dimensions

- **Technical Alignment** - Skills and technology match
- **Experience Match** - Experience level and relevance
- **Cultural Fit** - Team and company culture compatibility
- **Career Alignment** - Growth potential and career goals
- **Salary Expectation** - Compensation alignment
- **Location Preference** - Geographic compatibility

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MATCH_SERVICE_PORT` | Service port | 4004 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/matchservice |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | Required |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `RESUME_SERVICE_URL` | Resume service URL | http://localhost:4003 |
| `JOB_SERVICE_URL` | Job service URL | http://localhost:4002 |

## 📊 Monitoring

The service provides comprehensive logging and metrics:

- **Winston Logging**: Structured JSON logs with timestamps
- **Performance Metrics**: API response times and GenAI performance
- **Error Tracking**: Detailed error logging with context
- **Health Checks**: Database and GenAI connectivity monitoring

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4004
CMD ["npm", "start"]
```

### PM2 Process Manager

```bash
pm2 start app.js --name "match-service"
```

## 🔐 Security

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Helmet.js**: Security headers and protections
- **Input Validation**: Joi schema validation for all inputs
- **CORS**: Configurable cross-origin resource sharing

## 🧩 Integration

### With Resume Service
- Fetches candidate profiles and analysis
- Triggers resume analysis if not available

### With Job Service  
- Retrieves job details and requirements
- Accesses job analysis data

### With Frontend
- RESTful API for React/Angular applications
- Real-time status updates for batch operations
- Comprehensive analytics data

## 📈 Performance

- **Concurrent Processing**: Configurable concurrency limits for batch operations
- **Database Indexes**: Optimized MongoDB indexes for fast queries
- **Caching**: Response caching for frequently accessed data
- **Background Processing**: Async processing for long-running operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
