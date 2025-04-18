document.getElementById("copyInfo").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: getYouTubeInfo,
    });
    window.close();
  });
});

function getYouTubeInfo() {
  function parseDuration(durationStr) {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 3) {
      return `${parts[0]} hour${parts[0] !== 1 ? "s" : ""} ${parts[1]} minutes ${parts[2]} seconds`;
    } else if (parts.length === 2) {
      return `${parts[0]} minutes ${parts[1]} seconds`;
    } else {
      return `${parts[0]} seconds`;
    }
  }

  function waitForComments(timeout = 5000) {
    return new Promise((resolve) => {
      const interval = 100;
      let waited = 0;
      const check = () => {
        const commentHeader = document.querySelector("ytd-comments-header-renderer #count");
        if (commentHeader) {
          resolve(commentHeader.innerText);
        } else if (waited >= timeout) {
          resolve("N/A");
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };
      check();
    });
  }

  (async () => {
    try {
      const title = (document.querySelector("h1.ytd-watch-metadata")?.innerText || "N/A").trim();
      
      // Updated channel name selector
      const channel = (document.querySelector("ytd-video-owner-renderer yt-formatted-string.ytd-channel-name")?.innerText || 
                      document.querySelector("#owner a.ytd-channel-name")?.innerText || 
                      "N/A").trim();
      
      const views = (document.querySelector(".view-count")?.innerText || "N/A").trim();
      const date = (document.querySelector("#info-strings yt-formatted-string")?.innerText || "N/A").trim();

      const runtimeRaw = (document.querySelector("span.ytp-time-duration")?.innerText || "N/A").trim();
      const runtime = parseDuration(runtimeRaw);

      let commentsRaw = await waitForComments();
      let commentCount = commentsRaw.match(/\d[\d,.KMB]*/) ? commentsRaw.match(/\d[\d,.KMB]*/)[0] : "0";

      const output = `Title: ${title}
Channel: ${channel}
Views: ${views}
Published on: ${date}
Duration: ${runtime}
Comments: ${commentCount}`;

      navigator.clipboard.writeText(output).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = output;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      });
    } catch (e) {
      console.error("Copy failed:", e);
    }
  })();
}
