import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { completeProfile, hydrationGoal } from './profiles.js';

const format = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

function AnimatedGoal({ liters }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(liters);
      return;
    }
    let frame;
    const start = performance.now();
    const animate = now => {
      const progress = Math.min((now - start) / 1800, 1);
      setShown(liters * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [liters]);

  return <div className="goal-reveal">
    <div className="onboarding-bottle" aria-hidden="true">
      <div className="onboarding-water" /><Icon name="drop" />
    </div>
    <span>Sua meta diária estimada</span>
    <strong aria-hidden="true">{format.format(shown)} <small>L / dia</small></strong>
    <span className="sr-only" role="status">Sua meta diária estimada é {format.format(liters)} litros.</span>
  </div>;
}

export default function Onboarding({ profile, onComplete, onLogout }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [result]);

  function calculate(event) {
    event.preventDefault();
    const years = Number(age);
    const kilos = Number(weight);
    if (!Number.isInteger(years) || years < 1 || years > 120 || !Number.isFinite(kilos) || kilos <= 0 || kilos > 500) {
      setError('Informe uma idade inteira entre 1 e 120 anos e um peso maior que zero, até 500 kg.');
      return;
    }
    setError('');
    setResult({ age: years, weight: kilos, ...hydrationGoal(years, kilos) });
  }

  function finish() {
    try {
      onComplete(completeProfile(profile, result.age, result.weight));
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <main className="onboarding-page">
    <header className="onboarding-header">
      <div className="auth-brand"><span className="brand-mark"><Icon name="drop" /></span> Água do Dia</div>
      <button className="theme-toggle" onClick={onLogout}>Sair</button>
    </header>
    <section className="auth-card onboarding-card" aria-labelledby="onboarding-title">
      <p className="eyebrow">PRIMEIRO ACESSO · {result ? 'SUA META' : 'VAMOS CONHECER VOCÊ'}</p>
      <h1 ref={heading} tabIndex={-1} id="onboarding-title">{result ? 'Cada gole conta.' : `Olá, ${profile.username}, tudo bem?`}</h1>
      {result ? <>
        <p className="auth-description">Pronto! Com seus dados, calculamos uma meta inicial para acompanhar seus dias.</p>
        <AnimatedGoal liters={result.liters} />
        <p className="onboarding-equation">{result.age} anos · {format.format(result.weight)} kg × {result.mlPerKg} ml/kg = <strong>{format.format(result.liters * 1000)} ml</strong></p>
        <p className="auth-description">Essa é uma estimativa. Você pode ajustar a meta a qualquer momento nas configurações.</p>
        <button className="add-button" onClick={finish}>Começar meu dia</button>
        <button className="onboarding-back" onClick={() => { setResult(null); setError(''); }}>Revisar idade e peso</button>
      </> : <>
        <p className="auth-description">Antes de começarmos, precisamos saber sua idade e seu peso! Com essas informações, vamos estimar quanta água você precisa beber por dia.</p>
        <div className="onboarding-reasons">
          <div><Icon name="target" /><h2>Idade</h2><p>Define a faixa do cálculo e a quantidade de mililitros por quilo usada pelo app.</p></div>
          <div><Icon name="drop" /><h2>Peso</h2><p>Multiplicamos seu peso por esse valor para apresentar sua meta em litros por dia.</p></div>
        </div>
        <form onSubmit={calculate}>
          <fieldset>
            <div className="auth-measurements">
              <label htmlFor="onboarding-age">Sua idade (anos)<input id="onboarding-age" type="number" required min="1" max="120" step="1" value={age} onChange={event => setAge(event.target.value)} /></label>
              <label htmlFor="onboarding-weight">Seu peso (kg)<input id="onboarding-weight" type="number" required min="0.1" max="500" step="0.1" value={weight} onChange={event => setWeight(event.target.value)} /></label>
            </div>
            <button className="add-button" type="submit">Descobrir minha meta</button>
          </fieldset>
        </form>
      </>}
      {error && <p className="notice" role="alert">{error}</p>}
      <details className="onboarding-source">
        <summary>Entenda o cálculo e a referência</summary>
        <p>O protótipo usa: até 17 anos, 40 ml/kg; 18–55, 35 ml/kg; 56–65, 30 ml/kg; 66+, 25 ml/kg.</p>
        <p>O Food and Nutrition Board publica referências para água total, incluindo alimentos e bebidas. A tabela por peso deste app é uma estimativa do protótipo; não é a fórmula oficial dessa publicação.</p>
        <a href="https://www.nationalacademies.org/publications/10925" target="_blank" rel="noreferrer">Consultar Dietary Reference Intakes for Water (2005)</a>
      </details>
    </section>
  </main>;
}
