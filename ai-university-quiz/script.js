const params = new URLSearchParams(location.search);
const type = params.get("type") || "all";
const mode = params.get("mode") || "normal";
const QUESTION_LIMIT = 50;
const WRONG_KEY = "aiUniversityQuizWrongQuestions";
const STATS_KEY = "aiUniversityQuizStats";

const quizInfo = {
  keio: {
    title: "慶應義塾大学レベル",
    desc: "英語長文、語彙、論理読解、小論文、学部別対策。赤本コピーではなく、傾向を参考にしたオリジナル問題。"
  },
  waseda: {
    title: "早稲田大学レベル",
    desc: "長文速読、空所補充、語彙、現代文、文系学部対策。オリジナル問題で演習。"
  },
  todai: {
    title: "東京大学レベル",
    desc: "要約、英作文、論理読解、数学思考、記述対策。東大レベルの考え方を鍛える問題。"
  },
  kyodai: {
    title: "京都大学レベル",
    desc: "英文和訳、和文英訳、抽象文読解、数学記述。京大レベルの思考力対策。"
  },
  commonTest: {
    title: "共通テストレベル",
    desc: "情報処理型読解、資料読解、短時間判断、基礎確認。共通テスト対策用の演習。"
  }
};

const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");
const quizList = document.getElementById("quizList");
const facultySelect = document.getElementById("facultySelect");
const reviewBtn = document.getElementById("reviewBtn");
const resetBtn = document.getElementById("resetBtn");
const analysisBox = document.getElementById("analysisBox");
const metaEl = document.getElementById("meta");

