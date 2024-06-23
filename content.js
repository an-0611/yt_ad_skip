// 2024/4/13 cookie 似乎新增了某些 key 會導致 skip button click()失效， 只剩下滑鼠左鍵觸發才能生效 (目前刪除 cookie 有效)
//                  可能該 cookie 會將跳過用戶的帳號標記成特殊用戶，事件就會以此檢查來決定是否讓用戶按鈕.click()失效
// 或是可能被下面兩種方式實現只有滑鼠左鍵觸發才能 skip
// element.addEventListener('click', function(event) {
//     if (event.button === 0) console.log('左鍵被點擊');
// });

// 在實際點擊觸發的事件中，事件對象的 isTrusted 屬性為 true；而在通過調用 click() 方法觸發的事件中，isTrusted 屬性為 false。
// element.addEventListener('click', function(event) {
//     if (event.isTrusted) console.log('透過點擊觸發的事件');
//     else console.log('透過 click() 方法觸發的事件');
// });

window.addEventListener("load", (event) => {
  // 完全加載後執行的代碼
  console.log("Page fully loaded");
  start();
});

function start() {
  // content.js
  console.log("Content script is running!");

  // Log the current page URL
  console.log("Current page URL:", window.location.href);

  let isYT = window.location.href.includes("youtube.com");
  // let isTwitchMainPage = window.location.href === "https://www.twitch.tv/"; // window.location.pathname = '/'
  // let isTwitchChannel =
  //   window.location.href.includes("twitch.tv") &&
  //   window.location.pathname.length > 1; // window.location.pathname = '/xxx'
  let isTwitchChannel = window.location.href.includes("twitch.tv");

  let key;
  if (isYT) {
    key = "YT";
  } else if (isTwitchChannel) {
    key = "Twitch";
  } else {
    console.log("no match URL"); // don't execute below code
  }

  let setting = {
    YT: {
      dom_target: document.body,
      skip_ad_callback: function yt_skip_ad() {
        // skip dialog
        // let dialog = document.querySelectorAll(
        //   ".style-scope.ytd-popup-container"
        // )?.[1];
        // if (dialog) {
        //   let allowAdButton = dialog.querySelector(
        //     "#buttons .yt-spec-button-view-model button"
        //   );
        //   if (allowAdButton) {
        //     allowAdButton.click();
        //     // window.reload();
        //   }
        // }
        // if (document.querySelector("ytd-popup-container")) {
        //   document.querySelector("ytd-popup-container").remove();
        //   document.querySelector("video").play();
        // }
        // if (
        //   document.querySelector("tp-yt-iron-overlay-backdrop") ||
        //   document.querySelector("ytd-enforcement-message-view-model")
        // ) {
        //   document.querySelector("tp-yt-iron-overlay-backdrop")?.remove();
        //   document.querySelector("ytd-enforcement-message-view-model")?.remove();
        //   document.querySelector("video").play();
        // }
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
            let normalAdSkipBtn = document.querySelector(".ytp-skip-ad-button"); // 2024/4/13 事件被調整過 需偵測此按鈕元素才可
            let questionnaireSkipBtn = document.querySelector(
              ".ytp-ad-skip-button-modern.ytp-button"
            ); // 問卷類型廣告還是偵測此元素

            if (
              isAccelerate &&
              (normalAdSkipBtn || questionnaireSkipBtn)
              // document.querySelector(".ytp-ad-skip-button-container .ytp-ad-skip-button-modern")
            ) {
              reset();
              // document.querySelector(".ytp-ad-skip-button-modern").click();
              if (normalAdSkipBtn) normalAdSkipBtn.click(); // 2024/4/13 事件被調整過 改成點擊此元素
              if (questionnaireSkipBtn) questionnaireSkipBtn.click();
            } else if (document.querySelector(".ad-showing")) {
              document.querySelector("video").playbackRate = 16;
              document.querySelector("video").muted = true;
              isAccelerate = true;
            } else {
              reset();
            }
          }
        }
      },
    },
    Twitch: {
      dom_target: document.querySelector(".persistent-player"),
      skip_ad_callback: function twitch_skip_ad() {
        if (document.querySelector(".avap-ads-container"))
          document.querySelector(".avap-ads-container").style.display = "none";
        // if (
        //   document.querySelector("video") &&
        // )
        //   document.querySelector("video").muted = false;
        let elements = document.querySelectorAll(
          ".ScTransitionBase-sc-hx4quq-0.dVNdRE.tw-transition"
        );
        if (elements && elements[1]) elements[1].style.opacity = 1;
        var iframes = document.querySelectorAll("iframe");
        iframes.forEach((el) => {
          if (el) el.remove();
          console.log("remove ad!");
        });
      },
    },
  };

  if (!!key) {
    // 有 key 才註冊 mutation Observer
    // Callback function for Mutation Observer
    const mutationCallback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          // 延遲 500 毫秒避免一開始就被偵測出來
          setTimeout(() => {
            setting[key].skip_ad_callback();
            console.log(
              "Page content has changed. Current page URL:",
              window.location.href
            );
          }, 500);
        }
      }
    };

    // Create a Mutation Observer instance
    const observer = new MutationObserver(mutationCallback);

    // Configure the observer to watch for changes in the body (or any other element)
    const observerConfig = { childList: true, subtree: true };
    // childList: 是否監視目標節點的子節點變化, 會監視子節點的增加或刪除
    // subtree: 是否監視目標節點的所有後代節點，不僅是直接的子節點。設定 true，則會監視整個 DOM 樹中與目標節點相關的所有節點。

    observer.observe(setting[key].dom_target, observerConfig);
  }

  // twitch 頻道需整理一次才生效, 雖已經過濾 twitch 首頁才執行 content.js,
  // 但因為首頁進入頻道只改 url parameters 並非真的切到該頻道, 播放的頻道也是用嵌入的,
  // 除了抓不到 .persistent-player, 首頁的影片結構跟直接進入頻道 url 的也不一樣,
  // 又為了顧及效能抓 persistent-player, 只能在 “頻道頁“ 執行 content.js (避免 observer 被首頁污染),
  // 故到了 頻道頁面 需要重整一次
}
