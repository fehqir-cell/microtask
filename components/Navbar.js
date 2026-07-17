"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { role, setRole } = useAppContext();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnectWallet = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({ connector: injected() });
    }
  };

  const toggleRole = () => {
    if (role === 'performer') setRole('publisher');
    else if (role === 'publisher') setRole('admin');
    else setRole('performer');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.brand}>
          <Link href="/">
            <span className={`gradient-text ${styles.logoText}`}>MicroTask</span>
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/" className={styles.link}>Feed</Link>
          {role === 'admin' ? (
            <Link href="/admin" className={styles.link}>Arbitration</Link>
          ) : (
            <Link href="/dashboard" className={styles.link}>Dashboard</Link>
          )}
          <Link href="/faq" className={styles.link}>FAQ</Link>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.roleToggle} onClick={toggleRole}>
            <span className={role === 'performer' ? styles.activeRole : ''}>Performer</span>
            <span className={styles.toggleDivider}>|</span>
            <span className={role === 'publisher' ? styles.activeRole : ''}>Publisher</span>
            <span className={styles.toggleDivider}>|</span>
            <span className={role === 'admin' ? styles.activeRole : ''}>Admin</span>
          </div>
          <button 
            className={isConnected ? 'btn-secondary' : 'btn-primary'}
            onClick={handleConnectWallet}
          >
            {isConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>
                  {balance ? `${parseFloat(balance.formatted).toFixed(3)} ${balance.symbol}` : '...'}
                </span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>{`${address.slice(0,6)}...${address.slice(-4)}`}</span>
              </span>
            ) : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
}
