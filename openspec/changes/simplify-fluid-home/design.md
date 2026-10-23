# Design

## Context

Ver `proposal.md` para motivação. `App.jsx` mantém estado de hidratação, preferências e lembretes acima das telas, mas só distingue `#home` e `#benefits`. No Início monta resumos, `HydrationCard`, `WaterLog` e calendário. `recordWater` abre `PourDialog`, que chama `showModal` e fecha após 3,4 segundos. O helper Playwright depende desse fechamento. `styles.css` e `fluid.css` contêm camadas de overrides; as regras de paleta por `data-color` têm especificidade maior que algumas regras neutras novas.

O inventário principal de specs está vazio. Os deltas de `accessible-local-profile-entry` e `show-daily-water-volumes` definem compromissos relevantes de teclado, foco e histórico que este desenho mantém. Existem testes DOM e um fluxo Playwright; a execução recente de Chromium foi bloqueada pela ausência de `libnspr4.so`.

## Goals / Non-Goals

**Goals:** separar apresentação e navegação sem duplicar o estado de hidratação; tornar cada registro contínuo; ter critérios verificáveis de acessibilidade e de composição visual.

**Non-Goals:** alterar regras de consumo, persistência, perfis, notificações em segundo plano ou dados nativos; adicionar framework de UI, roteador, fontes remotas ou bibliotecas de animação. Não introduzir gestos obrigatórios. Fluxos de login/onboarding ficam estáveis.

## Decisions

### 1. Três destinos com estado compartilhado

Ampliar a resolução do hash em `App.jsx` para `#home`, `#history` e `#benefits`; hash vazio ou desconhecido resolve Início. Reutilizar âncoras e `hashchange`, incluindo carregamento direto e histórico do navegador. Cada destino terá título focalizável; navegação foca o título uma vez, sem repetir o foco em atualizações do contador ou timer.

Manter hooks, estado, persistência, lembretes e diálogos no nível de App para não reinicializar ao navegar. Montar somente o destino visível (ou usar `hidden` corretamente), evitando IDs duplicados e controles ocultos focáveis. Configurações e saída ficam no cabeçalho; a barra inferior contém apenas os três destinos. Alternativa rejeitada: uma quarta aba de Configurações, pois preferências já funcionam como diálogo e não precisam mudar de modelo.

### 2. Composição da tela

```text
+------------------------------------+
| Sip by Sip          Config.   Sair  |
| Hoje                               |
| data local                         |
|                                    |
|          progresso                 |
|          consumo / meta            |
|                                    |
| [Garrafa 500 ml] [Copo 250 ml]      |
|         Desfazer                   |
| +250 ml adicionados                |
|                                    |
| [Inicio] [Historico] [Beneficios]   |
+------------------------------------+
```

O Início usa `HydrationCard` como conteúdo central, sem resumos acima dele. Exibir os volumes visivelmente nos controles, não apenas em `aria-label`. O Histórico agrupa calendário, `StreakCard` e `WaterLog`, reutilizando o editor de tamanhos e a confirmação de reset. O reset fica no Histórico, visualmente secundário. Os totais e calendário continuam derivados do estado atual, sem novo armazenamento.

No desktop o Início fica centralizado com largura de conteúdo próxima de 560 px; Histórico pode usar até 1080 px. No celular a barra inferior respeita safe areas e recebe espaço reservado no conteúdo. Configurações permanece alcançável no cabeçalho. Alternativa rejeitada: esconder o calendário em um acordeão no Início, que mantém competição visual e não entrega a separação escolhida.

### 3. Confirmação de registro sem modal

Substituir o estado de animação de despejo por uma confirmação transitória com identificador crescente e volume do último registro. Manter uma região `role=status`/`aria-live=polite` montada próxima das ações para atualizar seu texto; um timer de cerca de quatro segundos limpa apenas a mensagem. Um novo registro cancela o timer anterior; a limpeza também ocorre no unmount. A identidade permite anunciar registros consecutivos de mesmo volume sem disparar duas regiões vivas concorrentes.

O registro mantém `addWater` e os guards de transferência existentes; atualizar contador, ring e histórico imediatamente. Remover a montagem automática de `PourDialog` do fluxo web e limpar imports/estado sem uso. A ação Desfazer permanece na tela e usa `undoWater`, independentemente do timer; desfazer, reset e troca de perfil limpam confirmações obsoletas. Navegar pode limpar feedback transitório sem tocar nos dados. Os avisos de lembrete continuam globais e usam o mesmo caminho de registro.

