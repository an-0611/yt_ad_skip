// content.js
console.log("Content script is running!");

// Log the current page URL
console.log("Current page URL:", window.location.href);

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

// Callback function for Mutation Observer
const mutationCallback = function (mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      yt_mute();
      //   console.log('Page content has changed. Current page URL:', window.location.href);
    }
  }
};

// Create a Mutation Observer instance
const observer = new MutationObserver(mutationCallback);

// Configure the observer to watch for changes in the body (or any other element)
const observerConfig = { childList: true, subtree: true };
observer.observe(document.body, observerConfig);
