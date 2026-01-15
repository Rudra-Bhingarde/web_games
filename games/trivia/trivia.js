/* ================================================================
   NEURAL TRIVIA - CORE LOGIC (STABLE V2.0)
================================================================ */

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let canAnswer = true;

// --- 1. Scaling Engine (Anchor: Top) ---
function autoScale() {
    const wrapper = document.getElementById('scale-wrapper');
    const gameBox = document.getElementById('game-box');
    const header = document.querySelector('.Header');
    
    function setScale() {
        const headerSpace = header.offsetHeight + 40; 
        const availW = window.innerWidth - 60;
        const availH = window.innerHeight - headerSpace - 60;
        
        const scale = Math.min(availW / gameBox.offsetWidth, availH / gameBox.offsetHeight);
        const finalScale = Math.min(scale, 1);
        
        wrapper.style.transform = `scale(${finalScale})`;
    }

    const observer = new ResizeObserver(() => setScale());
    observer.observe(document.body);
    setScale();
}

// --- 2. Game initialization ---
async function initGame() {
    toggleLoader(true);
    score = 0; 
    currentQuestionIndex = 0;
    
    document.getElementById('score-text').innerText = "0";
    document.getElementById('modal').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';

    // Get Selections
    const category = document.getElementById('category-select').value;
    const difficulty = document.getElementById('difficulty-select').value;
    
    // Update Badge UI
    const levelTag = document.getElementById('level-tag');
    levelTag.innerText = `LEVEL: ${difficulty.toUpperCase()}`;
    
    // Dynamic Badge Coloring
    if (difficulty === 'easy') levelTag.style.color = "#00ff88";
    else if (difficulty === 'medium') levelTag.style.color = "#ff7a18";
    else levelTag.style.color = "#ff3366";

    const API_URL = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.results.length === 0) throw new Error("API Limit reached or no data");
        
        questions = data.results;
        showQuestion();
        toggleLoader(false);
        autoScale();
    } catch (error) {
        console.error("API Error:", error);
        alert("System Overload! Try a different topic or wait a moment.");
        toggleLoader(false);
    }
}

// --- 3. UI Rendering ---
function showQuestion() {
    canAnswer = true;
    document.getElementById('next-btn').style.display = 'none';
    const q = questions[currentQuestionIndex];
    
    document.getElementById('question-count').innerText = `${currentQuestionIndex + 1}/10`;
    document.getElementById('category-tag').innerText = `TOPIC: ${q.category.toUpperCase()}`;
    document.getElementById('question-text').innerHTML = q.question; // Decodes HTML entities

    // Mix and shuffle options
    const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerHTML = opt;
        btn.onclick = () => handleAnswer(opt, btn, q.correct_answer);
        container.appendChild(btn);
    });
}

function handleAnswer(selected, btn, correct) {
    if (!canAnswer) return;
    canAnswer = false;

    const allBtns = document.querySelectorAll('.option-btn');
    
    if (selected === correct) {
        score += 10;
        document.getElementById('score-text').innerText = score;
        btn.classList.add('correct');
        btn.style.transform = "scale(1.05) translateX(15px)";
    } else {
        btn.classList.add('wrong');
        // Reveal correct answer
        allBtns.forEach(b => {
            if (b.innerHTML === correct) b.classList.add('correct');
        });
        document.getElementById('game-box').classList.add('shake');
        setTimeout(() => document.getElementById('game-box').classList.remove('shake'), 400);
    }

    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        handleWin();
    }
}

function handleWin() {
    const modal = document.getElementById('modal');
    const perf = (score / 100) * 100;
    document.getElementById('modal-msg').innerText = `Neural Sync Complete. Accuracy: ${perf}%. Total Score: ${score}/100.`;
    modal.style.display = 'flex';
}

function toggleLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

// --- 4. Event Bindings ---
document.getElementById('next-btn').onclick = nextQuestion;
document.getElementById('reset-game-btn').onclick = initGame;
document.getElementById('modal-reset').onclick = initGame;
document.getElementById('difficulty-select').onchange = initGame;
document.getElementById('category-select').onchange = initGame;

// Start on load
window.onload = initGame;