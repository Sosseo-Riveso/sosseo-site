# PROGRESS — SOSSEO (sosseo.com.br)

> Histórico de implementações e pendências do site.
> Formato: mais recente no topo. Ao concluir uma tarefa relevante, adicione uma linha
> aqui e atualize a data em `PROJECT_CONTEXT.md`.

**Status geral (02/11/2026):** site estático publicado na Cloudflare, 60 páginas com
`index.html`, 760 imagens no deploy, sitemaps + `llms.txt` ativos, CRMs em produção.
Migration WordPress (Turbocloud) → GitHub + Cloudflare em fase de teste/monitoramento.

---

## 📅 Histórico

### 2026-11-18 — GA4 `G-ZZMDPL7644` no lugar do GTM + Consent Mode v2
- Instalado o **Google Analytics 4 `G-ZZMDPL7644`** direto no `<head>` das **72 páginas
  públicas** (mais o `template-post-padrao.html`): bootstrap inline (Consent Mode v2,
  `wait_for_update: 500`), filtro de tráfego interno `?interno=sosseo` (localStorage +
  `history.replaceState`) e **1 único loader** `gtag/js` por página.
- Consent default: `analytics_storage` liberado (ou `denied` se já houve recusa);
  `ad_storage`, `ad_user_data` e `ad_personalization` sempre `denied` até o aceite.
  `gtag('js', new Date())` imediatamente antes de
  `gtag('config','G-ZZMDPL7644',{anonymize_ip:true,send_page_view:true,traffic_type})`.
- Limpeza do export WordPress: container **`GTM-MWBLQ22S`** (snippet do head, `noscript`
  do body e loader diferido da home) removido em 72 arquivos; comentários vazios
  `<!-- Google Tag Manager -->` eliminados; comentário `AccelerateWP Debug` removido de
  68 páginas; `<noscript>` duplicado do **PixelYourSite** removido de 68 páginas.
- Conversões migradas de `dataLayer.push({event:'generate_lead'})` para
  `gtag('event','generate_lead',{lead_source,service,profile})` no modal de WhatsApp
  (`lead_source: 'whatsapp_modal'`) e no envio dos formulários (`lead_source: 'site_form'`),
  sem duplicar eventos. Meta Pixel `1189104682466848` mantido (PageView + Lead).
- Novo `/js/consentimento-cookies-sosseo.js` (banner "Aceitar todos" / "Só o essencial",
  `gtag('consent','update')`, `#sosseoRevisarCookies`) referenciado antes do `</body>`
  em todas as páginas públicas; `_headers` ganhou cache de 7 dias para `/js/*`.
- Política de Privacidade: seção de cookies reescrita (GA4, Consent Mode v2, IP
  anonimizado) com botão **"Revisar preferências de cookies"**.
- Validação: `node scripts/validar-ga4-sosseo.mjs` (6 cenários: externo limpo, interno,
  recusa e aceite prévios, remoção do interno) em **0 erros**; SEO segue com os mesmos
  **141 achados legados** e GEO **91%** (baseline comparado com worktree do `HEAD`).

### 2026-11-16 — Blog: estudo de caso do site Baden Rodas e Pneus
- Publicado o artigo/estudo de caso `case-baden-rodas-e-pneus-seo-tecnico-e-geo-em-campinas/`
  (categoria `novos-sites-sosseo`), sobre o novo site oficial da **Baden Rodas e Pneus**
  (`https://badenrodasepneus.com.br/`), rede com duas unidades em Campinas/SP.
- Conteúdo: 46 páginas em HTML estático, grafo JSON-LD `AutoRepair` por loja
  (`branchOf`/`subOrganization`, CNPJ 31.319.526/0001-62, NAP individualizado,
  horários 8h–18h e sábado 8h–13h), GEO (chunks citáveis, query fan-out, `llms.txt`),
  Consent Mode v2 (LGPD) e indexação via IndexNow.
- Link editorial contextual **dofollow** para `https://badenrodasepneus.com.br/`
  no corpo do post (âncora "novo site oficial da Baden Rodas e Pneus em Campinas"),
  sem `nofollow`/`ugc`/`sponsored`; links internos para os clusters de criação de
  sites em Campinas, oficina mecânica, autoridade e diagnóstico de indexação.
