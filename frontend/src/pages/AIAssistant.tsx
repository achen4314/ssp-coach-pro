import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Typography, Input, Button, Tag, Spin, Select, Segmented } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined, ThunderboltOutlined, MessageOutlined, BarChartOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Msg { id: string; role: 'user'|'assistant'; content: string; }
const gid = () => Math.random().toString(36).slice(2,11);

type Mode = 'chat' | 'weakness' | 'followup' | 'insight';

const AIAssistant: React.FC = () => {
  const [mode, setMode] = useState<Mode>('chat');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController|null>(null);
  const [athletes, setAthletes] = useState<{id:number;name:string;type:string}[]>([]);
  const [selId, setSelId] = useState<number|null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs,streaming]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/athletes', { params: { per_page: 100 } });
        const items = res.data.items || res.data.data || [];
        setAthletes(items.map((a:any) => ({ id:a.id, name:a.name, type:a.current_client_type||'' })));
      } catch {}
    })();
  }, []);

  const addMsg = (role: 'user'|'assistant', content: string) => {
    setMsgs(p => [...p, {id:gid(), role, content}]);
  };

  const streamSSE = async (body: any) => {
    const token = localStorage.getItem('auth-token');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const resp = await fetch('/api/v1/ai/coach-chat', {
      method:'POST',
      headers:{'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token}:{})},
      body:JSON.stringify(body),
      signal:ctrl.signal,
    });
    if (!resp.ok) throw new Error('HTTP '+resp.status);
    const reader = resp.body?.getReader();
    if (!reader) throw new Error('no stream');
    const dec = new TextDecoder(); let full = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      for (const line of dec.decode(value,{stream:true}).split('\n')) {
        if (line.startsWith('data: ')) {
          const d = line.slice(6).trim();
          if (d==='[DONE]') continue;
          try { full += JSON.parse(d).token || JSON.parse(d).content || d; } catch { full += d; }
          setStreaming(full);
        }
      }
    }
    if (full) addMsg('assistant', full);
    setStreaming('');
  };

  const sendChat = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    addMsg('user', text); setInput(''); setSending(true); setStreaming('');
    try {
      const history = msgs.map(m=>({role:m.role,content:m.content}));
      await streamSSE({message:text, history:[...history,{role:'user',content:text}]});
    } catch(e:any) {
      if (e?.name!=='AbortError') addMsg('assistant','Error: '+(e?.message||'fail'));
      setStreaming('');
    } finally { setSending(false); abortRef.current = null; }
  }, [input,sending,msgs]);

  const DIMS = ['cardio_endurance','running_ability','lower_body_strength','upper_body_pushpull','core_stability','motor_coordination','fatigue_resistance','training_willingness','completion_state','hyrox_potential'];

  const analyzeWeakness = async () => {
    if (!selId || sending) return;
    setSending(true); setStreaming('');
    addMsg('user', 'Analyze athlete #'+selId);
    try {
      const aRes = await apiClient.get('/athletes/'+selId+'/assessments');
      const list = Array.isArray(aRes.data) ? aRes.data : (aRes.data.items||aRes.data.data||[]);
      if (!list.length) { addMsg('assistant','No assessments found.'); setSending(false); return; }
      const latest = list[0];
      const scores:any={}; DIMS.forEach(k=>scores[k]=latest[k]||0);
      const aInfo = await apiClient.get('/athletes/'+selId);
      const a = aInfo.data;
      const prompt = `Athlete:${a.name}, Age:${a.age||'?'}, BG:${a.sport_background||'?'}\nScores:/50 total=${latest.total_score}\n${JSON.stringify(scores)}\nAnalyze weaknesses.`;
      await streamSSE({message:prompt, history:[]});
    } catch(e:any) {
      if (e?.name!=='AbortError') addMsg('assistant','Error: '+(e?.message||'fail'));
      setStreaming('');
    } finally { setSending(false); abortRef.current = null; }
  };

  const generateFollowup = async () => {
    if (!selId || sending) return;
    setSending(true); setStreaming('');
    addMsg('user', 'Followup for #'+selId);
    try {
      const aRes = await apiClient.get('/athletes/'+selId+'/assessments');
      const list = Array.isArray(aRes.data) ? aRes.data : (aRes.data.items||aRes.data.data||[]);
      const aInfo = await apiClient.get('/athletes/'+selId);
      const a = aInfo.data;
      const latest = list[0]||{};
      const typeMap:any={A:'A',B:'B',C:'C',D:'D',E:'E',F:'F'};
      const prompt = `Athlete:${a.name}, Type:${typeMap[latest.client_type||a.current_client_type]||'?'}, Score:${latest.total_score||0}/50, Weaknesses:${(latest.top_weaknesses||[]).join(',')}\nGenerate 3 WeChat followup scripts.`;
      await streamSSE({message:prompt, history:[]});
    } catch(e:any) {
      if (e?.name!=='AbortError') addMsg('assistant','Error: '+(e?.message||'fail'));
      setStreaming('');
    } finally { setSending(false); abortRef.current = null; }
  };

  const audienceInsight = async () => {
    if (sending) return;
    setSending(true); setStreaming('');
    addMsg('user', 'Audience insight report');
    try {
      const aRes = await apiClient.get('/athletes', { params: { per_page: 100 } });
      const items = aRes.data.items || aRes.data.data || [];
      const summaries = await Promise.all(items.map(async (a:any) => {
        try {
          const asRes = await apiClient.get('/athletes/'+a.id+'/assessments');
          const asList = Array.isArray(asRes.data)?asRes.data:(asRes.data.items||asRes.data.data||[]);
          const latest = asList[0]||{};
          return {name:a.name,type:a.current_client_type,source:a.source,score:latest.total_score||0,cType:latest.client_type||''};
        } catch { return null; }
      }));
      const valid = summaries.filter(Boolean);
      const prompt = `SSP ${valid.length} athletes summary:\n${JSON.stringify(valid)}\nAnalyze patterns and conversion bottlenecks.`;
      await streamSSE({message:prompt, history:[]});
    } catch(e:any) {
      if (e?.name!=='AbortError') addMsg('assistant','Error: '+(e?.message||'fail'));
      setStreaming('');
    } finally { setSending(false); abortRef.current = null; }
  };

  const cardBg = '#111818'; const border = '1px solid rgba(255,255,255,0.06)';

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 140px)',minHeight:500}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Title level={4} style={{color:'#edf0ef',fontWeight:600,margin:0}}>AI 教练助手</Title>
          <Tag color="green" style={{background:'rgba(160,192,64,0.12)',borderColor:'rgba(160,192,64,0.3)',color:'#a0c040',fontWeight:600}}>DeepSeek V4 Pro</Tag>
        </div>
        <Segmented value={mode} onChange={(v)=>{setMode(v as Mode);setMsgs([]);setStreaming('');}}
          options={[
            {value:'chat',icon:<MessageOutlined/>,label:'自由对话'},
            {value:'weakness',icon:<ThunderboltOutlined/>,label:'短板分析'},
            {value:'followup',icon:<SendOutlined/>,label:'跟进话术'},
            {value:'insight',icon:<BarChartOutlined/>,label:'人群洞察'},
          ]} style={{background:cardBg}} />
      </div>

      {(mode==='weakness'||mode==='followup') && (
        <div style={{marginBottom:12,display:'flex',gap:12,alignItems:'center'}}>
          <Text style={{color:'#889492',fontSize:13,whiteSpace:'nowrap'}}>选择学员：</Text>
          <Select showSearch placeholder="搜索学员…" value={selId} onChange={setSelId}
            filterOption={(inp,opt)=> (opt?.label as string||'').includes(inp)}
            options={athletes.map(a=>({value:a.id,label:a.name+' ('+(a.type||'?')+')'}))}
            style={{width:280}} size="middle" />
        </div>
      )}

      {mode==='weakness' && (
        <Button type="primary" icon={<ThunderboltOutlined/>} onClick={analyzeWeakness} disabled={!selId||sending} loading={sending}
          style={{marginBottom:12,alignSelf:'flex-start',fontWeight:600}}>分析短板</Button>
      )}
      {mode==='followup' && (
        <Button type="primary" icon={<SendOutlined/>} onClick={generateFollowup} disabled={!selId||sending} loading={sending}
          style={{marginBottom:12,alignSelf:'flex-start',fontWeight:600}}>生成话术</Button>
      )}
      {mode==='insight' && (
        <Button type="primary" icon={<BarChartOutlined/>} onClick={audienceInsight} disabled={sending} loading={sending}
          style={{marginBottom:12,alignSelf:'flex-start',fontWeight:600}}>生成人群洞察报告</Button>
      )}

      <Card bordered={false}
        styles={{body:{flex:1,overflow:'auto',padding:'16px 20px',display:'flex',flexDirection:'column'}}}
        style={{flex:1,background:cardBg,border,borderRadius:12,overflow:'hidden',display:'flex',flexDirection:'column',marginBottom:12}}>
        <div style={{flex:1,overflow:'auto'}}>
          {msgs.length===0 && !streaming && !sending && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',minHeight:200}}>
              <RobotOutlined style={{fontSize:48,color:'#a0c040',marginBottom:16,opacity:0.6}}/>
              <Text style={{color:'#889492',fontSize:14,marginBottom:8}}>
                {mode==='chat'?'AI 教练助手已就绪':mode==='weakness'?'选择学员后点击分析短板':mode==='followup'?'选择学员后点击生成话术':'点击按钮生成人群洞察报告'}
              </Text>
            </div>
          )}
          {msgs.map(m=>(
            <div key={m.id} style={{display:'flex',gap:12,marginBottom:20,flexDirection:m.role==='user'?'row-reverse':'row'}}>
              <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                background:m.role==='user'?'rgba(160,192,64,0.15)':'rgba(59,130,246,0.12)',
                border:'1px solid '+(m.role==='user'?'rgba(160,192,64,0.3)':'rgba(59,130,246,0.3)')}}>
                {m.role==='user'?<UserOutlined style={{color:'#a0c040',fontSize:14}}/>:<RobotOutlined style={{color:'#3b82f6',fontSize:14}}/>}
              </div>
              <div style={{maxWidth:'72%',padding:'10px 14px',borderRadius:12,
                borderTopRightRadius:m.role==='user'?4:12,borderTopLeftRadius:m.role==='assistant'?4:12,
                background:m.role==='user'?'rgba(160,192,64,0.10)':'#1a2424',border,lineHeight:1.6}}>
                <Text style={{color:'#edf0ef',fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{m.content}</Text>
              </div>
            </div>
          ))}
          {streaming && (
            <div style={{display:'flex',gap:12,marginBottom:20}}>
              <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.3)'}}>
                <RobotOutlined style={{color:'#3b82f6',fontSize:14}}/>
              </div>
              <div style={{maxWidth:'72%',padding:'10px 14px',borderRadius:12,borderTopLeftRadius:4,
                background:'#1a2424',border,lineHeight:1.6}}>
                <Text style={{color:'#edf0ef',fontSize:13,whiteSpace:'pre-wrap'}}>{streaming}</Text>
                <Spin size="small" style={{marginLeft:6}}/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
      </Card>

      {mode==='chat' && (
        <div style={{display:'flex',gap:10}}>
          <TextArea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}}
            placeholder="输入问题…" disabled={sending}
            autoSize={{minRows:2,maxRows:5}}
            style={{flex:1,background:'#0d1414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:8,color:'#edf0ef',fontSize:13,resize:'none'}}/>
          {sending
            ? <Button danger onClick={()=>abortRef.current?.abort()} style={{height:'auto',minHeight:52,borderRadius:8,fontWeight:600}}>停止</Button>
            : <Button type="primary" icon={<SendOutlined/>} onClick={sendChat} disabled={!input.trim()}
                style={{height:'auto',minHeight:52,borderRadius:8,fontWeight:600}}>发送</Button>}
        </div>
      )}
    </div>
  );
};
export default AIAssistant;
