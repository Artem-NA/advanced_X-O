const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
// players is empty object (like dictionary)
// keys - values
let players = {};
let board = Array(16).fill(null);
let currentTurn = 'X';
let scores = { X: 0, O: 0 };
/*
0 1 2  3
4 5  6  7 
8  9  10 11
12 13 14 15
*/

//checking who won the game
function checkWinner(board) {
  //options to win the game with same symbol
  const lines = [
  // Rows
  [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],

  // Columns
  [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],

  // Diagonals
  [0,5,10,15], [3,6,9,12]
];

    // Check for a options on 4x4 board
  for (const [a, b, c, d] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c] && board[c] === board[d]) {
      return board[a]; // 'X' or 'O'
    }
  }
  //check for draw
  return board.every(cell => cell !== null) ? 'draw' : null;
}
//When a user connects, run this function
io.on('connection', (socket) => {

  
    //The socket is a unique object for that user
   // It represents the connection between server and client
   // It has its own id
  
  console.log('A user connected:', socket.id);
  
  // object of sockets ids
  const keys = Object.keys(players);
  if (keys.length < 2) {
    // no players
    let symbol = keys.length === 0 ? 'X' : 'O';
    // player disconnects with O as symbol
    if (keys.length === 1) {
      const firstPlayerId = keys[0];
      const takenSymbol = players[firstPlayerId];
      symbol = takenSymbol === 'X' ? 'O' : 'X';

    }
    players[socket.id] = symbol;
    socket.emit('player-assigned', symbol);
    io.emit('score-update', scores);

    // Refresh keys AFTER updating players
    const updatedKeys = Object.keys(players);
    if (updatedKeys.length === 2) {
      io.emit('start-game', currentTurn);
    }
  } else {
    socket.emit('full');
    return;
  }
  

  socket.on('move', ({ index, symbol }) => {
    if (symbol !== currentTurn || board[index] || Object.keys(players).length < 2) return;

    board[index] = symbol;
    const winner = checkWinner(board);

    if (winner === 'X' || winner === 'O') {
      scores[winner]++;
      io.emit('update-board', { board });
      io.emit('game-over', { winner });
    } else if (winner === 'draw') {
      io.emit('update-board', { board });
      io.emit('game-over', { winner: 'draw' });
    } else {
      currentTurn = currentTurn === 'X' ? 'O' : 'X';
      io.emit('update-board', { board });
      io.emit('next-turn', currentTurn);
    }
  });



  socket.on('flip', ({ index, symbol }) => {
  if (board[index] && board[index] !== symbol) {
    board[index] = symbol;

    const winner = checkWinner(board);

    if (winner === 'X' || winner === 'O') {
      scores[winner]++;
      io.emit('update-board', { board });
      io.emit('game-over', { winner });
    } else if (winner === 'draw') {
      io.emit('update-board', { board });
      io.emit('game-over', { winner: 'draw' });
    } else {
      currentTurn = currentTurn === 'X' ? 'O' : 'X';
      io.emit('update-board', { board });
      io.emit('next-turn', currentTurn);
    }
  }
});


socket.on('restart', () => {
  board = Array(16).fill(null);
  currentTurn = Math.random() < 0.5 ? 'X' : 'O';
  flipCount = 0;
  io.emit('restart-done', { board, turn: currentTurn });
  io.emit('score-update', scores);
});




  socket.on('disconnect', () => {
    delete players[socket.id];
    console.log(`player ${socket.id} disconnected`)
    board = Array(16).fill(null);
    currentTurn = 'X';
    scores = { X: 0, O: 0 };
    io.emit('reset');
    
  });
});

http.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
