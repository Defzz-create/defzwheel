const PRIZES = [
  { text: "Слот 4", angle: 30 },
  { text: "Слот 2", angle: 270 },
  { text: "Слот 1", angle: 390 },
  { text: "Слот 3", angle: 330 },
  { text: "Слот 5", angle: 90 },
  { text: "Слот 6", angle: 150 },
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


function getRandomPrize() {
  const index = Math.floor(Math.random() * PRIZES.length);
  return PRIZES[index];
}

function getTargetAngle(prizeText) {
  const index = PRIZES.findIndex(p => p.text === prizeText);
  const baseAngle = index * SECTOR_SIZE;
  const offset = SECTOR_SIZE / 2;
  const spins = Math.floor(Math.random() * 3 + 8); // 8-10 полных оборотов
  return 360 * spins + (360 - (baseAngle + offset));
}

spinBtn.addEventListener("click", async () => {
  if (isSpinning) return;

  let data;
  try {
    const resp = await fetch("/check_ip");
    data = await resp.json();
  } catch (e) {
    alert("Ошибка связи с сервером!");
    return;
  }

  if (!data.can_spin) {
    alert(data.message);
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;

  const prize = getRandomPrize();
  const targetDeg = getTargetAngle(prize.text);
  deg += targetDeg;

  wheel.style.transition = `transform 6s cubic-bezier(0.1,0.25,0.3,1)`;
  wheel.style.transform = `rotate(${deg}deg)`;

  setTimeout(async () => {
    wheel.style.transition = "none";
    deg %= 360;
    wheel.style.transform = `rotate(${deg}deg)`;
    showWinPopup(prize.text);

    const username = prompt("Введите ваш Telegram username без @:");
    if (username) {
      try {
        await fetch("/send_prize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username, prize: prize.text })
        });
      } catch (e) {
        console.error(e);
      }
    }
    
    try {
      await fetch("/register_spin", { method: "POST" });
    } catch (e) {
      console.error(e);
    }

    isSpinning = false;
    spinBtn.disabled = false;
  }, 6000);
});

