import React from 'react';
import { createRoot } from 'react-dom/client';
import Prototype from './Prototype.jsx';
import './styles.css';
import { readTheme, readColor } from './theme.js';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { initializeDatabase } from './database.js';

// Apply the theme before React renders to avoid showing the wrong palette.
document.documentElement.dataset.theme = readTheme();
document.documentElement.dataset.color = readColor();

const root = createRoot(document.getElementById('root'));

async function start() {
  root.render(<main className="auth-page"><p role="status">Carregando seus dados…</p></main>);
  try {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    await initializeDatabase({ SQL, indexedDB: window.indexedDB, legacyStorage: window.localStorage });
    root.render(<React.StrictMode><Prototype /></React.StrictMode>);
  } catch {
    // Do not render empty profiles or overwrite saved data after a load failure.
    root.render(
      <main className="auth-page">
        <section className="auth-card">
          <h1>Não foi possível abrir seus dados.</h1>
          <p role="alert">Verifique se o navegador permite armazenamento e tente novamente. Seus dados salvos não foram substituídos.</p>
          <button className="add-button" onClick={start}>Tentar novamente</button>
        </section>
      </main>,
    );
  }
}

start();
