import { useState, useEffect } from 'react';
import { View, Text, Picker, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

const API = 'https://ssp-coach-pro.onrender.com/api/v1';
const bg = '#0a0f0f'; const card = '#111818'; const green = '#a0c040';
const border = '1px solid rgba(255,255,255,0.06)';

const DIMS = ['心肺耐力','跑步能力','下肢力量','上肢推拉','核心稳定','动作协调','抗疲劳能力','训练意愿','完成状态','HYROX潜力'];
const DIM_KEYS = ['cardio_endurance','running_ability','lower_body_strength','upper_body_pushpull','core_stability','motor_coordination','fatigue_resistance','training_willingness','completion_state','hyrox_potential'];
const TYPES = ['A-备赛型','B-观望型','C-减脂型','D-专项型','E-低频型','F-低意向'];
const PRODUCTS = ['HYROX基础测试299元','HYROX12周备赛营','团课月卡','运动表现专项私教','燃脂营','周末课','低频课包'];

export default function Assessment() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selAthlete, setSelAthlete] = useState(0);
  const [scores, setScores] = useState<number[]>([3,3,3,3,3,3,3,3,3,3]);
  const [selType, setSelType] = useState(0);
  const [selProducts, setSelProducts] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const token = Taro.getStorageSync('token') || '';

  useEffect(() => {
    (async () => {
      try {
        const res = await Taro.request({ url: API + '/athletes', header: { Authorization: 'Bearer ' + token }, data: { per_page: 100 } });
        const items = (res.data as any)?.items || (res.data as any)?.data || [];
        setAthletes(items);
      } catch {}
    })();
  }, []);

  const totalScore = scores.reduce((a, b) => a + b, 0);

  const submit = async () => {
    if (!athletes[selAthlete]) { Taro.showToast({ title: '请选择学员', icon: 'none' }); return; }
    setSubmitting(true);
    try {
      const body: any = { athlete_id: athletes[selAthlete].id, assessment_date: new Date().toISOString().slice(0,10) };
      DIM_KEYS.forEach((k, i) => body[k] = scores[i]);
      body.client_type = TYPES[selType].charAt(0);
      body.recommended_products = selProducts.map(i => PRODUCTS[i]);
      body.top_weaknesses = [];
      await Taro.request({ url: API + '/assessments', method: 'POST', header: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, data: body });
      Taro.showToast({ title: '提交成功！总分' + totalScore + '/50', icon: 'success' });
      setScores([3,3,3,3,3,3,3,3,3,3]); setSelAthlete(0); setSelType(0); setSelProducts([]);
    } catch { Taro.showToast({ title: '提交失败', icon: 'error' }); }
    finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={{ height: '100vh', background: bg, padding: 12 }} scrollY>
      {/* Athlete Selector */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: '#889492', fontSize: 12, marginBottom: 4, display: 'block' }}>选择学员</Text>
        <Picker mode='selector' range={athletes.map(a => a.name)} value={selAthlete} onChange={e => setSelAthlete(Number(e.detail.value))}>
          <View style={{ background: card, border, borderRadius: 8, padding: '10px 14px' }}>
            <Text style={{ color: selAthlete < athletes.length ? '#edf0ef' : '#5a6664', fontSize: 13 }}>
              {athletes[selAthlete]?.name || '点击选择学员'}
            </Text>
          </View>
        </Picker>
      </View>

      {/* 10 Scores */}
      <View style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: '#edf0ef', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>10维评分 · 总分 {totalScore}/50</Text>
        {DIMS.map((d, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ color: '#889492', fontSize: 11 }}>{d}</Text>
              <Text style={{ color: scores[i] >= 4 ? '#52c41a' : scores[i] >= 3 ? '#f5a623' : '#f43f4e', fontSize: 12, fontWeight: 600 }}>{scores[i]}分</Text>
            </View>
            <View style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <View key={v} onClick={() => { const n = [...scores]; n[i] = v; setScores(n); }}
                  style={{ flex: 1, height: 24, borderRadius: 4, background: scores[i] >= v ? green : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: scores[i] >= v ? '#0a0f0f' : '#5a6664', fontSize: 10, fontWeight: 700 }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Type */}
      <Picker mode='selector' range={TYPES} value={selType} onChange={e => setSelType(Number(e.detail.value))}>
        <View style={{ background: card, border, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          <Text style={{ color: '#889492', fontSize: 11, marginBottom: 2, display: 'block' }}>客户类型</Text>
          <Text style={{ color: '#edf0ef', fontSize: 13 }}>{TYPES[selType]}</Text>
        </View>
      </Picker>

      {/* Products */}
      <View style={{ background: card, border, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <Text style={{ color: '#889492', fontSize: 12, marginBottom: 8 }}>推荐产品</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRODUCTS.map((p, i) => (
            <View key={i} onClick={() => { const n = [...selProducts]; const idx = n.indexOf(i); idx >= 0 ? n.splice(idx, 1) : n.push(i); setSelProducts(n); }}
              style={{ padding: '4px 10px', borderRadius: 99, background: selProducts.includes(i) ? green + '33' : 'rgba(255,255,255,0.06)',
                border: '1px solid ' + (selProducts.includes(i) ? green : 'rgba(255,255,255,0.10)') }}>
              <Text style={{ color: selProducts.includes(i) ? green : '#889492', fontSize: 11 }}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button onClick={submit} loading={submitting} disabled={submitting}
        style={{ background: green, color: '#0a0f0f', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
        提交评估
      </Button>
    </ScrollView>
  );
}
