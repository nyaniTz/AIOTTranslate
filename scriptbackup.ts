// script.js
// Ensure no duplicate declarations
let toggleLanguageButton = document.getElementById('toggleLanguage');
let toggleText = document.getElementById('toggleText');
let startRecordButton = document.getElementById('startRecord');
let stopRecordButton = document.getElementById('stopRecord');
let transcriptTextbox = document.getElementById('transcript');
let translationDiv = document.getElementById('translation');

let currentLanguage = 'en-US'; // Default to English
let targetLanguage = 'tr'; // Default to translate to Turkish
let recognition;
let isListening = false;


// Toggle Language
toggleLanguageButton.addEventListener('click', () => {
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
// Translate Text using LibreTranslate API
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



// Speak Out the Translated Text
function speakText(text, langCode) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Speech synthesis not supported.");
    }
}


// Start Recording
function startRecording() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser. Try Chrome.");
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.continuous = true;
    recognition.interimResults = false;
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
        const result = event.results[event.results.length - 1][0].transcript;
        console.log('Transcript:', result);
        transcriptTextbox.value = result;

        // Translate to the target language
        const translatedText = await translateText(result, targetLanguage);
        translationDiv.innerHTML = translatedText;

        // Speak Out the Translated Text
        speakText(translatedText, targetLanguage === 'tr' ? 'tr-TR' : 'en-US');
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
            recognition.start(); // Restart if manually stopped
        }
    };

    recognition.start();
}

// Event listeners for buttons
startRecordButton.addEventListener('click', startRecording);
stopRecordButton.addEventListener('click', stopListening); // Add this to your script