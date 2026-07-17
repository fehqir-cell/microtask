"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, MOCK_USDT_ADDRESS } from '../lib/contracts';
import styles from './PostTaskModal.module.css';

export default function PostTaskModal({ isOpen, onClose, onPost }) {
  const { address } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [bountyCurrency, setBountyCurrency] = useState('USDT');
  const [approvalType, setApprovalType] = useState('community_and_publisher');
  const [blockchainId, setBlockchainId] = useState('');

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed && blockchainId) {
      // Transaction successful, save to DB
      onPost({
        blockchainId,
        title,
        description,
        bountyAmount,
        bountyCurrency,
        approvalType,
        category: 'Development',
        authorWalletAddress: address || '0xUser...123',
      });
      
      // Reset
      setTitle('');
      setDescription('');
      setBountyAmount('');
      setBlockchainId('');
      onClose();
    }
  }, [isConfirmed, blockchainId, onPost, title, description, bountyAmount, bountyCurrency, approvalType, address, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !bountyAmount || !address) return;
    
    // Generate unique ID for the smart contract
    const newTaskId = Date.now().toString();
    setBlockchainId(newTaskId);

    // Call Escrow contract to lock funds
    // Assume USDT has 6 decimals for this example
    const amountInWei = parseUnits(bountyAmount, 6);
    
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'depositForTask',
      args: [BigInt(newTaskId), amountInWei, MOCK_USDT_ADDRESS],
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`glass-panel ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Post a New Task</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Task Title</label>
            <input 
              type="text" 
              placeholder="E.g., Review PR for memory leak" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Description & Requirements</label>
            <textarea 
              placeholder="Describe what needs to be done..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows="4"
              required
            ></textarea>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Bounty Amount</label>
              <input 
                type="number" 
                placeholder="0.0" 
                value={bountyAmount}
                onChange={(e) => setBountyAmount(e.target.value)}
                className={styles.input}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <select 
                value={bountyCurrency} 
                onChange={(e) => setBountyCurrency(e.target.value)}
                className={styles.input}
              >
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Approval Required</label>
            <select 
              value={approvalType} 
              onChange={(e) => setApprovalType(e.target.value)}
              className={styles.input}
            >
              <option value="community_and_publisher">Community & Publisher (2 Steps)</option>
              <option value="publisher_only">Publisher Only (1 Step)</option>
            </select>
          </div>
          
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isTxPending || isConfirming}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isTxPending || isConfirming}>
              {isTxPending ? 'Awaiting Signature...' : isConfirming ? 'Confirming Tx...' : 'Post & Deposit Crypto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
