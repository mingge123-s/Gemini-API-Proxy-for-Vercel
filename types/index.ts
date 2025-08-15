export interface ProxyConfig {
  allowedOrigins?: string[];
  apiKeys: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  apiKey?: string;
  responseStatus?: number;
  responseTime?: number;
  error?: string;
}

// Gemini API related types
export interface GeminiGenerateRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
    role?: string;
  }>;
  tools?: any[];
  toolConfig?: any;
  safetySettings?: any[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    candidateCount?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseMimeType?: string;
    responseSchema?: any;
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: any[];
  }>;
  promptFeedback?: {
    safetyRatings: any[];
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
