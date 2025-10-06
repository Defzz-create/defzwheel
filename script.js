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
let deg = 0; // Накопленный угол

function getWinningSector(angle) {

  const normalizedAngle = (angle % 360 + 360) % 360; 

  const corrected = (360 - normalizedAngle + SECTOR_SIZE / 2) % 360;
  
  const index = Math.floor(corrected / SECTOR_SIZE);
  
  return PRIZES[index].text;
}

function showWinPopup(text) {
  winText.innerHTML = `🎉 Вы выиграли: <strong>${text}</strong>`;
  
  setTimeout(() => popup.classList.add("visible"), 50);

  setTimeout(() => {
    popup.classList.remove("visible");
  }, 3000); 
}

spinBtn.addEventListener("click", () => {
  if (isSpinning) return;
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

  setTimeout(() => {
    wheel.style.transition = "none";
    const normalizedDeg = deg % 360;
    wheel.style.transform = `rotate(${normalizedDeg}deg)`;
    deg = normalizedDeg;

    const sectorText = getWinningSector(normalizedDeg);

    showWinPopup(sectorText);

    isSpinning = false;
    spinBtn.disabled = false;
  }, duration + 300);
});
