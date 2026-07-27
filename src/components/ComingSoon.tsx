import { Sparkles } from 'lucide-react';

type Props = {
  title: string;
  description: string;
};

export default function ComingSoon({ title, description }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-md p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <p className="mt-4 text-xs font-semibold text-teal-600">قريباً في النسخة الكاملة</p>
      </div>
    </div>
  );
}
