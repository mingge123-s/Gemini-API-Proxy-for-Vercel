import { VercelRequest, VercelResponse } from '@vercel/node';
import { GeminiProxy } from '../src/proxy';

// 创建代理实例
let proxyInstance: GeminiProxy | null = null;

function getProxyInstance(): GeminiProxy {
  if (!proxyInstance) {
    try {
      proxyInstance = new GeminiProxy({
        // 可以从环境变量中读取额外配置
        rateLimit: {
          requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
        }
      });
    } catch (error) {
      console.error('Failed to initialize proxy:', error);
      throw error;
    }
  }
  return proxyInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 获取代理实例
    const proxy = getProxyInstance();
    
    // 处理请求
    await proxy.handleRequest(req, res);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    // 发送错误响应
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Internal server error',
        status: 500
      }
    });
  }
}
