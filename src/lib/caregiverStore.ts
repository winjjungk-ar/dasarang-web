'use client';

import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

// ── Caregivers ──

export async function getCaregivers(): Promise<Caregiver[]> {
  if (typeof window === 'undefined') return [];
  try {
    const snap = await getDocs(collection(db, 'caregivers'));
    const list: Caregiver[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Caregiver));
    setLocal(CG_KEY, list); // sync to localStorage cache
    return list.length > 0 ? list : getLocal<Caregiver>(CG_KEY);
  } catch {
    return getLocal<Caregiver>(CG_KEY);
  }
}

export async function saveCaregiver(cg: Omit<Caregiver, 'id' | 'createdAt'>): Promise<Caregiver> {
  try {
    const docRef = await addDoc(collection(db, 'caregivers'), {
      ...cg, createdAt: new Date().toISOString(),
    });
    const newCg: Caregiver = { ...cg, id: docRef.id, createdAt: new Date().toISOString() };
    // also update localStorage
    const local = getLocal<Caregiver>(CG_KEY);
    local.push(newCg);
    setLocal(CG_KEY, local);
    return newCg;
  } catch {
    // Firestore offline → localStorage only
    const list = getLocal<Caregiver>(CG_KEY);
    const newCg: Caregiver = { ...cg, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.push(newCg);
    setLocal(CG_KEY, list);
    return newCg;
  }
}

export async function updateCaregiver(id: string, data: Partial<Omit<Caregiver, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'caregivers', id), { ...data });
  } catch { /* offline — localStorage only below */ }
  const list = getLocal<Caregiver>(CG_KEY).map(c => c.id === id ? { ...c, ...data } : c);
  setLocal(CG_KEY, list);
}

export async function deleteCaregiver(id: string) {
  try {
    await deleteDoc(doc(db, 'caregivers', id));
  } catch { /* offline */ }
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
  } catch { /* offline */ }
  const list = getLocal<Hospital>(HOSP_KEY).map(h => h.id === id ? { ...h, ...data } : h);
  setLocal(HOSP_KEY, list);
}

export async function deleteHospital(id: string) {
  try {
    await deleteDoc(doc(db, 'hospitals', id));
  } catch { /* offline */ }
  const list = getLocal<Hospital>(HOSP_KEY).filter(h => h.id !== id);
  setLocal(HOSP_KEY, list);
}

// ── Patients (환자-보호자 쌍) ──

export async function getPatients(): Promise<Patient[]> {
  if (typeof window === 'undefined') return [];
  try {
    const snap = await getDocs(collection(db, 'patients'));
    const list: Patient[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Patient));
    setLocal(PAT_KEY, list);
    return list.length > 0 ? list : getLocal<Patient>(PAT_KEY);
  } catch {
    return getLocal<Patient>(PAT_KEY);
  }
}

export async function savePatient(p: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...p, createdAt: new Date().toISOString(),
    });
    const newP: Patient = { ...p, id: docRef.id, createdAt: new Date().toISOString() };
    const local = getLocal<Patient>(PAT_KEY);
    local.push(newP);
    setLocal(PAT_KEY, local);
    return newP;
  } catch {
    const list = getLocal<Patient>(PAT_KEY);
    const newP: Patient = { ...p, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.push(newP);
    setLocal(PAT_KEY, list);
    return newP;
  }
}

export async function updatePatient(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  try {
    await updateDoc(doc(db, 'patients', id), { ...data });
  } catch { /* offline */ }
  const list = getLocal<Patient>(PAT_KEY).map(p => p.id === id ? { ...p, ...data } : p);
  setLocal(PAT_KEY, list);
}

export async function deletePatient(id: string) {
  try {
    await deleteDoc(doc(db, 'patients', id));
  } catch { /* offline */ }
  const list = getLocal<Patient>(PAT_KEY).filter(p => p.id !== id);
  setLocal(PAT_KEY, list);
}
