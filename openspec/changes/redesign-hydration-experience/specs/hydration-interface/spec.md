# Spec Delta

## Purpose

Oferecer uma experiência web de hidratação coerente e acessível, na qual registrar água é rápido, acompanhar o progresso é claro e o histórico ajuda a entender o hábito ao longo dos dias.

## ADDED Requirements

### Requirement: Início prioriza o registro e o progresso
O aplicativo SHALL mostrar no Início consumo atual, meta, progresso, volume restante e controles identificáveis para registrar garrafa e copo, com os volumes configurados. Sequência e pontos SHALL estar visíveis de forma compacta e secundária.

#### Scenario: Acompanhar o dia antes do primeiro registro
- **WHEN** o usuário abre o Início em um dia sem consumo registrado
- **THEN** encontra a meta, o progresso em zero e os dois controles de registro sem precisar abrir outra tela

#### Scenario: Registrar água
- **WHEN** o usuário registra uma garrafa ou um copo
- **THEN** consumo, progresso e volume restante são atualizados de imediato e o controle de desfazer continua disponível

### Requirement: Histórico conta o hábito por dias
O aplicativo SHALL apresentar no Histórico o calendário de volumes diários, a sequência e os detalhes dos recipientes de hoje em uma ordem de leitura clara. Dias sem histórico SHALL continuar distintos de dias registrados com zero; a edição de tamanhos e o reset confirmado SHALL continuar acessíveis.

#### Scenario: Rever uma data
- **WHEN** o usuário consulta um dia do calendário
- **THEN** identifica sua data, o volume conhecido e o estado da meta, ou percebe claramente que não há dado registrado

#### Scenario: Ajustar tamanho de recipiente
- **WHEN** o usuário altera o tamanho da garrafa ou do copo no Histórico
- **THEN** novos registros usam o tamanho atualizado e os volumes anteriores permanecem intactos

### Requirement: A mesma linguagem visual acompanha o fluxo
O aplicativo SHALL usar hierarquia de títulos, espaço, superfícies, ícones e estados de controles coerentes em entrada, configuração inicial, Início, Histórico, Benefícios e Configurações, adaptando a composição a telas estreitas e largas.

#### Scenario: Percorrer o app no celular
- **WHEN** o usuário passa da entrada para Início, Histórico, Benefícios e Configurações em uma tela de 320 px
- **THEN** reconhece os destinos e encontra as ações principais sem sobreposição ou rolagem horizontal

#### Scenario: Abrir em tela larga
- **WHEN** o usuário abre os mesmos destinos em desktop
- **THEN** o conteúdo usa o espaço disponível com ordem de leitura previsível e sem esticar controles além de sua área útil

### Requirement: Aparência preserva preferências e acesso
O aplicativo SHALL manter legibilidade, foco visível e controles com área de toque de pelo menos 44 px nos temas claro e escuro, nas cinco cores de destaque e nos idiomas português, inglês e espanhol. Preferência por movimento reduzido SHALL remover movimento decorativo sem esconder conteúdo nem ações.

#### Scenario: Alternar aparência e idioma
- **WHEN** o usuário muda tema, cor ou idioma em Configurações
- **THEN** os destinos e diálogos mantêm rótulos legíveis, estados de foco identificáveis e a mesma hierarquia de ações

#### Scenario: Reduzir movimento
- **WHEN** o sistema solicita movimento reduzido
- **THEN** progresso, confirmação e navegação continuam compreensíveis sem ondas ou transições decorativas

### Requirement: Feedback de registro mantém a animação escolhida
Após registrar água, o aplicativo SHALL manter o popup que mostra a jarra enchendo o recipiente correspondente e o volume registrado. O popup SHALL poder ser fechado, encerrar-se automaticamente e devolver o foco ao controle de origem; a opção de movimento reduzido SHALL mostrar um estado estático compreensível.

#### Scenario: Registrar garrafa
- **WHEN** o usuário registra uma garrafa
- **THEN** vê a garrafa encher, o volume registrado e pode fechar o popup sem desfazer o registro

#### Scenario: Registrar copo com movimento reduzido
- **WHEN** o usuário registra um copo com movimento reduzido ativado
- **THEN** vê o copo cheio e o volume registrado sem animação, podendo fechar o popup e recuperar o foco
