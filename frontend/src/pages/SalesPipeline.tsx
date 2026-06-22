import React from 'react';
import { Card, Typography, Tag } from 'antd';
import {
  UserOutlined,
  FormOutlined,
  StarOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const stages = [
  { label: '总体验客户', icon: <UserOutlined />, count: 25, pct: 100, color: '#a0c040', stageColor: 'green' },
  { label: '完成评估', icon: <FormOutlined />, count: 18, pct: 72, color: '#3b82f6', stageColor: 'blue' },
  { label: '高意向客户', icon: <StarOutlined />, count: 12, pct: 48, color: '#f5a623', stageColor: 'amber' },
  { label: '购买产品', icon: <DollarOutlined />, count: 7, pct: 28, color: '#8b5cf6', stageColor: 'purple' },
];

const SalesPipeline: React.FC = () => {
  return (
    <div>
      <Title
        level={4}
        style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        销售漏斗
      </Title>

      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <div style={{ maxWidth: 680 }}>
          {stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: idx < stages.length - 1 ? 8 : 0,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {/* Label */}
              <span
                style={{
                  width: 110,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#889492',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: stage.color }}>{stage.icon}</span>
                {stage.label}
              </span>

              {/* Bar */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  style={{
                    width: `${stage.pct}%`,
                    height: 36,
                    borderRadius: 8,
                    background: `linear-gradient(90deg, ${stage.color}88, ${stage.color}33)`,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#edf0ef',
                    transition: 'width 0.8s cubic-bezier(0.65,0,0.35,1)',
                  }}
                >
                  {stage.count} 人
                </div>
              </div>

              {/* Count */}
              <span
                style={{
                  width: 60,
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  color: stage.color,
                  flexShrink: 0,
                }}
              >
                {stage.count}
              </span>

              {/* Rate */}
              <Tag
                color={stage.stageColor}
                style={{
                  width: 50,
                  textAlign: 'center',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {stage.pct}%
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SalesPipeline;
