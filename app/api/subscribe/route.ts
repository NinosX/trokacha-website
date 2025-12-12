import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Add subscriber (skip duplicate check for simplicity)
    const subscribersRef = collection(db, 'subscribers');
    await addDoc(subscribersRef, {
      email: email.toLowerCase(),
      source: 'website',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: 'Inscription reussie !' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
