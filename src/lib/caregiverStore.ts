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
    const cached = getLocal<Caregiver>(CG_KEY);
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

// ── Caregivers ──

export async function getCaregivers(): Promise<Caregiver[]> {
  if (typeof window === 'undefined') return [];
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'caregivers'));
    const list: Caregiver[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Caregiver));
    // Always cache firestore result locally (full data for offline backup)
    setLocal(CG_KEY, list);
    return list;
  } catch (e: any) {
    console.error('getCaregivers failed:', e?.message);
    // Firestore offline → fall back to localStorage (full data backup)
    const cached = getLocal<Caregiver>(CG_KEY);
    return cached;
  }
}

export async function saveCaregiver(cg: Omit<Caregiver, 'id' | 'createdAt'>): Promise<Caregiver> {
  const newCg: Caregiver = { ...cg, id: '', createdAt: new Date().toISOString() };
  try {
    const docRef = await addDoc(collection(db, 'caregivers'), {
      ...cg, createdAt: newCg.createdAt,
    });
    newCg.id = docRef.id;
  } catch (e: any) {
    console.error('saveCaregiver Firestore failed:', e?.message);
    // Firestore offline → localStorage only
    newCg.id = 'local_' + Date.now().toString();
  }
  // Always update localStorage (full data including PII for offline resilience)
  const local = getLocal<Caregiver>(CG_KEY);
  local.push(newCg);
  setLocal(CG_KEY, local);
  return newCg;
}

export async function updateCaregiver(id: string, data: Partial<Omit<Caregiver, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'caregivers', id), { ...data });
  } catch (e: any) { console.error('updateCaregiver Firestore failed:', e?.message); }
  const list = getLocal<Caregiver>(CG_KEY).map(c => c.id === id ? { ...c, ...data } as Caregiver : c);
  setLocal(CG_KEY, list);
}

export async function deleteCaregiver(id: string) {
  try {
    await deleteDoc(doc(db, 'caregivers', id));
  } catch (e: any) { console.error('deleteCaregiver Firestore failed:', e?.message); }
  const list = getLocal<Caregiver>(CG_KEY).filter(c => c.id !== id);
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
    setLocal(PAT_KEY, list);
    return list;
  } catch (e: any) {
    console.error('getPatients failed:', e?.message);
    return getLocal<Patient>(PAT_KEY);
  }
}

export async function savePatient(p: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
  const newP: Patient = { ...p, id: '', createdAt: new Date().toISOString() };
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...p, createdAt: newP.createdAt,
    });
    newP.id = docRef.id;
  } catch (e: any) {
    console.error('savePatient Firestore failed:', e?.message);
    newP.id = 'local_' + Date.now().toString();
  }
  const local = getLocal<Patient>(PAT_KEY);
  local.push(newP);
  setLocal(PAT_KEY, local);
  return newP;
}

export async function updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'patients', id), { ...data });
  } catch (e: any) { console.error('updatePatient Firestore failed:', e?.message); }
  const list = getLocal<Patient>(PAT_KEY).map(p => p.id === id ? { ...p, ...data } as Patient : p);
  setLocal(PAT_KEY, list);
}

export async function deletePatient(id: string) {
  try {
    await deleteDoc(doc(db, 'patients', id));
  } catch (e: any) { console.error('deletePatient Firestore failed:', e?.message); }
  const list = getLocal<Patient>(PAT_KEY).filter(p => p.id !== id);
  setLocal(PAT_KEY, list);
}
