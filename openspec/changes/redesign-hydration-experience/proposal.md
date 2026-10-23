# Proposal

## Why

A interface web já separa registro, histórico e benefícios, mas a apresentação acumula cartões, rótulos e camadas de CSS que enfraquecem a hierarquia. Um redesign deve dar ao ato de registrar água a mesma clareza do painel direto, com o acolhimento de uma interface leve e o contexto de um diário de hábitos.

## What Changes

- Redesenhar as telas web de entrada, configuração inicial, Início, Histórico, Benefícios e Configurações com uma linguagem visual única e responsiva.
- No Início, destacar consumo, meta e ação de registrar; mostrar sequência e pontos de forma compacta e deixar a leitura do hábito mais detalhada no Histórico.
- Dar ao Histórico uma narrativa por dias, preservando calendário, volumes, contagens e edição de recipientes.
- Manter o popup escolhido pelo usuário, com a jarra enchendo garrafa ou copo, e integrar sua aparência à nova linguagem sem alterar o registro ou o fechamento.
- Consolidar estilos sobrepostos, mantendo temas claro/escuro, cinco cores, português/inglês/espanhol, redução de movimento e acesso por teclado.

## Capabilities

### New Capabilities

- `hydration-interface`: hierarquia e apresentação responsiva dos fluxos de entrada, acompanhamento diário, histórico, conteúdo e preferências do app web.

### Modified Capabilities

Nenhuma. O inventário principal de specs está vazio. O delta antigo `quick-water-entry` descreve registro sem popup; essa parte foi superada pela decisão posterior de manter a animação de enchimento, documentada aqui como comportamento atual a preservar.

## Impact

Afeta componentes React de apresentação em `src/Prototype.jsx`, `src/Onboarding.jsx`, `src/App.jsx`, `src/dashboard/`, `src/HydrationCalendar.jsx` e `src/WaterBenefits.jsx`, além de `src/styles.css`, `src/fluid.css`, testes visuais/DOM e README. Estado, SQLite, perfis, cálculo de metas, lembretes e implementação iOS não exigem alteração. Não prevê dependências nem migração de dados.
