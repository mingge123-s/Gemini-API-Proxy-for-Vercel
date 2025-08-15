# Gemini API Proxy for Vercel

一个可以部署在 Vercel 上的 Gemini API 代理服务，支持多 API Key 轮换、限流、CORS 等功能。

## 🌟 特性

- ✅ **Vercel 部署支持** - 一键部署到 Vercel 平台
- ✅ **多 API Key 支持** - 支持配置多个 API Key 进行负载均衡
- ✅ **完整 API 代理** - 支持所有 Gemini API 端点
- ✅ **流式响应支持** - 支持 streamGenerateContent 等流式 API
- ✅ **限流保护** - 内置请求限流机制
- ✅ **CORS 支持** - 完整的跨域请求支持
- ✅ **错误处理** - 完善的错误处理和日志记录
- ✅ **TypeScript 支持** - 完整的 TypeScript 类型定义
- ✅ **状态监控** - 提供服务状态检查端点

## 🚀 快速开始

### 部署到 Vercel

1. **Fork 或下载此项目**

2. **获取 Gemini API Key**
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建新的 API Key
   - 复制 API Key (格式通常为 `AIzaSy...`)

3. **部署到 Vercel**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
   
   或者使用 Vercel CLI：
   ```bash
   npm i -g vercel
   vercel --prod
   ```

4. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：
   ```
   GEMINI_API_KEYS=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   
   支持多个 API Key（用逗号分隔）：
   ```
   GEMINI_API_KEYS=AIzaSyXXX...,AIzaSyYYY...,AIzaSyZZZ...
   ```

5. **测试部署**
   ```bash
   curl https://your-deployment.vercel.app/api/status
   ```

### 本地开发

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd gemini-proxy-vercel
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加你的 API Key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问服务**
   - API 代理: http://localhost:3000/api/proxy
   - 状态检查: http://localhost:3000/api/status

## 📖 使用方法

### 基本用法

将所有对 Gemini API 的请求从：
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

改为：
```
https://your-deployment.vercel.app/v1beta/models/gemini-pro:generateContent
```

### 示例请求

#### 文本生成
```bash
curl -X POST 'https://your-deployment.vercel.app/v1beta/models/gemini-pro:generateContent' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Hello, how are you?"
          }
        ]
      }
    ]
  }'
```

#### 流式生成
```bash
curl -X POST 'https://your-deployment.vercel.app/v1beta/models/gemini-pro:streamGenerateContent' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Write a short story"
          }
        ]
      }
    ]
  }'
```

#### 模型列表
```bash
curl 'https://your-deployment.vercel.app/v1beta/models'
```

#### 使用密码保护的请求
如果设置了 `PASSWORD` 环境变量，可以通过以下方式提供密码：

**方式 1: 查询参数**
```bash
curl 'https://your-deployment.vercel.app/v1beta/models?password=your_password'
```

**方式 2: 请求头**
```bash
curl 'https://your-deployment.vercel.app/v1beta/models' \\
  -H 'x-password: your_password'
```

**方式 3: Authorization 头**
```bash
curl 'https://your-deployment.vercel.app/v1beta/models' \\
  -H 'Authorization: Bearer your_password'
```

### 在代码中使用

#### JavaScript/TypeScript
```javascript
// 原来的调用方式
const originalUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY';

// 使用代理的调用方式（无需传递 API Key）
const proxyUrl = 'https://your-deployment.vercel.app/v1beta/models/gemini-pro:generateContent';

const response = await fetch(proxyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [{ text: 'Hello, world!' }]
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

#### Python
```python
import requests

url = "https://your-deployment.vercel.app/v1beta/models/gemini-pro:generateContent"
payload = {
    "contents": [
        {
            "parts": [
                {"text": "Hello, world!"}
            ]
        }
    ]
}

response = requests.post(url, json=payload)
result = response.json()
print(result)
```

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `GEMINI_API_KEYS` | ✅ | - | Gemini API Keys，多个用逗号分隔 |
| `API_KEYS` | - | - | API Keys 的别名（可选） |
| `PASSWORD` | - | - | 访问密码（可选），设置后需要提供密码才能使用代理 |
| `RATE_LIMIT_REQUESTS` | - | 100 | 每个时间窗口的最大请求数 |
| `RATE_LIMIT_WINDOW_MS` | - | 60000 | 限流时间窗口（毫秒） |

### 支持的 API 端点

- `/v1beta/models` - 列出所有模型
- `/v1beta/models/{model}` - 获取特定模型信息
- `/v1beta/models/{model}:generateContent` - 生成内容
- `/v1beta/models/{model}:streamGenerateContent` - 流式生成内容
- `/v1beta/models/{model}:countTokens` - 计算 Token 数量
- `/v1beta/models/{model}:embedContent` - 生成嵌入向量
- `/v1beta/models/{model}:batchEmbedContents` - 批量生成嵌入向量
- `/v1/models/*` - v1 版本的所有端点

## 🛠️ 开发

### 项目结构
```
gemini-proxy-vercel/
├── api/                    # Vercel API 端点
│   ├── proxy.ts           # 主代理端点
│   └── status.ts          # 状态检查端点
├── src/                   # 源代码
│   ├── proxy.ts           # 代理核心逻辑
│   └── utils.ts           # 工具函数
├── types/                 # TypeScript 类型定义
│   └── index.ts           # 类型定义
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vercel.json           # Vercel 配置
└── README.md             # 项目文档
```

### 构建项目
```bash
npm run build
```

### 部署到 Vercel
```bash
npm run deploy
```

## 📊 监控

### 状态检查
访问 `/api/status` 端点获取服务状态：

```json
{
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "config": {
    "hasApiKeys": true,
    "apiKeyCount": 2,
    "rateLimit": {
      "requests": 100,
      "windowMs": 60000
    }
  },
  "endpoints": {
    "proxy": "/api/proxy",
    "status": "/api/status"
  }
}
```

### 日志监控
在 Vercel 控制台中查看函数日志，每个请求都会记录：
- 请求时间戳
- HTTP 方法和路径
- 客户端 IP
- 响应状态和耗时
- 错误信息（如果有）

## 🔒 安全考虑

1. **API Key 保护**: API Key 存储在服务器端环境变量中，不会暴露给客户端
2. **限流保护**: 内置基于 IP 的请求限流，防止滥用
3. **路径验证**: 只允许访问有效的 Gemini API 端点
4. **CORS 配置**: 可配置允许的来源域名

## ❗ 注意事项

1. **API Key 安全**: 请妥善保管 API Key，不要在代码中硬编码
2. **使用限制**: 遵守 Google Gemini API 的使用条款和限制
3. **限流设置**: 根据你的使用需求调整限流参数
4. **监控使用量**: 定期检查 API 使用量，避免超出配额

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Google Gemini API 文档](https://ai.google.dev/docs)
- [Vercel 部署文档](https://vercel.com/docs)
- [原项目参考 - hajimi](https://github.com/wyeeeee/hajimi)

---

如有问题，请提交 [Issue](../../issues) 或查看 [Wiki](../../wiki) 获取更多帮助。
