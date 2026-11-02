# PROJECT_CONTEXT — SOSSEO (sosseo.com.br)

> Documento de contexto do projeto para pessoas e agentes de IA.
> Última atualização: 02/11/2026 · Complementa `.clinerules` e `PROGRESS.md`.

---

## 1. O que é o projeto

Site institucional e blog técnico da **SOSSEO — Criação de Sites, SEO e Posicionamento
Digital**, agência brasileira de *Engenharia de Demanda Orgânica*. O site é 100% estático
(export do WordPress, sem build) e é a principal vitrine comercial da agência.

| Item | Valor |
|---|---|
| Domínio | https://sosseo.com.br/ |
| Repositório | `Sosseo-Riveso/sosseo-site` (branch `main`) |
| Hospedagem | Cloudflare Workers Static Assets (`wrangler.json` → worker `sosseo-site`) |
| Deploy | `npx wrangler deploy` (ou push na `main`, conforme integração ativa) |
| Backend de leads | Worker `sosseo-crm` → `https://sosseo-crm.sosseosites.workers.dev/api/*` |
| Sem build | HTML/CSS/JS puros; `publicar-artigo.mjs` é o único script de automação |
| WhatsApp comercial | **+55 11 97469-5663** (`5511974695663`) |
| Unidades | Osasco/Grande SP e Campinas/SP |
| CNPJ | 26.787.198/0001-99 |

---

## 2. Público-alvo (a régua de tudo que é escrito)

O site fala com **dois públicos**, sempre em tom técnico e consultivo:

### 2.1 Industrial B2B (núcleo estratégico)
- **Quem decide:** dono, diretor industrial, gerente comercial, engenheiro de processos,
  comprador técnico (supply chain), responsável por homologação de fornecedores.
- **Segmentos:** usinagem CNC, ferramentaria/matrizaria, injeção plástica, caldeiraria,
  equipamentos industriais, autopeças, metalurgia.
- **Dor:** ociosidade fabril, guerra de preços, dependência de 2–3 clientes grandes,
  ciclo de vendas longo, CAC alto, concorrência que só aparece em feiras.
- **O que ele busca no Google:** "usinagem CNC 5 eixos", "fornecedor de moldes",
  "injeção plástica sob demanda", "RFQ", "tolerância DIN ISO 2768", "homologação de
  fornecedor". Vocabulário dele: RFQ, hora-máquina, STEP/IGES, NDA, tolerância
  micrométrica, payback, CAPEX.
- **Objetivo do conteúdo:** gerar RFQ qualificada e posicionar a fábrica como
  especialista antes do primeiro contato comercial.

### 2.2 Local / alto ticket (frente automotiva e serviços)
- Oficinas mecânicas, funilaria e pintura, estética automotiva, clínicas e serviços
  especializados que precisam dominar o Local Pack e o Google Perfil da Empresa.
- **Dor:** dependência de seguradora, pátio vazio, cliente de ticket baixo,
  concorrente mal avaliado aparecendo na frente.

---

## 3. Identidade visual (paleta e tipografia)

### 3.1 Paleta

| Papel | Cor | Uso |
|---|---|---|
| Azul institucional | `#0A3D91` | fundo dos banners, cards de CTA |
| Azul profundo | `#031146` / `#03184A` | início dos degradês, fundos escuros |
| Azul elétrico | `#1132E0` | núcleo do degradê radial do banner |
| Azul escuro do menu | `#0F1985` | header/menu mobile |
| Amarelo destaque | `#FCB900` | texto em destaque sobre azul, ícones, números |
| Dourado suave | `#F1B73A` / `#E3BE59` | títulos de submenu e rodapé |
| Verde CTA | `#0E6606` | botão "Consultoria Gratuita" da sidebar |
| Verde WhatsApp | `#25D366` | ícone/botão de WhatsApp |
| Verde sucesso | `#22C55E` | variação clara de CTA |
| Branco | `#FFFFFF` | texto sobre azul, cards |
| Cinza claro | `#F5F5F5` / `#E5E5E5` | fundos, bordas, FAQ |
| Texto | `#3A3A3A` / `#4B4F58` | corpo de texto padrão |
| Texto forte | `#0F172A` | títulos e corpo de alto contraste |
| Link padrão (Astra) | `#0170B9` | links no corpo do texto |

