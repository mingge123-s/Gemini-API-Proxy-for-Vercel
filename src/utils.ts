import { ErrorResponse, RequestLog } from '../types';

// 解析环境变量中的 API Keys
export function parseApiKeys(): string[] {
  const apiKeysEnv = process.env.GEMINI_API_KEYS || process.env.API_KEYS;
  if (!apiKeysEnv) {
    throw new Error('GEMINI_API_KEYS environment variable is required');
  }
  
  return apiKeysEnv.split(',').map(key => key.trim()).filter(key => key.length > 0);
}

// 获取随机 API Key (轮换机制)
export function getRandomApiKey(apiKeys: string[]): string {
  if (apiKeys.length === 0) {
    throw new Error('No API keys available');
  }
  
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
}

// 验证 API Key 格式
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Gemini API key 通常以 "AIza" 开头
  return apiKey.startsWith('AIza') && apiKey.length > 20;
}

// 验证访问密码
export function validatePassword(providedPassword: string): boolean {
  const requiredPassword = process.env.PASSWORD;
  
  // 如果没有设置密码，则不需要验证
  if (!requiredPassword) {
    return true;
  }
  
  return providedPassword === requiredPassword;
}

// 从请求中提取密码
export function extractPassword(req: any): string | null {
  // 优先从查询参数获取
  if (req.query && req.query.password) {
    return req.query.password;
  }
  
  // 从请求头获取
  if (req.headers['x-password']) {
    return req.headers['x-password'];
  }
  
  // 从 Authorization Bearer token 获取（如果不是 API key）
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('AIza')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// 构建 Gemini API URL
export function buildGeminiUrl(path: string): string {
  const baseUrl = 'https://generativelanguage.googleapis.com';
  
  // 确保路径以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return baseUrl + path;
}

// 清理和验证请求头
export function cleanHeaders(headers: Record<string, any>): Record<string, string> {
  const cleanedHeaders: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      // 跳过某些不应该转发的头部
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'accept-encoding', 'content-length'].includes(lowerKey)) {
        cleanedHeaders[key] = String(value);
      }
    }
  }
  
  return cleanedHeaders;
}

// 创建错误响应
export function createErrorResponse(
  code: string, 
  message: string, 
  status: number = 400
): ErrorResponse {
  return {
    error: {
      code,
      message,
      status
    }
  };
}

// 获取客户端 IP
export function getClientIP(req: any): string {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

// 记录请求日志
export function logRequest(log: RequestLog): void {
  const logEntry = {
    timestamp: log.timestamp,
    method: log.method,
    path: log.path,
    ip: log.ip,
    userAgent: log.userAgent,
    responseStatus: log.responseStatus,
    responseTime: log.responseTime,
    error: log.error
  };
  
  console.log('[PROXY]', JSON.stringify(logEntry));
}

// 检查是否是流式请求
export function isStreamRequest(url: string): boolean {
  return url.includes('streamGenerateContent') || url.includes(':streamGenerateContent');
}

// 解析查询参数
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1];
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  
  return params;
}

// 验证请求路径
export function isValidGeminiPath(path: string): boolean {
  const validPatterns = [
    /^\/v1beta\/models$/,                                    // List models
    /^\/v1beta\/models\/[^\/]+$/,                           // Get model
    /^\/v1beta\/models\/[^\/]+:generateContent$/,           // Generate content
    /^\/v1beta\/models\/[^\/]+:streamGenerateContent$/,     // Stream generate
    /^\/v1beta\/models\/[^\/]+:countTokens$/,               // Count tokens
    /^\/v1beta\/models\/[^\/]+:embedContent$/,              // Embed content
    /^\/v1beta\/models\/[^\/]+:batchEmbedContents$/,        // Batch embed
    /^\/v1\/models$/,                                       // List models (v1)
    /^\/v1\/models\/[^\/]+$/,                              // Get model (v1)
    /^\/v1\/models\/[^\/]+:generateContent$/,              // Generate content (v1)
    /^\/v1\/models\/[^\/]+:streamGenerateContent$/,        // Stream generate (v1)
  ];
  
  return validPatterns.some(pattern => pattern.test(path));
}

// 限流内存存储 (仅用于演示，生产环境建议使用 Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 简单的内存限流检查
export function checkRateLimit(
  key: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // 重置或创建新记录
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// 清理过期的限流记录
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 定期清理过期记录
setInterval(cleanupRateLimit, 60000); // 每分钟清理一次
