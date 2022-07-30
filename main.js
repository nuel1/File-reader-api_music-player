// Define an array object that would store user local media file(s)
const mediaSourceFiles = [];

// Create an audio element for playing our media file
const audio = document.createElement("audio");

// Play and pause btns all inside a single container;
// {.player} class is the container or parent for the two distinct buttons
const playpauseBtn = document.querySelector(".player");

// next and previous btns for navigating the media files.
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

//Play btn.
const playBtn = document.querySelector(".btn-play");

//Pause btn.
const pauseBtn = document.querySelector(".btn-pause");

// Table element for showing the media file information
const table = document.querySelector("table");

// Loader model for displaying loader animation
//when media file(s) upload is still in progress
const loader = document.querySelector(".loader-model");

// For accessing user local files
const input = document.querySelector("[type='file']");

// Table body tag for displaying media file info. eg: date, name, size.
const tbody = document.querySelector("tbody");

// Audio duration counter, begining from 0:00
const durCount = document.querySelector(".seeker-start-value");

// Audio duration
const durVal = document.querySelector(".seeker-end-value");

//Input range for seeking point to continue the audio time
const seekerSlider = document.querySelector("#seeker-slider");

//Track index from mediaSourceFiles array defined above.
let trackIndex = 0;

let intervalId;

// Hightlight audio being played.
const highlightPlaying = (trackId) => {
  const tableRows = [...tbody.children];

  tableRows
    .filter((tr) => tr.classList.contains("playing"))
    .forEach((tr) => (tr.className = ""));

  tableRows[trackId].className = "playing";
};

const hideBtn = (element) => {
  element.classList.replace("visible", "hidden");
};

const showBtn = (element) => {
  element.classList.replace("hidden", "visible");
};

const removeEvent = (element, eventType, callback) => {
  element.removeEventListener(eventType, callback);
};

const addEvent = (element, eventType, callback) => {
  element.addEventListener(eventType, callback);
};

// Pause and play btns are two individual btns, depending on the
// current state of the audio(pause or play) either of the two
// shows and the other get hidden
const playPauseTrack = () => {
  if (audio.src) {
    if (playpauseBtn.getAttribute("data-current-state") == "paused") {
      //Pause audio player
      audio.play();

      // Hide play btn
      hideBtn(playBtn);

      //Show pause btn
      showBtn(pauseBtn);

      playpauseBtn.setAttribute("data-current-state", "played");
    } else {
      audio.pause();
      hideBtn(pauseBtn);
      showBtn(playBtn);

      playpauseBtn.setAttribute("data-current-state", "paused");
    }
    addEvent(playpauseBtn, "click", playPauseTrack);
  }
};

const nextTrack = () => {
  if (mediaSourceFiles.length) {
    let newTrack = null;
    trackIndex += 1;

    if (mediaSourceFiles.length - trackIndex >= 1) {
      newTrack = mediaSourceFiles[trackIndex];
    } else {
      trackIndex = 0;
      newTrack = mediaSourceFiles[trackIndex];
    }

    if (playpauseBtn.getAttribute("data-current-state") === "paused") {
      playPauseTrack();
    }

    audio.src = newTrack.path;
    audio.play();

    highlightPlaying(trackIndex);
  }
};
nextBtn.addEventListener("click", nextTrack);

const prevTrack = () => {
  let prevTrack = null;

  if (trackIndex > 0) {
    trackIndex -= 1;
  } else {
    trackIndex = mediaSourceFiles.length - 1;
  }

  if (playpauseBtn.getAttribute("data-current-state") === "paused") {
    playPauseTrack();
  }

  prevTrack = mediaSourceFiles[trackIndex];

  audio.src = prevTrack.path;
  audio.play();
  highlightPlaying(trackIndex);
};

prevBtn.addEventListener("click", prevTrack);

const loadTrack = (source) => {
  audio.load();
  audio.src = source;

  playPauseTrack();
  highlightPlaying(trackIndex);
};

const convertToUnit = (fileSize) => {
  const [tb, gb, mb, kb, b] = [
    {
      value: 10 ** 12,
      unit: "TB",
    },
    {
      value: 10 ** 9,
      unit: "GB",
    },
    {
      value: 10 ** 6,
      unit: "MB",
    },
    {
      value: 10 ** 3,
      unit: "KB",
    },
    {
      value: 10 * 2,
      unit: "Bytes",
    },
  ];

  if (typeof fileSize == "number") {
    [tb, gb, mb, kb, b].forEach((memory) => {
      if (Math.floor(fileSize / memory.value)) {
        fileSize = Math.floor(fileSize / memory.value) + memory.unit;
      }
    });
    return fileSize;
  } else {
    fileSize = Number(fileSize);
    return convertToUnit(fileSize);
  }
};

