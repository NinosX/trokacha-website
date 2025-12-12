import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const subscribersRef = collection(db, 'subscribers');
    const q = query(subscribersRef, where('email', '==', email.toLowerCase()));
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      return NextResponse.json(
        { message: 'Vous etes deja inscrit !' },
        { status: 200 }
      );
    }

    // Add new subscriber
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
