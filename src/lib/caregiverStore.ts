'use client';

import { db, ensureAuth } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

/** Firebase 연결 상태 진단 */
export async function checkFirebaseConnection(): Promise<{
  ok: boolean; authOk: boolean; firestoreOk: boolean;
  caregiverCount: number; hospitalCount: number; patientCount: number;
  error?: string; source: 'firestore' | 'localStorage' | 'none';
}> {
  const result: { ok: boolean; authOk: boolean; firestoreOk: boolean; caregiverCount: number; hospitalCount: number; patientCount: number; error?: string; source: 'firestore' | 'localStorage' | 'none' } = { ok: false, authOk: false, firestoreOk: false, caregiverCount: 0, hospitalCount: 0, patientCount: 0, source: 'none' };
  try {
    result.authOk = await ensureAuth();
    if (!result.authOk) {
      result.error = 'Firebase 인증 실패 — 익명 로그인이 차단되었을 수 있습니다';
      return result;
    }
    const snap = await getDocs(collection(db, 'caregivers'));
    result.firestoreOk = true;
    result.caregiverCount = snap.size;
    const hospSnap = await getDocs(collection(db, 'hospitals'));
    result.hospitalCount = hospSnap.size;
    const patSnap = await getDocs(collection(db, 'patients'));
    result.patientCount = patSnap.size;
    result.source = 'firestore';
    result.ok = true;
  } catch (e: any) {
    result.error = e?.message || String(e);
    // Check localStorage (stripped of PII — count only)
    const cached = getLocal<CaregiverCache>(CG_KEY);
    if (cached.length > 0) {
      result.caregiverCount = cached.length;
      result.source = 'localStorage';
    }
  }
  return result;
}

// ── Domain types (full data including PII) ──

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  birth: string;
  regNum: string;
  position: string;
  joinDate: string;
  hourlyRate: number;
  rateHistory?: { rate: number; effectiveDate: string; changedAt: string }[];
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  contractRate?: number;
  contractNotes?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  patientName: string;
  patientPhone: string;
  gender: string;
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  hospitalName: string;
  createdAt: string;
}

// ── PII-safe cache types (excludes PII fields) ──

interface CaregiverCache {
  id: string;
  name: string;
  position: string;
  joinDate: string;
  hourlyRate: number;
  createdAt: string;
}

interface PatientCache {
  id: string;
  patientName: string;
  gender: string;
  guardianName: string;
  hospitalName: string;
  createdAt: string;
}

const CG_KEY = 'dasarang_caregivers_v2';
const HOSP_KEY = 'dasarang_hospitals_v2';
const PAT_KEY = 'dasarang_patients_v2';

function getLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function setLocal<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

/** Strip PII from caregiver for safe localStorage caching */
function caregiverToCache(cg: Caregiver): CaregiverCache {
  return {
    id: cg.id,
    name: cg.name,
    position: cg.position,
    joinDate: cg.joinDate,
    hourlyRate: cg.hourlyRate,
    createdAt: cg.createdAt,
  };
}

/** Strip PII from patient for safe localStorage caching */
function patientToCache(p: Patient): PatientCache {
  return {
    id: p.id,
    patientName: p.patientName,
    gender: p.gender,
    guardianName: p.guardianName,
    hospitalName: p.hospitalName,
    createdAt: p.createdAt,
  };
}

// ── Caregivers ──

export async function getCaregivers(): Promise<Caregiver[]> {
  if (typeof window === 'undefined') return [];
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'caregivers'));
    const list: Caregiver[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Caregiver));
    // Cache only non-PII fields to localStorage
    setLocal(CG_KEY, list.map(caregiverToCache));
    return list;
  } catch (e: any) {
    console.error('getCaregivers failed:', e?.message);
    // Firestore offline → fall back to localStorage (PII-stripped cache)
    // IMPORTANT: regNum, phone, birth will be empty strings
    const cached = getLocal<CaregiverCache>(CG_KEY);
    return cached.map(c => ({
      ...c,
      phone: '',
      birth: '',
      regNum: '',
    }));
  }
}

export async function saveCaregiver(cg: Omit<Caregiver, 'id' | 'createdAt'>): Promise<Caregiver> {
  const newCg: Caregiver = { ...cg, id: '', createdAt: new Date().toISOString() };
  try {
    await ensureAuth();
    const docRef = await addDoc(collection(db, 'caregivers'), {
      ...cg, createdAt: newCg.createdAt,
    });
    newCg.id = docRef.id;
  } catch (e: any) {
    console.error('saveCaregiver Firestore failed:', e?.message);
    newCg.id = 'local_' + Date.now().toString();
  }
  // Cache only non-PII fields
  const local = getLocal<CaregiverCache>(CG_KEY);
  local.push(caregiverToCache(newCg));
  setLocal(CG_KEY, local);
  return newCg;
}