**Regras da marca:** degradê sempre do azul profundo para o azul elétrico; amarelo
apenas como destaque (nunca em blocos grandes); verde reservado para ação
(consultoria/WhatsApp). O vermelho `#ea5959` que existe no CSS inline do WordPress é
**resíduo** e não pode aparecer no site publicado.

### 3.2 Tipografia
- **Títulos:** `Lato` (600/700), sans-serif.
- **Corpo:** `Lora` (400), serif — legibilidade de leitura longa.
- Tamanho base `18px`, escala `html { font-size: 112.5% }`.
- Container de conteúdo: `1400px` (Astra `--ast-normal-container-width`).

---

## 4. Estrutura do site (estática, espelho do WordPress)

```
sosseo/
├── index.html                     # Home (580 KB — export WP, cuidado ao editar)
├── <slug-do-post>/index.html      # 60 diretórios com página própria
├── category/<slug>/index.html     # arquivos de categoria (7 categorias)
│     marketing-industrial-b2b · seo-para-empresas · google-perfil-de-empresas
│     google-ads · trafego-pago · marketing · novos-sites-sosseo
├── author/                        # arquivo de autor (SOSSEO / ivessosseo)
├── posicionamento-industrial-b2b/ # LP principal da frente industrial
├── lp-criacao-de-sites/ · lp-anuncios-google/   # landing pages de conversão
├── calculadoraoficinas/ · calculadoras-b2b/     # calculadoras interativas
├── painel-leads/                  # CRM comercial SOSSEO (Kanban)
├── painel-geral/                  # CRM geral (agrega leads dos 8 sites)
├── wp-content/
│   ├── themes/astra/              # CSS/JS do tema (main.min.css, menu-animation)
│   ├── themes/astra-child/        # style.css → TODAS as correções visuais nossas
│   ├── plugins/                   # Kadence, Elementor, Fluent Forms, Accordion…
│   └── uploads/<ano>/<mês>/       # 760 imagens (~48 MB) usadas nos posts
├── wp-includes/                   # block-library, jQuery (dependências)
├── _headers · _redirects          # cache, segurança e 301 (Cloudflare)
├── robots.txt · sitemap*.xml      # indexação
├── llms.txt · llms-full.txt       # GEO — contexto para LLMs/IA generativa
├── publicar-artigo.mjs            # publica artigo + sitemaps + llms + card categoria
├── template-post-padrao.html      # template de referência de artigo
├── design/esboco-layout-post.html # esboço visual do layout (desktop/mobile)
├── .assetsignore · .gitignore · .clineignore · .clinerules
└── PROJECT_CONTEXT.md · PROGRESS.md
```

---

## 5. Anatomia de um artigo (o que não pode variar)

1. **`<head>` SEO** — title, description, canonical, robots, OpenGraph (JPG 1200×630),
   Twitter Card, JSON-LD `Article` + `FAQPage` + `BreadcrumbList`, GTM e Meta Pixel.
2. **Banner do topo (H1)** — 1 coluna, fundo `radial-gradient` azul, H1 branco ~29 px,
   subtítulo amarelo, linha "Atualizado em · Por SOSSEO · Categoria".
3. **Respiro de 28 px + H2 com a palavra-chave** antes do primeiro parágrafo.
4. **Banner de 2 colunas** (`.kb-row-layout-id3642_92aa72-10`): grid `55fr / 45fr`,
   overlay azul + sombra azul, texto "Eu crio SITES Otimizados para APARECER no GOOGLE",
   botão verde de WhatsApp e imagem à direita. Em ≤767 px vira 1 coluna (imagem primeiro).
5. **Corpo do artigo** — H2/H3 semânticos, parágrafos curtos, listas, tabela comparativa,
   imagens 1:1 com legenda técnica.
6. **Card `⚡ Conclusão Estratégica (Takeaway)`** — coluna Kadence com
   `.kb-section-has-overlay` (degradê azul via `::before`), CTA final.
7. **Bloco do autor + marca SOSSEO + mapa**.
8. **Barra lateral** (`#secondary`, 300 px) alinhada ao topo do artigo: Índice (TOC),
   card "Não Sabe Como Iniciar?" (degradê azul) + botão verde "Consultoria Gratuita",
   banner de contato.
