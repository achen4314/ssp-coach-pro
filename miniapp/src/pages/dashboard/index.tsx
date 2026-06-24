import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

const API = 'https://ssp-coach-pro.onrender.com/api/v1';
const bg = '#0a0f0f'; const card = '#111818'; const green = '#a0c040';
const border = '1px solid rgba(255,255,255,0.06)';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [funnel, setFunnel] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = Taro.getStorageSync('token') || '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const h = { Authorization: 'Bearer ' + token };
      const [sRes, fRes, aRes] = await Promise.all([
        Taro.request({ url: API + '/dashboard/stats', header: h }),
        Taro.request({ url: API + '/dashboard/funnel', header: h }),
        Taro.request({ url: API + '/athletes', header: h, data: { per_page: 10 } }),
      ]);
      setStats(sRes.data || {});
      setFunnel(fRes.data || []);
      const items = (aRes.data as any)?.items || (aRes.data as any)?.data || [];
      setAthletes(items);
    } catch (e) { Taro.showToast({ title: '加载失败', icon: 'none' }); }
    finally { setLoading(false); }
  };

  const typeColor: any = { A: green, B: '#3b82f6', C: '#8b5cf6', D: '#f5a623', E: '#06b6d4', F: '#889492' };
  const typeLabel: any = { A: '备赛型', B: '观望型', C: '减脂型', D: '专项型', E: '低频型', F: '低意向' };

  return (
    <ScrollView style={{ height: '100vh', background: bg, padding: '16px' }}
      scrollY refresherEnabled onRefresherRefresh={fetchData}
      refresherTriggered={loading}>
      
      {/* Stats Row */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { label: '总学员', value: stats.total_athletes || 0, color: green },
          { label: '本月评估', value: (stats.assessments_this_month || 0) + '/' + (stats.assessments_target || 50), color: '#3b82f6' },
          { label: '待跟进', value: stats.pending_followups || 0, color: '#f5a623' },
          { label: '成交率', value: (stats.conversion_rate_this_month || 0) + '%', color: '#8b5cf6' },
        ].map((s, i) => (
          <View key={i} style={{
            flex: '1 1 44%', background: card, borderRadius: 10, padding: 14,
            borderLeft: '3px solid ' + s.color, border, minWidth: 140,
          }}>
            <Text style={{ color: '#5a6664', fontSize: 11 }}>{s.label}</Text>
            <Text style={{ color: '#edf0ef', fontSize: 24, fontWeight: 700, display: 'block', marginTop: 4 }}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Funnel */}
      <View style={{ background: card, borderRadius: 10, padding: 14, marginBottom: 16, border }}>
        <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>销售漏斗</Text>
        {funnel.map((f: any, i: number) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ color: '#889492', fontSize: 12 }}>{f.stage}</Text>
              <Text style={{ color: '#edf0ef', fontSize: 12, fontWeight: 600 }}>{f.count}人 ({f.pct}%)</Text>
            </View>
            <View style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: (f.pct || 0) + '%', background: green, borderRadius: 3 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Recent Athletes */}
      <View style={{ background: card, borderRadius: 10, padding: 14, border }}>
        <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>最近学员</Text>
        {athletes.map((a: any, i: number) => (
          <View key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < athletes.length - 1 ? border : 'none' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#edf0ef', fontSize: 13, fontWeight: 500 }}>{a.name}</Text>
              <Text style={{ color: '#5a6664', fontSize: 11 }}>{a.source || ''}</Text>
            </View>
            <View style={{ background: (typeColor[a.current_client_type] || '#889492') + '22', padding: '2px 8px', borderRadius: 99 }}>
              <Text style={{ color: typeColor[a.current_client_type] || '#889492', fontSize: 10, fontWeight: 600 }}>
                {typeLabel[a.current_client_type] || a.current_client_type || '-'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
