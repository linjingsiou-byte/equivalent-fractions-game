/* ==========================================================================
   分數魔法烘焙屋 4.0 (等值分數的試煉) - 遊戲邏輯與交互實現
   ========================================================================== */

// 1. 音效管理器 (SoundManager) - 使用 Web Audio API 原生合成音效
const SoundManager = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("AudioContext playback failed", e);
    }
  },

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle';
      // C5 -> E5 -> G5 -> C6 琶音
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  },

  playWrong() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  },

  playCheer() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.7);
      });
    } catch (e) {}
  }
};

// 2. 語音朗讀管理器 (TTSManager) - 整合 Web Speech API
const TTSManager = {
  enabled: false,

  speak(text) {
    if (!this.enabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      utterance.pitch = 1.1; // 稍微高一點，聽起來更活潑
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS playback failed", e);
    }
  },

  // 將分數轉換成適合發音的中文 (例如 2/3 -> 三分之二)
  fractionToText(num, den) {
    return `${this.numberToChinese(den)}分之${this.numberToChinese(num)}`;
  },

  numberToChinese(num) {
    const map = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十"];
    return map[num] || num.toString();
  }
};

// 3. 歡慶五彩碎紙效果 (Confetti Effect)
const Confetti = {
  active: false,
  canvas: null,
  ctx: null,
  particles: [],
  colors: ['#FF8A80', '#FFD700', '#A5D6A7', '#7DD4E8', '#D1C4E9', '#FF4081', '#00E676'],

  init() {
    this.canvas = document.getElementById('celebration-confetti-container');
    if (!this.canvas) return;
    
    // 將 container 轉為 canvas，若尚未建立 canvas 則插入
    let canvasEl = this.canvas.querySelector('canvas');
    if (!canvasEl) {
      canvasEl = document.createElement('canvas');
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      canvasEl.style.display = 'block';
      this.canvas.appendChild(canvasEl);
    }
    this.ctx = canvasEl.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    const canvasEl = this.canvas.querySelector('canvas');
    if (canvasEl) {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    }
  },

  start() {
    this.init();
    this.particles = [];
    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -window.innerHeight - 20,
        r: Math.random() * 6 + 4,
        d: Math.random() * window.innerHeight,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }
    this.active = true;
    this.animate();
    setTimeout(() => { this.active = false; }, 3000); // 3秒後停止產生/動畫
  },

  animate() {
    if (!this.active) {
      if (this.ctx) this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let remaining = false;

    this.particles.forEach(p => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 15;

      if (p.y <= window.innerHeight) {
        remaining = true;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    });

    if (remaining) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.active = false;
    }
  }
};

// 4. SVG 繪圖輔助函數 (SVG Drawing Helpers)
const SVGDrawer = {
  // 建立 SVG 命名空間的元素
  createSVGNode(type, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let key in attrs) {
      node.setAttribute(key, attrs[key]);
    }
    return node;
  },

  // 繪製圓形切割蛋糕
  drawCircleFraction(svgEl, den, num, colorFilled = "#FF8A80", colorEmpty = "#FFFFFF") {
    svgEl.innerHTML = "";
    const cx = 140, cy = 140, r = 110;
    
    // 繪製底圓
    const bgCircle = this.createSVGNode("circle", {
      cx: cx, cy: cy, r: r,
      fill: colorEmpty,
      stroke: "#8D6E63",
      "stroke-width": 3
    });
    svgEl.appendChild(bgCircle);

    const anglePerPart = 360 / den;
    
    // 繪製著色扇形
    for (let i = 0; i < num; i++) {
      const startAngle = -90 + i * anglePerPart;
      const endAngle = startAngle + anglePerPart;
      
      const rad1 = (startAngle * Math.PI) / 180;
      const rad2 = (endAngle * Math.PI) / 180;
      
      const x1 = cx + r * Math.cos(rad1);
      const y1 = cy + r * Math.sin(rad1);
      const x2 = cx + r * Math.cos(rad2);
      const y2 = cy + r * Math.sin(rad2);
      
      const largeArc = anglePerPart > 180 ? 1 : 0;
      
      // 扇形路徑
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      const sector = this.createSVGNode("path", {
        d: pathData,
        fill: colorFilled,
        stroke: "#8D6E63",
        "stroke-width": 1.5
      });
      svgEl.appendChild(sector);
    }

    // 繪製所有的分割細線
    for (let i = 0; i < den; i++) {
      const angle = -90 + i * anglePerPart;
      const rad = (angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      
      const line = this.createSVGNode("line", {
        x1: cx, y1: cy, x2: x, y2: y,
        stroke: "#BCAAA4",
        "stroke-dasharray": "3,3",
        "stroke-width": 2
      });
      svgEl.appendChild(line);
    }
  },

  // 繪製長條形巧克力
  drawRectFraction(svgEl, den, num, colorFilled = "#FF8A80", colorEmpty = "#FFFFFF") {
    svgEl.innerHTML = "";
    const xOffset = 20, yOffset = 90;
    const totalW = 240, totalH = 100;
    
    // 底矩形
    const bgRect = this.createSVGNode("rect", {
      x: xOffset, y: yOffset, width: totalW, height: totalH,
      rx: 8, ry: 8,
      fill: colorEmpty,
      stroke: "#8D6E63",
      "stroke-width": 3
    });
    svgEl.appendChild(bgRect);

    const stepW = totalW / den;

    // 繪製各等分
    for (let i = 0; i < den; i++) {
      const x = xOffset + i * stepW;
      const isFilled = i < num;
      
      // 若是著色部分，畫實心矩形，注意圓角只適用於最左和最右
      const rx = (i === 0) ? 8 : 0;
      const ry = (i === 0) ? 8 : 0;
      
      const partRect = this.createSVGNode("rect", {
        x: x, y: yOffset, width: stepW, height: totalH,
        fill: isFilled ? colorFilled : "transparent",
        stroke: "none"
      });
      svgEl.appendChild(partRect);
      
      // 繪製分割線 (最後一條線不畫)
      if (i > 0) {
        const line = this.createSVGNode("line", {
          x1: x, y1: yOffset, x2: x, y2: yOffset + totalH,
          stroke: "#8D6E63",
          "stroke-dasharray": "3,3",
          "stroke-width": 2
        });
        svgEl.appendChild(line);
      }
    }
    
    // 再畫一次外框描邊，覆蓋邊緣
    const borderRect = this.createSVGNode("rect", {
      x: xOffset, y: yOffset, width: totalW, height: totalH,
      rx: 8, ry: 8,
      fill: "none",
      stroke: "#8D6E63",
      "stroke-width": 3
    });
    svgEl.appendChild(borderRect);
  },

  // 繪製離散量糖果盒 (點心禮盒)
  drawCandyFraction(svgEl, totalCandies, den, num, selectedGroups = [], interactive = false, onGroupClick = null) {
    svgEl.innerHTML = "";
    
    const h = 200;
    const candiesPerGroup = totalCandies / den;
    
    // 糖果大小設定
    const radius = 13;
    const spacingX = 33;
    const startX = 20;
    
    // 計算總列數以決定 viewBox 寬度
    let colsPerGroup = 1;
    if (totalCandies === 12) {
      colsPerGroup = candiesPerGroup;
    } else {
      colsPerGroup = Math.ceil(candiesPerGroup / 2);
      if (candiesPerGroup === 1) colsPerGroup = 1;
    }
    const totalCols = den * colsPerGroup;
    const requiredW = startX + totalCols * spacingX + 20;
    svgEl.setAttribute("viewBox", `0 0 ${requiredW} ${h}`);
    
    if (totalCandies === 12) {
      // 12顆排成 1 排。
      // 每組寬度 = candiesPerGroup * spacingX
      const y = 100;
      const groupWidth = candiesPerGroup * spacingX;
      
      // 先繪製各組的虛線框
      for (let g = 0; g < den; g++) {
        const isGroupSelected = selectedGroups.includes(g) || g < num; // 探索區是 g < num, 關卡二是點選
        const gX = startX + g * groupWidth;
        
        const groupBorder = this.createSVGNode("rect", {
          x: gX - 10,
          y: y - 25,
          width: groupWidth + 13, // 修正寬度，確保完好的框住最右側的馬卡龍
          height: 50,
          rx: 10,
          ry: 10,
          fill: isGroupSelected ? "rgba(255, 224, 130, 0.15)" : "transparent",
          stroke: isGroupSelected ? "#FF8A80" : "#BCAAA4",
          "stroke-width": isGroupSelected ? 3 : 2,
          "stroke-dasharray": isGroupSelected ? "none" : "5,5",
          style: interactive ? "cursor: pointer;" : ""
        });
        
        if (interactive && onGroupClick) {
          groupBorder.addEventListener("click", () => onGroupClick(g));
        }
        svgEl.appendChild(groupBorder);
        
        // 繪製這組裡面的糖果
        for (let c = 0; c < candiesPerGroup; c++) {
          const cIdx = g * candiesPerGroup + c;
          const cx = gX + c * spacingX + radius;
          
          // 畫一顆馬卡龍
          this.drawSingleCandy(svgEl, cx, y, radius, isGroupSelected, interactive, g, onGroupClick);
        }
      }
    } else {
      // 24顆排成 2 排，每排 12 顆。
      // 當分成 den 組，每組有 candiesPerGroup 顆糖果。
      // 為了美觀，我們將 24 顆糖果排成 2 排。
      // 每組佔據的寬度為 (candiesPerGroup / 2) * spacingX。
      // 這裡假設 candiesPerGroup 是偶數 (由於 den 限制為 24 的因數 2, 3, 4, 6, 8, 12，除了 den=24 外，每組都是偶數。
      // 為了簡化，如果 candiesPerGroup 是一顆，就只佔半格；若是偶數，排成兩排)。
      
      const y1 = 70;
      const y2 = 130;
      
      const groupWidth = colsPerGroup * spacingX;
      
      for (let g = 0; g < den; g++) {
        const isGroupSelected = selectedGroups.includes(g) || g < num;
        const gX = startX + g * groupWidth;
        
        // 組框 (包含兩排糖果的高度)
        const groupBorder = this.createSVGNode("rect", {
          x: gX - 10,
          y: y1 - 25,
          width: groupWidth + 13, // 修正寬度，確保完好的框住最右側的馬卡龍
          height: 110,
          rx: 12,
          ry: 12,
          fill: isGroupSelected ? "rgba(255, 224, 130, 0.15)" : "transparent",
          stroke: isGroupSelected ? "#FF8A80" : "#BCAAA4",
          "stroke-width": isGroupSelected ? 3 : 2,
          "stroke-dasharray": isGroupSelected ? "none" : "5,5",
          style: interactive ? "cursor: pointer;" : ""
        });
        
        if (interactive && onGroupClick) {
          groupBorder.addEventListener("click", () => onGroupClick(g));
        }
        svgEl.appendChild(groupBorder);
        
        // 繪製組內糖果
        for (let c = 0; c < candiesPerGroup; c++) {
          // 排成 2 排：第一排先排，放滿再放第二排
          const row = c % 2;
          const col = Math.floor(c / 2);
          
          const cx = gX + col * spacingX + radius;
          const cy = (row === 0) ? y1 : y2;
          
          this.drawSingleCandy(svgEl, cx, cy, radius, isGroupSelected, interactive, g, onGroupClick);
        }
      }
    }
  },

  // 繪製一顆精美馬卡龍 (Macaron)
  drawSingleCandy(svgEl, cx, cy, r, isActive, interactive, groupIdx, onClick) {
    const mainColor = isActive ? "#FF8A80" : "#E0E0E0";
    const creamColor = "#FFFFFF";
    const shadowColor = "rgba(0,0,0,0.06)";

    // 下層陰影
    const shadow = this.createSVGNode("ellipse", {
      cx: cx, cy: cy + 3, rx: r, ry: r - 4,
      fill: shadowColor
    });
    svgEl.appendChild(shadow);

    // 馬卡龍上半殼
    const topShell = this.createSVGNode("path", {
      d: `M ${cx - r} ${cy} A ${r} ${r - 3} 0 0 1 ${cx + r} ${cy} Z`,
      fill: mainColor,
      stroke: "#8D6E63",
      "stroke-width": 1.5,
      style: interactive ? "cursor: pointer;" : ""
    });
    
    // 馬卡龍下半殼
    const bottomShell = this.createSVGNode("path", {
      d: `M ${cx - r} ${cy} A ${r} ${r - 3} 0 0 0 ${cx + r} ${cy} Z`,
      fill: mainColor,
      stroke: "#8D6E63",
      "stroke-width": 1.5,
      style: interactive ? "cursor: pointer;" : ""
    });

    // 中間奶油夾心
    const cream = this.createSVGNode("rect", {
      x: cx - r + 3,
      y: cy - 2,
      width: (r - 3) * 2,
      height: 4,
      rx: 2,
      ry: 2,
      fill: creamColor,
      stroke: "#8D6E63",
      "stroke-width": 1,
      style: interactive ? "cursor: pointer;" : ""
    });

    if (interactive && onClick) {
      [topShell, bottomShell, cream].forEach(el => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onClick(groupIdx);
        });
      });
    }

    svgEl.appendChild(bottomShell);
    svgEl.appendChild(cream);
    svgEl.appendChild(topShell);
  }
};