const getYear = (dateInStr) => {
  return dateInStr.match(/\d{4}/)[0];
};

// Structure a table for the data read
const structureTableUI = (data) => {
  if (!data.length) {
    loader.style.display = "none";
    loadTrack(mediaSourceFiles[0].path);
    return;
  }

  data[0].forEach((file) => {
    const fileYearModified = getYear(file.lastModifiedDate.toString());
    const fileSize = convertToUnit(file.size);

    tbody.innerHTML += `
  <tr>
    <td>${fileYearModified}</td>
    <td>${file.name}</td>
    <td>${fileSize}</td>
  </tr>
  `;
  });

  setTimeout(() => {
    structureTableUI(data.slice(1));
  }, 2500);
};

const truncateArray = (array, start, end) => {
  if (
    Array.isArray(array) &&
    Number.isInteger(start) &&
    Number.isInteger(end)
  ) {
    let copy = array;
    if (copy.length >= end)
      return [copy.splice(start, end)].concat(truncateArray(array, start, end));
    return [copy];
  } else {
    return `${Array.isArray(array) ? "" : array + "must be an Array"} \n ${
      Number.isInteger(start) ? "" : start + "must be a number"
    } \n ${Number.isInteger(end) ? "" : end + "must be a number"}`;
  }
};

input.addEventListener("change", async (e) => {
  dropArea.classList.remove("bg-white");
  dropArea.style.display = "none";
  loader.style.display = "flex";
  table.style.display = "";

  try {
    const localData = Object.values(e.target.files);
    const result = await read(localData);

    if (Array.isArray(result)) {
      const data = result;
      mediaSourceFiles.push(...data);
      const pairedData = truncateArray(data, 0, 2);
      structureTableUI(pairedData);
    }
  } catch (e) {
    console.error(e);
  }
});

const dropArea = document.querySelector(".drop-area");

dropArea.addEventListener("dragover", (e) => {
  e.stopPropagation();
  e.preventDefault();

  dropArea.classList.add("bg-white");
  e.dataTransfer.dropEffect = "copy";
});

dropArea.addEventListener("drop", async (e) => {
  e.stopPropagation();
  e.preventDefault();

  dropArea.classList.remove("bg-white");
  dropArea.style.display = "none";

  loader.style.display = "flex";
  table.style.display = "";

  try {
    const localData = Object.values(e.dataTransfer.files);
    const result = await read(localData);

    if (Array.isArray(result)) {
      const data = result;
      mediaSourceFiles.push(...data);
      const pairedData = truncateArray(data, 0, 2);
      structureTableUI(pairedData);
    }
  } catch (e) {
    console.error(e);
  }
});

const read = async (files) => {
  try {
    if (!files.length) return [];

    const file = await readFiles(...files.slice(0, 1));
    return [file, ...(await read(files.slice(1)))];
  } catch (e) {
    console.error(e);
  }
};

const readFiles = async (file) => {
  try {
    const reader = new FileReader();
    const promise = new Promise((resolve, _) => {
      reader.addEventListener("load", function (e) {
        file.path = e.target.result;
      });
      reader.readAsDataURL(file);
      resolve(file);
    });

    const result = await promise;
    return result;
  } catch (e) {
    console.error(e);
  }
};

const audioDurInMin = (dur, min = 0) => {
  if (dur < 60)
    return dur < 10
      ? `${min}:0${Math.floor(dur)}`
      : `${min}:${Math.floor(dur)}`;
  return audioDurInMin(dur - 60, (min += 1));
};

const updateProgress = () => {
  try {
    const sliderSeekerMaxVal = Number(seekerSlider.getAttribute("max"));
    const audioDur = audioDurInMin(audio.duration);
    const currTime = audioDurInMin(audio.currentTime);
    durVal.textContent = "";
    durCount.textContent = "";
    const seekerVal = (sliderSeekerMaxVal / audio.duration) * audio.currentTime;
    if (Number(seekerSlider.value) !== seekerVal) {
      seekerSlider.value = seekerVal;
      document.documentElement.style.setProperty(
        "--seeker-val",
        `${seekerSlider.value * 0.1 * 10}%`
      );
    }
  } catch (e) {}
};

const seek = (e) => {
  if (audio.src) {
    const divisor = 100 / audio.duration;
    const seekTo = Math.round(e.target.value / divisor);
    audio.currentTime = seekTo;
  }
};

seekerSlider.addEventListener("change", seek);
audio.addEventListener("ended", playPauseTrack);
audio.addEventListener("timeupdate", updateProgress);
