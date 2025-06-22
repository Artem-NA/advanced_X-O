const socket = io();
const boardDiv = document.querySelector('.board');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const flipBtn = document.getElementById('flip');
const blindeBtn = document.getElementById('blinde');

const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');

let playerSymbol = null;
let flipMode = false; // Are we in flip mode?
let myTurn = false;
let flipCount = 0;
const MAX_FLIPS_PER_ROUND = 2;

restartBtn.onclick = () => {
  socket.emit('restart');
  restartBtn.style.display = 'none'; // hide again
};





// move to server and say to override the selected cell to the opposite symbol
flipBtn.addEventListener('click', () => {
  if (!myTurn || flipCount >= MAX_FLIPS_PER_ROUND) {
    statusDiv.textContent = flipCount >= MAX_FLIPS_PER_ROUND
      ? 'No flips left this round!'
      : 'Not your turn.';
    return;
  }

  flipMode = true;
  statusDiv.textContent = `Flip mode active (${MAX_FLIPS_PER_ROUND - flipCount} left). Click opponent's cell.`;
});


function renderBoard(board) {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = board[i] || '';
  });
}

for (let i = 0; i < 16; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  cell.addEventListener('click', () => {
    // This code runs ONLY when  cell is clicked
    const cellSymbol = cell.textContent;
    console.log("cell clicked");



    if (flipMode) {
      if (!myTurn || !cellSymbol || cellSymbol === playerSymbol) return;

      socket.emit('flip', { index: i, symbol: playerSymbol });
      flipMode = false;
      flipCount++; // Track flip usage
      return;
    }
    if (!myTurn || cell.textContent) return;
    socket.emit('move', { index: i, symbol: playerSymbol });




  });
  boardDiv.appendChild(cell);
}


socket.on('player-assigned', (symbol) => {
  playerSymbol = symbol;
  console.log("Assigned symbol:", symbol);
  statusDiv.textContent = `You are Player ${symbol}`;
});

socket.on('full', () => {
  // Handle the "room is full" case here
  alert("The game room is full. Try again later.");
  // Or update the UI accordingly
});

socket.on('start-game', (turn) => {
  if (!playerSymbol) {
    // Wait and retry once playerSymbol is set
    const waitForSymbol = setInterval(() => {
      if (playerSymbol) {
        myTurn = (playerSymbol === turn);
        statusDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
        clearInterval(waitForSymbol);
      }
    }, 50);
  } else {
    myTurn = (playerSymbol === turn);
    statusDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
  }
});


socket.on('update-board', ({ board }) => {
  renderBoard(board);
});

socket.on('next-turn', (turn) => {
  myTurn = (playerSymbol === turn);
  statusDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
  flipBtn.style.display = myTurn ? 'inline-block' : 'none';

});

socket.on('game-over', ({ winner }) => {
  myTurn = false;
  restartBtn.style.display = 'inline-block'; // show restart button

  if (winner === 'draw') {
    statusDiv.textContent = "It's a draw!";
  } else if (winner === playerSymbol) {
    statusDiv.textContent = "You win! 🎉";
  } else {
    statusDiv.textContent = "You lost 😢";
  }
});

socket.on('score-update', (scores) => {
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
});

socket.on('reset', () => {
  renderBoard(Array(16).fill(null));
  statusDiv.textContent = 'Player left. Refresh game';
  myTurn = false;
  restartBtn.style.display = 'none'; // hide restart if player leaves
});

socket.on('restart-done', ({ board, turn }) => {
  renderBoard(board);
  currentTurn = turn;
  myTurn = (playerSymbol === turn);
  restartBtn.style.display = 'none'; // hide again
  statusDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
   // Reset flip counter
  flipCount = 0;
  flipMode = false;
});
