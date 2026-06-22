import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { sspTheme } from './theme';
import AuthGuard from './components/AuthGuard';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AthleteList from './pages/AthleteList';
import AthleteDetail from './pages/AthleteDetail';
import AssessmentForm from './pages/AssessmentForm';
import SalesPipeline from './pages/SalesPipeline';

function App() {
  return (
    <ConfigProvider theme={sspTheme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 受保护路由 */}
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/athletes" element={<AthleteList />} />
            <Route path="/athletes/:id" element={<AthleteDetail />} />
            <Route path="/assessments/new" element={<AssessmentForm />} />
            <Route path="/pipeline" element={<SalesPipeline />} />
          </Route>

          {/* 根路径重定向 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
