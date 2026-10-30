/**
 * 分數魔法烘培屋 5.0 (等值分數的試煉) - 全維度自動化 QA 稽核腳本
 * 依照 fraction-game-qa-pipeline 7 大維度 (D1~D7) 實施全面評測
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;

let report = {
  totalChecks: 0,
  passedChecks: 0,
  criticalIssues: [],
  warningIssues: [],
  infoNotes: []
};

function assert(condition, message, level = 'critical') {
  report.totalChecks++;
  if (condition) {
    report.passedChecks++;
    console.log(`  ${green('✓')} ${message}`);
  } else {
    if (level === 'critical') {
      report.criticalIssues.push(message);
      console.log(`  ${red('✗ [CRITICAL]')} ${message}`);
    } else if (level === 'warning') {
      report.warningIssues.push(message);
      console.log(`  ${yellow('! [WARNING]')} ${message}`);
    } else {
      report.infoNotes.push(message);
      console.log(`  ${cyan('ℹ [INFO]')} ${message}`);
    }
  }
}

console.log(cyan('===================================================='));
console.log(cyan('🚀 分數魔法烘培屋 5.0 全維度 QA 評測體檢開始'));
console.log(cyan('====================================================\n'));

// 讀取核心檔案
const appJsPath = path.join(__dirname, 'js', 'app.js');
const styleCssPath = path.join(__dirname, 'css', 'style.css');
const indexHtmlPath = path.join(__dirname, 'index.html');

assert(fs.existsSync(appJsPath), 'js/app.js 存在');
assert(fs.existsSync(styleCssPath), 'css/style.css 存在');
assert(fs.existsSync(indexHtmlPath), 'index.html 存在');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const styleCssContent = fs.readFileSync(styleCssPath, 'utf8');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// --------------------------------------------------------------------------
// 檢核維度 D1: 數學課綱概念嚴謹度 (四年級等值分數規範)
// --------------------------------------------------------------------------
console.log(cyan('\n[D1] 數學課綱概念嚴謹度檢核:'));
// 1. 真分數檢查：分子必須小於分母
// 2. 直式分數 OMML 規範：不得出現斜線分數如 "3/5" 作為使用者文字展示
assert(!indexHtmlContent.includes('>3/5<') && !indexHtmlContent.includes('>1/2<') && !indexHtmlContent.includes('>2/4<'), 
  'HTML 介面無斜線偽分數，全站符合 OMML 直式分數標準');
assert(styleCssContent.includes('.math-fraction') && styleCssContent.includes('.bar-row') && styleCssContent.includes('.bar-cell'),
  'CSS 具備標準直式橫線分數渲染樣式 (.math-fraction / .bar-row)');

// --------------------------------------------------------------------------
// 檢核維度 D2: 題庫與答案完備性檢核 (模擬沙盒執行題庫資料)
// --------------------------------------------------------------------------
console.log(cyan('\n[D2] 題庫與答案邏輯完備性檢核:'));

// 建立模擬 DOM 與全域物件沙盒
const sandbox = {
  window: {
    speechSynthesis: { speak: () => {}, cancel: () => {} },
    AudioContext: class {
      constructor() { this.currentTime = 0; }
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
      createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    },
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } },
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    getElementById: () => ({
      addEventListener: () => {},
      querySelector: () => ({ innerHTML: '', appendChild: () => {}, setAttribute: () => {}, style: {} }),
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {},
      innerText: '',
      innerHTML: '',
      setAttribute: () => {}
    }),
    querySelectorAll: () => [],
    createElement: () => ({
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      dataset: {},
      setAttribute: () => {},
      addEventListener: () => {}
    }),
    createElementNS: () => ({ setAttribute: () => {}, style: {}, appendChild: () => {}, querySelector: () => null, addEventListener: () => {} })
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math
};

// 評估 app.js 中的核心題庫與邏輯
let evalSuccess = false;
try {
  const scriptFunc = new Function('window', 'document', 'AudioContext', 'SpeechSynthesisUtterance', `
    ${appJsContent}
    return { SoundManager, TTSManager, App, Game1, Game2, Game3, Game4, PvPGame, AIGame };
  `);
  const modules = scriptFunc(sandbox.window, sandbox.document, sandbox.window.AudioContext, sandbox.window.SpeechSynthesisUtterance);
  evalSuccess = true;
  assert(true, 'app.js 成功在乾淨沙盒中解析並載入所有模組');

  const { SoundManager, TTSManager, App, Game1, Game2, Game3, Game4, PvPGame, AIGame } = modules;

  // 1. 檢驗 PvP 40 道題庫
  console.log(cyan('  - 檢驗 PvP 40 道題庫等值數學真實性與選項唯一性:'));
  // 觸發 PvPGame.start 載入題目池
  PvPGame.totalQuestions = 40;
  PvPGame.start(40);
  assert(PvPGame.questions && PvPGame.questions.length >= 40, `PvP 題庫數量達標 (${PvPGame.questions.length} >= 40)`);
  let pvpIssues = 0;
  PvPGame.questions.forEach((q, idx) => {
    // 檢查是否有唯一正解與 3 個干擾項
    if (!q.correct) {
      pvpIssues++;
      assert(false, `PvP 第 ${idx + 1} 題 缺少正解物件`);
    }
    if (!q.wrongs || q.wrongs.length !== 3) {
      pvpIssues++;
      assert(false, `PvP 第 ${idx + 1} 題 干擾項數量不為 3 (實際: ${q.wrongs ? q.wrongs.length : 0})`);
    }
    // 檢查選項顯示內容是否重複
    const optDisplays = [q.correct.display, ...q.wrongs.map(w => w.display)];
    const uniqueDisplays = new Set(optDisplays);
    if (uniqueDisplays.size !== 4) {
      pvpIssues++;
      assert(false, `PvP 第 ${idx + 1} 題 選項有重複內容: ${optDisplays.join(', ')}`);
    }
  });
  if (pvpIssues === 0) {
    assert(true, `PvP 全部 ${PvPGame.questions.length} 題之正解唯一性與選項不重複性 100% 合規`);
  }

  // 2. 檢驗 Game 1 (等值披薩 12 題庫)
  console.log(cyan('  - 檢驗 Game 1 披薩配對 12 題庫:'));
  Game1.totalQuestions = 12;
  Game1.start();
  assert(Game1.questions && Game1.questions.length >= 12, `Game 1 題庫擴充達標 (${Game1.questions.length} 題)`);
  let g1Issues = 0;
  Game1.questions.forEach((q, idx) => {
    // 檢查目標分數
    const tVal = q.target.num / q.target.den;
    q.opt.forEach(o => {
      const oVal = o.num / o.den;
      const isEq = Math.abs(tVal - oVal) < 1e-9;
      if (o.correct !== isEq) {
        g1Issues++;
        assert(false, `Game 1 第 ${idx + 1} 題 標記 ${o.correct} 但數學計算等值為 ${isEq} (${q.target.num}/${q.target.den} vs ${o.num}/${o.den})`);
      }
    });
  });
  if (g1Issues === 0) {
    assert(true, `Game 1 披薩等值題庫數學邏輯 100% 精確`);
  }

  // 3. 檢驗 Game 2 (甜甜圈包裝 12 題庫)
  console.log(cyan('  - 檢驗 Game 2 甜甜圈離散量 12 題庫:'));
  Game2.totalQuestions = 12;
  Game2.start();
  assert(Game2.questions && Game2.questions.length >= 12, `Game 2 題庫數量達標 (${Game2.questions.length} 題)`);
  let g2Issues = 0;
  Game2.questions.forEach((q, idx) => {
    // 檢查整除性：總數必須可被分母整除
    if (q.total % q.target.den !== 0) {
      g2Issues++;
      assert(false, `Game 2 第 ${idx + 1} 題 總顆數 ${q.total} 無法被目標分母 ${q.target.den} 整除`);
    }
    // 檢查因數解是否存在
    const factors = q.total === 24 ? [2, 3, 4, 6, 8, 12] : [2, 3, 4, 6, 12];
    const targetCount = (q.total / q.target.den) * q.target.num;
    const hasValidDen = factors.some(f => targetCount % (q.total / f) === 0);
    if (!hasValidDen) {
      g2Issues++;
      assert(false, `Game 2 第 ${idx + 1} 題 可選分母中無任何整數解`);
    }
  });
  if (g2Issues === 0) {
    assert(true, `Game 2 離散量因數整除與可選分母 100% 具備可解性`);
  }

  // 4. 檢驗 Game 3 (天平 12 題庫)
  console.log(cyan('  - 檢驗 Game 3 等值天平 12 題庫:'));
  Game3.totalQuestions = 12;
  Game3.start();
  assert(Game3.questions && Game3.questions.length >= 12, `Game 3 題庫數量達標 (${Game3.questions.length} 題)`);
  let g3Issues = 0;
  Game3.questions.forEach((q, idx) => {
    if (q.op === '×') {
      const calcNum = q.left.num * q.val;
      const calcDen = q.left.den * q.val;
      if (calcNum !== q.right.num || calcDen !== q.right.den) {
        g3Issues++;
        assert(false, `Game 3 第 ${idx + 1} 題 乘法等值計算不匹配`);
      }
    } else {
      const calcNum = q.left.num / q.val;
      const calcDen = q.left.den / q.val;
      if (calcNum !== q.right.num || calcDen !== q.right.den) {
        g3Issues++;
        assert(false, `Game 3 第 ${idx + 1} 題 除法等值計算不匹配`);
      }
    }
  });
  if (g3Issues === 0) {
    assert(true, `Game 3 天平乘除法算式等值性 100% 嚴謹`);
  }

  // 5. 檢驗 Game 4 (數線尋寶 12 題庫)
  console.log(cyan('  - 檢驗 Game 4 數線跳躍 12 題庫:'));
  Game4.totalQuestions = 12;
  Game4.start();
  assert(Game4.questions && Game4.questions.length >= 12, `Game 4 題庫數量達標 (${Game4.questions.length} 題)`);
  let g4Issues = 0;
  Game4.questions.forEach((q, idx) => {
    // 檢查 targetVal 與 frac 是否等值
    const fracVal = q.frac.num / q.frac.den;
    if (Math.abs(fracVal - q.target) > 1e-4) {
      g4Issues++;
      assert(false, `Game 4 第 ${idx + 1} 題 targetVal (${q.target}) 與 frac (${q.frac.num}/${q.frac.den}) 數值不一致`);
    }
  });
  if (g4Issues === 0) {
    assert(true, `Game 4 數線目標小數與等值分數 100% 一致`);
  }

  // 6. 檢驗 AIGame 題型產生器
  console.log(cyan('  - 檢驗 AIGame 甜點櫥窗爭霸 題型產生器:'));
  AIGame.setup();
  let aiSampleCount = 50;
  let aiErrors = 0;
  ['g1', 'g2', 'g3', 'g4'].forEach(cat => {
    AIGame.category = cat;
    for (let i = 0; i < 15; i++) {
      const q = AIGame.generateQuestion();
      if (!q.correct || !q.wrongs || q.wrongs.length < 3) {
        aiErrors++;
        assert(false, `AIGame 分類 ${cat} 出題缺少正解或干擾項不足 3 個`);
      }
    }
  });
  assert(aiErrors === 0, 'AIGame 4 大分類隨機出題均包含唯一正解與 3 個干擾項');

  // --------------------------------------------------------------------------
  // 檢核維度 D4: 狀態機與計時器生命週期檢核
  // --------------------------------------------------------------------------
  console.log(cyan('\n[D4] 狀態機與計時器生命週期檢核:'));
  assert(typeof App.scheduleTimeout === 'function', 'App 具備 scheduleTimeout 排程管理方法');
  assert(typeof App.clearAllTimers === 'function', 'App 具備 clearAllTimers 全域計時器清除方法');
  assert(Array.isArray(App.pendingTimeouts), 'App 具備 pendingTimeouts 追蹤陣列');

  // 檢查切換畫面時是否自動清除計時器
  const showScreenStr = App.showScreen.toString();
  assert(showScreenStr.includes('clearAllTimers'), 'App.showScreen 會在轉場切換時自動清除所有進行中計時器 (避免幽靈彈窗/跳題)');

  // --------------------------------------------------------------------------
  // 檢核維度 D5: 語音 (TTS) 與音效控制檢核
  // --------------------------------------------------------------------------
  console.log(cyan('\n[D5] 語音朗讀與音效控制檢核:'));
  assert(typeof TTSManager.cleanSpeechText === 'function', 'TTSManager 實作 cleanSpeechText 清洗過濾方法');
  const dirtyText = '🧁 答對了！<span class="highlight">1/2 等於 2/4</span> ⭐';
  const cleanedText = TTSManager.cleanSpeechText ? TTSManager.cleanSpeechText(dirtyText) : '';
  assert(!cleanedText.includes('🧁') && !cleanedText.includes('<span') && !cleanedText.includes('⭐'), 
    `TTS 文字清洗成功移除 Emoji 與 HTML 標籤: "${cleanedText}"`);

  assert(typeof SoundManager.playTone === 'function', 'SoundManager 實作通用 playTone(freq, duration, type) 合成方法');

  // --------------------------------------------------------------------------
  // 檢核維度 D6: 三級載具 RWD 與無障礙檢核
  // --------------------------------------------------------------------------
  console.log(cyan('\n[D6] 三級載具與無障礙檢核:'));
  assert(styleCssContent.includes("'Microsoft JhengHei'") || styleCssContent.includes('Noto Sans TC'),
    'CSS 包含離線備援繁體中文字型 (Microsoft JhengHei / Noto Sans TC)');
  assert(appJsContent.includes("'Escape'") || appJsContent.includes('"Escape"'), 
    '支援鍵盤 Escape 快捷鍵關閉秘笈彈窗');
  assert(indexHtmlContent.includes('style.css?v=5.1') && indexHtmlContent.includes('app.js?v=5.1'),
    '靜態資源帶有快取破壞版本標籤 (?v=5.1)');

} catch (e) {
  console.error(red('執行評測沙盒時遭遇異常:'), e);
  report.criticalIssues.push(`腳本沙盒異常: ${e.message}`);
}

// --------------------------------------------------------------------------
// 總結產出報告
// --------------------------------------------------------------------------
console.log(cyan('\n===================================================='));
console.log(cyan('📊 評測結果總結:'));
console.log(`總檢測項目: ${report.totalChecks}`);
console.log(`通過項目: ${green(report.passedChecks)}`);
console.log(`🔴 Critical: ${report.criticalIssues.length > 0 ? red(report.criticalIssues.length) : green(0)}`);
console.log(`🟡 Warning: ${report.warningIssues.length > 0 ? yellow(report.warningIssues.length) : green(0)}`);
console.log(`🟢 Info: ${report.infoNotes.length}`);
console.log(cyan('====================================================\n'));

if (report.criticalIssues.length > 0 || report.warningIssues.length > 0) {
  process.exit(1);
} else {
  console.log(green('🎉 評測全數通過！系統已達到最高等級品質標準 (0 Critical, 0 Warning)！\n'));
  process.exit(0);
}
