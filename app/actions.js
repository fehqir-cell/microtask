"use server";

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getOrCreateUser(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
        },
      });
    }
    return user;
  } catch (error) {
    console.error('Error getting or creating user:', error);
    throw new Error('Database operation failed');
  }
}

export async function fetchTasksAction() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        timePosted: 'desc',
      },
      include: {
        author: true,
        claimedBy: true,
      },
    });
    return tasks;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function createTaskAction(data) {
  const { title, description, bountyAmount, bountyCurrency, category, approvalType, authorWalletAddress, blockchainId } = data;

  if (!title || !description || !bountyAmount || !authorWalletAddress) {
    throw new Error('Missing required fields');
  }

  try {
    const user = await getOrCreateUser(authorWalletAddress);

    const newTask = await prisma.task.create({
      data: {
        blockchainId: blockchainId ? blockchainId.toString() : null,
        title,
        description,
        bountyAmount: bountyAmount.toString(),
        bountyCurrency,
        category: category || 'Other',
        approvalType: approvalType || 'community_and_publisher',
        authorId: user.id,
      },
    });

    // Revalidate the home path so the new task appears immediately
    revalidatePath('/');
    return newTask;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw new Error('Failed to create task');
  }
}

export async function submitWorkAction(taskId, formData) {
  try {
    const text = formData.get('text');
    const links = formData.get('links');
    const files = formData.getAll('files'); // 'files' must match input name

    const savedFilePaths = [];

    // Mock storage: Save files to public/uploads
    for (const file of files) {
      if (file && file.size > 0 && file.name) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate a unique filename to prevent collisions
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${file.name}`;
        
        // Use process.cwd() to get project root
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Ensure dir exists just in case
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        // Store relative path for frontend access
        savedFilePaths.push(`/uploads/${filename}`);
      }
    }

    // Update the task in DB
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: 'in_review',
        submissionText: text || null,
        submissionLinks: links || null,
        submissionFiles: savedFilePaths.length > 0 ? JSON.stringify(savedFilePaths) : null
      }
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to submit work:', error);
    return { success: false, error: 'Failed to submit work' };
  }
}

export async function approveTaskAction(taskId) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: 'RESOLVED',
      }
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to approve task:', error);
    return { success: false, error: 'Failed to approve task' };
  }
}

export async function claimTaskAction(taskId, workerWalletAddress) {
  if (!workerWalletAddress) throw new Error("Worker wallet address required");
  
  try {
    const user = await getOrCreateUser(workerWalletAddress);
    
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: 'in_progress',
        claimedById: user.id
      }
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to claim task:', error);
    return { success: false, error: 'Failed to claim task' };
  }
}

export async function rejectTaskAction(taskId) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { status: 'REJECTED' }
    });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to reject task:', error);
    return { success: false, error: 'Failed to reject task' };
  }
}

export async function disputeTaskAction(taskId) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { status: 'DISPUTED' }
    });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to dispute task:', error);
    return { success: false, error: 'Failed to dispute task' };
  }
}

export async function resolveDisputeAction(taskId, status) {
  try {
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { status }
    });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Failed to resolve dispute:', error);
    return { success: false, error: 'Failed to resolve dispute' };
  }
}

export async function fetchDisputedTasksAction() {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'DISPUTED' },
      include: {
        author: true,
        claimedBy: true,
      },
    });
    return tasks;
  } catch (error) {
    console.error('Failed to fetch disputed tasks:', error);
    return [];
  }
}
