import {
  Search,
  Bell,
  CalendarClock,
  TrendingUp,
  UserPlus,
  DollarSign,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  Receipt,
  Link2,
  Stethoscope,
} from 'lucide-react';

/* ============ الإطارات ============ */

export function LaptopFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* الشاشة */}
      <div className="relative overflow-hidden rounded-t-2xl rounded-b-lg border-[7px] border-slate-800 bg-slate-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4),0_15px_30px_-10px_rgba(0,0,0,0.2)]">
        {/* كاميرا */}
        <div className="absolute left-1/2 top-1.5 z-30 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-600" />
        <div className="overflow-hidden rounded-t-xl bg-white">{children}</div>
      </div>
      {/* القاعدة */}
      <div className="mx-auto h-2.5 w-[28%] rounded-b-xl bg-slate-700" />
      <div className="mx-auto h-1.5 w-[45%] rounded-b-lg bg-slate-600" />
      <div className="mx-auto h-1 w-[55%] rounded-b bg-slate-500/50" />
      {/* انعكاس */}
      <div
        className="pointer-events-none mx-auto mt-2 h-20 w-[85%] rounded-[100%] opacity-30 blur-xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.4), transparent 70%)' }}
      />
    </div>
  );
}

export function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[260px] ${className}`}>
      <div className="overflow-hidden rounded-[2.5rem] border-[9px] border-slate-800 bg-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-white">
          {/* النوتش */}
          <div className="absolute left-1/2 top-0 z-20 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-800" />
          {/* السماعة */}
          <div className="absolute left-1/2 top-2 z-30 h-1 w-12 -translate-x-1/2 rounded-full bg-slate-700" />
          <div className="h-[520px] overflow-y-auto pt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ============ Mini Dashboard ============ */

export function MiniDashboard() {
  const stats = [
    { label: 'مواعيد اليوم', value: '8', icon: CalendarClock, color: 'from-sky-400 to-blue-500' },
    { label: 'تحصيل اليوم', value: '245', icon: TrendingUp, color: 'from-emerald-400 to-emerald-600' },
    { label: 'مرضى جدد', value: '3', icon: UserPlus, color: 'from-amber-400 to-orange-500' },
    { label: 'الإيرادات', value: '1,840', icon: DollarSign, color: 'from-violet-400 to-purple-600' },
  ];
  return (
    <div className="flex h-full bg-slate-100" dir="rtl">
      {/* sidebar */}
      <div className="hidden w-14 shrink-0 flex-col gap-3 border-l border-slate-200 bg-white p-2 sm:flex">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600">
          <Stethoscope size={16} className="text-white" />
        </div>
        {[CalendarClock, UserPlus, Receipt, DollarSign].map((Icon, i) => (
          <div key={i} className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl ${i === 0 ? 'bg-sky-50 text-sky-600' : 'text-slate-400'}`}>
            <Icon size={16} />
          </div>
        ))}
      </div>
      {/* main */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">لوحة التحكم</p>
            <p className="text-[8px] text-slate-400">نظرة عامة على نشاط العيادة</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
              <Bell size={11} className="text-slate-500" />
            </div>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-600" />
          </div>
        </div>
        {/* stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-2">
                <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${s.color}`}>
                  <Icon size={13} className="text-white" />
                </div>
                <p className="text-[7px] text-slate-500">{s.label}</p>
                <p className="text-sm font-bold text-slate-800">{s.value}</p>
              </div>
            );
          })}
        </div>
        {/* chart + list */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <p className="mb-1.5 text-[8px] font-semibold text-slate-600">التحصيل الأسبوعي</p>
            <div className="flex h-16 items-end gap-1">
              {[40, 65, 50, 80, 45, 70, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-sky-500 to-sky-300" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <p className="mb-1.5 text-[8px] font-semibold text-slate-600">مواعيد اليوم</p>
            <div className="space-y-1">
              {[
                { t: '09:00', n: 'محمد الخطيب', c: 'bg-sky-100 text-sky-700' },
                { t: '11:00', n: 'سارة العمري', c: 'bg-emerald-100 text-emerald-700' },
                { t: '13:00', n: 'عبدالله الزعبي', c: 'bg-amber-100 text-amber-700' },
              ].map((a) => (
                <div key={a.t} className="flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-slate-600">{a.t}</span>
                  <span className={`flex-1 truncate rounded px-1 py-0.5 text-[7px] font-medium ${a.c}`}>{a.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* شريط نشاط أطباء */}
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
          <p className="mb-1.5 text-[8px] font-semibold text-slate-600">نشاط الأطباء</p>
          <div className="space-y-1">
            {[
              { n: 'د. أحمد', v: 75, c: 'bg-sky-400' },
              { n: 'د. سارة', v: 50, c: 'bg-emerald-400' },
              { n: 'د. ناصر', v: 30, c: 'bg-amber-400' },
            ].map((d) => (
              <div key={d.n} className="flex items-center gap-1.5">
                <span className="w-10 text-[7px] font-medium text-slate-600">{d.n}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${d.c}`} style={{ width: `${d.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Mini Schedule ============ */

export function MiniSchedule() {
  const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس'];
  const slots = [9, 10, 11, 12, 13, 14];
  const appts: Record<string, { n: string; c: string; span: number }> = {
    '0-9': { n: 'كشف وتشخيص', c: 'bg-sky-100 text-sky-700 border-sky-200', span: 1 },
    '1-10': { n: 'علاج عصب', c: 'bg-amber-100 text-amber-700 border-amber-200', span: 2 },
    '2-13': { n: 'حشوة ضوئية', c: 'bg-emerald-100 text-emerald-700 border-emerald-200', span: 1 },
    '3-14': { n: 'متابعة', c: 'bg-violet-100 text-violet-700 border-violet-200', span: 1 },
    '4-10': { n: 'تبييض', c: 'bg-cyan-100 text-cyan-700 border-cyan-200', span: 1 },
  };
  return (
    <div className="flex h-full flex-col bg-slate-100 p-3" dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">جدول المواعيد</p>
        <div className="flex gap-1">
          {['محجوز', 'مؤكد', 'تم'].map((s, i) => (
            <span key={s} className={`rounded-full px-1.5 py-0.5 text-[7px] font-medium ${['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-slate-100 text-slate-600'][i]}`}>{s}</span>
          ))}
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[40px_repeat(5,1fr)] gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        <div className="bg-slate-50" />
        {days.map((d) => (
          <div key={d} className="bg-slate-50 py-1.5 text-center text-[8px] font-semibold text-slate-600">{d}</div>
        ))}
        {slots.map((h) => (
          <div key={h} className="contents">
            <div className="bg-slate-50 py-2 text-center text-[7px] font-bold text-slate-500">{h}:00</div>
            {days.map((_, di) => {
              const key = `${di}-${h}`;
              const a = appts[key];
              return (
                <div key={key} className="bg-white p-0.5">
                  {a && (
                    <div className={`rounded-md border px-1 py-1 text-[7px] font-medium ${a.c}`}>
                      <p className="truncate">{a.n}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Mini Patient Card ============ */

export function MiniPatient() {
  return (
    <div className="flex h-full flex-col bg-slate-100 p-3" dir="rtl">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">م</div>
        <div>
          <p className="text-sm font-bold text-slate-800">محمد أحمد الخطيب</p>
          <p className="text-[8px] text-slate-500">0791234567 · ذكر · 1990</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <p className="text-[7px] text-slate-500">آخر زيارة</p>
          <p className="text-[9px] font-bold text-slate-800">20 يوليو 2025</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <p className="text-[7px] text-slate-500">الرصيد المستحق</p>
          <p className="text-[9px] font-bold text-rose-600">15.00 د.أ</p>
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
        <p className="mb-1.5 text-[8px] font-semibold text-slate-600">مخطط الأسنان</p>
        <div className="grid grid-cols-8 gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm text-center text-[6px] leading-[16px] ${
                i === 3 || i === 12 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
        <p className="mb-1.5 text-[8px] font-semibold text-slate-600">الزيارات السابقة</p>
        <div className="space-y-1">
          {['كشف وتشخيص', 'تنظيف وإزالة جير', 'حشوة ضوئية'].map((v) => (
            <div key={v} className="flex items-center gap-1.5">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[7px] text-slate-600">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ Mini Invoice ============ */

export function MiniInvoice() {
  return (
    <div className="flex h-full flex-col bg-slate-100 p-3" dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">فاتورة INV-1003</p>
          <p className="text-[8px] text-slate-500">سارة خالد العمري</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-semibold text-emerald-700">مدفوعة</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-[7px] text-slate-500">
            <tr>
              <th className="px-2 py-1.5 font-semibold">الخدمة</th>
              <th className="px-2 py-1.5 font-semibold">السعر</th>
              <th className="px-2 py-1.5 font-semibold">الكمية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { n: 'حشوة ضوئية', p: '45.00' },
              { n: 'كشف وتشخيص', p: '15.00' },
            ].map((r) => (
              <tr key={r.n}>
                <td className="px-2 py-1.5 text-[8px] font-medium text-slate-700">{r.n}</td>
                <td className="px-2 py-1.5 text-[8px] text-slate-600">{r.p}</td>
                <td className="px-2 py-1.5 text-[8px] text-slate-600">1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-2 text-[8px]">
        <div className="flex justify-between text-slate-600"><span>المجموع الفرعي</span><span>60.00 د.أ</span></div>
        <div className="flex justify-between text-slate-600"><span>ضريبة 16%</span><span>9.60 د.أ</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800"><span>الإجمالي</span><span className="text-sky-700">69.60 د.أ</span></div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
        <Link2 size={12} className="text-emerald-600" />
        <span className="text-[7px] font-semibold text-emerald-700">رابط CliQ نشط</span>
        <CheckCircle2 size={12} className="mr-auto text-emerald-600" />
      </div>
    </div>
  );
}

/* ============ Mini Mobile App ============ */

export function MiniMobileApp() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-sky-50 to-white" dir="rtl">
      <div className="bg-gradient-to-l from-sky-500 to-blue-600 px-4 py-4 text-white">
        <p className="text-[10px] opacity-80">مرحباً</p>
        <p className="text-sm font-bold">عيادة سمايل</p>
      </div>
      <div className="space-y-2 p-3">
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <p className="text-[8px] text-slate-500">موعدك القادم</p>
          <p className="text-[10px] font-bold text-slate-800">الأحد · 9:00 صباحاً</p>
          <p className="text-[8px] text-sky-600">كشف وتشخيص</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-sky-50 p-2.5 text-center">
            <CalendarClock size={16} className="mx-auto text-sky-600" />
            <p className="mt-1 text-[8px] font-semibold text-slate-700">حجز موعد</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
            <Receipt size={16} className="mx-auto text-emerald-600" />
            <p className="mt-1 text-[8px] font-semibold text-slate-700">فواتيري</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <p className="mb-1.5 text-[8px] font-semibold text-slate-600">إجراءات سريعة</p>
          {['تذكير عبر WhatsApp', 'ملء نموذج قبل الزيارة', 'دفع عبر CliQ'].map((a) => (
            <div key={a} className="flex items-center gap-1.5 py-0.5">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[8px] text-slate-600">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
