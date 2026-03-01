#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BASE_URL = String(process.env.SITE_BASE_URL || 'https://sangdon-park.github.io').replace(/\/+$/, '');
const LOCAL_SITE_DIR = String(process.env.HOMEPAGE_REPO_DIR || '').trim();
const OUTPUT_PATH = path.join(__dirname, '..', 'netlify', 'functions', 'knowledge-base.js');

const COURSE_CONFIG = [
  {
    code: 'DB Systems',
    koPath: '/courses/database-systems-2026-spring.html',
    enPath: '/courses/database-systems-2026-spring-en.html'
  },
  {
    code: 'AI',
    koPath: '/courses/artificial-intelligence-2026-spring.html',
    enPath: '/courses/artificial-intelligence-2026-spring-en.html'
  },
  {
    code: 'Capstone',
    koPath: '/courses/capstone-design-2026-spring.html',
    enPath: '/courses/capstone-design-2026-spring-en.html'
  }
];

const DEFAULT_PROFILE = {
  affiliationEn: 'Department of Computer Engineering, School of SW Convergence, Daejeon University',
  formerIndustryRole: 'Game Developer at Sayberry Games',
  postdocRole: 'Postdoctoral Researcher at KAIST Institute for Information Technology Convergence'
};

const DEFAULT_COURSE_GRADING = {
  'DB Systems': {
    ko: '퀴즈/과제 30% · 중간고사 30% · 기말고사 30% · 출석 10%',
    en: 'Quizzes/Assignments 30% + Midterm 30% + Final 30% + Attendance 10%'
  },
  AI: {
    ko: '중간고사 30점 · 기말고사 30점 · 퀴즈 10점 · 기말 프로젝트 20점 · 출석+핵심역량평가 10점',
    en: 'Midterm 30 + Final 30 + Quiz 10 + Final Project 20 + Attendance/Core Competency 10'
  },
  Capstone: {
    ko: '산출물/발표/팀기여도 기준 (상세 평가표는 과목 페이지 참조)',
    en: 'Deliverables/presentation/team contribution rubric (see course page for details)'
  }
};

function decodeEntities(text = '') {
  return String(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, '\'')
    .replace(/&quot;/g, '"');
}

