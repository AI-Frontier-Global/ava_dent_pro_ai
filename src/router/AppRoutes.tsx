import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { useAuth } from '@/auth';
import { ProtectedRoute, PublicOnlyRoute } from './guards';
import { pageFromPath, pathFromPage, PAGE_TO_PATH } from './pageMap';
import { isSetupComplete } from '@/lib/bridge-manager';
import type { Page } from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ChatWidget from '@/components/ChatWidget';
import BridgeStatusIndicator from '@/components/BridgeStatusIndicator';
import AIPartnersShowcase from '@/components/AIPartnersShowcase';
import SetupWizard from '@/pages/SetupWizard';
import type { PlanId } from '@/types/saas';

const NEW_UX = import.meta.env.VITE_ENABLE_NEW_AI_UX === 'true';

const pageMeta: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على نشاط العيادة اليوم' },
  scheduling: { title: 'الجدولة', subtitle: 'الجدول الأسبوعي والحجز السريع' },
  'patient-engagement': { title: 'تفاعل المرضى', subtitle: 'متابعة وتواصل مع المرضى' },
  'patient-intake': { title: 'إدخال المرضى', subtitle: 'إدارة سجلات المرضى وإضافة جديد' },
  imaging: { title: 'التصوير', subtitle: 'أرشيف الصور والأشعة للمرضى' },
  treatment: { title: 'تخطيط العلاج', subtitle: 'خطط العلاج والمتابعة الطبية' },
  insurance: { title: 'التحقق من التأمين', subtitle: 'فحص تغطية التأمين الصحي' },
  membership: { title: 'خطط العضوية', subtitle: 'إدارة باقات العضوية الدورية' },
  billing: { title: 'الفوترة', subtitle: 'الفواتير وضريبة المبيعات وروابط الدفع' },
  payments: { title: 'المدفوعات', subtitle: 'تتبع المدفوعات والمتحصلات' },
  reports: { title: 'التقارير والتحليلات', subtitle: 'إحصائيات وأداء العيادة' },
  'ai-assistant': { title: 'المساعد الذكي', subtitle: 'تشغيل وإدارة مساعد الذكاء الاصطناعي المحلي' },
  'ai-hub': { title: 'مركز الذكاء الاصطناعي', subtitle: 'تحليلات ذكية وتنبؤ بالغياب ومساعد صوتي' },
  'ai-center': { title: 'مركز الموفرين', subtitle: 'إدارة موفرين الذكاء الاصطناعي وتتبّع التكاليف' },
  technology: { title: 'التقنيات المستخدمة', subtitle: 'نظرة مفصّلة على تقنيات الذكاء الاصطناعي' },
  settings: { title: 'الإعدادات', subtitle: 'إدارة إعدادات العيادة والتكاملات' },
  'ai-platform': { title: 'منصة الذكاء الاصطناعي', subtitle: 'إدارة مزودي الذكاء الاصطناعي والمفاتيح' },
};

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
  </div>
);

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const WhyUsPage = lazy(() => import('@/pages/WhyUsPage'));
const AIShowcasePage = lazy(() => import('@/pages/AIShowcasePage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const HelpCenterPage = lazy(() => import('@/pages/HelpCenterPage'));
const SuperAdminPage = lazy(() => import('@/pages/SuperAdminPage'));

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PatientsPage = lazy(() => import('@/pages/PatientsPage'));
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
const AIHubPage = lazy(() => import('@/pages/AIHubPage'));
const AICenter = lazy(() => import('@/pages/AICenter'));
const TechnologyPage = lazy(() => import('@/pages/TechnologyPage'));
const PatientEngagementPage = lazy(() => import('@/pages/PatientEngagementPage'));
const ImagingPage = lazy(() => import('@/pages/ImagingPage'));
const TreatmentPage = lazy(() => import('@/pages/TreatmentPage'));
const InsurancePage = lazy(() => import('@/pages/InsurancePage'));
const MembershipPage = lazy(() => import('@/pages/MembershipPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));

const LoginPageV2 = lazy(() => import('@/components/ui-v2/LoginPageV2'));
const DashboardV2 = lazy(() => import('@/components/ui-v2/DashboardV2'));
const PatientsV2 = lazy(() => import('@/components/ui-v2/PatientsV2'));
const AppointmentsV2 = lazy(() => import('@/components/ui-v2/AppointmentsV2'));
const SettingsV2 = lazy(() => import('@/components/ui-v2/SettingsV2'));
const AIPlatform = lazy(() => import('@/components/ui-v2/AIPlatform'));
const SidebarV2 = lazy(() => import('@/components/ui-v2/SidebarV2'));
const GlobalCopilotSidebar = lazy(() => import('@/components/ui-v2/GlobalCopilotSidebar'));

export default function AppRoutes() {
  const store = useStore();
  const { session, ready, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');

  const currentPage: Page = pageFromPath(location.pathname) ?? 'dashboard';

  useEffect(() => {
    if (ready && session && isSetupComplete() === false) {
      const onApp = location.pathname.startsWith('/app');
      if (onApp) setShowSetup(true);
    }
  }, [ready, session, location.pathname]);

  const navigateToPage = useCallback(
    (p: Page) => {
      navigate(pathFromPage(p));
      setMobileOpen(false);
    },
    [navigate],
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const handleLogin = useCallback(() => {
    navigate('/app/dashboard');
  }, [navigate]);

  const meta = pageMeta[currentPage];

  const renderPage = () => {
    if (NEW_UX) {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardV2 store={store} onNavigate={navigateToPage} />;
        case 'scheduling':
          return <AppointmentsV2 store={store} />;
        case 'patient-intake':
          return <PatientsV2 store={store} />;
        case 'settings':
          return <SettingsV2 store={store} />;
        case 'ai-platform':
          return <AIPlatform onNavigate={navigateToPage} />;
        default:
          return renderLegacyPage();
      }
    }
    return renderLegacyPage();
  };

  const renderLegacyPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage store={store} onNavigate={navigateToPage} />;
      case 'scheduling':
        return <AppointmentsPage store={store} />;
      case 'patient-intake':
        return <PatientsPage store={store} />;
      case 'billing':
        return <InvoicesPage store={store} />;
      case 'payments':
        return <InvoicesPage store={store} />;
      case 'patient-engagement':
        return <PatientEngagementPage store={store} />;
      case 'imaging':
        return <ImagingPage store={store} />;
      case 'treatment':
        return <TreatmentPage store={store} />;
      case 'insurance':
        return <InsurancePage store={store} />;
      case 'membership':
        return <MembershipPage store={store} />;
      case 'reports':
        return <ReportsPage store={store} />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'ai-hub':
        return <AIHubPage store={store} />;
      case 'ai-center':
        return <AICenter store={store} />;
      case 'technology':
        return <TechnologyPage />;
      case 'ai-platform':
        return <AIPlatform onNavigate={navigateToPage} />;
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <LandingPage
                onLaunchDemo={() => navigate('/app/dashboard')}
                onGoToWhyUs={() => navigate('/why-us')}
                onGoToAIShowcase={() => navigate('/ai-showcase')}
                onGoToPricing={() => navigate('/pricing')}
                onGoToHelpCenter={() => navigate('/help-center')}
              />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/why-us"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <WhyUsPage onBack={() => navigate('/')} onLaunchDemo={() => navigate('/app/dashboard')} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/ai-showcase"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <AIShowcasePage onBack={() => navigate('/')} onLaunchDemo={() => navigate('/app/dashboard')} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <PricingPage
                onBack={() => navigate('/')}
                onSelectPlan={(planId: PlanId) => {
                  setSelectedPlan(planId);
                  navigate('/signup');
                }}
              />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <SignupPage
                onBack={() => navigate('/pricing')}
                onSuccess={handleLogin}
                selectedPlan={selectedPlan}
                signIn={signIn}
                signInWithGoogle={signInWithGoogle}
              />
            </PublicOnlyRoute>
          }
        />
        <Route path="/help-center" element={<HelpCenterPage onBack={() => navigate('/')} />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute session={session} ready={ready}>
              <Suspense fallback={<PageLoader />}>
                {NEW_UX ? (
                  <LoginPageV2
                    onLogin={handleLogin}
                    onBack={() => navigate('/')}
                    signIn={signIn}
                    signUp={signUp}
                    signInWithGoogle={signInWithGoogle}
                  />
                ) : (
                  <LoginPage
                    onLogin={handleLogin}
                    onBack={() => navigate('/')}
                    signIn={signIn}
                    signUp={signUp}
                    signInWithGoogle={signInWithGoogle}
                  />
                )}
              </Suspense>
            </PublicOnlyRoute>
          }
        />

        {/* Protected app shell */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute session={session} ready={ready}>
              <ToastProvider>
                <div className="flex min-h-screen bg-slate-100">
                  <Suspense fallback={<PageLoader />}>
                    {NEW_UX ? (
                      <SidebarV2
                        current={currentPage}
                        onNavigate={navigateToPage}
                        mobileOpen={mobileOpen}
                        onCloseMobile={() => setMobileOpen(false)}
                        onSignOut={handleSignOut}
                      />
                    ) : (
                      <Sidebar
                        current={currentPage}
                        onNavigate={navigateToPage}
                        mobileOpen={mobileOpen}
                        onCloseMobile={() => setMobileOpen(false)}
                        onSignOut={handleSignOut}
                      />
                    )}
                  </Suspense>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar
                      title={meta.title}
                      subtitle={meta.subtitle}
                      onOpenMobile={() => setMobileOpen(true)}
                      onNavigateSettings={() => navigateToPage('ai-assistant')}
                      onNavigatePatient={() => navigateToPage('patient-intake')}
                      onNavigateInvoice={() => navigateToPage('billing')}
                      onNavigateAppointment={() => navigateToPage('scheduling')}
                      store={store}
                    />
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
                      <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700"
                      >
                        ← العودة للموقع التعريفي
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-error-600 transition-colors hover:bg-error-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>

                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                      {store.loading ? (
                        <PageLoader />
                      ) : (
                        <>
                          <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
                          {currentPage === 'dashboard' && (
                            <div className="mt-6">
                              <AIPartnersShowcase />
                            </div>
                          )}
                        </>
                      )}
                    </main>
                  </div>
                </div>
                {showSetup && <SetupWizard onComplete={() => setShowSetup(false)} />}
                <ChatWidget />
                {NEW_UX && (
                  <Suspense fallback={null}>
                    <GlobalCopilotSidebar onNavigate={navigateToPage} />
                  </Suspense>
                )}
              </ToastProvider>
            </ProtectedRoute>
          }
        >
          {/* Nested routes so /app/* always renders the shell with the right page */}
          {Object.entries(PAGE_TO_PATH).map(([page, path]) => {
            const rel = path.replace('/app', '') || '/';
            return <Route key={page} path={rel} element={null} />;
          })}
        </Route>

        {/* SuperAdmin */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute session={session} ready={ready}>
              <SuperAdminPage onBack={() => navigate('/app/dashboard')} />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
