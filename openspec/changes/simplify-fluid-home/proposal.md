# Proposal

## Why

O painel atual reúne progresso, sequência, lembretes, recipientes e calendário na mesma tela, enquanto cada registro abre um diálogo de animação. A tela inicial simples escolhida pelo usuário deve priorizar registrar água e entender o progresso, com uma linguagem visual fluida inspirada nos aplicativos da Apple.

## What Changes

- Concentrar a tela inicial na data, consumo, meta, progresso, registro de garrafa/copo e desfazer.
- Mover calendário, sequência e detalhes dos recipientes para uma aba Histórico, mantendo edição de volumes acessível por lá.
- Manter Benefícios como destino e Configurações como diálogo; disponibilizar lembretes e backup sem ocupar o centro da tela inicial.
- Substituir a animação modal automática de cada registro por confirmação breve, não modal, com atualização direta do progresso e desfazer persistente na tela inicial. Esta é a solução proposta para a fluidez, sujeita à revisão dos documentos.
- Consolidar superfícies, espaçamentos, tipografia do sistema, navegação adaptável e movimento discreto; preservar idiomas, temas, cores de destaque e redução de movimento.

## Capabilities

### New Capabilities

- `hydration-navigation`: organização de Início, Histórico e Benefícios, com acesso às configurações e navegação acessível e adaptável.
- `quick-water-entry`: registro e desfazer sem interrupção modal, com progresso e confirmação acessíveis.

### Modified Capabilities

Nenhuma: o inventário principal de specs está vazio. Os deltas existentes de histórico e acessibilidade serão preservados como restrições de compatibilidade.

## Impact

Afeta principalmente `src/App.jsx`, componentes em `src/dashboard/`, `src/language.js`, `src/styles.css`, `src/fluid.css`, testes de navegação e registro e README. Reutiliza estado, calendário, persistência e diálogos existentes; não requer dependências novas nem migração de dados. A versão SwiftUI em `ios/`, sincronização, autenticação e publicação ficam fora do escopo. Login e onboarding mantêm seus fluxos e recebem apenas os estilos compartilhados pertinentes.
