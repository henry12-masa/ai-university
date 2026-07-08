const params = new URLSearchParams(location.search);
const type = params.get("type") || "home";
const mode = params.get("mode") || "normal";
const QUESTION_LIMIT = 50;
const STORAGE_KEY = "aiUniversityQuizHistoryV2";

const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");
const categoryArea = document.getElementById("categoryArea");
const counter = document.getElementById("counter");
const scoreEl = document.getElementById("score");
const questionEl = document.getElementById("question");
const metaEl = document.getElementById("meta");
const choicesEl = document.getElementById("choices");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const analysisBox = document.getElementById("analysisBox");
const modeLabel = document.getElementById("modeLabel");
const reviewBtn = document.getElementById("reviewBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

function getHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");}catch(e){return {};}}
function saveHistory(h){localStorage.setItem(STORAGE_KEY, JSON.stringify(h));}
function shuffle(array){return array.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);}
function normalizeQuestion(q, key){return {id:q.id||`${key}-${q.no}`, question:q.question||q.q, choices:q.choices||q.c, answer:q.answer||q.a, explanation:q.explanation||q.e||"", field:q.field||"総合", level:q.level||"標準", categoryKey:key};}
function uniqueByQuestion(array){const seen=new Set();return array.filter(q=>{const k=(q.question||"").trim(); if(!k||seen.has(k))return false; seen.add(k); return true;});}

function renderCategories(){
  const catalog = window.quizCatalog || [];
  categoryArea.innerHTML = catalog.map(group => `
    <section class="group">
      <h2>${group.group}</h2>
      <div class="links">
        ${group.items.map(item => `<a href="?type=${item.key}" class="${type===item.key?'active':''}">${item.title}<br><small>200問 / 50問出題</small></a>`).join("")}
      </div>
    </section>
  `).join("");
}

function allQuestions(){
  const out=[];
  Object.keys(window.quizData || {}).forEach(key=>{out.push(...window.quizData[key].map(q=>normalizeQuestion(q,key)));});
  return out;
}

function questionsForType(){
  if(type === "home") return [];
  if(type === "all") return allQuestions();
  return (window.quizData?.[type] || []).map(q=>normalizeQuestion(q,type));
}

function getTitle(key){
  for(const group of (window.quizCatalog||[])){
    const found = group.items.find(i=>i.key===key);
    if(found) return found.title;
  }
  return "AI大学受験クイズ";
}

function buildQuestionSet(){
  let base = questionsForType();
  if(mode === "review"){
    const h = getHistory();
    base = allQuestions().filter(q => h[q.id]?.wrong > 0);
  }
  return shuffle(uniqueByQuestion(base)).slice(0, QUESTION_LIMIT);
}

let questions = buildQuestionSet();
let currentIndex = 0;
let score = 0;
let answered = false;
let sessionStats = {};

function updateHeader(){
  if(type === "home"){
    document.title = "AI大学受験クイズ";
    pageTitle.textContent = "AI大学受験クイズ";
    pageDesc.textContent = "共通テスト・東大・京大・慶應・早稲田・MARCH・関関同立レベル。各カテゴリ200問から50問ランダム出題。";
  }else if(mode === "review"){
    document.title = "間違えた問題だけ復習";
    pageTitle.textContent = "間違えた問題だけ復習";
    pageDesc.textContent = "過去に間違えた問題だけを最大50問ランダム出題します。";
  }else{
    const t = getTitle(type);
    document.title = t;
    pageTitle.textContent = t;
    pageDesc.textContent = "200問の中から50問をランダム出題。正答率・苦手分野・復習問題を自動記録します。";
  }
  modeLabel.textContent = mode === "review" ? "復習モード" : (type === "home" ? "カテゴリ選択" : "通常モード");
}

function showHome(){
  questionEl.textContent = "カテゴリを選んでください";
  metaEl.textContent = "公開用の問題はすべてオリジナル問題です。赤本・過去問の本文コピーは入れていません。";
  choicesEl.innerHTML = "";
  resultEl.textContent = "";
  analysisBox.innerHTML = `<h3>使い方</h3><ul><li>受けたい大学・学部・科目を選択</li><li>各カテゴリ200問から50問ランダム出題</li><li>間違えた問題は自動保存され、復習モードで再出題</li><li>終了後に苦手分野を表示</li></ul>`;
}

