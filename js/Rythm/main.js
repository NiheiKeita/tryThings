var rythm;
var isStart = false;

(function () {
  rythm = new Rythm();
  rythm.addRythm("music_dance", "music_dance", 0, 10, { direction: "left" });

  music();
  mic();
})();

function music() {
  document
    .getElementById("music_start_button")
    .addEventListener("click", function (e) {
      if (isStart) {
        return;
      }
      initRythm();
      addRythmClass(this);
      rythm.setMusic("sample.mp3");
      rythm.start();
      isStart = true;
    });
  document
    .getElementById("music_stop_button")
    .addEventListener("click", function (e) {
      initRythm();
    });
}
function mic() {
  document
    .getElementById("mic_start_button")
    .addEventListener("click", function (e) {
      if (isStart) {
        return;
      }
      initRythm();
      addRythmClass(this);
      rythm.plugMicrophone();
      isStart = true;
      rythm.start();
    });

  document
    .getElementById("mic_stop_button")
    .addEventListener("click", function (e) {
      initRythm();
    });
}

function initRythm() {
  Array.from(document.getElementsByClassName("rythm")).forEach((element) => {
    element.classList.remove("music_dance");
  });
  rythm.stop();
  rythm.setMusic("");
  isStart = false;
}

function addRythmClass(e) {
  e.closest(".rythm_area")
    .getElementsByClassName("rythm")[0]
    .classList.add("music_dance");
}
