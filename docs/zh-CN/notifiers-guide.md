# 通知器指南

**实现状态**：⚠️ **接口就绪，提供商待定**

## 通知器接口

通知系统采用可插拔架构设计，支持多个提供商。

```typescript
export interface Notifier {
  provider: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
  notify(message: NotifierMessage, config: NotifierConfig): Promise<void>;
}

export interface NotifierMessage {
  title: string;
  content: string;
  operation: 'preview' | 'deploy';
  status: 'success' | 'failure';
  metadata?: {
    framework?: string;
    platform?: string;
    version?: string;
    qrcodeImagePath?: string;
  };
}

export interface NotifierConfig {
  webhook: string;
  provider: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
  headers?: Record<string, string>;
  template?: string;
}
```

## 提供商负载格式

### 飞书 (Feishu)
```json
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {
        "tag": "plain_text",
        "content": "🎉 小程序预览成功"
      },
      "template": "green"
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "lark_md",
          "content": "**框架**: Taro\n**平台**: 微信小程序\n**版本**: 1.0.0\n**描述**: feat: 添加新功能"
        }
      },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": {
              "tag": "plain_text", 
              "content": "查看二维码"
            },
            "type": "primary",
            "url": "file://./preview-qrcode.png"
          }
        ]
      }
    ]
  }
}
```

### 钉钉 (DingTalk)
```json
{
  "msgtype": "actionCard",
  "actionCard": {
    "title": "🎉 小程序预览成功",
    "text": "### 部署详情\n- **框架**: Taro\n- **平台**: 微信小程序\n- **版本**: 1.0.0\n- **描述**: feat: 添加新功能\n\n请扫描二维码进行预览。",
    "btnOrientation": "0",
    "singleTitle": "查看详情",
    "singleURL": "https://your-domain.com/preview"
  }
}
```

### 企业微信 (WeChatWork)
```json
{
  "msgtype": "template_card",
  "template_card": {
    "card_type": "news_notice",
    "source": {
      "icon_url": "https://your-domain.com/icon.png",
      "desc": "mp-nexus-cli"
    },
    "main_title": {
      "title": "🎉 小程序预览成功"
    },
    "emphasis_content": {
      "title": "Taro 项目",
      "desc": "版本 1.0.0"
    },
    "sub_title_text": "feat: 添加新功能",
    "horizontal_content_list": [
      {
        "keyname": "框架",
        "value": "Taro"
      },
      {
        "keyname": "平台", 
        "value": "微信小程序"
      }
    ],
    "card_action": {
      "type": 1,
      "url": "https://your-domain.com/preview"
    }
  }
}
```

## 配置示例

### 基础配置
```javascript
// mp-nexus.config.js
module.exports = {
  // ... 其他配置
  notify: {
    webhook: process.env.FEISHU_WEBHOOK,
    provider: 'feishu'
  }
};
```

### 环境特定配置
```javascript
// mp-nexus.config.js
const env = process.env.NODE_ENV || 'development';

const notifyConfig = {
  development: {
    webhook: 'mock://console', // 仅控制台输出
    provider: 'custom'
  },
  production: {
    webhook: process.env.FEISHU_WEBHOOK,
    provider: 'feishu',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

module.exports = {
  // ... 其他配置
  notify: notifyConfig[env]
};
```

### 多通知提供商
```javascript
// mp-nexus.config.js
module.exports = {
  // ... 其他配置
  notify: [
    {
      webhook: process.env.FEISHU_WEBHOOK,
      provider: 'feishu'
    },
    {
      webhook: process.env.DINGTALK_WEBHOOK,
      provider: 'dingtalk'
    }
  ]
};
```

## 自定义通知提供商

### 创建自定义提供商
```typescript
import { Notifier, NotifierMessage, NotifierConfig } from 'mp-nexus-cli';

export class CustomNotifier implements Notifier {
  provider = 'custom' as const;
  
  async notify(message: NotifierMessage, config: NotifierConfig): Promise<void> {
    // 自定义通知逻辑
    if (config.webhook.startsWith('mock://')) {
      console.log('模拟通知:', message);
      return;
    }
    
    // 发送到自定义 webhook
    const response = await fetch(config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        title: message.title,
        content: message.content,
        operation: message.operation,
        status: message.status,
        ...message.metadata
      })
    });
    
    if (!response.ok) {
      throw new Error(`通知失败: ${response.statusText}`);
    }
  }
}
```

## 消息模板

### 成功预览模板
```typescript
const previewSuccessMessage: NotifierMessage = {
  title: '🎉 小程序预览成功',
  content: `项目已成功构建并生成预览二维码。\n\n**框架**: ${framework}\n**平台**: ${platform}\n**版本**: ${version}\n**描述**: ${description}`,
  operation: 'preview',
  status: 'success',
  metadata: {
    framework,
    platform,
    version,
    qrcodeImagePath: './preview-qrcode.png'
  }
};
```

### 部署成功模板
```typescript
const deploySuccessMessage: NotifierMessage = {
  title: '🚀 小程序部署成功',
  content: `项目已成功构建并上传到平台。\n\n**框架**: ${framework}\n**平台**: ${platform}\n**版本**: ${version}\n**描述**: ${description}`,
  operation: 'deploy',
  status: 'success',
  metadata: {
    framework,
    platform,
    version
  }
};
```

### 失败通知模板
```typescript
const failureMessage: NotifierMessage = {
  title: `❌ 小程序${operation === 'preview' ? '预览' : '部署'}失败`,
  content: `操作失败，请检查构建日志。\n\n**错误**: ${error.message}\n**建议**: ${error.suggestion || '检查配置和依赖'}`,
  operation,
  status: 'failure',
  metadata: {
    framework,
    platform
  }
};
```

## 环境变量

### 推荐的环境变量
```bash
# .env.production
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx
WECHATWORK_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx

# 可选：禁用通知
NEXUS_DISABLE_NOTIFICATIONS=true
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: 部署小程序
  env:
    FEISHU_WEBHOOK: ${{ secrets.FEISHU_WEBHOOK }}
    MP_APP_ID: ${{ secrets.MP_APP_ID }}
    MP_PRIVATE_KEY_PATH: ./private.key
  run: |
    echo "${{ secrets.MP_PRIVATE_KEY }}" > private.key
    nexus deploy --mode production
```

## 最佳实践

### 安全性
- 使用环境变量存储 webhook URL
- 不要在代码中硬编码敏感信息
- 在 CI/CD 中使用机密管理

### 可靠性
- 实现重试机制用于网络故障
- 提供回退选项（如控制台日志）
- 优雅处理通知失败

### 性能
- 异步发送通知，不阻塞主流程
- 批量通知多个提供商
- 缓存通知状态避免重复发送

### 调试
```javascript
// 开发环境使用模拟通知
const config = {
  notify: {
    webhook: 'mock://console',
    provider: 'custom'
  }
};
```

通知系统为团队提供了及时的部署状态反馈，提高了开发和部署流程的透明度和效率。
