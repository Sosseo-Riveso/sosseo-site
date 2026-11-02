# Análise Técnica — sosseo.com.br (Site da Agência SOSSEO)

> Documento de entendimento registrado em 26/10/2026.
> Projeto: site institucional da agência **SOSSEO** (https://sosseo.com.br/), migrado de **WordPress (Turbocloud)** para **GitHub + Cloudflare** em out/2026 (em teste).

---

## 1. Identificação e Infraestrutura

| Item | Valor |
|---|---|
| **Site** | https://sosseo.com.br/ |
| **Pasta local** | `c:\Users\Reinaldo\Desktop\SOSSEO_sites\sosseo-site` |
| **Repositório Git** | `https://github.com/Sosseo-Riveso/sosseo-site.git` |
| **Branch** | `main` |
| **Hospedagem** | **Cloudflare Pages** (estático) — `wrangler.json` minimalista (só nome + assets) |
| **Framework** | Estático puro (exportado do WordPress) — **sem build**; `publicar-artigo.mjs` é script de automação próprio |
| **Backend de leads/CRM** | **Worker central SOSSEO**: `https://sosseo-crm.sosseosites.workers.dev/api/*` |
| **WhatsApp** | `+55 11 97469-5663` (`5511974695663`) — número da agência |

### Deploy
- **`git push`** → Cloudflare Pages (static). `.nojekyll` presente (não usar GitHub Pages/Jekyll).
- **`.assetsignore`** exclui do deploy: `.git`, `.gitignore`, `.nojekyll`, `wrangler.json`, `publicar-artigo.mjs`, `Carro-suv/`, `Logos/`. **Não exclui** `wp-content/` ou `wp-includes/`.
- **`.gitignore`**: `node_modules/`, `package.json`, `package-lock.json`, `.vscode/` (ferramentas de build não versionadas).
- **`_headers`**: headers de segurança globais + `Cache-Control: immutable` (1 ano) para `/wp-content/*` e `/wp-includes/*`.
- **`_redirects`**: `/tecnica-para-preencherprodutos...` e `/tag-do-google-e-pix...` → URLs canônicas (301).
- **`vercel.json`**: ✅ **resquício** de hospedagem anterior (Vercel) — já foi replicado em `_redirects`/`_headers`; **pode ser removido** (o Cloudflare Pages ignora `vercel.json`).

---

## 2. Estrutura de Pastas (migração WordPress → estático)

```
sosseo-site/
├── .git/  .assetsignore  .gitignore  .nojekyll
├── index.html              # Home (580 KB — grande; WordPress exportado)
├── <slug-do-post>/index.html   # # 59 diretórios de posts/páginas/categorias (cada um com seu index.html)
├── category/ author/     # arquivos de categoria e autor do WP
├── wp-content/           # ✅ # 845 arquivos versionados
│   ├── uploads/          # # 761 imagens (48 MB) — NECESSÁRIO (referenciadas nos posts)
│   ├── plugins/ themes/  # ⚠️ resquícios WP (84) — NÃO usados em site estático
├── wp-includes/          # # 8 arquivos (JS/CSS WP) — resquícios
├── calculadoraoficinas/  # calculadora interativa (referenciada nos posts de oficina)
├── calculadoras-b2b/     # calculadoras B2B (payback, etc.)
├── Logos/  Carro-suv/    # # 18 arquivos — EXCLUÍDOS do deploy (.assetsignore)
├── painel-leads/         # CRM da agência (app.js, index.html, style.css)
├── Llms: llms.txt / llms-full.txt
├── Sitemaps: sitemap.xml, sitemap_index.xml, post/page/category/author-sitemap.xml
├── robots.txt, _headers, _redirects
├── publicar-artigo.mjs   # 🛠 Script de automação: publica novo artigo (HTML do WP → estático + sitemap + links)
├── vercel.json           # ⚠️ Resquício Vercel
└── node_modules/  package.json  # 🛠 dependências do script (sharp/parse5) — ignoradas
```

**Destaques:**
- **983 arquivos versionados** (73 HTML + uploads + resquícios).
- Conteúdo: ~59 seções com `index.html` próprio (posts, categorias, páginas, calculadoras, LPs como `lp-anuncios-google`, `lp-criacao-de-sites`, `posicionamento-industrial-b2b`).
---

## 3. Sistema de Captura de Leads / CRM (Central da Agência)

**Diferente dos outros sites** (que têm Worker próprio), o sosseo-site **não tem backend próprio** — os formulários enviam tudo para o **Worker central `sosseo-crm.sosseosites.workers.dev`**.

### Fluxo no site (home/posts)
- **Lead Gate / WhatsApp Modal (`sosseo-wa-overlay`):** intercepta todos os cliques em `wa.me`/`whatsapp.com`, abre modal pedindo **perfil da empresa** e **serviço desejado** (radio buttons) antes de liberar o WhatsApp.
- **Envio** via `sosseo-crm.sosseosites.workers.dev/api/leads` (JSON com dados do lead + origem).
- **WhatsApp alvo:** `5511974695663` (número da SOSSEO).
- **Google Tag Manager (`GTM-MWBLQ22S`)** + **Meta Pixel (fbq `1189104682466848`)** — carregados **somente após interação** (otimização de PageSpeed).

### CRM da agência (`painel-leads/`)
- **`painel-leads/index.html` + `app.js` + `style.css`** — um **CRM comercial completo da agência** (não por-site):
  - Endpoints: `sosseo-crm.sosseosites.workers.dev/api/auth/login`, `/api/leads`, `/api/users`, `/api/logs`.
  - Storage local: `sosseo_agency_crm_v3_clean`, sessão `sosseo_user_session`, controle de exclusão/limpeza via assinaturas.
  - Login: fallback local `admin`/`123` (e `admin`/`admin`) — **⚠️ revisar/forçar credenciais via backend**.
  - Funil comercial com estágios (novo, em análise, negociação, ganho/perda), gestão de usuários, log de auditoria.
  - NÃO usa leads fictícios de demonstração (100% produção).

> **Importante:** o FG Car (e outros) envia para `.../api/fgcar-leads`; o sosseo-site envia para `/api/leads` — todos no **mesmo** Worker central `sosseo-crm`, que orquestra por site/cliente.

---

## 4. SEO / GEO / AEO

- **Originado do WordPress + Yoast SEO v28.7**: mantém metadados completos por página (title, description, canonical, og, twitter, article:modified, keywords no JSON-LD), com `article:publisher` do Facebook e `sameAs`/Organization.
- **Sitemaps**: `sitemap_index.xml` (aponta para post/page/category/author-sitemap.xml) + `sitemap.xml`. Feitos pelo Yoast.
- **robots.txt**: permite GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended (GEO/AEO); bloqueia `/demo/`, `/painel-leads/`, `/painel-leads`.
- **GEO**: `llms.txt` + `llms-full.txt` (estratégia completa para IAs — provável "imóvel digital" de SEO/GEO local e B2B).
- **Canonical domain guard**: JS que detecta acesso via `github.io` e redireciona/noindex para `sosseo.com.br`.
- **Imagens**: `/wp-content/uploads/` com Cache-Control `immutable` (1 ano) no `_headers`.
- **Redirects**: 2 regras (301) corrigem slugs antigos do WP.

### ⚠️ Pontos SEO de atenção
- **og:image da home é `.webp`** (`wp-content/uploads/2025/10/Criacao-de-Sites-em-Osasco.webp`) — o mesmo padrão que causou problema de compartilhamento no WhatsApp/Facebook nos outros sites. **Converter/ajustar para JPG** (og:image:type já está como webp, mas o WhatsApp pode não renderizar).
- Muitos artigos antigos do WP mantêm a URL `/slug/` (diretórios) — já é a forma "limpa" que o Pages serve como `index.html`. OK.

---

## 5. Skills Encontradas (workspace `.agent`)

As skills em `c:\Users\Reinaldo\Desktop\SOSSEO_sites\.agent\skills\` (todas genéricas da agência — o sosseo-site não tem skill própria):

- **`redator_geo_seo`** — redação GEO/SEO modular (aplicável aos novos artigos do blog SOSSEO).
- **`seo-fundamentals`** / **`geo-fundamentals`** — fundamentos de SEO e GEO (com scripts de auditoria em Python).
- **`manual_escaneabilidade_copywriting`** — escaneabilidade e copywriting.
- **`blog_fgcar_automotivo`** — específica do FG Car (NÃO aplicável ao sosseo-site).
- **`linkedin_artigos_newsletter`** — transforma artigos do blog SOSSEO em edições LinkedIn/Newsletter ("Engenharia de Demanda Industrial").
- **`linkedin_prospeccao_b2b`** — prospecção B2B no LinkedIn (público industrial).
- **`GMB_SRE_SEO.md`** — Google Perfil da Empresa (SEO local).

Regra obrigatória em `.agent/rules/metadados_artigos.md`: artigos devem terminar com **Conclusão Estratégica (Takeaway)**, e o **`publicar-artigo.mjs`** já parseia esse campo automaticamente ao publicar um artigo.

---

## 6. Observações e Pontos de Atenção (ação recomendada)

### ✅ Está correto / bom
- Migração bem-sucedida: site estático servido no Cloudflare Pages, com sitemaps, robots para IA, GEO (llms), canonical guard e headers de segurança.
- `node_modules` e as "ferramentas de build" (package.json) fora do versionamento.
- `Logos/` e `Carro-suv/` excluídos do deploy (são acervo local).

### ⚠️ Ações recomendadas (migração em teste — revisar)
1. **Remover resquícios WordPress ociosos do deploy:** `wp-content/plugins/` e `wp-content/themes/` (84 arquivos) **não são usados** num site estático e estão indo para o Cloudflare. Adicionar ao `.assetsignore` (manter `uploads` no deploy, pois as imagens são referenciadas).
   - Cuidado: **`wp-content/uploads` NÃO pode ser excluído** (1639 referências de imagens nos posts).
2. **Remover `vercel.json`** (resquício; o Cloudflare Pages usa `_redirects`/`_headers`, que já existem).
   - Verificar `wp-includes/` (8 arquivos) se ainda são referenciados; senão, excluir do deploy.
3. **og:image da home em `.webp`** → ajustar para JPG (compartilhamento WhatsApp/Facebook). Mesma correção aplicada nos outros sites.
4. **Credencial do painel-leads** (`admin`/`123`) — forçar autenticação pelo backend central (`/api/auth/login`) e usar senha forte; o fallback local é frágil.
5. **`index.html` da home tem 580 KB** — grande; considerar lazy-load/otimizar (mas funciona).
6. **Confirmar o deploy real no Cloudflare Pages**: como `wrangler.json` é apenas assets (sem worker), verificar se a rota `/painel-leads/` não fica exposta e se os `_headers`/`_redirects` estão sendo aplicados pelo Pages (o `.assetsignore` mantém `_headers`/`_redirects`? Sim, não estão na lista de exclusão).

---

## 7. Fluxos de Trabalho

### Publicar novo artigo (automação)
`node publicar-artigo.mjs <caminho-do-html> [--categoria=seo-para-empresas]` → gera a pasta `/slug/` + atualiza sitemap + cria/atualiza arquivos + links. Depois `git add/commit/push` → deploy automático.

### Novo lead (site)
Formulário/modal → `sosseo-crm.sosseosites.workers.dev/api/leads` → registra no CRM central → aparece em `painel-leads/` (CRM da agência).

### Criando/otimizando conteúdo
Usar skill `redator_geo_seo` + regra de metadados (Takeaway), salvar o HTML pronto, e publicar via `publicar-artigo.mjs`.