9. **Posts relacionados** e **rodapé** (contato, endereço, links legais, copyright).

O arquivo de referência é `template-post-padrao.html`; o template mestre usado pelo
script é `como-vender-usinagem-sem-guerra-de-precos/index.html`.

---

## 6. CTAs e conversão

| CTA | Onde | Destino |
|---|---|---|
| "Só Chamar WhatsApp para uma Consultoria" | banner de 2 colunas | `api.whatsapp.com/send?phone=5511974695663` |
| "Consultoria Gratuita" (verde) | sidebar | mesmo WhatsApp |
| Card Takeaway | fim do artigo | `/posicionamento-industrial-b2b/` ou `/contato/` |
| Formulário de contato | `/contato/` | `POST /api/leads` (worker `sosseo-crm`) |
| Telefone | rodapé | `tel:+5511974695663` |

Os links de WhatsApp são **âncoras de conversão validadas**: texto, número e destino
não devem ser alterados sem pedido explícito.

---

## 7. Deploy, assets e cache

- `.assetsignore` controla o upload. **Nunca** excluir `wp-content/themes`,
  `wp-content/plugins`, `wp-includes`, `wp-content/uploads`, `_headers`, `_redirects`.
- Motivo histórico: excluir `plugins/` e `wp-includes/` derrubou o grid de 2 colunas,
  o degradê azul do banner e o estilo dos botões (CSS Kadence/block-library = 404).
- `_headers`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e
  `Cache-Control: public, max-age=31536000, immutable` para `/wp-content/*` e
  `/wp-includes/*`.
- `_redirects`: `/tecnica-para-preencherprodutos-google-perfil-empresa/*` →
  `/guia-produtos-google-perfil-empresa/` (301) e
  `/tag-do-google-e-pix-do-facebook/*` → `/tag-do-google-e-pixel-do-facebook/` (301).
- `vercel.json` é resquício da hospedagem anterior — ignorado pela Cloudflare.

---

## 8. SEO / GEO

- Sitemaps: `sitemap.xml`, `sitemap_index.xml`, `post/page/category/author-sitemap.xml`.
- `robots.txt` libera buscadores e IAs; `llms.txt` e `llms-full.txt` descrevem a
  entidade, os serviços e os artigos para motores generativos (GEO/AEO).
- Todo artigo é escrito para citação: definições curtas, listas, tabelas e FAQ com
  pares pergunta/resposta que alimentam o schema `FAQPage`.
- Guarda de domínio: script `sosseo-canonical-domain-guard` no `<head>` impede
  indexação de pré-visualizações em `github.io` e redireciona para o domínio real.

---

## 9. Analytics e rastreamento

- Google Tag Manager: `GTM-MWBLQ22S` (head + noscript no body).
- Meta Pixel: `1189104682466848` (PageView).
- PixelYourSite e tags antigas existem em algumas páginas legadas — ao criar página
  nova, use apenas GTM + Pixel para não duplicar eventos.

---

## 10. Painéis (CRM)

| Painel | URL | Função |
|---|---|---|
| CRM Geral | `/painel-geral/` | agrega leads de todos os sites da agência |
| CRM SOSSEO | `/painel-leads/` | Kanban comercial da agência |

- Autenticação no worker `sosseo-crm` (`POST /api/auth/login`) — **sem fallback local**.
- Chaves de sessão/dados no `localStorage`:
  `crm_geral_sosseo_session` e `crm_geral_sosseo_v2`.

---

## 11. Fluxos de trabalho

**Publicar artigo**
`node publicar-artigo.mjs ../Artigos/artigo-NN-slug.html --categoria=marketing-industrial-b2b`
→ cria `/<slug>/index.html`, copia imagens para `wp-content/uploads/2026/10/`,
atualiza sitemaps, `llms.txt`, `llms-full.txt` e o card da categoria.
Depois: `git add -A && git commit -m "..." && git push`.

**Corrigir layout**
1. Confirmar no site publicado qual CSS retorna 404 (DevTools → Network).
2. Verificar `.assetsignore`.
3. Só então criar fallback isolado em `astra-child/style.css`.

**Novo lead**
Formulário do site → `POST /api/leads` no worker `sosseo-crm` → aparece em
`/painel-leads/` e `/painel-geral/`.
