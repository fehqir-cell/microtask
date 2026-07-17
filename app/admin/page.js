"use client";

import { useState, useEffect, useTransition } from 'react';
import Navbar from '../../components/Navbar';
import { fetchDisputedTasksAction, resolveDisputeAction } from '../actions';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../../lib/contracts';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const { writeContract, data: hash, isPending: isConfirmingTx } = useWriteContract();
  const { isLoading: isWaitingForReceipt, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await fetchDisputedTasksAction();
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isTxConfirmed && activeTaskId && pendingStatus) {
      startTransition(async () => {
        await resolveDisputeAction(activeTaskId, pendingStatus);
        setActiveTaskId(null);
        setPendingStatus(null);
        loadTasks();
      });
    }
  }, [isTxConfirmed, activeTaskId, pendingStatus]);

  const handleForcePayout = (task) => {
    const workerAddress = task.claimedBy?.walletAddress;
    if (!task.blockchainId || !workerAddress) return alert("Missing blockchain ID or worker address");
    
    setActiveTaskId(task.id);
    setPendingStatus('RESOLVED'); // Performer wins

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'resolveDispute',
      args: [task.blockchainId, workerAddress, task.bountyAmount],
    });
  };

  const handleRefundPublisher = (task) => {
    const publisherAddress = task.author?.walletAddress;
    if (!task.blockchainId || !publisherAddress) return alert("Missing blockchain ID or publisher address");
    
    setActiveTaskId(task.id);
    setPendingStatus('REFUNDED'); // Publisher wins

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'resolveDispute',
      args: [task.blockchainId, publisherAddress, task.bountyAmount],
    });
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Admin Arbitration Dashboard</h1>
          <p className={styles.subtitle}>Review disputed tasks and manually route escrow funds.</p>
        </div>

        <div className={styles.section}>
          <h2>Active Disputes ({tasks.length})</h2>
          
          {loading ? (
            <div className={styles.emptyState}>Loading disputes...</div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyState}>No active disputes at this time.</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={styles.disputeCard}>
                <div className={styles.disputeHeader}>
                  <h3 className={styles.taskTitle}>Task #{task.id}: {task.title}</h3>
                  <div className={styles.bountyInfo}>
                    <span className={styles.amount}>{task.bountyAmount}</span>
                    <span className={styles.currency}>{task.bountyCurrency}</span>
                  </div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.infoBox}>
                    <h3>Original Request</h3>
                    <p><strong>Publisher:</strong> {task.author?.walletAddress || 'Unknown'}</p>
                    <p><strong>Description:</strong> {task.description}</p>
                    {task.acceptanceCriteria && (
                      <p style={{ marginTop: '0.5rem' }}><strong>Criteria:</strong> {task.acceptanceCriteria}</p>
                    )}
                  </div>
                  
                  <div className={styles.infoBox}>
                    <h3>Submitted Work</h3>
                    <p><strong>Performer:</strong> {task.claimedBy?.walletAddress || 'Unknown'}</p>
                    <p><strong>Notes:</strong> {task.submissionText || 'None'}</p>
                    
                    {task.submissionLinks && (
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Links:</strong> <a href={task.submissionLinks} target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>{task.submissionLinks}</a>
                      </p>
                    )}
                    
                    {task.submissionFiles && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Files:</strong>
                        <ul className={styles.submissionFiles}>
                          {JSON.parse(task.submissionFiles).map((file, idx) => (
                            <li key={idx}>
                              <a href={file} target="_blank" rel="noreferrer">📄 {file.split('-').pop()}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleRefundPublisher(task)}
                    disabled={activeTaskId === task.id || isConfirmingTx || isWaitingForReceipt || isPending}
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    {(activeTaskId === task.id && pendingStatus === 'REFUNDED') ? 'Processing...' : 'Refund Publisher'}
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleForcePayout(task)}
                    disabled={activeTaskId === task.id || isConfirmingTx || isWaitingForReceipt || isPending}
                  >
                    {(activeTaskId === task.id && pendingStatus === 'RESOLVED') ? 'Processing...' : 'Force Payout to Performer'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
