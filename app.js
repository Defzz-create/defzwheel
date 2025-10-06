document.addEventListener("DOMContentLoaded", () => {
  const wheel = document.getElementById("wheel");
  const spinBtn = document.getElementById("spinBtn");

  spinBtn.addEventListener("click", () => {
    alert("Здесь будет вращение колеса");
  });
});