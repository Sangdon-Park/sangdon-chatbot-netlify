const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { getCachedEmbedding, setCachedEmbedding } = require('./embeddings-cache');
const {
  SITE_PROFILE,
  SITE_LINKS,
  COURSES_2026_SPRING,
  NEWS_POSTS,
  PUBLICATION_STATS,
  PUBLICATIONS
} = require('./knowledge-base');

const GEMINI_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_HISTORY = 10;
const MAX_RESULTS = 5;
const MAX_RETRIEVED = 6;

function tr(lang, ko, en) {
  return lang === 'ko' ? ko : en;
}

function containsHangul(text = '') {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(String(text));
}

function detectLanguage(message = '', history = []) {
  if (containsHangul(message)) return 'ko';
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (containsHangul(history[i]?.content || '')) return 'ko';
  }
  return 'en';
}

function normalize(text = '') {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeForMatch(text = '') {
  return normalize(text).replace(/[^a-z0-9가-힣\s]/g, ' ');
}

function tokenize(text = '') {
  return normalizeForMatch(text)
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => v.length > 1);
}

function isGreeting(message = '') {
  const compact = normalize(message).replace(/\s+/g, '');
  if (!compact) return false;
  if (/^(hello|hi|hey|goodmorning|goodafternoon|goodevening)$/i.test(compact)) return true;
  if (/^(g2|h2|yo|yoo|hii+)$/i.test(compact)) return true;
  if (/^(안녕|안녕하세요|ㅎㅇ|하이|헬로)$/.test(compact)) return true;
  if (/^ㅎ+[a-z0-9]*$/.test(compact)) return true;
  if (/^안녕[a-z0-9]*$/.test(compact)) return true;
  return false;
}

function isPublicationIntent(text = '') {
  return /(논문|저널|학술|publication|paper|journal|doi|ieee|scholar)/i.test(text);
}

function isCourseIntent(text = '') {
  return /(수업|강의|과목|가르치|이번\s*학기|course|class|lecture|teach|teaching|database|db|capstone|ai)/i.test(text);
}

function isContactIntent(text = '') {
  return /(연락|이메일|문의|메일|email|contact|reach)/i.test(text);
}

function isProfileIntent(text = '') {
  return /(누구|소개|약력|학력|경력|소속|직위|연구|무슨\s*일|who are you|profile|bio|about|cv)/i.test(text);
}

function isProjectIntent(text = '') {
  return /(hexagon|steam|project|프로젝트|게임|game)/i.test(text);
}

function isCountIntent(text = '') {
  return /(몇|개수|총|편|건|횟수|how many|count|number of)/i.test(text);
}

function isLatestIntent(text = '') {
  return /(최근|최신|근래|latest|recent|newest)/i.test(text);
}

function isRepresentativeIntent(text = '') {
  return /(대표|핵심|하이라이트|representative|highlight|selected|key)/i.test(text);
}

function isCoauthorIntent(text = '') {
  return /(공동저자|공동연구|같이|coauthor|collaborator|collaboration)/i.test(text);
}

function isMostIntent(text = '') {
  return /(가장|최다|많이|most|top)/i.test(text);
}

function isBeforeThatIntent(text = '') {
  return /(그전|그 전|이전|전에는|before that|before|prior)/i.test(text);
}

function safeHistory(history = []) {
  return Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];
}

function classifyStep1(message, lang) {
  if (isGreeting(message)) {
    return {
      action: 'CHAT',
      query: '',
      initialMessage: tr(lang, '안녕하세요. 무엇을 도와드릴까요?', 'Hello. How can I help you?'),
      needsSecondStep: false
    };
  }

  return {
    action: 'SEARCH',
    query: String(message || '').trim(),
    initialMessage: tr(lang, '질문 확인했습니다. 관련 정보를 찾아보겠습니다.', 'Got it. I will look up relevant information.'),
    needsSecondStep: true
  };
}

