// Top Collaborators Production Tests
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

const CASES = [
  { id: 'ko-1', q: '누구랑 제일 많이 썼어?' },
  { id: 'ko-2', q: '가장 많이 같이 쓴 사람 누구야?' },
  { id: 'ko-3', q: '공동연구 가장 많이 한 분은?' },
  { id: 'en-1', q: 'Who did you write the most papers with?' },
  { id: 'en-2', q: 'Top 3 collaborators?' }
];

async function step(query, stepNo, extra = {}) {
  const res = await fetch(PROD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, step: stepNo, ...extra })
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function containsCountLike(text) {
  return /(\d+)\s*편/.test(text) || /(\d+)\s*papers?/.test(text);
}

async function runOne(tc) {
  console.log(`\n[${tc.id}] ${tc.q}`);
  const s1 = await step(tc.q, 1);
  if (!s1.ok) {
    console.log(`❌ Step1 failed: ${s1.status}`);
    return false;
  }
  console.log(`Action=${s1.data.action}, Query=${s1.data.query}`);
  const s2 = await step(tc.q, 2, { action: s1.data.action || 'SEARCH', query: s1.data.query || tc.q });
  if (!s2.ok) {
    console.log(`❌ Step2 failed: ${s2.status}`);
    return false;
  }
  const reply = s2.data.reply || '';
  const results = s2.data.searchResults || [];
  const detailed = s2.data.searchResultsDetailed || [];
  console.log('Reply:', reply);
  if (results && results.length) console.log('Top results:', results.slice(0, 3));
  if (detailed && detailed.length) console.log('Detailed:', detailed.slice(0, 3));

  let pass = true;
  if (!/가장|제일|most/i.test(reply)) {
    console.log('ℹ️ Reply does not explicitly mention most; still checking counts...');
  }
  if (!containsCountLike(reply)) {
    console.log('ℹ️ Reply may not include a numeric count; checking results...');
  }
  const anyCountInResults = (results || []).some(r => /(\d+)\s*편/.test(String(r))) ||
    (detailed || []).some(r => /(\d+)\s*편/.test(String(r?.item?.title || '')));
  if (!containsCountLike(reply) && !anyCountInResults) {
    console.log('❌ No count pattern found in reply or results');
    pass = false;
  }
  const hasAtLeastTwo = (results && results.length >= 2) || (detailed && detailed.length >= 2);
  if (!hasAtLeastTwo) {
    console.log('❌ Expected at least 2 collaborator entries in results');
    pass = false;
  }
  if (pass) console.log('✅ PASS');
  return pass;
}

(async () => {
  let ok = true;
  for (const tc of CASES) {
    const r = await runOne(tc);
    ok = ok && r;
  }
  if (!ok) process.exit(1);
})();

