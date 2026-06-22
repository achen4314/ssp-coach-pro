import { lazy, Suspense } from 'react';
import { lazy, Suspense } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { sspTheme } from './theme';
import AuthGuard from './components/AuthGuard';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AthleteList = lazy(() => import('./pages/AthleteList'));
const AthleteDetail = lazy(() => import('./pages/AthleteDetail'));
const AssessmentForm = lazy(() => import('./pages/AssessmentForm'));
const SalesPipeline = lazy(() => import('./pages/SalesPipeline'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);
const AthleteList = lazy(() => import('./pages/AthleteList'));
const AthleteDetail = lazy(() => import('./pages/AthleteDetail'));
const AssessmentForm = lazy(() => import('./pages/AssessmentForm'));
const SalesPipeline = lazy(() => import('./pages/SalesPipeline'));

// 加载占位
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <ConfigProvider theme={sspTheme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
            <Route path="/athletes" element={<Suspense fallback={<PageLoader />}><AthleteList /></Suspense>} />
            <Route path="/athletes/:id" element={<Suspense fallback={<PageLoader />}><AthleteDetail /></Suspense>} />
            <Route path="/assessments/new" element={<Suspense fallback={<PageLoader />}><AssessmentForm /></Suspense>} />
            <Route path="/pipeline" element={<Suspense fallback={<PageLoader />}><SalesPipeline /></Suspense>} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
