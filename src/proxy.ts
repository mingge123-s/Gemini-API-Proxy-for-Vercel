import { 
  ProxyConfig, 
  ProxyRequest, 
  ProxyResponse, 
  ErrorResponse,
  RequestLog 
} from '../types';
import { 
  parseApiKeys,
  getRandomApiKey,
  validateApiKey,
  buildGeminiUrl,
  cleanHeaders,
  createErrorResponse,
  getClientIP,
  logRequest,
  isStreamRequest,
  parseQueryParams,
  isValidGeminiPath,
  checkRateLimit,
  validatePassword,
  extractPassword
} from './utils';

export class GeminiProxy {
  private config: ProxyConfig;
  
  constructor(config?: Partial<ProxyConfig>) {
    try {
      const apiKeys = parseApiKeys();
      this.config = {
        apiKeys,
        allowedOrigins: config?.allowedOrigins || ['*'],
        rateLimit: config?.rateLimit || {
          requests: 100,
          windowMs: 60000 // 1 minute
        }
      };
    } catch (error) {
      throw new Error(`Failed to initialize proxy: ${error.message}`);
    }
  }

  // 处理代理请求
  async handleRequest(req: any, res: any): Promise<void> {
    const startTime = Date.now();
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // 创建请求日志
    const requestLog: RequestLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
      ip: clientIP,
      userAgent
    };

    try {
      // OPTIONS 请求处理 (CORS预检)
      if (req.method === 'OPTIONS') {
        this.handleOptions(res);
        requestLog.responseStatus = 200;
        requestLog.responseTime = Date.now() - startTime;
        logRequest(requestLog);
        return;
      }

      // 验证访问密码（如果设置了）
      const providedPassword = extractPassword(req);
      if (!validatePassword(providedPassword)) {
        const error = createErrorResponse(
          'AUTHENTICATION_FAILED',
          'Invalid or missing password',
          401
        );
        this.sendErrorResponse(res, error);
        requestLog.responseStatus = 401;
        requestLog.error = error.error.message;
        requestLog.responseTime = Date.now() - startTime;
        logRequest(requestLog);
        return;
      }

      // 验证请求路径
      const urlPath = new URL(req.url, 'https://example.com').pathname;
      if (!isValidGeminiPath(urlPath)) {
        const error = createErrorResponse(
          'INVALID_PATH',
          `Invalid Gemini API path: ${urlPath}`,
          400
        );
        this.sendErrorResponse(res, error);
        requestLog.responseStatus = 400;
        requestLog.error = error.error.message;
        requestLog.responseTime = Date.now() - startTime;
        logRequest(requestLog);
        return;
      }

      // 限流检查
      const rateLimitResult = checkRateLimit(
        clientIP,
        this.config.rateLimit?.requests,
        this.config.rateLimit?.windowMs
      );
      
      if (!rateLimitResult.allowed) {
        const error = createErrorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded. Please try again later.',
          429
        );
        res.setHeader('X-RateLimit-Limit', this.config.rateLimit?.requests || 100);
        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
        this.sendErrorResponse(res, error);
        requestLog.responseStatus = 429;
        requestLog.error = error.error.message;
        requestLog.responseTime = Date.now() - startTime;
        logRequest(requestLog);
        return;
      }

      // 获取可用的 API Key
      const apiKey = getRandomApiKey(this.config.apiKeys);
      if (!validateApiKey(apiKey)) {
        const error = createErrorResponse(
          'INVALID_API_KEY',
          'Invalid or missing API key configuration',
          500
        );
        this.sendErrorResponse(res, error);
        requestLog.responseStatus = 500;
        requestLog.error = error.error.message;
        requestLog.responseTime = Date.now() - startTime;
        logRequest(requestLog);
        return;
      }

      requestLog.apiKey = apiKey.substring(0, 10) + '...'; // 只记录部分key用于调试

      // 构建目标 URL
      const targetUrl = buildGeminiUrl(req.url);
      
      // 准备请求参数
      const proxyReq: ProxyRequest = {
        method: req.method,
        url: targetUrl,
        headers: this.prepareHeaders(req.headers, apiKey),
        body: req.body
      };

