"use client";

import { useAppContext } from '../../context/AppContext';
import { useAccount } from 'wagmi';
import Navbar from '../../components/Navbar';
import TaskCard from '../../components/TaskCard';
import styles from './page.module.css';

export default function Dashboard() {
  const { role, tasks } = useAppContext();
  const { address } = useAccount();
  
  // We'll treat tasks with status 'completed' as completed by Performer
  // For now, claimed tasks will be those where claimedById matches, but we don't have that yet, so keep mock logic
  const MY_COMPLETED_TASKS = tasks.filter(t => t.status === 'completed');
  const MY_IN_PROGRESS_TASKS = tasks.filter(t => t.claimedBy === 'You (Performer)' && t.status !== 'completed');
  
  const MY_POSTED_TASKS = tasks.filter(t => {
    const authorAddress = typeof t.author === 'string' ? t.author : (t.author?.walletAddress || '0xUnknown');
    return authorAddress.includes('0xDeFi') || authorAddress === 'You' || (address && authorAddress === address);
  });

  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>My Dashboard</h1>
          <div className={styles.stats}>
            {role === 'performer' ? (
              <>
                <div className={`glass-panel ${styles.statCard}`}>
                  <span className={styles.statLabel}>Total Earned</span>
                  <span className={styles.statValue}>50 <span className={styles.currency}>USDT</span></span>
                </div>
                <div className={`glass-panel ${styles.statCard}`}>
                  <span className={styles.statLabel}>Tasks Completed</span>
                  <span className={styles.statValue}>1</span>
                </div>
              </>
            ) : (
              <>
                <div className={`glass-panel ${styles.statCard}`}>
                  <span className={styles.statLabel}>Total Spent</span>
                  <span className={styles.statValue}>500 <span className={styles.currency}>USDT</span></span>
                </div>
                <div className={`glass-panel ${styles.statCard}`}>
                  <span className={styles.statLabel}>Tasks Posted</span>
                  <span className={styles.statValue}>1</span>
                </div>
              </>
            )}
          </div>
        </div>

        {role === 'performer' && (
          <>
            {MY_IN_PROGRESS_TASKS.length > 0 && (
              <div className={styles.section}>
                <h2>Tasks In Progress</h2>
                <div className={styles.taskGrid}>
                  {MY_IN_PROGRESS_TASKS.map(task => (
                    <div key={task.id} className={styles.completedWrapper}>
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h2>Tasks I've Completed</h2>
              <div className={styles.taskGrid}>
                {MY_COMPLETED_TASKS.map(task => (
                  <div key={task.id} className={styles.completedWrapper}>
                    <span className={styles.statusBadge}>Verified & Paid</span>
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {role === 'publisher' && (
          <div className={styles.section}>
            <h2>Tasks I've Posted</h2>
            <div className={styles.taskGrid}>
              {MY_POSTED_TASKS.map(task => (
                <div key={task.id} className={styles.postedWrapper}>
                  <span className={styles.statusBadgeOpen}>Open</span>
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
