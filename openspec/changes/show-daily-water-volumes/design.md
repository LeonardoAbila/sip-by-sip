# Design

## Context

Ver `proposal.md` para motivação. O estado em `src/state.js` guarda `totalMl`, `entries`, `data`, `completedDays` e `startedOn`. `currentDay()` premia o dia encerrado e apaga o contador; `readState()` valida dados antes de chamar essa função. `App.jsx` verifica a virada periodicamente e salva o estado com `saveProgress`. O SQLite armazena JSON por chave de perfil. O calendário recebe o estado atual e calcula símbolos independentemente do volume. Não há especificações principais existentes.

## Goals / Non-Goals

**Goals:** manter a lógica de calendário local e o estado simples, com transformações puras e migração idempotente; evitar fontes duplicadas do total de hoje.

**Non-Goals:** armazenar horários ou cada ingestão passada, reconstruir volumes a partir de metas, mudar conquistas, resolver concorrência do mesmo perfil em múltiplas abas ou introduzir tabelas e dependências novas.

## Decisions

### Histórico de dias encerrados no JSON existente

Adicionar `dailyTotals`, um objeto de data `YYYY-MM-DD` para total em ml de dias encerrados conhecidos. Hoje continua usando `totalMl` como fonte única. Antes de zerar na virada, `currentDay()` arquiva o total do dia anterior ao atualizar `data`. Repetir a normalização não duplica nem altera dias encerrados. Preferimos esse objeto a uma nova tabela SQL porque os dados já são salvos por perfil e o requisito exige apenas totais. Um histórico completo de eventos adicionaria complexidade sem benefício nesta mudança.

Preservar a precisão existente em centésimos de ml durante operações. Totais diários aceitam zero e qualquer total não negativo representável com segurança nessa unidade; não aplicar o limite de uma ingestão individual ao total do dia.

### Migração conservadora

Em `readState()`, validar itens do histórico independentemente: objeto simples, datas locais válidas não futuras e totais numéricos finitos, não negativos e representáveis. Para o novo histórico, rejeitar precisão superior a duas casas decimais. Manter a normalização tolerante já existente para `totalMl` legado. Preservar datas válidas de histórico ao calcular o início do acompanhamento. O contador válido salvo com data válida prevalece para sua própria data; nunca arquivar um zero criado apenas como fallback de um total inválido. Não atribuir um total sem data válida a hoje nem sobrescrever um histórico válido com um fallback.

Um estado antigo permite recuperar somente o dia ainda presente no contador. Não consultar backups antigos de localStorage nem inferir volumes a partir de `completedDays`, meta ou tamanho de garrafa. Dias intermediários sem observação permanecem desconhecidos. Um dia observado com contador zero pode ser arquivado como zero. Essa política distingue ausência de dados de ausência de água registrada.

### Leitura do calendário separada do status

Adicionar uma consulta simples em `src/calendar.js`: hoje lê `totalMl`, dias encerrados leem `dailyTotals`, ausência retorna desconhecido e futuro não apresenta volume. `calendarStatus()` continua intacto. Adicionar/desfazer/reset alteram a fonte de hoje e preservam o mapa histórico. O reset confirmado zera hoje e mantém `completedDays`, como já ocorre; por isso um dia pode conservar ✓ e mostrar zero. Alterações de meta não recalculam volumes passados.

### Exibição direta sem nova interação

Em `HydrationCalendar.jsx`, manter data e símbolo e acrescentar uma linha de volume ou “Sem dados”; não abrir diálogo nem depender de tooltip. Formatar com `Intl.NumberFormat` no idioma atual: ml abaixo de 1000 e L a partir de 1000, preservando até duas casas em ml e cinco em L para não perder centésimos de ml. Incluir volume no nome acessível e no título já existente. Novas mensagens seguem o catálogo dos idiomas disponíveis, com português como referência. Ajustar altura e quebra de texto das células para caber em telas estreitas e ambos os temas. Não adicionar resumos semanais nem mudar os totais mensais de metas.

## Risks / Trade-offs

- Histórico antigo incompleto → mostrar “Sem dados” sem estimar litros pelo símbolo.
- Crescimento do JSON → armazenar um total por dia conhecido; não incluir eventos nem criar retenção que apague dados silenciosamente.
- Arquivar estado inválido como zero → validar origem do total antes da migração e testar datas e números corrompidos.
- Células pequenas e valores longos → validar largura de celular, precisão, contraste e descrições acessíveis durante implementação.
- Versão antiga do app pode descartar o campo novo ao salvar → rollback preserva uso do contador, mas não garante retenção do histórico após gravar pela versão antiga; verificar com cópia dos dados antes de rollback.

## Migration Plan

1. Entregar validação e migração compatíveis junto à interface; sem alteração de esquema SQL ou de versão do IndexedDB.
2. Carregar JSON antigo, aproveitar o contador válido datado e preservar conquistas, configurações e início de acompanhamento.
3. Persistir o estado normalizado pelo fluxo existente; confirmar reabertura, virada local e isolamento de perfis em testes.
4. Documentar que volumes já descartados não podem ser recuperados e que zerar hoje afeta o calendário de hoje.
