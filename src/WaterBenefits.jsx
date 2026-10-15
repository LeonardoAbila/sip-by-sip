import React, { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export const benefitsCopy = {
  'pt-BR': {
    nav: 'Benefícios', eyebrow: 'CUIDADO QUE COMEÇA COM UM GOLE', title: 'Água faz parte do seu bem-estar.',
    intro: 'Hidratar-se ajuda seu corpo a funcionar bem. Conheça alguns motivos para manter a água por perto.',
    cards: [
      ['sun', 'Temperatura em equilíbrio', 'A água ajuda o corpo a manter sua temperatura normal.'],
      ['drop', 'Eliminação de resíduos', 'Participa da eliminação de resíduos pela urina, pelo suor e pelo intestino.'],
      ['heart', 'Cuidado com as articulações', 'Ajuda a lubrificar e amortecer as articulações.'],
      ['bottle', 'Uma escolha sem açúcar', 'Trocar bebidas açucaradas por água reduz o açúcar e as calorias dessas bebidas.'],
    ],
    tipsTitle: 'Pequenos hábitos, todos os dias', tips: ['Deixe uma garrafa reutilizável por perto.', 'Sirva água junto das refeições.', 'Experimente uma fatia de limão para variar o sabor.'],
    needs: 'Sua necessidade de água varia com a idade, a atividade e o clima. Alimentos e outras bebidas também contribuem para a hidratação.',
    back: 'Voltar e registrar água', source: 'Saiba mais no CDC',
  },
  en: {
    nav: 'Benefits', eyebrow: 'CARE STARTS WITH A SIP', title: 'Water supports your well-being.',
    intro: 'Staying hydrated helps your body function normally. Here are a few reasons to keep water nearby.',
    cards: [
      ['sun', 'Temperature balance', 'Water helps your body maintain its normal temperature.'],
      ['drop', 'Removing waste', 'It helps remove waste through urine, sweat, and bowel movements.'],
      ['heart', 'Joint support', 'Water helps lubricate and cushion your joints.'],
      ['bottle', 'A sugar-free choice', 'Replacing sugary drinks with water reduces sugar and calories from those drinks.'],
    ],
    tipsTitle: 'Small habits, every day', tips: ['Keep a reusable bottle nearby.', 'Serve water with meals.', 'Try a slice of lemon for a different flavor.'],
    needs: 'Water needs vary with age, activity, and climate. Food and other drinks also contribute to hydration.',
    back: 'Back to record water', source: 'Learn more at the CDC',
  },
  es: {
    nav: 'Beneficios', eyebrow: 'CUIDARTE EMPIEZA CON UN SORBO', title: 'El agua contribuye a tu bienestar.',
    intro: 'Hidratarte ayuda a tu cuerpo a funcionar bien. Descubre algunos motivos para tener agua cerca.',
    cards: [
      ['sun', 'Temperatura en equilibrio', 'El agua ayuda al cuerpo a mantener su temperatura normal.'],
      ['drop', 'Eliminación de residuos', 'Ayuda a eliminar residuos mediante la orina, el sudor y el intestino.'],
      ['heart', 'Cuidado de las articulaciones', 'Ayuda a lubricar y amortiguar las articulaciones.'],
      ['bottle', 'Una opción sin azúcar', 'Cambiar bebidas azucaradas por agua reduce el azúcar y las calorías de esas bebidas.'],
    ],
    tipsTitle: 'Pequeños hábitos, cada día', tips: ['Ten una botella reutilizable cerca.', 'Sirve agua con las comidas.', 'Prueba una rodaja de limón para variar el sabor.'],
    needs: 'La necesidad de agua varía con la edad, la actividad y el clima. Los alimentos y otras bebidas también contribuyen a la hidratación.',
    back: 'Volver y registrar agua', source: 'Más información en los CDC',
  },
};

export default function WaterBenefits({ language }) {
  const copy = benefitsCopy[language];
  const heading = useRef(null);
  useEffect(() => { heading.current.focus(); window.scrollTo(0, 0); }, []);

  return (
    <section className="benefits-screen" aria-labelledby="benefits-title">
      <header className="benefits-hero">
        <span className="benefits-mark"><Icon name="drop" /></span>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="benefits-title" tabIndex={-1} ref={heading}>{copy.title}</h1>
        <p className="subtitle">{copy.intro}</p>
      </header>
      <div className="benefits-grid">
        {copy.cards.map(([icon, title, body]) => (
          <details className="benefit-card" key={icon}><summary>
            <span className="benefit-icon"><Icon name={icon} /></span>
            <h2>{title}</h2></summary><p>{body}</p>
          </details>
        ))}
      </div>
      <section className="benefits-tips" aria-labelledby="benefits-tips-title">
        <h2 id="benefits-tips-title">{copy.tipsTitle}</h2>
        <ul>{copy.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>
        <p>{copy.needs}</p>
      </section>
      <footer className="benefits-footer">
        <a className="benefits-back" href="#home">{copy.back}<Icon name="arrow" /></a>
        <a href="https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/" target="_blank" rel="noopener noreferrer">{copy.source}</a>
      </footer>
    </section>
  );
}
