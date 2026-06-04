'use client';

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  birth: string;
  regNum: string;       // 주민등록번호 — 재직증명서 자동 입력용
  position: string;      // 직위 — 재직증명서 자동 입력용
  joinDate: string;      // 입사일
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  createdAt: string;
}

const CG_KEY = 'dasarang_caregivers';
const HOSP_KEY = 'dasarang_hospitals';

export function getCaregivers(): Caregiver[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CG_KEY) || '[]');
  } catch { return []; }
}

export function saveCaregiver(cg: Omit<Caregiver, 'id' | 'createdAt'>): Caregiver {
  const list = getCaregivers();
  const newCg: Caregiver = { ...cg, id: Date.now().toString(), createdAt: new Date().toISOString() };
  list.push(newCg);
  localStorage.setItem(CG_KEY, JSON.stringify(list));
  return newCg;
}

export function updateCaregiver(id: string, data: Partial<Omit<Caregiver, 'id' | 'createdAt'>>) {
  const list = getCaregivers().map(c => c.id === id ? { ...c, ...data } : c);
  localStorage.setItem(CG_KEY, JSON.stringify(list));
}

export function deleteCaregiver(id: string) {
  const list = getCaregivers().filter(c => c.id !== id);
  localStorage.setItem(CG_KEY, JSON.stringify(list));
}

export function getCaregiverById(id: string): Caregiver | undefined {
  return getCaregivers().find(c => c.id === id);
}

// --- Hospitals ---

export function getHospitals(): Hospital[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HOSP_KEY) || '[]');
  } catch { return []; }
}

export function saveHospital(h: Omit<Hospital, 'id' | 'createdAt'>): Hospital {
  const list = getHospitals();
  const newH: Hospital = { ...h, id: Date.now().toString(), createdAt: new Date().toISOString() };
  list.push(newH);
  localStorage.setItem(HOSP_KEY, JSON.stringify(list));
  return newH;
}

export function updateHospital(id: string, data: Partial<Omit<Hospital, 'id' | 'createdAt'>>) {
  const list = getHospitals().map(h => h.id === id ? { ...h, ...data } : h);
  localStorage.setItem(HOSP_KEY, JSON.stringify(list));
}

export function deleteHospital(id: string) {
  const list = getHospitals().filter(h => h.id !== id);
  localStorage.setItem(HOSP_KEY, JSON.stringify(list));
}
