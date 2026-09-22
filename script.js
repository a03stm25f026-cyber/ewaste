const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9-POM8zVbxfeY2j50Hv0EmM02QS5x3BtxVzIaZxp4W6CxJmFrvrCPjYeh-1AqTRgADA/exec";

//--- TETAPAN PERMAINAN
let score = 0;
let lives = 3;
let timeRemaining = 60;
let isGameOver = false;

//--- TETAPAN PEMAIN (ROBOT E-WASTE)
const player = {
  x: 190,
  y: 650,
  width: 70,
  height: 70,
  normalSpeed: 5,
  currentSpeed: 5,
  isSlowed: false
};

//--- LALUAN FAIL ASSET DENGAN NAMA BAHARU
const assetSources = {
  back: 'asset/back.png',
  robot: 'asset/robot.png',
  fon: 'asset/fon.png',
  pc: 'asset/pc.png',
  alternetor: 'asset/alternetor.png',
  ecu: 'asset/ecu.png',
  kain: 'asset/kain.png',
  kayu: 'asset/kayu.png',
  baju: 'asset/baju.png',
  menu: 'asset/menu.png'
};

const loadedImages = {};

//--- FUNGSI MEMUAT NAIK SEMUA GAMBAR
function loadAllAssets() {
  const promises = [];
  for (let key in assetSources) {
    promises.push(
      new Promise((resolve) => {
        const img = new Image();
        img.src = assetSources[key];
        img.onload = () => {
          loadedImages[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Gagal memuat naik imej: ${assetSources[key]}`);
          resolve();
        };
      })
    );
  }
  return Promise.all(promises);
}

// KAWALAN PAPAN KEKUNCI
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// SENARAI ITEM JATUH
const itemTypes = [
  { key: 'fon', score: 10, lives: 0, speed: 3.5, rarity: 0.25, isSlow: false },
  { key: 'pc', score: 30, lives: 0, speed: 2.5, rarity: 0.20, isSlow: false },
  { key: 'alternetor', score: 40, lives: 0, speed: 3.0, rarity: 0.15, isSlow: false },
  { key: 'ecu', score: 50, lives: 0, speed: 4.0, rarity: 0.10, isSlow: false },
  { key: 'kain', score: -5, lives: 0, speed: 2.5, rarity: 0.15, isSlow: true },     // Slow 3 saat
  { key: 'kayu', score: -10, lives: -1, speed: 3.0, rarity: 0.08, isSlow: false }, // Tolak 1 nyawa
  { key: 'baju', score: -15, lives: 0, speed: 2.8, rarity: 0.07, isSlow: false }   // Tolak 15 skor
];

let fallingItems = [];

//--- LOGIK PERGERAKAN ROBOT
function updatePlayerPosition() {
  if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= player.currentSpeed;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += player.currentSpeed;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.currentSpeed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.currentSpeed;

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

//--- SEMAKAN PERLANGGARAN
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

//--- JANAKAN ITEM JATUH
function spawnItem() {
  if (isGameOver) return;
  const rand = Math.random();
  let cumulative = 0;
  let selected = itemTypes[0];

  for (let item of itemTypes) {
    cumulative += item.rarity;
    if (rand <= cumulative) {
      selected = item;
      break;
    }
  }

  fallingItems.push({
    ...selected,
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 48,
    height: 48
  });
}

//--- LOGIK PERMAINAN
function update() {
  if (isGameOver) return;

  updatePlayerPosition();

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    if (checkCollision(player, item)) {
      score = Math.max(0, score + item.score);
      lives += item.lives;

      // Kesan Slow apabila tersangkut Kain
      if (item.isSlow) {
        if (!player.isSlowed) {
          player.isSlowed = true;
          player.currentSpeed = player.normalSpeed * 0.4;
        }
        setTimeout(() => {
          player.currentSpeed = player.normalSpeed;
          player.isSlowed = false;
        }, 3000);
      }

      fallingItems.splice(i, 1);

      if (lives <= 0) {
        endGame("Nyawa Robot Telah Habis!");
        return;
      }
      continue;
    }

    if (item.y > canvas.height) {
      fallingItems.splice(i, 1);
    }
  }

  document.getElementById('score').innerText = score;
  document.getElementById('lives').innerText = lives;
}

//--- LUKIS ELEMEN PADA KANVAS
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Latar Belakang
  if (loadedImages.back) {
    ctx.drawImage(loadedImages.back, 0, 0, canvas.width, canvas.height);
  }

  // 2. Lukis Pemain (Robot)
  ctx.save();
  if (player.isSlowed) {
    ctx.globalAlpha = 0.5;
  }
  if (loadedImages.robot) {
    ctx.drawImage(loadedImages.robot, player.x, player.y, player.width, player.height);
  }
  ctx.restore();

  // 3. Lukis Item Jatuh
  fallingItems.forEach(item => {
    const itemImg = loadedImages[item.key];
    if (itemImg) {
      ctx.drawImage(itemImg, item.x, item.y, item.width, item.height);
    }
  });
}

//--- LOOP UTAMA PERMAINAN
function gameLoop() {
  update();
  
  // SEMAK SYARAT MENANG SKOR 200 DI SINI
  if (score >= 200 && !isGameOver) {
    endGame("Tahniah! Anda telah menang!");
    return;
  }

  draw();
  if (!isGameOver) {
    requestAnimationFrame(gameLoop);
  }
}

function endGame(reason) {
  isGameOver = true;
  document.getElementById('final-reason').innerText = reason;
  document.getElementById('final-score').innerText = score;
  document.getElementById('game-over-screen').classList.remove('hidden');
}

//--- MULA PERMAINAN
loadAllAssets().then(() => {
  setInterval(spawnItem, 1100);
  setInterval(() => {
    if (!isGameOver) {
      timeRemaining--;
      document.getElementById('timer').innerText = timeRemaining;
      if (timeRemaining <= 0) endGame("Masa Telah Tamat!");
    }
  }, 1000);

  gameLoop();
});

//--- LOGIK HANTAR SKOR KE GOOGLE SHEETS
document.getElementById('leaderboard-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  const playerName = document.getElementById('player-name').value;

  if (!playerName.trim()) {
    alert("Sila masukkan nama anda!");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Menghantar...";

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain' // Gunakan text/plain untuk elak isu CORS preflight
    },
    body: JSON.stringify({
      name: playerName,
      score: score
    })
  })
  .then(() => {
    alert("Skor anda berjaya dihantar ke Google Sheets!");
    submitBtn.innerText = "Telah Dihantar";
    document.getElementById('player-name').value = '';
  })
  .catch(error => {
    console.error("Ralat!", error);
    alert("Gagal menghantar skor. Sila cuba lagi.");
    submitBtn.disabled = false;
    submitBtn.innerText = "Hantar Skor";
  });
});