function stripTags(text = '') {
  return decodeEntities(
    String(text)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWhitespace(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function containsHangul(text = '') {
  return /[가-힣]/.test(String(text || ''));
}

function getMatch(text, regex, group = 1) {
  const m = String(text || '').match(regex);
  return m && m[group] ? m[group] : null;
}

function toInt(value) {
  const n = Number(String(value || '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function absoluteUrl(href = '') {
  const value = String(href || '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value.replace(/^\.\//, '')}`;
}

async function loadPage(urlPath) {
  const normalizedPath = `/${String(urlPath || '').replace(/^\/+/, '')}`;

  if (LOCAL_SITE_DIR) {
    const localPath = path.join(LOCAL_SITE_DIR, normalizedPath.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath, 'utf8');
    }
  }

  const url = absoluteUrl(normalizedPath);
  const res = await fetch(url, { headers: { 'User-Agent': 'KnowledgeSync/1.0' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function readExistingKnowledgeBase() {
  try {
    delete require.cache[require.resolve(OUTPUT_PATH)];
    return require(OUTPUT_PATH);
  } catch (error) {
    return {
      SITE_PROFILE: {},
      SITE_LINKS: {},
      COURSES_2026_SPRING: [],
      NEWS_POSTS: [],
      PUBLICATION_STATS: {},
      PUBLICATIONS: []
    };
  }
}

function splitProfileLines(profileHtml = '') {
  return String(profileHtml)
    .split(/<br\s*\/?>/i)
    .map((line) => stripTags(line))
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function parseEducationTimeline(aboutKo = '', aboutEn = '', fallback = []) {
  const koSection = getMatch(aboutKo, /<section[^>]*id=["']education["'][^>]*>([\s\S]*?)<\/section>/i, 1) || '';
  const enSection = getMatch(aboutEn, /<section[^>]*id=["']education["'][^>]*>([\s\S]*?)<\/section>/i, 1) || '';
  const liPattern = /<li[^>]*class=["'][^"']*timeline-item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;

  const koItems = [];
  const enItems = [];
  let m;

  while ((m = liPattern.exec(koSection)) !== null) {
    const li = m[1];
    koItems.push({
      date: stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || ''),
      body: stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || '')
    });
  }

  while ((m = liPattern.exec(enSection)) !== null) {
    const li = m[1];
    enItems.push({
      date: stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || ''),
      body: stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || '')
    });
  }

  const parseDegree = (text = '') => {
    if (/ph\.?\s*d|박사/i.test(text)) return 'Ph.D.';
    if (/m\.?\s*s|석사/i.test(text)) return 'M.S.';
    if (/b\.?\s*s|학사/i.test(text)) return 'B.S.';
    return null;
  };

  const parseKoDepartment = (body = '') => {
    const dep = getMatch(body, /KAIST\s+(.+?)\s*(?:박사|석사|학사)/i, 1);
    return dep ? normalizeWhitespace(dep) : null;
  };

  const parseEnDepartment = (body = '') => {
    const dep = String(body).split('(')[0].trim();
    return dep || null;
  };

  const parseAdvisorKo = (body = '') => getMatch(body, /지도교수님?\s*:\s*([^,\s]+)/i, 1);
  const parseAdvisorEn = (body = '') => getMatch(body, /Advisor:\s*([^)]+)/i, 1);

  const merged = [];
  for (let i = 0; i < Math.max(koItems.length, enItems.length); i += 1) {
    const ko = koItems[i] || {};
    const en = enItems[i] || {};
    const degree = parseDegree(ko.date || ko.body || en.date || en.body || '');
    if (!degree) continue;

    const gradRaw = getMatch(ko.date || en.date, /(20\d{2}(?:\.\d{1,2})?)/, 1);
    let graduation = gradRaw || null;
    if (!graduation) {
      const yearOnly = getMatch(en.date || '', /(20\d{2})/, 1);
      graduation = yearOnly || null;
    }

    merged.push({
      degree,
      graduation,
      school: 'KAIST',
      departmentKo: parseKoDepartment(ko.body) || null,
      departmentEn: parseEnDepartment(en.body) || null,
      advisorKo: parseAdvisorKo(ko.body) || null,
      advisorEn: parseAdvisorEn(en.body) || null
    });
  }

  const fallbackByDegree = new Map((fallback || []).map((item) => [item.degree, item]));
  const result = ['Ph.D.', 'M.S.', 'B.S.'].map((degree) => {
    const parsed = merged.find((item) => item.degree === degree);
    const old = fallbackByDegree.get(degree) || {};
    return {
      degree,
      graduation: parsed?.graduation || old.graduation || null,
      school: parsed?.school || old.school || 'KAIST',
      departmentKo: parsed?.departmentKo || old.departmentKo || null,
      departmentEn: parsed?.departmentEn || old.departmentEn || null,
      advisorKo: parsed?.advisorKo !== undefined ? parsed.advisorKo : (old.advisorKo || null),
      advisorEn: parsed?.advisorEn !== undefined ? parsed.advisorEn : (old.advisorEn || null)
    };
  });

  return result;
}

function normalizeCareerPeriod(raw = '') {
  const text = normalizeWhitespace(raw);
  const fullStart = text.match(/(\d{4})\.(\d{2})\.(\d{2})\s*-\s*현재/);
  if (fullStart) return `${fullStart[1]}-${fullStart[2]}-${fullStart[3]} to present`;

  const ymToYmd = text.match(/(\d{4})\.(\d{2})\s*-\s*(\d{4})\.(\d{2})\.(\d{2})/);
  if (ymToYmd) return `${ymToYmd[1]}-${ymToYmd[2]} to ${ymToYmd[3]}-${ymToYmd[4]}-${ymToYmd[5]}`;

  const ymdToYmd = text.match(/(\d{4})\.(\d{2})\.(\d{2})\s*-\s*(\d{4})\.(\d{2})\.(\d{2})/);
  if (ymdToYmd) return `${ymdToYmd[1]}-${ymdToYmd[2]}-${ymdToYmd[3]} to ${ymdToYmd[4]}-${ymdToYmd[5]}-${ymdToYmd[6]}`;

  const ymToNow = text.match(/(\d{4})\.(\d{2})\s*-\s*현재/);
  if (ymToNow) return `${ymToNow[1]}-${ymToNow[2]} to present`;

  return text || null;
}

function parseCareerTimeline(aboutKo = '', fallback = []) {
  const section = getMatch(aboutKo, /<section[^>]*id=["']career["'][^>]*>([\s\S]*?)<\/section>/i, 1) || '';
  const items = [];
  const liPattern = /<li[^>]*class=["'][^"']*timeline-item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liPattern.exec(section)) !== null) {
    const li = m[1];
    const date = stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || '');
    const body = stripTags(getMatch(li, /<div[^>]*class=["'][^"']*timeline-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, 1) || '');
    if (!date || !body) continue;
    if (/hexagon soup/i.test(body)) continue;
    items.push({
      period: normalizeCareerPeriod(date),
      role: normalizeWhitespace(body)
    });
  }

  const fallbackByPeriod = new Map((fallback || []).map((entry) => [entry.period, entry]));
  const normalizedItems = items.map((entry) => {
    const old = fallbackByPeriod.get(entry.period);
    if (containsHangul(entry.role) && old?.role && !containsHangul(old.role)) {
      return { ...entry, role: old.role };
    }
    return entry;
  });

  const hasPostdoc = normalizedItems.some((entry) => /postdoc|박사후|kaist institute/i.test(entry.role));
  if (!hasPostdoc) {
    const oldPostdoc = (fallback || []).find((entry) => /postdoc|박사후|kaist institute/i.test(String(entry.role || '')));
    if (oldPostdoc) {
      normalizedItems.push(oldPostdoc);
    }
  }

  return normalizedItems;
}

function parseGradingSummary(courseHtml = '', lang = 'ko') {
  const assignmentsSection = getMatch(
    courseHtml,
    /<section[^>]*id=["']assignments["'][^>]*>([\s\S]*?)<\/section>/i,
    1
  ) || courseHtml;

  const tablePattern = /<table[^>]*class=["'][^"']*course-table[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi;
  let m;
  while ((m = tablePattern.exec(assignmentsSection)) !== null) {
    const table = m[1];
    if (lang === 'ko' && !/평가\s*항목|배점|비율/i.test(table)) continue;
    if (lang === 'en' && !/evaluation|grading|weight|score|rubric/i.test(table)) continue;

    const rows = [];
    const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
    let row;
    while ((row = rowPattern.exec(table)) !== null) {
      const cells = [];
      const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cell;
      while ((cell = cellPattern.exec(row[0])) !== null) {
        cells.push(stripTags(cell[1]));
      }
      if (cells.length < 2) continue;
      const item = normalizeWhitespace(cells[0]);
      const weight = normalizeWhitespace(cells[1]);
      if (!item || !weight) continue;
      if (/평가\s*항목|항목|item|category|component/i.test(item)) continue;
      if (/비율|배점|weight|score/i.test(weight)) continue;
      rows.push(`${item} ${weight}`);
    }

    if (rows.length) return rows.slice(0, 8).join(' · ');
  }

  return null;
}

function pickGradingSummary(code, parsed, fallback, lang = 'ko') {
  const defaultSummary = DEFAULT_COURSE_GRADING?.[code]?.[lang] || null;
  const summary = parsed || fallback || defaultSummary;
  if (!summary) return null;

  if (/Template\s*\d/i.test(summary)) {
    if (fallback && !/Template\s*\d/i.test(fallback)) return fallback;
    return defaultSummary || fallback || null;
  }

  return summary;
}

function extractTemplateBlock(html = '', variableName = '') {
  const escaped = String(variableName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`const\\s+${escaped}\\s*=\\s*\`([\\s\\S]*?)\`;`, 'i');
  return getMatch(html, regex, 1) || '';
}

function buildKeywords(title = '') {
  const stop = new Set([
    'for', 'with', 'and', 'the', 'of', 'in', 'to', 'on', 'based', 'using', 'via', 'from', 'an', 'a', 'by',
    'system', 'systems', 'analysis', 'model', 'scheme', 'approach', 'method', 'novel', 'study'
  ]);
  const terms = stripTags(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((v) => v.trim())
    .filter((v) => v.length >= 3 && !stop.has(v));
  return unique(terms).slice(0, 6);
}

function parseAuthors(authorPart = '') {
  const normalized = stripTags(authorPart)
    .replace(/[†*]/g, '')
    .replace(/\band\b/gi, ',')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized
    .split(',')
    .map((v) => normalizeWhitespace(v))
    .filter(Boolean);
}

function parseJournalLine(line = '') {
  const parts = String(line).split('|');
  const content = String(parts[0] || '').replace(/^\[\d+\]\s*/, '').trim();
  if (!content) return null;

  const title = getMatch(content, /"([^"]+)"/, 1);
  if (!title) return null;

  const beforeTitle = content.slice(0, content.indexOf(`"${title}"`)).replace(/,\s*$/, '').trim();
  const authors = parseAuthors(beforeTitle);
  const journal = stripTags(getMatch(content, /<em>([\s\S]*?)<\/em>/i, 1) || '');
  const years = Array.from(content.matchAll(/\b(19|20)\d{2}\b/g)).map((m) => Number(m[0]));
  const year = years.length ? years[years.length - 1] : null;
  const doi = (parts.find((p) => /https?:\/\/doi\.org\//i.test(String(p || '').trim())) || '').trim() || null;

  return {
    title: stripTags(title),
    journal: journal || null,
    year,
    authors,
    doi,
    keywords: buildKeywords(title)
  };
}

function parseNewsPosts(koHtml = '', fallback = []) {
  const section = getMatch(koHtml, /<section[^>]*id=["']news["'][^>]*>([\s\S]*?)<\/section>/i, 1) || '';
  if (!section) return fallback || [];

  const cards = Array.from(section.matchAll(/<article[^>]*class=["'][^"']*post-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi))
    .map((m) => m[1]);

  const posts = cards
    .map((card) => {
      const title = stripTags(getMatch(card, /<h3[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i, 1) || '');
      const date = stripTags(getMatch(card, /<span[^>]*class=["'][^"']*post-date[^"']*["'][^>]*>([\s\S]*?)<\/span>/i, 1) || '');
      const summary = stripTags(getMatch(card, /<p[^>]*class=["'][^"']*post-excerpt[^"']*["'][^>]*>([\s\S]*?)<\/p>/i, 1) || '');
      const href = getMatch(card, /<a[^>]*href=["']([^"']+)["'][^>]*>/i, 1);
      if (!title || /기존 포스트 모음/i.test(title)) return null;
      if (!date || !/20\d{2}/.test(date)) return null;
      return {
        title,
        date: date.match(/\d{4}-\d{2}-\d{2}/)?.[0] || date,
        url: href ? absoluteUrl(href) : null,
        summary
      };
    })
    .filter(Boolean);

  return posts.length ? posts : (fallback || []);
}

function parsePublicationStats(koHtml = '', enHtml = '', publicationsHtml = '', fallback = {}) {
  const sourceDate = getMatch(publicationsHtml, /Synced from Google Scholar profile[^<]*on\s*(\d{4}-\d{2}-\d{2})/i, 1)
    || fallback.sourceDate
    || null;

  const counts = { ...fallback };
  const tabRegex = /<a[^>]*href=["']#(journals|conferences|standards|patents)["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*category-count[^"']*["'][^>]*>(\d+)<\/span>/gi;
  let m;
  while ((m = tabRegex.exec(publicationsHtml)) !== null) {
    const key = m[1].toLowerCase();
    const n = toInt(m[2]);
    if (key === 'journals') counts.journals = n;
    if (key === 'conferences') counts.conferences = n;
    if (key === 'standards') counts.standards = n;
    if (key === 'patents') counts.patents = n;
  }

  const scholarLine = getMatch(koHtml, /Cited by\s*([0-9,]+)[\s\S]*?총\s*([0-9,]+)\s*works/i, 0)
    || getMatch(enHtml, /Cited by\s*([0-9,]+)\s*with\s*([0-9,]+)\s*works/i, 0);

  if (scholarLine) {
    const cited = toInt(getMatch(scholarLine, /Cited by\s*([0-9,]+)/i, 1));
    const works = toInt(getMatch(scholarLine, /([0-9,]+)\s*works/i, 1));
    if (cited) counts.citedBy = cited;
    if (works) counts.scholarWorks = works;
  }

  return {
    sourceDate,
    scholarWorks: toInt(counts.scholarWorks) || null,
    citedBy: toInt(counts.citedBy) || null,
    journals: toInt(counts.journals) || null,
    conferences: toInt(counts.conferences) || null,
    standards: toInt(counts.standards) || null,
    patents: toInt(counts.patents) || null
  };
}

async function parseCourseData(existingCourses = []) {
  const byCode = new Map((existingCourses || []).map((c) => [c.code, c]));
  const courses = [];

  for (const cfg of COURSE_CONFIG) {
    const old = byCode.get(cfg.code) || {};
    const koHtml = await loadPage(cfg.koPath);
    const enHtml = await loadPage(cfg.enPath);

    const titleKo = stripTags(getMatch(koHtml, /<h2>([\s\S]*?)<\/h2>/i, 1) || '') || old.titleKo || cfg.code;
    const titleEn = stripTags(getMatch(enHtml, /<h2>([\s\S]*?)<\/h2>/i, 1) || '') || old.titleEn || cfg.code;
    const pageKo = absoluteUrl(getMatch(koHtml, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, 1) || cfg.koPath);
    const pageEn = absoluteUrl(getMatch(enHtml, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i, 1) || cfg.enPath);
    const parsedKoSummary = parseGradingSummary(koHtml, 'ko');
    const parsedEnSummary = parseGradingSummary(enHtml, 'en');

    courses.push({
      code: cfg.code,
      titleKo,
      titleEn,
      pageKo,
      pageEn,
      gradingSummaryKo: pickGradingSummary(cfg.code, parsedKoSummary, old.gradingSummaryKo, 'ko'),
      gradingSummaryEn: pickGradingSummary(cfg.code, parsedEnSummary, old.gradingSummaryEn, 'en')
    });
  }

  return courses;
}

function parseProfile(koHtml, enHtml, aboutKoHtml, aboutEnHtml, educationTimeline, careerTimeline, existingProfile = {}) {
  const koProfileLines = splitProfileLines(getMatch(koHtml, /<p[^>]*class=["'][^"']*profile-title[^"']*["'][^>]*>([\s\S]*?)<\/p>/i, 1) || '');
  const enProfileLines = splitProfileLines(getMatch(enHtml, /<p[^>]*class=["'][^"']*profile-title[^"']*["'][^>]*>([\s\S]*?)<\/p>/i, 1) || '');

  const nameKo = stripTags(getMatch(koHtml, /<h1[^>]*class=["'][^"']*profile-name[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i, 1) || '')
    || existingProfile.nameKo
    || '박상돈';
  const nameEn = existingProfile.nameEn || 'Sangdon Park';

  const titleKoLine = koProfileLines[0] || existingProfile.titleKo || '조교수';
  const titleKo = normalizeWhitespace(titleKoLine.split('(')[0]) || existingProfile.titleKo || '조교수';
  const titleEn = normalizeWhitespace(
    getMatch(titleKoLine, /\(([^)]+)\)/, 1)
    || enProfileLines[0]
    || existingProfile.titleEn
    || 'Assistant Professor'
  );

  const affiliationKo = koProfileLines.find((line) => /대학교|학부|학과/.test(line))
    || existingProfile.affiliationKo
    || '대전대학교 SW융합학부 컴퓨터공학과';
  const parsedAffiliationEn = enProfileLines.find((line) => /Department|School|University/i.test(line)) || null;
  const existingAffEn = existingProfile.affiliationEn || '';
  const affiliationEn = (() => {
    if (parsedAffiliationEn && /University/i.test(parsedAffiliationEn)) return parsedAffiliationEn;
    if (existingAffEn && /University/i.test(existingAffEn)) return existingAffEn;
    return DEFAULT_PROFILE.affiliationEn;
  })();

  const appointmentDate = getMatch(koHtml, /발령일:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, 1)
    || getMatch(enHtml, /Effective\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, 1)
    || existingProfile.appointmentDate
    || '2026-03-01';

  const email = getMatch(koHtml, /mailto:([^"']+)/i, 1)
    || getMatch(enHtml, /mailto:([^"']+)/i, 1)
    || existingProfile.email
    || 'sangdon.park@dju.kr';

  const scholarUrl = getMatch(koHtml, /(https?:\/\/scholar\.google\.com\/citations\?user=[^"']+)/i, 1)
    || existingProfile.scholarUrl
    || null;
  const scholarId = getMatch(scholarUrl || '', /user=([^&]+)/i, 1) || existingProfile.scholarId || null;
  const githubUrl = getMatch(koHtml, /(https?:\/\/github\.com\/[^"']+)/i, 1) || existingProfile.githubUrl || null;
  const linkedinUrl = getMatch(koHtml, /(https?:\/\/www\.linkedin\.com\/[^"']+)/i, 1) || existingProfile.linkedinUrl || null;
  const currentProjectUrl = getMatch(koHtml, /(https?:\/\/store\.steampowered\.com\/app\/4256880\/Hexagon_Soup\/?)/i, 1)
    || getMatch(aboutKoHtml, /(https?:\/\/store\.steampowered\.com\/app\/4256880\/Hexagon_Soup\/?)/i, 1)
    || existingProfile.currentProjectUrl
    || null;

  const sayberry = (careerTimeline || []).find((item) => /sayberry|세이베리/i.test(String(item.role || '')));
  const postdoc = (careerTimeline || []).find((item) => /postdoc|박사후|kaist institute/i.test(String(item.role || '')));

  const parsedFormerRole = sayberry?.role || null;
  const formerIndustryRole = (() => {
    if (parsedFormerRole && !containsHangul(parsedFormerRole)) return parsedFormerRole;
    if (existingProfile.formerIndustryRole && !containsHangul(existingProfile.formerIndustryRole)) return existingProfile.formerIndustryRole;
    return DEFAULT_PROFILE.formerIndustryRole;
  })();

  const parsedPostdocRole = postdoc?.role || null;
  const postdocRole = (() => {
    if (parsedPostdocRole && !containsHangul(parsedPostdocRole)) return parsedPostdocRole;
    if (existingProfile.postdocRole && !containsHangul(existingProfile.postdocRole)) return existingProfile.postdocRole;
    return DEFAULT_PROFILE.postdocRole;
  })();

  return {
    nameKo,
    nameEn,
    labName: existingProfile.labName || 'AxGS Lab',
    labExpanded: existingProfile.labExpanded || 'AI x Games Systems Lab',
    titleKo,
    titleEn,
    affiliationKo,
    affiliationEn,
    appointmentDate,
    email,
    scholarId,
    scholarUrl,
    githubUrl,
    linkedinUrl,
    website: `${BASE_URL}/`,
    formerIndustryRole,
    formerIndustryPeriod: sayberry?.period || existingProfile.formerIndustryPeriod || '2025-05 to 2026-02-28',
    postdocRole,
    postdocPeriod: postdoc?.period || existingProfile.postdocPeriod || '2017-08 to 2025-04',
    educationTimeline,
    careerTimeline,
    currentProject: existingProfile.currentProject || 'Hexagon Soup (solo development)',
    currentProjectUrl
  };
}

function parseJournalPublications(publicationsHtml = '', fallback = []) {
  const block = extractTemplateBlock(publicationsHtml, 'journalPapers');
  if (!block) return fallback || [];

  const pubs = block
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .map((line) => parseJournalLine(line))
    .filter(Boolean);

  return pubs.length ? pubs : (fallback || []);
}

function buildSiteLinks(existing = {}) {
  return {
    homeKo: absoluteUrl('/ko.html'),
    homeEn: absoluteUrl('/en.html'),
    aboutKo: absoluteUrl('/about.html'),
    aboutEn: absoluteUrl('/about-en.html'),
    publications: absoluteUrl('/publications.html'),
    coursesHubKo: absoluteUrl('/courses-2026-spring.html'),
    coursesHubEn: absoluteUrl('/courses-2026-spring-en.html'),
    collaborationKo: absoluteUrl('/collaboration.html'),
    collaborationEn: absoluteUrl('/collaboration-en.html'),
    ...existing
  };
}

function writeKnowledgeBaseFile(data) {
  const out = [
    '// Auto-synced knowledge base for Sangdon Park homepage chatbot',
    '// Generated from homepage pages and publication scripts',
    `// Generated at ${new Date().toISOString()} from ${BASE_URL}`,
    '',
    `const SITE_PROFILE = ${JSON.stringify(data.SITE_PROFILE, null, 2)};`,
    '',
    `const SITE_LINKS = ${JSON.stringify(data.SITE_LINKS, null, 2)};`,
    '',
    `const COURSES_2026_SPRING = ${JSON.stringify(data.COURSES_2026_SPRING, null, 2)};`,
    '',
    `const NEWS_POSTS = ${JSON.stringify(data.NEWS_POSTS, null, 2)};`,
    '',
    `const PUBLICATION_STATS = ${JSON.stringify(data.PUBLICATION_STATS, null, 2)};`,
    '',
    `const PUBLICATIONS = ${JSON.stringify(data.PUBLICATIONS, null, 2)};`,
    '',
    'module.exports = {',
    '  SITE_PROFILE,',
    '  SITE_LINKS,',
    '  COURSES_2026_SPRING,',
    '  NEWS_POSTS,',
    '  PUBLICATION_STATS,',
    '  PUBLICATIONS',
    '};',
    ''
  ].join('\n');

  fs.writeFileSync(OUTPUT_PATH, out, 'utf8');
}

async function main() {
  const existing = readExistingKnowledgeBase();

  const [
    koHtml,
    enHtml,
    aboutKoHtml,
    aboutEnHtml,
    publicationsHtml
  ] = await Promise.all([
    loadPage('/ko.html'),
    loadPage('/en.html'),
    loadPage('/about.html'),
    loadPage('/about-en.html'),
    loadPage('/publications.html')
  ]);

  const educationTimeline = parseEducationTimeline(
    aboutKoHtml,
    aboutEnHtml,
    existing.SITE_PROFILE?.educationTimeline || []
  );
  const careerTimeline = parseCareerTimeline(
    aboutKoHtml,
    existing.SITE_PROFILE?.careerTimeline || []
  );
  const siteLinks = buildSiteLinks(existing.SITE_LINKS || {});
  const courses = await parseCourseData(existing.COURSES_2026_SPRING || []);
  const profile = parseProfile(
    koHtml,
    enHtml,
    aboutKoHtml,
    aboutEnHtml,
    educationTimeline,
    careerTimeline,
    existing.SITE_PROFILE || {}
  );
  const newsPosts = parseNewsPosts(koHtml, existing.NEWS_POSTS || []);
  const publicationStats = parsePublicationStats(
    koHtml,
    enHtml,
    publicationsHtml,
    existing.PUBLICATION_STATS || {}
  );
  const publications = parseJournalPublications(publicationsHtml, existing.PUBLICATIONS || []);

  const next = {
    SITE_PROFILE: profile,
    SITE_LINKS: siteLinks,
    COURSES_2026_SPRING: courses,
    NEWS_POSTS: newsPosts,
    PUBLICATION_STATS: publicationStats,
    PUBLICATIONS: publications
  };

  writeKnowledgeBaseFile(next);

  console.log('Knowledge base synced.');
  console.log(`- output: ${OUTPUT_PATH}`);
  console.log(`- courses: ${next.COURSES_2026_SPRING.length}`);
  console.log(`- news posts: ${next.NEWS_POSTS.length}`);
  console.log(`- journal publications: ${next.PUBLICATIONS.length}`);
}

main().catch((error) => {
  console.error('[sync-knowledge-base] failed:', error);
  process.exit(1);
});
