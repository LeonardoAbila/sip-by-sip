# Tasks

## 1. Navegação e composição das telas

- [x] 1.1 Ampliar a resolução de hash em App para Início, Histórico e Benefícios, preservando estado compartilhado e foco no título; estender `tests/dashboardNavigationUi.test.mjs` e verificar links diretos, hash desconhecido, voltar/avançar e controles ocultos fora do teclado.
- [x] 1.2 Reorganizar Início para conter data, HydrationCard e feedback, e Histórico para calendário, sequência, WaterLog e reset; verificar nos testes DOM a ausência dos cartões secundários no Início e atualização do calendário após registro/desfazer/reset, preservando os testes de histórico existentes.
- [x] 1.3 Adicionar rótulos de Histórico e navegação em português, inglês e espanhol; verificar nomes acessíveis e `aria-current` nos três idiomas e atualizar no README a organização dos destinos e os hashes suportados.

## 2. Registro contínuo e feedback

- [x] 2.1 Substituir o estado e a montagem automática de PourDialog por confirmação não modal de cerca de quatro segundos, limpando timers e feedback obsoleto; adaptar `tests/hydrationUi.test.mjs` para verificar dois registros imediatos, ausência de modal, foco preservado e soma correta.
- [x] 2.2 Mostrar o volume configurado em cada controle e manter Desfazer independente da mensagem; verificar com testes DOM timer renovado, confirmação expirada, registros idênticos consecutivos, desfazer após mudança de tamanho e remount, e estado desabilitado sem entradas.
- [x] 2.3 Unificar registro pelo lembrete com o feedback rápido e preservar erros de persistência e guards de backup; verificar por testes que o aviso é dispensado após registro, falhas continuam acessíveis após expiração e transferência em andamento não aceita mutação.
- [x] 2.4 Atualizar `e2e/helpers.js` e a jornada Playwright para remover o fechamento obrigatório da animação e acessar editor/reset pelo Histórico; documentar o novo registro no README e executar os testes DOM afetados.

## 3. Preferências e lembretes

- [x] 3.1 Extrair o formulário de RemindersDialog para uso como subpainel do diálogo de Configurações, sem modais empilhados; adaptar os testes de formulários de lembretes e verificar intervalos, presets, preview, som, salvar/cancelar e proteção durante importação.
- [x] 3.2 Definir retorno, Escape e foco entre Configurações e Lembretes preservando drafts independentes; cobrir em testes o descarte de lembretes ao voltar, a conservação de drafts de aparência e o retorno ao opener, e atualizar a entrada de lembretes no README.

## 4. Linguagem visual e adaptação

- [x] 4.1 Consolidar os estilos afetados em styles.css/fluid.css com tokens coerentes de superfície, texto, espaçamento, raios e elevação; verificar a especificidade das cinco paletas nos temas claro/escuro e manter login/onboarding visualmente utilizáveis sem mudanças em seus fluxos.
- [x] 4.2 Ajustar Início centralizado, Histórico adaptável e navegação inferior com três destinos, acesso às Configurações no cabeçalho e áreas de toque de pelo menos 44 px; verificar em 320, 390, 768 e 1440 px ausência de rolagem horizontal, controles encobertos e sobreposição com avisos, incluindo safe areas e zoom.
- [x] 4.3 Implementar transparência progressiva com fallback opaco e movimento curto com redução de movimento; verificar informação completa sem animação/desfoque, contraste dos controles e leitura das quantidades nos três idiomas, e atualizar a descrição visual do README.

## 5. Validação integrada

- [x] 5.1 Executar `npm test`, `npm run lint` e `npm run build`; corrigir regressões introduzidas e registrar resultados reais, distinguindo limitações ou falhas preexistentes.
- [x] 5.2 Executar `npm run test:e2e` quando Chromium estiver disponível e revisar teclado, navegação, preferências, backup e reload; verificar que os dados permanecem isolados por perfil e que a jornada não depende do modal removido. Se faltar libnspr4.so ou outra dependência, registrar o bloqueio sem afirmar sucesso.
- [x] 5.3 Entregar capturas de Início e Histórico em celular e desktop após conferência visual, incluindo uma variante escura e redução de movimento; revisar legibilidade e estados sem dados/meta cumprida. Se navegador indisponível, registrar esta validação como pendente.

## Verification

- `npm test`: 108 testes passaram, sem falhas ou testes ignorados.
- `npm run lint`: passou sem avisos.
- `npm run build`: passou.
- Chromium: 8 testes passaram, incluindo jornada principal, teclado/subpainéis, backup real e isolamento por perfil/contexto.
- Comando neste ambiente: `env LD_LIBRARY_PATH=/tmp/sip-by-sip-browser/libs/usr/lib/x86_64-linux-gnu npm run test:e2e`. Bibliotecas ausentes foram extraídas em `/tmp`, sem alteração dos pacotes do projeto ou instalação no sistema.
- Matriz visual: 320, 390, 768 e 1440 px nos três idiomas; cinco cores nos temas claro/escuro; fallback opaco; redução de movimento; zoom CSS 200%.
- Capturas geradas e inspecionadas: `test-results/fluid-layout-capture-home--53bae-ced-motion-and-goal-reached-chromium/`, arquivos `desktop-empty-{home,history}.png`, `phone-empty-{home,history}.png` e `phone-goal-dark-{home,history}.png`; também anexadas ao relatório Playwright. Login/onboarding de 320 px foram inspecionados no diretório do teste `fluid-layout-shared-appear-2ae9a-ing-usable-on-a-small-phone-chromium`.
- Verificado que confirmação e desfazer ficam acima da barra inferior na captura de 390 × 844 px com meta atingida. Telas longas do Histórico podem ser roladas até o último controle acima da barra.
- `curl -I http://localhost:5173/sip-by-sip/`: prévia local respondeu HTTP 200. Publicação não realizada.
- Limites de verificação: leitor de tela real, qualidade audível e navegadores além do Chromium não foram avaliados; não substituídos por alegações de testes automatizados.
