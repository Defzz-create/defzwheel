window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("wheelCanvas");
  const spinBtn = document.getElementById("spinBtn");
  const result = document.getElementById("result");

  let wheel;

  const prizes = [
    { text: "Скидка - 5%\nна маникюр", probability: 0.2 },
    { text: "Скидка - 10%\nна маникюр", probability: 0.1 },
    { text: "Скидка - 5%\nна педикюр", probability: 0.2 },
    { text: "Скидка - 10%\nна педикюр", probability: 0.1 },
    { text: "Скидка - 5%\nна брови", probability: 0.2 },
    { text: "Скидка - 10%\nна брови", probability: 0.1 },
    { text: "Бесплатные\nброви", probability: 0.05 },
    { text: "Бесплатная\nмаска для лица", probability: 0.05 },
  ];

  function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 350);
    const ratio = window.devicePixelRatio || 1;

    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.width = size * ratio;
    canvas.height = size * ratio;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    return { ctx, size };
  }

  function createWheel() {
    const { ctx, size } = resizeCanvas();

    wheel = new Winwheel({
      canvasId: "wheelCanvas",
      numSegments: prizes.length,
      outerRadius: size / 2 - 5,
      textFontSize: size / 18,
      textFillStyle: "#fff",
      textMargin: size / 20,
      segments: prizes.map((p, i) => ({
        fillStyle: i % 2 === 0 ? "#806248" : "#aebb82",
        text: p.text,
      })),
      animation: {
        type: "spinToStop",
        duration: 5,
        spins: 8,
        callbackFinished: onFinish,
      },
    });
  }

  function chooseSegmentByRTP() {
    const rnd = Math.random();
    let sum = 0;
    for (const p of prizes) {
      sum += p.probability;
      if (rnd <= sum) return p;
    }
    return prizes[prizes.length - 1];
  }

  async function spinWheel() {
    spinBtn.disabled = true;

    try {
      const check = await fetch("/check_ip").then((r) => r.json());
      if (!check.can_spin) {
        alert(check.message || "Вы уже крутили колесо!");
        spinBtn.disabled = false;
        return;
      }

      const win = chooseSegmentByRTP();
      const index = prizes.findIndex((p) => p === win);
      const segmentAngle = 360 / prizes.length;
      const minAngle = segmentAngle * index;
      const maxAngle = segmentAngle * (index + 1);
      const stopAngle = Math.random() * (maxAngle - minAngle) + minAngle;

      wheel.animation.stopAngle = stopAngle;
      wheel.startAnimation();

      await fetch("/register_spin", { method: "POST" });
    } catch (e) {
      console.error(e);
      spinBtn.disabled = false;
    }
  }

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

      const res = await fetch("/submit_prize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, prize: segment.text }),
      }).then((r) => r.json());

      if (res.success) {
        alert("Приз зафиксирован!");
        result.classList.remove("visible");
        spinBtn.disabled = false;
      } else alert("Ошибка сохранения приза.");
    };
  }

  createWheel();
  window.addEventListener("resize", createWheel);
  spinBtn.onclick = spinWheel;
});
