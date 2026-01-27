const grid = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');

const GRID_WIDTH = 12; // 12 columns
const BLOCK_WIDTH_PX = 35;
const ROW_HEIGHT_PX = 40;
const INITIAL_BLOCKS = 4;

let currentLevel = 0;
let currentWidth = INITIAL_BLOCKS;
let currentPos = 0;
let direction = 1;
let gameActive = true;
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
    previousRowPositions = Array.from({length: INITIAL_BLOCKS}, (_, i) => i + 4); // Start centered (12-4)/2 = 4
    grid.innerHTML = '';
    grid.style.bottom = '0px';
    scoreElement.textContent = `Score: ${score}`;
    messageElement.style.display = 'none';
    
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
    const containerHeight = document.getElementById('game-container').clientHeight;
    const thresholdRows = Math.floor((containerHeight * 2/3) / ROW_HEIGHT_PX);
    
    if (currentLevel > thresholdRows) {
        grid.style.bottom = `-${(currentLevel - thresholdRows) * ROW_HEIGHT_PX}px`;
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
    if (speed > 40) speed -= 10;
    else if (speed > 20) speed -= 2;
    
    startLevel();
}

function gameOver() {
    gameActive = false;
    messageElement.innerHTML = `Game Over!<br>Score: ${score}<br>Click to Restart`;
    messageElement.style.display = 'block';
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameActive) {
            stack();
        } else {
            init();
        }
    }
});

window.addEventListener('click', () => {
    if (gameActive) {
        stack();
    } else {
        init();
    }
});

init();
