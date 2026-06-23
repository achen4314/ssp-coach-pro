import { View, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Login() {
  const handleLogin = async () => {
    try {
      const { code } = await Taro.login();
      const res = await Taro.request({
        url: 'https://ssp-coach-pro.onrender.com/api/v1/auth/wx-login',
        method: 'POST',
        data: { code },
      });
      if (res.statusCode === 200) {
        Taro.setStorageSync('token', (res.data as any).token);
        Taro.setStorageSync('user', (res.data as any).user);
        Taro.switchTab({ url: '/pages/dashboard/index' });
      }
    } catch (e) {
      Taro.showToast({ title: '登录失败', icon: 'error' });
    }
  };

  return (
    <View style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0f0f' }}>
      <Text style={{ color:'#a0c040', fontSize:32, fontWeight:'bold', marginBottom:20 }}>SSP COACH</Text>
      <Text style={{ color:'#889492', fontSize:14, marginBottom:40 }}>铁牛运动表现 · 教练平台</Text>
      <Button type='primary' onClick={handleLogin} style={{ background:'#a0c040', border:'none', borderRadius:8, width:240 }}>
        微信一键登录
      </Button>
    </View>
  );
}
