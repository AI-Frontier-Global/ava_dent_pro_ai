import * as XLSX from 'xlsx';

export type ImportedPatient = {
  fullName: string;
  phone: string;
  birthDate: string;
  gender: 'ذكر' | 'أنثى';
  notes?: string;
  _rowNumber: number;
  _warnings: string[];
};

export type ImportResult = {
  patients: ImportedPatient[];
  skipped: Array<{ row: number; reason: string }>;
  totalRows: number;
  detectedColumns: Record<string, string>;
};

const COLUMN_SYNONYMS: Record<keyof Omit<ImportedPatient, '_rowNumber' | '_warnings'>, string[]> = {
  fullName: ['الاسم', 'الاسم الكامل', 'الاسم الثلاثي', 'اسم المريض', 'المريض', 'name', 'full_name', 'fullname', 'patient_name', 'patient'],
  phone: ['الهاتف', 'الموبايل', 'رقم الهاتف', 'رقم الموبايل', 'الجوال', 'phone', 'mobile', 'telephone', 'tel', 'phone_number', 'mobile_number'],
  birthDate: ['تاريخ الميلاد', 'الميلاد', 'تاريخ الازدياد', 'العمر', 'birthdate', 'birth_date', 'dob', 'date_of_birth', 'birthday', 'age'],
  gender: ['الجنس', 'النوع', 'gender', 'sex'],
  notes: ['ملاحظات', 'ملاحظة', 'معلومات', 'الحالة', 'notes', 'note', 'remarks', 'comments', 'description', 'medical_notes'],
};

const GENDER_MALE = ['ذكر', 'ذ', 'male', 'm', 'رجل'];
const GENDER_FEMALE = ['أنثى', 'انثى', 'أ', 'ا', 'female', 'f', 'امرأة', 'امراه'];

function normalizeHeader(h: string): string {
  return h.toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\u0600-\u06FFa-z0-9 _]/g, '');
}

function matchColumn(
  headers: string[],
  target: keyof typeof COLUMN_SYNONYMS,
): string | undefined {
  const synonyms = COLUMN_SYNONYMS[target].map(normalizeHeader);
  for (const h of headers) {
    const nh = normalizeHeader(h);
    if (synonyms.includes(nh)) return h;
  }
  for (const h of headers) {
    const nh = normalizeHeader(h);
    if (synonyms.some((s) => nh.includes(s) || s.includes(nh))) return h;
  }
  return undefined;
}

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('962')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('00962')) digits = '0' + digits.slice(5);
  else if (digits.startsWith('7') && digits.length === 9) digits = '0' + digits;
  return digits;
}

function inferGender(raw: string): 'ذكر' | 'أنثى' | undefined {
  const v = raw.toString().trim().toLowerCase();
  if (GENDER_MALE.some((g) => v === g || v.startsWith(g))) return 'ذكر';
  if (GENDER_FEMALE.some((g) => v === g || v.startsWith(g))) return 'أنثى';
  return undefined;
}

function excelDateToISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 1000 && value < 100000) {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  if (typeof value === 'string') {
    const s = value.trim();
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      let [dd, mm, yy] = [slashMatch[1], slashMatch[2], slashMatch[3]];
      if (yy.length === 2) yy = '19' + yy;
      return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  return '';
}

export async function parseExcelFile(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { patients: [], skipped: [], totalRows: 0, detectedColumns: {} };
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rows.length === 0) {
    return { patients: [], skipped: [], totalRows: 0, detectedColumns: {} };
  }

  const headers = Object.keys(rows[0]);
  const colMap: Record<string, string> = {};
  (Object.keys(COLUMN_SYNONYMS) as Array<keyof typeof COLUMN_SYNONYMS>).forEach((key) => {
    const matched = matchColumn(headers, key);
    if (matched) colMap[key] = matched;
  });

  const patients: ImportedPatient[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const warnings: string[] = [];

    const rawName = colMap.fullName ? String(row[colMap.fullName] ?? '').trim() : '';
    const rawPhone = colMap.phone ? String(row[colMap.phone] ?? '').trim() : '';
    const rawBirth = colMap.birthDate ? row[colMap.birthDate] : '';
    const rawGender = colMap.gender ? String(row[colMap.gender] ?? '').trim() : '';
    const rawNotes = colMap.notes ? String(row[colMap.notes] ?? '').trim() : '';

    if (!rawName && !rawPhone) {
      skipped.push({ row: rowNum, reason: 'لا يوجد اسم أو هاتف' });
      return;
    }

    const phone = normalizePhone(rawPhone);
    if (rawPhone && !/^07\d{8}$/.test(phone)) {
      warnings.push('رقم الهاتف غير صحيح، سيتم حفظه كما هو');
    }

    const birthDate = rawBirth ? excelDateToISO(rawBirth) : '';
    if (rawBirth && !birthDate) {
      warnings.push('تعذر تحليل تاريخ الميلاد');
    }

    let gender: 'ذكر' | 'أنثى' = 'ذكر';
    if (rawGender) {
      const inferred = inferGender(rawGender);
      if (inferred) gender = inferred;
      else warnings.push('لم يتم التعرف على الجنس، افتراضي: ذكر');
    }

    patients.push({
      fullName: rawName || '—',
      phone: phone || rawPhone,
      birthDate: birthDate || '',
      gender,
      notes: rawNotes || undefined,
      _rowNumber: rowNum,
      _warnings: warnings,
    });
  });

  return {
    patients,
    skipped,
    totalRows: rows.length,
    detectedColumns: colMap,
  };
}