// 5. 畫面切換與核心應用程序邏輯 (Application State)
const App = {
  currentScreen: 'screen-welcome',
  gameMode: 'single', // 'single' | 'pvp'
  autoRead: false,

  init() {
    this.bindEvents();
    SoundManager.init();
    
    // 歡迎頁預設朗讀
    setTimeout(() => {
      TTSManager.speak("歡迎光臨分數魔法烘焙屋四點零！點選單人自主學習，或者雙人烘焙對決吧！");
    }, 800);
  },

  bindEvents() {
    // 模式按鈕
    document.getElementById('card-mode-single').addEventListener('click', () => {
      SoundManager.playClick();
      App.setGameMode('single');
      App.showScreen('screen-menu');
    });

    document.getElementById('card-mode-pvp').addEventListener('click', (e) => {
      if (e.target.closest('.pvp-rounds-selector')) {
        return; // 點擊選擇按鈕時，不直接啟動對戰
      }
      SoundManager.playClick();
      App.setGameMode('pvp');
      
      const activeBtn = document.querySelector('.round-select-btn.active');
      const rounds = activeBtn ? parseInt(activeBtn.dataset.rounds) : 30;
      PvPGame.start(rounds);
    });

    // 綁定雙人對戰題數選擇按鈕
    document.querySelectorAll('.round-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止起泡到卡片
        SoundManager.playClick();
        
        document.querySelectorAll('.round-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const rounds = parseInt(btn.dataset.rounds);
        const cnRounds = TTSManager.numberToChinese(rounds);
        TTSManager.speak(`對戰題數：${cnRounds}題呢！`);
      });
    });

    // 返回按鈕
    document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-welcome');
      TTSManager.speak("回到首頁");
    });

    document.querySelectorAll('.menu-back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SoundManager.playClick();
        App.showScreen('screen-menu');
      });
    });

    document.getElementById('btn-home-logo').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-welcome');
    });

    document.getElementById('btn-nav-home').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-menu');
    });

    // 音效與語音控制
    const btnAudio = document.getElementById('btn-toggle-audio');
    btnAudio.addEventListener('click', () => {
      SoundManager.enabled = !SoundManager.enabled;
      btnAudio.classList.toggle('active', SoundManager.enabled);
      btnAudio.querySelector('.btn-text').innerText = SoundManager.enabled ? "音效" : "靜音";
      SoundManager.playClick();
    });

    const btnRead = document.getElementById('btn-toggle-autoread');
    btnRead.addEventListener('click', () => {
      App.autoRead = !App.autoRead;
      TTSManager.enabled = App.autoRead;
      btnRead.classList.toggle('active', App.autoRead);
      btnRead.querySelector('.btn-text').innerText = App.autoRead ? "自動報讀: 開" : "自動報讀: 關";
      SoundManager.playClick();
    });

    // 選單關卡入口
    document.getElementById('menu-btn-explorer').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-explorer');
      Explorer.start();
    });

    document.getElementById('menu-btn-game1').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-game-1');
      Game1.start();
    });

    document.getElementById('menu-btn-game2').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-game-2');
      Game2.start();
    });

    document.getElementById('menu-btn-game3').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-game-3');
      Game3.start();
    });

    document.getElementById('menu-btn-game4').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-game-4');
      Game4.start();
    });

    document.getElementById('menu-btn-pvp').addEventListener('click', () => {
      SoundManager.playClick();
      PvPGame.start();
    });

    // 結算頁按鈕
    document.getElementById('btn-result-back').addEventListener('click', () => {
      SoundManager.playClick();
      App.showScreen('screen-menu');
    });
    
    document.getElementById('btn-result-restart').addEventListener('click', () => {
      SoundManager.playClick();
      // 重啟當前結束的關卡 (並正確切換至對應遊戲畫面)
      if (App.lastFinishedGame === 1) {
        App.showScreen('screen-game-1');
        Game1.start();
      } else if (App.lastFinishedGame === 2) {
        App.showScreen('screen-game-2');
        Game2.start();
      } else if (App.lastFinishedGame === 3) {
        App.showScreen('screen-game-3');
        Game3.start();
      } else if (App.lastFinishedGame === 4) {
        App.showScreen('screen-game-4');
        Game4.start();
      } else if (App.lastFinishedGame === 0) {
        // 重啟雙人對戰 (會內部自動 showScreen('screen-pvp'))
        PvPGame.start();
      } else {
        App.showScreen('screen-menu');
      }
    });
  },

  setGameMode(mode) {
    this.gameMode = mode;
    const badge = document.getElementById('player-mode-badge');
    const singleItems = document.querySelectorAll('.mode-single-only');
    const pvpItems = document.querySelectorAll('.mode-pvp-only');
    
    if (mode === 'single') {
      badge.innerText = "單人模式";
      badge.style.backgroundColor = "var(--color-cream)";
      badge.style.borderColor = "#FBC02D";
      singleItems.forEach(el => el.style.display = 'flex');
      pvpItems.forEach(el => el.style.display = 'none');
    } else {
      badge.innerText = "雙人模式";
      badge.style.backgroundColor = "#E0F7FA";
      badge.style.borderColor = "var(--color-accent-blue)";
      singleItems.forEach(el => el.style.display = 'none');
      pvpItems.forEach(el => el.style.display = 'flex');
    }
  },

  showScreen(screenId) {
    // 隱藏所有
    document.querySelectorAll('.game-screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // 顯示指定
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }

    // 更新導航選單按鈕
    const navBtn = document.getElementById('btn-nav-home');
    if (screenId === 'screen-welcome' || screenId === 'screen-menu') {
      navBtn.classList.add('hide');
    } else {
      navBtn.classList.remove('hide');
    }
  }
};

// ==========================================================================
// 6. 🔮 魔法探索區 (Concept Explorer Logic)
// ==========================================================================
const Explorer = {
  mode: 'continuous', // 'continuous' | 'discrete'
  shape: 'circle', // 'circle' | 'rect'
  continuousDen: 4,
  continuousNum: 1,
  
  discreteTotal: 12,
  discreteDen: 3,
  discreteNum: 1,

  start() {
    this.bindEvents();
    this.render();
    
    const introText = "進入魔法分數儀。你可以滑動拉桿來切割蛋糕，或是把糖果分組包裝，來觀察等值分數的秘密！";
    TTSManager.speak(introText);
  },

  bindEvents() {
    // 頁籤切換
    const tabCont = document.getElementById('btn-tab-continuous');
    const tabDisc = document.getElementById('btn-tab-discrete');
    const panelCont = document.getElementById('explorer-continuous-controls');
    const panelDisc = document.getElementById('explorer-discrete-controls');

    tabCont.onclick = () => {
      SoundManager.playClick();
      this.mode = 'continuous';
      tabCont.classList.add('active');
      tabDisc.classList.remove('active');
      panelCont.style.display = 'flex';
      panelDisc.style.display = 'none';
      this.render();
    };

    tabDisc.onclick = () => {
      SoundManager.playClick();
      this.mode = 'discrete';
      tabDisc.classList.add('active');
      tabCont.classList.remove('active');
      panelDisc.style.display = 'flex';
      panelCont.style.display = 'none';
      this.render();
    };

    // 連續量：圖形選擇
    const btnCircle = document.getElementById('btn-shape-circle');
    const btnRect = document.getElementById('btn-shape-rect');

    btnCircle.onclick = () => {
      SoundManager.playClick();
      this.shape = 'circle';
      btnCircle.classList.add('active');
      btnRect.classList.remove('active');
      this.render();
    };

    btnRect.onclick = () => {
      SoundManager.playClick();
      this.shape = 'rect';
      btnRect.classList.add('active');
      btnCircle.classList.remove('active');
      this.render();
    };

    // 連續量：分母分子拉桿
    const sliderDen = document.getElementById('explorer-den-slider');
    const sliderNum = document.getElementById('explorer-num-slider');
    
    sliderDen.oninput = (e) => {
      this.continuousDen = parseInt(e.target.value);
      // 確保分子不大於分母
      sliderNum.max = this.continuousDen;
      if (this.continuousNum > this.continuousDen) {
        this.continuousNum = this.continuousDen;
        sliderNum.value = this.continuousNum;
      }
      this.render();
    };

    sliderNum.oninput = (e) => {
      this.continuousNum = parseInt(e.target.value);
      this.render();
    };

    // 離散量：顆數選擇
    const btnCandy12 = document.getElementById('btn-candy-12');
    const btnCandy24 = document.getElementById('btn-candy-24');
    const sliderDiscDen = document.getElementById('explorer-discrete-den');
    const sliderDiscNum = document.getElementById('explorer-discrete-num');

    btnCandy12.onclick = () => {
      SoundManager.playClick();
      this.discreteTotal = 12;
      btnCandy12.classList.add('active');
      btnCandy24.classList.remove('active');
      
      // 更新分母拉桿最大值
      sliderDiscDen.max = 12;
      if (this.discreteDen > 12) this.discreteDen = 12;
      this.render();
    };

    btnCandy24.onclick = () => {
      SoundManager.playClick();
      this.discreteTotal = 24;
      btnCandy24.classList.add('active');
      btnCandy12.classList.remove('active');
      
      sliderDiscDen.max = 12; // 最大只分 12 組以防畫面太擠
      this.render();
    };

    // 離散量：分母分子拉桿
    sliderDiscDen.oninput = (e) => {
      let val = parseInt(e.target.value);
      // 離散量分母必須是顆數的因數，以便「平分」！
      // 若不是因數，我們尋找最近的因數
      const factors = this.getFactors(this.discreteTotal);
      val = this.getClosestFactor(val, factors);
      sliderDiscDen.value = val;
      this.discreteDen = val;

      sliderDiscNum.max = this.discreteDen;
      if (this.discreteNum > this.discreteDen) {
        this.discreteNum = this.discreteDen;
        sliderDiscNum.value = this.discreteNum;
      }
      this.render();
    };

    sliderDiscNum.oninput = (e) => {
      this.discreteNum = parseInt(e.target.value);
      this.render();
    };

    // 擴分與約分按鈕
    document.getElementById('btn-explorer-multiply').onclick = () => {
      SoundManager.playClick();
      this.applyEquivalentAction(2); // x2
    };

    document.getElementById('btn-explorer-divide').onclick = () => {
      SoundManager.playClick();
      this.applyEquivalentAction(0.5); // /2
    };

    // 朗讀按鈕
    document.getElementById('btn-explorer-speak').onclick = () => {
      this.speakCurrentSetup();
    };
  },

  getFactors(n) {
    const list = [];
    for (let i = 2; i <= n; i++) {
      if (n % i === 0 && i <= 12) list.push(i); // 限制在 12 以內
    }
    return list;
  },

  getClosestFactor(val, factors) {
    // 找出 factors 中與 val 差絕對值最小者
    return factors.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
  },

  // 點擊擴分或約分按鈕
  applyEquivalentAction(factor) {
    if (this.mode === 'continuous') {
      if (factor === 2) {
        if (this.continuousDen * 2 <= 16) {
          this.continuousDen *= 2;
          this.continuousNum *= 2;
          this.updateSliders();
          this.render();
          this.speakEquivalence(factor);
        } else {
          TTSManager.speak("分母太大囉！最大只能到十六分之幾喔！");
        }
      } else if (factor === 0.5) {
        if (this.continuousDen % 2 === 0 && this.continuousNum % 2 === 0) {
          this.continuousDen /= 2;
          this.continuousNum /= 2;
          this.updateSliders();
          this.render();
          this.speakEquivalence(factor);
        } else {
          TTSManager.speak("分子或分母不能被二整除，所以沒辦法約分喔！");
        }
      }
    } else {
      // 離散量
      if (factor === 2) {
        const nextDen = this.discreteDen * 2;
        if (nextDen <= 12 && this.discreteTotal % nextDen === 0) {
          this.discreteDen = nextDen;
          this.discreteNum *= 2;
          this.updateSliders();
          this.render();
          this.speakEquivalence(factor);
        } else {
          TTSManager.speak("沒辦法再平分成更多整數組囉！");
        }
      } else if (factor === 0.5) {
        if (this.discreteDen % 2 === 0 && this.discreteNum % 2 === 0) {
          this.discreteDen /= 2;
          this.discreteNum /= 2;
          this.updateSliders();
          this.render();
          this.speakEquivalence(factor);
        } else {
          TTSManager.speak("沒辦法約分囉！");
        }
      }
    }
  },

  updateSliders() {
    if (this.mode === 'continuous') {
      document.getElementById('explorer-den-slider').value = this.continuousDen;
      document.getElementById('explorer-num-slider').max = this.continuousDen;
      document.getElementById('explorer-num-slider').value = this.continuousNum;
    } else {
      document.getElementById('explorer-discrete-den').value = this.discreteDen;
      document.getElementById('explorer-discrete-num').max = this.discreteDen;
      document.getElementById('explorer-discrete-num').value = this.discreteNum;
    }
  },

  render() {
    const svgContainer = document.getElementById('explorer-svg-container');
    
    // 建立臨時的 SVG
    const svg = SVGDrawer.createSVGNode("svg", {
      width: "100%", height: "100%", viewBox: "0 0 280 280"
    });
    svgContainer.innerHTML = "";
    svgContainer.appendChild(svg);

    let num, den, numText, denText;

    if (this.mode === 'continuous') {
      num = this.continuousNum;
      den = this.continuousDen;
      
      // 更新拉桿氣泡文字
      document.getElementById('explorer-den-val').innerText = `${den} 份`;
      document.getElementById('explorer-num-val').innerText = `${num} 份`;
      
      if (this.shape === 'circle') {
        SVGDrawer.drawCircleFraction(svg, den, num, "#FF8A80", "#FFFDF6");
      } else {
        SVGDrawer.drawRectFraction(svg, den, num, "#FF8A80", "#FFFDF6");
      }
      
      numText = num;
      denText = den;
      
      // 更新主分數卡
      document.getElementById('exp-num').innerText = num;
      document.getElementById('exp-den').innerText = den;
      document.getElementById('exp-name').innerText = TTSManager.fractionToText(num, den);
      
      // 產生解說
      const fractionStr = `<span class="math-fraction"><span class="num">${num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${den}</span></span>`;
      const shapeWord = this.shape === 'circle' ? "圓形蛋糕" : "長條巧克力";
      
      let expHTML = `把 1 個 <strong>${shapeWord}</strong> 平分成 <strong>${den}</strong> 份，拿走其中的 <strong>${num}</strong> 份，就是拿走了 <strong>${fractionStr}</strong> 個。`;
      
      // 檢查等值分數
      this.checkAndRenderEquivalence(num, den, expHTML);

    } else {
      // 離散量
      num = this.discreteNum;
      den = this.discreteDen;
      const total = this.discreteTotal;
      const candiesPerGroup = total / den;
      const totalSelected = num * candiesPerGroup;

      document.getElementById('explorer-discrete-den-val').innerText = `${den} 組`;
      document.getElementById('explorer-discrete-num-val').innerText = `${num} 組`;

      // 重新繪製離散 SVG
      svg.setAttribute("viewBox", "0 0 440 200");
      SVGDrawer.drawCandyFraction(svg, total, den, num);

      numText = num;
      denText = den;

      document.getElementById('exp-num').innerText = num;
      document.getElementById('exp-den').innerText = den;
      document.getElementById('exp-name').innerText = TTSManager.fractionToText(num, den);

      const fractionStr = `<span class="math-fraction"><span class="num">${num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${den}</span></span>`;
      
      let expHTML = `一盒有 <strong>${total}</strong> 顆馬卡龍。平分成 <strong>${den}</strong> 組（每組有 <strong>${candiesPerGroup}</strong> 顆）。<br>
                     拿走 <strong>${num}</strong> 組（共 <strong>${totalSelected}</strong> 顆），代表拿走了 <strong>${fractionStr}</strong> 盒。`;
      
      this.checkAndRenderEquivalence(num, den, expHTML, true, total);
    }
  },

  // 檢查是否有約分等值分數，並在介面上繪製
  checkAndRenderEquivalence(num, den, baseExplanation, isDiscrete = false, total = 12) {
    const eqConnector = document.getElementById('exp-eq-connector');
    const eqCard = document.getElementById('exp-eq-card');
    const explanationBox = document.getElementById('explorer-explanation');

    // 尋找簡單等值分數做比對顯示 (擴分乘以 2)
    // 假設我們在探索區，永遠在右側附帶展示它的擴分 F*2 (若分母在範圍內) 或它的約分 F/2
    let eqNum, eqDen;
    let hasEq = false;

    if (den * 2 <= 16) {
      eqNum = num * 2;
      eqDen = den * 2;
      hasEq = true;
    } else if (den % 2 === 0 && num % 2 === 0) {
      eqNum = num / 2;
      eqDen = den / 2;
      hasEq = true;
    }

    if (hasEq) {
      eqConnector.style.display = "block";
      eqCard.style.display = "flex";
      document.getElementById('exp-eq-num').innerText = eqNum;
      document.getElementById('exp-eq-den').innerText = eqDen;
      document.getElementById('exp-eq-name').innerText = TTSManager.fractionToText(eqNum, eqDen);

      const eqFracStr = `<span class="math-fraction"><span class="num">${eqNum}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${eqDen}</span></span>`;
      const baseFracStr = `<span class="math-fraction"><span class="num">${num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${den}</span></span>`;
      
      let extraExp = `<br>✨ <strong>等值分數發現！</strong><br>我們發現：${baseFracStr} 和 ${eqFracStr} 的大小是一模一樣的喔！`;
      if (isDiscrete) {
        const groupCount1 = candiesPerGroup = total / den;
        const groupCount2 = total / eqDen;
        extraExp += `<br>因為拿走的分量都是 <strong>${num * groupCount1}</strong> 顆馬卡龍。`;
      }
      
      explanationBox.innerHTML = baseExplanation + extraExp;
    } else {
      eqConnector.style.display = "none";
      eqCard.style.display = "none";
      explanationBox.innerHTML = baseExplanation;
    }
  },

  speakCurrentSetup() {
    let text = "";
    if (this.mode === 'continuous') {
      const shapeWord = this.shape === 'circle' ? "圓形蛋糕" : "長條巧克力";
      const fracText = TTSManager.fractionToText(this.continuousNum, this.continuousDen);
      text = `把一個${shapeWord}平分成${this.continuousDen}份，拿走其中的${this.continuousNum}份，是${fracText}個。`;
    } else {
      const fracText = TTSManager.fractionToText(this.discreteNum, this.discreteDen);
      const candiesPerGroup = this.discreteTotal / this.discreteDen;
      const totalSelected = this.discreteNum * candiesPerGroup;
      text = `一盒有${this.discreteTotal}顆馬卡龍。平分成${this.discreteDen}組，拿走${this.discreteNum}組，共是${totalSelected}顆，也就是${fracText}盒。`;
    }
    TTSManager.speak(text);
  },

  speakEquivalence(factor) {
    if (this.mode === 'continuous') {
      const fracText = TTSManager.fractionToText(this.continuousNum, this.continuousDen);
      if (factor === 2) {
        TTSManager.speak(`擴分成功！分子和分母同時乘以二，得到新的分數是：${fracText}。兩邊一樣多喔！`);
      } else {
        TTSManager.speak(`約分成功！分子和分母同時除以二，得到新的分數是：${fracText}。大小完全一樣！`);
      }
    } else {
      const fracText = TTSManager.fractionToText(this.discreteNum, this.discreteDen);
      if (factor === 2) {
        TTSManager.speak(`擴分！平分組數變多，新分數是${fracText}盒，顆數不變。`);
      } else {
        TTSManager.speak(`約分！組數合併，新分數是${fracText}盒，大小不變！`);
      }
    }
  }
};

