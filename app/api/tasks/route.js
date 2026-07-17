import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        timePosted: 'desc',
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        bountyAmount: body.bountyAmount.toString(),
        bountyCurrency: body.bountyCurrency,
        category: body.category || 'Other',
        approvalType: body.approvalType || 'community_and_publisher',
        author: body.author || '0xUnknown',
      }
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
