import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

// GET /api/inquiries - List inquiries for a user
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  const admin = request.nextUrl.searchParams.get('admin');

  if (!uid) {
    return NextResponse.json({ error: 'uid required' }, { status: 400 });
  }

  try {
    let query = adminDb.collection('inquiries').orderBy('createdAt', 'desc');

    if (admin !== 'true') {
      query = query.where('userId', '==', uid);
    }

    const snapshot = await query.get();
    const inquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ inquiries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/inquiries - Create inquiry from Android app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, title, patientName, patientAge, patientGender,
            hospital, disease, careNeeds, careStartDate, content } = body;

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const docRef = await adminDb.collection('inquiries').add({
      userId,
      userEmail: userEmail || '',
      title,
      patientName: patientName || '',
      patientAge: patientAge || '',
      patientGender: patientGender || '',
      hospital: hospital || '',
      disease: disease || '',
      careNeeds: careNeeds || '',
      careStartDate: careStartDate || '',
      content,
      status: '접수됨',
      createdAt: new Date(),
      updatedAt: new Date(),
      answer: null,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
