// 點擊灑花
const confettiBtn = document.getElementById("confettiBtn");
let timer;
confettiBtn.addEventListener("click", () => {
  if (confettiBtn.classList.contains("confetti")) {
    confettiBtn.classList.remove("confetti");
    void confettiBtn.offsetWidth; // 觸發 Reflow 以確保動畫能重新播放
  }
  clearTimeout(timer);
  confettiBtn.classList.add("confetti");
  timer = setTimeout(() => {
    confettiBtn.classList.remove("confetti");
  }, 3000);
});
