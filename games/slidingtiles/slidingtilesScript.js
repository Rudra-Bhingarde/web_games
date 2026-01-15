// Configuration
let GRID_SIZE = 3; // Start with 3x3
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
// We use Lorem Picsum for reliable square images.
// Adding 'seed' ensures everyone sees the same image for a specific game session if needed.
const IMAGE_API_URL = `https://picsum.photos/450/450?random=${Date.now()}`;

// Game State
let gameState = []; // Stores the current arrangement of tiles
let emptySlotIndex;
let moves;
let timerInterval;
let secondsElapsed;
let currentImageUrl;

// DOM Elements
const gridElement = document.getElementById('puzzle-grid');
const loader = document.getElementById('loader');
const modal = document.getElementById('modal');
const moveDisplay = document.getElementById('move-count');
const timeDisplay = document.getElementById('time-count');
const previewImg = document.getElementById('preview-img');

// --- Initialization ---

// --- Updated Configuration ---
// Using loremflickr with 'cartoon,animal' tags. 
// The 'all' at the end ensures it matches all tags provided.
const getImageUrl = () => `https://loremflickr.com/450/450/cartoon,animal/all?lock=${Math.floor(Math.random() * 1000)}`;

async function initGame() {
    showLoader(true);
    stopTimer();
    
    // Update Loader Text for the theme
    document.querySelector("#loader p").innerText = "SKETCHING ADORABLE CREATURES...";

    GRID_SIZE = parseInt(document.getElementById('difficulty-select').value);
    document.documentElement.style.setProperty('--grid-size', GRID_SIZE);
    
    moves = 0;
    secondsElapsed = 0;
    updateUI();
    modal.style.display = 'none';
    
    // Use the new cartoon animal URL
    currentImageUrl = getImageUrl();
    previewImg.src = currentImageUrl;
    
    try {
        await preloadImage(currentImageUrl);
        
        gameState = Array.from({length: GRID_SIZE * GRID_SIZE}, (_, i) => i);
        emptySlotIndex = gameState.length - 1; 
        
        shuffleBoard(GRID_SIZE * 30); // Slightly more shuffle for cartoon images

        renderGrid();
        startTimer();
        showLoader(false);

    } catch (e) {
        console.error("Art asset fetch failed", e);
        // Fallback to a backup cartoon image if the service is down
        currentImageUrl = "https://via.placeholder.com/450/1a1c2c/ff3366?text=RETRYING+LINK...";
        showLoader(false);
    }
}
// Helper to ensure image is ready
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
    });
}

// --- Core Game Logic ---

function shuffleBoard(numberOfMoves) {
    for (let i = 0; i < numberOfMoves; i++) {
        // Find all possible moves from current empty slot
        const possibleMoves = getValidNeighborIndices(emptySlotIndex);
        // Pick one at random
        const randomNeighborIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        // Swap
        swapTiles(randomNeighborIndex, emptySlotIndex);
        emptySlotIndex = randomNeighborIndex;
    }
}

function getValidNeighborIndices(index) {
    const neighbors = [];
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    // Check Up, Down, Left, Right boundaries
    if (row > 0) neighbors.push(index - GRID_SIZE); // Up
    if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE); // Down
    if (col > 0) neighbors.push(index - 1); // Left
    if (col < GRID_SIZE - 1) neighbors.push(index + 1); // Right
    
    return neighbors;
}

function handleTileClick(clickedIndex) {
    // Check if clicked tile is adjacent to the empty slot
    const neighbors = getValidNeighborIndices(emptySlotIndex);
    
    if (neighbors.includes(clickedIndex)) {
        // It's a valid move
        swapTiles(clickedIndex, emptySlotIndex);
        emptySlotIndex = clickedIndex;
        moves++;
        updateUI();
        renderGrid();
        checkWin();
    }
}

function swapTiles(idx1, idx2) {
    [gameState[idx1], gameState[idx2]] = [gameState[idx2], gameState[idx1]];
}

function checkWin() {
    // A win is when every tile value matches its index position
    const isSolved = gameState.every((tileValue, index) => {
        // The last slot should be the empty one (highest value)
        if (index === gameState.length - 1) return tileValue === gameState.length - 1;
        return tileValue === index;
    });

    if (isSolved) {
        stopTimer();
        setTimeout(() => {
            document.getElementById('modal-msg').innerHTML = 
                `Completed in <b>${moves}</b> moves and <b>${formatTime(secondsElapsed)}</b>.`;
            modal.style.display = 'flex';
        }, 300);
    }
}

// --- Rendering ---

function renderGrid() {
    gridElement.innerHTML = '';
    // Set the image variable for CSS to use
    gridElement.style.setProperty('--puzzle-image', `url(${currentImageUrl})`);

    gameState.forEach((tileValue, currentIndex) => {
        const tileDiv = document.createElement('div');
        tileDiv.classList.add('tile');

        if (tileValue === gameState.length - 1) {
            // This is the empty slot
            tileDiv.classList.add('empty');
        } else {
            // This is a visible image tile.
            // We need to calculate its original row/col to show the correct slice of image.
            const originalRow = Math.floor(tileValue / GRID_SIZE);
            const originalCol = tileValue % GRID_SIZE;
            
            // Pass these positions to CSS variables for calculating background-position
            tileDiv.style.setProperty('--x-pos', originalCol);
            tileDiv.style.setProperty('--y-pos', originalRow);

            tileDiv.onclick = () => handleTileClick(currentIndex);
        }
        gridElement.appendChild(tileDiv);
    });
}

// --- UI & Timers ---

function updateUI() {
    moveDisplay.innerText = moves;
    timeDisplay.innerText = formatTime(secondsElapsed);
}

function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        timeDisplay.innerText = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}

// Event Listeners
document.getElementById('new-game-btn').addEventListener('click', initGame);
document.getElementById('play-again-btn').addEventListener('click', initGame);
document.getElementById('difficulty-select').addEventListener('change', initGame);

// Start game on load
initGame();