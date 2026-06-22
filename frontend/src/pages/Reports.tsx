import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Empty, Skeleton, Alert } from 'antd';
import { FileTextOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../api/client';
import type { Athlete, Assessment } from '../api/athletes';

const { Title, Text } = Typography;

interface AthleteWithAssessment extends Athlete {
  latest_assessment?: Assessment;
}

const Reports: React.FC = () => {
  const [athletes, setAthletes] = useState<AthleteWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<{ data: Athlete[] }>('/athletes', {
          params: { per_page: 50 },
        });
        const athleteList = res.data.data ?? [];
        const withAssessments = await Promise.all(
          athleteList.map(async (athlete) => {
            try {
              const ar = await apiClient.get<{ data: Assessment[] }>(
                `/athletes/${athlete.id}/assessments`,
                { params: { per_page: 1 } }
              );
              const assessments = ar.data.data ?? [];
              return { ...athlete, latest_assessment: assessments[0] };
            } catch {
              return { ...athlete, latest_assessment: undefined };
            }
          })
        );
        setAthletes(withAssessments.filter((a) => a.latest_assessment));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: ColumnsType<AthleteWithAssessment> = [
    {
      title: '学员姓名',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span style={{ color: '#edf0ef', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '评估类型',
      key: 'type',
      render: (_: unknown, r: AthleteWithAssessment) => (
        <Text style={{ color: '#edf0ef', fontSize: 12 }}>{r.latest_assessment?.assessment_type || '—'}</Text>
      ),
    },
    {
      title: '评估分数',
      key: 'score',
      render: (_: unknown, r: AthleteWithAssessment) => {
        const s = r.latest_assessment?.total_score;
        if (s == null) return <span style={{ color: '#5a6664' }}>—</span>;
        return <Tag color={s >= 80 ? 'green' : s >= 60 ? 'blue' : 'warning'}>{s} 分</Tag>;
      },
    },
    {
      title: '评估日期',
      key: 'date',
      render: (_: unknown, r: AthleteWithAssessment) => (
        <Text style={{ color: '#889492', fontSize: 12 }}>
          {r.latest_assessment?.created_at
            ? new Date(r.latest_assessment.created_at).toLocaleDateString('zh-CN')
            : '—'}
        </Text>
      ),
    },
    {
      title: '薄弱项',
      key: 'weaknesses',
      render: (_: unknown, r: AthleteWithAssessment) => {
        const w = r.latest_assessment?.weaknesses;
        if (!w || w === '无') return <Text style={{ color: '#5a6664', fontSize: 12 }}>无</Text>;
        return <Text style={{ color: '#f5a623', fontSize: 12 }}>{w.length > 20 ? w.slice(0, 20) + '…' : w}</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Text style={{ color: '#5a6664', fontSize: 12 }}>待生成</Text>,
    },
  ];

  if (loading) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>报告中心</Title>
        <Card bordered={false} style={{ background: '#111818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 16 }}>
          <Skeleton active paragraph={{ rows: 1 }} />
        </Card>
        <Card bordered={false} style={{ background: '#111818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>报告中心</Title>
        <Alert type="error" message="加载失败" description={error} showIcon style={{ marginBottom: 16 }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#edf0ef', fontWeight: 600, margin: 0 }}>报告中心</Title>
      </div>
      <Card bordered={false} style={{ background: '#111818', border: '1px solid rgba(160,192,64,0.25)', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#a0c040' }}>
          <FileTextOutlined style={{ fontSize: 20 }} />
          <div>
            <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>报告生成功能即将上线</Text>
            <br />
            <Text style={{ color: '#5a6664', fontSize: 12 }}>评估报告将自动整合学员数据、薄弱项分析和训练建议，敬请期待。</Text>
          </div>
        </div>
      </Card>
      <Card bordered={false} style={{ background: '#111818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
        title={<span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>已评估学员（可生成报告）</span>}>
        {athletes.length === 0 ? (
          <Empty description={<span style={{ color: '#5a6664' }}>暂无已评估学员</span>} />
        ) : (
          <Table dataSource={athletes} columns={columns} rowKey="id" pagination={{ pageSize: 10, size: 'small' }} size="middle"
            locale={{ emptyText: <span style={{ color: '#5a6664' }}><ExclamationCircleOutlined style={{ marginRight: 4 }} />暂无已评估学员数据</span> }} />
        )}
      </Card>
    </div>
  );
};

export default Reports;
