import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Empty, Skeleton, Alert } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../api/client';

const { Title, Text } = Typography;

interface AthRow { id: number; name: string; current_client_type: string; latest_score: number | null; source: string; }

const typeColor: Record<string, string> = { A:'green',B:'blue',C:'purple',D:'orange',E:'cyan',F:'default' };
const typeLabel: Record<string, string> = { A:'备赛型',B:'观望型',C:'减脂型',D:'专项型',E:'低频型',F:'低意向' };
function scoreColor(s: number): string { return s>=35?'#52c41a':s>=20?'#f5a623':'#f43f4e'; }

const Reports: React.FC = () => {
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
          source: a.source || '',
          latest_score: a.latest_assessment?.total_score ?? null,
        })));
      } catch (e: any) { setError(e?.message || '加载失败'); }
      finally { setLoading(false); }
    })();
  }, []);

  const cols: ColumnsType<AthRow> = [
    { title: '姓名', dataIndex: 'name', render: (v:string) => <span style={{color:'#edf0ef',fontWeight:500}}>{v}</span> },
    { title: '类型', dataIndex: 'current_client_type', render: (v:string) => <Tag color={typeColor[v]||'default'}>{typeLabel[v]||v||'-'}</Tag> },
    { title: '最新评分', dataIndex: 'latest_score', render: (v:number|null) => v==null ? <Text style={{color:'#5a6664'}}>-</Text> : <span style={{fontWeight:700,color:scoreColor(v),fontFamily:'monospace'}}>{v}/50</span> },
    { title: '操作', key:'action', render: () => <Text style={{color:'#5a6664',fontSize:12}}>待生成</Text> },
  ];

  if (loading) return <div><Title level={4} style={{color:'#edf0ef'}}>报告中心</Title><Skeleton active /></div>;
  if (error) return <div><Title level={4} style={{color:'#edf0ef'}}>报告中心</Title><Alert type="error" message={error} /></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <Title level={4} style={{color:'#edf0ef',fontWeight:600,margin:0}}>报告中心</Title>
      </div>
      <Card bordered={false} style={{background:'#111818',border:'1px solid rgba(160,192,64,0.25)',borderRadius:12,marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12,color:'#a0c040'}}>
          <FileTextOutlined style={{fontSize:20}} />
          <div>
            <Text style={{color:'#edf0ef',fontSize:14,fontWeight:600}}>报告生成功能即将上线</Text>
            <br/><Text style={{color:'#5a6664',fontSize:12}}>评估报告将自动整合学员数据与训练建议。</Text>
          </div>
        </div>
      </Card>
      <Card bordered={false} style={{background:'#111818',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12}}
        title={<span style={{color:'#edf0ef',fontSize:14,fontWeight:600}}>可生成报告的学员</span>}>
        {rows.length === 0 ? <Empty description="暂无学员" /> :
          <Table dataSource={rows} columns={cols} rowKey="id" pagination={{pageSize:10}} size="middle" />}
      </Card>
    </div>
  );
};
export default Reports;
