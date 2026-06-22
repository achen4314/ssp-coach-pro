import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Typography, Input, Button, Tag, Spin } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';


const { Title, Text } = Typography;
const { TextArea } = Input;

interface Msg { id: string; role: 'user'|'assistant'; content: string; }
const gid = () => Math.random().toString(36).slice(2,11);

const AIAssistant: React.FC = () => {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController|null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs,streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: Msg = { id: gid(), role: 'user', content: text };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setSending(true);
    setStreaming('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const history = msgs.map(m => ({role:m.role,content:m.content}));
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/v1/ai/coach-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: [...history, {role:'user',content:text}],
        }),
        signal: ctrl.signal,
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');
      const dec = new TextDecoder();
      let full = '';
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, {stream:true});
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6).trim();
            if (d === '[DONE]') continue;
            try {
              const p = JSON.parse(d);
              full += p.token || p.content || p;
            } catch { full += d; }
            setStreaming(full);
          }
        }
      }
      if (full) setMsgs(p => [...p, {id:gid(),role:'assistant',content:full}]);
      setStreaming('');
    } catch (e: any) {
      if (e?.name !== 'AbortError' && e?.code !== 'ERR_CANCELED') {
        setMsgs(p => [...p, {id:gid(),role:'assistant',content:'❌ '+(e?.message||'请求失败')}]);
      }
      setStreaming('');
    } finally { setSending(false); abortRef.current = null; }
  }, [input,sending,msgs]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 180px)',minHeight:500}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <Title level={4} style={{color:'#edf0ef',fontWeight:600,margin:0}}>AI 教练助手</Title>
        <Tag color="green" style={{background:'rgba(160,192,64,0.12)',borderColor:'rgba(160,192,64,0.3)',color:'#a0c040',fontWeight:600}}>DeepSeek V4 Pro</Tag>
      </div>
      <Card bordered={false}
        styles={{body:{flex:1,overflow:'auto',padding:'16px 20px',display:'flex',flexDirection:'column'}}}
        style={{flex:1,background:'#111818',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden',display:'flex',flexDirection:'column',marginBottom:12}}>
        <div style={{flex:1,overflow:'auto'}}>
          {msgs.length===0 && !streaming && !sending && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',minHeight:200}}>
              <RobotOutlined style={{fontSize:48,color:'#a0c040',marginBottom:16,opacity:0.6}} />
              <Text style={{color:'#889492',fontSize:14,marginBottom:8}}>AI 教练助手已就绪</Text>
              <Text style={{color:'#5a6664',fontSize:12}}>可以帮你分析学员数据、制定训练建议、生成跟进话术</Text>
            </div>
          )}
          {msgs.map(m => (
            <div key={m.id} style={{display:'flex',gap:12,marginBottom:20,flexDirection:m.role==='user'?'row-reverse':'row'}}>
              <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                background:m.role==='user'?'rgba(160,192,64,0.15)':'rgba(59,130,246,0.12)',
                border:'1px solid '+(m.role==='user'?'rgba(160,192,64,0.3)':'rgba(59,130,246,0.3)')}}>
                {m.role==='user'?<UserOutlined style={{color:'#a0c040',fontSize:14}}/>:<RobotOutlined style={{color:'#3b82f6',fontSize:14}}/>}
              </div>
              <div style={{maxWidth:'72%',padding:'10px 14px',borderRadius:12,
                borderTopRightRadius:m.role==='user'?4:12,borderTopLeftRadius:m.role==='assistant'?4:12,
                background:m.role==='user'?'rgba(160,192,64,0.10)':'#1a2424',
                border:'1px solid rgba(255,255,255,0.06)',lineHeight:1.6}}>
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
                background:'#1a2424',border:'1px solid rgba(255,255,255,0.06)',lineHeight:1.6}}>
                <Text style={{color:'#edf0ef',fontSize:13,whiteSpace:'pre-wrap'}}>{streaming}</Text>
                <Spin size="small" style={{marginLeft:6}}/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
      </Card>
      <div style={{display:'flex',gap:10}}>
        <TextArea value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="输入问题，例如：分析张三的训练数据" disabled={sending}
          autoSize={{minRows:2,maxRows:5}}
          style={{flex:1,background:'#0d1414',border:'1px solid rgba(255,255,255,0.10)',borderRadius:8,color:'#edf0ef',fontSize:13,resize:'none'}}/>
        {sending
          ? <Button danger onClick={()=>abortRef.current?.abort()} style={{height:'auto',minHeight:52,borderRadius:8,fontWeight:600}}>停止</Button>
          : <Button type="primary" icon={<SendOutlined/>} onClick={send} disabled={!input.trim()}
              style={{height:'auto',minHeight:52,borderRadius:8,fontWeight:600}}>发送</Button>}
      </div>
    </div>
  );
};
export default AIAssistant;
