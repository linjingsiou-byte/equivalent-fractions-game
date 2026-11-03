/**
 * 國小數學互動遊戲：雙人對決標準規範手冊 (DUEL_BATTLE_STANDARD_SPEC) 檢驗腳本
 */

const fs = require('fs');
const path = require('path');

const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;

let passed = 0;
let total = 0;

function check(desc, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ${green('✓')} ${desc}`);
  } else {
    console.log(`  ${red('✗')} ${desc}`);
  }
}

console.log(cyan('===================================================='));
console.log(cyan('⚔️ DUEL_BATTLE_STANDARD_SPEC 雙人對決規格手冊驗證開始'));
console.log(cyan('====================================================\n'));

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');

// 1. 官方正式三步驟文案檢驗
console.log(cyan('[1] 官方正式三步驟賽制文案檢驗:'));
check('秘笈彈窗精確包含「3 秒讀題思考」', indexHtml.includes('3 秒讀題思考</strong>：每回合出題時有 3 秒讀題倒數緩衝'));
check('秘笈彈窗精確包含「極速搶答爭奪」', indexHtml.includes('極速搶答爭奪</strong>：倒數結束響起開搶提示音後開放作答'));
check('秘笈彈窗精確包含「率先答對獲勝」', indexHtml.includes('率先答對獲勝</strong>：最先算對並成功提交'));

check('對決設定卡片具備 .duel-special-rules', indexHtml.includes('class="duel-special-rules"'));
check('對決設定卡片具備 3 秒讀題思考 rule-tag', indexHtml.includes('3 秒讀題思考</strong>：每回合出題先進行 3 秒讀題倒數緩衝'));
check('對決設定卡片具備 極速搶答爭奪 rule-tag', indexHtml.includes('極速搶答爭奪</strong>：開搶提示音響起後立即開放作答'));
check('對決設定卡片具備 率先達標獲勝 rule-tag', indexHtml.includes('率先達標獲勝</strong>：率先完成指定挑戰題數'));

// 2. 對戰頂部狀態指示列
console.log(cyan('\n[2] 對戰頂部狀態指示列與回饋檢驗:'));
check('HTML 包含 #battle-status-bar、#battle-status-icon、#battle-status-timer', 
  indexHtml.includes('id="battle-status-bar"') && indexHtml.includes('id="battle-status-icon"') && indexHtml.includes('id="battle-status-timer"'));
check('思考階段預設文案包含「仔細看題思考中...」與「秒後開放作答！」',
  appJs.includes('仔細看題思考中... <strong id="battle-status-timer">') && appJs.includes('秒後開放作答！'));
check('思考期防偷跑警示文案符合手冊「⏳ 請先讀題思考喔！倒數結束後才開放作答！」',
  appJs.includes('⏳ 請先讀題思考喔！倒數結束後才開放作答！'));
check('開搶瞬間切換為「⚡ <strong>競速開始！</strong>快找出等值分數搶先按下！」',
  appJs.includes('⚡ <strong>競速開始！</strong>'));
check('得分瞬間狀態列更新為「搶先答對！+10 分 🎯」',
  appJs.includes('搶先答對！+10 分 🎯'));

// 3. 防偷跑鎖定、震動與開搶提示音
console.log(cyan('\n[3] 防偷跑鎖定、震動與開搶提示音檢驗:'));
check('冷卻鎖定樣式包含 ::after 標籤「⏳ 思考時間・鎖定中」', styleCss.includes('⏳ 思考時間・鎖定中'));
check('冷卻樣式包含 .pvp-player-panel.cooling', styleCss.includes('.pvp-player-panel.cooling'));
check('偷跑晃動動畫 @keyframes shakeWarn 存在', styleCss.includes('@keyframes shakeWarn'));
check('.shake-warn 帶有紅色警告邊框與光暈 (#ef476f)', 
  styleCss.includes('border-color: #ef476f') && styleCss.includes('rgba(239, 71, 111'));
check('PvPGame 實作 bindPanelInterceptors 面板層級 Capture 攔截防偷跑',
  appJs.includes('bindPanelInterceptors()') && appJs.includes('this.triggerBattleSideShake(player)'));
check('開搶時調用 SoundManager.playBuzzerOpen()', appJs.includes('SoundManager.playBuzzerOpen()'));
check('偷按阻擋時調用 SoundManager.playSoftClick()', appJs.includes('SoundManager.playSoftClick()'));

// 4. 字型與直式橫線分數標準
console.log(cyan('\n[4] 字型規範與直式橫線分數標準檢驗:'));
check('.duel-special-rules .rule-tag 字型大小符合 >= 12pt (0.95rem/15.2px~16px)',
  styleCss.includes('font-size: 0.95rem;') || styleCss.includes('font-size: 1rem;'));
check('.battle-status-bar 字型大小符合 >= 12pt (1.15rem)',
  styleCss.includes('font-size: 1.15rem;'));
check('PvP 選項與題目皆採用直式橫線分數渲染 (.bar-row, .bar-cell)',
  appJs.includes('span class="bar-row"><span class="bar-cell"></span></span>') &&
  styleCss.includes('.bar-row') && styleCss.includes('.bar-cell'));

console.log(cyan('\n===================================================='));
console.log(cyan(`📊 規格驗證結果: ${passed} / ${total} 通過`));
console.log(cyan('====================================================\n'));

if (passed === total) {
  console.log(green('🎉 恭喜！本專案雙人對決模式 100% 完美對齊 DUEL_BATTLE_STANDARD_SPEC 標準手冊！\n'));
  process.exit(0);
} else {
  console.log(red('❌ 尚有未完全符合之項目，請檢查上述清單。\n'));
  process.exit(1);
}