      // 发送代理请求
      const proxyResponse = await this.sendProxyRequest(proxyReq);
      
      // 设置响应头
      this.setResponseHeaders(res, proxyResponse.headers);
      res.setHeader('X-RateLimit-Limit', this.config.rateLimit?.requests || 100);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      
      // 处理流式响应
      if (isStreamRequest(req.url)) {
        await this.handleStreamResponse(proxyResponse, res);
      } else {
        // 常规响应
        res.status(proxyResponse.status).json(proxyResponse.data);
      }

      requestLog.responseStatus = proxyResponse.status;
      requestLog.responseTime = Date.now() - startTime;
      logRequest(requestLog);

    } catch (error) {
      console.error('Proxy error:', error);
      const errorResponse = createErrorResponse(
        'PROXY_ERROR',
        error.message || 'Internal proxy error',
        500
      );
      this.sendErrorResponse(res, errorResponse);
      requestLog.responseStatus = 500;
      requestLog.error = error.message;
      requestLog.responseTime = Date.now() - startTime;
      logRequest(requestLog);
    }
  }

  // 处理 OPTIONS 请求
  private handleOptions(res: any): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
  }

  // 准备请求头
  private prepareHeaders(originalHeaders: Record<string, any>, apiKey: string): Record<string, string> {
    const headers = cleanHeaders(originalHeaders);
    
    // 移除可能的认证头
    delete headers['authorization'];
    delete headers['x-api-key'];
    
    // 设置内容类型
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
    
    // 添加 API Key 到查询参数将在 URL 中处理
    return headers;
  }

  // 发送代理请求
  private async sendProxyRequest(proxyReq: ProxyRequest): Promise<ProxyResponse> {
    const apiKey = getRandomApiKey(this.config.apiKeys);
    
    // 将 API Key 添加到 URL 的查询参数中
    const urlWithKey = this.addApiKeyToUrl(proxyReq.url, apiKey);
    
    const fetchOptions: RequestInit = {
      method: proxyReq.method,
      headers: proxyReq.headers,
    };

    // 添加请求体（如果存在）
    if (proxyReq.body && ['POST', 'PUT', 'PATCH'].includes(proxyReq.method)) {
      fetchOptions.body = typeof proxyReq.body === 'string' 
        ? proxyReq.body 
        : JSON.stringify(proxyReq.body);
    }

    const response = await fetch(urlWithKey, fetchOptions);
    
    // 获取响应头
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 对于流式响应，直接返回 response 对象
    if (isStreamRequest(proxyReq.url)) {
      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: response // 返回 Response 对象用于流式处理
      };
    }

    // 获取响应数据
    let data: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.arrayBuffer();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data
    };
  }

  // 在 URL 中添加 API Key
  private addApiKeyToUrl(url: string, apiKey: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('key', apiKey);
    return urlObj.toString();
  }

  // 设置响应头
  private setResponseHeaders(res: any, headers: Record<string, string>): void {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    
    // 转发其他相关头部
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (!['connection', 'transfer-encoding', 'content-encoding'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    }
  }

  // 处理流式响应
  private async handleStreamResponse(proxyResponse: ProxyResponse, res: any): Promise<void> {
    const response = proxyResponse.data as Response;
    
    // 设置流式响应头
    res.setHeader('Content-Type', response.headers.get('content-type') || 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(response.status);
    
    // 检查是否有可读流
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } else {
      // 如果没有流，发送普通响应
      const text = await response.text();
      res.send(text);
    }
  }

  // 发送错误响应
  private sendErrorResponse(res: any, error: ErrorResponse): void {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(error.error.status).json(error);
  }

  // 获取代理状态
  getStatus(): { status: string; apiKeysCount: number; config: Partial<ProxyConfig> } {
    return {
      status: 'running',
      apiKeysCount: this.config.apiKeys.length,
      config: {
        allowedOrigins: this.config.allowedOrigins,
        rateLimit: this.config.rateLimit
      }
    };
  }
}
