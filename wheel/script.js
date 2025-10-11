window.addEventListener("DOMContentLoaded", () => {
  const spinBtn = document.getElementById("spinBtn");
  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");
  const result = document.getElementById("result");

  const prizes = [
    { text: "Скидка - 5%\nна маникюр", probability: 0.2 },
    { text: "Скидка - 10%\nна маникюр", probability: 0.1 },
    { text: "Скидка - 5%\nна педикюр", probability: 0.2 },
    { text: "Скидка - 10%\nна педикюр", probability: 0.1 },
    { text: "Скидка - 5%\nна брови", probability: 0.2 },
    { text: "Скидка - 10%\nна брови", probability: 0.1 },
    { text: "Бесплатные\nброви", probability: 0.05 },
    { text: "Бесплатная\nмаска\nдля лица", probability: 0.05 }
  ];

  function getSegmentGradient(i) {
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    if (i % 2 === 0) {
      grad.addColorStop(0, "#806248");
      grad.addColorStop(1, "#563c2c");
    } else {
      grad.addColorStop(0, "#aebb82");
      grad.addColorStop(1, "#d1e19c");
    }
    return grad;
  }

  function chooseSegmentByRTP() {
    const rnd = Math.random();
    let sum = 0;
    for (let p of prizes) {
      sum += p.probability;
      if (rnd <= sum) return p;
    }
    return prizes[prizes.length - 1];
  }

  const wheel = new Winwheel({
    canvasId: "wheelCanvas",
    numSegments: prizes.length,
    outerRadius: 177,
    textFillStyle: "#fff",
    textFontSize: 16,
    textMargin: 20,
    segments: prizes.map((p, i) => ({
      fillStyle: getSegmentGradient(i),
      text: p.text
    })),
    animation: {
      type: "spinToStop",
      duration: 5,
      spins: 8,
      callbackFinished: onFinish
    }
  });

  spinBtn.onclick = async () => {
    spinBtn.disabled = true;
    try {
      const res = await fetch("/check_ip");
      const data = await res.json();

      if (!data.can_spin) {
        result.innerHTML = data.message;
        result.classList.add("visible");
        setTimeout(() => result.classList.remove("visible"), 2500);
        return;
      }

      const winningPrize = chooseSegmentByRTP();
      const segmentIndex = prizes.findIndex(p => p === winningPrize);
      const segmentAngle = 360 / prizes.length;
      const minAngle = segmentAngle * segmentIndex;
      const maxAngle = segmentAngle * (segmentIndex + 1);
      const stopAngle = Math.random() * (maxAngle - minAngle) + minAngle;

      wheel.animation.stopAngle = stopAngle;
      wheel.startAnimation();

      await fetch("/register_spin", { method: "POST" });
    } catch (err) {
      console.error("Ошибка проверки IP:", err);
      alert("Ошибка связи с сервером.");
    }
  };

  function onFinish(segment) {
    result.innerHTML = `
      🎉 Вы выиграли: <strong>${segment.text}</strong><br><br>
      Введите ваш телефон:<br>
      <input type="text" id="phoneInput" placeholder="+7 (___) ___-__-__">
      <button id="submitPhone">Отправить</button>
    `;
    result.classList.add("visible");

    document.getElementById("submitPhone").onclick = async () => {
      const phone = document.getElementById("phoneInput").value.trim();
      if (!phone) return alert("Введите телефон!");

      try {
        const res = await fetch("/send_prize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, prize: segment.text })
        });
        const data = await res.json();
        if (data.success) {
          alert("Приз зафиксирован!");
          result.classList.remove("visible");
        } else {
          alert("Ошибка сохранения приза.");
        }
      } catch (e) {
        alert("Ошибка отправки данных на сервер.");
      } finally {
        spinBtn.disabled = false;
      }
    };
  }
});
