import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Descriptions, Tag, Button, Tabs, Alert,
  Form, Input, Select, DatePicker, message, Space, Skeleton, Table,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  PlusOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { Athlete, Assessment } from '../api/athletes';
import { athletesApi } from '../api/athletes';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- 类型颜色映射 ---
const typeColorMap: Record<string, string> = {
  A: 'green',
  B: 'blue',
  C: 'purple',
  D: 'orange',
  E: 'cyan',
  F: 'default',
};

const typeLabelMap: Record<string, string> = {
  A: 'A类·核心会员',
  B: 'B类·潜力学员',
  C: 'C类·兴趣学员',
  D: 'D类·观望学员',
  E: 'E类·流失风险',
  F: 'F类·已流失',
};

// --- 得分颜色 ---
function scoreColor(score: number): string {
  if (score >= 35) return '#52c41a';
  if (score >= 20) return '#f5a623';
  return '#f43f4e';
}

// --- 计算年龄 ---
function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  return dayjs().diff(dayjs(birthDate), 'year');
}

// --- 评估表格列定义 ---
const assessmentColumns: ColumnsType<Assessment> = [
  {
    title: '日期',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 120,
    render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
  },
  {
    title: '类型',
    dataIndex: 'assessment_type',
    key: 'assessment_type',
    width: 130,
    render: (t: string) => {
      const labels: Record<string, { label: string; color: string }> = {
        initial: { label: '初次评估', color: 'blue' },
        followup: { label: '跟进评估', color: 'green' },
        pre_competition: { label: '赛前评估', color: 'orange' },
        post_competition: { label: '赛后分析', color: 'purple' },
      };
      const info = labels[t] || { label: t, color: 'default' };
      return <Tag color={info.color}>{info.label}</Tag>;
    },
  },
  {
    title: '总分',
    dataIndex: 'total_score',
    key: 'total_score',
    width: 100,
    render: (s: number) => (
      <span style={{ fontWeight: 700, color: scoreColor(s), fontFamily: 'monospace', fontSize: 15 }}>
        {s ?? '-'}
      </span>
    ),
  },
  {
    title: '弱项',
    dataIndex: 'weaknesses',
    key: 'weaknesses',
    ellipsis: true,
  },
  {
    title: '教练反馈',
    dataIndex: 'coach_feedback',
    key: 'coach_feedback',
    ellipsis: true,
    render: (text: string) => text || <Text type="secondary">暂无</Text>,
  },
];

const AthleteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const athleteId = Number(id);

  // --- 状态 ---
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [form] = Form.useForm();
  const [notesForm] = Form.useForm();

  // 评估数据
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // --- 获取学员数据 ---
  const fetchAthlete = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await athletesApi.get(athleteId);
      setAthlete(res.data);
      form.setFieldsValue({
        ...res.data,
        birth_date: res.data.birth_date ? dayjs(res.data.birth_date) : null,
      });
      notesForm.setFieldsValue({ notes: res.data.notes || '' });
    } catch (_err) {
      setError('无法加载学员数据，请检查网络或稍后重试');
    } finally {
      setLoading(false);
    }
  }, [athleteId, form, notesForm]);

  // --- 获取评估记录 ---
  const fetchAssessments = useCallback(async () => {
    if (!athleteId) return;
    setAssessmentsLoading(true);
    try {
      const res = await athletesApi.getAssessments(athleteId);
      setAssessments(res.data.data || []);
    } catch {
      // 静默失败，评估tab内显示空状态
      setAssessments([]);
    } finally {
      setAssessmentsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    fetchAthlete();
  }, [fetchAthlete]);

  // --- 编辑模式切换 ---
  const handleEdit = () => {
    if (athlete) {
      form.setFieldsValue({
        ...athlete,
        birth_date: athlete.birth_date ? dayjs(athlete.birth_date) : null,
      });
    }
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...values,
        birth_date: values.birth_date
          ? dayjs(values.birth_date).format('YYYY-MM-DD')
          : undefined,
      };
      const res = await athletesApi.update(athleteId, payload);
      setAthlete(res.data);
      setEditing(false);
      message.success('学员信息已更新');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return; // 表单验证错误
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // --- 备注自动保存 ---
  const handleNotesSave = async () => {
    if (!athlete) return;
    try {
      const values = await notesForm.validateFields();
      setNotesSaving(true);
      const res = await athletesApi.update(athleteId, { notes: values.notes });
      setAthlete(res.data);
      message.success('备注已保存');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('保存失败');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleNotesBlur = () => {
    handleNotesSave();
  };

  // --- 加载态 ---
  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <Card
          bordered={false}
          style={{
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  // --- 错误态 ---
  if (error || !athlete) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/athletes')}
          style={{ color: '#a0c040', padding: 0, marginBottom: 16 }}
        >
          返回学员列表
        </Button>
        <Alert
          message="加载失败"
          description={error || '未找到该学员'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchAthlete}>
              重试
            </Button>
          }
          style={{
            background: '#1a1010',
            border: '1px solid rgba(244,63,78,0.25)',
          }}
        />
      </div>
    );
  }

  const age = calcAge(athlete.birth_date);
  const typeColor = typeColorMap[athlete.current_client_type] || 'default';
  const typeLabel = typeLabelMap[athlete.current_client_type] || athlete.current_client_type;

  // --- Tabs 配置 ---
  const tabItems = [
    {
      key: 'profile',
      label: '📋 档案',
      children: (
        <div>
          {/* --- 显示模式 --- */}
          {!editing ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  style={{ color: '#a0c040', borderColor: 'rgba(160,192,64,0.3)' }}
                >
                  编辑
                </Button>
              </div>
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
                <Descriptions.Item label="姓名">{athlete.name}</Descriptions.Item>
                <Descriptions.Item label="性别">{athlete.gender === '男' ? '男' : athlete.gender === '女' ? '女' : athlete.gender || '-'}</Descriptions.Item>
                <Descriptions.Item label="出生日期">
                  {athlete.birth_date ? `${athlete.birth_date} (${age}岁)` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">{athlete.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="来源">{athlete.source || '-'}</Descriptions.Item>
                <Descriptions.Item label="HYROX意向">
                  {athlete.hyrox_interest === '是' ? (
                    <Tag color="green">有兴趣</Tag>
                  ) : athlete.hyrox_interest === '否' ? (
                    <Tag color="default">无兴趣</Tag>
                  ) : athlete.hyrox_interest === '观望' ? (
                    <Tag color="gold">观望中</Tag>
                  ) : (
                    athlete.hyrox_interest || '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="运动背景" span={2}>
                  {athlete.sport_background || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={3}>
                  {athlete.notes || <Text type="secondary">暂无备注</Text>}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            /* --- 编辑模式 --- */
            <Form form={form} layout="vertical" size="small">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSaveEdit}
                >
                  保存
                </Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  label="姓名"
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item label="性别" name="gender">
                  <Select
                    options={[
                      { value: '男', label: '男' },
                      { value: '女', label: '女' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="出生日期" name="birth_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="手机号" name="phone">
                  <Input />
                </Form.Item>
                <Form.Item label="来源" name="source">
                  <Select
                    options={[
                      { value: '小红书', label: '小红书' },
                      { value: '抖音', label: '抖音' },
                      { value: '微信', label: '微信' },
                      { value: '转介绍', label: '转介绍' },
                      { value: '线下活动', label: '线下活动' },
                      { value: '其他', label: '其他' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="HYROX意向" name="hyrox_interest">
                  <Select
                    options={[
                      { value: '是', label: '有兴趣' },
                      { value: '否', label: '无兴趣' },
                      { value: '观望', label: '观望中' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="运动背景" name="sport_background" style={{ gridColumn: '1 / -1' }}>
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label="备注" name="notes" style={{ gridColumn: '1 / -1' }}>
                  <TextArea rows={3} />
                </Form.Item>
              </div>
            </Form>
          )}
        </div>
      ),
    },
    {
      key: 'assessments',
      label: '📊 评估',
      children: (
        <div>
          {assessmentsLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : assessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a6664' }}>
              <ExclamationCircleOutlined style={{ fontSize: 32, marginBottom: 12 }} />
              <div>暂无评估记录</div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ marginTop: 16 }}
                onClick={() => navigate(`/assessments/new?athlete_id=${athleteId}`)}
              >
                新建评估
              </Button>
            </div>
          ) : (
            <Table
              columns={assessmentColumns}
              dataSource={assessments}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, size: 'small' }}
              onRow={(record: Assessment) => ({
                style: { cursor: 'pointer' },
                onClick: () => navigate(`/assessments/${record.id}`),
              })}
            />
          )}
        </div>
      ),
    },
    {
      key: 'training',
      label: '📅 训练',
      children: (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a6664' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
          <div>暂无训练计划</div>
        </div>
      ),
    },
    {
      key: 'metrics',
      label: '📈 指标',
      children: (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a6664' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
          <div>身体指标数据暂未开放</div>
        </div>
      ),
    },
    {
      key: 'injuries',
      label: '🏥 伤病',
      children: (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a6664' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🩺</div>
          <div>伤病记录暂未开放</div>
        </div>
      ),
    },
    {
      key: 'notes',
      label: '💬 备注',
      children: (
        <div>
          <Paragraph style={{ color: '#5a6664', marginBottom: 16 }}>
            教练私密备注 — 仅你可见，用于记录对学员的印象、观察和备忘。
          </Paragraph>
          <Form form={notesForm} layout="vertical">
            <Form.Item name="notes" style={{ marginBottom: 12 }}>
              <TextArea
                rows={8}
                placeholder="记录你对学员的印象、训练态度、沟通要点、后续跟进计划..."
                onBlur={handleNotesBlur}
                style={{ fontSize: 14 }}
              />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={notesSaving}
                onClick={handleNotesSave}
              >
                保存备注
              </Button>
              {athlete.updated_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  最近更新: {dayjs(athlete.updated_at).format('YYYY-MM-DD HH:mm')}
                </Text>
              )}
              {!athlete.updated_at && athlete.created_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  创建于: {dayjs(athlete.created_at).format('YYYY-MM-DD HH:mm')}
                </Text>
              )}
            </Space>
          </Form>
        </div>
      ),
    },
    {
      key: 'reports',
      label: '📄 报告',
      children: (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a6664' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📑</div>
          <div>生成报告功能暂未开放</div>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* --- 顶部导航 --- */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/athletes')}
          style={{ color: '#a0c040', padding: 0, marginBottom: 8 }}
        >
          返回学员列表
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Title
            level={4}
            style={{ color: '#edf0ef', margin: 0, fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {athlete.name}
          </Title>
          <Tag
            color={typeColor}
            style={{ fontSize: 13, padding: '2px 10px', borderRadius: 6 }}
          >
            {typeLabel}
          </Tag>
          {athlete.hyrox_interest === '是' && (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ fontSize: 12, borderRadius: 6 }}
            >
              HYROX意向
            </Tag>
          )}
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/assessments/new?athlete_id=${athleteId}`)}
          >
            新建评估
          </Button>
        </div>
      </div>

      {/* --- 基本信息卡片 --- */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
          <Descriptions.Item label="性别">
            {athlete.gender === '男' ? '男' : athlete.gender === '女' ? '女' : athlete.gender || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="出生日期">
            {athlete.birth_date ? `${athlete.birth_date} (${age}岁)` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">{athlete.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="来源">{athlete.source || '-'}</Descriptions.Item>
          <Descriptions.Item label="运动背景" span={2}>
            {athlete.sport_background || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="加入时间">
            {athlete.created_at ? dayjs(athlete.created_at).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* --- Tabs --- */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          onChange={(key) => {
            if (key === 'assessments') fetchAssessments();
          }}
        />
      </Card>
    </div>
  );
};

export default AthleteDetail;