function getStore(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch(e){ return fallback; }
}
function setStore(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function normalizeQuestion(q, categoryKey){
  return {
    id: q.id || `${categoryKey}-${q.question || q.q}`,
    category: categoryKey,
    university: q.university || quizInfo[categoryKey]?.title || "大学受験",
    faculty: q.faculty || "全学部",
    subject: q.subject || "総合",
    skill: q.skill || "読解",
    question: q.question || q.q,
    choices: q.choices || q.c,
    answer: q.answer || q.a,
    explanation: q.explanation || q.e || "",
    aiHint: q.aiHint || q.hint || "設問の根拠を本文・条件・選択肢から分解して考えましょう。"
  };
}

function shuffle(array){
  return array.map(v => [Math.random(), v]).sort((a,b) => a[0] - b[0]).map(v => v[1]);
}

function uniqueByQuestion(array){
  const seen = new Set();
  return array.filter(q => {
    const key = `${q.category}:${(q.question || "").trim()}`;
    if (!q.question || !q.choices || !q.answer || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectAllQuestions(){
  let list = [];
  Object.keys(quizInfo).forEach(key => {
    if (window.quizData && Array.isArray(window.quizData[key])) {
      list.push(...window.quizData[key].map(q => normalizeQuestion(q, key)));
    }
  });
  return uniqueByQuestion(list);
}

function collectQuestions(){
  if (type === "all") return collectAllQuestions();
  return window.quizData?.[type] ? uniqueByQuestion(window.quizData[type].map(q => normalizeQuestion(q, type))) : [];
}

function updateHeader(){
  if (type === "all") {
    document.title = "AI大学受験クイズ";
    pageTitle.textContent = "AI大学受験クイズ";
    pageDesc.textContent = "慶應・早稲田・東大・京大・共通テストから50問ランダム出題";
  } else {
    const info = quizInfo[type] || quizInfo.keio;
    document.title = info.title;
    pageTitle.textContent = info.title;
    pageDesc.textContent = info.desc;
  }
}

function renderNav(){
  quizList.innerHTML = `
    <a href="index.html" class="${type === "all" ? "active" : ""}">全レベル50問</a>
    ${Object.keys(quizInfo).map(key => `
      <a href="?type=${key}" class="${type === key ? "active" : ""}">${quizInfo[key].title}</a>
    `).join("")}
  `;
}

let baseQuestions = collectQuestions();
let selectedFaculty = params.get("faculty") || "all";
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let wrongInSession = [];

const counter = document.getElementById("counter");
const scoreEl = document.getElementById("score");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

function setupFacultySelect(){
  const faculties = [...new Set(baseQuestions.map(q => q.faculty).filter(Boolean))].sort();
  facultySelect.innerHTML = `<option value="all">全学部ミックス</option>` + faculties.map(f => `<option value="${f}">${f}</option>`).join("");
  facultySelect.value = faculties.includes(selectedFaculty) ? selectedFaculty : "all";
  facultySelect.onchange = () => {
    selectedFaculty = facultySelect.value;
    startQuiz("normal");
  };
}

function makeQuestionSet(nextMode = mode){
  let source = baseQuestions;
  if (selectedFaculty !== "all") source = source.filter(q => q.faculty === selectedFaculty);
  if (nextMode === "review") {
    const wrongIds = getStore(WRONG_KEY, []);
    source = collectAllQuestions().filter(q => wrongIds.includes(q.id));
  }
  return shuffle(uniqueByQuestion(source)).slice(0, QUESTION_LIMIT);
}

function renderAnalysis(){
  const stats = getStore(STATS_KEY, {});
  const entries = Object.entries(stats);
  if (!entries.length) {
    analysisBox.innerHTML = `<strong>苦手分析：</strong>まだ回答データがありません。解くと科目・スキル別に表示されます。`;
    return;
  }
  const bySkill = {};
  entries.forEach(([, s]) => {
    const key = `${s.subject} / ${s.skill}`;
    if (!bySkill[key]) bySkill[key] = { correct: 0, total: 0 };
    bySkill[key].correct += s.correct;
    bySkill[key].total += s.total;
  });
  const rows = Object.entries(bySkill)
    .sort((a,b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 5)
    .map(([k, v]) => `<li>${k}: 正答率 ${Math.round((v.correct / v.total) * 100)}%（${v.correct}/${v.total}）</li>`)
    .join("");
  analysisBox.innerHTML = `<strong>苦手分析：</strong><ul>${rows}</ul>`;
}

function saveAnswer(q, isCorrect){
  const stats = getStore(STATS_KEY, {});
  if (!stats[q.id]) stats[q.id] = { subject: q.subject, skill: q.skill, correct: 0, total: 0 };
  stats[q.id].total++;
  if (isCorrect) stats[q.id].correct++;
  setStore(STATS_KEY, stats);

  let wrongIds = getStore(WRONG_KEY, []);
  if (isCorrect) {
    wrongIds = wrongIds.filter(id => id !== q.id);
  } else if (!wrongIds.includes(q.id)) {
    wrongIds.push(q.id);
    wrongInSession.push(q);
  }
  setStore(WRONG_KEY, wrongIds);
}

function startQuiz(nextMode = "normal"){
  questions = makeQuestionSet(nextMode);
  currentIndex = 0;
  score = 0;
  answered = false;
  wrongInSession = [];
  showQuestion();
  renderAnalysis();
}

function showQuestion() {
  answered = false;
  resultEl.textContent = "";
  nextBtn.style.display = "none";
  metaEl.textContent = "";

  if (questions.length === 0) {
    questionEl.textContent = "問題データが読み込めませんでした。復習モードの場合は、まず通常問題を解いてください。";
    choicesEl.innerHTML = "";
    counter.textContent = "0 / 0";
    scoreEl.textContent = "スコア: 0";
    progressBar.style.width = "0%";
    return;
  }

  if (currentIndex >= questions.length) {
    const rate = Math.round((score / questions.length) * 100);
    questionEl.textContent = "終了！";
    choicesEl.innerHTML = "";
    counter.textContent = `${questions.length} / ${questions.length}`;
    scoreEl.textContent = `スコア: ${score}`;
    resultEl.innerHTML = `${questions.length}問中 ${score}問正解（正答率${rate}%）<br>${wrongInSession.length ? "間違えた問題は復習リストに保存しました。" : "すばらしいです。復習対象はありません。"}`;
    progressBar.style.width = "100%";
    renderAnalysis();
    return;
  }

  const q = questions[currentIndex];
  counter.textContent = `${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `スコア: ${score}`;
  metaEl.textContent = `${q.university} / ${q.faculty} / ${q.subject} / ${q.skill}`;
  questionEl.textContent = q.question;
  progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  choicesEl.innerHTML = "";

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => {
      if (answered) return;
      answered = true;
      const isCorrect = choice === q.answer;
      if (isCorrect) {
        score++;
        resultEl.textContent = "正解！";
        btn.classList.add("correct");
      } else {
        resultEl.textContent = `不正解。正解は「${q.answer}」`;
        btn.classList.add("wrong");
      }
      saveAnswer(q, isCorrect);
      [...choicesEl.children].forEach(b => {
        b.disabled = true;
        if (b.textContent === q.answer) b.classList.add("correct");
      });
      resultEl.textContent += ` ${q.explanation} AI解説: ${q.aiHint}`;
      scoreEl.textContent = `スコア: ${score}`;
      setTimeout(() => {
        currentIndex++;
        showQuestion();
      }, 1300);
    };
    choicesEl.appendChild(btn);
  });
}

nextBtn.onclick = () => { currentIndex++; showQuestion(); };
reviewBtn.onclick = () => startQuiz("review");
resetBtn.onclick = () => {
  localStorage.removeItem(WRONG_KEY);
  localStorage.removeItem(STATS_KEY);
  renderAnalysis();
  startQuiz("normal");
};

updateHeader();
renderNav();
setupFacultySelect();
startQuiz(mode);