function careerTimeline() {
  if (Array.isArray(SITE_PROFILE.careerTimeline) && SITE_PROFILE.careerTimeline.length) {
    return SITE_PROFILE.careerTimeline;
  }
  return [
    {
      period: '2026-03-01 to present',
      role: 'Assistant Professor at Daejeon University'
    },
    {
      period: SITE_PROFILE.formerIndustryPeriod || '2025-05 to 2026-02-28',
      role: SITE_PROFILE.formerIndustryRole || 'Game Developer at Sayberry Games'
    },
    {
      period: SITE_PROFILE.postdocPeriod || '2017-08 to 2025-04',
      role: SITE_PROFILE.postdocRole || 'Postdoctoral Researcher at KAIST Institute for Information Technology Convergence'
    }
  ];
}

function buildDocs() {
  const docs = [];
  const timeline = careerTimeline();

  docs.push({
    id: 'profile',
    type: 'profile',
    title: `${SITE_PROFILE.nameKo} (${SITE_PROFILE.nameEn})`,
    text: `${SITE_PROFILE.nameKo} 교수는 ${SITE_PROFILE.appointmentDate}부터 ${SITE_PROFILE.affiliationKo} 조교수입니다. 공식 이메일은 ${SITE_PROFILE.email}입니다.`,
    url: SITE_LINKS.aboutKo,
    year: 2026
  });

  timeline.forEach((item, idx) => {
    docs.push({
      id: `career-${idx}`,
      type: 'career',
      title: `Career: ${item.period}`,
      text: `${item.period}: ${item.role}`,
      url: SITE_LINKS.aboutKo,
      year: Number(String(item.period).slice(0, 4)) || 0
    });
  });

  docs.push({
    id: 'publication-stats',
    type: 'publication_stats',
    title: 'Publication Stats',
    text: `Google Scholar(${SITE_PROFILE.scholarId}) ${PUBLICATION_STATS.sourceDate} sync: works ${PUBLICATION_STATS.scholarWorks}, cited by ${PUBLICATION_STATS.citedBy}. Homepage categories: journals ${PUBLICATION_STATS.journals}, conferences ${PUBLICATION_STATS.conferences}, standards ${PUBLICATION_STATS.standards}, patents ${PUBLICATION_STATS.patents}.`,
    url: SITE_LINKS.publications,
    year: 2026
  });

  for (const c of COURSES_2026_SPRING || []) {
    docs.push({
      id: `course-${c.code}`,
      type: 'course',
      title: `${c.titleKo} (${c.titleEn})`,
      text: `2026 Spring course: ${c.titleKo} (${c.titleEn}). Page: ${c.pageKo}`,
      url: c.pageKo,
      year: 2026
    });
  }

  for (const post of NEWS_POSTS || []) {
    docs.push({
      id: `news-${post.date}`,
      type: 'news',
      title: post.title,
      text: `${post.title} (${post.date}): ${post.summary}`,
      url: post.url,
      year: Number(String(post.date || '').slice(0, 4)) || 0
    });
  }

  for (const p of PUBLICATIONS || []) {
    docs.push({
      id: `pub-${p.year}-${(p.title || '').slice(0, 40)}`,
      type: 'publication',
      title: p.title,
      text: `Title: ${p.title}. Journal: ${p.journal}. Year: ${p.year}. Authors: ${(p.authors || []).join(', ')}. DOI: ${p.doi || 'N/A'}.`,
      url: p.doi || SITE_LINKS.publications,
      year: p.year || 0,
      journal: p.journal || ''
    });
  }

  docs.push({
    id: 'project',
    type: 'project',
    title: SITE_PROFILE.currentProject,
    text: `${SITE_PROFILE.currentProject}. Link: ${SITE_PROFILE.currentProjectUrl}`,
    url: SITE_PROFILE.currentProjectUrl,
    year: 2026
  });

  docs.push({
    id: 'contact',
    type: 'contact',
    title: 'Contact & Collaboration',
    text: `Email: ${SITE_PROFILE.email}. Collaboration page: ${SITE_LINKS.collaborationKo}`,
    url: SITE_LINKS.collaborationKo,
    year: 2026
  });

  return docs;
}

const DOCS = buildDocs();

function lexicalScore(query, doc) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const hay = normalizeForMatch(`${doc.title} ${doc.text}`);
  let score = 0;
  for (const tk of qTokens) {
    if (hay.includes(tk)) score += tk.length >= 5 ? 2 : 1;
  }
  return score;
}

