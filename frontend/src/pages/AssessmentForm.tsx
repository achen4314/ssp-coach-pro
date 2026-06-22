import React from 'react';
import { Card, Typography, Form, Input, Select, Button, Space } from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

const AssessmentForm: React.FC = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('提交评估:', values);
  };

  return (
    <div>
      <Title
        level={4}
        style={{ color: '#edf0ef', marginBottom: 24, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        新建评估
      </Title>

      <Card
        bordered={false}
        style={{
          background: '#111818',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          maxWidth: 720,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ assessment_type: 'initial' }}
        >
          <Form.Item
            label="学员姓名"
            name="athlete_name"
            rules={[{ required: true, message: '请输入学员姓名' }]}
          >
            <Input
              placeholder="输入学员姓名或从列表中选择"
              style={{
                background: '#0d1414',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#edf0ef',
              }}
            />
          </Form.Item>

          <Form.Item
            label="评估类型"
            name="assessment_type"
            rules={[{ required: true, message: '请选择评估类型' }]}
          >
            <Select
              options={[
                { value: 'initial', label: '初次评估' },
                { value: 'followup', label: '跟进评估' },
                { value: 'pre_competition', label: '赛前评估' },
                { value: 'post_competition', label: '赛后分析' },
              ]}
            />
          </Form.Item>

          <Form.Item label="评估备注" name="notes">
            <TextArea
              rows={4}
              placeholder="记录评估过程中的观察和发现..."
              style={{
                background: '#0d1414',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#edf0ef',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{
                  background: '#b8d45a',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                提交评估
              </Button>
              <Button>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AssessmentForm;
