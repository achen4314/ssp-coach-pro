import { View, Text } from '@tarojs/components';

export default function Dashboard() {
  return (
    <View style={{ padding: 20, background: '#0a0f0f', minHeight: '100vh' }}>
      <Text style={{ color: '#a0c040', fontSize: 24, fontWeight: 'bold' }}>SSP 工作台</Text>
      <Text style={{ color: '#889492', fontSize: 14, marginTop: 8 }}>欢迎使用铁牛运动表现教练平台</Text>
    </View>
  );
}
