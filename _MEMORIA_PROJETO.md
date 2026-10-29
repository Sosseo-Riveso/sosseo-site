# 📋 MEMÓRIA DO PROJETO — SOSSEO Sites

> Arquivo de contexto rápido para a IA.  
> Criado em: 29/10/2026  
> Último deploy: commit `c9551e8` — "Ordena leads arquivados nas colunas do mais recente para o mais antigo"

---

## 📁 ESTRUTURA DO PROJETO

```
c:\Users\Reinaldo\Desktop\SOSSEO_sites\
├── sosseo-site/                ← Site principal sosseo.com.br
│   ├── index.html              ← Home page (modificada localmente — não commitar)
│   ├── .assetsignore           ← Controla o que sobe no deploy da Cloudflare
│   ├── wrangler.json           ← Config Cloudflare Workers Static Assets
│   ├── _headers                ← Headers de segurança
│   ├── _redirects              ← Redirecionamentos
│   ├── painel-geral/           ← CRM Geral (agrega leads de todos os sites)
│   │   ├── index.html          ← + Tela de login
│   │   ├── app.js              ← + Auth (mesma senha do CRM SOSSEO)
│   │   └── style.css
│   ├── painel-leads/           ← CRM Comercial SOSSEO (Kanban)
│   │   ├── index.html          ← + Botão "CRM Geral"
│   │   ├── app.js
│   │   └── style.css           ← Botões compactados
│   └── wp-content/themes/astra/assets/css/minified/
│       ├── main.min.css        ← CSS principal do Astra (estava faltando no deploy)
│       └── menu-animation.min.css
│
├── crm-geral/                  ← (FOI REMOVIDO — movido para a Lixeira)
├── cambio-automatico-campinas/ ← Sites dos clientes (cada um com worker próprio)
├── cambio-automatico-osasco/
├── mecanica-campinas/
├── mecanica-osasco/
├── portal-molde-injecao/
├── fgcar-funilaria/
├── sosseo-crm/                 ← Worker do CRM SOSSEO (+ API auth)
└── ...
```

---

## 🔐 AUTENTICAÇÃO DO CRM GERAL

- **URL:** `https://sosseo.com.br/painel-geral/`
- **Login:** Mesmo usuário/senha do CRM SOSSEO (valida via `POST /api/auth/login` no worker sosseo-crm)
- **Fallback offline:** ❌ Removido (segurança — mesma política do CRM SOSSEO)
- **Chave da sessão:** `crm_geral_sosseo_session` (localStorage)
- **Chave dos dados:** `crm_geral_sosseo_v2` (localStorage — arquivados, excluídos, observações)

## 🌐 PAINÉIS PUBLICADOS

| Painel | URL | O que faz |
|--------|-----|-----------|
| CRM Geral | `https://sosseo.com.br/painel-geral/` | Agrega leads de todos os 8 sites |
| CRM SOSSEO | `https://sosseo.com.br/painel-leads/` | Kanban comercial da agência |

Botões de atalho entre os dois painéis:
- **Painel Geral** → "Painel Leads ↗" (abre `/painel-leads/`)
- **Painel Leads** → "📊 CRM Geral" (abre `/painel-geral/`)

## 📦 DEPLOY (Cloudflare Workers)

**Comando:**
```bash
cd c:\Users\Reinaldo\Desktop\SOSSEO_sites\sosseo-site
npx wrangler deploy
```

**Token Cloudflare:** ✅ Guardado na conversa atual da IA.  
*Em nova conversa, solicitar ao usuário que forneça o token novamente*

**Workers envolvidos:**
| Worker | Domínio |
|--------|---------|
| `sosseo-site` | `sosseo.com.br` → assets estáticos (HTML/CSS/JS) |
| `sosseo-crm` | `sosseo-crm.sosseosites.workers.dev` → API + auth |

## 🐛 BUGS CORRIGIDOS (para não refazer)

1. **Menu do site quebrado no desktop** — `.assetsignore` excluía `wp-content/themes/` e os CSS do Astra não eram enviados.  
   *Solução:* Removeu `wp-content/themes` do `.assetsignore` no commit `a0853df`

2. **Botão "CRM SOSSEO" apontava para URL errada** — ia para `sosseo-crm.workers.dev` ao invés de `/painel-leads/`.  
   *Solução:* Corrigido href no `painel-geral/index.html`

3. **Leads duplicados na Entrada** — ID instável causava reentrada.  
   *Solução:* ID estável via `leadId()` + dedup por assinatura (telefone/nome)

4. **Arquivar/Excluir não atualizava na hora** — `closeModal()` zerava `currentLead` antes.  
   *Solução:* Captura `currentLead` antes de `closeModal()`

5. **Leads iam para o fim da coluna ao arquivar**  
   *Solução:* Ordenação por `_ts` decrescente no `render()` (commit `c9551e8`)

## 🧠 FUNCIONALIDADES DO CRM GERAL

- ✅ Login com mesma senha do CRM SOSSEO
- ✅ Arquivar lead → vai para coluna do site (no topo)
- ✅ Excluir → vai para lixeira (retenção 6 meses + rotação mensal)
- ✅ Botão "Ver Excluídos" — tabela estilo Excel com checkbox para retornar
- ✅ "Excluir mês inteiro" na lixeira
- ✅ "Zerar Tudo" — limpa dados locais, mantém sessão
- ✅ Observações por lead
- ✅ Responsivo para celular deitado
- ✅ Botões compactos no painel-leads

## ⚠️ ARQUIVOS MODIFICADOS LOCALMENTE (não commitar)

- `index.html` (raiz) — alterações nas imagens OG
- `painel-leads/app.js` — modificações pendentes do usuário

---

> 🔄 **Para uma nova conversa:** Basta a IA ler este arquivo + os 3 principais (`index.html`, `app.js`, `style.css`) de `painel-geral/` ou `painel-leads/` e já estará 100% contextualizada. O token da Cloudflare está acima se for deploy.