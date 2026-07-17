const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_TASKS = [
  {
    title: 'Smart Contract Audit',
    description: 'Looking for an experienced Solidity developer to audit our staking contract. Need a detailed report on potential vulnerabilities and gas optimization suggestions.',
    acceptanceCriteria: '- Comprehensive PDF report on vulnerabilities\n- Code suggestions for gas optimization\n- Proof of Concept (PoC) for any Critical or High severity findings',
    bountyAmount: '500',
    bountyCurrency: 'USDT',
    category: 'Security',
    author: '0xDeFi...99a',
    approvalType: 'community_and_publisher',
    status: 'open'
  },
  {
    title: 'Design Logo for Web3 App',
    description: 'We need a sleek, modern, and minimalist logo for our new decentralized file storage application. SVG format required.',
    acceptanceCriteria: '- High-quality SVG vector file\n- Color palette codes included\n- Must pass the Community Vote with at least 80% approval',
    bountyAmount: '150',
    bountyCurrency: 'TON',
    category: 'Design',
    author: '0xArt...b32',
    approvalType: 'publisher_only',
    status: 'open'
  },
  {
    title: 'Write a technical blog post on ZK Rollups',
    description: 'Need a 1500-word article explaining Zero-Knowledge Rollups to a beginner audience. Must be original and engaging.',
    acceptanceCriteria: '- Minimum 1500 words\n- Plagiarism-free and grammatically correct\n- Must include 2-3 custom diagrams or infographics',
    bountyAmount: '200',
    bountyCurrency: 'USDT',
    category: 'Content',
    author: '0xMedia...8e4',
    approvalType: 'community_and_publisher',
    status: 'completed'
  },
  {
    title: 'Find bugs in mobile dApp',
    description: 'We just released the beta version of our React Native wallet app. We need QA testers to find bugs and UX issues.',
    acceptanceCriteria: '- Submit at least 3 valid bug reports with steps to reproduce\n- Include video recordings of the bugs\n- Specify the device and OS version used',
    bountyAmount: '75',
    bountyCurrency: 'USDC',
    category: 'QA',
    author: '0xQA...111',
    approvalType: 'community_and_publisher',
    status: 'open'
  },
  {
    title: 'Penetration Test for Web App',
    description: 'We need a skilled cybersecurity professional to perform a black-box penetration test on our new decentralized exchange interface. Identify any XSS, SQLi, or logic flaws.',
    acceptanceCriteria: '- Submit a complete vulnerability report\n- Include exact steps to reproduce any findings\n- Provide mitigation recommendations',
    bountyAmount: '1200',
    bountyCurrency: 'USDT',
    category: 'Security',
    author: '0xDex...777',
    approvalType: 'publisher_only',
    status: 'open'
  }
];

async function main() {
  console.log('Start seeding...');
  for (const task of MOCK_TASKS) {
    const t = await prisma.task.create({
      data: task
    });
    console.log(`Created task with id: ${t.id}`);
  }
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
