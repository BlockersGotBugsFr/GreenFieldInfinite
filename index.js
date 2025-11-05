(() => {
  if (window.__wasdBlockCleanup) window.__wasdBlockCleanup();

  const size = 40;
  const speed = 300;
  const bulletSpeed = 500;

  let level = 1;
  let score = 0;

  // Score display
  const scoreDisplay = document.createElement('div');
  Object.assign(scoreDisplay.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    color: 'white',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    zIndex: 2147483651,
    textShadow: '0 0 4px black'
  });
  scoreDisplay.textContent = `Score: ${score}`;
  document.body.appendChild(scoreDisplay);

  // Background
  const bgBlock = document.createElement('div');
  Object.assign(bgBlock.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '10000px',
    height: '10000px',
    background: 'green',
    zIndex: 2147483645,
    pointerEvents: 'auto',
  });
  document.body.appendChild(bgBlock);

  // Player block
  const block = document.createElement('div');
  Object.assign(block.style, {
    position: 'fixed',
    left: '200px',
    top: '150px',
    width: size + 'px',
    height: size + 'px',
    background: 'tan',
    border: '2px solid black',
    borderRadius: '6px',
    boxShadow: '0 6px 16px rgba(0,0,0,.35)',
    zIndex: 2147483647,
    pointerEvents: 'none',
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });

  // Text inside player
  const textSpan = document.createElement('span');
  textSpan.innerText = "| |";
  Object.assign(textSpan.style, {
    color: "black",
    fontSize: "14px",
    fontFamily: "sans-serif",
    position: "relative",
    webkitTextStroke: "2px black"
  });
  block.appendChild(textSpan);
  document.body.appendChild(block);

  let x = window.innerWidth / 2 - size / 2;
  let y = window.innerHeight / 2 - size / 2;
  block.style.left = x + 'px';
  block.style.top = y + 'px';

  const keys = new Set();
  const bullets = [];
  const enemies = [];
  let raf = null;
  let last = performance.now();
  let paused = false;

  const onKeyUp = (e) => keys.delete(e.key.toLowerCase());

  const onClick = (e) => {
    if (paused) return;
    const rect = block.getBoundingClientRect();
    const bx = rect.left + size / 2;
    const by = rect.top + size / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const dirX = dx / len;
    const dirY = dy / len;

    // bullet
    const bullet = document.createElement('div');
    Object.assign(bullet.style, {
      position: 'fixed',
      left: bx - 5 + 'px',
      top: by - 5 + 'px',
      width: '10px',
      height: '10px',
      background: 'yellow',
      borderRadius: '50%',
      border: '2px solid black',
      boxShadow: '0 6px 16px rgba(255, 255, 0, 1)',
      zIndex: 2147483646,
      pointerEvents: 'none',
    });
    document.body.appendChild(bullet);
    bullets.push({ el: bullet, x: bx - 5, y: by - 5, dx: dirX, dy: dirY });
  };

  function spawnEnemy() {
    const types = ['Zombie', 'Tank', 'Speedy'];
    if (score >= 50) types.push('Ghost');
    if (score >= 100) types.push('Leech');
    const type = types[Math.floor(Math.random() * types.length)];

    // Enemy as image
    const enemy = document.createElement('img');
    enemy.type = type;
    enemy.style.position = 'fixed';
    enemy.style.pointerEvents = 'none';
    enemy.style.zIndex = 2147483648;

    switch(type) {
      case 'Zombie':
        enemy.src = 'Zombies/Zombie.png';
        enemy.hp = 1;
        enemy.speed = 100;
        enemy.style.width = size + 'px';
        enemy.style.height = size + 'px';
        break;
      case 'Tank':
        enemy.src = 'Zombies/Tank idle.png';
        enemy.hp = 5;
        enemy.speed = 75;
        enemy.style.width = '70px';
        enemy.style.height = '70px';
        break;
      case 'Speedy':
        enemy.src = 'Zombies/Speedy.png';
        enemy.hp = 1;
        enemy.speed = 250;
        enemy.style.width = '35px';
        enemy.style.height = '35px';
        break;
      case 'Ghost':
        enemy.src = 'Zombies/Ghost.png';
        enemy.hp = 2;
        enemy.speed = 200;
        enemy.style.opacity = 0.1;
        enemy.immunityChance = 0.8;
        enemy.style.width = size + 'px';
        enemy.style.height = size + 'px';
        break;
      case 'Leech':
        enemy.src = 'Zombies/Leech.png';
        enemy.hp = 1;
        enemy.speed = 400;
        enemy.style.width = '15px';
        enemy.style.height = '15px';
        break;
    }

    // Spawn outside screen
    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    if (side === 0) { ex = -100; ey = Math.random() * window.innerHeight; }
    if (side === 1) { ex = window.innerWidth + 100; ey = Math.random() * window.innerHeight; }
    if (side === 2) { ex = Math.random() * window.innerWidth; ey = -100; }
    if (side === 3) { ex = Math.random() * window.innerWidth; ey = window.innerHeight + 100; }

    enemy.x = ex;
    enemy.y = ey;
    enemy.style.left = ex + 'px';
    enemy.style.top = ey + 'px';
    document.body.appendChild(enemy);
    enemies.push(enemy);
  }

  function popEffect(el) {
    el.style.transition = "transform 0.1s ease";
    el.style.transform = "scale(1.3)";
    setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 100);
  }

  let spawnTimer = 0;

  function loop(t) {
    if (paused) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    spawnTimer += dt;
    if (spawnTimer >= 1.5) {
      spawnEnemy();
      spawnTimer = 0;
    }

    // Player movement
    let dx = 0, dy = 0;
    if (keys.has('w')) dy -= 1;
    if (keys.has('s')) dy += 1;
    if (keys.has('a')) dx -= 1;
    if (keys.has('d')) dx += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      x += dx * speed * dt;
      y += dy * speed * dt;
      x = Math.max(0, Math.min(x, window.innerWidth - size));
      y = Math.max(0, Math.min(y, window.innerHeight - size));
      block.style.left = x + 'px';
      block.style.top = y + 'px';
    }

    // Move text inside player
    let offsetX = 0, offsetY = 0;
    if (keys.has('w')) offsetY -= 5;
    if (keys.has('s')) offsetY += 5;
    if (keys.has('a')) offsetX -= 5;
    if (keys.has('d')) offsetX += 5;
    textSpan.style.left = offsetX + "px";
    textSpan.style.top = offsetY + "px";

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx * bulletSpeed * dt;
      b.y += b.dy * bulletSpeed * dt;
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
      if (b.x < -20 || b.y < -20 || b.x > window.innerWidth + 20 || b.y > window.innerHeight + 20) {
        b.el.remove();
        bullets.splice(i, 1);
      }
    }

    // Enemies
    const playerRect = block.getBoundingClientRect();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dx = playerRect.left - e.x;
      const dy = playerRect.top - e.y;
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * e.speed * dt;
      const vy = (dy / len) * e.speed * dt;

      e.x += vx;
      e.y += vy;
      e.style.left = e.x + 'px';
      e.style.top = e.y + 'px';

      // Collision with player
      const er = e.getBoundingClientRect();
      if (er.left < playerRect.right && er.right > playerRect.left &&
          er.top < playerRect.bottom && er.bottom > playerRect.top) {

        paused = true;
        cancelAnimationFrame(raf);

        // GAME OVER screen code here (same as original)...
        // [You can copy-paste your full Game Over screen from original code]
      }

      // Bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const br = b.el.getBoundingClientRect();
        const er2 = e.getBoundingClientRect();
        if (br.left < er2.right && br.right > er2.left &&
            br.top < er2.bottom && br.bottom > er2.top) {

          if (e.type === 'Ghost') {
            if (Math.random() < (e.immunityChance || 0.8)) continue;
          }

          popEffect(e);
          e.hp -= 1;
          b.el.remove();
          bullets.splice(j, 1);
          if (e.hp <= 0) {
            e.remove();
            enemies.splice(i, 1);
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
          }
          break;
        }
      }
    }

    raf = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (['w','a','s','d','escape'].includes(k)) {
      keys.add(k);
      e.preventDefault();
      if (k === 'escape') {
        paused = !paused;
        if (!paused) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      }
    }
  }

  window.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('keyup', onKeyUp, { capture: true });
  window.addEventListener('click', onClick, { capture: true });

  raf = requestAnimationFrame(loop);

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown, { capture: true });
    window.removeEventListener('keyup', onKeyUp, { capture: true });
    window.removeEventListener('click', onClick, { capture: true });
    block.remove();
    bgBlock.remove();
    scoreDisplay.remove();
    for (const b of bullets) b.el.remove();
    for (const e of enemies) e.remove();
    delete window.__wasdBlockCleanup;
    console.log('WASD block removed.');
  }
  window.__wasdBlockCleanup = cleanup;
})();
