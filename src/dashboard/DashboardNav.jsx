import React from 'react';
import Icon from '../Icon.jsx';

export default function DashboardNav({ screen, t, benefitsLabel, showLogout, onOpenSettings, onLogout }) {
  return (
    <header className="site-header">
      <nav className="navbar" aria-label={t.navigation}>
        <a className="nav-brand" href="#home">
          <span className="brand-mark"><Icon name="drop" /></span> {t.title}
        </a>
        <div className="nav-actions">
          <a className="theme-toggle" href="#home" aria-current={screen === 'home' ? 'page' : undefined}><Icon name="home" />{t.home}</a>
          <a className="theme-toggle" href="#benefits" aria-current={screen === 'benefits' ? 'page' : undefined}><Icon name="heart" />{benefitsLabel}</a>
          <button className="theme-toggle" aria-haspopup="dialog" onClick={() => onOpenSettings()}>
            <Icon name="settings" /> {t.settings}
          </button>
        </div>
        {showLogout && <button type="button" className="theme-toggle nav-logout" onClick={onLogout}><Icon name="logout" /> {t.exit}</button>}
      </nav>
    </header>
  );
}
