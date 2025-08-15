import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        status: 405
      }
    });
    return;
  }

  try {
    // 检查环境变量
    const apiKeysEnv = process.env.GEMINI_API_KEYS || process.env.API_KEYS;
    const hasApiKeys = !!apiKeysEnv;
    const apiKeyCount = hasApiKeys ? apiKeysEnv.split(',').length : 0;
    const hasPassword = !!process.env.PASSWORD;

    // 构建状态响应
    const status = {
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      config: {
        hasApiKeys,
        apiKeyCount,
        hasPassword,
        passwordProtected: hasPassword,
        rateLimit: {
          requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
        }
      },
      endpoints: {
        proxy: '/api/proxy',
        status: '/api/status'
      },
      supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      supportedPaths: [
        '/v1beta/models',
        '/v1beta/models/{model}',
        '/v1beta/models/{model}:generateContent',
        '/v1beta/models/{model}:streamGenerateContent',
        '/v1beta/models/{model}:countTokens',
        '/v1beta/models/{model}:embedContent',
        '/v1beta/models/{model}:batchEmbedContents',
        '/v1/models',
        '/v1/models/{model}',
        '/v1/models/{model}:generateContent',
        '/v1/models/{model}:streamGenerateContent'
      ]
    };

    res.status(200).json(status);

  } catch (error) {
    console.error('Status check error:', error);
    
    res.status(500).json({
      error: {
        code: 'STATUS_CHECK_ERROR',
        message: error.message || 'Failed to check status',
        status: 500
      }
    });
  }
}
