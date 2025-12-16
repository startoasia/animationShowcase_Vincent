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

// 全螢幕灑花
const confettiViewportBtn = document.getElementById("confettiViewportBtn");
let timerViewport;
confettiViewportBtn.addEventListener("click", () => {
  if (document.body.classList.contains("confetti-fullscreen")) {
    document.body.classList.remove("confetti-fullscreen");
    void document.body.offsetWidth;
  }
  clearTimeout(timerViewport);
  document.body.classList.add("confetti-fullscreen");
  timerViewport = setTimeout(() => {
    document.body.classList.remove("confetti-fullscreen");
  }, 5000); // 配合 CSS 動畫時間
});
