# 🚀 Resume Service API Testing Guide - Postman Collection

## 🔑 Authentication Setup
**JWT Token:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJyZWNydWl0ZXJAY29tcGFueS5jb20iLCJyb2xlIjoicmVjcnVpdGVyIiwiaWF0IjoxNzU3MzkwNDU4LCJleHAiOjE3NTc0NzY4NTh9.oeEeR-PHSklHieIDSfBtRLracblEJbys1WGmV43Yrs4`

**Base URL:** `http://localhost:4003`

---

## 📋 **1. Health Check** (No Auth Required)
```
Method: GET
URL: http://localhost:4003/health
Headers: None

Expected Response:
{
  "status": "Resume Service healthy",
  "timestamp": "2025-09-09T03:59:58.392Z",
  "genAI": "Available",
  "database": "Connected"
}
```

---

## 📤 **2. Upload Resume** ⭐ CORE
```
Method: POST
URL: http://localhost:4003/resumes/upload
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: multipart/form-data

Body: Form-data
  Key: file
  Value: Select a PDF or DOCX resume file

Expected Response:
{
  "resume_id": "generated_file_id",
  "original_name": "JohnDoe_Resume.pdf",
  "s3_url": "https://bucket.s3.amazonaws.com/file",
  "parsed": {
    "text": "Extracted resume text..."
  },
  "message": "File uploaded to S3, parsed, and stored in MongoDB."
}
```

---

## 📋 **3. List All Resumes** ⭐ CORE
```
Method: GET
URL: http://localhost:4003/resumes
Headers:
  Authorization: Bearer {JWT_TOKEN}

Expected Response:
{
  "count": 2,
  "resumes": [
    {
      "_id": "objectid",
      "resume_id": "file123",
      "original_name": "JohnDoe_Resume.pdf",
      "uploaded_at": "2025-09-09T04:00:00.000Z",
      "s3_url": "https://bucket.s3.amazonaws.com/file123"
    }
  ]
}
```

---

## 📄 **4. Get Resume Details** ⭐ CORE
```
Method: GET
URL: http://localhost:4003/resumes/{resume_id}
Headers:
  Authorization: Bearer {JWT_TOKEN}

Example: http://localhost:4003/resumes/abc123

Expected Response:
{
  "_id": "objectid",
  "resume_id": "abc123",
  "original_name": "JohnDoe_Resume.pdf",
  "parsed": {
    "text": "Full extracted resume text content..."
  },
  "s3_url": "https://bucket.s3.amazonaws.com/abc123",
  "uploaded_at": "2025-09-09T04:00:00.000Z",
  "profileAnalysis": { ... }, // If analysis was run
  "lastAnalyzed": "2025-09-09T04:05:00.000Z"
}
```

---

## 🧠 **5. Generate AI Profile Analysis** ⭐ CORE DIFFERENTIATOR
```
Method: POST
URL: http://localhost:4003/resumes/{resume_id}/analyze
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Example: http://localhost:4003/resumes/abc123/analyze

Expected Response:
{
  "resume_id": "abc123",
  "profileAnalysis": {
    "coreCompetencies": [
      {
        "skill": "React Development",
        "proficiencyLevel": "Expert",
        "yearsOfExperience": 5,
        "contextualEvidence": "Built scalable React applications...",
        "impactIndicators": ["Performance optimization", "Team mentoring"]
      }
    ],
    "leadershipProfile": {
      "hasLeadershipExperience": true,
      "teamSizes": [8, 12],
      "leadershipStyle": "Technical leader with mentoring focus",
      "managementCapabilities": ["Team building", "Technical direction"]
    },
    "careerProgression": {
      "seniorityTrajectory": "Developer → Senior → Tech Lead",
      "growthVelocity": "Fast",
      "domainExpertise": ["Fintech", "E-commerce"],
      "adaptabilityIndicators": ["Technology transitions"]
    },
    "technicalDepth": {
      "architecturalThinking": true,
      "scalabilityExperience": "Designed systems for 1M+ users",
      "innovationCapacity": "High - Multiple patents",
      "technicalLeadershipStyle": "Hands-on architect"
    },
    "collaborationStyle": {
      "crossFunctionalExperience": "Strong Product/Design collaboration",
      "communicationSkills": "Excellent technical writing",
      "mentorshipApproach": "Active mentor for 10+ developers",
      "culturalContributions": ["Engineering culture", "Process improvements"]
    },
    "achievementPatterns": {
      "quantifiableImpacts": [
        "Reduced deployment time from 2h to 15min",
        "Improved performance by 300%"
      ],
      "problemSolvingApproach": "Data-driven with user focus",
      "businessAcumen": "Strong understanding of business impact"
    }
  },
  "lastAnalyzed": "2025-09-09T04:05:00.000Z",
  "message": "Resume analysis completed successfully"
}
```

