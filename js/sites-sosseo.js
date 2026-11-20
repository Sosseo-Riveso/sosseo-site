/* ==========================================================================
   SOSSEO — Registro central de sites monitorados
   --------------------------------------------------------------------------
   Fonte única para os painéis (/painel-leads/ e /painel-geral/).

   SEGURANÇA
   - Nenhum token, senha ou segredo vive neste arquivo (ele é público e vai
     para o deploy). Os tokens de leitura de cada site são digitados pelo
     operador e ficam APENAS no localStorage do navegador, na chave
     `sosseo_site_token_<key>`.
   - `auth`: 'public'  -> endpoint aberto (sem token)
             'bearer'  -> exige `Authorization: Bearer <token>` no GET
             'token'   -> exige `?token=<token>` ou header `x-crm-token`
   - A consulta é somente leitura: o painel nunca grava no site de origem.

   COMO ADICIONAR UM SITE
   1. Inclua um objeto no array abaixo (key única, em kebab-case).
   2. Informe `leadsApi` (endpoint que devolve JSON com { leads: [...] }).
   3. Se o endpoint exigir token, use auth 'bearer' ou 'token'.
   ========================================================================== */

window.SOSSEO_SITES = [
  {
    key: 'cambio-campinas',
    nome: 'Câmbio Automático Campinas',
    abrev: 'Câmbio Campinas',
    segmento: 'Centro técnico de transmissões',
    dominio: 'cambioautomaticocampinas.com.br',
    siteUrl: 'https://cambioautomaticocampinas.com.br/',
    painelUrl: '',
    leadsApi: 'https://cambioautomaticocampinas.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'cambio-osasco',
    nome: 'Câmbio Automático Osasco',
    abrev: 'Câmbio Osasco',
    segmento: 'Centro técnico de transmissões',
    dominio: 'cambioautomaticoosasco.com.br',
    siteUrl: 'https://cambioautomaticoosasco.com.br/',
    painelUrl: '',
    leadsApi: 'https://cambioautomaticoosasco.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'cambio-piracicaba',
    nome: 'Câmbio Automático Piracicaba',
    abrev: 'Câmbio Piracicaba',
    segmento: 'Centro técnico de transmissões',
    dominio: 'cambioautomaticopiracicaba.com.br',
    siteUrl: 'https://cambioautomaticopiracicaba.com.br/',
    painelUrl: 'https://cambioautomaticopiracicaba.com.br/painel-leads.html',
    leadsApi: 'https://cambioautomaticopiracicaba.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'baden',
    nome: 'Baden Rodas e Pneus',
    abrev: 'Baden Pneus',
    segmento: 'Centro automotivo (2 unidades em Campinas)',
    dominio: 'badenrodasepneus.com.br',
    siteUrl: 'https://badenrodasepneus.com.br/',
    painelUrl: 'https://badenrodasepneus.com.br/painel-leads.html',
    leadsApi: 'https://badenrodasepneus.com.br/api/lead',
    auth: 'token'
  },
  {
    key: 'mecanica-campinas',
    nome: 'Mecânica Campinas',
    abrev: 'Mecânica Campinas',
    segmento: 'Oficina mecânica',
    dominio: 'mecanicacampinas.com.br',
    siteUrl: 'https://mecanicacampinas.com.br/',
    painelUrl: '',
    leadsApi: 'https://mecanicacampinas.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'mecanica-osasco',
    nome: 'Mecânica Osasco',
    abrev: 'Mecânica Osasco',
    segmento: 'Oficina mecânica',
    dominio: 'mecanicaosasco.com.br',
    siteUrl: 'https://mecanicaosasco.com.br/',
    painelUrl: '',
    leadsApi: 'https://mecanicaosasco.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'fgcar',
    nome: 'FG Car Funilaria e Pintura',
    abrev: 'FG Car Osasco',
    segmento: 'Funilaria e pintura',
    dominio: 'funilariaosasco.com.br',
    siteUrl: 'https://funilariaosasco.com.br/',
    painelUrl: '',
    leadsApi: 'https://sosseo-crm.sosseosites.workers.dev/api/fgcar-leads',
    auth: 'public'
  },
  {
    key: 'portal-molde',
    nome: 'Portal Molde Injeção',
    abrev: 'Portal Molde Injeção',
    segmento: 'Indústria B2B (moldes e injeção plástica)',
    dominio: 'portalmoldeinjecao.com.br',
    siteUrl: 'https://portalmoldeinjecao.com.br/',
    painelUrl: '',
    leadsApi: 'https://portalmoldeinjecao.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'psicanalise',
    nome: 'Psicanálise Alma e Luz',
    abrev: 'Psi Alma e Luz',
    segmento: 'Saúde e terapia online',
    dominio: 'psicanalisealmaeluz.com.br',
    siteUrl: 'https://psicanalisealmaeluz.com.br/',
    painelUrl: '',
    leadsApi: 'https://psicanalisealmaeluz.com.br/api/triagem',
    auth: 'bearer'
  },
  {
    key: 'sosseo',
    nome: 'SOSSEO (Agência)',
    abrev: 'SOSSEO',
    segmento: 'Agência — sosseo.com.br',
    dominio: 'sosseo.com.br',
    siteUrl: 'https://sosseo.com.br/',
    painelUrl: 'https://sosseo.com.br/painel-leads/',
    leadsApi: 'https://sosseo-crm.sosseosites.workers.dev/api/leads',
    auth: 'public'
  }
];