// ==========================================================================
// 7. 🌟 關卡一：等值披薩大配對 (Level 1: Drag & Drop Continuous)
// ==========================================================================
const Game1 = {
  currentQuestion: 0,
  totalQuestions: 5,
  scoreStars: 5,
  targetFrac: { num: 1, den: 2 },
  options: [],
  selectedPizzaCard: null,
  questions: [],

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  start() {
    this.currentQuestion = 0;
    this.scoreStars = 5;

    // 定義關卡一題目池 (擴展為 12 道豐富題目)
    const pool = [
      { target: { num: 1, den: 2 }, opt: [{ num: 2, den: 4, correct: true }, { num: 3, den: 6, correct: true }, { num: 4, den: 8, correct: true }, { num: 2, den: 3, correct: false }, { num: 3, den: 4, correct: false }] },
      { target: { num: 2, den: 3 }, opt: [{ num: 4, den: 6, correct: true }, { num: 8, den: 12, correct: true }, { num: 6, den: 9, correct: true }, { num: 1, den: 2, correct: false }, { num: 3, den: 5, correct: false }] },
      { target: { num: 3, den: 4 }, opt: [{ num: 6, den: 8, correct: true }, { num: 9, den: 12, correct: true }, { num: 12, den: 16, correct: true }, { num: 2, den: 3, correct: false }, { num: 4, den: 5, correct: false }] },
      { target: { num: 1, den: 3 }, opt: [{ num: 2, den: 6, correct: true }, { num: 3, den: 9, correct: true }, { num: 4, den: 12, correct: true }, { num: 2, den: 5, correct: false }, { num: 3, den: 8, correct: false }] },
      { target: { num: 2, den: 5 }, opt: [{ num: 4, den: 10, correct: true }, { num: 6, den: 15, correct: true }, { num: 8, den: 20, correct: true }, { num: 3, den: 8, correct: false }, { num: 1, den: 2, correct: false }] },
      { target: { num: 3, den: 5 }, opt: [{ num: 6, den: 10, correct: true }, { num: 9, den: 15, correct: true }, { num: 12, den: 20, correct: true }, { num: 2, den: 3, correct: false }, { num: 4, den: 6, correct: false }] },
      { target: { num: 1, den: 4 }, opt: [{ num: 2, den: 8, correct: true }, { num: 3, den: 12, correct: true }, { num: 4, den: 16, correct: true }, { num: 1, den: 3, correct: false }, { num: 2, den: 6, correct: false }] },
      { target: { num: 5, den: 6 }, opt: [{ num: 10, den: 12, correct: true }, { num: 15, den: 18, correct: true }, { num: 20, den: 24, correct: true }, { num: 4, den: 5, correct: false }, { num: 8, den: 10, correct: false }] },
      { target: { num: 3, den: 6 }, opt: [{ num: 1, den: 2, correct: true }, { num: 2, den: 4, correct: true }, { num: 4, den: 8, correct: true }, { num: 2, den: 5, correct: false }, { num: 4, den: 10, correct: false }] },
      { target: { num: 4, den: 10 }, opt: [{ num: 2, den: 5, correct: true }, { num: 6, den: 15, correct: true }, { num: 8, den: 20, correct: true }, { num: 1, den: 2, correct: false }, { num: 3, den: 8, correct: false }] },
      { target: { num: 2, den: 4 }, opt: [{ num: 1, den: 2, correct: true }, { num: 3, den: 6, correct: true }, { num: 4, den: 8, correct: true }, { num: 2, den: 3, correct: false }, { num: 3, den: 5, correct: false }] },
      { target: { num: 4, den: 6 }, opt: [{ num: 2, den: 3, correct: true }, { num: 8, den: 12, correct: true }, { num: 6, den: 9, correct: true }, { num: 1, den: 2, correct: false }, { num: 3, den: 4, correct: false }] }
    ];
    this.shuffle(pool);
    this.questions = pool.slice(0, this.totalQuestions);

    this.initQuestion();
  },

  updateStarsDisplay() {
    const starStr = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('g1-stars').innerText = starStr;
  },

  initQuestion() {
    this.updateStarsDisplay();
    document.getElementById('g1-feedback').style.display = "none";

    const q = this.questions[this.currentQuestion];
    this.targetFrac = q.target;
    
    // 從選項中選出一個正確的等值分數 (與目標分母不同)，以及兩個錯誤分數
    const correctOptions = q.opt.filter(o => o.correct && o.den !== this.targetFrac.den);
    const wrongOptions = q.opt.filter(o => !o.correct);
    
    const pickedCorrect = correctOptions[Math.floor(Math.random() * correctOptions.length)];
    // 隨機選兩個錯誤選項
    this.shuffle(wrongOptions);
    const pickedWrongs = wrongOptions.slice(0, 2);
    
    this.options = [pickedCorrect, ...pickedWrongs];
    this.shuffle(this.options);

    // 繪製目標披薩
    const targetSvgWrap = document.getElementById('g1-target-svg');
    targetSvgWrap.innerHTML = "";
    const targetSvg = SVGDrawer.createSVGNode("svg", {
      width: "100%", height: "100%", viewBox: "0 0 280 280"
    });
    targetSvgWrap.appendChild(targetSvg);
    // 繪製目標：使用奶油黃代表盤中披薩
    SVGDrawer.drawCircleFraction(targetSvg, this.targetFrac.den, this.targetFrac.num, "#FFD54F", "#FAFAFA");

    // 報讀題目
    const fracText = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
    const speakText = `第${this.currentQuestion + 1}題：請在下方披薩中，找出大小和盤子裡${fracText}個一樣大的披薩，拖進魔法爐中！`;
    document.getElementById('g1-question-text').innerHTML = `請在下方找出大小與盤子中 <span class="math-fraction"><span class="num">${this.targetFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.targetFrac.den}</span></span> 個（${fracText}個）「一樣大」的等值披薩，拖入魔法爐中！`;
    
    TTSManager.speak(speakText);

    // 渲染托盤選項
    this.renderTray();
    this.setupDragAndDrop();
  },

  renderTray() {
    const tray = document.getElementById('g1-tray');
    tray.innerHTML = "";

    this.options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = "g1-pizza-card";
      card.draggable = true;
      card.dataset.idx = idx;
      
      const svgWrap = document.createElement('div');
      svgWrap.className = "g1-pizza-svg-wrap";
      
      const svg = SVGDrawer.createSVGNode("svg", {
        width: "100%", height: "100%", viewBox: "0 0 280 280"
      });
      svgWrap.appendChild(svg);
      
      // 繪製選項披薩（用櫻花粉）
      SVGDrawer.drawCircleFraction(svg, opt.den, opt.num, "#FF8A80", "#FFFFFF");
      
      const fractionLabel = document.createElement('div');
      fractionLabel.className = "g1-pizza-fraction";
      
      const fracText = TTSManager.fractionToText(opt.num, opt.den);
      fractionLabel.innerHTML = `<span class="num">${opt.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${opt.den}</span>`;
      fractionLabel.title = fracText;

      card.appendChild(svgWrap);
      card.appendChild(fractionLabel);
      tray.appendChild(card);
    });
  },

  // 設置拖放事件 (支援觸控 Touch 與 滑鼠 Mouse)
  setupDragAndDrop() {
    const cards = document.querySelectorAll('.g1-pizza-card');
    const oven = document.getElementById('g1-magic-oven');

    // 清理舊的 Event
    oven.ondragover = (e) => e.preventDefault();
    oven.ondragenter = () => oven.classList.add('drag-hover');
    oven.ondragleave = () => oven.classList.remove('drag-hover');
    
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.idx);
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        oven.classList.remove('drag-hover');
      });

      // --- 觸控支持 (Mobile / Whiteboard) ---
      let touchStartX, touchStartY;
      card.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        card.classList.add('dragging');
        this.selectedPizzaCard = card;
      }, {passive: true});

      card.addEventListener('touchmove', (e) => {
        if (!this.selectedPizzaCard) return;
        const touch = e.touches[0];
        const moveX = touch.clientX - touchStartX;
        const moveY = touch.clientY - touchStartY;
        
        card.style.transform = `translate(${moveX}px, ${moveY}px) scale(0.95)`;
        
        // 偵測是否懸停在魔法爐上方
        const ovenRect = oven.getBoundingClientRect();
        if (touch.clientX >= ovenRect.left && touch.clientX <= ovenRect.right &&
            touch.clientY >= ovenRect.top && touch.clientY <= ovenRect.bottom) {
          oven.classList.add('drag-hover');
        } else {
          oven.classList.remove('drag-hover');
        }
      }, {passive: true});

      card.addEventListener('touchend', (e) => {
        if (!this.selectedPizzaCard) return;
        card.classList.remove('dragging');
        card.style.transform = '';
        
        const ovenRect = oven.getBoundingClientRect();
        const touch = e.changedTouches[0];
        
        const isDropped = (touch.clientX >= ovenRect.left && touch.clientX <= ovenRect.right &&
                           touch.clientY >= ovenRect.top && touch.clientY <= ovenRect.bottom);
        
        oven.classList.remove('drag-hover');
        
        if (isDropped) {
          const idx = parseInt(card.dataset.idx);
          this.checkAnswer(idx, card);
        }
        
        this.selectedPizzaCard = null;
      });
    });

    oven.ondrop = (e) => {
      e.preventDefault();
      oven.classList.remove('drag-hover');
      const idx = parseInt(e.dataTransfer.getData('text/plain'));
      const draggedCard = document.querySelector(`.g1-pizza-card[data-idx='${idx}']`);
      this.checkAnswer(idx, draggedCard);
    };
  },

  checkAnswer(idx, cardElement) {
    const opt = this.options[idx];
    const feedback = document.getElementById('g1-feedback');
    const fEmoji = document.getElementById('g1-feedback-emoji');
    const fMsg = document.getElementById('g1-feedback-msg');

    // 計算數值大小是否等值
    const isCorrect = (opt.num * this.targetFrac.den === opt.den * this.targetFrac.num);

    if (isCorrect) {
      SoundManager.playCorrect();
      Confetti.start();
      
      // 融合動畫：魔法爐披薩轉為正確的切割細份數
      const targetSvgWrap = document.getElementById('g1-target-svg');
      targetSvgWrap.innerHTML = "";
      const targetSvg = SVGDrawer.createSVGNode("svg", {
        width: "100%", height: "100%", viewBox: "0 0 280 280"
      });
      targetSvgWrap.appendChild(targetSvg);
      SVGDrawer.drawCircleFraction(targetSvg, opt.den, opt.num, "#FF8A80", "#FAFAFA");

      // 顯示反饋
      feedback.className = "feedback-overlay correct";
      feedback.style.display = "flex";
      fEmoji.innerText = "🧁";
      
      const targetFracStr = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
      const optFracStr = TTSManager.fractionToText(opt.num, opt.den);
      const targetFracHTML = `<span class="math-fraction"><span class="num">${this.targetFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.targetFrac.den}</span></span>`;
      const optFracHTML = `<span class="math-fraction"><span class="num">${opt.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${opt.den}</span></span>`;
      fMsg.innerHTML = `答對了！<br>${targetFracHTML} 等於 ${optFracHTML}！`;

      TTSManager.speak(`答對了！${targetFracStr}等於${optFracStr}，大小完全一樣多喔！`);

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion >= this.totalQuestions) {
          this.endGame();
        } else {
          this.initQuestion();
        }
      }, 3000);

    } else {
      SoundManager.playWrong();
      
      // 扣除星星，最少 1 顆
      if (this.scoreStars > 1) {
        this.scoreStars--;
        this.updateStarsDisplay();
      }

      // 對比重疊動畫：魔法爐中以半透明顯示兩個分數的重疊
      const targetSvgWrap = document.getElementById('g1-target-svg');
      targetSvgWrap.innerHTML = "";
      const targetSvg = SVGDrawer.createSVGNode("svg", {
        width: "100%", height: "100%", viewBox: "0 0 280 280"
      });
      targetSvgWrap.appendChild(targetSvg);
      
      // 畫底盤目標（半透明黃）
      SVGDrawer.drawCircleFraction(targetSvg, this.targetFrac.den, this.targetFrac.num, "rgba(255, 213, 79, 0.5)", "#FAFAFA");
      // 畫拖入的錯誤分數（半透明紅）
      for (let i = 0; i < opt.num; i++) {
        const anglePerPart = 360 / opt.den;
        const startAngle = -90 + i * anglePerPart;
        const endAngle = startAngle + anglePerPart;
        
        const rad1 = (startAngle * Math.PI) / 180;
        const rad2 = (endAngle * Math.PI) / 180;
        const cx=140, cy=140, r=110;
        
        const x1 = cx + r * Math.cos(rad1);
        const y1 = cy + r * Math.sin(rad1);
        const x2 = cx + r * Math.cos(rad2);
        const y2 = cy + r * Math.sin(rad2);
        const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
        
        const sector = SVGDrawer.createSVGNode("path", {
          d: pathData,
          fill: "rgba(255, 112, 67, 0.4)",
          stroke: "#D84315",
          "stroke-width": 1.5
        });
        targetSvg.appendChild(sector);
      }

      feedback.className = "feedback-overlay wrong";
      feedback.style.display = "flex";
      fEmoji.innerText = "🔍";
      fMsg.innerHTML = `大小不一樣喔！<br>疊在一起比比看！`;

      const targetFracStr = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
      const optFracStr = TTSManager.fractionToText(opt.num, opt.den);
      TTSManager.speak(`哎呀，${targetFracStr}和${optFracStr}的大小不一樣多喔！把牠們疊在一起，你可以看出差別。再試試看別的披薩！`);

      setTimeout(() => {
        feedback.style.display = "none";
        // 恢復原狀
        const tSvg = targetSvgWrap.querySelector('svg');
        tSvg.innerHTML = "";
        SVGDrawer.drawCircleFraction(tSvg, this.targetFrac.den, this.targetFrac.num, "#FFD54F", "#FAFAFA");
        // 卡片歸位 (如果是 HTML 拖曳會自動歸位)
      }, 3500);
    }
  },

  endGame() {
    App.lastFinishedGame = 1;
    document.getElementById('result-stars').innerText = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('result-medal').innerText = "🌟";
    document.getElementById('result-title').innerText = "披薩配對大師！";
    document.getElementById('result-text').innerText = "太厲害了！你成功配對了所有的等值披薩。你已經了解了分數大小和切割片數的關係，不會被數字大小騙到了喔！";
    
    SoundManager.playCheer();
    App.showScreen('screen-result');
    TTSManager.speak("恭喜通關！你已經成功配對了所有的等值披薩。太棒了！");
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
};