function showQuestion(){
  updateHeader();
  answered = false;
  resultEl.textContent = "";
  nextBtn.style.display = "none";
  analysisBox.innerHTML = "";

  if(type === "home") return showHome();
  if(questions.length === 0){
    questionEl.textContent = mode === "review" ? "復習対象の問題はまだありません" : "問題データが読み込めませんでした";
    metaEl.textContent = "通常モードで問題を解くと、間違えた問題が復習対象になります。";
    choicesEl.innerHTML = "";
    counter.textContent = "0 / 0";
    scoreEl.textContent = "スコア: 0";
    progressBar.style.width = "0%";
    return;
  }
  if(currentIndex >= questions.length){
    questionEl.textContent = "終了！";
    metaEl.textContent = "";
    choicesEl.innerHTML = "";
    counter.textContent = `${questions.length} / ${questions.length}`;
    scoreEl.textContent = `スコア: ${score}`;
    progressBar.style.width = "100%";
    resultEl.textContent = `${questions.length}問中 ${score}問正解（正答率 ${Math.round(score/questions.length*100)}%）`;
    renderAnalysis();
    return;
  }
  const q = questions[currentIndex];
  counter.textContent = `${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `スコア: ${score}`;
  questionEl.textContent = q.question;
  metaEl.textContent = `分野: ${q.field} / レベル: ${q.level}`;
  progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  choicesEl.innerHTML = "";
  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => answerQuestion(btn, choice, q);
    choicesEl.appendChild(btn);
  });
}

function answerQuestion(btn, choice, q){
  if(answered) return;
  answered = true;
  const isCorrect = choice === q.answer;
  if(!sessionStats[q.field]) sessionStats[q.field] = {total:0, correct:0};
  sessionStats[q.field].total++;
  if(isCorrect) sessionStats[q.field].correct++;
  const h = getHistory();
  h[q.id] = h[q.id] || {wrong:0, correct:0, question:q.question, field:q.field, categoryKey:q.categoryKey};
  if(isCorrect){ score++; h[q.id].correct++; resultEl.textContent = "正解！"; btn.classList.add("correct"); }
  else{ h[q.id].wrong++; resultEl.textContent = `不正解。正解は「${q.answer}」`; btn.classList.add("wrong"); }
  saveHistory(h);
  [...choicesEl.children].forEach(b=>{b.disabled=true; if(b.textContent===q.answer)b.classList.add("correct");});
  if(q.explanation) resultEl.textContent += `
${q.explanation}`;
  scoreEl.textContent = `スコア: ${score}`;
  setTimeout(()=>{currentIndex++; showQuestion();}, 1000);
}

function renderAnalysis(){
  const rows = Object.entries(sessionStats).map(([field,s])=>({field,total:s.total,correct:s.correct,rate:Math.round(s.correct/s.total*100)})).sort((a,b)=>a.rate-b.rate);
  const weak = rows.filter(r=>r.rate<70).slice(0,5);
  analysisBox.innerHTML = `<h3>苦手分析</h3>${rows.length?`<ul>${rows.map(r=>`<li>${r.field}: ${r.correct}/${r.total} 正解（${r.rate}%）</li>`).join("")}</ul>`:""}<p><strong>優先復習:</strong> ${weak.length?weak.map(w=>w.field).join("、"):"大きな弱点はありません。"}</p><p>間違えた問題は「間違えた問題だけ復習」から再挑戦できます。</p>`;
}

reviewBtn.onclick = () => { location.href = "?type=all&mode=review"; };
clearHistoryBtn.onclick = () => { if(confirm("学習履歴をリセットしますか？")){localStorage.removeItem(STORAGE_KEY); location.href="index.html";} };
nextBtn.onclick = () => { currentIndex++; showQuestion(); };

renderCategories();
showQuestion();
