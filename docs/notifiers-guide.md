# Notifiers Guide

**Implementation Status**: ⚠️ **INTERFACE READY, PROVIDERS PENDING**

## Notifier Interface

The notification system is designed with a pluggable architecture to support multiple providers.

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
}
```

## Provider Payload Formats

### Feishu (飞书)
```json
{
  "msg_type": "text",
  "content": {
    "text": "🎉 Preview completed successfully!\n📦 Framework: taro\n🎯 Platform: weapp\n🏷️ Version: 1.0.0"
  }
}
```

### DingTalk (钉钉)
```json
{
  "msgtype": "text",
  "text": {
    "content": "🎉 Preview completed successfully!\n📦 Framework: taro\n🎯 Platform: weapp\n🏷️ Version: 1.0.0"
  }
}
```

### WeChatWork (企业微信)
```json
{
  "msgtype": "text",
  "text": {
    "content": "🎉 Preview completed successfully!\n📦 Framework: taro\n🎯 Platform: weapp\n🏷️ Version: 1.0.0"
  }
}
```

### Custom
Raw payload passthrough for custom webhook endpoints.

## Configuration

Add notification configuration to your `mp-nexus.config.js`:

```javascript
module.exports = {
  // ... other config
  notify: {
    webhook: process.env.FEISHU_WEBHOOK,
    provider: 'feishu', // 'feishu' | 'dingtalk' | 'wechatwork' | 'custom'
    headers: {
      'Content-Type': 'application/json',
    },
  },
};
```

## Best Practices

### Development & Testing
- Use `mock://...` webhook URLs during testing to avoid external requests
- Test notification formatting before production deployment
- Validate webhook URLs and authentication

### Security
- Store webhook URLs in environment variables, not in configuration files
- Remove sensitive information from notification content (tokens, file paths)
- Use HTTPS webhooks only in production

### Production Implementation
- Implement retry strategies with exponential backoff
- Add timeout handling for webhook requests
- Log notification success/failure for monitoring

## Implementation Status

- ✅ **Interface Design**: Complete notification interface designed
- ✅ **Configuration Support**: Webhook configuration integrated into config system
- ❌ **Provider Implementations**: Specific provider integrations pending
- ✅ **Message Formatting**: Structured message format designed
- ⚠️ **Error Handling**: Basic error handling in place, provider-specific handling needed


