# Tasks

## 1. Base visual

- [x] 1.1 Consolidar tokens semânticos e regras repetidas de `styles.css` e `fluid.css` para fundos, superfícies, tipografia, bordas, foco, raios e espaçamento; verificar estilos calculados nas cinco cores e nos temas claro/escuro.
- [x] 1.2 Aplicar a base a cabeçalho, navegação e diálogos sem mudar rotas nem foco; verificar teclado, barra inferior e ausência de rolagem horizontal em 320, 390, 768 e 1440 px.

## 2. Início e registro

- [x] 2.1 Reorganizar o Início em progresso e ações prioritárias com sequência/pontos compactos; verificar consumo, meta, restante, garrafa, copo e desfazer em celular e desktop.
- [x] 2.2 Integrar o visual do popup da jarra enchendo aos novos tokens sem alterar seu ciclo; verificar garrafa/copo, volume, fechar/Escape, fechamento automático, retorno de foco e movimento reduzido no teste de interação e em Chromium.
- [x] 2.3 Atualizar README e testes afetados pelo Início; verificar `hydrationUi.test.mjs` e o fluxo Playwright de registro.

## 3. Histórico e Benefícios

- [x] 3.1 Reorganizar sequência, calendário e detalhes de recipientes para uma leitura diária clara; verificar diferença entre dia sem dado e zero, edição de tamanhos, reset e preservação dos volumes registrados.
- [x] 3.2 Redesenhar Benefícios com a mesma linguagem e preservar textos, expansão dos cartões e link de fonte; verificar navegação e uso por teclado nos três idiomas.
- [x] 3.3 Atualizar README e testes afetados pelo Histórico e Benefícios; verificar `dashboardNavigationUi.test.mjs` e as interações de calendário.

## 4. Entrada e preferências

- [x] 4.1 Redesenhar login, cadastro e onboarding mantendo explicações sobre perfis locais, validação, foco e retomada de setup; verificar `localProfileEntryUi.test.mjs` e `profileFormsUi.test.mjs`.
- [x] 4.2 Redesenhar Configurações e seus painéis de idioma, aparência, lembretes e backup; verificar salvar/cancelar, rascunhos independentes, Escape e retorno de foco nos testes de formulários.
- [x] 4.3 Atualizar README e testes visuais das telas de entrada e preferências; verificar legibilidade a 320 px e em zoom.

## 5. Integração visual

- [x] 5.1 Executar `npm run lint`, `npm test` e `npm run build`; corrigir apenas regressões do redesign.
- [x] 5.2 Revisar no navegador Início, Histórico, Benefícios, entrada, onboarding e Configurações em 320, 390, 768 e 1440 px, três idiomas, claro/escuro, cinco cores e movimento reduzido; registrar capturas e verificar contraste, sobreposição, foco e áreas de toque.

## Verification — 2026-10-26

- `npm test`: 112 passed, no failures or skipped tests.
- `npm run lint`: passed; `git diff --check`: passed.
- `npm run build`: passed, including the production build used by Playwright.
- Chromium: 9 passed. Checked navigation, keyboard focus, reminder drafts, bottle/glass popup, undo, settings, reload, reset, backup and profile isolation.
- Responsive checks: 320, 390, 768 and 1440 px in Portuguese, English and Spanish; History at 200% CSS zoom; all five accent palettes in light/dark themes with water-action contrast at least 4.5:1; opaque fallback and reduced motion.
- Captures reviewed for Home, History, Benefits, Settings, login and onboarding, including phone/desktop and dark goal-completed states. Captures are attached to the Playwright report and stored under `test-results/`.
- Browser libraries were extracted under `/tmp/sip-by-sip-browser`; no system packages or application dependencies changed. Browser command: `env LD_LIBRARY_PATH=/tmp/sip-by-sip-browser/libs/usr/lib/x86_64-linux-gnu npm run test:e2e`.
- The hydration journey now waits for the IndexedDB transaction before reloading, avoiding an intermittent reload before the asynchronous save completed. Persistence implementation is unchanged.
- Real screen readers, audible sound quality and browsers other than Chromium were not evaluated. The native iOS app was not changed.
