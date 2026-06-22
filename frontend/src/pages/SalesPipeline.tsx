import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Tag,
  Skeleton,
  Alert,
  Table,
  Empty,
  Progress,
} from 'antd';
import {
  UserOutlined,
  FormOutlined,
  StarOutlined,
  DollarOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import type {
  FunnelStage,
  AudienceSegment,
  SourceConversion,
} from '../api/dashboard';
import {
  dashboardApi,
} from '../api/dashboard';

const { Title } = Typography;

// ── Constants ──────────────────────────────────────────────────────────

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
  '高意向客户': <StarOutlined />,
  '购买产品': <DollarOutlined />,
  '续费升级': <ArrowUpOutlined />,
};

const FUNNEL_STAGE_COLORS: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'gold'> = {
  '总体验客户': 'green',
  '完成评估': 'blue',
  '高意向客户': 'orange',
  '购买产品': 'purple',
  '续费升级': 'gold',
};

const AUDIENCE_COLORS: Record<string, string> = {
  A: '#a0c040',
  B: '#3b82f6',
  C: '#f5a623',
  D: '#8b5cf6',
  E: '#ec4899',
  F: '#6b7280',
};

const AUDIENCE_LABELS: Record<string, string> = {
  A: '精英竞技',
  B: '健身达人',
  C: '健康改善',
  D: 'Hyrox挑战',
  E: '运动康复',
  F: '观望体验',
};

// ── Component ──────────────────────────────────────────────────────────

const SalesPipeline: React.FC = () => {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [audience, setAudience] = useState<AudienceSegment[]>([]);
  const [sourceConversion, setSourceConversion] = useState<SourceConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [funnelRes, audienceRes, sourceRes] = await Promise.all([
        dashboardApi.getFunnel(),
        dashboardApi.getAudience(),
        dashboardApi.getSourceConversion(),
      ]);
      setFunnel(funnelRes);
      setAudience(audienceRes);
      setSourceConversion(sourceRes);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '数据加载失败，请检查网络连接';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // ── Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          销售漏斗
        </Title>
        <Card
          bordered={false}
          style={{
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
        <Card
          bordered={false}
          style={{
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          销售漏斗
        </Title>
        <Alert
          type="error"
          message="数据加载失败"
          description={error}
          showIcon
          action={
            <a onClick={fetchData} style={{ whiteSpace: 'nowrap' }}>
              重试
            </a>
          }
        />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────

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
        销售漏斗
      </Title>

      {/* ── 漏斗可视化 ──────────────────────────────────────────────── */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 24,
        }}
        title={
          <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
            📊 漏斗转化
          </span>
        }
      >
        {funnel.length === 0 ? (
          <Empty description={<span style={{ color: '#5a6664' }}>暂无数据</span>} />
        ) : (
          <div style={{ maxWidth: 800 }}>
            {funnel.map((stage, idx) => {
              const color = FUNNEL_COLORS[stage.stage] || '#5a6664';
              const tagColor = FUNNEL_STAGE_COLORS[stage.stage] || 'blue';
              // Calculate drop-off from previous stage
              const prevCount = idx > 0 ? funnel[idx - 1].count : stage.count;
              const dropRate =
                idx > 0 && prevCount > 0
                  ? ((1 - stage.count / prevCount) * 100).toFixed(0)
                  : null;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: idx < funnel.length - 1 ? 10 : 0,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent';
                  }}
                >
                  {/* Label */}
                  <span
                    style={{
                      width: 120,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#889492',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color, fontSize: 15 }}>
                      {FUNNEL_ICONS[stage.stage] || null}
                    </span>
                    {stage.stage}
                  </span>

                  {/* Bar */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div
                      style={{
                        width: `${Math.max(stage.pct ?? 0, 2)}%`,
                        height: 42,
                        borderRadius: 8,
                        background: `linear-gradient(90deg, ${color}88, ${color}22)`,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 14,
                        fontWeight: 600,
                        fontSize: 14,
                        color: '#edf0ef',
                        transition:
                          'width 0.8s cubic-bezier(0.65,0,0.35,1)',
                        position: 'relative',
                      }}
                    >
                      <span>{stage.count} 人</span>
                      {dropRate && (
                        <span
                          style={{
                            position: 'absolute',
                            right: 8,
                            fontSize: 11,
                            color: '#889492',
                            fontWeight: 400,
                          }}
                        >
                          流失 {dropRate}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Count */}
                  <span
                    style={{
                      width: 50,
                      textAlign: 'right',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {stage.count}
                  </span>

                  {/* Rate Tag */}
                  <Tag
                    color={tagColor}
                    style={{
                      width: 52,
                      textAlign: 'center',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {stage.pct}%
                  </Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Kanban 看板：A-F 人群泳道 ────────────────────────────────── */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 24,
        }}
        title={
          <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
            🎯 目标人群看板
          </span>
        }
      >
        {audience.length === 0 ? (
          <Empty description={<span style={{ color: '#5a6664' }}>暂无数据</span>} />
        ) : (
          <div>
            {audience.map((seg) => {
              const color = AUDIENCE_COLORS[seg.type] || '#5a6664';
              const label = AUDIENCE_LABELS[seg.type] || seg.type;

              return (
                <div
                  key={seg.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderRadius: 8,
                    marginBottom: 10,
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  {/* Type badge */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `${color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color,
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {seg.type}
                  </div>

                  {/* Info */}
                  <div style={{ width: 120, flexShrink: 0 }}>
                    <div style={{ color: '#edf0ef', fontWeight: 500, fontSize: 13 }}>
                      {label}
                    </div>
                    <div style={{ color: '#5a6664', fontSize: 11 }}>
                      转化 {seg.conversion_rate}% · 均分 {seg.avg_score}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 2 }}>
                      <span style={{ color, fontWeight: 700, fontSize: 16 }}>
                        {seg.count}
                      </span>
                      <span style={{ color: '#5a6664', fontSize: 11, marginLeft: 6 }}>
                        人 ({seg.pct}%)
                      </span>
                    </div>
                    <Progress
                      percent={seg.pct}
                      showInfo={false}
                      strokeColor={color}
                      trailColor="rgba(255,255,255,0.06)"
                      size="small"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 来源转化表 ────────────────────────────────────────────────── */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
        title={
          <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
            📈 来源转化详情
          </span>
        }
      >
        {sourceConversion.length === 0 ? (
          <Empty description={<span style={{ color: '#5a6664' }}>暂无数据</span>} />
        ) : (
          <Table
            dataSource={sourceConversion.map((s, idx) => ({
              ...s,
              key: idx,
            }))}
            columns={sourceColumns}
            pagination={false}
            size="middle"
            style={{ background: 'transparent' }}
            rowClassName={() => 'dark-table-row'}
          />
        )}
      </Card>
    </div>
  );
};

export default SalesPipeline;
