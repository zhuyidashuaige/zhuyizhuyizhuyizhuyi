// 简易烟花与开幕式逻辑（纯前端，无依赖）
(function(){
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  let fireworks = [];
  let lastLaunch = 0;
  let auto = true;
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize(){
    w = canvas.width = Math.floor(window.innerWidth * DPR);
    h = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  // 工具函数
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  // 颜色：印尼红白 + 金色点缀
  const palette = ['#e31d2d','#ff5d6a','#ffd166','#ffffff'];

  class Particle{
    constructor(x,y,color,shape='circle',speed=rand(1.5,4.2),angle=rand(0,Math.PI*2),life=rand(46,80)){
      this.x=x; this.y=y;
      this.vx = Math.cos(angle)*speed;
      this.vy = Math.sin(angle)*speed;
      this.alpha = 1;
      this.life = life;
      this.color = color;
      this.size = rand(1.2,2.6);
      this.shape = shape;
      this.gravity = 0.04;
      this.drag = 0.985;
      this.twinkle = Math.random()<0.35;
      this.rotation = rand(0, Math.PI*2);
      this.rotationSpeed = rand(-0.1,0.1);
    }
    update(){
      this.vx *= this.drag;
      this.vy = this.vy * this.drag + this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.life--;
      if(this.twinkle) this.alpha = 0.6 + Math.sin(this.life*0.3)*0.4;
      else this.alpha = Math.max(0, this.life/80);
    }
    draw(ctx){
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      if(this.shape === 'heart'){
        drawHeart(ctx, this.x, this.y, this.size*0.9, this.rotation, this.color);
      }else{
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  class Firework{
    constructor(sx,sy,tx,ty,heart=false){
      this.sx = sx; this.sy = sy;
      this.x = sx; this.y = sy;
      this.tx = tx; this.ty = ty;
      this.speed = 7.2;
      const angle = Math.atan2(ty - sy, tx - sx);
      this.vx = Math.cos(angle)*this.speed;
      this.vy = Math.sin(angle)*this.speed;
      this.trail = [];
      this.trailMax = 6;
      this.exploded = false;
      this.color = pick(palette);
      this.heart = heart;
      this.brightness = rand(0.65, 1);
    }
    update(){
      this.trail.push([this.x, this.y]);
      if(this.trail.length > this.trailMax) this.trail.shift();
      this.vy += 0.06; // 轻微重力，弧线感
      this.x += this.vx;
      this.y += this.vy;

      // 接近目标时爆炸
      const distance = Math.hypot(this.tx - this.x, this.ty - this.y);
      if(distance < 10 || this.vy > 1.2){
        this.explode();
        this.exploded = true;
      }
    }
    explode(){
      const particles = [];
      const count = this.heart ? 160 : 90 + (Math.random()*60)|0;
      if(this.heart){
        // 心形分布
        for(let i=0;i<count;i++){
          const t = (i / count) * Math.PI*2;
          const rx = 16 * Math.pow(Math.sin(t), 3);
          const ry = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
          const scale = rand(0.8,1.1);
          const px = this.x + rx * scale;
          const py = this.y - ry * scale;
          const c = pick(['#ff6b8f','#e31d2d','#ffd1d1','#ffffff']);
          const p = new Particle(px, py, c, 'heart', rand(0.6,1.4), rand(0,Math.PI*2), rand(60,100));
          particles.push(p);
        }
      }else{
        // 圆形爆炸，混合红白与金色
        for(let i=0;i<count;i++){
          const angle = (i / count) * Math.PI*2 + rand(-0.05,0.05);
          const speed = rand(2.2, 5.2);
          const c = Math.random()<0.12 ? '#ffd166' : pick(palette);
          const shape = Math.random()<0.18 ? 'heart' : 'circle';
          particles.push(new Particle(this.x, this.y, c, shape, speed, angle, rand(56,90)));
        }
      }
      this.particles = particles;
    }
    draw(ctx){
      // 轨迹
      ctx.globalAlpha = 0.8 * this.brightness;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let [sx, sy] = this.trail[0] || [this.x, this.y];
      ctx.moveTo(sx, sy);
      for(const [tx, ty] of this.trail){
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // 前端亮点
      ctx.globalAlpha = 1 * this.brightness;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function drawHeart(ctx, x, y, s=1, rot=0, color='#ff6b8f'){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.bezierCurveTo(3.2, -8.2, 9.2, -6, 9, -1.2);
    ctx.bezierCurveTo(8.8, 3.4, 4.2, 6.6, 0, 9.2);
    ctx.bezierCurveTo(-4.2, 6.6, -8.8, 3.4, -9, -1.2);
    ctx.bezierCurveTo(-9.2, -6, -3.2, -8.2, 0, -4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // 渲染循环
  function animate(ts){
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(9,12,16,0.20)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.globalCompositeOperation = 'lighter';

    // 自动发射
    if(auto && (!lastLaunch || ts - lastLaunch > rand(350, 900))){
      lastLaunch = ts;
      const startX = rand(0.15*window.innerWidth, 0.85*window.innerWidth);
      const startY = window.innerHeight + 10;
      const targetX = startX + rand(-140, 140);
      const targetY = rand(80, window.innerHeight*0.45);
      const heartChance = Math.random() < 0.25;
      fireworks.push(new Firework(startX, startY, targetX, targetY, heartChance));
    }

    // 更新/绘制烟花
    const newFireworks = [];
    const particlesAll = [];
    for(const fw of fireworks){
      if(!fw.exploded){
        fw.update();
        fw.draw(ctx);
        newFireworks.push(fw);
      }else if(fw.particles){
        particlesAll.push(...fw.particles);
      }
    }
    fireworks = newFireworks;

    // 单独管理粒子衰减
    if(!animate.particles) animate.particles = [];
    if(particlesAll.length) animate.particles.push(...particlesAll);

    const updatedParticles = [];
    for(const p of animate.particles){
      p.update();
      if(p.life > 0 && p.alpha > 0){
        p.draw(ctx);
        updatedParticles.push(p);
      }
    }
    animate.particles = updatedParticles;

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // 新增：等待用户点击以弹出游戏邀请
  let awaitInviteClick = false;
  function burstAt(x, y, isHeart=false){
    const fw = new Firework(x, window.innerHeight+10, x + rand(-40,40), y, isHeart);
    fw.explode();
    fw.exploded = true;
    fireworks.push(fw);
  }
  // 点击/触摸手动绽放（改造：当等待弹窗时，不放礼花而是弹窗）
  window.addEventListener('click', e=>{
    if (awaitInviteClick) {
      const modal = document.getElementById('gameInviteModal');
      modal && modal.classList.add('show');
      awaitInviteClick = false;
      return; // 阻止这次礼花
    }
    if(!document.getElementById('boatGame').classList.contains('show')){
      burstAt(e.clientX, e.clientY, Math.random()<0.5);
    }
  }, {passive:true});
  window.addEventListener('touchstart', e=>{
    if (awaitInviteClick) {
      const modal = document.getElementById('gameInviteModal');
      modal && modal.classList.add('show');
      awaitInviteClick = false;
      return; // 阻止这次礼花
    }
    if(!document.getElementById('boatGame').classList.contains('show')){
      const t = e.touches[0];
      burstAt(t.clientX, t.clientY, true);
    }
  }, {passive:true});

  // 开幕式控制
  const opening = document.getElementById('opening');
  const enterBtn = document.getElementById('enterBtn');
  const gameInviteModal = document.getElementById('gameInviteModal');

  function endOpening(){
    if(!opening.classList.contains('hide')){
      opening.classList.add('hide');
      // 结尾礼花加强
      for(let i=0;i<5;i++){
        setTimeout(()=>{
          burstAt(window.innerWidth*0.5 + rand(-120,120), window.innerHeight*0.35 + rand(-40,40), i%2===0);
        }, i*160);
      }
      // 改造：不再自动弹窗，改为等待用户下一次点击时再弹窗
      awaitInviteClick = true;
    }
  }

  // 自动播放开幕式 5.5s 后结束
  setTimeout(endOpening, 5500);
  enterBtn.addEventListener('click', endOpening);

  // 开始时来一波礼花
  setTimeout(()=>{
    for(let i=0;i<4;i++){
      setTimeout(()=>{
        burstAt(window.innerWidth*0.5 + rand(-80,80), window.innerHeight*0.4 + rand(-40,40), i%2===0);
      }, i*200);
    }
  }, 400);

})();

// 游戏逻辑
(function(){
  const gameInviteModal = document.getElementById('gameInviteModal');
  const acceptBtn = document.getElementById('acceptGame');
  const declineBtn = document.getElementById('declineGame');
  const boatGame = document.getElementById('boatGame');
  const clickArea = document.getElementById('clickArea');
  const clickCountEl = document.getElementById('clickCount');
  const myBoat = document.getElementById('myBoat');
  const herBoat = document.getElementById('herBoat');
  const restartBtn = document.getElementById('restartGame');
  const resultModal = document.getElementById('gameResultModal');
  const resultTitle = document.getElementById('resultTitle');
  const resultMessage = document.getElementById('resultMessage');
  const resultOK = document.getElementById('resultOK');
  const nextPage = document.getElementById('nextPage');
  const crowdEl = document.getElementById('crowd');

  // 新增：水面动画
  const waterCanvas = document.getElementById('waterCanvas');
  let waterCtx, waterRAF = null, t = 0;
  function resizeWater(){
    if(!waterCanvas) return;
    const river = document.querySelector('.race-track.river');
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    waterCanvas.width  = Math.floor(river.clientWidth  * DPR);
    waterCanvas.height = Math.floor(river.clientHeight * DPR);
    waterCanvas.style.width  = river.clientWidth + 'px';
    waterCanvas.style.height = river.clientHeight + 'px';
    waterCtx = waterCanvas.getContext('2d');
    waterCtx.setTransform(1,0,0,1,0,0);
    waterCtx.scale(DPR, DPR);
  }
  function drawWater(){
    if(!waterCtx) return;
    const w = waterCanvas.clientWidth;
    const h = waterCanvas.clientHeight;
    waterCtx.clearRect(0,0,w,h);

    // 基础水色渐变
    const g = waterCtx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, '#15314d');
    g.addColorStop(1, '#0b1f36');
    waterCtx.fillStyle = g;
    waterCtx.fillRect(0,0,w,h);

    // 多层正弦波
    const waves = [
      {amp: 6, len: 140, speed: 0.8, color: 'rgba(255,255,255,0.18)'},
      {amp: 4, len: 90,  speed: 1.2, color: 'rgba(255,255,255,0.12)'},
      {amp: 3, len: 60,  speed: 1.8, color: 'rgba(255,255,255,0.10)'}
    ];
    waves.forEach((wv,i)=>{
      waterCtx.beginPath();
      for(let x=0; x<=w; x+=2){
        const y = h*0.35 + i*18 + Math.sin((x + t*60*wv.speed)/wv.len*2*Math.PI) * wv.amp;
        if(x===0) waterCtx.moveTo(x,y); else waterCtx.lineTo(x,y);
      }
      waterCtx.lineTo(w,h); waterCtx.lineTo(0,h); waterCtx.closePath();
      waterCtx.fillStyle = wv.color;
      waterCtx.fill();
    });

    // 高光碎片
    waterCtx.globalAlpha = 0.18;
    for(let i=0;i<20;i++){
      const x = (i*53 + (t*40)%200) % w;
      const y = (h*0.25 + (i%3)*26) + Math.sin((t*2+i)*0.8)*6;
      waterCtx.fillStyle = 'white';
      waterCtx.fillRect(x, y, 20, 1);
    }
    waterCtx.globalAlpha = 1.0;
  }
  function loopWater(ts){
    t += 0.016; // ~60fps
    drawWater();
    waterRAF = requestAnimationFrame(loopWater);
  }
  function startWater(){
    resizeWater();
    cancelAnimationFrame(waterRAF);
    waterRAF = requestAnimationFrame(loopWater);
  }
  function stopWater(){
    cancelAnimationFrame(waterRAF);
    waterRAF = null;
  }
  window.addEventListener('resize', ()=>{ if(boatGame.classList.contains('show')) resizeWater(); });

  let gameStarted = false;
  let clickCount = 0;
  let myPosition = 60;
  let herPosition = 60;
  let gameInterval;
  let raceFinished = false;
  let finishLine = 0;

  function computeFinish(){
    const lane = document.getElementById('myTrack');
    if(lane){
      finishLine = Math.max(140, lane.clientWidth - 110);
    }
  }
  window.addEventListener('resize', computeFinish);

  const shouts = ['Go!', 'Semangat!', 'Mantap!', 'Hebat!', 'Ayo!', 'Cepat!', 'Horee!'];
  const fans = ['👏','🙌','🎉','💖','🔥','💪','🫶','🥳','⭐','🎊'];
  function initCrowd(){
    if(crowdEl && !crowdEl.childElementCount){
      const total = 36;
      for(let i=0;i<total;i++){
        const span = document.createElement('div');
        span.className = 'fan';
        span.textContent = fans[(Math.random()*fans.length)|0];
        span.dataset.shout = shouts[(Math.random()*shouts.length)|0];
        span.style.animationDelay = (Math.random()*1.2).toFixed(2)+'s';
        crowdEl.appendChild(span);
      }
    }
  }
  function cheer(){
    if(!crowdEl) return;
    const all = crowdEl.querySelectorAll('.fan');
    if(!all.length) return;
    const one = all[(Math.random()*all.length)|0];
    one.classList.add('yell');
    setTimeout(()=>one.classList.remove('yell'), 400);
  }
  function boostPaddles(boat){
    boat.classList.add('boost');
    clearTimeout(boat._boostTimer);
    boat._boostTimer = setTimeout(()=>boat.classList.remove('boost'), 320);
  }

  acceptBtn.addEventListener('click', startGame);
  declineBtn.addEventListener('click', () => {
    gameInviteModal.classList.remove('show');
  });

  function startGame(){
    gameInviteModal.classList.remove('show');
    boatGame.classList.add('show');
    initCrowd();
    computeFinish();
    startWater(); // 开始水面动画
    resetGame();
    gameStarted = true;

    // 我：中上速度匀速 + 自然划桨频率
    gameInterval = setInterval(() => {
      if(!raceFinished){
        myPosition += 3.6;
        myBoat.style.left = myPosition + 'px';
        if(myPosition >= finishLine){
          endGame(false);
        }image.png
      }
    }, 100);
  }

  function resetGame(){
    clickCount = 0;
    myPosition = 60;
    herPosition = 60;
    raceFinished = false;
    clickCountEl.textContent = '0';
    myBoat.style.left = myPosition + 'px';
    herBoat.style.left = herPosition + 'px';
    restartBtn.style.display = 'none';
  }

  clickArea.addEventListener('click', () => {
    if(gameStarted && !raceFinished){
      clickCount++;
      clickCountEl.textContent = clickCount;

      // 她：点击越多速度越快（有上限）
      const step = Math.min(9.2, 3.0 + clickCount * 0.12);
      herPosition += step;
      herBoat.style.left = herPosition + 'px';

      boostPaddles(herBoat);
      cheer();

      if(herPosition >= finishLine){
        endGame(true);
      }
    }
  });

  function endGame(herWon){
    raceFinished = true;
    gameStarted = false;
    clearInterval(gameInterval);
    restartBtn.style.display = 'block';
    
    setTimeout(() => {
      if(herWon){
        resultTitle.textContent = '🎉 Selamat Adeekk! 🎉';
        resultMessage.textContent = 'adeekk, you are the best boat racer!';
        resultOK.onclick = () => {
          resultModal.classList.remove('show');
          boatGame.classList.remove('show');
          stopWater(); // 进入下一页时停止水面动画
          // 新：显示非洲菊页面
          showNextPage();
        };
      } else {
        resultTitle.textContent = '😄 再试一次吧！';
        resultMessage.textContent = 'adeekk, do more exercise, hahaha';
        resultOK.onclick = () => {
          resultModal.classList.remove('show');
        };
      }
      resultModal.classList.add('show');
    }, 500);
  }

  restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
  });

})();

// 下一页面：三次点击依次生长非洲菊（种子→花朵完整过程）
(function(){
  const nextPage = document.getElementById('nextPage');
  const garden = document.getElementById('garden');

  let bloomCount = 0;
  const flowerTypes = ['yellow', 'white', 'red'];
  const flowerNames = ['黄色非洲菊', '白色非洲菊', '红色非洲菊'];

  // 对外暴露：在赢了之后调用
  window.showNextPage = function showNextPage(){
    bloomCount = 0;
    garden.innerHTML = '';
    nextPage.classList.add('show');

    // 设置点击监听
    if(!nextPage.dataset.bind){
      nextPage.addEventListener('click', handleGrowthClick, {passive:true});
      nextPage.dataset.bind = '1';
    }
  };

  function handleGrowthClick(e){
    if(!nextPage.classList.contains('show')) return;
    if(bloomCount >= 3) return;

    const rect = garden.getBoundingClientRect();
    const baseY = Math.min(rect.height * 0.58, rect.height - 120);
    const cx = rect.width / 2;
    const shiftX = 50; // 向右偏移 50px

    bloomCount++;
    let x, y;
    
    if(bloomCount === 1){
      x = cx + shiftX; y = baseY;
    }else if(bloomCount === 2){
      x = cx - 160 + shiftX; y = baseY - 12;
    }else if(bloomCount === 3){
      x = cx + 160 + shiftX; y = baseY - 12;
    }

    // 开始完整的生长过程
    startFlowerGrowth(flowerTypes[bloomCount-1], flowerNames[bloomCount-1], x, y);
  }

  function startFlowerGrowth(type, name, x, y){
    const container = document.createElement('div');
    container.className = 'flower-growth';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    garden.appendChild(container);

    // 阶段1: 种子降落 (0-0.8s)
    createSeed(container);
    
    // 阶段2: 萌发 (0.8-2s)
    setTimeout(() => createSprout(container), 800);
    
    // 阶段3: 茎叶生长 (3-5.5s)
    setTimeout(() => createStemAndLeaves(container), 3000);
    
    // 阶段4: 花苞形成 (5.5-8s)
    setTimeout(() => createBud(container, type), 5500);
    
    // 阶段5: 花朵绽放 (8-10s)
    setTimeout(() => createBloomingFlower(container, type), 8000);
    
    // 阶段6: 成熟效果 (10s+)
    setTimeout(() => addMatureEffects(container, type), 10000);
    
    // 显示生长提示
    showGrowthNotification(name);
  }

  function createSeed(container){
    const seed = document.createElement('div');
    seed.className = 'seed';
    container.appendChild(seed);
    
    // 种子破裂效果
    setTimeout(() => {
      seed.style.animation = 'none';
      seed.style.background = 'radial-gradient(circle, #654321, #8b4513)';
      seed.style.transform = 'translateX(-50%) scale(1.2)';
      setTimeout(() => seed.remove(), 500);
    }, 800);
  }

  function createSprout(container){
    const sprout = document.createElement('div');
    sprout.className = 'sprout';
    
    const tip = document.createElement('div');
    tip.className = 'sprout-tip';
    
    sprout.appendChild(tip);
    container.appendChild(sprout);
  }

  function createStemAndLeaves(container){
    const stemGroup = document.createElement('div');
    stemGroup.className = 'stem-growing';
    
    const stem = document.createElement('div');
    stem.className = 'stem';
    
    const leftLeaf = document.createElement('div');
    leftLeaf.className = 'leaf left';
    
    const rightLeaf = document.createElement('div');
    rightLeaf.className = 'leaf right';
    
    stemGroup.append(stem, leftLeaf, rightLeaf);
    container.appendChild(stemGroup);
  }

  function createBud(container, type){
    const bud = document.createElement('div');
    bud.className = 'bud';
    
    const budOuter = document.createElement('div');
    budOuter.className = 'bud-outer';
    
    // 根据花朵类型设置花苞颜色
    const budColors = {
      yellow: 'linear-gradient(to top, #228b22, #90ee90, #ffe08a)',
      white: 'linear-gradient(to top, #228b22, #90ee90, #f0f8ff)', 
      red: 'linear-gradient(to top, #228b22, #90ee90, #ffb6c1)'
    };
    budOuter.style.background = budColors[type];
    
    bud.appendChild(budOuter);
    container.appendChild(bud);
  }

  function createBloomingFlower(container, type){
    const flowerBloom = document.createElement('div');
    flowerBloom.className = 'flower-bloom';
    
    // 创建SVG花朵
    const svg = createFlowerSVG(type);
    flowerBloom.appendChild(svg);
    container.appendChild(flowerBloom);
  }

  // 修复createFlowerSVG函数，确保ViewBox正确
  function createFlowerSVG(type){
    const schemes = {
      yellow: { 
        petals: ['#ffe08a', '#ffc64d', '#ffdf70'], 
        center: ['#6b3e00', '#2d1c00'], 
        pollen: '#ffd166' 
      },
      white: { 
        petals: ['#ffffff', '#f3f6ff', '#f1f4ff'], 
        center: ['#6b6b6b', '#2c2c2c'], 
        pollen: '#eaeaea' 
      },
      red: { 
        petals: ['#ff6b6b', '#e31d2d', '#ff7878'], 
        center: ['#4a0b0b', '#1f0404'], 
        pollen: '#ffb3b3' 
      }
    };
    
    const scheme = schemes[type];
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    // 修复ViewBox，确保花朵完全显示
    svg.setAttribute('viewBox', '-80 -80 160 160');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';
    
    // 渐变定义
    const defs = document.createElementNS(svgNS, 'defs');
    
    // 花瓣渐变
    const gradId = 'grad-' + type + '-' + Math.random().toString(36).slice(2);
    const grad = document.createElementNS(svgNS, 'radialGradient');
    grad.setAttribute('id', gradId);
    
    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', scheme.petals[0]);
    
    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '70%');
    stop2.setAttribute('stop-color', scheme.petals[1]);
    
    const stop3 = document.createElementNS(svgNS, 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', scheme.petals[2]);
    
    grad.append(stop1, stop2, stop3);
    
    // 为花心创建独立的SVG渐变
    const centerGradId = 'center-grad-' + type + '-' + Math.random().toString(36).slice(2);
    const centerGrad = document.createElementNS(svgNS, 'radialGradient');
    centerGrad.setAttribute('id', centerGradId);
    centerGrad.setAttribute('cx', '50%');
    centerGrad.setAttribute('cy', '50%');
    centerGrad.setAttribute('r', '50%');
    
    const centerStop1 = document.createElementNS(svgNS, 'stop');
    centerStop1.setAttribute('offset', '0%');
    centerStop1.setAttribute('stop-color', scheme.center[0]);
    
    const centerStop2 = document.createElementNS(svgNS, 'stop');
    centerStop2.setAttribute('offset', '100%');
    centerStop2.setAttribute('stop-color', scheme.center[1]);
    
    centerGrad.append(centerStop1, centerStop2);
    defs.append(grad, centerGrad);
    svg.appendChild(defs);
    
    // 花瓣层（3层错位）
    for(let layer = 0; layer < 3; layer++){
      const group = document.createElementNS(svgNS, 'g');
      group.setAttribute('class', `petal-layer layer${layer + 1}`);
      
      const petalCount = 24 - layer * 4;
      const petalSize = 45 - layer * 6; // 增大花瓣尺寸
      
      for(let i = 0; i < petalCount; i++){
        const angle = (i / petalCount) * 360 + layer * 7.5;
        const petal = document.createElementNS(svgNS, 'ellipse');
        petal.setAttribute('cx', 0);
        petal.setAttribute('cy', -petalSize/2);
        petal.setAttribute('rx', 10 - layer);
        petal.setAttribute('ry', petalSize);
        petal.setAttribute('fill', `url(#${gradId})`);
        petal.setAttribute('opacity', 0.9 - layer * 0.1);
        petal.setAttribute('transform', `rotate(${angle})`);
        group.appendChild(petal);
      }
      svg.appendChild(group);
    }
    
    // 花心
    const center = document.createElementNS(svgNS, 'circle');
    center.setAttribute('class', 'flower-center');
    center.setAttribute('cx', 0);
    center.setAttribute('cy', 0);
    center.setAttribute('r', 18); // 增大花心
    center.setAttribute('fill', `url(#${centerGradId})`);
    svg.appendChild(center);
    
    // 添加花粉点
    for(let i = 0; i < 15; i++){
      const pollenDot = document.createElementNS(svgNS, 'circle');
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      pollenDot.setAttribute('cx', x);
      pollenDot.setAttribute('cy', y);
      pollenDot.setAttribute('r', Math.random() * 1.5 + 0.5);
      pollenDot.setAttribute('fill', scheme.pollen);
      pollenDot.setAttribute('opacity', 0.8);
      svg.appendChild(pollenDot);
    }
    
    return svg;
  }

  function addMatureEffects(container, type){
    container.classList.add('flower-mature');
    
    // 花粉粒子效果
    createPollenParticles(container);
    
    // 环绕微光
    createSparkleRing(container);
  }

  function createPollenParticles(container){
    // 动态计算花心坐标，并叠加花朵的水平偏移（--flower-offset-x）
    const H = container.offsetHeight;
    const W = container.offsetWidth;
    const styles = getComputedStyle(container);
    const stemHVar = styles.getPropertyValue('--stem-h').trim();
    const offsetXVar = styles.getPropertyValue('--flower-offset-x').trim();
    const stemH = parseFloat(stemHVar || '130');
    const offsetX = parseFloat(offsetXVar || '0'); // 50px -> 50
    const centerX = W / 2 + offsetX;
    const centerY = H - (20 + stemH); // 茎顶=花心的Y
  
    const interval = setInterval(() => {
      if(!container.parentNode) {
        clearInterval(interval);
        return;
      }
      for(let i = 0; i < 3; i++){
        const particle = document.createElement('div');
        particle.className = 'pollen-particle';
  
        const startX = centerX + (Math.random() - 0.5) * 20;
        const startY = centerY + (Math.random() - 0.5) * 20;
        const endX = (Math.random() - 0.5) * 60;
        const endY = -30 - Math.random() * 40;
  
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.setProperty('--pollen-x', endX + 'px');
        particle.style.setProperty('--pollen-y', endY + 'px');
        particle.style.animationDelay = Math.random() * 2 + 's';
  
        container.appendChild(particle);
  
        setTimeout(() => {
          if(particle.parentNode) particle.remove();
        }, 3000);
      }
    }, 1000);
  
    container._pollenInterval = interval;
  }

  function createSparkleRing(container){
    const sparkleRing = document.createElement('div');
    sparkleRing.className = 'sparkle-ring';
  
    for(let i = 0; i < 8; i++){
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.animationDelay = (i * 0.25) + 's';
      sparkle.style.transform = `rotate(${i * 45}deg) translateX(60px)`;
      sparkleRing.appendChild(sparkle);
    }
  
    container.appendChild(sparkleRing);
  }

  function showGrowthNotification(flowerName){
    // 可选：显示生长提示文字
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); color: #ffd166; padding: 8px 16px;
      border-radius: 20px; font-size: 14px; z-index: 300;
      animation: fadeInOut 3s ease-out forwards;
    `;
    notification.textContent = `✨ ${flowerName}正在生长...`;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }

})();