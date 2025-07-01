import axios, { AxiosResponse } from "axios";
import {
  GenerateContentRequest,
  GenerateContentResponse,
  AnalysisResult,
  Content,
  Part,
} from "../types/ai.types";

export class AIService {
  private static readonly API_URL =
    process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
  private static readonly AUTH_TOKEN = process.env.GEMINI_AUTH_TOKEN || "";

  /**
   * Analyze a CV against a job description using Gemini AI
   * @param cvText - Extracted text from CV PDF
   * @param jobDescriptionText - Extracted text from job description PDF
   * @returns Promise<AnalysisResult> - Analysis results
   */
  static async analyzeProfile(
    cvText: string,
    jobDescriptionText: string,
  ): Promise<AnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(cvText, jobDescriptionText);
      const request = this.buildGeminiRequest(prompt);

      const response = await this.callGeminiAPI(request);

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error("Error analyzing profile:", error);
      throw new Error(
        `Failed to analyze profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Build the analysis prompt for Gemini
   * @param cvText - CV content
   * @param jobDescriptionText - Job description content
   * @returns string - Formatted prompt
   */
  private static buildAnalysisPrompt(
    cvText: string,
    jobDescriptionText: string,
  ): string {
    return `
You are an expert HR analyst and recruiter. Analyze the following CV against the job description and provide a comprehensive evaluation.

JOB DESCRIPTION:
${jobDescriptionText}

CANDIDATE CV:
${cvText}

Please provide a detailed analysis in the following JSON format:
{
  "strengths": ["List of candidate's key strengths relevant to the job"],
  "weaknesses": ["List of areas where candidate may be lacking"],
  "alignment": {
    "score": 0-100,
    "explanation": "Detailed explanation of how well the candidate aligns with the job requirements"
  },
  "recommendations": ["Specific recommendations for the candidate or hiring manager"]
}

Focus on:
1. Technical skills match
2. Experience relevance
3. Education alignment
4. Soft skills indicators
5. Career progression
6. Cultural fit indicators
7. Gaps or red flags

Provide specific examples from the CV to support your analysis. Be objective and balanced in your assessment.
`;
  }

  /**
   * Build Gemini API request following GenerateContentRequest format
   * @param prompt - The analysis prompt
   * @returns GenerateContentRequest - Formatted request
   */
  private static buildGeminiRequest(prompt: string): GenerateContentRequest {
    const content: Content = {
      parts: [
        {
          text: prompt,
        } as Part,
      ],
      role: "user",
    };

    // Use minimal VertexAI GenerateContentRequest format
    return {
      contents: [content]
    };
  }

  /**
   * Call Gemini API with the request
   * @param request - GenerateContentRequest
   * @returns Promise<GenerateContentResponse> - API response
   */
  private static async callGeminiAPI(
    request: GenerateContentRequest,
  ): Promise<GenerateContentResponse> {
    try {
      console.log("🚀 Making API request to:", this.API_URL);
      console.log("🔑 Using token:", this.AUTH_TOKEN ? `${this.AUTH_TOKEN.substring(0, 10)}...` : "NONE");
      console.log("📤 Request payload:", JSON.stringify(request, null, 2));

      // Google AI Studio uses ?key= parameter instead of Authorization header
      const apiUrlWithKey = `${this.API_URL}?key=${this.AUTH_TOKEN}`;

      const response: AxiosResponse<GenerateContentResponse> = await axios.post(
        apiUrlWithKey,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        },
      );

      console.log("📥 Response status:", response.status);
      console.log("📥 Response data:", JSON.stringify(response.data, null, 2));

      if (!response.data) {
        throw new Error("Empty response from Gemini API");
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        const responseHeaders = error.response?.headers;

        console.log("🔍 Detailed API Error Response:");
        console.log(`   HTTP Status: ${status} ${statusText}`);
        console.log(`   Response Headers:`, JSON.stringify(responseHeaders, null, 2));
        console.log(`   Response Body:`, JSON.stringify(responseData, null, 2));
        console.log(`   Request URL: ${error.config?.url}`);
        console.log(`   Request Headers:`, JSON.stringify(error.config?.headers, null, 2));
        console.log(`   Request Method: ${error.config?.method}`);

        const message = error.response?.data?.message || error.message;

        if (status === 401) {
          throw new Error(
            "Authentication failed. Please check your API token.",
          );
        } else if (status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (status === 400) {
          throw new Error(`Bad request: ${message}`);
        } else {
          throw new Error(`API request failed: ${message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Parse the Gemini API response and extract analysis results
   * @param response - GenerateContentResponse
   * @returns AnalysisResult - Parsed analysis
   */
  private static parseAnalysisResponse(
    response: GenerateContentResponse,
  ): AnalysisResult {
    try {
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in response");
      }

      const candidate = response.candidates[0];
      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0
      ) {
        throw new Error("No content in response");
      }

      const textPart = candidate.content.parts.find((part) => part.text);
      if (!textPart || !textPart.text) {
        throw new Error("No text content in response");
      }

      // Extract JSON from the response text
      const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Validate and format the response
      return {
        strengths: Array.isArray(analysisData.strengths)
          ? analysisData.strengths
          : [],
        weaknesses: Array.isArray(analysisData.weaknesses)
          ? analysisData.weaknesses
          : [],
        alignment: {
          score:
            typeof analysisData.alignment?.score === "number"
              ? Math.max(0, Math.min(100, analysisData.alignment.score))
              : 0,
          explanation:
            analysisData.alignment?.explanation ||
            "No alignment explanation provided",
        },
        recommendations: Array.isArray(analysisData.recommendations)
          ? analysisData.recommendations
          : [],
      };
    } catch (error) {
      console.error("Error parsing analysis response:", error);

      // Return a fallback analysis if parsing fails
      return {
        strengths: ["Unable to parse detailed analysis"],
        weaknesses: ["Analysis parsing failed"],
        alignment: {
          score: 0,
          explanation: "Could not determine alignment due to parsing error",
        },
        recommendations: ["Please try again or contact support"],
      };
    }
  }

  /**
   * Test API connectivity and authentication
   * @returns Promise<boolean> - True if API is accessible
   */
  static async testConnection(): Promise<boolean> {
    try {
      // Minimal VertexAI GenerateContentRequest format
      const testRequest: GenerateContentRequest = {
        contents: [
          {
            parts: [
              {
                text: "Hello"
              }
            ]
          }
        ]
      };

      console.log("🧪 Testing with minimal request:", JSON.stringify(testRequest, null, 2));

      const response = await this.callGeminiAPI(testRequest);
      const success = Boolean(response.candidates && response.candidates.length > 0);

      if (success) {
        console.log("✅ API test successful!");
        console.log("📥 Response:", JSON.stringify(response, null, 2));
      }

      return success;
    } catch (error) {
      console.error("❌ API connection test failed:", error);
      return false;
    }
}
}
