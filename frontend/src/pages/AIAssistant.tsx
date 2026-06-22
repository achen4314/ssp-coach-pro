import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Typography, Input, Button, Tag, Spin } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const SSE_GREEN = '#a0c040';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/v1/ai/coach-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          history: [...history, { role: 'user', content: trimmed }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('\u65e0\u6cd5\u8bfb\u53d2\u54cd\u5e94\u6d41');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } else if (typeof parsed === 'string') {
                fullContent += parsed;
                setStreamingContent(fullContent);
              }
            } catch {
              fullContent += data;
              setStreamingContent(fullContent);
            }
          }
        }
      }

      if (fullContent) {
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      setStreamingContent('');
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // user cancelled
      } else {
        const errorMsg = err instanceof Error ? err.message : '\u8bfb\u6c42\u5931\u8d25\uff0c\u8bfb\u91cd\u8bd5';
        const errorAssistant: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '\u274c \u9519\u8bef\uff1a' + errorMsg,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorAssistant]);
      }
      setStreamingContent('');
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [input, sending, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Title level={4} style={{ color: '#edf0ef', fontWeight: 600, margin: 0 }}>
            AI \u6559\u7ec3\u52a9\u624b
          </Title>
          <Tag color="green" style={{ background: 'rgba(160,192,64,0.12)', borderColor: 'rgba(160,192,64,0.3)', color: SSE_GREEN, fontWeight: 600, fontSize: 11, borderRadius: 4 }}>
            DeepSeek V4 Pro
          </Tag>
        </div>
      </div>

      <Card bordered={false} style={{ flex: 1, background: '#111818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: 12 }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {messages.length === 0 && !streamingContent && !sending && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
              <RobotOutlined style={{ fontSize: 48, color: SSE_GREEN, marginBottom: 16, opacity: 0.6 }} />
              <Text style={{ color: '#889492', fontSize: 14, marginBottom: 8 }}>\u4f60\u597d\uff0c\u6211\u662f AI \u6559\u7ec3\u52a9\u624b</Text>
              <Text style={{ color: '#5a6664', fontSize: 12 }}>\u6211\u53ef\u4ee5\u5e2f\u4f60\u5206\u6790\u5b66\u5458\u6570\u636e\u3001\u5236\u5b9a\u8bed\u7ec3\u5efa\u8baf\u3001\u89e3\u7b54\u6559\u7ec3\u95ee\u9898</Text>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: msg.role === 'user' ? 'rgba(160,192,64,0.15)' : 'rgba(59,130,246,0.12)',
                border: msg.role === 'user' ? '1px solid rgba(160,192,64,0.3)' : '1px solid rgba(59,130,246,0.3)' }}>
                {msg.role === 'user' ? <UserOutlined style={{ color: SSE_GREEN, fontSize: 14 }} /> : <RobotOutlined style={{ color: '#3b82f6', fontSize: 14 }} />}
              </div>
              <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 12,
                borderTopRightRadius: msg.role === 'user' ? 4 : 12, borderTopLeftRadius: msg.role === 'assistant' ? 4 : 12,
                background: msg.role === 'user' ? 'rgba(160,192,64,0.10)' : '#1a2424',
                border: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.6 }}>
                <Text style={{ color: '#edf0ef', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</Text>
              </div>
            </div>
          ))}

          {streamingContent && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <RobotOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
              </div>
              <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: 4,
                background: '#1a2424', border: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.6 }}>
                <Text style={{ color: '#edf0ef', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{streamingContent}</Text>
                <Spin size="small" style={{ marginLeft: 6 }} />
              </div>
            </div>
          )}

          {sending && !streamingContent && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <RobotOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: 4, background: '#1a2424', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Spin size="small" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Input.TextArea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="\u8f93\u5165\u4f60\u7684\u95ee\u9898\uff0c\u4f8b\u5982\uff1a\u4e3a\u5f20\u4e09\u8bbe\u8ba1\u4e00\u595c\u4e00\u5468\u8bad\u7ec3\u8ba1\u5212" disabled={sending}
          autoSize={{ minRows: 2, maxRows: 5 }}
          style={{ flex: 1, background: '#0d1414', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: '#edf0ef', fontSize: 13, resize: 'none' }} />
        {sending ? (
          <Button danger onClick={handleStop} style={{ height: 'auto', minHeight: 52, borderRadius: 8, fontWeight: 600, fontSize: 12, alignSelf: 'stretch' }}>\u505c\u6b62</Button>
        ) : (
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()}
            style={{ height: 'auto', minHeight: 52, borderRadius: 8, fontWeight: 600, fontSize: 12, alignSelf: 'stretch' }}>\u53d1\u9001</Button>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
