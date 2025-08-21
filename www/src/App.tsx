import React, { useState, useEffect } from 'react';
import WatchDir from './WatchDir';

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('Welcome to smidi=gui with React!');
  const [counter, setCounter] = useState<number>(0);

  useEffect(() => {
    // Test Neutralino API availability
    if (window.Neutralino) {
      setMessage('Welcome to smidi=gui with React and Neutralino!');
    }
  }, []);

  return (
    <main className="app">
    <WatchDir />
    </main>
  );
}

export default App;
