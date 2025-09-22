# GenAI-Powered ATS Resume App

## 🎯 Project Overview

**ATSResumeApp** is a next-generation Applicant Tracking System (ATS) that leverages Generative AI to revolutionize talent acquisition. Unlike traditional keyword-based matching systems, this application uses Large Language Models (LLMs) to understand candidate profiles contextually and match them based on potential, trajectory, and holistic fit.

### Vision Statement
*"Transform talent acquisition from keyword matching to intelligent understanding"*

This system understands:
- **Who the candidate really is** (beyond skill tags)
- **What they're capable of achieving** (based on track record and potential)
- **How they might fit** into specific team dynamics and challenges
- **Their growth trajectory** and career aspirations

---

## 🚀 Key Features

### 🤖 GenAI-Powered Resume Analysis
- **Contextual Skill Assessment**: Understand skill proficiency levels and practical application
- **Career Trajectory Analysis**: Identify growth patterns, leadership progression, domain expertise
- **Achievement Impact Extraction**: Quantify business impact and problem-solving capabilities
- **Intelligent Profile Generation**: Create comprehensive candidate profiles beyond basic resume parsing

### 🎯 Smart Job-Candidate Matching
- **Multi-dimensional Matching**: Technical alignment, cultural fit, growth trajectory, and impact potential
- **Beyond Keywords**: Semantic understanding of roles and capabilities
- **Success Prediction**: AI-powered assessment of candidate success probability
- **Risk Assessment**: Identify potential challenges and growth areas

### 👥 Role-Based Access Control
- **Candidate Portal**: Resume upload, job recommendations, match results
- **Recruiter Dashboard**: Candidate management, job posting, match analysis
- **Admin Panel**: System management and user administration

### 🔐 Enterprise-Grade Security
- JWT-based authentication with role-based authorization
- Data sanitization and validation
- Rate limiting and security headers
- Secure file upload and processing

---

## 🏗️ Architecture & Technology Stack

### Architecture Pattern
**Microservices Architecture** with API Gateway pattern for scalability and maintainability.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway       │    │  Authentication │    │   Notification  │
│   Service       │    │   Service       │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Resume        │    │    Job          │    │   GenAI Match   │
│   Service       │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
    │                            │                            │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Candidate     │    │   User          │    │   Bookmark      │
│   Service       │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Backend Technology Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: Azure OpenAI Integration (GPT-4o-mini)
- **Authentication**: JWT with bcryptjs encryption
- **Security**: Helmet, CORS, express-rate-limit
- **File Processing**: Multer, PDF-parse, Mammoth (for document parsing)
- **API Documentation**: Swagger UI
- **Logging**: Winston for structured logging
- **Validation**: Joi and express-validator
- **Cloud Storage**: AWS SDK integration

### Frontend Technology Stack
- **Framework**: React 19.1.1 with modern hooks
- **Routing**: React Router DOM v7.8.1
- **Build Tool**: Vite for fast development and optimized builds
- **Code Quality**: ESLint with React-specific rules
- **Styling**: Modern CSS with responsive design

### Infrastructure & DevOps
- **Containerization**: Docker support (Dockerfiles included)
- **Process Management**: PM2-ready with ecosystem files
- **Environment Management**: dotenv for configuration
- **API Gateway**: Custom Express proxy with load balancing
- **Monitoring**: Health check endpoints across all services

---

## 🛠️ Microservices Breakdown

### 1. **Gateway Service** (`gateway-service/`)
- **Purpose**: API Gateway and request routing
- **Features**: Rate limiting, CORS, authentication middleware
- **Port**: 4000 (configurable)

### 2. **User Service** (`user-service/`)
- **Purpose**: User management and authentication
- **Features**: Registration, login, role-based access control
- **Technology**: Express.js, MongoDB, JWT, bcryptjs
- **Port**: 4001

### 3. **Resume Service** (`resume-service/`)
- **Purpose**: Resume upload, processing, and storage
- **Features**: File upload (PDF/DOC), text extraction, metadata storage
- **Technology**: Multer, PDF-parse, Mammoth, AWS S3
- **Port**: 4003

### 4. **Job Service** (`job-service/`)
- **Purpose**: Job posting and management
- **Features**: CRUD operations for job listings, role-based access
- **Port**: 4002

### 5. **Match Service** (`match-service/`)
- **Purpose**: AI-powered candidate-job matching
- **Features**: GenAI integration, intelligent scoring, multi-dimensional analysis
- **Technology**: Azure OpenAI, advanced prompt engineering
- **Port**: 4004

### 6. **Candidate Service** (`candidate-service/`)
- **Purpose**: Candidate profile management
- **Features**: Profile creation, skill tracking, preference management
- **Port**: 4005

### 7. **Notification Service** (`notification-service/`)
- **Purpose**: Event-driven notifications
- **Features**: Email notifications, system alerts, match notifications
- **Port**: 4006

