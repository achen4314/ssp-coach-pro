import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Skeleton,
  Alert,
  Tag,
  Table,
  Empty,
} from 'antd';
import {
  UserOutlined,
  FormOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type {
  DashboardStats,
  FunnelStage,
  AudienceSegment,
  SourceConversion,
  Todos,
} from '../api/dashboard';
import {
  dashboardApi,
} from '../api/dashboard';

const { Title, Text } = Typography;

// ── Constants ──────────────────────────────────────────────────────────

const SSP_GREEN = '#a0c040';

const FUNNEL_COLORS: Record<string, string> = {
  '总体验客户': '#a0c040',
  '完成评估': '#3b82f6',
  '高意向客户': '#f5a623',
  '购买产品': '#8b5cf6',
  '续费升级': '#c0c060',
};

const FUNNEL_ICONS: Record<string, React.ReactNode> = {
  '总体验客户': <UserOutlined />,
  '完成评估': <FormOutlined />,
  '高意向客户': <RiseOutlined />,
  '购买产品': <CheckCircleOutlined />,
  '续费升级': <ArrowUpOutlined />,
};

const AUDIENCE_COLORS: Record<string, string> = {
  A: '#a0c040',
  B: '#3b82f6',
  C: '#f5a623',
  D: '#8b5cf6',
  E: '#ec4899',
  F: '#6b7280',
};

// ── Component ──────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [audience, setAudience] = useState<AudienceSegment[]>([]);
  const [sourceConversion, setSourceConversion] = useState<SourceConversion[]>([]);
  const [todos, setTodos] = useState<Todos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, funnelRes, audienceRes, sourceRes, todosRes] =
        await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getFunnel(),
          dashboardApi.getAudience(),
          dashboardApi.getSourceConversion(),
          dashboardApi.getTodos(),
        ]);
      setStats(statsRes);
      setFunnel(funnelRes);
      setAudience(audienceRes);
      setSourceConversion(sourceRes);
      setTodos(todosRes);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '数据加载失败，请检查网络连接';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Trend helpers ──────────────────────────────────────────────────

  const trendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'down':
        return <ArrowDownOutlined style={{ color: '#f43f4e' }} />;
      default:
        return <MinusOutlined style={{ color: '#889492' }} />;
    }
  };

  const trendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return '#52c41a';
      case 'down':
        return '#f43f4e';
      default:
        return '#889492';
    }
  };

  // ── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          工作台
        </Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card
                bordered={false}
                style={{
                  background: '#111818',
                  borderRadius: 12,
                }}
              >
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Card
          bordered={false}
          style={{
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────

  if (error) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          工作台
        </Title>
        <Alert
          type="error"
          message="数据加载失败"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <a onClick={fetchDashboardData} style={{ whiteSpace: 'nowrap' }}>
              重试
            </a>
          }
        />
      </div>
    );
  }

  // ── Source conversion table columns ────────────────────────────────

  const sourceColumns = [
    {
      title: '渠道来源',
      dataIndex: 'source',
      key: 'source',
      render: (v: string) => (
        <span style={{ color: '#edf0ef', fontWeight: 500 }}>{v}</span>
      ),
    },
    {
      title: '总人数',
      dataIndex: 'total',
      key: 'total',
      render: (v: number) => <span style={{ color: '#edf0ef' }}>{v}</span>,
    },
    {
      title: '已评估',
      dataIndex: 'assessed',
      key: 'assessed',
      render: (v: number) => <span style={{ color: '#3b82f6' }}>{v}</span>,
    },
    {
      title: '已成交',
      dataIndex: 'converted',
      key: 'converted',
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (v: number) => {
        const pct = Number(v).toFixed(1);
        const color = v >= 30 ? '#52c41a' : v >= 15 ? '#f5a623' : '#f43f4e';
        return (
          <span style={{ color, fontWeight: 600 }}>
            {pct}%
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ color: '#edf0ef', fontWeight: 600, margin: 0 }}>
          工作台
        </Title>
        <Text style={{ color: '#5a6664', fontSize: 12 }}>数据实时更新</Text>
      </div>

      {/* ── 统计卡片 ────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* 总学员数 - Green */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              borderLeft: `3px solid ${SSP_GREEN}`,
              borderRadius: 12,
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    color: '#5a6664',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  总学员数
                </span>
              }
              value={stats?.total_athletes ?? 0}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<UserOutlined style={{ fontSize: 20, color: SSP_GREEN }} />}
              suffix={
                <span style={{ fontSize: 13, color: '#52c41a' }}>
                  <ArrowUpOutlined /> {stats?.new_this_month ?? 0} 本月新增
                </span>
              }
            />
          </Card>
        </Col>

        {/* 本月评估 - Blue */}
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
              title={
                <span
                  style={{
                    color: '#5a6664',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  本月评估
                </span>
              }
              value={stats?.assessments_this_month ?? 0}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<FormOutlined style={{ fontSize: 20, color: '#3b82f6' }} />}
              suffix={
                <span style={{ fontSize: 13, color: '#889492' }}>
                  /{stats?.assessments_target ?? 25}
                </span>
              }
            />
          </Card>
        </Col>

        {/* 待跟进学员 - Orange */}
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
              title={
                <span
                  style={{
                    color: '#5a6664',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  待跟进学员
                </span>
              }
              value={stats?.pending_followups ?? 0}
              valueStyle={{ color: '#edf0ef', fontWeight: 700, fontSize: 32 }}
              prefix={<ClockCircleOutlined style={{ fontSize: 20, color: '#f5a623' }} />}
              suffix={
                (stats?.overdue_followups ?? 0) > 0 ? (
                  <span style={{ fontSize: 13, color: '#f43f4e' }}>
                    含 {stats?.overdue_followups} 逾期
                  </span>
                ) : null
              }
            />
          </Card>
        </Col>

        {/* 本月成交率 - Purple/Gold */}
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
              title={
                <span
                  style={{
                    color: '#5a6664',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  本月成交率
                </span>
              }
              value={stats?.conversion_rate_this_month ?? 0}
              valueStyle={{ color: SSP_GREEN, fontWeight: 700, fontSize: 32 }}
              prefix={<RiseOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
              suffix={
                stats?.conversion_trend && stats.conversion_trend !== 'flat' ? (
                  <span style={{ fontSize: 13, color: trendColor(stats.conversion_trend) }}>
                    {trendIcon(stats.conversion_trend)}{' '}
                    {stats.conversion_rate_last_month != null
                      ? `${((stats.conversion_rate_this_month ?? 0) - (stats.conversion_rate_last_month ?? 0)).toFixed(0)}%`
                      : ''}
                  </span>
                ) : null
              }
            />
          </Card>
        </Col>
      </Row>

      {/* ── 第二行：漏斗 + 人群分布 ──────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* 销售漏斗 */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              height: '100%',
            }}
            title={
              <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
                📊 销售漏斗
              </span>
            }
          >
            {funnel.length === 0 ? (
              <Empty
                description={<span style={{ color: '#5a6664' }}>暂无数据</span>}
              />
            ) : (
              <div>
                {funnel.map((stage, idx) => {
                  const color = FUNNEL_COLORS[stage.stage] || '#5a6664';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                      }}
                    >
                      {/* Label */}
                      <span
                        style={{
                          width: 100,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#889492',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span style={{ color, fontSize: 14 }}>
                          {FUNNEL_ICONS[stage.stage] || null}
                        </span>
                        {stage.stage}
                      </span>

                      {/* Bar */}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div
                          style={{
                            width: `${Math.max(stage.pct ?? 0, 2)}%`,
                            height: 32,
                            borderRadius: 6,
                            background: `linear-gradient(90deg, ${color}66, ${color}22)`,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 10,
                            fontWeight: 600,
                            fontSize: 12,
                            color: '#edf0ef',
                          }}
                        >
                          {stage.count} 人
                        </div>
                      </div>

                      {/* pct */}
                      <Tag
                        color={
                          stage.pct >= 70
                            ? 'green'
                            : stage.pct >= 40
                              ? 'blue'
                              : stage.pct >= 20
                                ? 'orange'
                                : 'red'
                        }
                        style={{ width: 52, textAlign: 'center', fontWeight: 600, margin: 0 }}
                      >
                        {stage.pct}%
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* 目标人群分布 */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              height: '100%',
            }}
            title={
              <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
                🎯 目标人群分布
              </span>
            }
          >
            {audience.length === 0 ? (
              <Empty
                description={<span style={{ color: '#5a6664' }}>暂无数据</span>}
              />
            ) : (
              <Row gutter={[12, 12]}>
                {audience.map((seg) => {
                  const color = AUDIENCE_COLORS[seg.type] || '#5a6664';
                  return (
                    <Col xs={12} sm={8} key={seg.type}>
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 8,
                          padding: '14px 12px',
                          border: `1px solid ${color}33`,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `${color}22`,
                            color,
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 6,
                          }}
                        >
                          {seg.type}
                        </div>
                        <div style={{ color: '#edf0ef', fontWeight: 600, fontSize: 20 }}>
                          {seg.count}
                        </div>
                        <div style={{ color: '#5a6664', fontSize: 11 }}>
                          {seg.pct}% · 转化 {seg.conversion_rate}%
                        </div>
                        <div style={{ color: '#889492', fontSize: 10, marginTop: 2 }}>
                          均分 {seg.avg_score}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── 第三行：来源转化 + 待办 ──────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {/* 来源转化 */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
            }}
            title={
              <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
                📈 来源转化
              </span>
            }
          >
            {sourceConversion.length === 0 ? (
              <Empty
                description={<span style={{ color: '#5a6664' }}>暂无数据</span>}
              />
            ) : (
              <Table
                dataSource={sourceConversion.map((s, i) => ({ ...s, key: i }))}
                columns={sourceColumns}
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
                rowClassName={() => 'dark-table-row'}
              />
            )}
          </Card>
        </Col>

        {/* 待办列表 */}
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{
              background: '#111818',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
            }}
            title={
              <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
                ⏰ 待办提醒
              </span>
            }
          >
            {!todos ||
            (todos.overdue.length === 0 &&
              todos.pending_followups.length === 0 &&
              todos.pending_assessments.length === 0) ? (
              <Empty
                description={<span style={{ color: '#5a6664' }}>暂无待办事项</span>}
              />
            ) : (
              <div>
                {/* 逾期 */}
                {todos.overdue.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text
                      strong
                      style={{
                        color: '#f43f4e',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <ExclamationCircleOutlined /> 逾期 ({todos.overdue.length})
                    </Text>
                    {todos.overdue.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#edf0ef', fontSize: 13 }}>
                          {item.athlete_name}
                        </span>
                        <span style={{ color: '#5a6664', fontSize: 11 }}>
                          {item.due_date ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 待跟进 */}
                {todos.pending_followups.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text
                      strong
                      style={{
                        color: '#f5a623',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <WarningOutlined /> 待跟进 ({todos.pending_followups.length})
                    </Text>
                    {todos.pending_followups.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#edf0ef', fontSize: 13 }}>
                          {item.athlete_name}
                        </span>
                        <span style={{ color: '#5a6664', fontSize: 11 }}>
                          {item.due_date ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 待评估 */}
                {todos.pending_assessments.length > 0 && (
                  <div>
                    <Text
                      strong
                      style={{
                        color: '#3b82f6',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <FormOutlined /> 待评估 ({todos.pending_assessments.length})
                    </Text>
                    {todos.pending_assessments.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#edf0ef', fontSize: 13 }}>
                          {item.athlete_name}
                        </span>
                        <span style={{ color: '#5a6664', fontSize: 11 }}>
                          {item.due_date ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
