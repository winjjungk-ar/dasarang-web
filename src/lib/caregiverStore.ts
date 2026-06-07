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
    // Check localStorage
    const cached = getLocal<CaregiverCache>(CG_KEY);
    if (cached.length > 0) {
      result.caregiverCount = cached.length;
      result.source = 'localStorage';
    }
  }
  return result;
}

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  birth: string;
  regNum: string;
  position: string;
  joinDate: string;
  hourlyRate: number;
  createdAt: string;
}

/** localStorage-safe version — PII fields excluded */
interface CaregiverCache {
  id: string;
  name: string;
  position: string;
  joinDate: string;
  hourlyRate: number;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
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

/** localStorage-safe version — PII fields excluded */
interface PatientCache {
  id: string;
  patientName: string;
  gender: string;
  hospitalName: string;
  createdAt: string;
}

const CG_KEY = 'dasarang_caregivers';
const HOSP_KEY = 'dasarang_hospitals';
const PAT_KEY = 'dasarang_patients';

function getLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function setLocal<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Strip PII before caching to localStorage
function cgToCache(cg: Caregiver): CaregiverCache {
  return { id: cg.id, name: cg.name, position: cg.position, joinDate: cg.joinDate, hourlyRate: cg.hourlyRate, createdAt: cg.createdAt };
}

function patToCache(p: Patient): PatientCache {
  return { id: p.id, patientName: p.patientName, gender: p.gender, hospitalName: p.hospitalName, createdAt: p.createdAt };
}

// ── Caregivers ──

export async function getCaregivers(): Promise<Caregiver[]> {
  if (typeof window === 'undefined') return [];
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'caregivers'));
    const list: Caregiver[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Caregiver));
    setLocal(CG_KEY, list.map(cgToCache)); // cached without PII
    return list.length > 0 ? list : getLocal<CaregiverCache>(CG_KEY) as unknown as Caregiver[];
  } catch {
    // Firestore offline → fall back to localStorage (PII-stripped cache)
    const cached = getLocal<CaregiverCache>(CG_KEY);
    return cached as unknown as Caregiver[];
  }
}

export async function saveCaregiver(cg: Omit<Caregiver, 'id' | 'createdAt'>): Promise<Caregiver> {
  try {
    const docRef = await addDoc(collection(db, 'caregivers'), {
      ...cg, createdAt: new Date().toISOString(),
    });
    const newCg: Caregiver = { ...cg, id: docRef.id, createdAt: new Date().toISOString() };
    const local = getLocal<CaregiverCache>(CG_KEY);
    local.push(cgToCache(newCg));
    setLocal(CG_KEY, local);
    return newCg;
  } catch (e: any) {
    console.error('saveCaregiver failed:', e);
    // Firestore offline → localStorage only (no PII in cache)
    const list = getLocal<CaregiverCache>(CG_KEY);
    const newCg: Caregiver = { ...cg, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.push(cgToCache(newCg));
    setLocal(CG_KEY, list);
    return newCg;
  }
}

export async function updateCaregiver(id: string, data: Partial<Omit<Caregiver, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'caregivers', id), { ...data });
  } catch (e: any) { console.error('updateCaregiver failed:', e); }
  const list = getLocal<CaregiverCache>(CG_KEY).map(c => c.id === id ? { ...c, ...data } as CaregiverCache : c);
  setLocal(CG_KEY, list);
}

export async function deleteCaregiver(id: string) {
  try {
    await deleteDoc(doc(db, 'caregivers', id));
  } catch (e: any) { console.error('deleteCaregiver failed:', e); }
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
    return list.length > 0 ? list : getLocal<Hospital>(HOSP_KEY);
  } catch {
    return getLocal<Hospital>(HOSP_KEY);
  }
}

export async function saveHospital(h: Omit<Hospital, 'id' | 'createdAt'>): Promise<Hospital> {
  try {
    const docRef = await addDoc(collection(db, 'hospitals'), {
      ...h, createdAt: new Date().toISOString(),
    });
    const newH: Hospital = { ...h, id: docRef.id, createdAt: new Date().toISOString() };
    const local = getLocal<Hospital>(HOSP_KEY);
    local.push(newH);
    setLocal(HOSP_KEY, local);
    return newH;
  } catch {
    const list = getLocal<Hospital>(HOSP_KEY);
    const newH: Hospital = { ...h, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.push(newH);
    setLocal(HOSP_KEY, list);
    return newH;
  }
}

export async function updateHospital(id: string, data: Partial<Omit<Hospital, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'hospitals', id), { ...data });
  } catch (e: any) { console.error('updateHospital failed:', e); }
  const list = getLocal<Hospital>(HOSP_KEY).map(h => h.id === id ? { ...h, ...data } : h);
  setLocal(HOSP_KEY, list);
}

export async function deleteHospital(id: string) {
  try {
    await deleteDoc(doc(db, 'hospitals', id));
  } catch (e: any) { console.error('deleteHospital failed:', e); }
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
    setLocal(PAT_KEY, list.map(patToCache)); // cached without PII
    return list.length > 0 ? list : getLocal<PatientCache>(PAT_KEY) as unknown as Patient[];
  } catch (e: any) {
    console.error('getPatients failed:', e);
    // Firestore offline → fall back to localStorage (PII-stripped cache)
    const cached = getLocal<PatientCache>(PAT_KEY);
    return cached as unknown as Patient[];
  }
}

export async function savePatient(p: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...p, createdAt: new Date().toISOString(),
    });
    const newP: Patient = { ...p, id: docRef.id, createdAt: new Date().toISOString() };
    const local = getLocal<PatientCache>(PAT_KEY);
    local.push(patToCache(newP));
    setLocal(PAT_KEY, local);
    return newP;
  } catch {
    const list = getLocal<PatientCache>(PAT_KEY);
    const newP: Patient = { ...p, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.push(patToCache(newP));
    setLocal(PAT_KEY, list);
    return newP;
  }
}

export async function updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'patients', id), { ...data });
  } catch (e: any) { console.error('updatePatient failed:', e); }
  const list = getLocal<PatientCache>(PAT_KEY).map(p => p.id === id ? { ...p, ...data } as PatientCache : p);
  setLocal(PAT_KEY, list);
}

export async function deletePatient(id: string) {
  try {
    await deleteDoc(doc(db, 'patients', id));
  } catch (e: any) { console.error('deletePatient failed:', e); }
  const list = getLocal<PatientCache>(PAT_KEY).filter(p => p.id !== id);
  setLocal(PAT_KEY, list);
}
