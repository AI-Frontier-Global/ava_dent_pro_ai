import type { Patient, Appointment } from '../types';
import { DAYS } from '../types';

const normalizePhone = (phone: string): string => {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '962' + p.slice(1);
  else if (p.startsWith('962')) {
    // keep as is
  } else if (!p.startsWith('9')) {
    p = '962' + p;
  }
  return p;
};

export const whatsappLink = (phone: string, message: string): string => {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
};

export const reminderMessage = (patientName: string, appt: Appointment, dateStr: string): string => {
  const dayName = DAYS[appt.day] ?? '';
  const time = `${appt.startHour}:00`;
  return `مرحباً ${patientName}،\nنذكّرك بموعدك في عيادة سمايل لطب الأسنان:\n📅 ${dateStr} (${dayName})\n⏰ الساعة ${time}\nنرجو الحضور قبل الموعد بـ 10 دقائق.\nفي حال الرغبة بإعادة الموعد يرجى التواصل معنا. شكراً لكم.`;
};

export const postVisitMessage = (patientName: string, dateStr: string): string => {
  return `مرحباً ${patientName}،\nنتمنى لك دوام الصحة والعافية بعد زيارتك لعيادة سمايل بتاريخ ${dateStr}.\nإذا كان لديك أي استفسار حول العلاج أو تعليمات ما بعد العلاج، يسعدنا تواصلك معنا.\nشكراً لثقتك بنا.`;
};

export const customMessage = (patientName: string, note: string): string => {
  return `مرحباً ${patientName}،\n${note}\nعيادة سمايل لطب الأسنان.`;
};

export const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

export const todayISO = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const nextOccurrenceOfDay = (dayIdx: number): string => {
  const today = new Date();
  const todayDay = today.getDay();
  let diff = (dayIdx - todayDay + 7) % 7;
  if (diff === 0) diff = 7;
  today.setDate(today.getDate() + diff);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('');
