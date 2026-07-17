import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const task = await prisma.task.findUnique({
      where: { id }
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { action, ...data } = body;

    let updatedTask;

    if (action === 'claim') {
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'in_progress',
          claimedBy: data.claimedBy || '0xPerformer'
        }
      });
    } else if (action === 'submit') {
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'in_review',
          submissionText: data.submissionText || '',
          submissionLinks: data.submissionLinks || '',
        }
      });
    } else if (action === 'approve') {
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'completed',
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
