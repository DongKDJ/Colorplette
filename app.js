// 색상 조화 알고리즘 (기준 Hue를 기반으로 5개 Hue 생성)
const HARMONIES = {
  analogous:          (h) => [h - 40, h - 20, h,       h + 20,  h + 40],
  complementary:      (h) => [h - 20, h,       h + 20,  h + 160, h + 180],
  triadic:            (h) => [h,       h + 15,  h + 120, h + 240, h + 255],
  splitComplementary: (h) => [h,       h + 30,  h + 150, h + 180, h + 210],
  square:             (h) => [h,       h + 45,  h + 90,  h + 180, h + 270],
};

// HSL → RGB 변환
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// RGB → HEX 변환
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// 배경색에 따라 텍스트 색상 결정 (밝으면 어둡게, 어두우면 밝게)
function getTextColor(r, g, b) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#1a1a1a' : '#ffffff';
}

// Hue로 색상 객체 생성 (Saturation, Lightness는 자연스럽게 랜덤)
function makeColor(hue) {
  const h = ((hue % 360) + 360) % 360;
  const s = 50 + Math.random() * 35; // 50~85%
  const l = 30 + Math.random() * 40; // 30~70%
  const [r, g, b] = hslToRgb(h, s, l);
  return {
    hex: rgbToHex(r, g, b),
    rgb: [r, g, b],
    text: getTextColor(r, g, b),
  };
}

// 조화로운 팔레트 5개 생성
function newPalette() {
  const baseHue = Math.random() * 360;
  const keys = Object.keys(HARMONIES);
  const fn = HARMONIES[keys[Math.floor(Math.random() * keys.length)]];
  return fn(baseHue).map(makeColor);
}

// 상태
let colors = Array(5).fill(null);
let locked = Array(5).fill(false);
let hoveredIndex = -1;

// 패널 5개 초기화 (DOM 한 번만 생성)
function initPanels() {
  const container = document.getElementById('palette');
  for (let i = 0; i < 5; i++) {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-btn';
    lockBtn.setAttribute('aria-label', '색상 고정');

    const info = document.createElement('div');
    info.className = 'color-info';

    const hexEl = document.createElement('div');
    hexEl.className = 'hex-code';
    hexEl.title = '클릭하여 복사';

    const rgbEl = document.createElement('div');
    rgbEl.className = 'rgb-code';

    info.append(hexEl, rgbEl);
    panel.append(lockBtn, info);
    container.appendChild(panel);

    panel.addEventListener('mouseenter', () => (hoveredIndex = i));
    panel.addEventListener('mouseleave', () => (hoveredIndex = -1));

    lockBtn.addEventListener('click', () => {
      locked[i] = !locked[i];
      paintPanel(i);
    });

    hexEl.addEventListener('click', () => {
      navigator.clipboard.writeText(colors[i].hex).then(() => showToast(colors[i].hex));
    });
  }
}

// 패널 한 칸 업데이트
function paintPanel(i) {
  const panel = document.querySelectorAll('.panel')[i];
  const c = colors[i];
  panel.style.backgroundColor = c.hex;
  panel.style.color = c.text;
  panel.classList.toggle('locked', locked[i]);
  panel.querySelector('.lock-btn').textContent = locked[i] ? '🔒' : '🔓';
  panel.querySelector('.hex-code').textContent = c.hex;
  panel.querySelector('.rgb-code').textContent = `rgb(${c.rgb.join(', ')})`;
}

// 고정되지 않은 색상만 새로 생성
function refresh() {
  const fresh = newPalette();
  colors = colors.map((c, i) => (locked[i] ? c : fresh[i]));
  colors.forEach((_, i) => paintPanel(i));
}

// 복사 완료 토스트 메시지
let toastTimer;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = `${text} 복사됨`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    refresh();
  }
  if (e.code === 'KeyQ' && hoveredIndex !== -1) {
    locked[hoveredIndex] = !locked[hoveredIndex];
    paintPanel(hoveredIndex);
  }
});

// 시작
initPanels();
refresh();
