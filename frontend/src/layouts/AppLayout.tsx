import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Badge, Breadcrumb, Input, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FormOutlined,
  FunnelPlotOutlined,
  ScheduleOutlined,
  FileTextOutlined,
  RobotOutlined,
  BellOutlined,
  SearchOutlined,
  PlusOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/athletes',
    icon: <UserOutlined />,
    label: '学员管理',
  },
  {
    key: '/assessments/new',
    icon: <FormOutlined />,
    label: '新建评估',
  },
  {
    key: '/pipeline',
    icon: <FunnelPlotOutlined />,
    label: '销售漏斗',
  },
  {
    key: '/training',
    icon: <ScheduleOutlined />,
    label: '训练计划',
  },
  {
    key: '/reports',
    icon: <FileTextOutlined />,
    label: '报告中心',
  },
  {
    key: '/ai-assistant',
    icon: <RobotOutlined />,
    label: 'AI 教练助手',
  },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const selectedKey = '/' + location.pathname.split('/')[1] || '/dashboard';

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenu = (info: { key: string }) => {
    if (info.key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const breadcrumbItems = [
    { title: 'SSP' },
    { title: 'COACH PRO' },
  ];

  // Add current page to breadcrumb
  const pathSegments = location.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const pageName = pathSegments[0];
    breadcrumbItems.push({
      title: getPageTitle(pageName),
    } as { title: string });
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {/* ── Sider ── */}
      <Sider
        width={220}
        style={{
          background: '#111818',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <img
            src="/logo.png"
            alt="SSP"
            style={{ width: 26, height: 'auto', borderRadius: 4 }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: '#edf0ef',
              letterSpacing: '-0.01em',
            }}
          >
            COACH PRO
          </span>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          theme="dark"
          style={{
            background: 'transparent',
            borderRight: 'none',
            padding: '12px 8px',
          }}
        />

        {/* Footer User Info */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Avatar
            size={28}
            style={{
              backgroundColor: '#0f1f1f',
              border: '1.5px solid #a0c040',
              fontWeight: 600,
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            {user?.display_name?.[0] || '教'}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#edf0ef' }}>
              {user?.display_name || '教练'}
            </div>
            <div style={{ fontSize: 11, color: '#5a6664' }}>
              {user?.role || '教练员'}
            </div>
          </div>
        </div>
      </Sider>

      {/* ── Main ── */}
      <Layout style={{ marginLeft: 220 }}>
        {/* Header */}
        <Header
          style={{
            background: '#0a0f0f',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 16,
          }}
        >
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} style={{ fontSize: 12 }} />

          <div style={{ flex: 1 }} />

          {/* Search */}
          <Input
            prefix={<SearchOutlined style={{ color: '#5a6664' }} />}
            placeholder="搜索学员、评估、计划... (⌘K)"
            style={{
              width: 280,
              background: '#0d1414',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6,
              fontSize: 12,
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 16 }} />}
                style={{ color: '#889492' }}
              />
            </Badge>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/assessments/new')}
              style={{
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 6,
                height: 32,
              }}
            >
              新建评估
            </Button>

            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={['click']}>
              <Avatar
                size={28}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#0f1f1f',
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {user?.display_name?.[0] || '教'}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: 32,
            overflow: 'auto',
            height: 'calc(100vh - 52px)',
            background: '#0a0f0f',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

function getPageTitle(key: string): string {
  const titles: Record<string, string> = {
    dashboard: '工作台',
    athletes: '学员管理',
    assessments: '新建评估',
    pipeline: '销售漏斗',
    training: '训练计划',
    reports: '报告中心',
    'ai-assistant': 'AI 教练助手',
  };
  return titles[key] || key;
}

export default AppLayout;
