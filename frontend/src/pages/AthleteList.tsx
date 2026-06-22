import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, Table, Tag, Button, Input, Select, Space, Modal,
  Form, DatePicker, message, Row, Col, Skeleton, Alert,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Athlete, AthleteListParams } from '../api/athletes';
import { athletesApi } from '../api/athletes';

const { Title, Text } = Typography;
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
  A: 'A类',
  B: 'B类',
  C: 'C类',
  D: 'D类',
  E: 'E类',
  F: 'F类',
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

const AthleteList: React.FC = () => {
  const navigate = useNavigate();

  // --- 状态 ---
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 筛选
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSource, setFilterSource] = useState<string | undefined>(undefined);
  const [filterCoach, setFilterCoach] = useState<number | undefined>(undefined);
  const [searchName, setSearchName] = useState('');

  // 添加学员弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm] = Form.useForm();

  // --- 获取列表 ---
  const fetchList = useCallback(async (p?: number, ps?: number) => {
    setLoading(true);
    setError(null);
    const params: AthleteListParams = {
      page: p ?? page,
      per_page: ps ?? pageSize,
    };
    if (filterType) params.current_client_type = filterType;
    if (filterSource) params.source = filterSource;
    if (filterCoach) params.coach_id = filterCoach;
    if (searchName.trim()) params.name = searchName.trim();

    try {
      const res = await athletesApi.list(params);
      setAthletes(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setError('加载学员列表失败，请检查网络后重试');
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterType, filterSource, filterCoach, searchName]);

  useEffect(() => {
    fetchList(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterSource, filterCoach, searchName]);

  // --- 搜索（防抖处理，实际由用户点击搜索触发） ---
  const handleSearch = () => {
    setPage(1);
    fetchList(1, pageSize);
  };

  const handleReset = () => {
    setFilterType(undefined);
    setFilterSource(undefined);
    setFilterCoach(undefined);
    setSearchName('');
    setPage(1);
  };

  // --- 添加学员 ---
  const handleAddAthlete = () => {
    addForm.resetFields();
    setModalOpen(true);
  };

  const handleSubmitAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        birth_date: values.birth_date
          ? dayjs(values.birth_date).format('YYYY-MM-DD')
          : undefined,
      };
      await athletesApi.create(payload);
      message.success('学员添加成功');
      setModalOpen(false);
      addForm.resetFields();
      fetchList(1, pageSize);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('添加失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 表格列 ---
  const columns: ColumnsType<Athlete> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#edf0ef' }}>{name}</span>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (g: string) => g || '-',
    },
    {
      title: '年龄',
      key: 'age',
      width: 60,
      render: (_: unknown, record: Athlete) => {
        const age = calcAge(record.birth_date);
        return age !== null ? age : '-';
      },
    },
    {
      title: '学员类型',
      dataIndex: 'current_client_type',
      key: 'current_client_type',
      width: 100,
      render: (t: string) => {
        const color = typeColorMap[t] || 'default';
        const label = typeLabelMap[t] || t || '-';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      ellipsis: true,
    },
    {
      title: '最新评分',
      key: 'latest_score',
      width: 90,
      render: (_: unknown, record: Athlete & { latest_score?: number }) => {
        const s = record.latest_score;
        if (s === undefined || s === null) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <span style={{ fontWeight: 700, color: scoreColor(s), fontFamily: 'monospace', fontSize: 15 }}>
            {s}
          </span>
        );
      },
    },
    {
      title: '最近评估',
      key: 'recent_date',
      width: 120,
      render: (_: unknown, record: Athlete & { latest_assessment_date?: string }) => {
        const d = record.latest_assessment_date;
        return d ? dayjs(d).format('YYYY-MM-DD') : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Athlete) => (
        <Button
          type="link"
          size="small"
          style={{ color: '#a0c040' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/athletes/${record.id}`);
          }}
        >
          查看 →
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* --- 标题栏 --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title
          level={4}
          style={{
            color: '#edf0ef',
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          学员管理
        </Title>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => fetchList()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAthlete}>
            添加学员
          </Button>
        </Space>
      </div>

      {/* --- 筛选栏 --- */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="学员类型"
              allowClear
              style={{ width: '100%' }}
              value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              options={[
                { value: 'A', label: 'A类' },
                { value: 'B', label: 'B类' },
                { value: 'C', label: 'C类' },
                { value: 'D', label: 'D类' },
                { value: 'E', label: 'E类' },
                { value: 'F', label: 'F类' },
              ]}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="来源"
              allowClear
              style={{ width: '100%' }}
              value={filterSource}
              onChange={(v) => { setFilterSource(v); setPage(1); }}
              options={[
                { value: '小红书', label: '小红书' },
                { value: '抖音', label: '抖音' },
                { value: '微信', label: '微信' },
                { value: '转介绍', label: '转介绍' },
                { value: '线下活动', label: '线下活动' },
                { value: '其他', label: '其他' },
              ]}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="教练"
              allowClear
              style={{ width: '100%' }}
              value={filterCoach}
              onChange={(v) => { setFilterCoach(v); setPage(1); }}
              options={[
                { value: 1, label: '教练A' },
                { value: 2, label: '教练B' },
              ]}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#5a6664' }} />}
              placeholder="搜索学员姓名..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              suffix={
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  style={{ color: '#a0c040', padding: 0 }}
                />
              }
            />
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button onClick={handleReset} block>
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      {/* --- 表格 --- */}
      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        {error ? (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => fetchList()}>
                重试
              </Button>
            }
            style={{
              background: '#1a1010',
              border: '1px solid rgba(244,63,78,0.25)',
              marginBottom: 16,
            }}
          />
        ) : null}

        {loading && athletes.length === 0 ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={athletes}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t: number) => `共 ${t} 名学员`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
                fetchList(p, ps);
              },
            }}
            onRow={(record: Athlete) => ({
              style: { cursor: 'pointer' },
              onClick: () => navigate(`/athletes/${record.id}`),
            })}
          />
        )}
      </Card>

      {/* --- 添加学员弹窗 --- */}
      <Modal
        title="添加学员"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitAdd}
        confirmLoading={submitting}
        okText="确认添加"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="学员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号" name="phone">
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="性别" name="gender">
                <Select
                  placeholder="选择性别"
                  options={[
                    { value: '男', label: '男' },
                    { value: '女', label: '女' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="出生日期" name="birth_date">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="来源" name="source">
                <Select
                  placeholder="选择来源"
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
            </Col>
            <Col span={12}>
              <Form.Item label="HYROX意向" name="hyrox_interest">
                <Select
                  placeholder="选择意向"
                  options={[
                    { value: '是', label: '有兴趣' },
                    { value: '否', label: '无兴趣' },
                    { value: '观望', label: '观望中' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="运动背景" name="sport_background">
            <Select
              placeholder="选择运动背景"
              options={[
                { value: '跑步', label: '跑步' },
                { value: '健身', label: '健身' },
                { value: 'CrossFit', label: 'CrossFit' },
                { value: '游泳', label: '游泳' },
                { value: '骑行', label: '骑行' },
                { value: '球类', label: '球类' },
                { value: '无运动习惯', label: '无运动习惯' },
                { value: '其他', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="补充说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AthleteList;
