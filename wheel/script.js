const PRIZES = [
  { text: "Бесплатный маникюр", weight: 5, angle: 30 },
  { text: "Скидка 10% на педекюр", weight: 30, angle: 270 },
  { text: "Скидка 10% на маникюр", weight: 30, angle: 390 },
  { text: "Скидка 5% на косметику", weight: 29, angle: 330 },
  { text: "Бесплатные брови", weight: 5, angle: 90 },
  { text: "Депозит: 5.000 рублей", weight: 1, angle: 150 },
];
const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0);

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const popup = document.getElementById("winPopup");
const winText = document.getElementById("winText");

let isSpinning = false;
let deg = 0;

function selectWeightedPrize() {
  let rand = Math.random() * TOTAL_WEIGHT; 
  let cumulativeWeight = 0;

  for (const prize of PRIZES) {
    cumulativeWeight += prize.weight;
    if (rand < cumulativeWeight) {
      return prize; 
    }
  }
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