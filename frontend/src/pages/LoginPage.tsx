import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, Typography, message, Space } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginLoading, loginError, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      message.warning('请输入用户名和密码');
      return;
    }
    try {
      await login(username.trim(), password);
      message.success('登录成功，欢迎回来！');
      navigate(from, { replace: true });
    } catch {
      // 错误已由 store 处理
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="SSP" />
          <span>COACH PRO</span>
        </div>

        <Title
          level={3}
          style={{
            textAlign: 'center',
            color: '#edf0ef',
            marginBottom: 8,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          教练员管理平台
        </Title>
        <Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            marginBottom: 32,
            color: '#5a6664',
          }}
        >
          登录以继续使用 SSP COACH PRO
        </Text>

        <form onSubmit={handleSubmit}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: '#5a6664' }} />}
                placeholder="用户名"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError();
                }}
                style={{
                  background: '#0d1414',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#edf0ef',
                  height: 44,
                  fontSize: 14,
                }}
                autoFocus
              />
            </div>

            <div>
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: '#5a6664' }} />}
                placeholder="密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                style={{
                  background: '#0d1414',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#edf0ef',
                  height: 44,
                  fontSize: 14,
                }}
                onPressEnter={() => handleSubmit}
              />
            </div>

            {loginError && (
              <div
                style={{
                  background: 'rgba(244,63,78,0.10)',
                  border: '1px solid rgba(244,63,78,0.30)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: '#f43f4e',
                  fontSize: 13,
                }}
              >
                {loginError}
              </div>
            )}

            <Button
              type="primary"
              htmlType="submit"
              loading={loginLoading}
              block
              size="large"
              style={{
                height: 44,
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 8,
                background: '#a0c040',
                border: 'none',
              }}
            >
              {loginLoading ? '登录中...' : '登 录'}
            </Button>
          </Space>
        </form>

        <Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 24,
            fontSize: 11,
            color: '#5a6664',
          }}
        >
          SSP COACH PRO v1.0 · © 2024 SSP
        </Text>
      </Card>
    </div>
  );
};

export default LoginPage;
