import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Tag, Empty, Skeleton, Alert } from 'antd';
import { ScheduleOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../api/client';
import type { Athlete, Assessment } from '../api/athletes';

const { Title, Text } = Typography;

interface AthleteWithAssessment extends Athlete {
  latest_assessment?: Assessment;
}

const Training: React.FC = () => {
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

        // Fetch latest assessment for each athlete
        const withAssessments = await Promise.all(
          athleteList.map(async (athlete) => {
            try {
              const assessmentRes = await apiClient.get<{ data: Assessment[] }>(
                `/athletes/${athlete.id}/assessments`,
                { params: { per_page: 1 } }
              );
              const assessments = assessmentRes.data.data ?? [];
              return {
                ...athlete,
                latest_assessment: assessments.length > 0 ? assessments[0] : undefined,
              };
            } catch {
              return { ...athlete, latest_assessment: undefined };
            }
          })
        );
        setAthletes(withAssessments);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '学员数据加载失败';
        setError(msg);
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
      render: (v: string) => (
        <span style={{ color: '#edf0ef', fontWeight: 500 }}>{v}</span>
      ),
    },
    {
      title: '客户类型',
      dataIndex: 'current_client_type',
      key: 'current_client_type',
      render: (v: string | null) => (
        <Tag color={v === '会员' ? 'green' : v === '意向客户' ? 'blue' : 'default'}>
          {v || '未知'}
        </Tag>
      ),
    },
    {
      title: '最近评估',
      key: 'assessment',
      render: (_: unknown, record: AthleteWithAssessment) => {
        if (!record.latest_assessment) {
          return <Text style={{ color: '#5a6664', fontSize: 12 }}>暂无评估</Text>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag
              color={
                record.latest_assessment.total_score >= 80
                  ? 'green'
                  : record.latest_assessment.total_score >= 60
                    ? 'blue'
                    : 'warning'
              }
            >
              {record.latest_assessment.total_score}分
            </Tag>
            <Text style={{ color: '#889492', fontSize: 11 }}>
              {record.latest_assessment.assessment_type}
            </Text>
          </div>
        );
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (v: string) => (
        <Text style={{ color: '#889492', fontSize: 12 }}>{v}</Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          训练计划
        </Title>
        <Card
          bordered={false}
          style={{
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <Skeleton active paragraph={{ rows: 1 }} />
        </Card>
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

  if (error) {
    return (
      <div>
        <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600 }}>
          训练计划
        </Title>
        <Alert
          type="error"
          message="加载失败"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

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
          训练计划
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled
          style={{
            fontWeight: 600,
            fontSize: 12,
            borderRadius: 6,
            height: 32,
          }}
        >
          创建训练计划
        </Button>
      </div>

      {/* Placeholder card */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: `1px solid rgba(160,192,64,0.25)`,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#a0c040',
          }}
        >
          <ScheduleOutlined style={{ fontSize: 20 }} />
          <div>
            <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
              训练计划功能开发中
            </Text>
            <br />
            <Text style={{ color: '#5a6664', fontSize: 12 }}>
              即将支持为学员创建个性化训练计划，敬请期待。
            </Text>
          </div>
        </div>
      </Card>

      {/* Athlete list */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
        title={
          <span style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600 }}>
            学员训练状态
          </span>
        }
      >
        {athletes.length === 0 ? (
          <Empty description={<span style={{ color: '#5a6664' }}>暂无学员数据</span>} />
        ) : (
          <Table
            dataSource={athletes}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, size: 'small' }}
            size="middle"
            locale={{
              emptyText: (
                <span style={{ color: '#5a6664' }}>
                  <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                  暂无学员数据
                </span>
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Training;
