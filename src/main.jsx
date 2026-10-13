import React from 'react';
import { createRoot } from 'react-dom/client';
import Prototype from './Prototype.jsx';
import './styles.css';
import { readTheme, readColor } from './theme.js';

// Apply the theme before React renders to avoid showing the wrong palette.
document.documentElement.dataset.theme = readTheme();
document.documentElement.dataset.color = readColor();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Prototype />
  </React.StrictMode>,
);
