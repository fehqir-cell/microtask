"use client";

import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import { useAccount } from 'wagmi';
import styles from './TaskCard.module.css';

export default function TaskCard({ task }) {
  const { role } = useAppContext();
  const { address } = useAccount();

  const formattedDate = new Date(task.timePosted).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const authorAddress = typeof task.author === 'string' ? task.author : (task.author?.walletAddress || '0xUnknown');

  const isMyTask = role === 'publisher' && (authorAddress === '0xUser...123' || (address && authorAddress === address) || authorAddress === 'You');

  return (
    <Link href={`/tasks/${task.id}`} className={`glass-panel ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.category}>{task.category}</span>
          {isMyTask && <span className={styles.myTaskBadge}>My Task</span>}
        </div>
        <div className={styles.bounty}>
          <span className={styles.amount}>{task.bountyAmount}</span>
          <span className={styles.currency}>{task.bountyCurrency}</span>
        </div>
      </div>
      
      <h3 className={styles.title}>{task.title}</h3>
      <p className={styles.description}>{task.description}</p>
      
      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.timePosted}>{formattedDate}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.author}>by {authorAddress}</span>
          {task.status !== 'open' && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.statusBadge}>{task.status.replace('_', ' ').toUpperCase()}</span>
            </>
          )}
        </div>
        {role === 'performer' ? (
          task.status === 'open' ? (
            <button className={`btn-primary ${styles.claimBtn}`}>Claim Task</button>
          ) : task.status === 'in_progress' ? (
            <button className={`btn-primary ${styles.claimBtn}`}>Submit Work</button>
          ) : (
            <button className={`btn-secondary ${styles.claimBtn}`}>View Task</button>
          )
        ) : (
          <button className={`btn-secondary ${styles.claimBtn}`}>Manage Task</button>
        )}
      </div>
    </Link>
  );
}
