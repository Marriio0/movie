import '@fontsource-variable/geist';
import '@fontsource/instrument-serif/400.css';
import './styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('index.html is missing the #root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