// ==========================================================================
// 8. 🍬 關卡二：魔法糖果包裝員 (Level 2: Discrete Fractions)
// ==========================================================================
const Game2 = {
  currentQuestion: 0,
  totalQuestions: 5,
  scoreStars: 5,
  
  targetFrac: { num: 1, den: 2 }, // 顧客要求的分數
  totalCandies: 12,
  
  playerDen: 3, // 玩家切分的組數
  selectedGroups: [], // 玩家選取的組別
  questions: [],

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  start() {
    this.currentQuestion = 0;
    this.scoreStars = 5;

    // 題目池：目標分數 + 總糖果顆數 (固定12顆/24顆，因應課本情境，擴展為 12 題)
    const pool = [
      { target: { num: 1, den: 2 }, total: 12, text: "我要買二分之一盒馬卡龍。" },
      { target: { num: 2, den: 3 }, total: 12, text: "請給我三分之二盒馬卡龍。" },
      { target: { num: 3, den: 4 }, total: 12, text: "我要打包四分之三盒馬卡龍。" },
      { target: { num: 1, den: 3 }, total: 12, text: "我想買三分之一盒馬卡龍。" },
      { target: { num: 5, den: 6 }, total: 12, text: "請幫我打包六分之五盒馬卡龍。" },
      { target: { num: 1, den: 4 }, total: 12, text: "我想買四分之一盒馬卡龍。" },
      { target: { num: 1, den: 6 }, total: 12, text: "請給我六分之一盒馬卡龍。" },
      { target: { num: 2, den: 4 }, total: 12, text: "請給我四分之二盒馬卡龍。" },
      { target: { num: 2, den: 6 }, total: 12, text: "我要買六分之二盒馬卡龍。" },
      { target: { num: 3, den: 6 }, total: 12, text: "請給我六分之三盒馬卡龍。" },
      { target: { num: 1, den: 2 }, total: 24, text: "我要買二分之一盒馬卡龍。" },
      { target: { num: 3, den: 4 }, total: 24, text: "我要打包四分之三盒馬卡龍。" }
    ];
    this.shuffle(pool);
    this.questions = pool.slice(0, this.totalQuestions);

    this.initQuestion();
  },

  updateStarsDisplay() {
    const starStr = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('g2-stars').innerText = starStr;
  },

  initQuestion() {
    this.updateStarsDisplay();
    document.getElementById('g2-feedback').style.display = "none";
    this.selectedGroups = [];

    const q = this.questions[this.currentQuestion];
    this.targetFrac = q.target;
    this.totalCandies = q.total;

    // 分母按鈕選擇區 (12的因數：2, 3, 4, 6, 12)
    const dividersArea = document.getElementById('g2-dividers');
    dividersArea.innerHTML = "";
    
    const factors = [2, 3, 4, 6, 12];
    
    factors.forEach((f, idx) => {
      const btn = document.createElement('button');
      btn.className = "g2-divider-btn";
      btn.innerText = `平分成 ${f} 組`;
      if (idx === 0) {
        btn.classList.add('active');
        this.playerDen = f;
      }
      
      btn.onclick = () => {
        SoundManager.playClick();
        document.querySelectorAll('.g2-divider-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.playerDen = f;
        this.selectedGroups = []; // 清空選取
        this.renderBox();
      };
      
      dividersArea.appendChild(btn);
    });

    // 初始預設為平分成第一顆按鈕的組數
    this.playerDen = factors[0];

    // 更新題目文字
    const reqText = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
    document.getElementById('g2-question-text').innerHTML = `顧客想要買分量為 <span class="math-fraction"><span class="num">${this.targetFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.targetFrac.den}</span></span> 盒（${reqText}盒）馬卡龍。<br>
                                                              一盒有 <strong>12</strong> 顆馬卡龍，請幫忙進行打包！`;
    
    TTSManager.speak(`第${this.currentQuestion + 1}題：顧客想要買${reqText}盒馬卡龍。一盒有十二顆。請先點選按鈕決定要平分成幾組，再點選包裝袋選取正確的分量！`);

    this.renderBox();
    
    // 送出按鈕
    document.getElementById('btn-g2-submit').onclick = () => {
      this.checkAnswer();
    };
  },

  renderBox() {
    const svg = document.getElementById('g2-candy-svg');
    svg.innerHTML = "";
    
    // 繪製互動式離散糖果
    SVGDrawer.drawCandyFraction(svg, this.totalCandies, this.playerDen, 0, this.selectedGroups, true, (gIdx) => {
      SoundManager.playClick();
      // 切換選取狀態
      const pos = this.selectedGroups.indexOf(gIdx);
      if (pos === -1) {
        this.selectedGroups.push(gIdx);
      } else {
        this.selectedGroups.splice(pos, 1);
      }
      this.renderBox();
    });
  },

  checkAnswer() {
    const feedback = document.getElementById('g2-feedback');
    const fEmoji = document.getElementById('g2-feedback-emoji');
    const fMsg = document.getElementById('g2-feedback-msg');

    // 計算正確的顆數
    const correctCount = this.totalCandies * (this.targetFrac.num / this.targetFrac.den);
    
    // 玩家打包的顆數
    const candiesPerGroup = this.totalCandies / this.playerDen;
    const playerPickedCount = this.selectedGroups.length * candiesPerGroup;

    const isCorrect = (correctCount === playerPickedCount);

    if (isCorrect) {
      SoundManager.playCorrect();
      Confetti.start();

      feedback.className = "feedback-overlay correct";
      feedback.style.display = "flex";
      fEmoji.innerText = "📦";
      
      const reqText = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
      const playerFracText = TTSManager.fractionToText(this.selectedGroups.length, this.playerDen);
      
      fMsg.innerHTML = `出貨成功！<br>${reqText}盒 剛好是 ${playerPickedCount} 顆馬卡龍！`;
      
      TTSManager.speak(`打包正確，出貨成功！您將十二顆馬卡龍平分成${this.playerDen}組，選了${this.selectedGroups.length}組，也就是${playerFracText}盒，剛好是${playerPickedCount}顆！和顧客要求的${reqText}盒大小一樣多喔！`);

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion >= this.totalQuestions) {
          this.endGame();
        } else {
          this.initQuestion();
        }
      }, 4000);
      
    } else {
      SoundManager.playWrong();
      if (this.scoreStars > 1) {
        this.scoreStars--;
        this.updateStarsDisplay();
      }

      feedback.className = "feedback-overlay wrong";
      feedback.style.display = "flex";
      fEmoji.innerText = "🍬";
      
      const reqText = TTSManager.fractionToText(this.targetFrac.num, this.targetFrac.den);
      fMsg.innerHTML = `顆數不對喔！<br>顧客要的是 ${reqText} 盒（共 ${correctCount} 顆）`;
      
      TTSManager.speak(`不對喔，顧客要的是${reqText}盒，這代表需要${correctCount}顆馬卡龍。您現在只包裝了${playerPickedCount}顆。您可以試著平分成三組或四組，再選取正確的組數喔！`);

      setTimeout(() => {
        feedback.style.display = "none";
      }, 3500);
    }
  },

  endGame() {
    App.lastFinishedGame = 2;
    document.getElementById('result-stars').innerText = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('result-medal').innerText = "🍬";
    document.getElementById('result-title').innerText = "點心包裝專家！";
    document.getElementById('result-text').innerText = "你成功幫小動物顧客們包裝了正確分量的馬卡龍。離散量分數的等值關係也難不倒你了！";
    
    SoundManager.playCheer();
    App.showScreen('screen-result');
    TTSManager.speak("恭喜通關！你已經成功完成所有馬卡龍的打包試煉！做得非常好！");
  }
};

