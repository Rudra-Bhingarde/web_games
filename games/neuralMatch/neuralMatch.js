/* ================================================================
   NEURAL MATCH - CORE SCRIPT (ANIMATED EDITION)
================================================================ */

let totalPairs, cardsFlipped = [], moves = 0, matchesFound = 0;
let canFlip = true;

// --- 1. Top-Anchored Scaling Engine ---
function autoScale() {
    const wrapper = document.getElementById('scale-wrapper');
    const gameBox = document.getElementById('game-box');
    const header = document.querySelector('.Header');
    
    function setScale() {
        const headerSpace = header.offsetHeight + 40; 
        const availableW = window.innerWidth - 60;
        const availableH = window.innerHeight - headerSpace - 60;
        
        const scale = Math.min(
            availableW / gameBox.offsetWidth,
            availableH / gameBox.offsetHeight
        );
        
        const finalScale = Math.min(scale, 1);
        wrapper.style.transform = `scale(${finalScale})`;
    }

    const observer = new ResizeObserver(() => setScale());
    observer.observe(document.body);
    setScale();
}

// --- 2. Game Logic ---
async function initGame() {
    toggleLoader(true);
    moves = 0; matchesFound = 0; cardsFlipped = []; canFlip = true;
    
    document.getElementById('move-count').innerText = "0";
    document.getElementById('accuracy-text').innerText = "0%";
    document.getElementById('modal').style.display = 'none';

    totalPairs = parseInt(document.getElementById('difficulty-select').value);
    const cols = totalPairs > 12 ? 6 : 4;
    document.documentElement.style.setProperty('--grid-cols', cols);

    const images = [];
    for(let i=0; i < totalPairs; i++) {
        images.push(`https://loremflickr.com/300/300/cartoon,animal/all?lock=${Math.floor(Math.random() * 5000) + i}`);
    }

    const gameSet = [...images, ...images].sort(() => Math.random() - 0.5);
    renderGrid(gameSet);
}

function renderGrid(gameSet) {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';

    gameSet.forEach((imgUrl) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.id = imgUrl;
        card.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front" style="background-image: url('${imgUrl}')"></div>
        `;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
    
    setTimeout(() => {
        toggleLoader(false);
        autoScale(); 
    }, 800);
}

function flipCard(card) {
    if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    cardsFlipped.push(card);

    if (cardsFlipped.length === 2) {
        moves++;
        document.getElementById('move-count').innerText = moves;
        checkMatch();
    }
}

function checkMatch() {
    canFlip = false;
    const [card1, card2] = cardsFlipped;
    const isMatch = card1.dataset.id === card2.dataset.id;

    if (isMatch) {
        matchesFound++;
        // Keep cards visible but apply the .matched success animation
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        updateAccuracy();
        resetTurn();
        if (matchesFound === totalPairs) handleWin();
    } else {
        const box = document.getElementById('game-box');
        box.classList.add('shake');
        
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            box.classList.remove('shake');
            updateAccuracy();
            resetTurn();
        }, 1000);
    }
}

function updateAccuracy() {
    const accuracy = moves > 0 ? Math.round((matchesFound / moves) * 100) : 0;
    document.getElementById('accuracy-text').innerText = `${accuracy}%`;
}

function resetTurn() {
    cardsFlipped = [];
    canFlip = true;
}

function handleWin() {
    setTimeout(() => {
        const acc = document.getElementById('accuracy-text').innerText;
        document.getElementById('modal-msg').innerText = `Sync successful. Accuracy: ${acc}. Attempts: ${moves}.`;
        document.getElementById('modal').style.display = 'flex';
    }, 800);
}

function toggleLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

document.getElementById('new-game-btn').onclick = initGame;
document.getElementById('modal-reset').onclick = initGame;
document.getElementById('difficulty-select').onchange = initGame;

window.onload = initGame;