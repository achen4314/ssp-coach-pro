import React from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import {
  UserOutlined,
  FormOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title
        level={4}
        style={{
          color: '#edf0ef',
          marginBottom: 24,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        工作台
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              borderLeft: '3px solid #a0c040',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#5a6664', fontSize: 12, textTransform: 'uppercase' }}>总学员数</span>}
              value={32}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<UserOutlined style={{ fontSize: 20, color: '#a0c040' }} />}
              suffix={
                <span style={{ fontSize: 13, color: '#52c41a' }}>
                  <ArrowUpOutlined /> 3 本月新增
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              borderLeft: '3px solid #3b82f6',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#5a6664', fontSize: 12, textTransform: 'uppercase' }}>本月评估</span>}
              value={18}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<FormOutlined style={{ fontSize: 20, color: '#3b82f6' }} />}
              suffix={<span style={{ fontSize: 13, color: '#889492' }}>/25</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              borderLeft: '3px solid #f5a623',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#5a6664', fontSize: 12, textTransform: 'uppercase' }}>待跟进学员</span>}
              value={5}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<ClockCircleOutlined style={{ fontSize: 20, color: '#f5a623' }} />}
              suffix={
                <span style={{ fontSize: 13, color: '#f43f4e' }}>含 2 逾期</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              borderLeft: '3px solid #8b5cf6',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#5a6664', fontSize: 12, textTransform: 'uppercase' }}>本月成交率</span>}
              value={28}
              valueStyle={{ color: '#a0c040', fontWeight: 700, fontSize: 32 }}
              prefix={<RiseOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
              suffix={
                <span style={{ fontSize: 13, color: '#52c41a' }}>
                  <ArrowUpOutlined /> 5%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 占位面板 */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <Title
          level={5}
          style={{ color: '#889492', marginBottom: 16, fontWeight: 500 }}
        >
          📊 数据总览 — 更多图表即将上线
        </Title>
        <p style={{ color: '#5a6664', fontSize: 13 }}>
          销售漏斗、目标人群分布、学员评估趋势等数据可视化组件将在后续迭代中完成。
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
