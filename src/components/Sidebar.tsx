import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  HeartPulse,
  Users,
  Camera,
  ClipboardList,
  ShieldCheck,
  Receipt,
  Wallet,
  ChevronLeft,
  X,
  Stethoscope,
  Settings,
  LogOut,
  Brain,
  Sparkles,
  BarChart3,
  Cpu,
} from 'lucide-react';

export type Page =
  | 'dashboard'
  | 'scheduling'
  | 'patient-engagement'
  | 'patient-intake'
  | 'imaging'
  | 'treatment'
  | 'insurance'
  | 'membership'
  | 'billing'
  | 'payments'
  | 'reports'
  | 'ai-assistant'
  | 'ai-hub'
  | 'ai-center'
  | 'settings';

type NavItem = {
  id: Page;
  label: string;
  icon: typeof CalendarClock;
  badge?: number;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'الرئيسية',
    items: [{ id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }],
  },
  {
    title: 'العيادة',
    items: [
      { id: 'scheduling', label: 'الجدولة', icon: CalendarClock, badge: 6 },
      { id: 'patient-intake', label: 'المرضى', icon: Users, badge: 5 },
      { id: 'patient-engagement', label: 'تفاعل المرضى', icon: HeartPulse },
      { id: 'imaging', label: 'التصوير', icon: Camera },
      { id: 'treatment', label: 'خطط العلاج', icon: ClipboardList },
    ],
  },
  {
    title: 'الذكاء الاصطناعي',
    items: [
      { id: 'ai-hub', label: 'مركز الذكاء الاصطناعي', icon: Sparkles },
      { id: 'ai-center', label: 'مركز الموفرين', icon: Cpu },
      { id: 'ai-assistant', label: 'المساعد الذكي المحلي', icon: Brain },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'billing', label: 'الفوترة', icon: Receipt },
      { id: 'payments', label: 'المدفوعات', icon: Wallet },
      { id: 'insurance', label: 'التأمين الصحي', icon: ShieldCheck },
      { id: 'membership', label: 'خطط العضوية', icon: Users },
      { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3 },
    ],
  },
];

type Props = {
  current: Page;
  onNavigate: (p: Page) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut?: () => void;
};

export default function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile, onSignOut }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-overlay bg-slate-950/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-nav flex flex-col bg-slate-900 transition-all duration-lg ease-smooth lg:static ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand — M3 headline style */}
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white shadow-brand-glow">
              <Stethoscope size={20} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold leading-tight text-white">عيادة سمايل</h1>
                <p className="truncate text-[11px] text-slate-400">نظام إدارة الأسنان</p>
              </div>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="state-layer rounded-sm p-1.5 text-slate-400 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav — M3 Navigation Drawer with state layers */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = current === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      title={collapsed ? item.label : undefined}
                      className={`nav-link-dark ${active ? 'nav-link-dark-active' : 'nav-link-dark-idle'} ${
                        collapsed ? 'justify-center' : ''
                      }`}
                    >
                      <Icon
                        size={18}
                        className={active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                          {item.badge ? (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                active ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions — M3 list item style */}
        <div className="shrink-0 border-t border-white/5 p-3">
          <button
            onClick={() => {
              onNavigate('settings');
              onCloseMobile();
            }}
            title={collapsed ? 'الإعدادات' : undefined}
            className={`nav-link-dark nav-link-dark-idle ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={18} />
            {!collapsed && <span className="text-sm font-medium">الإعدادات</span>}
          </button>

          {/* User card — Fluent persona card */}
          <div className={`mt-2 flex items-center gap-3 rounded-md bg-white/5 p-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-xs font-bold text-white">
              ر
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">رنا العبدالله</p>
                <p className="truncate text-[10px] text-slate-400">موظفة استقبال</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={() => onSignOut?.()} className="state-layer rounded-sm p-1 text-slate-500 hover:text-slate-200" aria-label="خروج">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle — M3 FAB-style floating button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-elev-2 transition-colors duration-sm hover:text-brand-600 lg:flex"
          aria-label="طي القائمة"
        >
          <ChevronLeft size={14} className={`transition-transform duration-md ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
}
