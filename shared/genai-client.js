const { OpenAI } = require('openai');
require('dotenv').config();

class GenAIClient {
  constructor() {
    // Initialize Azure OpenAI client
    this.client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    });
  }

  /**
   * Generic method to call Azure OpenAI with a prompt
   * @param {string} prompt - The prompt to send to the AI
   * @param {Object} options - Additional options for the API call
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || options.maxTokens || 2000,
        ...options
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('GenAI API Error:', error);
      throw new Error(`GenAI API call failed: ${error.message}`);
    }
  }

  /**
   * Test the connection to Azure OpenAI
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    try {
      const response = await this.generateResponse('Hello, this is a test. Please respond with "Connection successful!"', {
        max_tokens: 50,
        temperature: 0.1
      });
      
      console.log('Azure OpenAI Test Response:', response);
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Analyze resume text using GenAI (placeholder for future implementation)
   * @param {string} resumeText - The resume text to analyze
   * @returns {Promise<Object>} - Structured analysis of the resume
   */
  async analyzeResume(resumeText) {
    // This will be implemented in the next step
    const prompt = `Analyze this resume and extract key information:

Resume Text:
${resumeText}

Please provide a brief analysis focusing on:
1. Key skills and technologies
2. Experience level
3. Career progression
4. Notable achievements

Respond in JSON format.`;

    const response = await this.generateResponse(prompt, {
      temperature: 0.3,
      max_tokens: 1500
    });

    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      return { 
        rawAnalysis: response,
        error: 'Failed to parse JSON response',
        parseError: parseError.message
      };
    }
  }
}

module.exports = GenAIClient;
