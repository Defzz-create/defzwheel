const PRIZES = [
  { text: "Бесплатный маникюр", angle: 30 },
  { text: "Скидка 10% на педекюр", angle: 270 },
  { text: "Скидка 10% на маникюр", angle: 390 },
  { text: "Скидка 5% на косметику", angle: 330 },
  { text: "Бесплатные брови", angle: 90 },
  { text: "Депозит: 5.000 рублей", angle: 150 },
];

const SECTOR_SIZE = 360 / PRIZES.length;

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const popup = document.getElementById("winPopup");
const winText = document.getElementById("winText");

let isSpinning = false;
let deg = 0;

function getWinningSector(angle) {
  const normalizedAngle = (angle % 360 + 360) % 360;
  const corrected = (360 - normalizedAngle + SECTOR_SIZE / 2) % 360;
  const index = Math.floor(corrected / SECTOR_SIZE);
  return PRIZES[index].text;
}

function showWinPopup(text) {
  winText.innerHTML = `🎉 Вы выиграли: <strong>${text}</strong>`;
  popup.classList.add("visible");

  setTimeout(() => {
    popup.classList.remove("visible");
  }, 3000);
}

async function canUserSpin() {
  try {
    const resp = await fetch("/check_ip");
    const data = await resp.json();
    return data;
  } catch (err) {
    alert("Ошибка связи с сервером!");
    return { can_spin: false, message: "Сервер недоступен" };
  }
}

async function registerSpin() {
  try {
    await fetch("/register_spin", { method: "POST" });
  } catch (err) {
    console.error("Ошибка при регистрации спина:", err);
  }
}

spinBtn.addEventListener("click", async () => {
  if (isSpinning) return;

  const check = await canUserSpin();
  if (!check.can_spin) {
    alert(check.message);
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;

  const minTurns = 8;
  const maxTurns = 12;
  const fullTurns = Math.floor(Math.random() * (maxTurns - minTurns + 1)) + minTurns;
  const extraDeg = Math.floor(Math.random() * 360);
  const totalDeg = 360 * fullTurns + extraDeg;
  const duration = 6000;

  deg += totalDeg;

  wheel.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.25, 0.3, 1)`;
  wheel.style.transform = `rotate(${deg}deg)`;

  setTimeout(async () => {
    wheel.style.transition = "none";
    const normalizedDeg = deg % 360;
    wheel.style.transform = `rotate(${normalizedDeg}deg)`;
    deg = normalizedDeg;

    const sectorText = getWinningSector(normalizedDeg);
    showWinPopup(sectorText);

    await registerSpin();

    isSpinning = fals