// ==========================================================================
// 9. ⚖️ 關卡三：擴約分鍊金術 (Level 3: Scale & Formula Equivalence)
// ==========================================================================
const Game3 = {
  currentQuestion: 0,
  totalQuestions: 5,
  scoreStars: 5,

  leftFrac: { num: 1, den: 2 },
  rightFrac: { num: 2, den: 4 },
  operator: '×', // '×' 或 '÷'
  correctVal: 2, // 乘或除的正確值

  draggedPotionVal: null,
  placedNumPotion: null,
  placedDenPotion: null,
  questions: [],

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  start() {
    this.currentQuestion = 0;
    this.scoreStars = 5;

    // 題目池：擴約分鍊金術 (包含乘除以 2, 3, 4, 5 的豐富題目)
    const pool = [
      { left: { num: 1, den: 3 }, right: { num: 3, den: 9 }, op: '×', val: 3 },
      { left: { num: 6, den: 8 }, right: { num: 3, den: 4 }, op: '÷', val: 2 },
      { left: { num: 2, den: 5 }, right: { num: 6, den: 15 }, op: '×', val: 3 },
      { left: { num: 4, den: 12 }, right: { num: 1, den: 3 }, op: '÷', val: 4 },
      { left: { num: 3, den: 4 }, right: { num: 6, den: 8 }, op: '×', val: 2 },
      { left: { num: 1, den: 2 }, right: { num: 5, den: 10 }, op: '×', val: 5 },
      { left: { num: 8, den: 12 }, right: { num: 2, den: 3 }, op: '÷', val: 4 },
      { left: { num: 3, den: 12 }, right: { num: 1, den: 4 }, op: '÷', val: 3 },
      { left: { num: 2, den: 3 }, right: { num: 8, den: 12 }, op: '×', val: 4 },
      { left: { num: 10, den: 15 }, right: { num: 2, den: 3 }, op: '÷', val: 5 },
      { left: { num: 1, den: 4 }, right: { num: 4, den: 16 }, op: '×', val: 4 },
      { left: { num: 5, den: 15 }, right: { num: 1, den: 3 }, op: '÷', val: 5 }
    ];
    this.shuffle(pool);
    this.questions = pool.slice(0, this.totalQuestions);

    this.initQuestion();
  },

  updateStarsDisplay() {
    const starStr = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('g3-stars').innerText = starStr;
  },

  initQuestion() {
    this.updateStarsDisplay();
    document.getElementById('g3-feedback').style.display = "none";
    this.placedNumPotion = null;
    this.placedDenPotion = null;

    // 清空拖放槽
    const slotNum = document.getElementById('g3-slot-num');
    const slotDen = document.getElementById('g3-slot-den');
    slotNum.innerText = "?";
    slotDen.innerText = "?";
    slotNum.className = "g3-drop-slot";
    slotDen.className = "g3-drop-slot";

    const q = this.questions[this.currentQuestion];
    this.leftFrac = q.left;
    this.rightFrac = q.right;
    this.operator = q.op;
    this.correctVal = q.val;

    // 更新 DOM 文字
    document.getElementById('g3-frac-left').querySelector('.num').innerText = this.leftFrac.num;
    document.getElementById('g3-frac-left').querySelector('.den').innerText = this.leftFrac.den;
    
    document.getElementById('g3-calc-left-num').innerText = this.leftFrac.num;
    document.getElementById('g3-calc-left-den').innerText = this.leftFrac.den;

    document.getElementById('g3-op-label-top').innerText = this.operator;
    document.getElementById('g3-op-label-bottom').innerText = this.operator;

    document.getElementById('g3-frac-right').querySelector('.num').innerText = this.rightFrac.num;
    document.getElementById('g3-frac-right').querySelector('.den').innerText = this.rightFrac.den;

    // 繪製天平中間的蛋糕預覽
    const svgContainer = document.getElementById('g3-svg-container');
    svgContainer.innerHTML = "";
    const svg = SVGDrawer.createSVGNode("svg", {
      width: "100%", height: "100%", viewBox: "0 0 280 280"
    });
    svgContainer.appendChild(svg);
    // 畫天平底座 (簡易平衡天平線)
    this.drawScaleBalance(svg, 0); // 0代表平衡

    const leftFracStr = TTSManager.fractionToText(this.leftFrac.num, this.leftFrac.den);
    const rightFracStr = TTSManager.fractionToText(this.rightFrac.num, this.rightFrac.den);
    
    let speakText = `第${this.currentQuestion + 1}題：這是一個分數天平。左邊是${leftFracStr}，右邊是${rightFracStr}。請把神奇的藥水瓶拖曳到分子和分母的空格中，讓兩邊等值平衡吧！`;
    TTSManager.speak(speakText);

    this.renderPotions();
    this.setupDragAndDrop();

    document.getElementById('btn-g3-submit').onclick = () => {
      this.checkAnswer();
    };
  },

  drawScaleBalance(svg, tiltOffset) {
    svg.innerHTML = "";
    
    // 天平中央立柱
    const pillar = SVGDrawer.createSVGNode("line", {
      x1: 140, y1: 200, x2: 140, y2: 80,
      stroke: "#8D6E63", "stroke-width": 6
    });
    const base = SVGDrawer.createSVGNode("path", {
      d: "M 100 200 L 180 200 L 160 180 L 120 180 Z",
      fill: "#8D6E63"
    });
    svg.appendChild(pillar);
    svg.appendChild(base);

    // 天平橫桿 (根據 tiltOffset 傾斜)
    const leftY = 80 + tiltOffset;
    const rightY = 80 - tiltOffset;
    
    const beam = SVGDrawer.createSVGNode("line", {
      x1: 40, y1: leftY, x2: 240, y2: rightY,
      stroke: "#8D6E63", "stroke-width": 4
    });
    svg.appendChild(beam);

    // 兩側秤盤懸線與盤子
    const leftLine1 = SVGDrawer.createSVGNode("line", { x1: 40, y1: leftY, x2: 20, y2: leftY + 50, stroke: "#BCAAA4", "stroke-width": 2 });
    const leftLine2 = SVGDrawer.createSVGNode("line", { x1: 40, y1: leftY, x2: 60, y2: leftY + 50, stroke: "#BCAAA4", "stroke-width": 2 });
    const leftPlate = SVGDrawer.createSVGNode("ellipse", { cx: 40, cy: leftY + 50, rx: 30, ry: 6, fill: "#FFE082", stroke: "#8D6E63", "stroke-width": 2 });
    
    const rightLine1 = SVGDrawer.createSVGNode("line", { x1: 240, y1: rightY, x2: 220, y2: rightY + 50, stroke: "#BCAAA4", "stroke-width": 2 });
    const rightLine2 = SVGDrawer.createSVGNode("line", { x1: 240, y1: rightY, x2: 260, y2: rightY + 50, stroke: "#BCAAA4", "stroke-width": 2 });
    const rightPlate = SVGDrawer.createSVGNode("ellipse", { cx: 240, cy: rightY + 50, rx: 30, ry: 6, fill: "#FFE082", stroke: "#8D6E63", "stroke-width": 2 });

    svg.appendChild(leftLine1);
    svg.appendChild(leftLine2);
    svg.appendChild(leftPlate);
    
    svg.appendChild(rightLine1);
    svg.appendChild(rightLine2);
    svg.appendChild(rightPlate);
    
    // 秤盤上的小圓球預覽
    const ballLeft = SVGDrawer.createSVGNode("circle", { cx: 40, cy: leftY + 35, r: 14, fill: "#FF8A80", stroke: "#8D6E63", "stroke-width": 1.5 });
    const ballRight = SVGDrawer.createSVGNode("circle", { cx: 240, cy: rightY + 35, r: 14, fill: "#7DD4E8", stroke: "#8D6E63", "stroke-width": 1.5 });
    svg.appendChild(ballLeft);
    svg.appendChild(ballRight);
  },

  renderPotions() {
    const tray = document.getElementById('g3-potion-tray');
    tray.innerHTML = "";

    // 生成可用藥水瓶 2, 3, 4, 5
    const vals = [2, 3, 4, 5];
    
    vals.forEach((v, idx) => {
      const potion = document.createElement('div');
      potion.className = "g3-potion";
      potion.draggable = true;
      potion.dataset.val = v;
      
      const bottle = document.createElement('div');
      bottle.className = "g3-potion-bottle";
      bottle.innerText = "🧪";
      
      const label = document.createElement('div');
      label.className = "g3-potion-val";
      label.innerText = `${this.operator} ${v}`;

      potion.appendChild(bottle);
      potion.appendChild(label);
      tray.appendChild(potion);
    });
  },

  setupDragAndDrop() {
    const potions = document.querySelectorAll('.g3-potion');
    const slots = document.querySelectorAll('.g3-drop-slot');

    slots.forEach(slot => {
      slot.ondragover = (e) => e.preventDefault();
      slot.ondragenter = () => slot.classList.add('drag-hover');
      slot.ondragleave = () => slot.classList.remove('drag-hover');
      
      slot.ondrop = (e) => {
        e.preventDefault();
        slot.classList.remove('drag-hover');
        const val = e.dataTransfer.getData('text/plain');
        this.fillSlot(slot, val);
      };

      // 點擊可以清空
      slot.onclick = () => {
        SoundManager.playClick();
        slot.innerText = "?";
        slot.classList.remove('filled');
        if (slot.dataset.slot === 'num') this.placedNumPotion = null;
        if (slot.dataset.slot === 'den') this.placedDenPotion = null;
      };
    });

    potions.forEach(potion => {
      potion.addEventListener('dragstart', (e) => {
        potion.classList.add('dragging');
        e.dataTransfer.setData('text/plain', potion.dataset.val);
        this.draggedPotionVal = potion.dataset.val;
      });
      potion.addEventListener('dragend', () => {
        potion.classList.remove('dragging');
      });

      // --- 觸控支持 ---
      let touchStartX, touchStartY;
      potion.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        potion.classList.add('dragging');
        this.draggedPotionVal = potion.dataset.val;
      }, {passive: true});

      potion.addEventListener('touchmove', (e) => {
        if (!this.draggedPotionVal) return;
        const touch = e.touches[0];
        const moveX = touch.clientX - touchStartX;
        const moveY = touch.clientY - touchStartY;
        potion.style.transform = `translate(${moveX}px, ${moveY}px) scale(0.95)`;
        
        // 懸停槽偵測
        slots.forEach(slot => {
          const rect = slot.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            slot.classList.add('drag-hover');
          } else {
            slot.classList.remove('drag-hover');
          }
        });
      }, {passive: true});

      potion.addEventListener('touchend', (e) => {
        if (!this.draggedPotionVal) return;
        potion.classList.remove('dragging');
        potion.style.transform = '';
        
        const touch = e.changedTouches[0];
        slots.forEach(slot => {
          slot.classList.remove('drag-hover');
          const rect = slot.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            this.fillSlot(slot, this.draggedPotionVal);
          }
        });
        this.draggedPotionVal = null;
      });
    });
  },

  fillSlot(slot, val) {
    SoundManager.playClick();
    slot.innerText = val;
    slot.classList.add('filled');
    
    if (slot.dataset.slot === 'num') {
      this.placedNumPotion = parseInt(val);
    } else {
      this.placedDenPotion = parseInt(val);
    }
  },

  checkAnswer() {
    const feedback = document.getElementById('g3-feedback');
    const fEmoji = document.getElementById('g3-feedback-emoji');
    const fMsg = document.getElementById('g3-feedback-msg');

    if (this.placedNumPotion === null || this.placedDenPotion === null) {
      TTSManager.speak("請先把分子和分母的藥水都放好喔！");
      return;
    }

    // 第一關判定：分子分母藥水必須相同！
    if (this.placedNumPotion !== this.placedDenPotion) {
      SoundManager.playWrong();
      
      // 天平猛烈傾斜 (例如傾斜 30px)
      const svg = document.getElementById('g3-svg-container').querySelector('svg');
      this.drawScaleBalance(svg, 30);

      if (this.scoreStars > 1) {
        this.scoreStars--;
        this.updateStarsDisplay();
      }

      feedback.className = "feedback-overlay wrong";
      feedback.style.display = "flex";
      fEmoji.innerText = "⚖️";
      fMsg.innerHTML = `天平歪掉囉！<br>分子分母要乘/除相同的數！`;

      TTSManager.speak("哎呀，天平歪掉囉！在分數的擴分或約分中，分子和分母必須同時乘以、或者同時除以同一個數，大小才不會變喔！快把天平調整回來吧！");
      
      setTimeout(() => {
        feedback.style.display = "none";
        this.drawScaleBalance(svg, 0); // 恢復平衡
      }, 4500);
      return;
    }

    // 第二關判定：是否數值正確使等值成立
    const isCorrect = (this.placedNumPotion === this.correctVal);

    if (isCorrect) {
      SoundManager.playCorrect();
      Confetti.start();

      feedback.className = "feedback-overlay correct";
      feedback.style.display = "flex";
      fEmoji.innerText = "✨";
      
      const leftFracStr = TTSManager.fractionToText(this.leftFrac.num, this.leftFrac.den);
      const rightFracStr = TTSManager.fractionToText(this.rightFrac.num, this.rightFrac.den);
      const leftFracHTML = `<span class="math-fraction"><span class="num">${this.leftFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.leftFrac.den}</span></span>`;
      const rightFracHTML = `<span class="math-fraction"><span class="num">${this.rightFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.rightFrac.den}</span></span>`;
      const opWord = this.operator === '×' ? "乘以" : "除以";

      fMsg.innerHTML = `鍊金成功！<br>${leftFracHTML} 等於 ${rightFracHTML}`;
      
      TTSManager.speak(`鍊金成功！${leftFracStr}的分子分母同時${opWord}${this.correctVal}，就得到了等值分數${rightFracStr}。天平非常平衡！`);

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion >= this.totalQuestions) {
          this.endGame();
        } else {
          this.initQuestion();
        }
      }, 4000);

    } else {
      SoundManager.playWrong();
      
      // 數值不對但分子分母相同：天平雖然平衡但數值算出來不是右邊那個分數，天平左右擺動後還是不對
      const svg = document.getElementById('g3-svg-container').querySelector('svg');
      // 天平小幅晃動
      this.drawScaleBalance(svg, 10);
      setTimeout(() => this.drawScaleBalance(svg, -10), 200);
      setTimeout(() => this.drawScaleBalance(svg, 0), 400);

      if (this.scoreStars > 1) {
        this.scoreStars--;
        this.updateStarsDisplay();
      }

      feedback.className = "feedback-overlay wrong";
      feedback.style.display = "flex";
      fEmoji.innerText = "🧪";
      fMsg.innerHTML = `算式不成立喔！<br>再試試其他數值`;

      const opWord = this.operator === '×' ? "乘以" : "除以";
      TTSManager.speak(`雖然分子和分母都${opWord}了${this.placedNumPotion}，但是這樣算出來的分數，不等於右邊的${rightFracStr}喔。請再算算看！`);

      setTimeout(() => {
        feedback.style.display = "none";
      }, 3500);
    }
  },

  endGame() {
    App.lastFinishedGame = 3;
    document.getElementById('result-stars').innerText = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('result-medal').innerText = "⚖️";
    document.getElementById('result-title').innerText = "等值鍊金術士！";
    document.getElementById('result-text').innerText = "太完美了！你完全掌握了擴分與約分的鍊金法則，知道擴分約分時分子分母要同時乘或除以同一個數。你是最厲害的鍊金大師！";
    
    SoundManager.playCheer();
    App.showScreen('screen-result');
    TTSManager.speak("恭喜通關！你已經成功完成所有分數天平的試煉！太棒了！");
  }
};

