// Types for Gemini AI API based on VertexAI GenerateContentRequest
export interface GenerateContentRequest extends BaseModelParams {
  /** Array of Content */
  contents: Content[];
  /**
   * Optional. The user provided system instructions for the model.
   * Note: only text should be used in parts of Content
   */
  systemInstruction?: string | Content;
  /**
   * Optional. The name of the cached content used as context to serve the prediction.
   * This is the name of a CachedContent and not the cache object itself.
   */
  cachedContent?: string;
}

// Base model parameters interface
export interface BaseModelParams {
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  tools?: Tool[];
  toolConfig?: ToolConfig;
}

export interface Content {
  parts: Part[];
  role?: string;
}

export interface Part {
  text?: string;
  inlineData?: InlineData;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

export interface InlineData {
  mimeType: string;
  data: string;
}

export interface FunctionCall {
  name: string;
  args?: Record<string, any>;
}

export interface FunctionResponse {
  name: string;
  response: Record<string, any>;
}

export interface Tool {
  functionDeclarations?: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface ToolConfig {
  functionCallingConfig?: FunctionCallingConfig;
}

export interface FunctionCallingConfig {
  mode?: string;
  allowedFunctionNames?: string[];
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

export interface GenerationConfig {
  stopSequences?: string[];
  candidateCount?: number;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

// Response types
export interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
}

export interface Candidate {
  content?: Content;
  finishReason?: string;
  index?: number;
  safetyRatings?: SafetyRating[];
}

export interface PromptFeedback {
  blockReason?: string;
  safetyRatings?: SafetyRating[];
}

export interface SafetyRating {
  category: string;
  probability: string;
}

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

// Application-specific types
export interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  alignment: {
    score: number; // 0-100
    explanation: string;
  };
  recommendations: string[];
}

export interface FileUpload {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

export interface AnalyzeProfileInput {
  jobDescription: FileUpload;
  cv: FileUpload;
}

export interface AnalyzeProfileOutput {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}
