// script.js

let toggleLanguageButton = document.getElementById("toggleLanguage");
let toggleText = document.getElementById("toggleText");
let startRecordButton = document.getElementById("startRecord");
let stopRecordButton = document.getElementById("stopRecord");
let transcriptTextbox = document.getElementById("transcript");
let translationDiv = document.getElementById("translation");
let downloadBtn = document.getElementById("downloadBtn");

let currentLanguage = "en-US"; // Default to English
let targetLanguage = "tr"; // Default translation target
let recognition;
let isListening = false;

// Toggle Language Function
toggleLanguageButton.addEventListener("click", () => {
  stopListening(); // Stop any active recording before switching language

  // Reset UI
  startRecordButton.disabled = false;

  startRecordButton.style.display = "block";
  stopRecordButton.disabled = true;
  stopRecordButton.style.display = "none";
  transcriptTextbox.value = ""; // Clear transcript
  translationDiv.textContent = ""; // Clear translation

  // Toggle between English and Turkish
  if (currentLanguage === "en-US") {
    currentLanguage = "tr-TR"; // Set mic to Turkish
    targetLanguage = "en"; // Translate to English
    toggleText.innerHTML = 'Turkish <i class="fa-solid fa-rotate"></i> English';
  } else {
    currentLanguage = "en-US"; // Set mic to English
    targetLanguage = "tr"; // Translate to Turkish
    toggleText.innerHTML = 'English <i class="fa-solid fa-rotate"></i> Turkish';
  }
  console.log("Switched to:", currentLanguage, "Translating to:", targetLanguage);
});

// Stop Speech Recognition
function stopListening() {
  if (recognition) {
    recognition.stop();
    isListening = false;
    startRecordButton.disabled = false;
    stopRecordButton.disabled = true;
    stopRecordButton.style.display = "none";
    startRecordButton.style.display = "block";
    transcriptTextbox.value=""
   
    console.log("Speech recognition stopped.");
  }
}

// Translate Text using Google Translate API
async function translateText(text, targetLang) {
  const sourceLang = currentLanguage.split("-")[0];
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    return result[0][0][0]; // Extract translated text
  } catch (error) {
    console.error("Translation failed:", error);
    return "Translation Error";
  }
}

// Text-to-Speech Function
function speakText(text, targetLang) {

    text = text.replace(/0/g, ' 0');
    
  const isEdge = /Edg/.test(navigator.userAgent);
  const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent);

  if (isEdge || isMac) {
    console.log("Using Browser's Built-in Voice (Edge/Mac)");
    if ("speechSynthesis" in window) {
      let language = targetLang === "en" ? "en-GB" : "tr-TR";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      let voices = speechSynthesis.getVoices();
      let selectedVoice = voices.find((voice) => voice.lang === language);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("Using voice: " + selectedVoice.name);
      }
      speechSynthesis.speak(utterance);
    } else {
      console.warn("SpeechSynthesis not supported in this browser.");
    }
  } else if (typeof responsiveVoice !== "undefined") {
    console.log("Using ResponsiveVoice.js");
    let voice = targetLang === "en" ? "UK English Male" : "Turkish Male";
    responsiveVoice.speak(text, voice, { rate: 1 });
  } else {
    console.warn("No supported TTS method found.");
  }
}

// Start Speech Recognition
function startRecording() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser. Try Chrome.");
    return;
  }



  recognition = new webkitSpeechRecognition();
  recognition.lang = currentLanguage; // Set language dynamically
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  isListening = true;

  recognition.onstart = () => {
    console.log("Speech recognition started in:", currentLanguage);
    transcriptTextbox.value = "Listening...";
    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
     startRecordButton.style.display = "none";
    stopRecordButton.style.display = "block";
  };

  recognition.onresult = async (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    transcriptTextbox.value = interimTranscript + finalTranscript;

    if (!interimTranscript) {
      if (finalTranscript) {
        const translatedText = await translateText(finalTranscript, targetLanguage);
        translationDiv.textContent = translatedText;
        speakText(translatedText, targetLanguage === "tr" ? "tr-TR" : "en-US");
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    transcriptTextbox.value = "Error: " + event.error;
    stopListening();
  };

  recognition.onend = () => {
    console.log("Speech recognition ended.");
    if (isListening) {
      startRecordButton.disabled = false;
      stopRecordButton.disabled = true;
       startRecordButton.style.display = "block";
      stopRecordButton.style.display = "none";
    }
  };

  recognition.start();
}

// Observe Changes and Update Hidden Text
function updateHiddenText() {
  const hiddenText = document.getElementById("hiddenText");
  if (translationDiv.textContent.trim()) {
    hiddenText.value += translationDiv.textContent.trim() + " ";
  }
}

const observer = new MutationObserver(updateHiddenText);
observer.observe(translationDiv, { childList: true, subtree: true, characterData: true });

// Download Translated Text
document.getElementById("downloadBtn").addEventListener("click", function () {
  const text = document.getElementById("hiddenText").value.trim();
  if (!text) {
    alert("No translated text to download!");
    return;
  }

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "AIandAIOT_translated_text.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Hide Download Button if No Text
function checkHiddenText() {
  if (document.getElementById("hiddenText").value.trim() === "") {
    downloadBtn.style.opacity = "0";
  } else {
    downloadBtn.style.opacity = "1";
  }
}

setInterval(checkHiddenText, 500);
checkHiddenText();

startRecordButton.addEventListener("click", startRecording);
stopRecordButton.addEventListener("click", stopListening);

