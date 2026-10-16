#!/usr/bin/env node
/**
 * PUBLICADOR AUTOMÁTICO DE ARTIGOS - SOSSEO ESTÁTICO (1 COMANDO)
 *
 * Uso:
 *   node publicar-artigo.mjs ../Artigos/artigo-21-seo-para-ferramentaria-e-injecao-plastica.html
 *   node publicar-artigo.mjs ../Artigos/artigo-22-seo-local-para-oficina-de-funilaria-e-pintura.html --categoria=seo-para-empresas
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const SITE_DIR = path.dirname(__filename);
const SITE_ORIGIN = 'https://sosseo.com.br';

const CATEGORY_MAP = {
  'marketing-industrial-b2b': 'Marketing Industrial B2B',
  'seo-para-empresas': 'SEO para empresas',
  'google-perfil-de-empresas': 'Google Perfil de Empresas',
  'google-ads': 'Google Ads',
  'trafego-pago': 'Tráfego Pago',
  'marketing': 'Marketing'
};

function stripTags(str) {
  return (str || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtmlAttr(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseArticleFile(rawHtml) {
  const getMeta = (labelRegex) => {
    const m = rawHtml.match(new RegExp(`<li>\\s*<strong>[^<]*${labelRegex}[^<]*<\\/strong>\\s*([\\s\\S]*?)<\\/li>`, 'i'));
    return m ? stripTags(m[1]) : '';
  };

  const subtituloBanner = getMeta('subtitulo_banner');
  const palavraChave = getMeta('Palavra-chave Principal');
  const tituloSeo = getMeta('T[íi]tulo SEO');
  const slug = getMeta('Slug\\s*\\/\\s*URL').replace(/^\/+|\/+$/g, '');
  const metaDesc = getMeta('Meta Descri[çc][ãa]o');
  const resumo = getMeta('Resumo\\s*\\(Excerpt\\)');
  const takeaway = getMeta('Conclus[ãa]o Estrat[ée]gica\\s*\\(Takeaway\\)');

  // Extract body after the copy marker or after metadata wrapper
  let bodyHtml = rawHtml;
  const copyMarkerIdx = rawHtml.indexOf('COPIE DAQUI PARA BAIXO');
  if (copyMarkerIdx !== -1) {
    const afterMarker = rawHtml.indexOf('-->', copyMarkerIdx);
    bodyHtml = rawHtml.slice(afterMarker + 3).trim();
  } else {
    const endWrapperIdx = rawHtml.indexOf('</div>\n</div>');
    if (endWrapperIdx !== -1) {
      bodyHtml = rawHtml.slice(endWrapperIdx + 13).trim();
    }
  }

  // Rewrite internal https://sosseo.com.br/... links to ../...
  bodyHtml = bodyHtml.replace(
    /href=["']https:\/\/sosseo\.com\.br\/([^"']*?)["']/gi,
    (_, sub) => `href="../${sub}"`
  );

  // Extract FAQ items (<h3>Question</h3> <p>Answer</p>) from the FAQ section
  const faqs = [];
  const faqHeaderMatch = bodyHtml.match(/<h2[^>]*>[^<]*(?:Perguntas Frequentes|FAQ)[^<]*<\/h2>/i);
  if (faqHeaderMatch) {
    const faqStart = bodyHtml.indexOf(faqHeaderMatch[0]);
    const nextH2Match = bodyHtml.slice(faqStart + faqHeaderMatch[0].length).match(/<h2[^>]*>/i);
    const faqSection = nextH2Match
      ? bodyHtml.slice(faqStart, faqStart + faqHeaderMatch[0].length + nextH2Match.index)
      : bodyHtml.slice(faqStart);

    for (const m of faqSection.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      faqs.push({
        question: stripTags(m[1]),
        answerHtml: m[2].trim(),
        answerText: stripTags(m[2])
      });
    }
  }

  return {
    subtituloBanner,
    palavraChave,
    tituloSeo,
    slug,
    metaDesc,
    resumo,
    takeaway,
    bodyHtml,
    faqs
  };
}

async function detectAndCopyImages(articleFilePath, slug) {
  const baseName = path.basename(articleFilePath);
  const numMatch = baseName.match(/artigo-(\d+)/i);
  const articlesRoot = path.dirname(articleFilePath);
  const uploadRelDir = 'wp-content/uploads/2026/10';
  const uploadFullDir = path.join(SITE_DIR, ...uploadRelDir.split('/'));
  await fs.mkdir(uploadFullDir, { recursive: true });

  const copiedWebp = [];

  if (numMatch) {
    const num = numMatch[1];
    const candidates = [
      path.join(articlesRoot, `Imagens_Artigo_${num}`),
      path.join(articlesRoot, `Imagens_artigo_${num}`),
      path.join(articlesRoot, `Imagens_artigo-${num}`)
    ];
    for (const dir of candidates) {
      if (existsSync(dir)) {
        const files = await fs.readdir(dir);
        const webps = files.filter(f => f.endsWith('.webp') && !f.startsWith('gmn-') && !f.startsWith('linkedin-'));
        for (const w of webps) {
          const destPath = path.join(uploadFullDir, w);
          await fs.copyFile(path.join(dir, w), destPath);
          copiedWebp.push(`${uploadRelDir}/${w}`);
        }
        break;
      }
    }
  }

  return copiedWebp;
}

function buildEnhancedBodyHtml(parsed, images, categorySlug) {
  let body = parsed.bodyHtml;

  // 1. Insert 1st image + 2-column Kadence layout right after the opening 3 paragraphs (before the 2nd H2)
  const h2Matches = [...body.matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/gi)];
  if (images.length > 0 && h2Matches.length >= 2) {
    const secondH2Idx = h2Matches[1].index;
    const img1 = images[0];
    const img1Block = `
<figure class="aligncenter size-large" style="margin: 32px auto; text-align: center;">
  <img fetchpriority="high" decoding="async" width="1024" height="1024" src="../${img1}" alt="${escapeHtmlAttr(parsed.tituloSeo)}" class="kb-img wp-post-image" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,0.12);" />
  <figcaption style="font-size: 14px; color: #475569; margin-top: 10px; font-style: italic;">${escapeHtmlAttr(parsed.tituloSeo)} — Engenharia de Posicionamento Orgânico e GEO (SOSSEO).</figcaption>
</figure>

<div class="kb-row-layout-wrap kb-row-layout-id6762_e827b8-82 alignfull kt-row-has-bg wp-block-kadence-rowlayout"><div class="kt-row-layout-overlay kt-row-overlay-gradient"></div><div class="kt-row-column-wrap kt-has-2-columns kt-row-layout-equal kt-tab-layout-equal kt-mobile-layout-row kt-row-valign-middle kb-theme-content-width">
<div class="wp-block-kadence-column kadence-column6762_80c05c-b7 inner-column-1"><div class="kt-inside-inner-col">
<p class="kt-adv-heading6762_d4f9da-59 wp-block-kadence-advancedheading" data-kb-block="kb-adv-heading6762_d4f9da-59">SITES Otimizados Para <mark style="background-color:rgba(0, 0, 0, 0);color:#fcb900" class="has-inline-color">APARECER no GOOGLE</mark> </p>
<p class="kt-adv-heading6762_1af651-4e wp-block-kadence-advancedheading" data-kb-block="kb-adv-heading6762_1af651-4e"><em>${categorySlug === 'marketing-industrial-b2b' ? 'Sua fábrica pronta para homologação no Google: conheça nossa assessoria de SEO Industrial B2B' : 'Sua empresa no topo do Google Maps e das IAs: conheça nossa assessoria de SEO e Posicionamento'}</em></p>
<div class="wp-block-kadence-advancedbtn kb-buttons-wrap kb-btns6762_f819f7-ef"><a class="kb-button kt-button button kb-btn6762_77dcf1-3e kt-btn-size-small kt-btn-width-type-auto kb-btn-global-fill kt-btn-has-text-true kt-btn-has-svg-false wp-block-kadence-singlebtn" href="https://api.whatsapp.com/send?1=pt_BR&amp;phone=5511974695663" target="_blank" rel="noreferrer noopener"><span class="kt-btn-inner-text">Só Chamar WhatsApp<br>para uma Consultoria</span></a></div>
</div></div>
<div class="wp-block-kadence-column kadence-column6762_2016b6-69 inner-column-2"><div class="kt-inside-inner-col">
<div class="wp-block-kadence-image kb-image6762_9a5a71-cd"><figure class="aligncenter size-full"><img decoding="async" width="1024" height="1024" src="../wp-content/uploads/2026/09/Gestao-Google-Perfil-Empresa-Industria.webp" alt="Consultoria de SEO e Posicionamento no Google SOSSEO" class="kb-img wp-image-6480" /></figure></div>
</div></div>
</div></div>
`;
    body = body.slice(0, secondH2Idx) + img1Block + '\n' + body.slice(secondH2Idx);
  }

  // 2. Insert 2nd image before the 3rd or 4th H2 if available
  const updatedH2Matches = [...body.matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/gi)];
  if (images.length > 1 && updatedH2Matches.length >= 3) {
    const thirdH2Idx = updatedH2Matches[2].index;
    const img2 = images[1];
    const img2Block = `
<figure class="aligncenter size-large" style="margin: 32px auto; text-align: center;">
  <img loading="lazy" decoding="async" width="1024" height="1024" src="../${img2}" alt="${escapeHtmlAttr(parsed.palavraChave || parsed.tituloSeo)}" class="kb-img" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,0.12);" />
  <figcaption style="font-size: 14px; color: #475569; margin-top: 10px; font-style: italic;">Arquitetura de autoridade técnica para captação de demanda qualificada no Google e nas IAs.</figcaption>
</figure>
`;
    body = body.slice(0, thirdH2Idx) + img2Block + '\n' + body.slice(thirdH2Idx);
  }

  // 3. Append the Dark Takeaway Card (⚡ Conclusão Estratégica) if takeaway metadata exists
  if (parsed.takeaway) {
    const targetLink = categorySlug === 'marketing-industrial-b2b'
      ? '../posicionamento-industrial-b2b/'
      : '../contato/';
    const targetLabel = categorySlug === 'marketing-industrial-b2b'
      ? 'Posicionamento Industrial B2B'
      : 'Consultoria de SEO Local e Posicionamento';

    const takeawayCard = `
<div class="wp-block-kadence-column kadence-column6762_79c69b-fa kb-section-has-overlay" style="margin-top: 35px; margin-bottom: 35px;"><div class="kt-inside-inner-col">
<h3 class="kt-adv-heading6762_2681d2-59 wp-block-kadence-advancedheading has-ast-global-color-5-color has-text-color" data-kb-block="kb-adv-heading6762_2681d2-59">⚡ <code>Conclusão Estratégica (Takeaway):</code> <strong>${escapeHtmlAttr(parsed.tituloSeo)}</strong></h3>
<p class="has-ast-global-color-5-color has-text-color has-link-color wp-elements-8 wp-block-paragraph">${parsed.takeaway}</p>
<hr class="wp-block-separator has-text-color has-white-color has-alpha-channel-opacity has-white-background-color has-background"/>
<p class="has-luminous-vivid-amber-color has-text-color has-link-color wp-elements-11 wp-block-paragraph" style="font-size:20px;line-height:1.6">👉 Descubra como estruturamos o posicionamento técnico da sua empresa no Google e nas IAs para atrair clientes e contratos de alto valor agregado.<br><a href="${targetLink}">${targetLabel}</a></p>
</div></div>
`;
    body += '\n' + takeawayCard;
  }

  return body;
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find(a => !a.startsWith('--'));
  if (!fileArg) {
    console.error('Uso: node publicar-artigo.mjs <caminho-do-artigo.html> [--categoria=slug-da-categoria] [--imagem=caminho/img.webp]');
    process.exit(1);
  }

  const articlePath = path.resolve(process.cwd(), fileArg);
  const rawArticleHtml = await fs.readFile(articlePath, 'utf8');
  const parsed = parseArticleFile(rawArticleHtml);

  if (!parsed.slug || !parsed.tituloSeo) {
    throw new Error('Não foi possível extrair Slug / URL ou Título SEO dos metadados do arquivo: ' + articlePath);
  }

  // Determine category
  const catArg = args.find(a => a.startsWith('--categoria='));
  let categorySlug = catArg ? catArg.split('=')[1].trim() : '';
  if (!categorySlug) {
    if (parsed.slug.includes('oficina') || parsed.slug.includes('funilaria') || parsed.slug.includes('local')) {
      categorySlug = 'seo-para-empresas';
    } else {
      categorySlug = 'marketing-industrial-b2b';
    }
  }
  const categoryName = CATEGORY_MAP[categorySlug] || 'Marketing Industrial B2B';

  // Detect and copy images
  const autoImages = await detectAndCopyImages(articlePath, parsed.slug);
  const imgArg = args.find(a => a.startsWith('--imagem='));
  if (imgArg) {
    const customImg = imgArg.split('=')[1].trim();
    const fileName = path.basename(customImg);
    const destRel = `wp-content/uploads/2026/10/${fileName}`;
    await fs.copyFile(path.resolve(process.cwd(), customImg), path.join(SITE_DIR, ...destRel.split('/')));
    autoImages.unshift(destRel);
  }

  const featuredImageRel = autoImages[0] || 'wp-content/uploads/2026/10/tryout-molde-injecao-plastica-precisao-quadrada-1x1-1.webp';
  const featuredImageAbs = `${SITE_ORIGIN}/${featuredImageRel}`;

  // Load master post template (como-vender-usinagem-sem-guerra-de-precos/index.html)
  const templatePath = path.join(SITE_DIR, 'como-vender-usinagem-sem-guerra-de-precos', 'index.html');
  let html = await fs.readFile(templatePath, 'utf8');

  const nowIso = new Date().toISOString();
  const nowBr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const canonicalUrl = `${SITE_ORIGIN}/${parsed.slug}/`;

  // 1. Update <title>, meta description, canonical, OG & Twitter tags
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${parsed.tituloSeo}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${escapeHtmlAttr(parsed.metaDesc || parsed.resumo)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${escapeHtmlAttr(parsed.tituloSeo)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${escapeHtmlAttr(parsed.metaDesc || parsed.resumo)}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${featuredImageAbs}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/i, `<meta name="twitter:image" content="${featuredImageAbs}" />`);

  // 2. Update Yoast JSON-LD Schema with Article + FAQPage
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        isPartOf: { '@id': canonicalUrl },
        author: { name: 'SOSSEO', '@id': `${SITE_ORIGIN}/#/schema/person/43b30dfe0333fa7eb0fc1fe1eb6f0fa5` },
        headline: parsed.tituloSeo,
        datePublished: nowIso,
        dateModified: nowIso,
        mainEntityOfPage: { '@id': canonicalUrl },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        image: { '@id': `${canonicalUrl}#primaryimage` },
        thumbnailUrl: featuredImageAbs,
        articleSection: [categoryName],
        inLanguage: 'pt-BR'
      },
      {
        '@type': parsed.faqs.length > 0 ? ['WebPage', 'FAQPage'] : 'WebPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: parsed.tituloSeo,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        primaryImageOfPage: { '@id': `${canonicalUrl}#primaryimage` },
        image: { '@id': `${canonicalUrl}#primaryimage` },
        thumbnailUrl: featuredImageAbs,
        datePublished: nowIso,
        dateModified: nowIso,
        description: parsed.metaDesc || parsed.resumo,
        breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
        inLanguage: 'pt-BR',
        ...(parsed.faqs.length > 0
          ? {
              mainEntity: parsed.faqs.map((f, idx) => ({
                '@type': 'Question',
                '@id': `${canonicalUrl}#faq-question-${idx + 1}`,
                position: idx + 1,
                url: `${canonicalUrl}#faq-question-${idx + 1}`,
                name: f.question,
                answerCount: 1,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answerText,
                  inLanguage: 'pt-BR'
                }
              }))
            }
          : {})
      },
      {
        '@type': 'ImageObject',
        inLanguage: 'pt-BR',
        '@id': `${canonicalUrl}#primaryimage`,
        url: featuredImageAbs,
        contentUrl: featuredImageAbs,
        width: 1024,
        height: 1024,
        caption: parsed.tituloSeo
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: parsed.tituloSeo }
        ]
      }
    ]
  };

  html = html.replace(
    /<script type="application\/ld\+json" class="yoast-schema-graph">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" class="yoast-schema-graph">${JSON.stringify(schemaGraph)}</script>`
  );

  // 3. Build the <article> inner HTML preserving the Hero Banner and the SOSSEO/Reinaldo Author Footer
  const enhancedBody = buildEnhancedBodyHtml(parsed, autoImages, categorySlug);

  // Extract the SOSSEO Info Box + Reinaldo Footer from template
  const infoBoxMarker = '<div class="wp-block-kadence-infobox kt-info-box3307_aa9b4f-d9">';
  const infoBoxStart = html.indexOf(infoBoxMarker);
  const articleEnd = html.indexOf('</article>', infoBoxStart);
  const authorFooterHtml = html.slice(infoBoxStart, articleEnd);

  const newArticleHtml = `<article class="post-static post type-post status-publish format-standard has-post-thumbnail hentry category-${categorySlug} ast-article-single" id="post-static">
<div class="ast-post-format- single-layout-1">
<div class="entry-content clear" data-ast-blocks-layout="true">

<div class="kb-row-layout-wrap kb-row-layout-id2708_86d4b4-e1 alignfull kt-row-has-bg wp-block-kadence-rowlayout"><div class="kt-row-column-wrap kt-has-1-columns kt-row-layout-equal kt-tab-layout-inherit kt-mobile-layout-row kt-row-valign-middle">
<div class="wp-block-kadence-column kadence-column2708_0954c2-af"><div class="kt-inside-inner-col">
<h1 style="font-size:29px;padding-right:0;padding-left:0;margin-right:0;margin-left:0" class="has-text-align-center has-link-color alignfull float-title titulo-responsivo wp-elements-1 wp-block-post-title has-text-color has-ast-global-color-5-color">${parsed.tituloSeo}</h1>

<p class="has-luminous-vivid-amber-color has-text-color has-link-color wp-elements-2 wp-block-paragraph" style="font-size:18px">${parsed.subtituloBanner}</p>

<div class="wp-block-group is-layout-flex wp-container-core-group-is-layout-f2270523 wp-block-group-is-layout-flex" style="margin-top:0;margin-bottom:0;padding-right:0;padding-bottom:var(--wp--preset--spacing--30);padding-left:0">
<ul class="wp-block-list">
<li class="has-ast-global-color-5-color has-text-color has-link-color wp-elements-3" style="font-size:14px"> Atualizado em</li>
</ul>
<div style="font-size:14px" class="has-link-color wp-block-post-date__modified-date wp-elements-4 wp-block-post-date has-text-color has-ast-global-color-5-color"><time datetime="${nowIso}">${nowBr}</time></div>
<div class="wp-block-group is-nowrap is-layout-flex wp-container-core-group-is-layout-93c9d35e wp-block-group-is-layout-flex" style="margin-top:0;margin-bottom:0;padding-right:0;padding-left:0">
<p class="has-ast-global-color-5-color has-text-color has-link-color wp-elements-5 wp-block-paragraph" style="font-size:14px">&#8211; Por</p>
<div style="font-size:14px" class="has-link-color wp-elements-6 wp-block-post-author-name has-text-color has-ast-global-color-5-color">SOSSEO</div></div>
<div style="font-size:14px" class="taxonomy-category has-link-color wp-elements-7 wp-block-post-terms has-text-color has-ast-global-color-4-color"><span class="wp-block-post-terms__prefix">/  Categoria &#8211;   </span><a href="../category/${categorySlug}/" rel="tag">${categoryName}</a></div></div>
</div></div>
</div></div>

${enhancedBody}

${authorFooterHtml}</article>`;

  const origArticleStart = html.indexOf('<article');
  const origArticleEnd = html.indexOf('</article>', origArticleStart) + 10;
  html = html.slice(0, origArticleStart) + newArticleHtml + html.slice(origArticleEnd);

  // 4. Write sosseo-site/<slug>/index.html
  const postOutDir = path.join(SITE_DIR, parsed.slug);
  await fs.mkdir(postOutDir, { recursive: true });
  await fs.writeFile(path.join(postOutDir, 'index.html'), html, 'utf8');
  console.log(`✅ Artigo gerado com sucesso: sosseo-site/${parsed.slug}/index.html`);

  // 5. Update Category Archive Page (sosseo-site/category/<categorySlug>/index.html)
  const catFilePath = path.join(SITE_DIR, 'category', categorySlug, 'index.html');
  if (existsSync(catFilePath)) {
    let catHtml = await fs.readFile(catFilePath, 'utf8');
    if (!catHtml.includes(`href="../../${parsed.slug}/"`)) {
      const cardHtml = `<article class="post-static post type-post status-publish format-standard has-post-thumbnail hentry category-${categorySlug} ast-grid-common-col ast-full-width ast-article-post remove-featured-img-padding">
	<div class="ast-post-format- blog-layout-4 ast-article-inner">
	<div class="post-content ast-grid-common-col">
		<div class="ast-blog-featured-section post-thumb ast-blog-single-element"><div class="post-thumb-img-content post-thumb"><a href="../../${parsed.slug}/" aria-label="Read: ${escapeHtmlAttr(parsed.tituloSeo)}"><img loading="lazy" width="1024" height="1024" src="../../${featuredImageRel}" class="attachment-large size-large wp-post-image" alt="${escapeHtmlAttr(parsed.tituloSeo)}" decoding="async" /></a></div></div>
		<h2 class="entry-title ast-blog-single-element"><a href="../../${parsed.slug}/" rel="bookmark">${parsed.tituloSeo}</a></h2>
		<header class="entry-header ast-blog-single-element ast-blog-meta-container">
			<div class="entry-meta"><span class="ast-taxonomy-container cat-links default"><a href="../../category/${categorySlug}/" rel="category tag">${categoryName}</a></span> / <span class="posted-by vcard author"><a title="Ver todos os posts de SOSSEO" href="../../author/ivessosseo/" rel="author" class="url fn n"><span class="author-name">SOSSEO</span></a></span></div>
		</header>
		<div class="ast-excerpt-container ast-blog-single-element">
			<p>${parsed.resumo || parsed.metaDesc}</p>
		</div>
		<div class="entry-content clear"></div>
	</div>
</div>
</article>`;
      catHtml = catHtml.replace('<div class="ast-row">', `<div class="ast-row">${cardHtml}`);
      await fs.writeFile(catFilePath, catHtml, 'utf8');
      console.log(`✅ Card adicionado na categoria: category/${categorySlug}/index.html`);
    } else {
      console.log(`ℹ️ Card já presente na categoria: category/${categorySlug}/index.html`);
    }
  }

  // 6. Update post-sitemap.xml & sitemap.xml
  for (const smName of ['post-sitemap.xml', 'sitemap.xml']) {
    const smPath = path.join(SITE_DIR, smName);
    if (existsSync(smPath)) {
      let sm = await fs.readFile(smPath, 'utf8');
      if (!sm.includes(`<loc>${canonicalUrl}</loc>`)) {
        const entry = `  <url>\n    <loc>${canonicalUrl}</loc>\n    <lastmod>${nowIso}</lastmod>\n  </url>\n</urlset>`;
        sm = sm.replace('</urlset>', entry);
        await fs.writeFile(smPath, sm, 'utf8');
        console.log(`✅ Sitemap atualizado: ${smName}`);
      }
    }
  }

  // 7. Update llms.txt & llms-full.txt
  const llmsPath = path.join(SITE_DIR, 'llms.txt');
  if (existsSync(llmsPath)) {
    let llms = await fs.readFile(llmsPath, 'utf8');
    if (!llms.includes(canonicalUrl)) {
      const bullet = `- [${parsed.tituloSeo}](${canonicalUrl}): ${parsed.metaDesc || parsed.resumo}\n`;
      llms = llms.replace('## Artigos Técnicos e Guias de Engenharia de Demanda\n', `## Artigos Técnicos e Guias de Engenharia de Demanda\n${bullet}`);
      await fs.writeFile(llmsPath, llms, 'utf8');
      console.log('✅ llms.txt atualizado!');
    }
  }

  const llmsFullPath = path.join(SITE_DIR, 'llms-full.txt');
  if (existsSync(llmsFullPath)) {
    let llmsFull = await fs.readFile(llmsFullPath, 'utf8');
    if (!llmsFull.includes(`URL Canônica: ${canonicalUrl}`)) {
      const block = `\n### ${parsed.tituloSeo}\n- **URL Canônica:** ${canonicalUrl}\n- **Síntese Executiva:** ${parsed.metaDesc || parsed.resumo}\n- **Takeaway:** ${parsed.takeaway}\n`;
      llmsFull += block;
      await fs.writeFile(llmsFullPath, llmsFull, 'utf8');
      console.log('✅ llms-full.txt atualizado!');
    }
  }
}

main().catch(err => {
  console.error('❌ Erro ao publicar artigo:', err);
  process.exit(1);
});
