import Navbar from '../../components/Navbar';
import styles from './page.module.css';

export const metadata = {
  title: 'FAQ | MicroTask',
  description: 'Frequently Asked Questions about the MicroTask platform.',
};

const FAQS = [
  {
    question: 'How does MicroTask work?',
    answer: 'MicroTask is a decentralized platform where anyone can post small tasks (Publishers) and anyone can complete them (Performers). When a Publisher posts a task, they lock up a cryptocurrency bounty. Once a Performer completes the task and it gets approved by the community and the Publisher, the bounty is automatically released to the Performer\'s wallet.'
  },
  {
    question: 'Who are Performers and Publishers?',
    answer: 'You can be both! You can toggle your role in the top right corner. "Publishers" are users who need something done and are willing to pay for it. "Performers" are users looking to earn crypto by utilizing their skills (design, writing, coding, QA, etc.).'
  },
  {
    question: 'How do approvals work?',
    answer: 'We use a two-step approval process. First, the Community verifies the work against the task\'s Acceptance Criteria. If it passes, the Publisher does a final review. This ensures high quality and prevents spam.'
  },
  {
    question: 'What cryptocurrencies are supported?',
    answer: 'Currently, you can post and earn bounties in USDT, USDC, TON, SOL, and ETH. More tokens will be supported in the future.'
  },
  {
    question: 'Is there a fee for posting a task?',
    answer: 'We charge a small 1% fee on the total bounty amount to maintain the platform and reward community reviewers.'
  }
];

export default function FAQ() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Frequently Asked <span className="gradient-text">Questions</span></h1>
          <p className={styles.subtitle}>Everything you need to know about the platform.</p>
        </div>
        
        <div className={styles.faqList}>
          {FAQS.map((faq, index) => (
            <div key={index} className={`glass-panel ${styles.faqCard}`}>
              <h3 className={styles.question}>{faq.question}</h3>
              <p className={styles.answer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