async function getEmbedding(text, apiKey, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!text || !apiKey) return null;
  const cacheKey = `${taskType}:${text}`;
  const cached = getCachedEmbedding(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const emb = data?.embedding?.values || null;
    if (emb) setCachedEmbedding(cacheKey, emb);
    return emb;
  } catch (error) {
    console.error('embedding error:', error);
    return null;
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function retrieve(query, apiKey) {
  const ranked = DOCS
    .map((doc) => ({ doc, lexical: lexicalScore(query, doc) }))
    .sort((a, b) => b.lexical - a.lexical || (b.doc.year || 0) - (a.doc.year || 0));

  let candidates = ranked.filter((r) => r.lexical > 0).slice(0, 18);
  if (!candidates.length) {
    candidates = isPublicationIntent(query)
      ? ranked.filter((r) => r.doc.type === 'publication').slice(0, 18)
      : ranked.slice(0, 18);
  }

  const lexicalTop = candidates.slice(0, MAX_RETRIEVED).map((r, idx) => ({
    doc: r.doc,
    score: (MAX_RETRIEVED - idx) / MAX_RETRIEVED
  }));

  if (!apiKey) return lexicalTop;
  const qEmb = await getEmbedding(query, apiKey, 'RETRIEVAL_QUERY');
  if (!qEmb) return lexicalTop;

  const maxLex = Math.max(...candidates.map((c) => c.lexical), 1);
  const rescored = await Promise.all(candidates.map(async (item) => {
    const dEmb = await getEmbedding(item.doc.text, apiKey, 'RETRIEVAL_DOCUMENT');
    const lexicalNorm = item.lexical / maxLex;
    if (!dEmb) return { doc: item.doc, score: lexicalNorm * 0.2 };
    const sim = cosineSimilarity(qEmb, dEmb);
    return { doc: item.doc, score: (0.82 * sim) + (0.18 * lexicalNorm) };
  }));

  return rescored.sort((a, b) => b.score - a.score).slice(0, MAX_RETRIEVED);
}

function formatSearchTitle(doc) {
  if (doc.type === 'publication') {
    return `${doc.title} (${doc.year})${doc.journal ? ` - ${doc.journal}` : ''}`;
  }
  return doc.title;
}

function buildSearchPayload(entries = []) {
  const sliced = entries.slice(0, MAX_RESULTS).map((e) => ({
    type: e.doc?.type || e.type || 'result',
    title: formatSearchTitle(e.doc || e),
    url: e.doc?.url || e.url || null,
    score: typeof e.score === 'number' ? Number(e.score.toFixed(3)) : null
  }));

  return {
    searchResults: sliced.length ? sliced.map((r) => r.title) : null,
    searchResultsDetailed: sliced.length ? sliced.map((r) => ({
      type: r.type,
      item: { title: r.title, url: r.url, score: r.score }
    })) : null
  };
}

function findPublication(query = '') {
  const qTokens = tokenize(query);
  if (!qTokens.length) return null;
  let best = null;
  for (const p of PUBLICATIONS || []) {
    const hay = normalizeForMatch(`${p.title} ${p.journal} ${p.year}`);
    let score = 0;
    for (const tk of qTokens) if (hay.includes(tk)) score += 1;
    if (normalizeForMatch(p.title).includes(normalizeForMatch(query))) score += 6;
    if (!best || score > best.score) best = { p, score };
  }
  return best && best.score >= 3 ? best.p : null;
}

function coauthorTop() {
  const self = new Set([normalize(SITE_PROFILE.nameEn), normalize(SITE_PROFILE.nameKo), normalize('sangdon park')]);
  const map = new Map();
  for (const p of PUBLICATIONS || []) {
    for (const author of p.authors || []) {
      const n = normalize(author);
      if (!n || self.has(n)) continue;
      map.set(author, (map.get(author) || 0) + 1);
    }
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function deterministic(message, lang, history = []) {
  const msg = String(message || '');
  const timeline = careerTimeline();
  const timelineDocs = timeline.map((item, idx) => ({
    type: 'career',
    title: `${item.period}: ${item.role}`,
    url: SITE_LINKS.aboutKo,
    score: 1 - idx * 0.1
  }));

  if (isContactIntent(msg)) {
    return {
      reply: tr(lang, `문의 이메일은 ${SITE_PROFILE.email}입니다.`, `Contact email: ${SITE_PROFILE.email}.`),
      docs: [{ type: 'contact', title: 'Contact & Collaboration', url: SITE_LINKS.collaborationKo, score: 1 }]
    };
  }

  if (isCourseIntent(msg)) {
    const listKo = (COURSES_2026_SPRING || []).map((c) => c.titleKo).join(', ');
    const listEn = (COURSES_2026_SPRING || []).map((c) => c.titleEn).join(', ');
    return {
      reply: tr(
        lang,
        `이번 학기 담당 과목은 ${listKo}입니다. 과목 허브: ${SITE_LINKS.coursesHubKo}`,
        `Courses this semester are ${listEn}. Course hub: ${SITE_LINKS.coursesHubEn}`
      ),
      docs: (COURSES_2026_SPRING || []).map((c, i) => ({
        type: 'course',
        title: `${c.titleKo} (${c.titleEn})`,
        url: c.pageKo,
        score: 1 - i * 0.1
      }))
    };
  }

  if (isPublicationIntent(msg) && isCountIntent(msg)) {
    return {
      reply: tr(
        lang,
        `홈페이지 기준 국제저널 ${PUBLICATION_STATS.journals}편, 국제학회 ${PUBLICATION_STATS.conferences}편, ITU-T 표준 ${PUBLICATION_STATS.standards}건, 특허 ${PUBLICATION_STATS.patents}건입니다. Google Scholar(${PUBLICATION_STATS.sourceDate}) 기준 works ${PUBLICATION_STATS.scholarWorks}, cited by ${PUBLICATION_STATS.citedBy}입니다.`,
        `Homepage stats: ${PUBLICATION_STATS.journals} journals, ${PUBLICATION_STATS.conferences} conferences, ${PUBLICATION_STATS.standards} ITU-T standards, ${PUBLICATION_STATS.patents} patents. Google Scholar (${PUBLICATION_STATS.sourceDate}): works ${PUBLICATION_STATS.scholarWorks}, cited by ${PUBLICATION_STATS.citedBy}.`
      ),
      docs: [{ type: 'publication_stats', title: 'Publication Stats', url: SITE_LINKS.publications, score: 1 }]
    };
  }

  if (isPublicationIntent(msg) && isLatestIntent(msg)) {
    const latest = [...(PUBLICATIONS || [])].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 3);
    const lines = latest.map((p) => `${p.title} (${p.journal}, ${p.year})${p.doi ? `, DOI: ${p.doi}` : ''}`).join('\n');
    return {
      reply: tr(lang, `최근 논문은 다음과 같습니다.\n${lines}`, `Recent papers:\n${lines}`),
      docs: latest.map((p, i) => ({
        type: 'publication',
        title: `${p.title} (${p.year}) - ${p.journal}`,
        url: p.doi || SITE_LINKS.publications,
        score: 1 - i * 0.1
      }))
    };
  }

  if (isPublicationIntent(msg) && isRepresentativeIntent(msg)) {
    const rep = [...(PUBLICATIONS || [])]
      .filter((p) => /IEEE/i.test(p.journal || ''))
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, 3);
    const lines = rep.map((p) => `${p.title} (${p.journal}, ${p.year})${p.doi ? `, DOI: ${p.doi}` : ''}`).join('\n');
    return {
      reply: tr(lang, `대표 실적(IEEE 중심)은 다음과 같습니다.\n${lines}`, `Representative outputs (IEEE-focused):\n${lines}`),
      docs: rep.map((p, i) => ({
        type: 'publication',
        title: `${p.title} (${p.year}) - ${p.journal}`,
        url: p.doi || SITE_LINKS.publications,
        score: 1 - i * 0.1
      }))
    };
  }

  if (isPublicationIntent(msg) && isCoauthorIntent(msg) && isMostIntent(msg)) {
    const top = coauthorTop().slice(0, 3);
    if (top.length) {
      const summary = top.map(([name, cnt]) => `${name} (${cnt})`).join(', ');
      return {
        reply: tr(lang, `공동저자 상위는 ${summary} 입니다.`, `Top coauthors are ${summary}.`),
        docs: top.map(([name, cnt], i) => ({
          type: 'coauthor',
          title: `${name} (${cnt})`,
          url: SITE_LINKS.publications,
          score: 1 - i * 0.1
        }))
      };
    }
  }

  if (isPublicationIntent(msg)) {
    const matched = findPublication(msg);
    if (matched) {
      return {
        reply: tr(
          lang,
          `${matched.title}는 ${matched.year}년 ${matched.journal} 게재 논문입니다.${matched.doi ? ` DOI: ${matched.doi}` : ''}`,
          `${matched.title} was published in ${matched.journal} (${matched.year}).${matched.doi ? ` DOI: ${matched.doi}` : ''}`
        ),
        docs: [{
          type: 'publication',
          title: `${matched.title} (${matched.year}) - ${matched.journal}`,
          url: matched.doi || SITE_LINKS.publications,
          score: 1
        }]
      };
    }
  }

  if (isBeforeThatIntent(msg)) {
    const historyText = normalize((history || []).map((h) => h?.content || '').join(' '));
    const djuHint = /(대전대학교|조교수|assistant professor|daejeon)/i.test(historyText);
    const sayberryHint = /(sayberry|세이베리|game developer|게임 개발)/i.test(historyText);

    if (sayberryHint) {
      return {
        reply: tr(
          lang,
          `${SITE_PROFILE.formerIndustryPeriod} 이전에는 ${SITE_PROFILE.postdocPeriod} 동안 ${SITE_PROFILE.postdocRole}로 근무했습니다.`,
          `Before ${SITE_PROFILE.formerIndustryPeriod}, he worked as ${SITE_PROFILE.postdocRole} during ${SITE_PROFILE.postdocPeriod}.`
        ),
        docs: timelineDocs
      };
    }

    if (djuHint) {
      return {
        reply: tr(
          lang,
          `대전대학교 부임 직전에는 ${SITE_PROFILE.formerIndustryPeriod} 동안 ${SITE_PROFILE.formerIndustryRole}로 근무했습니다.`,
          `Right before joining Daejeon University, he worked as ${SITE_PROFILE.formerIndustryRole} during ${SITE_PROFILE.formerIndustryPeriod}.`
        ),
        docs: timelineDocs
      };
    }
  }

  if (/(경력|career|포닥|postdoc|kaist|정보전자연구소)/i.test(msg)) {
    const linesKo = timeline.map((item) => `- ${item.period}: ${item.role}`).join('\n');
    const linesEn = timeline.map((item) => `- ${item.period}: ${item.role}`).join('\n');
    return {
      reply: tr(lang, `주요 경력은 다음과 같습니다.\n${linesKo}`, `Career timeline:\n${linesEn}`),
      docs: timelineDocs
    };
  }

  if (isProjectIntent(msg)) {
    return {
      reply: tr(lang, `현재 1인 개발 프로젝트는 Hexagon Soup이며 링크는 ${SITE_PROFILE.currentProjectUrl}입니다.`, `Current solo project is Hexagon Soup. Link: ${SITE_PROFILE.currentProjectUrl}`),
      docs: [{ type: 'project', title: SITE_PROFILE.currentProject, url: SITE_PROFILE.currentProjectUrl, score: 1 }]
    };
  }

  if (isProfileIntent(msg)) {
    return {
      reply: tr(lang, `${SITE_PROFILE.nameKo} 교수는 ${SITE_PROFILE.appointmentDate}부터 ${SITE_PROFILE.affiliationKo} 조교수로 재직 중입니다.`, `${SITE_PROFILE.nameEn} has been Assistant Professor at ${SITE_PROFILE.affiliationEn} since ${SITE_PROFILE.appointmentDate}.`),
      docs: [{ type: 'profile', title: `${SITE_PROFILE.nameKo} (${SITE_PROFILE.nameEn})`, url: SITE_LINKS.aboutKo, score: 1 }]
    };
  }

  return null;
}

function buildPrompt(message, history, retrieved, lang) {
  const recent = safeHistory(history)
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const context = (retrieved || []).map((r, i) => {
    const doc = r.doc || r;
    return `[${i + 1}] type=${doc.type}\ntitle=${doc.title}\nurl=${doc.url || 'N/A'}\ntext=${doc.text}`;
  }).join('\n\n');

  return [
    `You are the official homepage assistant for ${SITE_PROFILE.nameEn}.`,
    '- Use only given facts and context.',
    '- Never invent missing history.',
    '- Contact email is sangdon.park@dju.kr.',
    '- Keep answer concise and factual.',
    `- Respond in ${lang === 'ko' ? 'Korean' : 'English'}.`,
    '',
    `Question: ${message}`,
    '',
    `Recent conversation:\n${recent || '(none)'}`,
    '',
    `Context:\n${context || '(none)'}`
  ].join('\n');
}

async function generateReply(prompt, apiKey) {
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700
          }
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('generate reply error:', error);
    return null;
  }
}

