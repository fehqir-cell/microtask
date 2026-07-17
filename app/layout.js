import './globals.css';
import { AppProvider } from '../context/AppContext';
import Web3Provider from '../components/Web3Provider';

export const metadata = {
  title: 'MicroTask | Decentralized Research & Tasks',
  description: 'Complete micro-tasks and research requests for crypto rewards.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <AppProvider>
            {children}
          </AppProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
