const grid = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const highScoreInputElement = document.getElementById('high-score-input');
const playerNameInput = document.getElementById('player-name');
const saveScoreButton = document.getElementById('save-score');
const scoreboardElement = document.getElementById('scoreboard');
const highScoresList = document.getElementById('high-scores-list');
const startScreenElement = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

const bgMusic = new Audio('assets/sound/bg_music.mp3');
bgMusic.loop = true;
const end = new Audio('assets/sound/end.mp3');
const tap = new Audio('assets/sound/tap.mp3');


const GRID_WIDTH = 10; // 10 columns
const BLOCK_WIDTH_PX = 52.5;
const ROW_HEIGHT_PX = 90;
const INITIAL_BLOCKS = 4;

let currentLevel = 0;
let currentWidth = INITIAL_BLOCKS;
let currentPos = 0;
let direction = 1;
let gameActive = false;
let score = 0;
let speed = 200;
let interval;
let previousRowPositions = []; // To track which columns are occupied in the previous row

function init() {
    currentLevel = 0;
    currentWidth = INITIAL_BLOCKS;
    score = 0;
    speed = 200;
    gameActive = true;
    previousRowPositions = Array.from({length: INITIAL_BLOCKS}, (_, i) => i + (GRID_WIDTH - INITIAL_BLOCKS) / 2); // Start centered
    grid.innerHTML = '';
    grid.style.bottom = '0px';
    document.getElementById('game-container').style.backgroundPositionY = '0px';
    scoreElement.textContent = `Score: ${score}`;
    messageElement.style.display = 'none';
    highScoreInputElement.style.display = 'none';
    scoreboardElement.style.display = 'none';
    startScreenElement.style.display = 'none';

    // Handle music and sound on first interaction
    if (bgMusic.paused) {
        bgMusic.play().catch(error => console.error("Audio play failed:", error));
    }

    // Create first static row
    createStaticRow(previousRowPositions);
    
    startLevel();
}

function createStaticRow(positions) {
    const row = document.createElement('div');
    row.className = 'row';
    positions.forEach(pos => {
        const block = document.createElement('div');
        block.className = 'block';
        block.style.left = (pos * BLOCK_WIDTH_PX) + 'px';
        row.appendChild(block);
    });
    grid.appendChild(row);
}

function startLevel() {
    currentLevel++;
    
    // Create moving row
    const row = document.createElement('div');
    row.className = 'row moving';
    row.id = `row-${currentLevel}`;
    // Start moving from a random direction and edge position
    direction = Math.random() > 0.5 ? 1 : -1;
    currentPos = direction === 1 ? 0 : GRID_WIDTH - currentWidth;
    updateMovingRow(row);
    grid.appendChild(row);
    
    // Shift camera if needed
    const gameContainer = document.getElementById('game-container');
    const containerHeight = gameContainer.clientHeight;
    const thresholdRows = Math.floor((containerHeight * 2/3) / ROW_HEIGHT_PX);
    
    if (currentLevel > thresholdRows) {
        const offset = (currentLevel - thresholdRows) * ROW_HEIGHT_PX;
        grid.style.bottom = `-${offset}px`;
        gameContainer.style.backgroundPositionY = `${offset}px`;
    } else {
        gameContainer.style.backgroundPositionY = '0px';
    }

    clearInterval(interval);
    interval = setInterval(moveBlocks, speed);
}

function updateMovingRow(row) {
    row.innerHTML = '';
    for (let i = 0; i < currentWidth; i++) {
        const block = document.createElement('div');
        block.className = 'block';
        block.style.left = ((currentPos + i) * BLOCK_WIDTH_PX) + 'px';
        row.appendChild(block);
    }
}

function moveBlocks() {
    if (!gameActive) return;
    
    currentPos += direction;
    
    if (currentPos + currentWidth > GRID_WIDTH) {
        currentPos = GRID_WIDTH - currentWidth;
        direction = -1;
    } else if (currentPos < 0) {
        currentPos = 0;
        direction = 1;
    }
    
    const row = document.getElementById(`row-${currentLevel}`);
    updateMovingRow(row);
}

function stack() {
    if (!gameActive) return;
    
    clearInterval(interval);
    
    const currentPositions = [];
    for (let i = 0; i < currentWidth; i++) {
        currentPositions.push(currentPos + i);
    }
    
    // Find overlap with previous row
    const overlappingPositions = currentPositions.filter(pos => previousRowPositions.includes(pos));
    
    if (overlappingPositions.length === 0) {
        gameOver();
        return;
    }
    
    // Update width and previous positions for next level
    currentWidth = overlappingPositions.length;
    previousRowPositions = overlappingPositions;
    
    // Redraw current row with only overlapping blocks (cut off the rest)
    const row = document.getElementById(`row-${currentLevel}`);
    createStaticRow(overlappingPositions); 
    row.remove(); // Remove moving row and replace with static one
    
    score++;
    scoreElement.textContent = `Score: ${score}`;
    
    // Increase speed faster each time
    let speedIncrement = 10;
    if (speed <= 40) speedIncrement = 2;

    if (score > 14) {
        speedIncrement /= 2;
    }

    if (speed > 20) {
        speed -= speedIncrement;
    }
    
    startLevel();
}

function gameOver() {
    gameActive = false;
    clearInterval(interval);
    end.play();
    
    const highScores = getHighScores();
    const isHighScore = highScores.length < 5 || score > highScores[highScores.length - 1].score;

    if (isHighScore && score > 0) {
        highScoreInputElement.style.display = 'block';
        playerNameInput.focus();
    } else {
        showScoreboard();
    }
}

function getHighScores() {
    const scores = localStorage.getItem('highScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScore(name, score) {
    let highScores = getHighScores();
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function showScoreboard() {
    const highScores = getHighScores();
    highScoresList.innerHTML = '';
    
    if (highScores.length === 0) {
        highScoresList.innerHTML = '<li>No high scores yet!</li>';
    } else {
        highScores.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${entry.name}</span><span>${entry.score}</span>`;
            highScoresList.appendChild(li);
        });
    }
    
    messageElement.style.display = 'none';
    highScoreInputElement.style.display = 'none';
    scoreboardElement.style.display = 'block';
}

saveScoreButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Anonymous';
    saveHighScore(name, score);
    playerNameInput.value = '';
    showScoreboard();
});

startButton.addEventListener('click', () => {
    init();
});

playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveScoreButton.click();
    }
    e.stopPropagation(); // Prevent game from interpreting space/etc while typing
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        tap.currentTime = 0;
        tap.play().catch(error => console.error("Audio play failed:", error));
        if (gameActive) {
            stack();
        } else if (scoreboardElement.style.display === 'block' || messageElement.style.display === 'block') {
            init();
        } else if (startScreenElement.style.display === 'block') {
            init();
        }
    }
});

window.addEventListener('click', (e) => {
    // Don't restart if clicking inside the high score input
    if (highScoreInputElement.contains(e.target)) return;
    // Don't restart if clicking the start button (it has its own listener)
    if (e.target === startButton) return;

    if (gameActive) {
        stack();
    } else if (scoreboardElement.style.display === 'block' || messageElement.style.display === 'block') {
        init();
    }
});

// Removed redundant init() call. Game starts from Start Button or Space.
// init();
