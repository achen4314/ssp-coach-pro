import { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

const API = 'https://ssp-coach-pro.onrender.com/api/v1';
const bg = '#0a0f0f'; const card = '#111818'; const green = '#a0c040';
const border = '1px solid rgba(255,255,255,0.06)';

const typeColor: any = { A: green, B: '#3b82f6', C: '#8b5cf6', D: '#f5a623', E: '#06b6d4', F: '#889492' };
const typeLabel: any = { A: '备赛型', B: '观望型', C: '减脂型', D: '专项型', E: '低频型', F: '低意向' };

export default function Athletes() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const token = Taro.getStorageSync('token') || '';

  const fetchList = async (kw = '') => {
    setLoading(true);
    try {
      const h = { Authorization: 'Bearer ' + token };
      const res = await Taro.request({ url: API + '/athletes', header: h, data: { search: kw, per_page: 50 } });
      const items = (res.data as any)?.items || (res.data as any)?.data || [];
      setList(items);
    } catch { Taro.showToast({ title: '加载失败', icon: 'none' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <View style={{ height: '100vh', background: bg, display: 'flex', flexDirection: 'column' }}>
      <View style={{ padding: 12 }}>
        <Input value={search} onInput={e => setSearch(e.detail.value)}
          onConfirm={() => fetchList(search)} placeholder='搜索学员…'
          style={{ background: card, border, borderRadius: 8, padding: '10px 14px', color: '#edf0ef', fontSize: 13 }} />
      </View>
      <ScrollView style={{ flex: 1, padding: '0 12px' }} scrollY
        refresherEnabled onRefresherRefresh={() => fetchList(search)} refresherTriggered={loading}>
        {list.map((a: any, i: number) => (
          <View key={i} onClick={() => Taro.navigateTo({ url: '/pages/detail/index?id=' + a.id })}
            style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 8 }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 500 }}>{a.name}</Text>
                <Text style={{ color: '#5a6664', fontSize: 11, display: 'block', marginTop: 2 }}>
                  {a.source || ''} · 评估{a.assessment_count || 0}次
                </Text>
              </View>
              <View style={{ background: (typeColor[a.current_client_type] || '#889492') + '22', padding: '3px 10px', borderRadius: 99 }}>
                <Text style={{ color: typeColor[a.current_client_type] || '#889492', fontSize: 11, fontWeight: 600 }}>
                  {typeLabel[a.current_client_type] || a.current_client_type || '-'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
