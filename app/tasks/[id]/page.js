"use client";

import { useState, useTransition, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../../context/AppContext';
import Navbar from '../../../components/Navbar';
import { submitWorkAction, claimTaskAction, approveTaskAction, rejectTaskAction, disputeTaskAction } from '../../actions';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../../../lib/contracts';
import styles from './page.module.css';

export default function TaskDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { role, tasks, updateTaskApprovals, claimTask, submitWork } = useAppContext();
  const { address } = useAccount();
  
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLinks, setSubmissionLinks] = useState('');
  // For UI simulation only, we won't actually upload files
  const [filesSelected, setFilesSelected] = useState(0);
  
  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h2>Task not found</h2>
            <button className="btn-secondary" onClick={() => router.push('/')}>Go Back</button>
          </div>
        </main>
      </>
    );
  }

  const authorAddress = typeof task.author === 'string' ? task.author : (task.author?.walletAddress || '0xUnknown');

  const isMyTask = role === 'publisher' && (authorAddress === '0xUser...123' || (address && authorAddress === address) || authorAddress === 'You');

  const { community, publisher } = task.approvals || { community: false, publisher: false };

  const handleApproveCommunity = () => {
    updateTaskApprovals(task.id, { community: true });
  };

  const { writeContract, data: hash, isPending: isConfirmingRelease } = useWriteContract();
  const { isLoading: isWaitingForReceipt, isSuccess: isReleaseConfirmed } = useWaitForTransactionReceipt({ hash });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isReleaseConfirmed && task?.id) {
      startTransition(async () => {
        await approveTaskAction(task.id);
      });
    }
  }, [isReleaseConfirmed, task?.id]);

  const handleApprovePublisher = () => {
    // Requires worker address
    const workerAddress = task?.claimedBy?.walletAddress;
    if (!task?.blockchainId || !workerAddress) {
      alert("Missing blockchain ID or worker address");
      return;
    }

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'releaseFunds',
      args: [task.blockchainId, workerAddress],
    });
  };

  const handleClaim = () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    startTransition(async () => {
      const result = await claimTaskAction(task.id, address);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleRejectPublisher = () => {
    startTransition(async () => {
      const result = await rejectTaskAction(task.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleDisputePerformer = () => {
    startTransition(async () => {
      const result = await disputeTaskAction(task.id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    startTransition(async () => {
      const result = await submitWorkAction(task.id, formData);
      if (result.success) {
        // Clear form
        setSubmissionText('');
        setSubmissionLinks('');
        setFilesSelected(0);
        e.target.reset();
      } else {
        console.error(result.error);
        alert("Failed to submit work");
      }
    });
  };

  // Determine if task is completed
  const isFullyApproved = (task.approvalType === 'publisher_only' && publisher) || (community && publisher);

  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.backBtn} onClick={() => router.push('/')}>
          &larr; Back to Feed
        </div>

        <div className={`glass-panel ${styles.content}`}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={styles.category}>{task.category}</span>
                {isMyTask && <span className={styles.myTaskBadge}>My Task</span>}
              </div>
              <h1 className={styles.title}>{task.title}</h1>
              <div className={styles.meta}>
                <span className={styles.author}>Posted by <strong>{authorAddress}</strong></span>
                <span className={styles.separator}>•</span>
                <span className={styles.timePosted}>
                  {new Date(task.timePosted).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                {task.status !== 'open' && (
                  <>
                    <span className={styles.separator}>•</span>
                    <span className={styles.statusBadge}>{task.status.replace('_', ' ').toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className={styles.headerRight}>
              <div className={styles.bountyBox}>
                <span className={styles.bountyLabel}>Reward</span>
                <div className={styles.bountyAmountWrapper}>
                  <span className={styles.amount}>{task.bountyAmount}</span>
                  <span className={styles.currency}>{task.bountyCurrency}</span>
                </div>
              </div>
              {role === 'performer' && task.status === 'open' && (
                <button className={`btn-primary ${styles.actionBtn}`} onClick={handleClaim}>Claim Task</button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2>Description</h2>
            <p className={styles.text}>{task.description}</p>
          </div>

          <div className={styles.section}>
            <h2>Acceptance Criteria <span className={styles.subtle}>(What counts as resolved)</span></h2>
            <div className={styles.criteriaBox}>
              {task.acceptanceCriteria?.split('\n').map((line, i) => (
                <p key={i} className={styles.criteriaLine}>{line}</p>
              )) || <p className={styles.text}>No specific criteria provided.</p>}
            </div>
          </div>

          {/* Submission Form for Performer */}
          {role === 'performer' && task.status === 'in_progress' && (
            <div className={styles.section}>
              <h2>Submit Your Work</h2>
              <form className={styles.submissionForm} onSubmit={handleSubmitWork}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Work Description / Proof</label>
                  <textarea 
                    name="text"
                    className={styles.textarea} 
                    rows="4"
                    placeholder="Describe how you completed the task..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Relevant Links (Github, Figma, etc.)</label>
                  <input 
                    name="links"
                    type="text" 
                    className={styles.input} 
                    placeholder="https://..."
                    value={submissionLinks}
                    onChange={(e) => setSubmissionLinks(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload Files</label>
                  <input 
                    name="files"
                    type="file" 
                    className={styles.fileInput} 
                    multiple
                    onChange={(e) => setFilesSelected(e.target.files.length)}
                  />
                  {filesSelected > 0 && <span className={styles.subtle}>{filesSelected} file(s) selected</span>}
                </div>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Submitting...' : 'Submit for Review'}
                </button>
              </form>
            </div>
          )}

          {/* View Submission (For Review or Completed) */}
          {(task.submissionText || task.submissionLinks || task.submissionFiles) && (task.status === 'in_review' || isFullyApproved || task.status === 'completed' || task.status === 'RESOLVED') && (
            <div className={styles.section}>
              <h2>Submitted Work</h2>
              <div className={styles.submissionBox}>
                {task.submissionText && <p><strong>Description:</strong> {task.submissionText}</p>}
                {task.submissionLinks && <p><strong>Links:</strong> <a href={task.submissionLinks} target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>{task.submissionLinks}</a></p>}
                {task.submissionFiles && (
                  <div>
                    <strong>Files:</strong>
                    <ul style={{ listStyleType: 'none', paddingLeft: '0', marginTop: '0.5rem' }}>
                      {JSON.parse(task.submissionFiles).map((file, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>
                          <a href={file} target="_blank" rel="noreferrer" style={{color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                            📄 {file.split('-').pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Workflow - Only show when in review or completed */}
          {(task.status === 'in_review' || isFullyApproved || task.status === 'completed' || task.status === 'RESOLVED') && (
            <div className={styles.section}>
              <h2>Approval Workflow</h2>
              <div className={styles.approvalSteps}>
                {task.approvalType !== 'publisher_only' && (
                  <>
                    <div className={`${styles.step} ${community ? styles.stepCompleted : ''}`}>
                      <div className={styles.stepIcon}>{community ? '✓' : '1'}</div>
                      <div className={styles.stepInfo}>
                        <h4>Community Approval</h4>
                        <p>Verified by peer reviewers</p>
                      </div>
                      {!community && role === 'performer' && (
                        <button className="btn-secondary" onClick={handleApproveCommunity}>Mock Vote</button>
                      )}
                    </div>
                    
                    <div className={styles.stepLine}></div>
                  </>
                )}
                
                <div className={`${styles.step} ${publisher || task.status === 'RESOLVED' ? styles.stepCompleted : ''} ${(task.approvalType !== 'publisher_only' && !community) ? styles.stepDisabled : ''}`}>
                  <div className={styles.stepIcon}>{publisher || task.status === 'RESOLVED' ? '✓' : (task.approvalType === 'publisher_only' ? '1' : '2')}</div>
                  <div className={styles.stepInfo}>
                    <h4>Publisher Approval</h4>
                    <p>Final sign-off by {task.author}</p>
                  </div>
                  {((task.approvalType === 'publisher_only') || community) && !publisher && task.status !== 'RESOLVED' && role === 'publisher' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        className="btn-primary" 
                        onClick={handleApprovePublisher}
                        disabled={isConfirmingRelease || isWaitingForReceipt || isPending || task.status === 'REJECTED' || task.status === 'DISPUTED'}
                      >
                        {isConfirmingRelease ? 'Confirm in Wallet...' : isWaitingForReceipt ? 'Releasing Funds...' : isPending ? 'Finalizing...' : 'Approve Work'}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={handleRejectPublisher}
                        disabled={isPending || task.status === 'REJECTED' || task.status === 'DISPUTED'}
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      >
                        Reject Work
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {(isFullyApproved || task.status === 'completed' || task.status === 'RESOLVED') && (
                <div className={styles.successMessage}>
                  🎉 Task Fully Approved! Funds have been released to the performer.
                </div>
              )}
            </div>
          )}

          {/* Dispute Workflow for Performers */}
          {task.status === 'REJECTED' && (
            <div className={styles.section}>
              <div className={styles.warningMessage} style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--accent)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Work Rejected</h3>
                <p>The publisher has rejected your submitted work. If you believe this is an error, you can open a dispute.</p>
                {role === 'performer' && (
                  <button className="btn-secondary" onClick={handleDisputePerformer} disabled={isPending}>
                    {isPending ? 'Opening Dispute...' : 'Open Dispute'}
                  </button>
                )}
              </div>
            </div>
          )}

          {task.status === 'DISPUTED' && (
            <div className={styles.section}>
              <div className={styles.warningMessage} style={{ backgroundColor: 'rgba(255, 170, 0, 0.1)', border: '1px solid #ffaa00', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ color: '#ffaa00', marginTop: 0 }}>Task Disputed</h3>
                <p>This task is currently under dispute. A platform arbiter will review the submission and make a final ruling.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
