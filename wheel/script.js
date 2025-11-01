window.addEventListener("DOMContentLoaded", () => {
  const spinBtn = document.getElementById('spinBtn');
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const result = document.getElementById('result');

  const prizes = [
    { text: "Депозит\n5.000 рублей", probability: 0 },
    { text: "Скидка\nна маникюр\n10%", probability: 0.2 },
    { text: "Скидка\nна брови\n20%", probability: 0.2 },
    { text: "Масло для\nкутикул\nв подарок", probability: 0.2 },
    { text: "Маска для лица\nв подарок", probability: 0.2 },
    { text: "SPA уход для\nрук в подарок", probability: 0.2 },
  ];

  const activePrizes = prizes.filter(p => p.probability > 0);

  if (activePrizes.length === 0) {
    console.error("Нет активных призов. Установите хотя бы одну положительную вероятность.");
    spinBtn.disabled = true;
    return;
  }

  const totalProbability = activePrizes.reduce((acc, p) => acc + p.probability, 0);
  if (totalProbability <= 0) {
    console.error("Сумма вероятностей активных призов равна нулю.");
    spinBtn.disabled = true;
    return;
  }
  activePrizes.forEach(p => p.normalized = p.probability / totalProbability);

  function getSegmentGradient(i) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (i % 2 === 0) {
      grad.addColorStop(0, "#806248");
      grad.addColorStop(1, "#563c2c");
    } else {
      grad.addColorStop(0, "#aebb82");
      grad.addColorStop(1, "#d1e19c");
    }
    return grad;
  }

  function chooseSegmentIndexByRTP() {
    const rnd = Math.random();
    let sum = 0;
    for (let i = 0; i < activePrizes.length; i++) {
      sum += activePrizes[i].normalized;
      if (rnd <= sum) return i;
    }
    return activePrizes.length - 1;
  }

  const wheel = new Winwheel({
    canvasId: 'wheelCanvas',
    numSegments: activePrizes.length,
    outerRadius: 177,
    textFontSize: 18,
    textFillStyle: '#fff',
    textMargin: 16,
    segments: activePrizes.map((p, i) => ({ fillStyle: getSegmentGradient(i), text: p.text })),
    animation: { type: 'spinToStop', duration: 5, spins: 8, callbackFinished: onFinish }
  });

  spinBtn.onclick = async () => {
    spinBtn.disabled = true;
    try {
      const check = await fetch("/check_ip").then(r => r.json());
      if (!check.can_spin) {
        alert(check.message || "Вы уже крутили колесо!");
        spinBtn.disabled = false;
        return;
      }

      const chosenIndex = chooseSegmentIndexByRTP();
      const segmentAngle = 360 / activePrizes.length;
      const minAngle = segmentAngle * chosenIndex;
      const maxAngle = segmentAngle * (chosenIndex + 1);
      const stopAngle = Math.random() * (maxAngle - minAngle) + minAngle + segmentAngle / 2;

      wheel.animation.stopAngle = stopAngle;
      wheel.startAnimation();

      await fetch("/register_spin", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prize: activePrizes[chosenIndex].text }) });
    } catch (err) {
      console.error("Ошибка проверки или регистрации спина:", err);
      spinBtn.disabled = false;
    }
  };

  function onFinish(segment) {
    result.innerHTML = `
      🎉 Вы выиграли: <strong>${segment.text}</strong><br><br>
      Введите ваш телефон:<br>
      <input type="text" id="phoneInput" placeholder="+7 (___) ___-__-__">
      <button id="submitPhone">Отправить</button>
    `;
    result.classList.add('visible');

    document.getElementById('submitPhone').onclick = async () => {
      const phone = document.getElementById('phoneInput').value.trim();
      if (!phone) return alert("Введите телефон!");
      try {
        const res = await fetch('/submit_prize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, prize: segment.text })
        });
        const data = await res.json();
        if (data.success) {
          alert("Приз зафиксирован!");
          result.classList.remove('visible');
          spinBtn.disabled = false;
        } else {
          alert("Ошибка сохранения приза.");
          spinBtn.disabled = false;
        }
      } catch (e) {
        alert("Ошибка отправки данных на сервер.");
        spinBtn.disabled = false;
      }
 
    };
  }
});