Alternativas rejeitadas: manter o modal com duração menor (ainda interrompe teclado e registros rápidos); usar confirmação como único lugar para desfazer (o timer retiraria uma ação útil). Não adicionar comemoração modal ao cumprir a meta. Manter feedback textual de sucesso sem transformar cada atualização em anúncios duplicados. Confirmação diz que o volume foi adicionado, sem alegar que foi salvo; o alerta de persistência permanece independente.

### 4. Preferências e lembretes no mesmo contêiner modal

Adicionar acesso a Lembretes dentro de Configurações. Extrair o formulário de `RemindersDialog` para uma seção reutilizável e apresentá-lo como subpainel do mesmo diálogo de Configurações, preservando as preferências atuais, validação, preview e countdown quando pertinente. Não empilhar dois `showModal`. Voltar restaura foco ao controle de Lembretes e conserva drafts de aparência/meta ainda não salvos; salvar/cancelar lembretes afeta somente seu próprio draft, usando o callback existente. Escape no subpainel descarta seu draft e retorna às Configurações; Escape na raiz descarta os drafts de Configurações e fecha. Backup conserva seu fluxo e proteção de importação em andamento.

Alternativa rejeitada: remover lembretes do produto ou deixar seu acesso exclusivo no Histórico, que dificulta a descoberta das preferências.

### 5. Uma linguagem visual consistente

Consolidar os estilos afetados em vez de acrescentar novas camadas contraditórias. Estabelecer tokens de fundo neutro, superfície, texto, borda, elevação, raios e espaçamento; separar esses tokens das cinco cores de destaque. Revisar seletores `data-color`/`data-theme` para que as paletas não sobrescrevam inadvertidamente o fundo neutro. Usar fontes do sistema com fallback local e ícones existentes.

Usar progresso como elemento dominante, superfícies com raios próximos de 24 px, controles principais com pelo menos 44 px de área de toque e hierarquia tipográfica estável. A barra ganha fundo opaco por padrão e transparência/desfoque dentro de `@supports`; evitar ancestrais com filtro/transform que mudem o referencial da barra fixa. Pressionamento curto e transições de 180–300 ms; ring pode interpolar por até 600 ms. Redução de movimento remove ondas contínuas e deslocamentos. Não depender de animação, cor ou transparência para comunicar estado.

### 6. Validação e compatibilidade

Estender `dashboardNavigationUi.test.mjs` para Histórico, hash inicial, fallback, voltar/avançar e foco; adaptar `hydrationUi.test.mjs` e helper Playwright que hoje fecham o modal. Cobrir registros rápidos, timers renovados, desfazer após recarga/alteração de volume e avisos de erro independentes. Manter os testes existentes de regras e banco sem modificar suas expectativas para acomodar regressões.

Revisar no navegador 320, 390, 768 e 1440 px, claro/escuro, as cinco cores e os três idiomas; checar teclado, foco dos painéis e safe areas. Capturar imagens de revisão do Início e Histórico em desktop/celular quando o navegador estiver disponível. A falta de bibliotecas do Chromium deve ser registrada como limitação real, nunca como sucesso de validação visual.

## Risks / Trade-offs

- Recursos secundários menos visíveis -> rótulos explícitos Histórico e Configurações e documentação atualizada.
- Barra fixa ou aviso sobreposto a conteúdo -> espaço reservado, safe areas e inspeção do último controle em telas estreitas e zoom.
- Regressões de foco ao mover componentes -> títulos por destino, restauração nos subpainéis e testes DOM/teclado.
- Mudança do fluxo de lembretes afetar drafts -> separar estado de cada formulário e preservar a proteção de importação existente.
- CSS acumulado produzir inconsistências -> consolidar apenas os estilos afetados e conferir especificidade das paletas e regressões de login/onboarding.
- Chromium indisponível no ambiente -> concluir testes DOM/build e reportar a conferência visual pendente até disponibilizar as dependências necessárias.

## Migration Plan

Não há migração de dados ou novos campos persistidos. Implementar navegação e reorganização, substituir o feedback de registro, integrar preferências e consolidar estilos; atualizar testes e README antes da revisão. Publicação não faz parte desta mudança. Reverter os commits da implementação restaura a apresentação anterior sem remover os dados locais; manter `#home` e `#benefits` compatíveis e tratar `#history` como Início em versões antigas.