### 8. **Bookmark Service** (`bookmark-service/`)
- **Purpose**: User bookmarking and favorites
- **Features**: Save jobs, bookmark candidates, preference tracking
- **Port**: 4007

---

## 💻 Best Coding Practices Implemented

### 🏗️ Architecture Best Practices
1. **Microservices Design**
   - Single Responsibility Principle for each service
   - Loose coupling with API-based communication
   - Service independence and deployability

2. **API Gateway Pattern**
   - Centralized request routing and load balancing
   - Cross-cutting concerns (authentication, rate limiting)
   - Service discovery and health checking

3. **Stateless Design**
   - No session storage dependencies
   - JWT-based authentication for scalability
   - Database-driven state management

### 🔒 Security Best Practices
1. **Authentication & Authorization**
   - JWT tokens with proper expiration
   - Role-based access control (RBAC)
   - Password hashing with bcryptjs

2. **Input Validation & Sanitization**
   - Joi schema validation
   - MongoDB injection prevention
   - Express-validator middleware

3. **Security Headers & Middleware**
   - Helmet.js for security headers
   - CORS configuration
   - Rate limiting to prevent abuse

### 🧹 Code Quality Practices
1. **Separation of Concerns**
   - Controller-Service-Model architecture
   - Middleware for cross-cutting concerns
   - Shared utilities and libraries

2. **Error Handling**
   - Centralized error handling middleware
   - Structured logging with Winston
   - Proper HTTP status codes

3. **Configuration Management**
   - Environment-based configuration
   - dotenv for secret management
   - Configurable service endpoints

4. **Code Documentation**
   - Swagger/OpenAPI documentation
   - JSDoc comments for functions
   - README files for each service

### 🔄 Development Practices
1. **Modern JavaScript**
   - ES6+ features and async/await
   - Proper promise handling
   - Modular code organization

2. **API Design**
   - RESTful endpoints
   - Consistent response formats
   - Proper HTTP methods and status codes

3. **File Organization**
   - Clear directory structure
   - Separation of concerns in folders
   - Shared libraries for common functionality

---

## 🎨 Design Patterns & Principles

### 🏛️ Architectural Patterns
1. **Microservices Architecture**
   - Domain-driven service boundaries
   - Independent deployment and scaling
   - Technology diversity support

2. **API Gateway Pattern**
   - Single entry point for client requests
   - Request routing and composition
   - Authentication and authorization gateway

3. **Repository Pattern**
   - Data access abstraction
   - Mongoose models as repositories
   - Testable data layer

### 🔧 Design Principles
1. **SOLID Principles**
   - Single Responsibility: Each service has one purpose
   - Open/Closed: Extensible through configuration
   - Dependency Inversion: Interface-based design

2. **DRY (Don't Repeat Yourself)**
   - Shared utilities in `/shared` directory
   - Reusable middleware components
   - Common configuration patterns

3. **Separation of Concerns**
   - Business logic in services
   - Data access in models
   - Presentation logic in controllers

### 🤖 AI Integration Patterns
1. **Strategy Pattern**
   - Pluggable AI model configurations
   - Multiple prompt strategies
   - Fallback mechanisms

2. **Facade Pattern**
   - GenAI client abstraction
   - Simplified AI service interface
   - Error handling and retry logic

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB database
- Azure OpenAI API access
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/GGupta1983/ATSResumeApp.git
cd ATSResumeApp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Start all services
npm run start:all

# Or start individual services
npm run start:gateway
npm run start:user
npm run start:resume
# ... etc
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
ATSResumeApp/
├── 📁 frontend/                 # React frontend application
├── 📁 gateway-service/          # API Gateway service
├── 📁 user-service/             # User management service
├── 📁 resume-service/           # Resume processing service
├── 📁 job-service/              # Job management service
├── 📁 match-service/            # AI matching service
├── 📁 candidate-service/        # Candidate management service
├── 📁 notification-service/     # Notification service
├── 📁 bookmark-service/         # Bookmarking service
├── 📁 shared/                   # Shared utilities and libraries
├── 📄 package.json              # Root package configuration
├── 📄 .env                      # Environment configuration
├── 📄 start-all-services.js     # Service orchestration script
└── 📄 GenAI_ATS_Design_Document.md  # Detailed design documentation
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- OpenAI for providing the GPT models
- Microsoft Azure for AI services infrastructure
- The open-source community for the amazing tools and libraries

---

## 📞 Contact & Support

For questions, suggestions, or support:
- **GitHub Issues**: [Report bugs or request features](https://github.com/GGupta1983/ATSResumeApp/issues)
- **Documentation**: Check the `GenAI_ATS_Design_Document.md` for detailed technical documentation

---

**Built with ❤️ using modern web technologies and AI innovation**