const GenAIClient = require('./shared/genai-client');

async function testGenAI() {
  console.log('🚀 Testing Azure OpenAI Connection...');
  console.log('================================');
  
  const genAI = new GenAIClient();
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const isConnected = await genAI.testConnection();
    
    if (isConnected) {
      console.log('✅ Azure OpenAI connection successful!');
      
      // Test resume analysis (basic)
      console.log('\n2. Testing resume analysis...');
      const sampleResume = `
        Garima Gupta  \n\nPhone: +91 9886672923 | Email: garima83in@gmail.com | LinkedIn: linkedin.com/in/garima-gupta-b95b1a18 | Location: Bengaluru, India\n\nPROFESSIONAL SUMMARY\n\nEngineering Leader with 17+ years of experience building and scaling SaaS-based cloud platforms and leading global engineering teams. Proven track record in enterprise product development, cloud-native architecture, and automation-driven efficiency. Skilled in React, Node.js, Java, microservices, AWS, and CI/CD, with strong expertise in strategic leadership, stakeholder management, and cross-functional delivery. Adept at aligning technology roadmaps with business goals to drive customer adoption, scalability, and operational efficiency. Proven success in building high-performing engineering organizations and scaling SaaS platforms to global enterprise adoption\n\nMANAGEMENT SKILLS\n\nEngineering Leadership & People Management\n\nSaaS Product Development & Delivery\n\nStakeholder & Executive Collaboration\n\nAgile & Scrum Methodologies\n\nCloud-Native Architectures (AWS, Microservices)\n\nAutomation & AI-assisted Development (CI/CD, Copilot)\n\nPerformance Management & Metrics-driven Execution\n\nTECHNICAL SKILLS\n\nFrontend: React.js, Angular\n\nBackend & Databases: Node.js, Java-based Microservices, REST APIs, MongoDB and Express.js\n\nTools: GitHub, Bitbucket, IntelliJ, Eclipse, VS Code, Jira, Figma, Postman, Swagger\n\nCloud & DevOps: AWS (EC2, S3, EBS, ELB, CloudWatch), Docker, Jenkins, CI/CD\n\nAI Tools: GitHub Copilot, ChatGPT (AI-assisted coding, prompt engineering)\n\nAdditional Tools (QA/Testing): Selenium WebDriver, WebDriver IO, TestNG, Cucumber (BDD), Serenity\n\nPROFESSIONAL EXPERIENCE (17+ Years)\n\nEngineering Manager | iCIMS Pvt Ltd | Mar 2023 – Present | Bengaluru\n\nLead 3 cross-functional scrum teams (FE, BE, QA, Product) delivering SaaS talent acquisition solute\n\nions for enterprise customers.\n\nDrove cloud-native architecture adoption (AWS, microservices) improving scalability and reducing infra costs.\n\nSpearheaded integrations with Facebook & WeChat, expanding product reach and boosting global adoption.\n\nIntroduced automation & AI-assisted coding practices (Copilot, CI/CD), cutting cycle time by 30% and improving engineering efficiency.\n\nMentored new Engineering Managers and technical leads, fostering a high-performance engineering culture.\n\nImproved team retention by 15% by launching mentorship and recognition programs.\n\nEnabled 3 engineers to step into lead roles via structured career development.\n\nKey Projects:\n\nOptimized frontend performance (React/Angular) reducing load times by 20%.\n\nIntegrated CMS with Career Sites, enhancing customer branding and candidate experience.\n\n\n\n\n\nEngineering Manager | GlobalLogic & iCIMS | Sep 2020 – Feb 2023 | Bengaluru\n\nOwned end-to-end delivery for SaaS HR Tech platforms, from architecture to release.\n\nManaged a 20+ member distributed engineering team, delivering features with 35% faster timelines.\n\nPartnered with product leadership to streamline data integration workflows, reducing onboarding time by 45%.\n\nChampioned engineering excellence (code reviews, KRAs, metrics) improving release predictability.\n\nScaled team from 10 → 20 engineers while keeping attrition under 5%.\n\n\n\nKey Projects:\n\nLed ATS integrations ensuring seamless HRIS-to-iCIMS data transfer, improving data accuracy by 30%.\n\n\n\nAutomation Manager | Yodlee Infotech | Sep 2018 – Jul 2019 | Bengaluru\n\nDirected automation initiatives, increasing test coverage by 45% and reducing defects by 30%.\n\nStreamlined automation processes, accelerating release cycles.\n\n\n\nEngineering Productivity Lead (formerly Automation Test Lead/Manager) | GE Transportation | Jul 2015 – Jul 2018 | Bengaluru\n\nLed engineering enablement initiatives, building automation frameworks that improved test coverage by 55% and reduced manual effort by 35%.\n\nPartnered with development teams to integrate quality practices into the software delivery lifecycle, boosting product reliability and reducing release risks.\n\nIntroduced reusable automation frameworks (Rest Assured, Protractor) that shortened release cycles and improved feature rollout velocity.\n\n\n\nEngineering Enablement Specialist (formerly Test Engineer) | NDS / CISCO Video Technologies | Apr 2006 – Dec 2014 | Bengaluru\n\nDeveloped automation frameworks that reduced defects by 35% and improved testing efficiency by 45%, directly enhancing customer experience with video products.\n\nCollaborated with product and development teams to establish continuous validation practices, ensuring scalability and reliability of enterprise-grade video platforms.\n\nContributed to end-to-end delivery of video solutions, enabling faster go-to-market and higher customer retention.\n\nEDUCATION\n\n\n\nMBA, CHRIST (Pondicherry University), 2006 – Bengaluru, India  \n\nBCA, Bangalore University, 2004 – Bengaluru, India\n\n
      `;
      
      const analysis = await genAI.analyzeResume(sampleResume);
      console.log('✅ Resume analysis test completed!');
      console.log('Analysis result:', JSON.stringify(analysis, null, 2));
      
    } else {
      console.log('❌ Connection test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGenAI();
