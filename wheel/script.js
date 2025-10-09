document.addEventListener("DOMContentLoaded", () => {
  const PRIZES = [
    { text: "Слот 1", angle: 30 },
    { text: "Слот 2", angle: 90 },
    { text: "Слот 3", angle: 150 },
    { text: "Слот 4", angle: 210 },
    { text: "Слот 5", angle: 270 },
    { text: "Слот 6", angle: 330 },
  ];

  const SECTOR_SIZE = 360 / PRIZES.length;

  const wheel = document.getElementById("wheel");
  const spinBtn = document.getElementById("spinBtn");
  const popup = document.getElementById("winPopup");
  const winText = document.getElementById("winText");

  let isSpinning = false;
  let deg = 0;

  function getWinningSector(finalDeg) {
    const normalizedAngle = (finalDeg % 360 + 360) % 360;
    const corrected = (360 - normalizedAngle + SECTOR_SIZE / 2) % 360;
    const index = Math.floor(corrected / SECTOR_SIZE);
    return PRIZES[index];
  }

  function showWinPopup(text) {
    winText.innerHTML = `🎉 Вы выиграли: <strong>${text}</strong>`;
    popup.classList.add("visible");
    setTimeout(() => popup.classList.remove("visible"), 3000);
  }

  spinBtn.addEventListener("click", async () => {
    if (isSpinning) return;

    let data;
    try {
      const resp = await fetch("/check_ip");
      data = await resp.json();
    } catch {
      alert("Ошибка связи с сервером!");
      return;
    }

    if (!data.can_spin) {
      alert(data.message);
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;

    const minTurns = 8;
    const maxTurns = 12;
    const fullTurns = Math.floor(Math.random() * (maxTurns - minTurns + 1)) + minTurns;
    const extraDeg = Math.floor(Math.random() * 360);
    const totalDeg = 360 * fullTurns + extraDeg;
    deg += totalDeg;

    wheel.style.transition = `transform 6s cubic-bezier(0.1,0.25,0.3,1)`;
    wheel.style.transform = `rotate(${deg}deg)`;

    setTimeout(async () => {
      wheel.style.transition = "none";
      deg %= 360;
      wheel.style.transform = `rotate(${deg}deg)`;

      // Вычисляем выигранный сектор
      const winningPrize = getWinningSector(deg);

      // Сначала показываем popup с выигранным призом
      showWinPopup(winningPrize.text);

      // Даем паузу на показ popup (3 сек)
      setTimeout(async () => {
        // Запрос username после анимации и показа popup
        const username = prompt("Введите ваш Telegram username без @:");
        if (username) {
          try {
            await fetch("/send_prize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: username, prize: winningPrize.text })
            });
          } catch (e) { console.error(e); }
        }

        try { await fetch("/register_spin", { method: "POST" }); } catch (e) { console.error(e); }

        isSpinning = false;
        spinBtn.disabled = false;
      }, 3000);

    }, 6000);

  });
});
