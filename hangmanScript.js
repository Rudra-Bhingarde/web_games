const WORD_API_URL = "https://random-word-api.herokuapp.com/word?number=1";
const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

let currentWord, currentHint, mistakes, guessedLetters;
const maxMistakes = 6;
const hangmanParts = ["head", "body", "left-arm", "right-arm", "left-leg", "right-leg"];

// NEW: Function to fetch a word and its hint from the web
async function getRandomWordFromWeb() {
    try {
        // Step 1: Show loading state
        document.getElementById("word-display").innerText = "LOADING...";
        document.getElementById("hint").innerText = "Fetching from web...";

        // Step 2: Get a random word
        const wordResponse = await fetch(WORD_API_URL);
        const [word] = await wordResponse.json();

        // Step 3: Get the definition for that word
        const dictResponse = await fetch(`${DICTIONARY_API_URL}${word}`);
        const dictData = await dictResponse.json();

        // If word not found in dictionary, try again recursively
        if (dictData.title === "No Definitions Found") {
            return getRandomWordFromWeb();
        }

        // Return the word and its first definition as the hint
        return {
            word: word.toUpperCase(),
            hint: dictData[0].meanings[0].definitions[0].definition
        };
    } catch (error) {
        console.error("Failed to fetch word:", error);
        // Fallback word if internet fails
        return { word: "OFFLINE", hint: "Check your internet connection." };
    }
}

async function initGame() {
    const loader = document.getElementById("loader");
    const modal = document.getElementById("modal");

    // 1. Hide the modal and show the loader
    modal.style.display = "none";
    loader.style.display = "flex";

    try {
        // 2. Fetch the data (the loader stays visible during this)
        const data = await getRandomWordFromWeb();
        
        // 3. Set the game state
        currentWord = data.word;
        currentHint = data.hint;
        mistakes = 0;
        guessedLetters = [];

        // 4. Update the UI
        document.getElementById("hint").innerText = currentHint;
        document.getElementById("mistakes").innerText = mistakes;
        document.querySelectorAll(".man-part").forEach(p => p.classList.remove("visible"));
        
        renderWord();
        renderKeyboard();

    } catch (error) {
        console.error("Game Initialization failed:", error);
    } finally {
        // 5. Hide the loader once everything is ready
        setTimeout(() => {
            loader.style.display = "none";
        }, 500); // Small delay makes it feel smoother
    }
}
/* ... keep the rest of your renderWord, renderKeyboard, and handleGuess functions ... */

function renderWord() {
    const display = currentWord.split("").map(letter => 
        guessedLetters.includes(letter) ? letter : "_"
    ).join(" ");
    document.getElementById("word-display").innerText = display;

    if (!display.includes("_")) gameOver(true);
}

function renderKeyboard() {
    const kb = document.getElementById("keyboard");
    kb.innerHTML = "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
        const btn = document.createElement("button");
        btn.innerText = letter;
        btn.classList.add("key");
        btn.onclick = () => handleGuess(letter, btn);
        kb.appendChild(btn);
    });
}

function handleGuess(letter, btn) {
    btn.disabled = true;
    if (currentWord.includes(letter)) {
        guessedLetters.push(letter);
        renderWord();
    } else {
        mistakes++;
        document.getElementById("mistakes").innerText = mistakes;
        document.getElementById(hangmanParts[mistakes - 1]).classList.add("visible");
    }

    if (mistakes === maxMistakes) gameOver(false);
}

function gameOver(isWin) {
    const modal = document.getElementById("modal");
    document.getElementById("modal-title").innerText = isWin ? "Victory!" : "Game Over";
    document.getElementById("modal-msg").innerText = isWin ? 
        `You guessed the word: ${currentWord}` : `The correct word was: ${currentWord}`;
    modal.style.display = "flex";
}

document.getElementById("reset-btn").addEventListener("click", initGame);
initGame();