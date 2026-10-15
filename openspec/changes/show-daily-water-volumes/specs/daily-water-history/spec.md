# Spec Delta

## Purpose

Permitir comparar o consumo registrado em diferentes dias pelo calendário, preservando totais diários e distinguindo valores conhecidos de histórico sem volume recuperável.

## ADDED Requirements

### Requirement: Totais persistidos por dia local e perfil
O aplicativo SHALL preservar o total registrado de cada dia conhecido usando a data local, separado por perfil, inclusive após recarregar ou reabrir o aplicativo.

#### Scenario: Virada do dia com aplicativo aberto
- **WHEN** o dia local muda após registrar 1750 ml
- **THEN** o dia encerrado conserva 1750 ml e o contador de hoje começa em zero com as configurações preservadas

#### Scenario: Reabertura após vários dias
- **WHEN** o aplicativo é reaberto dias depois de salvar 1250 ml
- **THEN** o volume permanece associado à data original, hoje começa em zero e os dias intermediários sem registros conhecidos mostram “Sem dados”

#### Scenario: Isolamento entre perfis
- **WHEN** dois perfis registram volumes diferentes na mesma data e são reabertos
- **THEN** cada calendário mostra apenas os totais do respectivo perfil

### Requirement: Volume atual acompanha alterações do contador
O calendário SHALL refletir adições, desfazer e zerar progresso no volume de hoje, preservando totais anteriores. Alterar tamanho de recipiente ou meta SHALL preservar os volumes registrados. As regras existentes de premiação e cumprimento de meta SHALL permanecer independentes do total exibido.

#### Scenario: Adicionar e desfazer quantidades diferentes
- **WHEN** são registrados 500 ml e 250 ml e o último registro é desfeito
- **THEN** o volume de hoje passa de 750 ml para 500 ml, inclusive após recarregar

#### Scenario: Confirmar ou cancelar reset
- **WHEN** o usuário confirma zerar progresso
- **THEN** hoje mostra zero, os dias anteriores permanecem intactos e as conquistas existentes são preservadas
- **WHEN** o usuário cancela a confirmação ou pressiona Escape
- **THEN** nenhum volume é alterado

#### Scenario: Mudar configurações
- **WHEN** o tamanho da garrafa, do copo ou a meta é alterado
- **THEN** o consumo de hoje e dos dias anteriores permanece igual

### Requirement: Compatibilidade sem inventar volumes
O aplicativo SHALL aproveitar o total válido e a data válida ainda salvos por versões anteriores antes de reiniciar o dia. Datas apenas com informação de meta SHALL continuar com volume desconhecido. Histórico ausente ou parcialmente inválido SHALL carregar sem perder configurações e registros válidos.

#### Scenario: Migração de estado anterior
- **WHEN** existe um total válido salvo de 1500 ml para ontem e datas antigas apenas com meta cumprida
- **THEN** ontem recebe 1500 ml e as demais datas mantêm seus símbolos com “Sem dados”

#### Scenario: Histórico inválido
- **WHEN** o histórico contém datas impossíveis ou futuras e valores negativos, não numéricos ou fora da precisão suportada
- **THEN** esses itens são ignorados sem impedir o uso dos demais dias válidos

### Requirement: Volume diretamente visível e acessível
Cada dia conhecido SHALL exibir seu volume junto ao símbolo existente, sem exigir clique ou hover. Zero conhecido SHALL ser exibido como “0 ml”; dias passados desconhecidos SHALL mostrar “Sem dados”. Dias futuros SHALL permanecer neutros sem volume. A apresentação SHALL seguir o idioma selecionado e ser legível em telas pequenas e nos temas claro e escuro.

#### Scenario: Comparar dias conhecidos e desconhecidos
- **WHEN** o calendário apresenta dias com 1500 ml, zero conhecido e volume desconhecido
- **THEN** apresenta respectivamente “1,5 L”, “0 ml” e “Sem dados” em português, junto aos símbolos existentes

#### Scenario: Leitura assistiva e navegação
- **WHEN** o calendário é consultado com tecnologia assistiva ou navegado entre meses
- **THEN** cada descrição de dia inclui data, situação da meta e volume ou ausência de dados, mantendo os limites e controles atuais de navegação

#### Scenario: Volume fracionário
- **WHEN** um dia contém 250,25 ml
- **THEN** a apresentação preserva essa precisão e não transforma consumo positivo em zero por arredondamento
