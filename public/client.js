const socket = io();
const boardDiv = document.querySelector('.board');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');

let playerSymbol = null;
let myTurn = false;

restartBtn.onclick = () => {
  socket.emit('restart');
  restartBtn.style.display = 'none'; // hide again
};

function renderBoard(board) {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = board[i] || '';
  });
}

for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  cell.addEventListener('click', () => {
      // This code runs ONLY when this cell is clicked
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
  renderBoard(Array(9).fill(null));
  statusDiv.textContent = 'Player left. Waiting for opponent...';
  myTurn = false;
  restartBtn.style.display = 'none'; // hide restart if player leaves
});

socket.on('restart-done', ({ board, turn }) => {
  renderBoard(board);
  currentTurn = turn;
  myTurn = (playerSymbol === turn);
  restartBtn.style.display = 'none'; // hide again
  statusDiv.textContent = myTurn ? "Your turn" : "Opponent's turn";
});
