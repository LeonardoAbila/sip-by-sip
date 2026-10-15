# Proposal

## Why

A issue #9 pede consultar quanto foi bebido em dias anteriores, mas o calendário mostra apenas o cumprimento da meta e o estado atual descarta o volume na virada do dia. Preservar totais diários permite comparar a semana sem inventar valores para o histórico antigo.

## What Changes

- Exibir o volume diretamente em cada dia do calendário, junto ao símbolo da meta.
- Salvar totais por data local e por perfil, preservando-os ao trocar de dia e recarregar o aplicativo.
- Refletir adições, desfazer e zerar progresso no volume de hoje; zerar hoje não apaga dias anteriores.
- Distinguir zero registrado de volume desconhecido, exibindo “Sem dados” quando não houver um total recuperável.
- Preservar os símbolos, regras de metas e ofensivas, navegação mensal e acessibilidade existentes.

## Capabilities

### New Capabilities

- `daily-water-history`: retenção dos totais diários e consulta direta desses volumes no calendário, incluindo compatibilidade com dados antigos.

### Modified Capabilities

Nenhuma: o projeto ainda não possui especificações principais cadastradas.

## Impact

Afeta `src/state.js`, `src/calendar.js`, `src/HydrationCalendar.jsx`, traduções em `src/language.js`, estilos em `src/styles.css`, testes de estado e persistência e a documentação no `README.md`. Usa o JSON por perfil já salvo pelo SQLite/IndexedDB, sem novas dependências ou serviço remoto. O app iOS, edição retroativa, gráficos, exportação e histórico de cada ingestão estão fora do escopo.