export async function updateCaregiver(id: string, data: Partial<Omit<Caregiver, 'id' | 'createdAt'>>) {
  try {
    await ensureAuth();
    // 시급 변경 시 rateHistory 자동 기록
    if (data.hourlyRate !== undefined) {
      const all = await getCaregivers();
      const current = all.find(c => c.id === id);
      if (current && current.hourlyRate !== data.hourlyRate) {
        const history = current.rateHistory || [];
        history.push({
          rate: current.hourlyRate,
          effectiveDate: new Date().toISOString().split('T')[0],
          changedAt: new Date().toISOString(),
        });
        (data as any).rateHistory = history;
      }
    }
    await updateDoc(doc(db, 'caregivers', id), { ...data });
  } catch (e: any) { console.error('updateCaregiver Firestore failed:', e?.message); }
  // Update localStorage cache (PII-stripped)
  const list = getLocal<CaregiverCache>(CG_KEY).map(c => {
    if (c.id !== id) return c;
    const updated: CaregiverCache = { ...c };
    if (data.name !== undefined) updated.name = data.name;
    if (data.position !== undefined) updated.position = data.position;
    if (data.joinDate !== undefined) updated.joinDate = data.joinDate;
    if (data.hourlyRate !== undefined) updated.hourlyRate = data.hourlyRate;
    return updated;
  });
  setLocal(CG_KEY, list);
}

export async function deleteCaregiver(id: string) {
  try {
    await deleteDoc(doc(db, 'caregivers', id));
  } catch (e: any) { console.error('deleteCaregiver Firestore failed:', e?.message); }
  const list = getLocal<CaregiverCache>(CG_KEY).filter(c => c.id !== id);
  setLocal(CG_KEY, list);
}

export async function getCaregiverById(id: string): Promise<Caregiver | undefined> {
  const all = await getCaregivers();
  return all.find(c => c.id === id);
}

// ── Hospitals ──

export async function getHospitals(): Promise<Hospital[]> {
  if (typeof window === 'undefined') return [];
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'hospitals'));
    const list: Hospital[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Hospital));
    setLocal(HOSP_KEY, list);
    return list;
  } catch (e: any) {
    console.error('getHospitals failed:', e?.message);
    return getLocal<Hospital>(HOSP_KEY);
  }
}

export async function saveHospital(h: Omit<Hospital, 'id' | 'createdAt'>): Promise<Hospital> {
  const newH: Hospital = { ...h, id: '', createdAt: new Date().toISOString() };
  try {
    await ensureAuth();
    const docRef = await addDoc(collection(db, 'hospitals'), {
      ...h, createdAt: newH.createdAt,
    });
    newH.id = docRef.id;
  } catch (e: any) {
    console.error('saveHospital Firestore failed:', e?.message);
    newH.id = 'local_' + Date.now().toString();
  }
  const local = getLocal<Hospital>(HOSP_KEY);
  local.push(newH);
  setLocal(HOSP_KEY, local);
  return newH;
}

export async function updateHospital(id: string, data: Partial<Omit<Hospital, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'hospitals', id), { ...data });
  } catch (e: any) { console.error('updateHospital Firestore failed:', e?.message); }
  const list = getLocal<Hospital>(HOSP_KEY).map(h => h.id === id ? { ...h, ...data } : h);
  setLocal(HOSP_KEY, list);
}

export async function deleteHospital(id: string) {
  try {
    await deleteDoc(doc(db, 'hospitals', id));
  } catch (e: any) { console.error('deleteHospital Firestore failed:', e?.message); }
  const list = getLocal<Hospital>(HOSP_KEY).filter(h => h.id !== id);
  setLocal(HOSP_KEY, list);
}

// ── Patients (환자-보호자 쌍) ──

export async function getPatients(): Promise<Patient[]> {
  if (typeof window === 'undefined') return [];
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'patients'));
    const list: Patient[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Patient));
    setLocal(PAT_KEY, list.map(patientToCache));
    return list;
  } catch (e: any) {
    console.error('getPatients failed:', e?.message);
    // Firestore offline → fall back to localStorage (PII-stripped)
    const cached = getLocal<PatientCache>(PAT_KEY);
    return cached.map(c => ({
      ...c,
      patientPhone: '',
      birthDate: '',
      guardianPhone: '',
    }));
  }
}

export async function savePatient(p: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
  const newP: Patient = { ...p, id: '', createdAt: new Date().toISOString() };
  try {
    await ensureAuth();
    const docRef = await addDoc(collection(db, 'patients'), {
      ...p, createdAt: newP.createdAt,
    });
    newP.id = docRef.id;
  } catch (e: any) {
    console.error('savePatient Firestore failed:', e?.message);
    newP.id = 'local_' + Date.now().toString();
  }
  const local = getLocal<PatientCache>(PAT_KEY);
  local.push(patientToCache(newP));
  setLocal(PAT_KEY, local);
  return newP;
}

export async function updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'patients', id), { ...data });
  } catch (e: any) { console.error('updatePatient Firestore failed:', e?.message); }
  const list = getLocal<PatientCache>(PAT_KEY).map(c => {
    if (c.id !== id) return c;
    const updated: PatientCache = { ...c };
    if (data.patientName !== undefined) updated.patientName = data.patientName;
    if (data.gender !== undefined) updated.gender = data.gender;
    if (data.guardianName !== undefined) updated.guardianName = data.guardianName;
    if (data.hospitalName !== undefined) updated.hospitalName = data.hospitalName;
    return updated;
  });
  setLocal(PAT_KEY, list);
}

export async function deletePatient(id: string) {
  try {
    await deleteDoc(doc(db, 'patients', id));
  } catch (e: any) { console.error('deletePatient Firestore failed:', e?.message); }
  const list = getLocal<PatientCache>(PAT_KEY).filter(c => c.id !== id);
  setLocal(PAT_KEY, list);
}
