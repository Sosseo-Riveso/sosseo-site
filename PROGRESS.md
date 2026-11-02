# PROGRESS — SOSSEO (sosseo.com.br)

> Histórico de implementações e pendências do site.
> Formato: mais recente no topo. Ao concluir uma tarefa relevante, adicione uma linha
> aqui e atualize a data em `PROJECT_CONTEXT.md`.

**Status geral (02/11/2026):** site estático publicado na Cloudflare, 60 páginas com
`index.html`, 760 imagens no deploy, sitemaps + `llms.txt` ativos, CRMs em produção.
Migration WordPress (Turbocloud) → GitHub + Cloudflare em fase de teste/monitoramento.

---

## 📅 Histórico

### 2026-11-02 — Kit de governança, deploy e template
- Criado `.assetsignore` documentado: `wp-content/plugins/**`, `wp-content/themes/**`,
  `wp-includes/**` e `wp-content/uploads/**` explicitamente **fora** da lista de
  exclusão; `node_modules/`, `.wrangler/`, docs e `template-post-padrao.html` agora
  ficam de fora do deploy (o build subia arquivos desnecessários).
- `.gitignore` ampliado (caches `.wrangler/`, logs, temporários, arquivos de SO).
- Criados `.clineignore` (economia de tokens em `uploads/`, `node_modules/`, `.git/`),
  `.clinerules` (diretrizes de estrutura semântica, CTAs/WhatsApp, CSS),
  `PROJECT_CONTEXT.md`, `PROGRESS.md` e `template-post-padrao.html`.

### 2026-11-02 — Restauração do layout e CSS dos banners (commit `303f7a5`)
- `.assetsignore` voltou a liberar todos os CSS/JS de `wp-content/plugins` e
  `wp-includes` (commit anterior `51e8c90` havia removido "resquícios" e isso quebrou
  o site publicado).
- Restauradas no `astra-child/style.css` as regras "SOSSEO — BANNERS DO CONTEÚDO"
  (Banner 1 de 2 colunas, card com overlay azul e widgets da sidebar).
- Commit `329e172` — adicionados assets pendentes do Elementor e atualização do `index`.

### 2026-10-29 — Correção do menu e da memória do projeto
- `a1a5e53` / `a0853df` / `8aaeb87` / `c5a08e6` — série de correções no
  `.assetsignore` para enviar `wp-content/themes/astra/assets/css/minified/*`
  (`main.min.css`, `menu-animation.min.css`): sem eles o menu do desktop quebrava.
- `c9551e8` — leads arquivados passam a entrar no topo da coluna (ordenação por `_ts`).
- `cc6b872` — criado `_MEMORIA_PROJETO.md` (contexto rápido para novas conversas).

### 2026-10-28 — Painel Geral e navegação entre CRMs
- `68fe4d5` — novo `/painel-geral/` (CRM que agrega leads dos 8 sites) com login no
  backend do `sosseo-crm` e chave `crm_geral_sosseo_session`.
- `a7fbce7` — botão "CRM Geral" no painel de leads e link corrigido para
  `/painel-leads/`; botões compactados.

### 2026-10-27 — Correções de SEO social e limpeza
- `51e8c90` — `og:image` convertida para JPG 1200×630 (WhatsApp/Facebook), remoção do
  fallback de login local (`admin`/`123`) e exclusão (equivocada) de plugins/themes/
  wp-includes do deploy — revertida em 02/11.

### 2026-10-26 — Análise técnica e publicação
- `ANALISE_PROJETO.md` registrando infraestrutura, estrutura e riscos.
- `4041962` — publicação do artigo 19 (Sucessão Familiar na Indústria).
- `358aabe` — correção da imagem do card do artigo 19 na categoria.
- `24d98f7` / `0b301ba` — remoção do artigo `como-aumentar-margem-industrial-...`
  e de todas as referências (sitemap, llms-full, categoria).

### 2026-10 — Migração
- Export estático do WordPress, criação do `publicar-artigo.mjs`, sitemaps,
  `robots.txt`, `_headers`, `_redirects`, `llms.txt`, `llms-full.txt`,
  calculadoras (`calculadoraoficinas/`, `calculadoras-b2b/`) e LPs.

---

## 🐛 Bugs corrigidos (não repetir)

| Bug | Causa | Solução |
|---|---|---|
| Menu do desktop quebrado | `.assetsignore` excluía `wp-content/themes/` | devolver o tema Astra ao deploy |
| Banner de 2 colunas empilhado, fundo vermelho, botão sem estilo | CSS do Kadence e `block-library` retornando 404 | liberar `wp-content/plugins/**` e `wp-includes/**` + fallback no `astra-child/style.css` |
| Card "Shortlist" branco com texto branco | `.kb-section-has-overlay` sem o `::before` do degradê | regra isolada do overlay em `astra-child/style.css` |
| Widget da sidebar fora da grade | largura da row Kadence do widget | `width/max-width: 100%` + grid de 1 coluna em `#secondary` |
| Leads duplicados na Entrada | ID instável | `leadId()` + dedup por telefone/nome |
| Arquivar/excluir não atualizava | `closeModal()` zerava `currentLead` | capturar o lead antes de fechar |
| Botão "CRM SOSSEO" com URL errada | apontava para `sosseo-crm.workers.dev` | href para `/painel-leads/` |

---

## ⚠️ Pendências / monitoramento

- [ ] Confirmar na Cloudflare se `_headers` e `_redirects` são aplicados no Worker
      static assets (no Pages são nativos; no Worker podem exigir `_routes`/regras).
- [ ] Revisar `og:image` em `.webp` nas páginas antigas (WhatsApp pode não renderizar).
- [ ] `index.html` da home tem 580 KB — avaliar lazy-load/otimização de imagens e CSS.
- [ ] Verificar se `wp-includes/js/*` ainda é referenciado por alguma página legada
      antes de qualquer limpeza (não remover sem auditar).
- [ ] Confirmar que `/painel-geral/` e `/painel-leads/` não ficam acessíveis sem login.
- [ ] Rotacionar o token da Cloudflare usado nos deploys e guardá-lo fora do repositório.
- [ ] Remover `vercel.json` do repositório (resquício, já replicado em `_headers`/
      `_redirects`) — decidir e executar em um commit dedicado.
- [ ] Migrar a geração de posts para o `template-post-padrao.html` (hoje o
      `publicar-artigo.mjs` clona `como-vender-usinagem-sem-guerra-de-precos/`).
- [ ] Rodar auditoria de links internos após cada lote de artigos novos.
- [ ] Acompanhar Core Web Vitals no Search Console (home + top 10 artigos).
