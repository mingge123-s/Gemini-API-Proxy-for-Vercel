/**
 * Gemini API Proxy 使用示例
 * 
 * 这个文件展示了如何使用部署在 Vercel 上的 Gemini API Proxy
 */

// 配置你的代理 URL
const PROXY_BASE_URL = 'https://your-deployment.vercel.app';

// 示例 1: 基本文本生成
async function basicTextGeneration() {
  console.log('\\n=== 基本文本生成示例 ===');
  
  const url = `${PROXY_BASE_URL}/v1beta/models/gemini-pro:generateContent`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '请写一个关于人工智能的简短介绍'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('响应:', result.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 示例 2: 带参数的文本生成
async function textGenerationWithConfig() {
  console.log('\\n=== 带配置参数的文本生成示例 ===');
  
  const url = `${PROXY_BASE_URL}/v1beta/models/gemini-pro:generateContent`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '写一首关于春天的诗'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 200,
          candidateCount: 1
        }
      })
    });

    const result = await response.json();
    console.log('诗歌:', result.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 示例 3: 多轮对话
async function multiTurnConversation() {
  console.log('\\n=== 多轮对话示例 ===');
  
  const url = `${PROXY_BASE_URL}/v1beta/models/gemini-pro:generateContent`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: '你好，我想学习 JavaScript' }]
          },
          {
            role: 'model',
            parts: [{ text: '你好！很高兴帮助你学习 JavaScript。JavaScript 是一种非常流行的编程语言，广泛用于网页开发、服务器端开发和移动应用开发。你想从哪个方面开始学习呢？' }]
          },
          {
            role: 'user',
            parts: [{ text: '我想了解 JavaScript 的基本语法' }]
          }
        ]
      })
    });

    const result = await response.json();
    console.log('AI 回复:', result.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 示例 4: 获取模型列表
async function listModels() {
  console.log('\\n=== 获取模型列表示例 ===');
  
  const url = `${PROXY_BASE_URL}/v1beta/models`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('可用模型:');
    result.models.forEach(model => {
      console.log(`- ${model.name}: ${model.displayName}`);
    });
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 示例 5: Token 计数
async function countTokens() {
  console.log('\\n=== Token 计数示例 ===');
  
  const url = `${PROXY_BASE_URL}/v1beta/models/gemini-pro:countTokens`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '这是一个测试文本，用来计算 token 数量'
              }
            ]
          }
        ]
      })
    });

    const result = await response.json();
    console.log('Token 数量:', result.totalTokens);
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 示例 6: 检查服务状态
async function checkStatus() {
  console.log('\\n=== 检查服务状态示例 ===');
  
  const url = `${PROXY_BASE_URL}/api/status`;
  
  try {
    const response = await fetch(url);
    const status = await response.json();
    
    console.log('服务状态:', JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 运行所有示例
async function runAllExamples() {
  console.log('Gemini API Proxy 示例');
  console.log('请确保已正确配置 PROXY_BASE_URL');
  
  await checkStatus();
  await listModels();
  await countTokens();
  await basicTextGeneration();
  await textGenerationWithConfig();
  await multiTurnConversation();
}

// 如果直接运行此文件，则执行示例
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicTextGeneration,
    textGenerationWithConfig,
    multiTurnConversation,
    listModels,
    countTokens,
    checkStatus,
    runAllExamples
  };
}
