import { useState, useEffect } from 'react';
import { Save, Building2, Bell, Brain, Palette, Check } from 'lucide-react';
import type { Store } from '@/store';
import type { ClinicSettings } from '@/types';

type Props = {
  store: Store;
};

type Tab = 'general' | 'notifications' | 'ai' | 'appearance';

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'general', label: 'عام', icon: Building2 },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'ai', label: 'إعدادات الذكاء', icon: Brain },
  { id: 'appearance', label: 'المظهر', icon: Palette },
];

export default function SettingsV2({ store }: Props) {
  const [tab, setTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<ClinicSettings | null>(store.clinicSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(store.clinicSettings);
  }, [store.clinicSettings]);

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400" dir="rtl">
        <p className="text-sm">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await store.saveClinicSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handled by store
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<ClinicSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="space-y-5" dir="rtl">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-elev-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                active
                  ? 'bg-gradient-to-l from-brand-500 to-accent-600 text-white shadow-elev-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-elev-1">
        {tab === 'general' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">اسم العيادة</label>
              <input
                value={settings.clinicName}
                onChange={(e) => update({ clinicName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">رقم الهاتف</label>
              <input
                value={settings.phone}
                onChange={(e) => update({ phone: e.target.value })}
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">العنوان</label>
              <input
                value={settings.address}
                onChange={(e) => update({ address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">بداية الدوام</label>
              <select
                value={settings.workStart}
                onChange={(e) => update({ workStart: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              >
                {[7, 8, 9, 10].map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">نهاية الدوام</label>
              <select
                value={settings.workEnd}
                onChange={(e) => update({ workEnd: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              >
                {[16, 17, 18, 19, 20, 21].map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">نسبة الضريبة</label>
              <input
                type="number"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) => update({ taxRate: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">العملة</label>
              <input
                value={settings.currency}
                onChange={(e) => update({ currency: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            {[
              { key: 'notifyNew' as const, label: 'إشعار عند حجز موعد جديد' },
              { key: 'notifyCancel' as const, label: 'إشعار عند إلغاء موعد' },
              { key: 'notifyReminder' as const, label: 'تذكير قبل الموعد' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <button
                  onClick={() => update({ [item.key]: !settings[item.key] } as Partial<ClinicSettings>)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings[item.key] ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      settings[item.key] ? 'left-0.5' : 'right-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">ساعات التذكير قبل الموعد</label>
              <input
                type="number"
                value={settings.reminderHours}
                onChange={(e) => update({ reminderHours: Number(e.target.value) })}
                className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
                <Brain size={18} />
                إعدادات الذكاء الاصطناعي
              </div>
              <p className="mt-1 text-xs text-brand-600">
                يمكن تكوين المساعد الذكي المحلي ومزودي الذكاء الاصطناعي من صفحة مركز الموفرين.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">رابط الجسر المحلي</label>
              <input
                defaultValue="http://localhost:3001"
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
              <p className="mt-1 text-xs text-slate-400">عنوان خادم الجسر المحلي للذكاء الاصطناعي</p>
            </div>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">إعدادات المظهر قيد التطوير. ستشمل الوضع الليلي، أحجام الخطوط، وألوان مخصصة.</p>
            <div className="grid grid-cols-3 gap-3">
              {['فاتح', 'داكن', 'تلقائي'].map((mode) => (
                <div
                  key={mode}
                  className="cursor-pointer rounded-xl border-2 border-slate-200 p-4 text-center text-sm font-semibold text-slate-600 transition-colors hover:border-brand-400"
                >
                  {mode}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : saved ? (
            <>
              <Check size={18} />
              تم الحفظ
            </>
          ) : (
            <>
              <Save size={18} />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  );
}
