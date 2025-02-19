// script.js
// Ensure no duplicate declarations

let toggleLanguageButton = document.getElementById('toggleLanguage');
let toggleText = document.getElementById('toggleText');
let startRecordButton = document.getElementById('startRecord');
let stopRecordButton = document.getElementById('stopRecord');
let transcriptTextbox = document.getElementById('transcript');
let translationDiv = document.getElementById('translation');
let downloadBtn    = document.getElementById('downloadBtn')

let currentLanguage = 'en-US'; // Default to English
let targetLanguage = 'tr'; // Default to translate to Turkish
let recognition;
let isListening = false;

// Function to check if a language is supported and get a voice
function getVoiceForLanguage(lang) {
    return new Promise((resolve) => {
        speechSynthesis.onvoiceschanged = () => {
            const voices = speechSynthesis.getVoices();
            let voice = voices.find(v => v.lang === lang);  // Exact match

            if (!voice) {
              // Fallback if no exact match
                voice = voices.find(v => v.lang.startsWith(lang.split('-')[0])); // Check language code only
            }


            resolve(voice);
        };

        // Trigger voiceschanged if it hasn't already fired
        if (speechSynthesis.getVoices().length > 0) {
            speechSynthesis.onvoiceschanged();
        }
    });
}

// Toggle Languages
toggleLanguageButton.addEventListener('click', () => {
    // Stop any ongoing recording
    stopListening();  // Call your existing stopListening function

    // Reset UI
    startRecordButton.disabled = false;
    startRecordButton.style.opacity = '1';
    
    stopRecordButton.disabled = true;
    stopRecordButton.style.opacity = '0';
    transcriptTextbox.value = ""; // Clear the transcript
    translationDiv.textContent = ""; // Clear the translation

    // Toggle languages
    if (currentLanguage === 'en-US') {
        currentLanguage = 'tr-TR';
        targetLanguage = 'en';
        toggleText.innerHTML = 'Turkish ➜ English';
    } else {
        currentLanguage = 'en-US';
        targetLanguage = 'tr';
        toggleText.innerHTML = 'English ➜ Turkish';
    }
    console.log('Switched to:', currentLanguage, 'Translating to:', targetLanguage);
});

// Stop Recording
function stopListening() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        startRecordButton.disabled = false;
        stopRecordButton.disabled = true;
        startRecordButton.style.opacity = '1';
        stopRecordButton.style.opacity = '0';
        console.log('Speech recognition stopped.');
    }
}

// Translate Text (Placeholder - Replace with actual translation logic)
// Translate Text using Google Translate unofficial API
async function translateText(text, targetLang) {
    const sourceLang = currentLanguage.split('-')[0]; // Get the source language from currentLanguage
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




// 🎤 Speak Out the Translated Text (Text-to-Speech)
function speakText(text, targetLang) {
    // Workaround: Add a space before any '0' characters
    text = text.replace(/0/g, ' 0');

    if (typeof responsiveVoice !== 'undefined') {
        let voice;
        if (targetLang === 'tr') {
            voice = 'UK English Male'; // OR whatever English voice you prefer
            
       console.log("Tr")
        } else {
            voice = 'Turkish Male'; //  OR "Turkish Male" - Check console output!
           
            console.log("EN")
        }

        responsiveVoice.speak(text, voice, { rate: 1 });
    } else {
        console.warn("ResponsiveVoice not loaded.");
    }
}

// Start Recording
let lastFinalTranscript = ''; // Store the last complete sentence

function startRecording() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser. Try Chrome.");
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;  // Enable interim results for live updates
    recognition.maxAlternatives = 1;

    isListening = true;

    recognition.onstart = () => {
        console.log('Speech recognition started in:', currentLanguage);
        transcriptTextbox.value = 'Listening...';
        startRecordButton.disabled = true;
        stopRecordButton.disabled = false;
        startRecordButton.style.opacity = '0';
        stopRecordButton.style.opacity = '1';
    };

    recognition.onresult = async (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
                lastFinalTranscript = finalTranscript; // Save the last complete sentence
            } else {
                interimTranscript += result[0].transcript;
            }
        }

        // Update first box with live transcription
        transcriptTextbox.value = interimTranscript + finalTranscript; // Append final transcript to live

        // If user stopped talking (no interim results), update the second box
        if (!interimTranscript) {
            if (lastFinalTranscript) {
                const translatedText = await translateText(lastFinalTranscript, targetLanguage);
                translationDiv.textContent = translatedText; // Use textContent for safety
                speakText(translatedText, targetLanguage === 'tr' ? 'tr-TR' : 'en-US');
                lastFinalTranscript = ''; // Reset for the next round
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        transcriptTextbox.value = 'Error: ' + event.error;
        startRecordButton.style.opacity = '1';
        stopRecordButton.style.opacity = '0';
        stopListening();
    };

    recognition.onend = () => {
        console.log('Speech recognition ended.');
        if (isListening) {
            // recognition.start(); // Restart if manually stopped.  Commented this to prevent continuous restart.
            startRecordButton.disabled = false;  // Enable the start button
            stopRecordButton.disabled = true; // Disable stop button
            startRecordButton.style.opacity = '1';
            stopRecordButton.style.opacity = '0';
        }
    };

    recognition.start();
}


function updateHiddenText() {
    const translationDiv = document.getElementById("translation");
    const hiddenText = document.getElementById("hiddenText");

    // Append new translation while keeping previous text
    if (translationDiv.textContent.trim()) {
      hiddenText.value += translationDiv.textContent.trim() + " "; // Add a space to separate sentences
    }
  }

  // Observe changes in the translation div and update hidden text
  const observer = new MutationObserver(updateHiddenText);
  observer.observe(document.getElementById("translation"), { childList: true, subtree: true, characterData: true });

  // Download Button Function
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



  const hiddenText = document.getElementById('hiddenText');


function checkHiddenText() {
    if (hiddenText.value.trim() === "") {
        downloadBtn.style.opacity = '0'; // Hide the buttons
    } else {
        downloadBtn.style.opacity = '1'; // Show the button
    }
}

// Instead of MutationObserver, use a periodic check (because textarea.value changes are not observed)
setInterval(checkHiddenText, 500); // Check every 500ms

// Also trigger once on page load
checkHiddenText();

  
// Event listeners for buttons
startRecordButton.addEventListener('click', startRecording);
stopRecordButton.addEventListener('click', stopListening);