async function logToSupabase(event, payload) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    await supabase.from('chat_logs').insert([{
      user_message: payload.message,
      bot_response: payload.reply,
      conversation_history: safeHistory(payload.history),
      action_taken: payload.action || null,
      search_results: Array.isArray(payload.searchResults) ? payload.searchResults : null,
      user_ip: ip,
      user_agent: event.headers['user-agent'] || 'unknown'
    }]);
  } catch (error) {
    console.error('supabase log error:', error);
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const message = String(body.message || '').trim();
    const history = safeHistory(body.history);
    const step = Number(body.step || 1);

    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message required' }) };
    }

    const lang = detectLanguage(message, history);

    if (step === 1) {
      const decision = classifyStep1(message, lang);
      if (decision.action === 'CHAT') {
        await logToSupabase(event, {
          message,
          reply: decision.initialMessage,
          history,
          action: 'CHAT',
          searchResults: null
        });
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          step: 1,
          action: decision.action,
          query: decision.query,
          initialMessage: decision.initialMessage,
          needsSecondStep: decision.needsSecondStep
        })
      };
    }

    const action = String(body.action || 'SEARCH').toUpperCase();
    if (action === 'CHAT' || isGreeting(message)) {
      const reply = tr(
        lang,
        '안녕하세요. 궁금한 내용을 한 문장으로 보내주시면 바로 안내드리겠습니다.',
        'Hello. Ask a concrete question and I will answer right away.'
      );
      await logToSupabase(event, { message, reply, history, action: 'CHAT', searchResults: null });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ step: 2, reply, searchResults: null, searchResultsDetailed: null })
      };
    }

    const det = deterministic(message, lang, history);
    if (det) {
      const payload = buildSearchPayload(det.docs || []);
      await logToSupabase(event, {
        message,
        reply: det.reply,
        history,
        action,
        searchResults: payload.searchResults
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          step: 2,
          reply: det.reply,
          searchResults: payload.searchResults,
          searchResultsDetailed: payload.searchResultsDetailed
        })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const query = String(body.query || message).trim();
    const retrieved = await retrieve(query, apiKey);
    const payload = buildSearchPayload(retrieved);

    let reply = null;
    if (apiKey) {
      reply = await generateReply(buildPrompt(message, history, retrieved, lang), apiKey);
    }

    if (!reply) {
      if (retrieved.length > 0) {
        const top = retrieved[0].doc || retrieved[0];
        reply = tr(
          lang,
          `관련 자료를 찾았습니다. 우선 "${top.title}" 항목을 확인해 주세요.`,
          `I found relevant information. Please check "${top.title}" first.`
        );
      } else {
        reply = tr(
          lang,
          `질문을 정확히 분류하지 못했습니다. 논문/강의/경력/연락처 중 하나로 다시 질문해 주세요. (${SITE_PROFILE.email})`,
          `I could not classify the question precisely. Please ask again about publications/courses/career/contact. (${SITE_PROFILE.email})`
        );
      }
    }

    if (isContactIntent(message) && !reply.includes(SITE_PROFILE.email)) {
      reply += `\n\n${tr(lang, '연락처', 'Contact')}: ${SITE_PROFILE.email}`;
    }

    await logToSupabase(event, {
      message,
      reply,
      history,
      action,
      searchResults: payload.searchResults
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        step: 2,
        reply,
        searchResults: payload.searchResults,
        searchResultsDetailed: payload.searchResultsDetailed
      })
    };
  } catch (error) {
    console.error('chat-ai-driven error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
