import { useState, useEffect } from 'react';
import { useStore } from './store';
import { useAuth } from './auth';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import type { Page } from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AIHubPage from './pages/AIHubPage';
import AICenter from './pages/AICenter';
import TechnologyPage from './pages/TechnologyPage';
import SetupWizard from './pages/SetupWizard';
import ComingSoon from './components/ComingSoon';
import ChatWidget from './components/ChatWidget';
import BridgeStatusIndicator from './components/BridgeStatusIndicator';
import AIPartnersShowcase from './components/AIPartnersShowcase';
import { isSetupComplete, resetSetup } from './lib/bridge-manager';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WhyUsPage from './pages/WhyUsPage';
import AIShowcasePage from './pages/AIShowcasePage';
import PatientEngagementPage from './pages/PatientEngagementPage';
import ImagingPage from './pages/ImagingPage';
import TreatmentPage from './pages/TreatmentPage';
import InsurancePage from './pages/InsurancePage';
import MembershipPage from './pages/MembershipPage';
import ReportsPage from './pages/ReportsPage';
import PricingPage from './pages/PricingPage';
import SignupPage from './pages/SignupPage';
import SuperAdminPage from './pages/SuperAdminPage';
import HelpCenterPage from './pages/HelpCenterPage';
import type { PlanId } from './types/saas';

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
  'technology': { title: 'التقنيات المستخدمة', subtitle: 'نظرة مفصّلة على تقنيات الذكاء الاصطناعي' },
  settings: { title: 'الإعدادات', subtitle: 'إدارة إعدادات العيادة والتكاملات' },
};

function App() {
  const [view, setView] = useState<'landing' | 'login' | 'app' | 'why-us' | 'ai-showcase' | 'pricing' | 'signup' | 'superadmin' | 'helpcenter'>('landing');
  const store = useStore();
  const { session, ready, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Once we know the session, route automatically
  useEffect(() => {
    if (!ready) return;
    if (session && (view === 'login' || view === 'landing' || view === 'why-us' || view === 'ai-showcase' || view === 'signup')) {
      setView('app');
      setPage('dashboard');
    }
    if (!session && view === 'app') {
      setView('login');
    }
  }, [session, ready, view]);

  useEffect(() => {
    if (view === 'app' && !isSetupComplete()) {
      setShowSetup(true);
    }
  }, [view]);
  const backToLanding = () => setView('landing');
  const goToWhyUs = () => setView('why-us');
  const goToAIShowcase = () => setView('ai-showcase');
  const goToPricing = () => setView('pricing');
  const goToHelpCenter = () => setView('helpcenter');
  const goToSuperAdmin = () => setView('superadmin');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');
  const launchDemo = () => {
    setView('app');
    setPage('dashboard');
  };
  const handleLogin = () => {
    setView('app');
    setPage('dashboard');
  };
  const handleSignOut = async () => {
    await signOut();
    setView('landing');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  if (view === 'landing' && !session) {
    return (
      <ToastProvider>
        <LandingPage onLaunchDemo={launchDemo} onGoToWhyUs={goToWhyUs} onGoToAIShowcase={goToAIShowcase} onGoToPricing={goToPricing} onGoToHelpCenter={goToHelpCenter} />
      </ToastProvider>
    );
  }

  if (view === 'pricing' && !session) {
    return (
      <PricingPage
        onBack={backToLanding}
        onSelectPlan={(planId) => { setSelectedPlan(planId); setView('signup'); }}
      />
    );
  }

  if (view === 'signup' && !session) {
    return (
      <SignupPage
        onBack={() => setView('pricing')}
        onSuccess={handleLogin}
        selectedPlan={selectedPlan}
        signIn={signIn}
        signInWithGoogle={signInWithGoogle}
      />
    );
  }

  if (view === 'helpcenter') {
    return <HelpCenterPage onBack={backToLanding} />;
  }

  if (view === 'superadmin') {
    return <SuperAdminPage onBack={() => setView('app')} />;
  }

  if ((view === 'login' || !session) && view !== 'why-us') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={backToLanding}
        signIn={signIn}
        signUp={signUp}
        signInWithGoogle={signInWithGoogle}
      />
    );
  }

  if (view === 'why-us' && !session) {
    return <WhyUsPage onBack={backToLanding} onLaunchDemo={launchDemo} />;
  }

  if (view === 'ai-showcase' && !session) {
    return <AIShowcasePage onBack={backToLanding} onLaunchDemo={launchDemo} />;
  }

  const meta = pageMeta[page];

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage store={store} onNavigate={(p) => setPage(p)} />;
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
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar
          current={page}
          onNavigate={setPage}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onSignOut={handleSignOut}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={meta.title}
            subtitle={meta.subtitle}
            onOpenMobile={() => setMobileOpen(true)}
            onNavigateSettings={() => setPage('ai-assistant')}
            onNavigatePatient={() => setPage('patient-intake')}
            onNavigateInvoice={() => setPage('billing')}
            onNavigateAppointment={() => setPage('scheduling')}
            store={store}
          />
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
            <button
              onClick={backToLanding}
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
              <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
              </div>
            ) : (
              <>
                {renderPage()}
                {page === 'dashboard' && (
                  <div className="mt-6">
                    <AIPartnersShowcase />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      {showSetup && (
        <SetupWizard
          onComplete={() => setShowSetup(false)}
        />
      )}
      <ChatWidget />
    </ToastProvider>
  );
}

export default App;
