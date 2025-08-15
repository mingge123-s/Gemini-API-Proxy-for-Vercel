# 部署到 Vercel 指南

## 方法 1: 通过 GitHub 部署（推荐）

### 1. 创建 GitHub 仓库

1. **初始化 Git 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Gemini API Proxy for Vercel"
   ```

2. **在 GitHub 上创建新仓库**
   - 访问 [GitHub](https://github.com)
   - 点击右上角的 "+" -> "New repository"
   - 仓库名称：`gemini-proxy-vercel`
   - 设为公开（Public）或私有（Private）
   - 不要勾选 "Initialize this repository with a README"
   - 点击 "Create repository"

3. **连接本地仓库到 GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/gemini-proxy-vercel.git
   git branch -M main
   git push -u origin main
   ```
   
   将 `YOUR_USERNAME` 替换为你的 GitHub 用户名。

### 2. 部署到 Vercel

1. **访问 Vercel**
   - 去 [Vercel](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 从 GitHub 导入你刚才创建的 `gemini-proxy-vercel` 仓库
   - 点击 "Import"

3. **配置项目**
   - 项目名称：`gemini-proxy-vercel`（或自定义）
   - Framework Preset：Vercel 会自动检测
   - Build and Output Settings：保持默认
   - 点击 "Deploy"

4. **配置环境变量**
   - 部署完成后，进入项目设置 (Settings)
   - 点击左侧的 "Environment Variables"
   - 添加以下环境变量：

   **必需的环境变量：**
   ```
   Name: GEMINI_API_KEYS
   Value: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

   **可选的环境变量：**
   ```
   Name: PASSWORD
   Value: your_secure_password_here
   
   Name: RATE_LIMIT_REQUESTS
   Value: 100
   
   Name: RATE_LIMIT_WINDOW_MS
   Value: 60000
   ```

5. **重新部署**
   - 添加环境变量后，点击 "Deployments" 标签
   - 点击最新部署旁边的三个点，选择 "Redeploy"

### 3. 测试部署

1. **获取部署 URL**
   - 在 Vercel 项目页面，你会看到部署的 URL（通常是 `https://your-project-name.vercel.app`）

2. **测试状态端点**
   ```bash
   curl https://your-project-name.vercel.app/api/status
   ```

3. **测试代理功能**
   ```bash
   # 不使用密码（如果未设置 PASSWORD）
   curl 'https://your-project-name.vercel.app/v1beta/models'
   
   # 使用密码（如果设置了 PASSWORD）
   curl 'https://your-project-name.vercel.app/v1beta/models?password=your_password'
   ```

## 方法 2: 直接从本地部署

如果你不想使用 GitHub，也可以直接从本地部署：

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel --prod
   ```

4. **配置环境变量**
   ```bash
   vercel env add GEMINI_API_KEYS
   # 输入你的 API Key
   
   vercel env add PASSWORD
   # 输入你的密码（可选）
   ```

5. **重新部署**
   ```bash
   vercel --prod
   ```

## 配置自定义域名（可选）

1. **在 Vercel 项目设置中**
   - 点击 "Domains" 标签
   - 添加你的自定义域名
   - 按照提示配置 DNS 记录

2. **更新域名解析**
   - 在你的域名提供商处添加 CNAME 记录
   - 指向 Vercel 提供的目标地址

## 环境变量说明

| 环境变量名 | 必需 | 说明 | 示例 |
|------------|------|------|------|
| `GEMINI_API_KEYS` | ✅ | Gemini API Keys，多个用逗号分隔 | `AIzaSyXXX...,AIzaSyYYY...` |
| `PASSWORD` | ❌ | 访问密码，设置后需要验证 | `my_secure_password` |
| `RATE_LIMIT_REQUESTS` | ❌ | 每分钟最大请求数 | `100` |
| `RATE_LIMIT_WINDOW_MS` | ❌ | 限流时间窗口（毫秒） | `60000` |

## 使用你的代理

部署成功后，将所有对 Gemini API 的请求从：
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

替换为：
```
https://your-project-name.vercel.app/v1beta/models/gemini-pro:generateContent
```

## 监控和维护

1. **查看日志**
   - 在 Vercel 项目页面，点击 "Functions" 查看函数日志
   - 所有请求都会被记录，包括错误信息

2. **更新代码**
   - 直接推送代码到 GitHub，Vercel 会自动重新部署
   ```bash
   git add .
   git commit -m "Update proxy configuration"
   git push origin main
   ```

3. **监控使用量**
   - 在 Vercel 项目页面查看函数调用次数和带宽使用情况
   - 注意 Vercel 的免费配额限制

## 故障排除

1. **部署失败**
   - 检查环境变量是否正确设置
   - 确保 `GEMINI_API_KEYS` 包含有效的 API Key

2. **API 请求失败**
   - 检查 Vercel 函数日志中的错误信息
   - 确认 API Key 格式正确且有效
   - 验证请求路径是否符合 Gemini API 规范

3. **密码验证失败**
   - 确保请求中包含正确的密码
   - 检查密码传递方式（查询参数、头部或 Authorization）

需要帮助？请在 GitHub Issues 中提问！
