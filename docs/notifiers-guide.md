# 通知器指南（草稿）

## 协议（Contract）

```ts
export interface Notifier {
  provider: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
  notify(message: NotifierMessage, config: NotifierConfig): Promise<void>;
}
```

## 负载格式（Payloads）

- 飞书：`{ msg_type: 'text', content: { text } }`
- 钉钉：`{ msgtype: 'text', text: { content } }`
- 企业微信：`{ msgtype: 'text', text: { content } }`
- 自定义：原始透传

## 最佳实践

- 测试期间使用 `mock://...` webhook 以避免外部请求
- 避免泄露敏感信息；从日志中移除 token/路径
- 生产实现中加入重试/退避策略


