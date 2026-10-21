import React, { useEffect, useRef, useState } from 'react';
import App from './App.jsx';
import ProfileSelector from './profile/ProfileSelector.jsx';
import Icon from './Icon.jsx';
import { hashPassword, readProfiles, readSession, registerProfile, setSession } from './profiles.js';
import Onboarding from './Onboarding.jsx';
import { refreshDatabase } from './database.js';

function PasswordField({ id, label, inputRef, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const action = visible ? 'Ocultar' : 'Mostrar';

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input {...inputProps} ref={inputRef} id={id} type={visible ? 'text' : 'password'} />
        <button className="password-toggle" type="button" aria-label={`${action} ${label.toLowerCase()}`} aria-controls={id} onClick={() => setVisible(current => !current)} title={`${action} senha`}>
          <Icon name={visible ? 'eyeOff' : 'eye'} />
        </button>
      </div>
    </div>
  );
}

export default function Prototype() {
  const [profile, setProfile] = useState(readSession);
  const [profileGeneration, setProfileGeneration] = useState(0);
  const [page, setPage] = useState('login');
  const [localProfiles, setLocalProfiles] = useState(() => readProfiles().map(({ id, username }) => ({ id, username })));
  const [selectedId, setSelectedId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState('');
  const registering = page === 'register';
  const entryHeading = useRef(null);
  const passwordInput = useRef(null);

  useEffect(() => { if (!profile) entryHeading.current?.focus(); }, [profile, page]);
  useEffect(() => { if (selectedId) passwordInput.current?.focus(); }, [selectedId]);

  useEffect(() => {
    if (profile || page !== 'login') return;
    let active = true;
    let latest = 0;
    async function refreshProfiles() {
      const request = ++latest;
      try {
        await refreshDatabase();
        if (!active || request !== latest) return;
        setLocalProfiles(readProfiles().map(({ id, username }) => ({ id, username })));
        setListError('');
      } catch {
        if (active && request === latest) setListError('Não foi possível atualizar os perfis. Tente entrar novamente ou volte a esta aba.');
      }
    }
    void refreshProfiles();
    window.addEventListener('focus', refreshProfiles);
    return () => { active = false; window.removeEventListener('focus', refreshProfiles); };
  }, [profile, page]);

  function changePage(next) {
    setPage(next);
    setSelectedId('');
    setPassword('');
    setConfirmation('');
    setError('');
  }

  function selectProfile(id) {
    setSelectedId(id);
    setUsername(localProfiles.find(item => item.id === id)?.username ?? '');
    setPassword('');
    setConfirmation('');
    setError('');
  }

  function editUsername(value) {
    setUsername(value);
    setSelectedId('');
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
    if (busy) return;
    setError('');
    const name = username.trim();
    if (!name || !password) return setError('Preencha o usuário e a senha.');
    if (registering && password.length < 6) return setError('Use uma senha com pelo menos 6 caracteres.');
    if (registering && password !== confirmation) return setError('As senhas precisam ser iguais.');
    setBusy(true);
    try {
      await refreshDatabase();
      if (registering) {
        enter(await registerProfile(name, password));
      } else {
        const saved = readProfiles().find(item => selectedId ? item.id === selectedId : item.username.toLowerCase() === name.toLowerCase());
        if (selectedId && !saved) {
          setError('Este perfil não está mais disponível. Selecione outro perfil ou digite o usuário.');
        } else if (!saved || await hashPassword(password, saved.salt) !== saved.passwordHash) {
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
    setProfileGeneration(0);
    changePage('login');
  }

  if (profile?.onboardingComplete === false) return <Onboarding profile={profile} onComplete={enter} onLogout={logout} />;
  if (profile) return <App key={`${profile.id}:${profileGeneration}`} profile={profile} onLogout={logout}
    importComplete={profileGeneration > 0} onProfileRestored={restored => {
      setProfile(restored);
      setProfileGeneration(previous => previous + 1);
    }} />;

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand"><span className="brand-mark"><Icon name="drop" /></span> Sip by Sip</div>
        <h1>Um gole de cada vez.</h1>
        <p>Registre sua água e acompanhe sua meta.</p>
        <p className="auth-prototype">Protótipo de teste · Os perfis ficam apenas neste navegador. Use uma senha de teste.</p>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <h2 id="auth-title" ref={entryHeading} tabIndex={-1}>{registering ? 'Crie seu perfil' : 'Entre no seu perfil'}</h2>
        <p id="local-entry-help" className="settings-help">
          Seus perfis e históricos ficam apenas neste navegador e neste endereço do site.
          A senha serve para entrar no perfil pelo aplicativo: ela não criptografa os dados
          nem impede que alguém com acesso ao navegador os leia.
          Não há conta online, sincronização automática ou recuperação de senha. Use uma senha de teste.
        </p>
        <form onSubmit={submit} aria-describedby="local-entry-help">
          <fieldset disabled={busy}>
            {!registering && <ProfileSelector profiles={localProfiles} selectedId={selectedId} onSelect={selectProfile} />}
            <label htmlFor="auth-username">Usuário<input id="auth-username" aria-describedby="local-entry-help" autoComplete="username" required maxLength={40} value={username} onChange={event => editUsername(event.target.value)} /></label>
            <PasswordField key={`${page}:${selectedId}`} label="Senha" id="auth-password" inputRef={passwordInput} aria-describedby="local-entry-help" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 6 : undefined} value={password} onChange={event => setPassword(event.target.value)} />
            {registering && <>
              <PasswordField label="Confirme a senha" id="auth-confirmation" aria-describedby="local-entry-help" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </>}
            {!registering && listError && <p className="notice" role="alert">{listError}</p>}
            {error && <p className="notice" role="alert">{error}</p>}
            <button className="add-button" type="submit">{busy ? 'Aguarde…' : registering ? 'Criar perfil' : 'Entrar'}</button>
            <p className="auth-switch">{registering ? 'Já tem um perfil?' : 'Ainda não tem um perfil?'} <button type="button" onClick={() => changePage(registering ? 'login' : 'register')}>{registering ? 'Entrar' : 'Cadastre-se'}</button></p>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
