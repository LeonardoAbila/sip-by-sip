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
          <a className="theme-toggle" href="#history" aria-current={screen === 'history' ? 'page' : undefined}><Icon name="history" />{t.history}</a>
          <a className="theme-toggle" href="#benefits" aria-current={screen === 'benefits' ? 'page' : undefined}><Icon name="heart" />{benefitsLabel}</a>
        </div>
        <div className="header-tools">
          <button className="theme-toggle settings-trigger" aria-label={t.settings} title={t.settings} aria-haspopup="dialog" onClick={onOpenSettings}><Icon name="settings" /><span>{t.settings}</span></button>
          {showLogout && <button type="button" className="theme-toggle nav-logout" aria-label={t.exit} title={t.exit} onClick={onLogout}><Icon name="logout" /><span>{t.exit}</span></button>}
        </div>
      </nav>
    </header>
  );
}
