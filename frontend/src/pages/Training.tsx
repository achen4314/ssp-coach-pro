import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Tag, Empty, Skeleton, Alert } from 'antd';
import { ScheduleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../api/client';

const { Title, Text } = Typography;

interface AthRow {
  id: number; name: string; current_client_type: string; source: string;
  assessment_count: number;
}

const typeColor: Record<string, string> = { A:'green',B:'blue',C:'purple',D:'orange',E:'cyan',F:'default' };
const typeLabel: Record<string, string> = { A:'备赛型',B:'观望型',C:'减脂型',D:'专项型',E:'低频型',F:'低意向' };

const Training: React.FC = () => {
  const [rows, setRows] = useState<AthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/athletes', { params: { per_page: 50 } });
        const data = res.data;
        const items: any[] = data.items || data.data || [];
        setRows(items.map((a: any) => ({
          id: a.id, name: a.name, current_client_type: a.current_client_type || '',
          source: a.source || '', assessment_count: a.assessment_count || 0,
        })));
      } catch (e: any) { setError(e?.message || '加载失败'); }
      finally { setLoading(false); }
    })();
  }, []);

  const cols: ColumnsType<AthRow> = [
    { title: '姓名', dataIndex: 'name', render: (v:string) => <span style={{color:'#edf0ef',fontWeight:500}}>{v}</span> },
    { title: '类型', dataIndex: 'current_client_type', render: (v:string) => <Tag color={typeColor[v]||'default'}>{typeLabel[v]||v||'-'}</Tag> },
    { title: '来源', dataIndex: 'source', render: (v:string) => <Text style={{color:'#889492'}}>{v||'-'}</Text> },
    { title: '评估次数', dataIndex: 'assessment_count', render: (v:number) => <Text style={{color:'#889492'}}>{v}</Text> },
  ];

  if (loading) return <div><Title level={4} style={{color:'#edf0ef'}}>训练计划</Title><Skeleton active /></div>;
  if (error) return <div><Title level={4} style={{color:'#edf0ef'}}>训练计划</Title><Alert type="error" message={error} /></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <Title level={4} style={{color:'#edf0ef',fontWeight:600,margin:0}}>训练计划</Title>
        <Button type="primary" icon={<PlusOutlined />} disabled>创建训练计划</Button>
      </div>
      <Card bordered={false} style={{background:'#111818',border:'1px solid rgba(160,192,64,0.25)',borderRadius:12,marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12,color:'#a0c040'}}>
          <ScheduleOutlined style={{fontSize:20}} />
          <div>
            <Text style={{color:'#edf0ef',fontSize:14,fontWeight:600}}>训练计划功能开发中</Text>
            <br/><Text style={{color:'#5a6664',fontSize:12}}>即将支持为学员创建个性化训练计划，敬请期待。</Text>
          </div>
        </div>
      </Card>
      <Card bordered={false} style={{background:'#111818',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12}}
        title={<span style={{color:'#edf0ef',fontSize:14,fontWeight:600}}>学员训练状态</span>}>
        {rows.length === 0 ? <Empty description="暂无学员" /> :
          <Table dataSource={rows} columns={cols} rowKey="id" pagination={{pageSize:10}} size="middle" />}
      </Card>
    </div>
  );
};
export default Training;
