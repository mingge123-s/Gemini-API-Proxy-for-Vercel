// 简化的Gemini API代理
const https = require('https');
const http = require('http');
const { URL } = require('url');

// 解析API Keys
function parseApiKeys() {
  const apiKeysEnv = process.env.GEMINI_API_KEYS || process.env.API_KEYS;
  if (!apiKeysEnv) {
    throw new Error('GEMINI_API_KEYS environment variable is required');
  }
  return apiKeysEnv.split(',').map(key => key.trim()).filter(key => key.length > 0);
}

// 获取随机API Key
function getRandomApiKey(apiKeys) {
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
}

// 验证API Key格式
function validateApiKey(apiKey) {
  return apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;
}

// 验证访问密码
function validatePassword(req) {
  const requiredPassword = process.env.PASSWORD;
  if (!requiredPassword) return true;
  
  const providedPassword = req.query?.password || 
                          req.headers['x-password'] || 
                          (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ') ? 
                           req.headers['authorization'].substring(7) : null);
  
  return providedPassword === requiredPassword;
}

// 构建Gemini API URL
function buildGeminiUrl(originalUrl, apiKey) {
  const baseUrl = 'https://generativelanguage.googleapis.com';
  const url = new URL(originalUrl, 'https://example.com');
  const targetUrl = baseUrl + url.pathname + url.search;
  const finalUrl = new URL(targetUrl);
  finalUrl.searchParams.set('key', apiKey);
  return finalUrl.toString();
}

// 主处理函数
module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-password');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  try {
    // 验证密码
    if (!validatePassword(req)) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid or missing password',
          status: 401
        }
      });
      return;
    }
    
    // 获取API Keys
    const apiKeys = parseApiKeys();
    const apiKey = getRandomApiKey(apiKeys);
    
    if (!validateApiKey(apiKey)) {
      res.status(500).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key configuration',
          status: 500
        }
      });
      return;
    }
    
    // 构建目标URL
    const targetUrl = buildGeminiUrl(req.url, apiKey);
    
    // 准备请求选项
    const requestBody = req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined;
    
    // 发送请求到Gemini API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.headers['user-agent'] || 'Gemini-Proxy/1.0'
      },
      body: requestBody
    });
    
    // 转发响应
    const responseData = await response.text();
    
    // 设置响应头
    response.headers.forEach((value, key) => {
      if (!['connection', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    res.status(response.status).send(responseData);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: {
        code: 'PROXY_ERROR',
        message: error.message || 'Internal proxy error',
        status: 500
      }
    });
  }
};
