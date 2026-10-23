# Design

## Context

Ver `proposal.md` e `specs/hydration-interface/spec.md`. A interface web usa React com `App.jsx` como dono do estado, três destinos por hash, login e onboarding separados, e estilos distribuídos entre `styles.css` e `fluid.css`. O popup `PourDialog` e sua animação já funcionam; o redesign não precisa alterar o modelo de dados. O inventário principal de specs está vazio. Um delta antigo propôs remover o popup, mas a escolha posterior do usuário o restaurou.

## Goals / Non-Goals

**Goals:** unificar aparência e hierarquia entre todos os destinos web; tornar registro e leitura do progresso imediatos; fazer o Histórico ter ritmo de diário; preservar navegação, idiomas, preferências e acessibilidade.

**Non-Goals:** mudar cálculos, persistência, conteúdos clínicos, lógica de lembretes, fluxo de backup ou interface iOS. Não redesenhar a animação da jarra em si.

## Decisions

### 1. Três camadas de experiência

- **Calma e leve:** fundo neutro levemente quente, tipografia de sistema, bordas suaves, poucas elevações e espaço regular. A cor escolhida pelo usuário marca ações e progresso; não colore grandes áreas que reduzam contraste.
- **Painel direto:** no Início, título/data, consumo e meta, progresso e botões de garrafa/copo compõem uma leitura contínua. O controle de desfazer fica próximo do registro. Sequência e pontos formam um resumo compacto depois da tarefa principal.
- **Diário de hábitos:** o Histórico começa com sequência e calendário, depois mostra detalhes de recipientes, edição e reset. Estado do dia e volume usam texto além de cor.

Alternativa considerada: transformar tudo em cartões semelhantes aos atuais. Isso manteria a competição visual entre métricas e ações. Outra alternativa foi usar uma ilustração grande como centro do Início; a preferência recente do usuário foi retirar a gota decorativa, então o progresso numérico permanece dominante.

### 2. Composição responsiva e navegação

Manter os componentes e destinos existentes; reorganizar a apresentação dentro deles. No celular, uma coluna com barra inferior para Início, Histórico e Benefícios. No desktop, mesma ordem sem barra sobre conteúdo. Configurações e saída continuam no cabeçalho; o resumo secundário pode ocupar uma coluna lateral apenas quando houver largura útil. Definir limites de largura e espaçamento por tokens; não depender de largura fixa para textos traduzidos. Manter títulos focáveis na mudança de destino.

Alternativa considerada: criar rotas e navegação novas. O hash atual já cobre links diretos, voltar e avançar; trocá-lo aumenta risco sem melhorar o visual.

### 3. Uma fonte de verdade para estilos

Definir tokens semânticos de fundo, superfície, texto, borda, foco, espaçamento e raio antes de redesenhar componentes. Consolidar regras duplicadas de `styles.css` e `fluid.css` por área, evitando acrescentar outra camada final de overrides. Reaproveitar `data-theme` e `data-color` existentes; conferir todas as cinco cores em claro/escuro. Usar movimento curto para interação, manter a jarra enchendo no popup e oferecer estados estáticos com `prefers-reduced-motion`.

Alternativa considerada: adicionar biblioteca de componentes ou fontes externas. Os componentes atuais e fontes de sistema já atendem ao escopo e mantêm o app local-first simples.

### 4. Login, onboarding, conteúdo e preferências

Aplicar os mesmos tokens e hierarquia a `Prototype`, `Onboarding`, `WaterBenefits`, calendário e `SettingsDialog`. Organizar formulário e textos auxiliares por prioridade sem esconder os avisos obrigatórios sobre perfis locais. Nos diálogos, preservar rascunhos, cancelamento, foco e painéis internos. Benefícios usa leitura editorial com cartões expansíveis discretos, mantendo o conteúdo atual e os links de fonte.

Alternativa considerada: mudar fluxos para combinar com o novo visual. Isso introduziria comportamento fora do redesign e risco em dados e formulários.

## Risks / Trade-offs

- CSS antigo com seletores concorrentes → consolidar por área e revisar estilos calculados em todas as larguras, temas e cores.
- Textos longos em três idiomas → testar quebra de rótulos, botões e cabeçalhos a 320 px e em zoom.
- Resumo de hábitos virar ruído no Início → limitar sua área e manter ação de registro antes dele na ordem de leitura.
- Histórico reorganizado dificultar edição ou reset → manter rótulos explícitos e checar acesso por teclado.
- Popup cobrir o progresso durante registro → manter fechamento automático, botão de fechar, Escape e retorno de foco; conferir que o consumo já foi registrado.

## Migration Plan

Não há migração de dados. Implementar a linguagem visual e as composições por tela, verificar comportamento e capturas em navegador e atualizar README. A reversão é apenas dos arquivos de apresentação; dados locais e URLs `#home`, `#history` e `#benefits` permanecem compatíveis.