---

## 📊 **6. Get Candidate Profile** ⭐ CORE DIFFERENTIATOR
```
Method: GET
URL: http://localhost:4003/resumes/{resume_id}/profile
Headers:
  Authorization: Bearer {JWT_TOKEN}

Example: http://localhost:4003/resumes/abc123/profile

Expected Response:
{
  "resume_id": "abc123",
  "original_name": "JohnDoe_Resume.pdf",
  "profileAnalysis": {
    // Same structure as analysis response above
  },
  "lastAnalyzed": "2025-09-09T04:05:00.000Z",
  "analysisVersion": 1
}

Error if not analyzed:
{
  "error": "Profile analysis not available",
  "message": "Use POST /resumes/:id/analyze to generate profile analysis first"
}
```

---

## 📝 **7. Analyze Text Directly** ⭐ CORE DIFFERENTIATOR
```
Method: POST
URL: http://localhost:4003/resumes/analyze-text
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Body:
{
  "text": "John Doe\nSoftware Engineer\n5 years experience in React, Node.js, and Python.\nLed a team of 8 developers at TechCorp.\nBuilt scalable applications handling 1M+ users.\nReduced system latency by 60% through optimization."
}

Expected Response:
{
  "profileAnalysis": {
    // Same comprehensive analysis structure as above
  },
  "analyzedAt": "2025-09-09T04:10:00.000Z",
  "message": "Text analysis completed successfully"
}
```

---

## 🔄 **Testing Workflow Scenarios**

### **Scenario 1: Complete Resume Processing**
1. **Health Check** → Ensure service is running
2. **Upload Resume** → Upload a test PDF/DOCX
3. **List Resumes** → Verify upload appears in list
4. **Get Resume Details** → Review extracted content
5. **Generate AI Analysis** → Create candidate profile
6. **Get Profile** → Review AI-generated insights

### **Scenario 2: Quick Text Analysis**
1. **Health Check** → Ensure service is running
2. **Analyze Text Directly** → Paste resume text from email/LinkedIn
3. **Review Analysis** → Get instant candidate insights

### **Scenario 3: Bulk Resume Review**
1. **List All Resumes** → See all candidates
2. **Get Profile** for each → Review existing analyses
3. **Generate Analysis** for unanalyzed resumes

---

## 🛠 **Postman Collection Setup**

### **Environment Variables:**
```
base_url: http://localhost:4003
jwt_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJyZWNydWl0ZXJAY29tcGFueS5jb20iLCJyb2xlIjoicmVjcnVpdGVyIiwiaWF0IjoxNzU3MzkwNDU4LCJleHAiOjE3NTc0NzY4NTh9.oeEeR-PHSklHieIDSfBtRLracblEJbys1WGmV43Yrs4
```

### **Common Headers:**
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

---

## 🎯 **Success Criteria**

✅ **Health Check** returns 200 with service status  
✅ **File Upload** successfully stores and parses resume  
✅ **List/Get APIs** return proper resume data  
✅ **AI Analysis** generates comprehensive candidate profiles  
✅ **Text Analysis** works with direct text input  
✅ **Error Handling** returns appropriate error messages  

---

## 🚨 **Common Issues & Solutions**

**Issue:** JWT Token expired  
**Solution:** Regenerate token using `node generate-test-token.js`

**Issue:** File upload fails  
**Solution:** Check AWS credentials in .env file

**Issue:** AI Analysis takes too long  
**Solution:** Normal behavior - Azure OpenAI processing can take 10-30 seconds

**Issue:** MongoDB connection error  
**Solution:** Ensure MongoDB is running or check connection string

---

Your Resume Service is now a **focused, GenAI-powered candidate intelligence platform**! 🚀

The core APIs provide everything needed for intelligent resume processing and candidate profiling.
