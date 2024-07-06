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

// 2024/6/21 if detect skip,  not load video uuid , adjust event to load event
// 換頁時重新註冊 ！！！ 不然切其他影片又會再跳一次
// (1) 移除 start
// (2) 替每個影片加上 target blank
window.addEventListener("load", (event) => {
  // 完全加載後執行的代碼
  console.log("Page fully loaded");

  loadPastVideoSecond();
  start();
});

// 一進網頁清空 parameter 避免每次重新載入又是一樣秒數
function updateQueryParameter(url, parameter, val) {
  // 創建一個 URL 物件
  const urlObj = new URL(url);
  // 使用 URLSearchParams 物件操作查詢參數
  const params = urlObj.searchParams;
  // 刪除指定的查詢參數
  params.delete(parameter);
  //
  params.append(parameter, val);
  // 返回新的 URL
  return urlObj.toString();
}

var currentUrl = new URL(window.location.href);

function loadPastVideoSecond() {
  var expired_second = 3 * 24 * 60 * 60 * 1000; // 設定三天過期
  var firstCurrentTime = new Date().getTime(); // 第一次進入頁面的現在時間 與 timeupdate 事件中會一直更新的 currentTime 會不一樣
  // 1. ㄧ進畫面刪除過期的 localStorage.get(`ytt-${video_id}`); (done)
  let prefix = "ytt";
  for (const key in localStorage) {
    if (key.startsWith(prefix)) {
      let expiredTime = JSON.parse(localStorage.getItem(key))?.expiredTime;
      if (expiredTime && firstCurrentTime - expiredTime > expired_second) {
        localStorage.removeItem(key);
      }
    }
  }
  // 2. 如果有 localStorage.get(`yt-${video_id}`,); 仍在時效內 window.location.href = (done)
  var video_id = currentUrl.searchParams.get("v");
  var t = currentUrl.searchParams.get("t");
  if (!t && video_id) {
    var pastExpiredTime = JSON.parse(
      localStorage.getItem(`${prefix}-${video_id}`)
    )?.expiredTime;
    var pastRecordWatchSecond =
      JSON.parse(localStorage.getItem(`${prefix}-${video_id}`))?.curSecond ||
      "0";
    if (
      pastExpiredTime &&
      firstCurrentTime - pastExpiredTime <= expired_second
    ) {
      // 如果上次有播影片紀錄時間 還有效
      window.location.href = `https://youtu.be/${video_id}?t=${pastRecordWatchSecond}s`;
      return;
    } else {
      // 第一次進來所以沒有 t 給他加上 t = 0s
      var newUrl = updateQueryParameter(window.location.href, "t", `${0}s`);
      history.replaceState("", "", newUrl);
    }
  } else {
    // 如果 url 上有 t 的話, replaceState 掉, 或者每次 timeupdate 更新到 url 上
    // setTimeout(() => {
    //   var url = window.location.href;
    //   // 刪除 t 參數
    //   var newUrl = removeQueryParameter(url, "t");
    //   history.replaceState("", "", newUrl);
    // }, 200);
  }
  // 3. 開始播放影片時 每五秒要 set localStorage.set(`yt-${video_id}`, expired = new Date().getTime()); (done)
  setTimeout(() => {
    // 延遲 500ms 避免影片 null
    var video = document.querySelector("video");
    let initSecond = video?.currentTime?.toFixed(); // 先抓到影片一進來的秒數 然後 event 內每多五秒才更新一次 localstorage
    // video.currentTime?. 是避免一進入就是廣告 會抓不到 video 的 currentTime, 所以當沒有 initSecond 時, 不會註冊 timeupdate 事件
    // 會繼續執行後續的 observable code
    // if (initSecond) {
    // ！！！避免抓到廣告影片的 currentTime
    video?.addEventListener("timeupdate", () => {
      // 每當影片播放時間更新時觸發事件
      // 不要設定廣告影片 second 到 localStorage 避免下次進來改變秒數
      // 廣告結束後還是要設定秒數
      let curSecond = video.currentTime.toFixed();
      console.log("curSecond: ", curSecond);

      if (!document.querySelector(".ad-showing") && video_id) {
        // let curSecond = video.currentTime.toFixed();
        // console.log("curSecond: ", curSecond);
        if (curSecond - initSecond >= 5) {
          initSecond = curSecond;
          let currentTime = new Date().getTime();
          let expiredTime = new Date(currentTime + expired_second).getTime();
          // 每次更新到 localstorage 上
          localStorage.setItem(
            `${prefix}-${video_id}`,
            JSON.stringify({ curSecond, expiredTime })
          );
          // 每次更新到 url 上
          var newUrl = updateQueryParameter(
            window.location.href,
            "t",
            `${curSecond}s`
          );
          history.replaceState("", "", newUrl);
        }
      }
    });
  }, 500);

  // }
  // 以上事件都註冊一次 在 observable 之前
}

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
      dom_target: document.querySelector("body"), // document.body (抓太多元素) ,
      // document.querySelector(".style-scope.ytd-watch-metadata yt-formatted-string") 只抓影片標題
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
        // if (
        //   document.querySelector("yt-playability-error-supported-renderers")
        // ) {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 300);
        //   return;
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
    const observerConfig = { childList: true, subtree: false };
    // childList: 是否監視目標節點的子節點變化, 會監視子節點的增加或刪除
    // subtree: 是否監視目標節點的所有後代節點，不僅是直接的子節點。設定 true，則會監視整個 DOM 樹中與目標節點相關的所有節點。

    observer.observe(setting[key].dom_target, observerConfig);
  }

  // twitch 頻道需整理一次才生效, 雖已經過濾 twitch 首頁才執行 content.js,
  // 但因為首頁進入頻道只改 url parameters 並非真的切到該頻道, 播放的頻道也是用嵌入的,
  // 除了抓不到 .persistent-player, 首頁的影片結構跟直接進入頻道 url 的也不一樣,
  // 又為了顧及效能抓 persistent-player, 只能在 “頻道頁“ 執行 content.js (避免 observer 被首頁污染),
  // 故到了 頻道頁面 需要重整一次

  // 強制攔截彈窗
  setInterval(() => {
    console.log("monitor black popup");
    var video_id = currentUrl.searchParams.get("v");
    if (
      document.querySelector("ytd-enforcement-message-view-model") &&
      video_id
    ) {
      setTimeout(() => {
        document.querySelector(".yt-spec-button-view-model button")?.click();
        window.location.reload();
        // setTimeout(() => {
        //     document.querySelectorAll('c-wiz button')?.[4].click();
        // }, 300)
      }, 200);
      return;
    }
  }, 2000);
}