- JSON-LD reescrito no post (o `publicar-artigo.mjs` não casava o bloco do template
  mestre `saswp-schema-markup-output`): `Article` + `WebPage`/`FAQPage` + `ImageObject`
  + `BreadcrumbList` (Início → Novos Sites SOSSEO → post) + `WebSite` + `Person`,
  com `about`/`mentions` apontando para a Baden (`AutoRepair` das duas lojas).
  Zero `@id` órfão na página.
- Página de listagem `category/novos-sites-sosseo/` recebeu o card novo (imagem 300×300);
  `post-sitemap.xml` (URL + lastmod 2026-11-16 + imagens), `llms.txt` (item 41, seção 3.6)
  e `llms-full.txt` (Case 3 + URL 41) atualizados. `publicar-artigo.mjs` ganhou o
  mapeamento `novos-sites-sosseo` → "Novos Sites SOSSEO".
- Validadores na página nova: **SEO 0 problemas** (`scripts/seo_checker.py`) e
  **GEO 100%** (`scripts/geo_checker.py`). Auditoria do site inteiro segue com os
  **141 achados legados** (73 páginas antigas), sem regressão: o post novo não aparece
  na lista de afetados. `scripts/` só tem `seo_checker.py` e `geo_checker.py` — não
  existe `validar_ontologia.py` nem `validar_grafo.py` neste repositório.
- Imagens novas em `wp-content/uploads/2026/10/`: fachadas do Jardim do Trevo e do
  Jardim Nova Europa em 1024×1024 `.webp` (+ variante 300×300 para o card).

### 2026-11-02 — Auditores SEO e GEO (`scripts/`)
- Criada a pasta `scripts/` (ferramenta local, fora do deploy) com dois validadores
  adaptados das skills `seo-fundamentals` e `geo-fundamentals`:
  `seo_checker.py` (title/description com alvo 50-60 e 70-160, Open Graph, canonical,
  H1 único, alt de imagens) e `geo_checker.py` (JSON-LD, FAQ, listas, tabelas,
  entidade, estatísticas e respostas diretas em pt-BR).
- `scripts/`, `*.py` e `__pycache__/` estão no `.gitignore` e no `.assetsignore`:
  não versionam nem sobem no deploy da Cloudflare.
- Primeira execução: GEO com média **91%** em 75 páginas; SEO com **73 páginas** e
  **141 achados** (47 titles fora de 50-60, 10 páginas sem meta description,
  13 com Open Graph incompleto, 65 com `alt=""`, 0 imagem realmente sem `alt`).
- Pendências reais: `calculadoras-b2b/calculadora-*` (sem description/OG, sem JSON-LD
  e sem autor), `calculadoraoficinas/`, `politica-de-privacidade/` e as LPs
  `transforme-sua-oficina-*` (sem meta description). Os painéis do CRM aparecem no
  relatório porque são `noindex` de propósito — não otimizar.
- Comando: `py scripts/seo_checker.py .` e `py scripts/geo_checker.py .` (o alias
  `python` do Windows está desativado nesta máquina).

### 2026-11-02 — Skills históricas B2B incorporadas às regras
- `.clinerules` ampliado para 15 seções com base em
  `.agent/rules/metadados_artigos.md` e nas skills `seo-fundamentals`,
  `geo-fundamentals`, `manual_escaneabilidade_copywriting` e
  `linkedin_prospeccao_b2b`.
- Metadados agora documentados como **8 itens obrigatórios**, com a
  `Conclusão Estratégica (Takeaway)` fixada como **8º e último item bloqueante**.
- Novas seções: 11 (SEO técnico on-page + Core Web Vitals), 12 (GEO/AEO — query
  fan-out, chunks citáveis, `llms.txt`), 13 (escaneabilidade: regra 2-3-4, pull
  quote, PAS/AIDA, jargão proibido), 14 (prospecção LinkedIn B2B: ICP, cadência de
  4 passos, objeções) e 15 (mapa das skills e adaptações).
- `template-post-padrao.html` recebeu o **bloco comentado dos 8 metadados**
  (pronto para copiar no arquivo-fonte, sem poluir a página publicada).
- `PROJECT_CONTEXT.md` ganhou a seção 12 "Padrão editorial — SEO, GEO e
  escaneabilidade B2B". Nenhuma página em produção foi alterada.

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
