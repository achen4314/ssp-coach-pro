import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const API = 'https://ssp-coach-pro.onrender.com/api/v1';
const bg = '#0a0f0f'; const card = '#111818'; const green = '#a0c040';
const border = '1px solid rgba(255,255,255,0.06)';

const typeColor: any = { A: green, B: '#3b82f6', C: '#8b5cf6', D: '#f5a623', E: '#06b6d4', F: '#889492' };
const typeLabel: any = { A: '备赛型', B: '观望型', C: '减脂型', D: '专项型', E: '低频型', F: '低意向' };
const dimLabels = ['心肺耐力','跑步能力','下肢力量','上肢推拉','核心稳定','动作协调','抗疲劳能力','训练意愿','完成状态','HYROX潜力'];
const dimKeys = ['cardio_endurance','running_ability','lower_body_strength','upper_body_pushpull','core_stability','motor_coordination','fatigue_resistance','training_willingness','completion_state','hyrox_potential'];

export default function AthleteDetail() {
  const { id } = useRouter().params;
  const [athlete, setAthlete] = useState<any>({});
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = Taro.getStorageSync('token') || '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const h = { Authorization: 'Bearer ' + token };
      try {
        const [aRes, asRes] = await Promise.all([
          Taro.request({ url: API + '/athletes/' + id, header: h }),
          Taro.request({ url: API + '/athletes/' + id + '/assessments', header: h }),
        ]);
        setAthlete(aRes.data || {});
        setAssessments(Array.isArray(asRes.data) ? asRes.data : ((asRes.data as any)?.items || []));
      } catch { Taro.showToast({ title: '加载失败', icon: 'none' }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const latest = assessments[0] || {};
  const scores = dimKeys.map(k => latest[k] || 0);
  const total = scores.reduce((a, b) => a + b, 0);

  return (
    <ScrollView style={{ height: '100vh', background: bg, padding: 12 }} scrollY>
      {/* Basic Info */}
      <View style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: '#edf0ef', fontSize: 18, fontWeight: 600 }}>{athlete.name}</Text>
        <View style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: '#889492', fontSize: 11 }}>{athlete.gender || ''} · {athlete.age || ''}岁</Text>
          <Text style={{ color: '#889492', fontSize: 11 }}>{athlete.source || ''}</Text>
          <Text style={{ color: '#889492', fontSize: 11 }}>{athlete.sport_background || ''}</Text>
        </View>
        {athlete.current_client_type && (
          <View style={{ marginTop: 8, background: (typeColor[athlete.current_client_type] || '#889492') + '22', padding: '3px 10px', borderRadius: 99, alignSelf: 'flex-start' }}>
            <Text style={{ color: typeColor[athlete.current_client_type] || '#889492', fontSize: 11, fontWeight: 600 }}>
              {typeLabel[athlete.current_client_type] || athlete.current_client_type}
            </Text>
          </View>
        )}
      </View>

      {/* Latest Assessment */}
      {assessments.length > 0 ? (
        <View style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            最新评估 · 总分 <Text style={{ color: green }}>{total}</Text>/50
          </Text>
          {dimLabels.map((d, i) => (
            <View key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: '#889492', fontSize: 11, width: 60, flexShrink: 0 }}>{d}</Text>
              <View style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, margin: '0 8px', overflow: 'hidden' }}>
                <View style={{ height: '100%', width: (scores[i] / 5 * 100) + '%', background: scores[i] >= 4 ? '#52c41a' : scores[i] >= 3 ? '#f5a623' : '#f43f4e', borderRadius: 2 }} />
              </View>
              <Text style={{ color: '#edf0ef', fontSize: 12, fontWeight: 600, width: 30, textAlign: 'right' }}>{scores[i]}</Text>
            </View>
          ))}
          {latest.top_weaknesses?.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#889492', fontSize: 11 }}>短板：{latest.top_weaknesses.join('、')}</Text>
            </View>
          )}
          {latest.coach_feedback && (
            <View style={{ marginTop: 6, padding: 8, background: 'rgba(160,192,64,0.06)', borderRadius: 6 }}>
              <Text style={{ color: green, fontSize: 11 }}>教练反馈：{latest.coach_feedback}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 12, alignItems: 'center' }}>
          <Text style={{ color: '#5a6664', fontSize: 13 }}>暂无评估记录</Text>
        </View>
      )}

      {/* Assessment History */}
      {assessments.length > 1 && (
        <View style={{ background: card, border, borderRadius: 10, padding: 14 }}>
          <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>历史评估</Text>
          {assessments.slice(1).map((a: any, i: number) => (
            <View key={i} style={{ padding: '8px 0', borderBottom: i < assessments.length - 2 ? border : 'none' }}>
              <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#889492', fontSize: 11 }}>{a.assessment_date || a.date || ''}</Text>
                <Text style={{ color: '#edf0ef', fontSize: 12, fontWeight: 600 }}>
                  总分 {dimKeys.reduce((sum: number, k: string) => sum + (a[k] || 0), 0)}/50
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
