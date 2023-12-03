// content.js
console.log("Content script is running!");

// Log the current page URL
console.log("Current page URL:", window.location.href);

let isYT = window.location.href.includes("youtube.com");
let isTwitch = window.location.href.includes("twitch.tv");

function yt_mute() {
  if (document.querySelector(".ad-showing")) {
    var isAccelerate = false;
    document.querySelector("video").muted = true;

    let myInterVal = setInterval(() => {
      myTimer();
    }, 300);

    let myStopFunction = () => {
      clearInterval(myInterVal);
    };

    let reset = () => {
      document.querySelector("video").playbackRate = 1;
      document.querySelector("video").muted = false;
      myStopFunction();
    };

    function myTimer() {
      if (
        isAccelerate &&
        document.querySelector(".ytp-ad-skip-button-modern")
      ) {
        reset();
        document.querySelector(".ytp-ad-skip-button-modern").click();
      }
      if (document.querySelector(".ad-showing")) {
        document.querySelector("video").playbackRate = 16;
        document.querySelector("video").muted = true;
        isAccelerate = true;
      } else {
        reset();
      }
    }
  }
}

function twitch_mute() {
  if (document.querySelector(".avap-ads-container"))
    document.querySelector(".avap-ads-container").style.display = "none";
  if (document.querySelector("video"))
    document.querySelector("video").muted = false;
  let elements = document.querySelectorAll(
    ".ScTransitionBase-sc-hx4quq-0.dVNdRE.tw-transition"
  );
  if (elements && elements[1]) elements[1].style.opacity = 1;
  var iframes = document.querySelectorAll("iframe");
  iframes.forEach((el) => {
    if (el) el.remove();
    console.log("remove ad!");
  });
}

// Callback function for Mutation Observer
const mutationCallback = function (mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      if (isYT) yt_mute();
      else if (isTwitch) twitch_mute();
      //   console.log('Page content has changed. Current page URL:', window.location.href);
    }
  }
};

// Create a Mutation Observer instance
const observer = new MutationObserver(mutationCallback);

// Configure the observer to watch for changes in the body (or any other element)
const observerConfig = { childList: true, subtree: true };
// childList: 是否監視目標節點的子節點變化, 會監視子節點的增加或刪除
// subtree: 是否監視目標節點的所有後代節點，不僅是直接的子節點。設定 true，則會監視整個 DOM 樹中與目標節點相關的所有節點。

let DOM_Target;
if (isYT) DOM_Target = document.body;
else if (isTwitch) DOM_Target = document.querySelector(".persistent-player");

observer.observe(DOM_Target, observerConfig);
