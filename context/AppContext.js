"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchTasksAction } from '../app/actions';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState('performer'); // 'performer' or 'publisher'
  const [tasks, setTasks] = useState([]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await fetchTasksAction();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskApprovals = async (taskId, newApprovals) => {
    // For now, if publisher approves, mark as completed
    if (newApprovals.publisher) {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' })
        });
        if (res.ok) fetchTasks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const claimTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', claimedBy: 'You (Performer)' })
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const submitWork = async (taskId, submissionData) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'submit', 
          submissionText: submissionData.description,
          submissionLinks: submissionData.links
        })
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{ role, setRole, tasks, fetchTasks, updateTaskApprovals, claimTask, submitWork }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
