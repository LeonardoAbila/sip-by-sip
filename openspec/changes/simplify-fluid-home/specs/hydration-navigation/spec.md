# Spec Delta

## Purpose

Organizar a experiência de hidratação em destinos acessíveis que priorizam o registro diário e permitem consultar histórico e recursos secundários sem sobrecarregar a tela inicial.

## ADDED Requirements

### Requirement: Tela inicial centrada no consumo
O aplicativo SHALL apresentar no Início a data local, consumo de hoje, meta, progresso, registro de garrafa e copo com respectivos volumes e a ação de desfazer. Calendário, sequência e detalhes de recipientes SHALL ficar no Histórico; cartões de lembretes SHALL ser substituídos por acesso secundário às preferências.

#### Scenario: Abrir o aplicativo autenticado
- **WHEN** o usuário entra sem um destino específico
- **THEN** o Início mostra o progresso e as ações de registro sem calendário, cartões de sequência ou inventário de recipientes
- **AND** os dois controles de registro informam o volume configurado antes da ativação

### Requirement: Histórico preserva consultas e edição
O aplicativo SHALL disponibilizar no Histórico o calendário de volumes diários, a sequência existente e o resumo de recipientes de hoje com edição de tamanhos. A mudança de destino SHALL preservar os dados, datas locais, totais conhecidos e distinção entre zero e ausência de dados.

#### Scenario: Consultar após registrar água
- **WHEN** o usuário registra 500 ml no Início e abre o Histórico
- **THEN** o calendário e os detalhes de hoje refletem 500 ml e os dias anteriores mantêm seus dados

#### Scenario: Alterar recipientes pelo Histórico
- **WHEN** o usuário salva um novo tamanho de copo ou garrafa no Histórico e volta ao Início
- **THEN** o controle de registro mostra o novo volume sem modificar o consumo já registrado

### Requirement: Destinos navegáveis e compatíveis
O aplicativo SHALL oferecer Início, Histórico e Benefícios como destinos identificáveis, com indicação da página atual. Links diretos e os comandos voltar e avançar do navegador SHALL selecionar o destino correto. Destinos vazios ou desconhecidos SHALL abrir o Início.

#### Scenario: Abrir e percorrer destinos
- **WHEN** o usuário abre o link do Histórico, navega para Benefícios e usa voltar
- **THEN** o Histórico é reexibido com a indicação correta de página atual
- **AND** os links existentes para Início e Benefícios continuam funcionando

### Requirement: Acesso às ações secundárias
O aplicativo SHALL manter configurações, lembretes, backup de perfil e saída acessíveis sem exigir registro de água. Zerar o consumo de hoje SHALL permanecer disponível no Histórico com confirmação e cancelamento.

#### Scenario: Configurar lembretes
- **WHEN** o usuário abre Configurações a partir de qualquer destino
- **THEN** pode acessar as preferências de lembretes e retornar de forma previsível sem perder as alterações já salvas

#### Scenario: Cancelar reset no Histórico
- **WHEN** o usuário solicita zerar hoje e cancela ou pressiona Escape
- **THEN** os volumes e as conquistas permanecem intactos e o foco retorna à ação de origem

### Requirement: Navegação adaptável e acessível
O aplicativo SHALL manter navegação e controles legíveis entre 320 px e telas desktop, com foco visível, nomes localizados e áreas de toque de pelo menos 44 px nas ações principais. Barras fixas SHALL respeitar áreas seguras e não encobrir conteúdo ou avisos. Mudar de destino SHALL focar seu título sem expor controles ocultos ao teclado.

#### Scenario: Usar por teclado em tela estreita
- **WHEN** o usuário navega entre os três destinos com teclado em uma tela de 320 px
- **THEN** encontra os controles em ordem lógica, identifica o destino atual e não acessa controles de páginas ocultas
- **AND** o último conteúdo pode ser rolado acima da barra inferior

### Requirement: Aparência consistente e movimento opcional
O aplicativo SHALL apresentar tipografia do sistema, superfícies com hierarquia clara, controles arredondados e estados de foco, seleção e pressionamento consistentes em português, inglês e espanhol, nos temas claro e escuro e nas cores existentes. Transparência SHALL ter alternativa opaca legível e redução de movimento SHALL desativar movimento decorativo.

#### Scenario: Preferência por redução de movimento
- **WHEN** o usuário abre Início e Histórico com redução de movimento ativada
- **THEN** todos os dados e ações continuam disponíveis sem ondas contínuas ou movimento de entrada dos painéis

#### Scenario: Transparência indisponível
- **WHEN** o navegador não oferece desfoque de fundo
- **THEN** a navegação e os diálogos mantêm contraste e legibilidade com superfícies opacas
