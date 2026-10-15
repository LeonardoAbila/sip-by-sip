# Tasks

## 1. Estado e persistência dos totais diários

- [x] 1.1 Adicionar e validar `dailyTotals` em `src/state.js`, migrando apenas o contador válido com data válida e mantendo dias desconhecidos sem valor; verificar com testes de histórico ausente, parcialmente inválido, datas futuras e impossíveis, zero conhecido, valores fracionários e migração repetida.
- [x] 1.2 Arquivar o dia encerrado em `currentDay()` antes de reiniciar o contador e preservar histórico em adicionar, desfazer, reset e alterações de configurações; testar virada local, mês/ano, reabertura após vários dias, normalização repetida e manutenção de conquistas em `npm test`.
- [x] 1.3 Cobrir em `tests/database.test.mjs` o ciclo salvar/fechar/reabrir com histórico, migração de estado antigo e dois perfis distintos; verificar que os totais continuam separados e sobrevivem à persistência SQLite/IndexedDB com `npm test`.
- [x] 1.4 Atualizar o README sobre retenção por dia, recuperação limitada do legado, dias desconhecidos e efeito de zerar hoje; conferir que os exemplos correspondem aos testes de estado e migração.

## 2. Consulta e apresentação no calendário

- [x] 2.1 Acrescentar consulta de volume em `src/calendar.js` e formatação localizada simples, distinguindo hoje, dia encerrado, desconhecido e futuro; testar zero, 1500 ml, 250,25 ml e precisão de centésimos nas unidades exibidas, sem alterar `calendarStatus()`.
- [x] 2.2 Exibir a linha de volume junto à data e símbolo em `HydrationCalendar.jsx`, atualizar textos nos idiomas existentes e descrições acessíveis, e ajustar `src/styles.css`; verificar diretamente volumes visíveis sem clique, “Sem dados”, futuro neutro e ausência de corte em celular e nos dois temas quando houver navegador.
- [x] 2.3 Atualizar a descrição do calendário no README com exemplos de volume, zero e ausência de dados; verificar consistência com a interface e preservar a documentação das regras de metas e navegação.

## 3. Validação integrada

- [x] 3.1 Executar `npm test` e `npm run build`, corrigindo regressões; registrar resultados dos comandos antes de concluir a implementação.
- [x] 3.2 Quando houver navegador, verificar adicionar/desfazer, salvar/cancelar configurações, reset confirmado/cancelado/Escape, atualização após recarregar, navegação mensal, temas, idiomas, layout móvel e nomes acessíveis; relatar explicitamente qualquer verificação indisponível.

## Resultados da validação

- `npm test`: 38 testes passaram, incluindo migração, retenção diária, precisão, reset e isolamento de perfis.
- `npm run build`: passou; `git diff --check`: passou.
- Renderização do calendário em pt-BR/en/es verificada com React/Vite: volume visível, texto de ausência e nomes acessíveis.
- Verificação visual e interativa indisponível: o Chromium instalado não inicia por falta de `libnspr4.so`, inclusive fora do sandbox. Não foi possível conferir no navegador adicionar/desfazer, salvar/cancelar configurações, reset confirmado/cancelado/Escape, recarregar, navegação mensal, temas, idiomas e layout móvel. A lógica de dados foi coberta pelos testes; os fluxos e estilos precisam de revisão visual em navegador funcional.
