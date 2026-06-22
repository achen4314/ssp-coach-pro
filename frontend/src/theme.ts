import type { ThemeConfig } from 'antd';

export const sspTheme: ThemeConfig = {
  token: {
    colorPrimary: '#a0c040',
    colorBgBase: '#0a0f0f',
    colorBgContainer: '#111818',
    colorBgElevated: '#1a2424',
    colorText: '#edf0ef',
    colorTextSecondary: '#889492',
    colorTextTertiary: '#5a6664',
    colorBorder: 'rgba(255,255,255,0.10)',
    colorBorderSecondary: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontFamily: '"Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 13,
    colorSuccess: '#52c41a',
    colorWarning: '#f5a623',
    colorError: '#f43f4e',
    colorInfo: '#3b82f6',
  },
  components: {
    Layout: {
      colorBgHeader: '#0a0f0f',
      colorBgBody: '#0a0f0f',
      colorBgTrigger: '#111818',
      headerHeight: 52,
      headerPadding: '0 24px',
    },
    Menu: {
      darkItemBg: '#111818',
      darkItemSelectedBg: 'rgba(160,192,64,0.12)',
      darkItemSelectedColor: '#a0c040',
      darkItemColor: '#889492',
      darkItemHoverBg: 'rgba(255,255,255,0.04)',
      darkItemHoverColor: '#edf0ef',
      darkSubMenuItemBg: '#111818',
    },
    Table: {
      colorBgContainer: '#111818',
      headerBg: '#111818',
      headerColor: '#5a6664',
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgba(255,255,255,0.02)',
    },
    Button: {
      colorPrimary: '#a0c040',
      colorPrimaryHover: '#b8d45a',
      colorPrimaryActive: '#90b030',
      borderRadius: 6,
      controlHeight: 32,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: '#111818',
      borderRadius: 12,
    },
    Input: {
      colorBgContainer: '#0d1414',
      colorBorder: 'rgba(255,255,255,0.10)',
    },
    Select: {
      colorBgContainer: '#0d1414',
      colorBgElevated: '#1a2424',
      colorBorder: 'rgba(255,255,255,0.10)',
    },
    Breadcrumb: {
      colorText: '#5a6664',
      colorTextDescription: '#5a6664',
      lastItemColor: '#edf0ef',
    },
    Badge: {
      colorBgSpotlight: '#a0c040',
    },
    Tag: {
      colorBgContainer: 'transparent',
    },
    Tabs: {
      colorBgContainer: 'transparent',
    },
  },
};
