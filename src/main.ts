import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

let uploadInput: HTMLElement | null;
let preview: HTMLElement | null;
let btnStart: HTMLElement | null;
let btnEnd: HTMLElement | null;
let btnSubmit: HTMLElement | null;
let videoElement: HTMLVideoElement | null;
let inputPath: string;

let qualityContainer: HTMLElement | null;
let qualitySlider: HTMLInputElement | null;
let qualityLabel: HTMLElement | null;
let sizeEstimate: HTMLElement | null;

let startTime: number | null = null;
let endTime: number | null = null;

const uploadVideo = async () => {
  console.log(preview)
  if (preview && preview?.childNodes.length > 0) {
    preview.replaceChildren();
  }

  const path = await open({ multiple: false, filters: [{ name: "Video", extensions: ["mp4","mov","mkv"] }] });

  if (typeof path === "string") {
    console.log(path)
    videoElement = document.createElement("video");
    videoElement.src = convertFileSrc(path);
    videoElement.controls = true;
    videoElement.disablePictureInPicture = true;
    (videoElement as any).controlsList?.add("nodownload", "nofullscreen", "noremoteplayback");
    preview?.appendChild(videoElement);
    inputPath = path;
  }
};


const setTime = (timeType: string) => {
  if (!timeType){
    return;
  }

  if (timeType == "start"){
    startTime = videoElement?.currentTime ?? null;
  } else if (timeType == "end") {
    endTime = videoElement?.currentTime ?? null;
  }

  if ((startTime != null) && (endTime != null) ) {
    btnSubmit?.classList.remove("hidden")
    qualityContainer?.classList.remove("hidden")
  }
}

const renderVideo = async () => {
  const outputPath = await save({ defaultPath: `trimmed-${new Date().toISOString().slice(0, 10)}.mp4` });

  if (!outputPath) return;
  await invoke("trim_video", {
    input: inputPath,
    output: outputPath,
    start: startTime?.toString(),
    end: endTime?.toString(),
    bitrate: qualitySlider?.value || "3000"
  });
}

const getQualityLabel = (kbps: number) => {
  if (kbps <= 1000) return 'Low';
  if (kbps <= 3000) return 'Medium';
  if (kbps <= 6000) return 'High';
  return 'Max';
} 

const updateEstimate = () => {
  if (!startTime || !endTime || !qualitySlider || !qualityLabel || !sizeEstimate) {
    return;
  }

  const videoBitrate = parseInt(qualitySlider.value);
  const trimDuration = endTime - startTime;

  qualityLabel.textContent = `${getQualityLabel(videoBitrate)} (${videoBitrate} kbps)`;

  if (trimDuration > 0) {
    const bytes = ((videoBitrate + 128) * 1000 * trimDuration) / 8;
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    sizeEstimate.textContent = `Estimated size: ~${mb} MB`;
  }
}


window.addEventListener("DOMContentLoaded", () => {
  uploadInput = document.querySelector(".upload");
  preview = document.querySelector(".preview");
  btnStart = document.querySelector(".btnStart");
  btnEnd = document.querySelector(".btnEnd");
  btnSubmit = document.querySelector(".btnSubmit")

  qualityContainer = document.querySelector(".quality")
  qualitySlider = document.querySelector(".quality-slider")
  qualityLabel = document.querySelector(".quality-label")
  sizeEstimate = document.querySelector(".size-estimate")
  
  uploadInput?.addEventListener("click", () => {
    uploadVideo();
  });

  btnStart?.addEventListener("click", () => {
    setTime('start')
  })

  btnEnd?.addEventListener("click", () => {
    setTime('end')
  })

  qualitySlider?.addEventListener('input', updateEstimate);

  btnSubmit?.addEventListener("click", () => {
    renderVideo()
  })
 
});
