import React, { useState } from 'react';
import App from './App.jsx';
import Icon from './Icon.jsx';
import { hashPassword, readProfiles, readSession, registerProfile, setSession } from './profiles.js';
import Onboarding from './Onboarding.jsx';

export default function Prototype() {
  const [profile, setProfile] = useState(readSession);
  const [page, setPage] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = page === 'register';

  function changePage(next) {
    setPage(next);
    setPassword('');
    setConfirmation('');
    setError('');
  }

  function enter(nextProfile) {
    setSession(nextProfile);
    setPassword('');
    setConfirmation('');
    setProfile(nextProfile);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    const name = username.trim();
    if (!name || !password) return setError('Preencha o usuário e a senha.');
    if (registering && password.length < 6) return setError('Use uma senha com pelo menos 6 caracteres.');
    if (registering && password !== confirmation) return setError('As senhas precisam ser iguais.');
    setBusy(true);
    try {
      if (registering) {
        enter(await registerProfile(name, password));
      } else {
        const saved = readProfiles().find(item => item.username.toLowerCase() === name.toLowerCase());
        if (!saved || await hashPassword(password, saved.salt) !== saved.passwordHash) {
          setError('Usuário ou senha incorretos.');
        } else enter(saved);
      }
    } catch (failure) {
      setError(failure.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setSession(null);
    setProfile(null);
    changePage('login');
  }

  if (profile?.onboardingComplete === false) return <Onboarding profile={profile} onComplete={enter} onLogout={logout} />;
  if (profile) return <App key={profile.id} profile={profile} onLogout={logout} />;

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand"><span className="brand-mark"><Icon name="drop" /></span> Sip by Sip</div>
        <p className="eyebrow">UM HÁBITO, UM GOLE DE CADA VEZ</p>
        <h1>Seu dia começa<br />com mais água.</h1>
        <p>Acompanhe suas garrafas e tenha uma meta diária calculada com sua idade e seu peso.</p>
        <div className="auth-steps"><span>01 · Entre ou cadastre-se</span><span>02 · Descubra sua meta</span><span>03 · Acompanhe seu dia</span></div>
        <p className="auth-prototype">Protótipo de teste · Os perfis ficam apenas neste navegador. Use uma senha de teste.</p>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{registering ? 'VAMOS COMEÇAR' : 'BEM-VINDO DE VOLTA'}</p>
        <h2 id="auth-title">{registering ? 'Crie seu perfil' : 'Entre no seu perfil'}</h2>
        <p className="auth-description">{registering ? 'Escolha seu usuário e senha. No próximo passo, vamos descobrir sua meta.' : 'Seu próximo gole está a um passo.'}</p>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label htmlFor="auth-username">Usuário<input id="auth-username" autoComplete="username" required maxLength={40} value={username} onChange={event => setUsername(event.target.value)} /></label>
            <label htmlFor="auth-password">Senha<input id="auth-password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 6 : undefined} value={password} onChange={event => setPassword(event.target.value)} /></label>
            {registering && <>
              <label htmlFor="auth-confirmation">Confirme a senha<input id="auth-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
            </>}
            {error && <p className="notice" role="alert">{error}</p>}
            <button className="add-button" type="submit">{busy ? 'Aguarde…' : registering ? 'Criar perfil e continuar' : 'Entrar'}</button>
            <p className="auth-switch">{registering ? 'Já tem um perfil?' : 'Ainda não tem um perfil?'} <button type="button" onClick={() => changePage(registering ? 'login' : 'register')}>{registering ? 'Entrar' : 'Cadastre-se'}</button></p>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
