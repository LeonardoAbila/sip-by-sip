# Spec Delta

## Purpose

Permitir registrar e desfazer o consumo de água com resposta imediata e acessível, mantendo a continuidade de uso e os dados existentes do perfil.

## ADDED Requirements

### Requirement: Registro sem interrupção modal
O aplicativo SHALL registrar o volume configurado do recipiente acionado e atualizar consumo, percentual e progresso sem abrir diálogo automático, mover foco ou bloquear novas ações enquanto a confirmação estiver visível.

#### Scenario: Registrar recipientes em sequência
- **WHEN** o usuário aciona uma garrafa de 500 ml e um copo de 250 ml em sequência
- **THEN** o consumo aumenta em 750 ml, os dois registros são preservados e nenhum modal de animação é aberto
- **AND** o foco permanece no controle acionado

#### Scenario: Registrar a partir do lembrete
- **WHEN** o usuário aceita registrar água em um aviso de lembrete
- **THEN** o volume do recipiente selecionado é registrado e o aviso é dispensado, sem animação modal automática

### Requirement: Confirmação acessível e temporária
Cada registro aceito SHALL produzir confirmação não modal com o volume adicionado no idioma selecionado. A mensagem SHALL ser anunciada de forma educada por tecnologia assistiva e desaparecer após aproximadamente quatro segundos, sem cobrir ações. Expirar uma confirmação SHALL NOT alterar consumo ou desfazer.

#### Scenario: Confirmações sucessivas
- **WHEN** um segundo registro ocorre antes de a confirmação anterior desaparecer
- **THEN** a confirmação passa a informar o novo registro e renova seu período de exibição sem duplicar registros

#### Scenario: Preferência de movimento reduzido
- **WHEN** o usuário registra água com redução de movimento ativada
- **THEN** o consumo e a confirmação textual são atualizados sem depender de animação

### Requirement: Desfazer independente da confirmação
O aplicativo SHALL manter no Início a ação de desfazer o último registro enquanto houver uma entrada reversível. Desfazer SHALL remover o volume e o tipo efetivamente registrados, atualizar o Histórico e funcionar após expirar a confirmação ou recarregar o aplicativo.

#### Scenario: Desfazer após mudar volume
- **WHEN** o usuário registra 250 ml em copo, altera seu tamanho para 300 ml e desfaz o registro
- **THEN** somente os 250 ml registrados são removidos

#### Scenario: Desfazer sem registros
- **WHEN** não há entradas reversíveis para hoje
- **THEN** a ação de desfazer fica desabilitada e não modifica o consumo

### Requirement: Continuidade de persistência e erros
O aplicativo SHALL preservar isolamento por perfil, regras de data local, premiação e persistência ao registrar ou desfazer. Falhas de armazenamento SHALL continuar visíveis e acessíveis independentemente da confirmação de registro, que não deve prometer gravação concluída antes de sua confirmação.

#### Scenario: Falha de armazenamento após registro
- **WHEN** o consumo é atualizado mas o armazenamento falha
- **THEN** o alerta de erro permanece acessível mesmo quando a confirmação temporária desaparece

#### Scenario: Meta superada
- **WHEN** um registro leva o consumo acima da meta
- **THEN** o consumo real permanece integral, o indicador visual limita-se a 100% e a regra de premiação única por data permanece válida
