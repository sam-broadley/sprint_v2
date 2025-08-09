import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import QuoteEmbed from './QuoteEmbed';

// For development
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuoteEmbed storeSlug="haloprintco" supabaseUrl="https://hkusyafnfgdmbuzjyubi.supabase.co" supabaseAnonKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdXN5YWZuZmdkbWJ1emp5dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODU3MTAsImV4cCI6MjA2NjA2MTcxMH0.8KmGeomYv-Ukh5jeZBrPPbMkPEBImtVBVkyUfYRvRTM" />
  </React.StrictMode>
);

// For embedding
window.QuoteEmbed = {
  init: (containerId, config) => {
    const container = document.getElementById(containerId);
    if (container) {
      const root = ReactDOM.createRoot(container);
      root.render(<QuoteEmbed {...config} />);
    }
  }
};