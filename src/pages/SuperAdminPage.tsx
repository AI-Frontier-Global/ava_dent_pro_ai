import { useState, useEffect } from 'react';
import {
  Building2, Users, DollarSign, TrendingUp, Ticket, Search, Filter,
  CheckCircle, Clock, AlertCircle, ArrowLeft, Crown, Activity, Globe,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TICKET_STATUS_LABELS, TICKET_STATUS_STYLES, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_STYLES } from '@/types/saas';

type Props = { onBack: () => void };

type Stats = {
  totalClinics: number;
  activeClinics: number;
  trialing: number;
  totalRevenue: number;
  totalUsers: number;
  openTickets: number;
};

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string;
  country: string;
  created_at: string;
  trial_ends_at: string | null;
};

type TicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  clinic_name: string;
  created_at: string;
};

export default function SuperAdminPage({ onBack }: Props) {
  const [stats, setStats] = useState<Stats>({ totalClinics: 0, activeClinics: 0, trialing: 0, totalRevenue: 0, totalUsers: 0, openTickets: 0 });
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState<'overview' | 'clinics' | 'tickets'>('overview');

  useEffect(() => {
    (async () => {
      const [{ data: clinicsData }, { data: subsData }, { count: usersCount }, { data: ticketsData }] = await Promise.all([
        supabase.from('clinics').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('amount, status'),
        supabase.from('clinic_members').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      const clinicList = (clinicsData || []) as unknown as ClinicRow[];
      const subs = (subsData || []) as unknown as { amount: number; status: string }[];
      const ticketList = (ticketsData || []) as unknown as TicketRow[];

      const activeSubs = subs.filter(s => s.status === 'active');
      const revenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

      setStats({
        totalClinics: clinicList.length,
        activeClinics: clinicList.filter(c => c.status === 'active').length,
        trialing: clinicList.filter(c => c.status === 'trialing').length,
        totalRevenue: revenue,
        totalUsers: usersCount || 0,
        openTickets: ticketList.filter(t => t.status === 'open').length,
      });

      const clinicsWithNames = clinicList.map(c => ({ ...c, clinic_name: c.name }));
      setClinics(clinicsWithNames);
      setTickets(ticketList.map(t => ({ ...t, clinic_name: clinicsWithNames.find(c => c.id === (t as Record<string, unknown>).clinic_id)?.name || '—' })));
      setLoading(false);
    })();
  }, []);

  const filteredClinics = clinics.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.includes(search) && !c.slug.includes(search)) return false;
    return true;
  });

  const planLabels: Record<string, string> = { basic: 'أساسية', pro: 'احترافية', enterprise: 'مؤسسية' };
  const statusLabels: Record<string, string> = { trialing: 'تجريبية', active: 'نشطة', past_due: 'متأخرة', canceled: 'ملغاة' };
  const statusColors: Record<string, string> = {
    trialing: 'bg-sky-100 text-sky-700',
    active: 'bg-emerald-100 text-emerald-700',
    past_due: 'bg-amber-100 text-amber-700',
    canceled: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <Crown size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">لوحة المشرف العام</h1>
              <p className="text-xs text-slate-500">DentalPro SaaS Platform</p>
            </div>
          </div>
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <ArrowLeft size={16} className="rotate-180" />
            العودة للتطبيق
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex gap-1 rounded-xl bg-white p-1 shadow-elev-1">
          {([
            { id: 'overview', label: 'نظرة عامة', icon: Activity },
            { id: 'clinics', label: 'العيادات', icon: Building2 },
            { id: 'tickets', label: 'تذاكر الدعم', icon: Ticket },
          ] as const).map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${tab === t.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={Building2} label="إجمالي العيادات" value={stats.totalClinics} color="sky" />
              <StatCard icon={CheckCircle} label="عيادات نشطة" value={stats.activeClinics} color="emerald" />
              <StatCard icon={Clock} label="في التجربة" value={stats.trialing} color="amber" />
              <StatCard icon={DollarSign} label="الإيرادات الشهرية" value={`$${stats.totalRevenue.toLocaleString('en-US')}`} color="teal" />
              <StatCard icon={Users} label="إجمالي المستخدمين" value={stats.totalUsers} color="violet" />
              <StatCard icon={AlertCircle} label="تذاكر مفتوحة" value={stats.openTickets} color="rose" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-elev-1">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                  <TrendingUp size={18} className="text-sky-500" />
                  توزيع الباقات
                </h3>
                <div className="space-y-3">
                  {['basic', 'pro', 'enterprise'].map(plan => {
                    const count = clinics.filter(c => c.plan_id === plan).length;
                    const pct = stats.totalClinics > 0 ? (count / stats.totalClinics) * 100 : 0;
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-semibold text-slate-600">{planLabels[plan]}</span>
                          <span className="text-slate-400">{count} عيادة</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${plan === 'basic' ? 'bg-sky-500' : plan === 'pro' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-elev-1">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                  <Globe size={18} className="text-teal-500" />
                  توزيع الدول
                </h3>
                <div className="space-y-3">
                  {['JO', 'SA', 'AE', 'EG'].map(c => {
                    const count = clinics.filter(cl => cl.country === c).length;
                    const pct = stats.totalClinics > 0 ? (count / stats.totalClinics) * 100 : 0;
                    const names: Record<string, string> = { JO: 'الأردن', SA: 'السعودية', AE: 'الإمارات', EG: 'مصر' };
                    return (
                      <div key={c}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-semibold text-slate-600">{names[c]}</span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'clinics' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-elev-1">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث عن عيادة..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm outline-none focus:border-sky-400 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-3 text-sm outline-none focus:border-sky-400">
                  <option value="all">كل الحالات</option>
                  <option value="trialing">تجريبية</option>
                  <option value="active">نشطة</option>
                  <option value="past_due">متأخرة</option>
                  <option value="canceled">ملغاة</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">اسم العيادة</th>
                      <th className="px-4 py-3 font-semibold">الباقة</th>
                      <th className="px-4 py-3 font-semibold">الدولة</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClinics.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.slug}.dentalpro.ai</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${c.plan_id === 'pro' ? 'bg-emerald-100 text-emerald-700' : c.plan_id === 'enterprise' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                            {planLabels[c.plan_id]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.country}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusColors[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {statusLabels[c.status] || c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredClinics.length === 0 && (
                  <div className="py-12 text-center text-slate-400">لا توجد عيادات مطابقة</div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'tickets' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-elev-1">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400">لا توجد تذاكر دعم</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{t.subject}</h4>
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${TICKET_STATUS_STYLES[t.status as keyof typeof TICKET_STATUS_STYLES]?.badge || 'bg-slate-100'}`}>
                          {TICKET_STATUS_LABELS[t.status as keyof typeof TICKET_STATUS_LABELS] || t.status}
                        </span>
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${TICKET_PRIORITY_STYLES[t.priority as keyof typeof TICKET_PRIORITY_STYLES]?.badge || 'bg-slate-100'}`}>
                          {TICKET_PRIORITY_LABELS[t.priority as keyof typeof TICKET_PRIORITY_LABELS] || t.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{t.clinic_name} — {t.category}</p>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-elev-1">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
