import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Form, Select, DatePicker, Button, Space, Slider,
  Checkbox, Radio, Input, message, Spin, Row, Col, Tag,
  Progress, Badge,
} from 'antd';
import {
  SaveOutlined, SendOutlined, ThunderboltOutlined,
  UserOutlined, TrophyOutlined, AimOutlined,
  RobotOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── 常量（与后端 models.py 对齐） ──
const DIMENSIONS = [
  'cardio_endurance', 'running_ability', 'lower_body_strength',
  'upper_body_pushpull', 'core_stability', 'motor_coordination',
  'fatigue_resistance', 'training_willingness', 'completion_state',
  'hyrox_potential',
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  cardio_endurance: '心肺耐力',
  running_ability: '跑步能力',
  lower_body_strength: '下肢力量',
  upper_body_pushpull: '上肢推拉',
  core_stability: '核心稳定',
  motor_coordination: '动作协调',
  fatigue_resistance: '抗疲劳能力',
  training_willingness: '训练意愿',
  completion_state: '完成状态',
  hyrox_potential: 'HYROX 潜力',
};

const CLIENT_TYPES: Record<string, string> = {
  A: '备赛型', B: '观望型', C: '减脂型',
  D: '专项型', E: '低频型', F: '低意向',
};

const SOURCES = ['大众点评', '社群', '老会员转介绍', '小红书', '其他'];
const HYROX_INTEREST_OPTIONS = ['是', '否', '观望'];
const SPORT_BACKGROUND_OPTIONS = [
  '跑步', '健身', 'CrossFit', '游泳', '骑行',
  '球类', '格斗', '瑜伽/普拉提', '无运动习惯', '其他',
];
const TRIAL_CLASS_OPTIONS = ['团课体验', '私教体验', '公开课', '未体验'];

const WEAKNESS_OPTIONS = [
  '心肺耐力不足', '跑步能力弱', '下肢力量不足',
  '上肢推拉力量不足', '核心稳定性差', '动作协调性差',
  '抗疲劳能力弱', '训练意愿低', '完成度差',
  'HYROX 专项潜力低', '无明显短板',
];

const COACH_FEEDBACK_PRESETS = [
  '整体表现优秀，具备良好的训练基础，建议报名备赛营系统提升',
  '有一定运动基础，但核心力量和心肺耐力需要重点加强',
  '体能基础较弱，建议从团课+基础力量训练起步',
  '训练态度积极，动作学习能力强，短期内可见明显进步',
  '需要加强动作规范性和训练持续性，建议私教指导入门',
  '跑步能力突出但力量环节明显不足，需针对性补强',
  '综合能力均衡，HYROX潜力良好，适合专项训练',
];

const SALES_CHECKBOXES = [
  { key: 'sales_test_recommended', label: '推荐测试课' },
  { key: 'sales_test_scheduled', label: '已约测试课' },
  { key: 'sales_group_joined', label: '已拉群' },
  { key: 'sales_camp_recommended', label: '推荐备赛营' },
  { key: 'sales_private_screening', label: '推荐私教' },
  { key: 'sales_followup_24h', label: '24h内跟进' },
  { key: 'sales_high_intent', label: '高意向标记' },
];

const sectionStyle: React.CSSProperties = {
  background: '#111818',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#edf0ef',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  color: '#889492',
  fontSize: 13,
  fontWeight: 500,
};

// ── 评分等级颜色 ──
function scoreLevelColor(v: number): string {
  if (v >= 4) return '#52c41a';
  if (v === 3) return '#f5a623';
  if (v === 2) return '#fa8c16';
  return '#f43f4e';
}

// ── 类型颜色 ──
function clientTypeColor(t: string): string {
  const map: Record<string, string> = {
    A: '#52c41a', B: '#3b82f6', C: '#8b5cf6',
    D: '#f5a623', E: '#06b6d4', F: '#889492',
  };
  return map[t] || '#889492';
}

// ── 组件 ──
const AssessmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // ── 学员信息类型（扩展字段用于选中后展示） ──
  interface AthleteInfo {
    id: number;
    name: string;
    phone: string;
    gender?: string;
    source?: string;
    current_client_type?: string;
    sport_background?: string;
    hyrox_interest?: string;
    birth_date?: string;
    coach_name?: string;
    assessment_count?: number;
    latest_assessment?: unknown;
  }

    // 学员列表
    const [athletes, setAthletes] = useState<AthleteInfo[]>([]);
    const [athletesLoading, setAthletesLoading] = useState(false);

    // 搜索防抖 Timer
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 提交状态
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 智能分型
  const [classifying, setClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<{
    client_type: string;
    confidence: number;
    reasoning: string;
    recommended_products: string[];
  } | null>(null);
  const [manualType, setManualType] = useState<string | null>(null);

  // 实时总分
  const [liveScores, setLiveScores] = useState<Record<string, number>>({});

  // 监听选中学员
  const watchedAthleteId: number | undefined = Form.useWatch('athlete_id', form);

  // ── 加载学员列表 ──
  const fetchAthletes = useCallback(async (search?: string) => {
    setAthletesLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 200 };
      if (search?.trim()) params.name = search.trim();
      const res = await apiClient.get('/athletes', { params });
      // API 返回 {"items": [...], "total": N}，兼容 data/athletes 旧格式
      const items = res.data?.items || res.data?.data || res.data?.athletes || [];
      setAthletes(Array.isArray(items) ? items : []);
    } catch {
      message.error('加载学员列表失败');
      setAthletes([]);
    } finally {
      setAthletesLoading(false);
    }
  }, []);

  useEffect(() => { fetchAthletes(); }, [fetchAthletes]);

  // ── 处理学员搜索（300ms 防抖） ──
  const handleAthleteSearch = (value: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      fetchAthletes(value || undefined);
    }, 300);
  };

  // ── 处理学员下拉框获得焦点 ──
  const handleAthleteFocus = () => {
    // 如果列表为空或尚未加载过，自动加载
    if (athletes.length === 0 && !athletesLoading) {
      fetchAthletes();
    }
  };

  // ── 选中学员信息 ──
  const selectedAthlete = useMemo(() => {
    if (!watchedAthleteId) return null;
    return athletes.find(a => a.id === watchedAthleteId) || null;
  }, [watchedAthleteId, athletes]);

  // ── 监听所有维度评分实时变化 ──
  const handleScoreChange = useCallback((dim: string, value: number) => {
    setLiveScores(prev => ({ ...prev, [dim]: value }));
  }, []);

  const totalScore = useMemo(() => {
    let sum = 0;
    for (const dim of DIMENSIONS) {
      sum += liveScores[dim] || 0;
    }
    return sum;
  }, [liveScores]);

  const maxScore = DIMENSIONS.length * 5; // 50

  // ── 智能分型 ──
  const handleClassify = async () => {
    // 获取当前评分
    const scores: Record<string, number> = {};
    for (const dim of DIMENSIONS) {
      scores[dim] = form.getFieldValue(dim) || 0;
    }
    const hyrox_interest = form.getFieldValue('hyrox_interest');
    const sport_background = form.getFieldValue('sport_background');
    const source = form.getFieldValue('source');

    setClassifying(true);
    try {
      const res = await apiClient.post('/ai/classify', {
        scores,
        hyrox_interest,
        sport_background,
        source,
      });
      setAiResult(res.data);
      setManualType(null);
      message.success('智能分型完成');
    } catch {
      message.error('智能分型失败，请重试');
    } finally {
      setClassifying(false);
    }
  };

  // ── 保存草稿 ──
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields(['athlete_id']);
      setSaving(true);
      const payload = buildPayload(values, false);
      await apiClient.post('/assessments', payload);
      message.success('草稿已保存');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        message.warning('请先选择学员');
        return;
      }
      message.error('保存草稿失败');
    } finally {
      setSaving(false);
    }
  };

  // ── 提交评估 ──
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = buildPayload(values, true);
      await apiClient.post('/assessments', payload);
      message.success('评估提交成功！');
      const athleteId = form.getFieldValue('athlete_id');
      navigate(`/athletes/${athleteId}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        message.warning('请完善必填项后再提交');
        return;
      }
      message.error('提交评估失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 构建提交 payload ──
  const buildPayload = (values: Record<string, unknown>, isComplete: boolean) => {
    const scores: Record<string, number> = {};
    for (const dim of DIMENSIONS) {
      scores[dim] = (values[dim] as number) || 0;
    }

    const clientType = manualType || aiResult?.client_type || '';

    return {
      athlete_id: values.athlete_id,
      assessment_date: values.assessment_date
        ? dayjs(values.assessment_date as string).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      source: values.source || '',
      hyrox_interest: values.hyrox_interest || '',
      sport_background: values.sport_background || '',
      trial_class: values.trial_class || '',
      // 10维评分
      ...scores,
      // 弱点
      top_weaknesses: values.top_weaknesses || [],
      // 分型
      client_type: clientType,
      client_type_confidence: aiResult?.confidence || 0,
      client_type_auto: manualType ? false : true,
      // 推荐
      recommended_products: aiResult?.recommended_products || [],
      coach_feedback: values.coach_feedback || '',
      // 销售
      sales_test_recommended: !!values.sales_test_recommended,
      sales_test_scheduled: !!values.sales_test_scheduled,
      sales_group_joined: !!values.sales_group_joined,
      sales_camp_recommended: !!values.sales_camp_recommended,
      sales_private_screening: !!values.sales_private_screening,
      sales_followup_24h: !!values.sales_followup_24h,
      sales_high_intent: !!values.sales_high_intent,
      sales_notes: values.sales_notes || '',
      // 状态
      is_complete: isComplete,
    };
  };

  // ── 渲染 ──
  return (
    <div>
      <Title level={4} style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
        新建 SSP 综合评估
      </Title>

      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 860 }}
        initialValues={{
          assessment_date: dayjs(),
          hyrox_interest: undefined,
          source: undefined,
          sport_background: undefined,
          trial_class: undefined,
        }}
      >
        {/* ================================================================
             Section 1 — 基础信息
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <UserOutlined style={{ color: '#a0c040' }} />
            基础信息
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={labelStyle}>学员</span>}
                name="athlete_id"
                rules={[{ required: true, message: '请选择学员' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索并选择学员"
                  filterOption={false}
                  onSearch={handleAthleteSearch}
                  onFocus={handleAthleteFocus}
                  loading={athletesLoading}
                  notFoundContent={athletesLoading ? <Spin size="small" /> : '无匹配学员'}
                  options={athletes.map(a => ({
                    value: a.id,
                    label: `${a.name}${a.phone ? ` · ${a.phone}` : ''}`,
                  }))}
                />
              </Form.Item>
              {/* 选中学员信息卡片 */}
              {selectedAthlete && (
                <div
                  style={{
                    marginTop: -8,
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: 'rgba(160,192,64,0.06)',
                    border: '1px solid rgba(160,192,64,0.15)',
                    borderRadius: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <Tag color="green" style={{ margin: 0, fontSize: 12 }}>
                    {selectedAthlete.current_client_type
                      ? `${selectedAthlete.current_client_type}类 · ${CLIENT_TYPES[selectedAthlete.current_client_type] || selectedAthlete.current_client_type}`
                      : '未分型'}
                  </Tag>
                  {selectedAthlete.source && (
                    <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>{selectedAthlete.source}</Tag>
                  )}
                  {selectedAthlete.gender && (
                    <Text style={{ color: '#889492', fontSize: 12 }}>{selectedAthlete.gender}</Text>
                  )}
                  {selectedAthlete.assessment_count !== undefined && (
                    <Text style={{ color: '#5a6664', fontSize: 11 }}>
                      已有 {selectedAthlete.assessment_count} 次评估
                    </Text>
                  )}
                  {selectedAthlete.coach_name && (
                    <Text style={{ color: '#5a6664', fontSize: 11 }}>
                      教练: {selectedAthlete.coach_name}
                    </Text>
                  )}
                </div>
              )}
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={labelStyle}>评估日期</span>}
                name="assessment_date"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={<span style={labelStyle}>来源</span>} name="source">
                <Select placeholder="选择来源" allowClear options={SOURCES.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={<span style={labelStyle}>HYROX意向</span>} name="hyrox_interest">
                <Select placeholder="选择意向" allowClear options={HYROX_INTEREST_OPTIONS.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={<span style={labelStyle}>运动背景</span>} name="sport_background">
                <Select placeholder="选择运动背景" allowClear options={SPORT_BACKGROUND_OPTIONS.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={<span style={labelStyle}>体验课程</span>} name="trial_class">
                <Select placeholder="选择体验课类型" allowClear options={TRIAL_CLASS_OPTIONS.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ================================================================
             Section 2 — 10维评分
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>
              <TrophyOutlined style={{ color: '#c0c060', marginRight: 8 }} />
              10维能力评分
            </span>
            <span style={{ fontSize: 13, color: '#889492', fontWeight: 400 }}>
              总分：
              <Text strong style={{ color: totalScore >= 35 ? '#52c41a' : totalScore >= 20 ? '#f5a623' : '#f43f4e', fontSize: 20, fontFamily: 'monospace' }}>
                {totalScore}
              </Text>
              <Text style={{ color: '#5a6664' }}> / {maxScore}</Text>
            </span>
          </div>

          {DIMENSIONS.map((dim) => {
            const value = liveScores[dim] || 0;
            const label = DIMENSION_LABELS[dim] || dim;
            return (
              <Row key={dim} gutter={[16, 0]} align="middle" style={{ marginBottom: 20 }}>
                <Col xs={24} sm={6}>
                  <div style={{ color: '#889492', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ color: scoreLevelColor(value), fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                    {value > 0 ? value : '-'}
                    <Text style={{ color: '#5a6664', fontSize: 12, fontWeight: 400 }}> / 5</Text>
                  </div>
                </Col>
                <Col xs={24} sm={14}>
                  <Form.Item name={dim} noStyle initialValue={0}>
                    <Slider
                      min={0}
                      max={5}
                      step={1}
                      marks={{ 0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }}
                      onChange={(v) => handleScoreChange(dim, v)}
                      trackStyle={{ background: scoreLevelColor(value) }}
                      handleStyle={{ borderColor: scoreLevelColor(value) }}
                      railStyle={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item name={`${dim}_note`} noStyle>
                    <Input
                      placeholder="备注"
                      size="small"
                      style={{
                        background: '#0d1414',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#889492',
                        fontSize: 12,
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <Progress
              percent={Math.round((totalScore / maxScore) * 100)}
              strokeColor={
                totalScore >= 35 ? '#52c41a' : totalScore >= 20 ? '#f5a623' : '#f43f4e'
              }
              trailColor="rgba(255,255,255,0.04)"
              format={() => `${totalScore}/${maxScore}`}
            />
          </div>
        </div>

        {/* ================================================================
             Section 3 — 主要短板
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <AimOutlined style={{ color: '#f5a623' }} />
            主要短板 <Text style={{ color: '#5a6664', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>（选择 1-3 项）</Text>
          </div>
          <Form.Item
            name="top_weaknesses"
            rules={[
              { type: 'array', max: 3, message: '最多选择3项' },
            ]}
          >
            <Checkbox.Group style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {WEAKNESS_OPTIONS.map(w => (
                <Checkbox
                  key={w}
                  value={w}
                  style={{ color: '#889492', fontSize: 13 }}
                >
                  {w}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </div>

        {/* ================================================================
             Section 4 — 智能分型
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <RobotOutlined style={{ color: '#8b5cf6' }} />
            智能分型
          </div>

          <Button
            icon={<ThunderboltOutlined />}
            onClick={handleClassify}
            loading={classifying}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            AI 智能分型
          </Button>

          {aiResult && (
            <div
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.20)',
                borderRadius: 10,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={8}>
                  <Text style={{ color: '#5a6664', fontSize: 12 }}>识别类型</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag
                      color={clientTypeColor(aiResult.client_type)}
                      style={{ fontSize: 16, fontWeight: 700, padding: '4px 16px', borderRadius: 8 }}
                    >
                      {aiResult.client_type}类 · {CLIENT_TYPES[aiResult.client_type] || aiResult.client_type}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <Text style={{ color: '#5a6664', fontSize: 12 }}>置信度</Text>
                  <div style={{ marginTop: 4 }}>
                    <Progress
                      type="circle"
                      size={56}
                      percent={Math.round((aiResult.confidence || 0) * 100)}
                      strokeColor="#8b5cf6"
                      trailColor="rgba(255,255,255,0.06)"
                      format={pct => `${pct}%`}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <Text style={{ color: '#5a6664', fontSize: 12 }}>分析理由</Text>
                  <div style={{ marginTop: 4, color: '#889492', fontSize: 12, lineHeight: 1.6 }}>
                    {aiResult.reasoning}
                  </div>
                </Col>
              </Row>

              {aiResult.recommended_products?.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(139,92,246,0.12)' }}>
                  <Text style={{ color: '#5a6664', fontSize: 12 }}>推荐产品</Text>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aiResult.recommended_products.map((p, i) => (
                      <Tag key={i} color="purple" style={{ fontSize: 13, padding: '2px 10px' }}>{p}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 手动覆盖 */}
          <div style={{ marginTop: 8 }}>
            <Text style={{ ...labelStyle, marginRight: 12 }}>手动覆盖类型：</Text>
            <Select
              placeholder="可选：手动指定客户类型"
              allowClear
              style={{ width: 200 }}
              value={manualType}
              onChange={(v) => setManualType(v || null)}
              options={Object.entries(CLIENT_TYPES).map(([k, v]) => ({
                value: k,
                label: `${k}类 · ${v}`,
              }))}
            />
            <Text style={{ color: '#5a6664', fontSize: 11, marginLeft: 12 }}>
              {manualType
                ? '已手动覆盖，提交时将使用手动选择'
                : aiResult
                ? '将使用AI推荐类型'
                : '未分型'}
            </Text>
          </div>
        </div>

        {/* ================================================================
             Section 5 — 教练反馈
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <CheckCircleOutlined style={{ color: '#a0c040' }} />
            教练反馈
          </div>
          <Form.Item label={<span style={labelStyle}>选择预设反馈</span>}>
            <Radio.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              onChange={(e) => form.setFieldValue('coach_feedback', e.target.value)}
            >
              {COACH_FEEDBACK_PRESETS.map((text, i) => (
                <Radio key={i} value={text} style={{ color: '#889492', fontSize: 13 }}>
                  {text}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>自定义反馈（或修改预设）</span>} name="coach_feedback">
            <TextArea
              rows={4}
              placeholder="输入教练评估反馈..."
              maxLength={500}
              showCount
              style={{
                background: '#0d1414',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#edf0ef',
              }}
            />
          </Form.Item>
        </div>

        {/* ================================================================
             Section 6 — 销售跟进
           ================================================================ */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Badge status="processing" color="#c0c060" text="" style={{ marginRight: 4 }} />
            销售跟进
          </div>

          <Row gutter={[16, 8]}>
            {SALES_CHECKBOXES.map(item => (
              <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
                <Form.Item name={item.key} valuePropName="checked" noStyle>
                  <Checkbox style={{ color: '#889492', fontSize: 13 }}>{item.label}</Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Form.Item label={<span style={labelStyle}>销售备注</span>} name="sales_notes" style={{ marginTop: 16 }}>
            <TextArea
              rows={3}
              placeholder="记录销售跟进相关信息..."
              maxLength={500}
              showCount
              style={{
                background: '#0d1414',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#edf0ef',
              }}
            />
          </Form.Item>
        </div>

        {/* ================================================================
             Section 7 — 提交
           ================================================================ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            background: '#111818',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            marginBottom: 40,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Text style={{ color: '#5a6664', fontSize: 12 }}>
            提交前请确认所有评分和选项已填写完整。标记「高意向」的学员将自动进入优先跟进队列。
          </Text>
          <Space wrap>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={saving}
              disabled={submitting}
            >
              保存草稿
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={saving}
              htmlType="submit"
              style={{
                background: submitting ? undefined : '#b8d45a',
                border: 'none',
                fontWeight: 600,
                color: submitting ? undefined : '#0a0f0f',
              }}
            >
              提交评估
            </Button>
            <Button onClick={() => navigate(-1)} disabled={saving || submitting}>
              取消
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default AssessmentForm;
