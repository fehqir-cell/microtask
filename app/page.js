"use client";

import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import PostTaskModal from '../components/PostTaskModal';
import { createTaskAction } from './actions';
import styles from './page.module.css';

export default function Home() {
  const { role, tasks, fetchTasks } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const handlePostTask = async (newTaskData) => {
    try {
      await createTaskAction(newTaskData);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = activeFilter === 'All' 
    ? tasks 
    : tasks.filter(t => t.category === activeFilter);

  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Get Rewarded for Your <span className="gradient-text">Skills</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Complete micro-tasks, research requests, and gigs. Earn cryptocurrency instantly through peer-to-peer verification.
            </p>
            {role === 'publisher' && (
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                Post a Task
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.feedSection}>
          <div className={styles.feedHeader}>
            <h2>Open Tasks</h2>
            <div className={styles.filters}>
              {['All', 'Development', 'Design', 'Content', 'Security', 'QA'].map(filter => (
                <button 
                  key={filter}
                  className={`${styles.filterBtn} ${activeFilter === filter ? styles.activeFilter : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.taskGrid}>
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          
          {filteredTasks.length === 0 && (
            <div className={styles.emptyState}>
              <p>No tasks found for this category.</p>
            </div>
          )}
        </div>
      </main>

      <PostTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPost={handlePostTask}
      />
    </>
  );
}