// ==========================================================================
// 10. 🏃 關卡四：數線跳跳尋寶記 (Level 4: Number Line & Decimals)
// ==========================================================================
const Game4 = {
  currentQuestion: 0,
  totalQuestions: 5,
  scoreStars: 5,

  targetVal: 0.6, // 目標點 (小數表示)
  targetFracText: "五分之三", // 題目文字引導
  rabbitPos: 0, // 小兔子當前數線位置 (0.0 到 1.2)
  selectedStep: 0.1, // 玩家選取的跳躍步長 (0.1, 0.2 等)
  
  lineDen: 10, // 數線主要切分母
  questions: [],

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  start() {
    this.currentQuestion = 0;
    this.scoreStars = 5;

    // 題目池：數線尋寶 (目標值, 對應分數結構, 引導文字, 分母，擴展為 12 題)
    const pool = [
      { target: 0.6, frac: { num: 3, den: 5 }, text: "五分之三", den: 10, steps: [{ val: 0.2, num: 1, den: 5 }, { val: 0.1, num: 1, den: 10 }, { val: 0.4, num: 2, den: 5 }] },
      { target: 0.8, frac: { num: 4, den: 5 }, text: "五分之四", den: 10, steps: [{ val: 0.2, num: 1, den: 5 }, { val: 0.1, num: 1, den: 10 }, { val: 0.4, num: 2, den: 5 }] },
      { target: 0.5, frac: { num: 1, den: 2 }, text: "二分之一", den: 10, steps: [{ val: 0.1, num: 1, den: 10 }, { val: 0.25, num: 1, den: 4 }, { val: 0.5, num: 2, den: 4 }] },
      { target: 0.75, frac: { num: 3, den: 4 }, text: "四分之三", den: 8, steps: [{ val: 0.25, num: 1, den: 4 }, { val: 0.125, num: 1, den: 8 }, { val: 0.375, num: 3, den: 8 }] },
      { target: 0.4, frac: { num: 2, den: 5 }, text: "五分之二", den: 10, steps: [{ val: 0.2, num: 1, den: 5 }, { val: 0.1, num: 1, den: 10 }, { val: 0.4, num: 2, den: 5 }] },
      { target: 0.2, frac: { num: 1, den: 5 }, text: "五分之一", den: 10, steps: [{ val: 0.2, num: 1, den: 5 }, { val: 0.1, num: 1, den: 10 }, { val: 0.4, num: 2, den: 5 }] },
      { target: 0.25, frac: { num: 1, den: 4 }, text: "四分之一", den: 8, steps: [{ val: 0.25, num: 1, den: 4 }, { val: 0.125, num: 1, den: 8 }, { val: 0.375, num: 3, den: 8 }] },
      { target: 0.625, frac: { num: 5, den: 8 }, text: "八分之五", den: 8, steps: [{ val: 0.25, num: 1, den: 4 }, { val: 0.125, num: 1, den: 8 }, { val: 0.375, num: 3, den: 8 }] },
      { target: 0.5, frac: { num: 2, den: 4 }, text: "四分之二", den: 8, steps: [{ val: 0.25, num: 1, den: 4 }, { val: 0.125, num: 1, den: 8 }, { val: 0.5, num: 2, den: 4 }] },
      { target: 0.375, frac: { num: 3, den: 8 }, text: "八分之三", den: 8, steps: [{ val: 0.25, num: 1, den: 4 }, { val: 0.125, num: 1, den: 8 }, { val: 0.375, num: 3, den: 8 }] },
      { target: 0.7, frac: { num: 7, den: 10 }, text: "十分之七", den: 10, steps: [{ val: 0.1, num: 1, den: 10 }, { val: 0.2, num: 1, den: 5 }, { val: 0.3, num: 3, den: 10 }] },
      { target: 0.3, frac: { num: 3, den: 10 }, text: "十分之三", den: 10, steps: [{ val: 0.1, num: 1, den: 10 }, { val: 0.2, num: 1, den: 5 }, { val: 0.3, num: 3, den: 10 }] }
    ];
    this.shuffle(pool);
    this.questions = pool.slice(0, this.totalQuestions);

    this.initQuestion();
  },

  updateStarsDisplay() {
    const starStr = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('g4-stars').innerText = starStr;
  },

  initQuestion() {
    this.updateStarsDisplay();
    document.getElementById('g4-feedback').style.display = "none";
    this.rabbitPos = 0; // 起始回到 0

    const q = this.questions[this.currentQuestion];
    this.targetVal = q.target;
    this.targetFrac = q.frac;
    this.targetFracText = q.text;
    this.lineDen = q.den;
    
    // 設定步長卡片
    const cardsArea = document.getElementById('g4-cards');
    cardsArea.innerHTML = "";
    
    q.steps.forEach((st, idx) => {
      const card = document.createElement('div');
      card.className = "g4-step-card";
      if (idx === 0) {
        card.style.borderColor = "var(--color-accent-pink)";
        this.selectedStep = st.val;
      }
      
      const valDiv = document.createElement('div');
      valDiv.className = "g4-step-card-val";
      valDiv.innerHTML = `<span class="math-fraction"><span class="num">${st.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${st.den}</span></span> 步`;
      
      const labelDiv = document.createElement('div');
      labelDiv.className = "g4-step-card-label";
      // 計算小數大小
      labelDiv.innerText = `等於 ${st.val}`;

      card.appendChild(valDiv);
      card.appendChild(labelDiv);
      
      card.onclick = () => {
        SoundManager.playClick();
        document.querySelectorAll('.g4-step-card').forEach(c => c.style.borderColor = "");
        card.style.borderColor = "var(--color-accent-pink)";
        this.selectedStep = st.val;
      };
      
      cardsArea.appendChild(card);
    });

    this.selectedStep = q.steps[0].val;

    // 題目文字更新
    const decText = this.targetVal.toString();
    const targetFracHTML = `<span class="math-fraction"><span class="num">${this.targetFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.targetFrac.den}</span></span>`;
    document.getElementById('g4-question-text').innerHTML = `請控制小兔子在數線上跳躍，讓牠停在與 <strong>${targetFracHTML}</strong>（等於 <strong>${decText}</strong>）等值的位置，開啟寶箱！`;

    TTSManager.speak(`第${this.currentQuestion + 1}題：請控制小兔子跳躍，讓牠停在五分之幾或十分之幾與${this.targetFracText}等值的位置，寶箱就藏在零點${Math.round(this.targetVal * 10)}喔！`);

    this.renderLine();

    // 綁定跳躍按鈕
    document.getElementById('btn-g4-jump-right').onclick = () => {
      this.jump(1); // 往右
    };
    document.getElementById('btn-g4-jump-left').onclick = () => {
      this.jump(-1); // 往左
    };
    document.getElementById('btn-g4-reset').onclick = () => {
      SoundManager.playClick();
      this.rabbitPos = 0;
      this.renderLine();
    };
  },

  renderLine() {
    const svg = document.getElementById('g4-line-svg');
    svg.innerHTML = "";

    const w = 750, h = 180;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const startX = 60;
    const endX = 690;
    const lineY = 110;
    const lineLength = endX - startX; // 630px 代表 1.0 (或 1.2 視刻度而定)
    
    // 設定數線的最大刻度值為 1.2
    const maxVal = 1.2;
    const valToX = (v) => startX + (v / maxVal) * lineLength;

    // 繪製主軸線
    const mainLine = SVGDrawer.createSVGNode("line", {
      x1: startX, y1: lineY, x2: endX, y2: lineY,
      stroke: "#5D4037", "stroke-width": 4
    });
    svg.appendChild(mainLine);

    // 繪製數線箭頭
    const arrow = SVGDrawer.createSVGNode("path", {
      d: `M ${endX} ${lineY - 8} L ${endX + 15} ${lineY} L ${endX} ${lineY + 8} Z`,
      fill: "#5D4037"
    });
    svg.appendChild(arrow);

    // 繪製整數刻度 0, 1
    const ticks = [0, 1];
    ticks.forEach(t => {
      const tx = valToX(t);
      const tickLine = SVGDrawer.createSVGNode("line", {
        x1: tx, y1: lineY - 15, x2: tx, y2: lineY + 15,
        stroke: "#5D4037", "stroke-width": 3
      });
      svg.appendChild(tickLine);
      
      const text = SVGDrawer.createSVGNode("text", {
        x: tx, y: lineY + 35,
        "text-anchor": "middle",
        "font-weight": "bold",
        "font-size": "18",
        fill: "#5D4037"
      });
      text.textContent = t.toString();
      svg.appendChild(text);
    });

    // 繪製分數等分小刻度
    for (let i = 1; i < maxVal * this.lineDen; i++) {
      const v = i / this.lineDen;
      if (v === 1) continue; // 整數跳過
      
      const tx = valToX(v);
      const isHalf = (i % (this.lineDen / 2) === 0);
      
      const tickLine = SVGDrawer.createSVGNode("line", {
        x1: tx, y1: lineY - (isHalf ? 10 : 6), x2: tx, y2: lineY + (isHalf ? 10 : 6),
        stroke: "#8D6E63", "stroke-width": isHalf ? 2 : 1.2
      });
      svg.appendChild(tickLine);
      
      // 繪製小數/分數輔助刻度 (半刻度或大刻度標記)
      if (isHalf || this.lineDen <= 8) {
        const subtext = SVGDrawer.createSVGNode("text", {
          x: tx, y: lineY - 18,
          "text-anchor": "middle",
          "font-size": "11",
          fill: "#8D6E63"
        });
        subtext.textContent = v.toFixed(1);
        svg.appendChild(subtext);
      }
    }

    // 繪製藏寶箱 🎁 (在 targetVal 位置)
    const treasureX = valToX(this.targetVal);
    const boxG = SVGDrawer.createSVGNode("g", {
      transform: `translate(${treasureX - 22}, ${lineY - 45})`
    });
    
    // 用 emoji 作為寶箱
    const boxText = SVGDrawer.createSVGNode("text", {
      x: 22, y: 30,
      "text-anchor": "middle",
      "font-size": "32"
    });
    boxText.textContent = "🎁";
    boxG.appendChild(boxText);
    svg.appendChild(boxG);

    // 繪製小兔子 🐰 (在 rabbitPos 位置)
    const rabbitX = valToX(this.rabbitPos);
    const rabbitG = SVGDrawer.createSVGNode("g", {
      id: "g4-rabbit-group",
      transform: `translate(${rabbitX - 20}, ${lineY - 48})`
    });
    const rabbitText = SVGDrawer.createSVGNode("text", {
      x: 20, y: 30,
      "text-anchor": "middle",
      "font-size": "34"
    });
    rabbitText.textContent = "🐰";
    rabbitG.appendChild(rabbitText);
    svg.appendChild(rabbitG);
    
    // 在兔子腳下畫一個紅色小倒三角標記當前刻度
    const arrowMarker = SVGDrawer.createSVGNode("polygon", {
      points: `${rabbitX},${lineY - 3} ${rabbitX - 6},${lineY - 12} ${rabbitX + 6},${lineY - 12}`,
      fill: "#FF5252"
    });
    svg.appendChild(arrowMarker);

    // 顯示兔子腳下刻度的分數
    if (this.rabbitPos > 0.01) {
      const currentFracText = SVGDrawer.createSVGNode("text", {
        x: rabbitX, y: lineY + 60,
        "text-anchor": "middle",
        "font-weight": "bold",
        "font-size": "14",
        fill: "#E64A19"
      });
      // 以 lineDen 為分母顯示分數
      const num = Math.round(this.rabbitPos * this.lineDen);
      currentFracText.textContent = `${num}/${this.lineDen}`;
      svg.appendChild(currentFracText);
    }
  },

  jump(dir) {
    const step = this.selectedStep * dir;
    const nextPos = Math.round((this.rabbitPos + step) * 1000) / 1000;
    
    if (nextPos < -0.01 || nextPos > 1.21) {
      TTSManager.speak("超出數線邊界囉！小兔子跳不過去！");
      return;
    }

    SoundManager.playClick();

    // 兔子跳躍動畫 (弧線拋物線跳躍)
    const rabbitG = document.getElementById('g4-rabbit-group');
    if (rabbitG) {
      rabbitG.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      // 先往上再平移
      // 這裡直接更新數值並繪圖是最簡單且穩定的方式，
      // 但為了讓跳躍 Wow 學生，我們可以用 JS 定時器來做簡單的動畫，或者直接重繪
      this.rabbitPos = nextPos;
      this.renderLine();
      this.checkLanding();
    }
  },

  checkLanding() {
    // 檢查是否降落在寶箱位置
    const diff = Math.abs(this.rabbitPos - this.targetVal);
    if (diff < 0.01) {
      // 降落成功！
      SoundManager.playCorrect();
      Confetti.start();

      const feedback = document.getElementById('g4-feedback');
      const fEmoji = document.getElementById('g4-feedback-emoji');
      const fMsg = document.getElementById('g4-feedback-msg');

      feedback.className = "feedback-overlay correct";
      feedback.style.display = "flex";
      fEmoji.innerText = "👑";
      const targetFracHTML = `<span class="math-fraction"><span class="num">${this.targetFrac.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${this.targetFrac.den}</span></span>`;
      fMsg.innerHTML = `找到寶箱！<br>${targetFracHTML} 剛好就在 ${this.targetVal}`;

      const tFracText = TTSManager.fractionToText(Math.round(this.targetVal * this.lineDen), this.lineDen);
      TTSManager.speak(`太棒了！小兔子跳到了十分之${Math.round(this.targetVal * 10)}，也就是${this.targetFracText}的位置！成功打開寶藏盒！`);

      // 寶箱打開動畫 (SVG 更換為開箱 🔓)
      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion >= this.totalQuestions) {
          this.endGame();
        } else {
          this.initQuestion();
        }
      }, 4000);
    }
  },

  endGame() {
    App.lastFinishedGame = 4;
    document.getElementById('result-stars').innerText = "⭐".repeat(this.scoreStars) + "☆".repeat(5 - this.scoreStars);
    document.getElementById('result-medal').innerText = "🏃";
    document.getElementById('result-title').innerText = "數線尋寶大師！";
    document.getElementById('result-text').innerText = "太完美了！你成功引導小兔子在數線上找到了所有的寶箱。你已經將分數、等值分數、和小數完美連結在一起了！";
    
    SoundManager.playCheer();
    App.showScreen('screen-result');
    TTSManager.speak("恭喜通關！你已經成功通過數線跳躍的試煉！你真是個分數天才！");
  }
};

