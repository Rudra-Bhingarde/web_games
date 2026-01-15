/* ================================================================
   CYBER JIGSAW - CORE LOGIC (PRO EDITION)
   Features: Drag & Drop, Dynamic Difficulty, Web-Image Fetching
================================================================ */

// --- Game State Variables ---
let GRID_SIZE = 4; // Default to 4x4
let currentImageUrl = "";
let piecesSnapped = 0;
let draggedPiece = null; // Global reference for bulletproof snapping

// --- DOM Elements ---
const board = document.getElementById('jigsaw-board');
const tray = document.getElementById('piece-tray');
const progressText = document.getElementById('progress-text');
const previewImg = document.getElementById('preview-img');
const loader = document.getElementById('loader');
const modal = document.getElementById('modal');
const difficultySelect = document.getElementById('difficulty-select');

// --- Initialization ---
async function initGame() {
    toggleLoader(true);
    piecesSnapped = 0;
    progressText.innerText = "0%";
    modal.style.display = 'none';

    // 1. Set Difficulty
    GRID_SIZE = parseInt(difficultySelect.value);
    document.documentElement.style.setProperty('--grid-size', GRID_SIZE);

    // 2. Fetch Cartoon Animal Image (LoremFlickr with Random Lock)
    // Using a 500x500 base for high-res slices
    currentImageUrl = `https://loremflickr.com/500/500/cartoon,animal/all?lock=${Math.floor(Math.random() * 1000)}`;
    previewImg.src = currentImageUrl;

    // 3. Preload image to ensure pieces show up instantly
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
        setupGame();
        toggleLoader(false);
    };
    img.onerror = () => {
        console.error("Image failed to load. Using fallback.");
        currentImageUrl = "https://via.placeholder.com/500/1a1c2c/ff3366?text=RETRYING+LINK...";
        setupGame();
        toggleLoader(false);
    };
    img.src = currentImageUrl;
}

// --- Board Construction ---
function setupGame() {
    board.innerHTML = '';
    tray.innerHTML = '';
    
    // Set board background variable for CSS (optional ghost image)
    board.style.setProperty('--puzzle-image', `url(${currentImageUrl})`);
    
    let pieces = [];
    const totalPieces = GRID_SIZE * GRID_SIZE;

    for (let i = 0; i < totalPieces; i++) {
        // A. CREATE BOARD SLOT
        const slot = document.createElement('div');
        slot.classList.add('board-slot');
        slot.dataset.index = i;

        // Necessary listeners for HTML5 Drag and Drop
        slot.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = "move";
        });
        slot.addEventListener('dragenter', (e) => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            handleDrop(e, slot);
        });

        board.appendChild(slot);

        // B. CREATE PUZZLE PIECE
        const piece = document.createElement('div');
        piece.classList.add('jigsaw-piece');
        piece.id = `piece-${i}`;
        piece.draggable = true;
        piece.style.backgroundImage = `url(${currentImageUrl})`;
        piece.style.backgroundSize = "450px 450px"; // Board dimensions

        // Calculate Slicing Math
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        
        // Percentages: 0% is left/top, 100% is right/bottom
        const xPos = (col / (GRID_SIZE - 1)) * 100;
        const yPos = (row / (GRID_SIZE - 1)) * 100;
        piece.style.backgroundPosition = `${xPos}% ${yPos}%`;
        
        // Drag Event Listeners
        piece.addEventListener('dragstart', (e) => {
            draggedPiece = piece; // Global fallback
            e.dataTransfer.setData('text/plain', piece.id);
            piece.style.opacity = "0.4";
            piece.style.transform = "scale(0.8)";
        });

        piece.addEventListener('dragend', () => {
            piece.style.opacity = "1";
            piece.style.transform = "scale(1)";
            draggedPiece = null;
        });

        pieces.push(piece);
    }

    // C. SHUFFLE PIECES and add to Tray
    pieces.sort(() => Math.random() - 0.5).forEach(p => tray.appendChild(p));
}

// --- Interaction Logic ---
function handleDrop(e, slot) {
    slot.classList.remove('drag-over');
    
    // Get piece ID from event data or the global fallback
    const pieceId = e.dataTransfer.getData('text/plain');
    const piece = pieceId ? document.getElementById(pieceId) : draggedPiece;
    
    if (!piece) return;

    // Extract index from piece ID (e.g., "piece-4" -> 4)
    const pieceIndex = piece.id.split('-')[1];

    // LOGIC: Does the slot index match the piece index?
    if (slot.dataset.index === pieceIndex && slot.children.length === 0) {
        // SNAP SUCCESS
        piece.classList.add('snapped');
        piece.draggable = false;
        slot.appendChild(piece); 
        
        piecesSnapped++;
        updateProgress();
    } else {
        // FEEDBACK: Wrong Slot
        slot.style.background = "rgba(255, 51, 102, 0.3)";
        setTimeout(() => slot.style.background = "", 300);
    }
}

// --- UI Updates ---
function updateProgress() {
    const total = GRID_SIZE * GRID_SIZE;
    const percent = Math.round((piecesSnapped / total) * 100);
    progressText.innerText = `${percent}%`;

    if (piecesSnapped === total) {
        setTimeout(() => {
            document.getElementById('modal-msg').innerText = `System Restored. Puzzle reconstructed at difficulty ${GRID_SIZE}x${GRID_SIZE}.`;
            modal.style.display = 'flex';
        }, 500);
    }
}

function toggleLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}

// --- Global Event Listeners ---
document.getElementById('new-game-btn').addEventListener('click', initGame);
document.getElementById('reset-btn')?.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);

// --- Boot Game ---
initGame();