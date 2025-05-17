// app/api/admin/calls/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const sampleData = [
    { id: '1', user: 'Alice', timestamp: new Date().toISOString(), duration: 45, question: 'How do I reset my password?' },
    { id: '2', user: 'Bob', timestamp: new Date().toISOString(), duration: 30, question: 'How do I update my billing info?' },
    { id: '3', user: 'Charlie', timestamp: new Date().toISOString(), duration: 60, question: 'What are the benefits of premium?' },
    { id: '4', user: 'Alice', timestamp: new Date().toISOString(), duration: 20, question: 'How do I reset my password?' },
    { id: '5', user: 'David', timestamp: new Date().toISOString(), duration: 15, question: 'How do I change my username?' }
  ];

  // Simulate sorting by recent calls
  const sortedData = sampleData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(sortedData);
}