// ==========================================================================
// 11. ⚔️ 雙人對戰模式 (PvP Game Arena Logic)
// ==========================================================================
const PvPGame = {
  currentQuestion: 0,
  totalQuestions: 30,
  scoreP1: 0,
  scoreP2: 0,
  
  options: [],
  correctOption: null,
  questionActive: false,
  questions: [],

  start(rounds = 30) {
    this.totalQuestions = rounds;
    this.currentQuestion = 0;
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    
    document.getElementById('pvp-score-p1').innerText = "得分: 0";
    document.getElementById('pvp-score-p2').innerText = "得分: 0";
    
    App.showScreen('screen-pvp');
    
    document.getElementById('btn-pvp-quit').onclick = () => {
      SoundManager.playClick();
      App.showScreen('screen-welcome');
      window.speechSynthesis.cancel();
    };

    // 題庫池，涵蓋五種等值分數的教學重點 ("都要")，每組擴充至 8 題，共 40 題
    const pool = [
      // 題型 1: 搶答等值分數
      [
        {
          type: 'fraction-eq',
          targetFrac: { num: 1, den: 2 },
          speakText: "請找出和二分之一等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 3, den: 6, display: '3/6' },
          wrongs: [
            { type: 'fraction', num: 2, den: 3, display: '2/3' },
            { type: 'fraction', num: 3, den: 8, display: '3/8' },
            { type: 'fraction', num: 2, den: 5, display: '2/5' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 2, den: 3 },
          speakText: "請找出和三分之二等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 4, den: 6, display: '4/6' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 4, den: 8, display: '4/8' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 3, den: 4 },
          speakText: "請找出和四分之三等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 6, den: 8, display: '6/8' },
          wrongs: [
            { type: 'fraction', num: 2, den: 3, display: '2/3' },
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 4, den: 10, display: '4/10' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 1, den: 3 },
          speakText: "請找出和三分之一等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 2, den: 6, display: '2/6' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 3, den: 8, display: '3/8' },
            { type: 'fraction', num: 2, den: 5, display: '2/5' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 3, den: 5 },
          speakText: "請找出和五分之三等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 6, den: 10, display: '6/10' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 4, den: 8, display: '4/8' },
            { type: 'fraction', num: 3, den: 4, display: '3/4' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 2, den: 5 },
          speakText: "請找出和五分之二等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 4, den: 10, display: '4/10' },
          wrongs: [
            { type: 'fraction', num: 1, den: 3, display: '1/3' },
            { type: 'fraction', num: 3, den: 8, display: '3/8' },
            { type: 'fraction', num: 3, den: 5, display: '3/5' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 5, den: 6 },
          speakText: "請找出和六分之五等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 10, den: 12, display: '10/12' },
          wrongs: [
            { type: 'fraction', num: 2, den: 3, display: '2/3' },
            { type: 'fraction', num: 3, den: 4, display: '3/4' },
            { type: 'fraction', num: 4, den: 5, display: '4/5' }
          ]
        },
        {
          type: 'fraction-eq',
          targetFrac: { num: 1, den: 4 },
          speakText: "請找出和四分之一等值的分數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 等值的分數！`,
          correct: { type: 'fraction', num: 2, den: 8, display: '2/8' },
          wrongs: [
            { type: 'fraction', num: 1, den: 3, display: '1/3' },
            { type: 'fraction', num: 2, den: 5, display: '2/5' },
            { type: 'fraction', num: 3, den: 10, display: '3/10' }
          ]
        }
      ],
      // 題型 2: 擴分填空 (問號求值)
      [
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？三分之二等於九分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3</span></span> = <span class="math-fraction"><span class="num">2 × 3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3 × 3</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">9</span></span></div>`,
          correct: { type: 'number', val: 6, display: '6' },
          wrongs: [
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 5, display: '5' },
            { type: 'number', val: 8, display: '8' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？四分之三等於八分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">4</span></span> = <span class="math-fraction"><span class="num">3 × 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">4 × 2</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8</span></span></div>`,
          correct: { type: 'number', val: 6, display: '6' },
          wrongs: [
            { type: 'number', val: 5, display: '5' },
            { type: 'number', val: 7, display: '7' },
            { type: 'number', val: 9, display: '9' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？二分之一等於八分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">2</span></span> = <span class="math-fraction"><span class="num">1 × 4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">2 × 4</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8</span></span></div>`,
          correct: { type: 'number', val: 4, display: '4' },
          wrongs: [
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 5, display: '5' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？五分之二等於十分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">5</span></span> = <span class="math-fraction"><span class="num">2 × 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">5 × 2</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10</span></span></div>`,
          correct: { type: 'number', val: 4, display: '4' },
          wrongs: [
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 5, display: '5' },
            { type: 'number', val: 8, display: '8' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？三分之一等於九分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3</span></span> = <span class="math-fraction"><span class="num">1 × 3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3 × 3</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">9</span></span></div>`,
          correct: { type: 'number', val: 3, display: '3' },
          wrongs: [
            { type: 'number', val: 2, display: '2' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？五分之三等於十分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">5</span></span> = <span class="math-fraction"><span class="num">3 × 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">5 × 2</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10</span></span></div>`,
          correct: { type: 'number', val: 6, display: '6' },
          wrongs: [
            { type: 'number', val: 5, display: '5' },
            { type: 'number', val: 7, display: '7' },
            { type: 'number', val: 8, display: '8' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？四分之一等於八分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">4</span></span> = <span class="math-fraction"><span class="num">1 × 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">4 × 2</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8</span></span></div>`,
          correct: { type: 'number', val: 2, display: '2' },
          wrongs: [
            { type: 'number', val: 1, display: '1' },
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 4, display: '4' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中問號的正確數值是多少？三分之二等於十二分之幾呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3</span></span> = <span class="math-fraction"><span class="num">2 × 4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">3 × 4</span></span> = <span class="math-fraction"><span class="num" style="color:var(--color-accent-pink);">?</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">12</span></span></div>`,
          correct: { type: 'number', val: 8, display: '8' },
          wrongs: [
            { type: 'number', val: 6, display: '6' },
            { type: 'number', val: 7, display: '7' },
            { type: 'number', val: 9, display: '9' }
          ]
        }
      ],
      // 題型 3: 分數轉小數
      [
        {
          type: 'frac-to-dec',
          targetFrac: { num: 4, den: 5 },
          speakText: "請搶答與五分之四相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.8, display: '0.8' },
          wrongs: [
            { type: 'decimal', val: 0.6, display: '0.6' },
            { type: 'decimal', val: 0.5, display: '0.5' },
            { type: 'decimal', val: 0.4, display: '0.4' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 3, den: 10 },
          speakText: "請搶答與十分之三相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.3, display: '0.3' },
          wrongs: [
            { type: 'decimal', val: 0.2, display: '0.2' },
            { type: 'decimal', val: 0.4, display: '0.4' },
            { type: 'decimal', val: 0.5, display: '0.5' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 1, den: 2 },
          speakText: "請搶答與二分之一相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.5, display: '0.5' },
          wrongs: [
            { type: 'decimal', val: 0.2, display: '0.2' },
            { type: 'decimal', val: 0.4, display: '0.4' },
            { type: 'decimal', val: 0.6, display: '0.6' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 2, den: 5 },
          speakText: "請搶答與五分之二相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.4, display: '0.4' },
          wrongs: [
            { type: 'decimal', val: 0.2, display: '0.2' },
            { type: 'decimal', val: 0.5, display: '0.5' },
            { type: 'decimal', val: 0.6, display: '0.6' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 1, den: 5 },
          speakText: "請搶答與五分之一相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.2, display: '0.2' },
          wrongs: [
            { type: 'decimal', val: 0.1, display: '0.1' },
            { type: 'decimal', val: 0.3, display: '0.3' },
            { type: 'decimal', val: 0.4, display: '0.4' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 3, den: 5 },
          speakText: "請搶答與五分之三相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.6, display: '0.6' },
          wrongs: [
            { type: 'decimal', val: 0.5, display: '0.5' },
            { type: 'decimal', val: 0.7, display: '0.7' },
            { type: 'decimal', val: 0.8, display: '0.8' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 7, den: 10 },
          speakText: "請搶答與十分之七相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.7, display: '0.7' },
          wrongs: [
            { type: 'decimal', val: 0.6, display: '0.6' },
            { type: 'decimal', val: 0.8, display: '0.8' },
            { type: 'decimal', val: 0.9, display: '0.9' }
          ]
        },
        {
          type: 'frac-to-dec',
          targetFrac: { num: 9, den: 10 },
          speakText: "請搶答與十分之九相等的小數！",
          headerHTML: (target) => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box"><div class="pvp-target-fraction" id="pvp-target-frac"><span class="num">${target.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${target.den}</span></div></div> 相等的小數！`,
          correct: { type: 'decimal', val: 0.9, display: '0.9' },
          wrongs: [
            { type: 'decimal', val: 0.8, display: '0.8' },
            { type: 'decimal', val: 0.99, display: '0.99' },
            { type: 'decimal', val: 0.1, display: '0.1' }
          ]
        }
      ],
      // 題型 4: 約分填空 (分母問號)
      [
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！八分之六等於幾分之三呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">6</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8</span></span> = <span class="math-fraction"><span class="num">6 ÷ 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8 ÷ 2</span></span> = <span class="math-fraction"><span class="num">3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 4, display: '4' },
          wrongs: [
            { type: 'number', val: 2, display: '2' },
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！十五分之九等於幾分之三呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">9</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">15</span></span> = <span class="math-fraction"><span class="num">9 ÷ 3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">15 ÷ 3</span></span> = <span class="math-fraction"><span class="num">3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 5, display: '5' },
          wrongs: [
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！十分之八等於幾分之四呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">8</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10</span></span> = <span class="math-fraction"><span class="num">8 ÷ 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10 ÷ 2</span></span> = <span class="math-fraction"><span class="num">4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 5, display: '5' },
          wrongs: [
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 8, display: '8' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！十二分之四等於幾分之一呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">12</span></span> = <span class="math-fraction"><span class="num">4 ÷ 4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">12 ÷ 4</span></span> = <span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 3, display: '3' },
          wrongs: [
            { type: 'number', val: 2, display: '2' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！十分之六等於幾分之三呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">6</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10</span></span> = <span class="math-fraction"><span class="num">6 ÷ 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">10 ÷ 2</span></span> = <span class="math-fraction"><span class="num">3</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 5, display: '5' },
          wrongs: [
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 6, display: '6' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！八分之四等於幾分之一呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8</span></span> = <span class="math-fraction"><span class="num">4 ÷ 4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">8 ÷ 4</span></span> = <span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 2, display: '2' },
          wrongs: [
            { type: 'number', val: 1, display: '1' },
            { type: 'number', val: 3, display: '3' },
            { type: 'number', val: 4, display: '4' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！六分之二等於幾分之一呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">6</span></span> = <span class="math-fraction"><span class="num">2 ÷ 2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">6 ÷ 2</span></span> = <span class="math-fraction"><span class="num">1</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 3, display: '3' },
          wrongs: [
            { type: 'number', val: 2, display: '2' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 5, display: '5' }
          ]
        },
        {
          type: 'formula-fill',
          speakText: "請搶答算式中分母問號的正確數值！十二分之八等於幾分之二呢？",
          headerHTML: () => `⚔️ 搶答問號的數值：<div class="pvp-target-box" style="font-size:1.6rem; font-weight:800; font-family:var(--font-family);"><span class="math-fraction"><span class="num">8</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">12</span></span> = <span class="math-fraction"><span class="num">8 ÷ 4</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">12 ÷ 4</span></span> = <span class="math-fraction"><span class="num">2</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den" style="color:var(--color-accent-pink);">?</span></span></div>`,
          correct: { type: 'number', val: 3, display: '3' },
          wrongs: [
            { type: 'number', val: 2, display: '2' },
            { type: 'number', val: 4, display: '4' },
            { type: 'number', val: 6, display: '6' }
          ]
        }
      ],
      // 題型 5: 小數轉分數
      [
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點七五相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.75</div> 相等的分數！`,
          correct: { type: 'fraction', num: 3, den: 4, display: '3/4' },
          wrongs: [
            { type: 'fraction', num: 2, den: 3, display: '2/3' },
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 1, den: 2, display: '1/2' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點六相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.6</div> 相等的分數！`,
          correct: { type: 'fraction', num: 3, den: 5, display: '3/5' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 3, den: 4, display: '3/4' },
            { type: 'fraction', num: 2, den: 3, display: '2/3' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點五相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.5</div> 相等的分數！`,
          correct: { type: 'fraction', num: 1, den: 2, display: '1/2' },
          wrongs: [
            { type: 'fraction', num: 1, den: 3, display: '1/3' },
            { type: 'fraction', num: 2, den: 5, display: '2/5' },
            { type: 'fraction', num: 3, den: 8, display: '3/8' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點四相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.4</div> 相等的分數！`,
          correct: { type: 'fraction', num: 2, den: 5, display: '2/5' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 1, den: 3, display: '1/3' },
            { type: 'fraction', num: 3, den: 10, display: '3/10' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點八相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.8</div> 相等的分數！`,
          correct: { type: 'fraction', num: 4, den: 5, display: '4/5' },
          wrongs: [
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 3, den: 4, display: '3/4' },
            { type: 'fraction', num: 2, den: 3, display: '2/3' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點二相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.2</div> 相等的分數！`,
          correct: { type: 'fraction', num: 1, den: 5, display: '1/5' },
          wrongs: [
            { type: 'fraction', num: 1, den: 2, display: '1/2' },
            { type: 'fraction', num: 2, den: 5, display: '2/5' },
            { type: 'fraction', num: 1, den: 3, display: '1/3' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點三相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.3</div> 相等的分數！`,
          correct: { type: 'fraction', num: 3, den: 10, display: '3/10' },
          wrongs: [
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 1, den: 3, display: '1/3' },
            { type: 'fraction', num: 2, den: 10, display: '2/10' }
          ]
        },
        {
          type: 'dec-to-frac',
          speakText: "請搶答與零點七相等的等值分數！",
          headerHTML: () => `⚔️ 烘焙對戰：請搶答與 <div class="pvp-target-box" style="font-size:1.6rem; font-weight:800;">0.7</div> 相等的分數！`,
          correct: { type: 'fraction', num: 7, den: 10, display: '7/10' },
          wrongs: [
            { type: 'fraction', num: 7, den: 8, display: '7/8' },
            { type: 'fraction', num: 3, den: 5, display: '3/5' },
            { type: 'fraction', num: 1, den: 2, display: '1/2' }
          ]
        }
      ]
    ];

    pool.forEach(group => this.shuffle(group));

    this.questions = [];
    for (let i = 0; i < this.totalQuestions; i++) {
      const groupIdx = i % pool.length;
      const qIdx = Math.floor(i / pool.length);
      this.questions.push(pool[groupIdx][qIdx]);
    }

    const cnRounds = TTSManager.numberToChinese(this.totalQuestions);
    TTSManager.speak(`對戰開始！同屏快速搶答，先按對正確答案的得十分，按錯扣五分，共有${cnRounds}題喔！`);

    setTimeout(() => this.initQuestion(), 2000);
  },

  initQuestion() {
    if (App.currentScreen !== 'screen-pvp') return; // 防呆

    this.questionActive = true;
    document.getElementById('pvp-p1-feedback').style.display = "none";
    document.getElementById('pvp-p2-feedback').style.display = "none";

    const q = this.questions[this.currentQuestion];
    this.correctOption = q.correct; // 快取當前正確選項以供搶答判定

    // 渲染對戰標題文字
    const header = document.querySelector('.pvp-header-banner');
    header.innerHTML = q.headerHTML(q.targetFrac);

    // 產生選項 (1個正確，3個錯誤)
    this.options = [q.correct, ...q.wrongs];
    this.shuffle(this.options);

    // 報讀題目 (動態加入題號)
    const qNumStr = TTSManager.numberToChinese(this.currentQuestion + 1);
    const fullSpeakText = `第${qNumStr}題，請搶答。${q.speakText}`;
    TTSManager.speak(fullSpeakText);

    // 渲染 P1 與 P2 選項按鈕
    this.renderPlayerOptions('p1');
    this.renderPlayerOptions('p2');
  },

  renderPlayerOptions(player) {
    const grid = document.getElementById(`pvp-options-${player}`);
    grid.innerHTML = "";

    // 拷貝選項以防順序相同
    const opts = [...this.options];
    // P2 選項打亂順序，使對戰更刺激
    if (player === 'p2') this.shuffle(opts);

    opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = "pvp-opt-btn";
      
      const frac = document.createElement('div');
      frac.className = "pvp-opt-fraction";
      
      if (opt.type === 'fraction') {
        frac.innerHTML = `<span class="num">${opt.num}</span><span class="bar-row"><span class="bar-cell"></span></span><span class="den">${opt.den}</span>`;
      } else {
        frac.innerHTML = `<span style="font-size:1.8rem; font-weight:800;">${opt.display}</span>`;
      }
      btn.appendChild(frac);

      btn.onclick = () => {
        if (!this.questionActive) return;
        this.handleAnswer(player, opt, btn);
      };

      grid.appendChild(btn);
    });
  },

  handleAnswer(player, opt, btnElement) {
    const isCorrect = (opt === this.correctOption);
    const feedbackOverlay = document.getElementById(`pvp-${player}-feedback`);

    if (isCorrect) {
      this.questionActive = false; // 該題搶答結束
      SoundManager.playCorrect();
      
      if (player === 'p1') {
        this.scoreP1 += 10;
        document.getElementById('pvp-score-p1').innerText = `得分: ${this.scoreP1}`;
      } else {
        this.scoreP2 += 10;
        document.getElementById('pvp-score-p2').innerText = `得分: ${this.scoreP2}`;
      }

      // 該玩家亮綠燈
      feedbackOverlay.className = "pvp-feedback-overlay correct";
      feedbackOverlay.style.display = "flex";
      feedbackOverlay.innerHTML = "<span class='feedback-emoji' style='font-size:3rem;'>🎯 得 10 分！</span>";

      // 另一方玩家顯示「被搶先囉」
      const otherPlayer = player === 'p1' ? 'p2' : 'p1';
      const otherFeedback = document.getElementById(`pvp-${otherPlayer}-feedback`);
      otherFeedback.className = "pvp-feedback-overlay wrong";
      otherFeedback.style.display = "flex";
      otherFeedback.innerHTML = "<span class='feedback-emoji' style='font-size:2.5rem;'>⏱️ 被搶先了！</span>";

      setTimeout(() => {
        this.currentQuestion++;
        if (this.currentQuestion >= this.totalQuestions) {
          this.endGame();
        } else {
          this.initQuestion();
        }
      }, 2500);

    } else {
      SoundManager.playWrong();
      // 答錯扣 5 分，按鈕禁用
      if (player === 'p1') {
        this.scoreP1 = Math.max(0, this.scoreP1 - 5);
        document.getElementById('pvp-score-p1').innerText = `得分: ${this.scoreP1}`;
      } else {
        this.scoreP2 = Math.max(0, this.scoreP2 - 5);
        document.getElementById('pvp-score-p2').innerText = `得分: ${this.scoreP2}`;
      }

      btnElement.disabled = true;
      btnElement.style.opacity = "0.3";
      
      feedbackOverlay.className = "pvp-feedback-overlay wrong";
      feedbackOverlay.style.display = "flex";
      feedbackOverlay.innerHTML = "<span class='feedback-emoji' style='font-size:3rem;'>❌ 扣 5 分！</span>";
      
      setTimeout(() => {
        feedbackOverlay.style.display = "none";
      }, 1500);
    }
  },

  endGame() {
    App.lastFinishedGame = 0; // PVP
    
    document.getElementById('result-stars').innerText = "";
    document.getElementById('result-medal').innerText = "⚔️";
    
    let winMsg = "";
    if (this.scoreP1 > this.scoreP2) {
      winMsg = "🐱 貓咪小廚神勝出！恭喜你贏得了這場烘焙對決！";
    } else if (this.scoreP2 > this.scoreP1) {
      winMsg = "🐰 兔子小廚神勝出！恭喜你贏得了這場烘焙對決！";
    } else {
      winMsg = "雙方打成平手！貓咪小廚神和兔子小廚神一樣厲害喔！";
    }

    document.getElementById('result-title').innerText = "對戰結果";
    document.getElementById('result-text').innerHTML = `
      <strong>貓咪小廚神 (P1) 得分：</strong> ${this.scoreP1} 分<br>
      <strong>兔子小廚神 (P2) 得分：</strong> ${this.scoreP2} 分<br><br>
      ${winMsg}
    `;

    SoundManager.playCheer();
    Confetti.start();
    App.showScreen('screen-result');
    
    TTSManager.speak(`烘焙對決結束！${winMsg.replace(/🐱|🐰/g, "")}`);
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
};

// --- 初始化執行 ---
window.onload = () => {
  App.init();
};
