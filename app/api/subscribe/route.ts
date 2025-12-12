import { NextResponse } from 'next/server';

export const runtime = 'edge';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Write to Firestore using REST API
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/subscribers?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email.toLowerCase() },
          source: { stringValue: 'website' },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore error:', error);
      throw new Error('Firestore write failed');
    }

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
