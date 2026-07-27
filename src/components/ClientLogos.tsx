import { Reveal } from '@/components/Reveal';

const clinics = [
  { name: 'عيادة سمايل', color: 'from-sky-400 to-blue-600' },
  { name: 'مركز النور', color: 'from-emerald-400 to-teal-600' },
  { name: 'عيادة الأمل', color: 'from-amber-400 to-orange-600' },
  { name: 'عيادات الشفاء', color: 'from-rose-400 to-pink-600' },
  { name: 'مركز دنتال كير', color: 'from-violet-400 to-purple-600' },
  { name: 'عيادة البريق', color: 'from-cyan-400 to-sky-600' },
  { name: 'مركز رويال', color: 'from-indigo-400 to-blue-600' },
  { name: 'عيادة لؤلؤة', color: 'from-fuchsia-400 to-pink-600' },
];

export default function ClientLogos() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-sm font-semibold text-slate-500">يثق بنا أكثر من 50 عيادة في الأردن</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 items-center gap-6 sm:grid-cols-4 lg:grid-cols-8">
          {clinics.map((c, i) => (
            <Reveal key={c.name} delay={i * 50}>
              <div className="flex flex-col items-center gap-2 opacity-70 transition-opacity hover:opacity-100">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-md`}>
                  <span className="text-lg font-extrabold">{c.name.charAt(3)}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{c.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
