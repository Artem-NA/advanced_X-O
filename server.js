const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
// players is empty object (like dictionary)
// keys - values
let players = {};
let board = Array(9).fill(null);
let currentTurn = 'X';
let scores = { X: 0, O: 0 };
/*
0   1   2
3   4   5   
6   7   8   
*/

//checking who won the game
function checkWinner(board) {
  //options to win the game with same symbol
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // columns
    [0,4,8],[2,4,6]          // diagonals
  ];
  //check for the options
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]; // 'X' or 'O'
    }
  }
  //check for draw
  return board.every(cell => cell !== null) ? 'draw' : null;
}
//When a user connects, run this function
io.on('connection', (socket) => {

  /*
    The socket is a unique object for that user
    It represents the connection between server and client
    It has its own id
  */
  console.log('A user connected:', socket.id);


  if (Object.keys(players).length < 2) {
    const symbol = Object.keys(players).length === 0 ? 'X' : 'O';
    players[socket.id] = symbol;
    socket.emit('player-assigned', symbol);
    io.emit('score-update', scores);

    if (Object.keys(players).length === 2) {
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

socket.on('restart', () => {
  board = Array(9).fill(null);
  currentTurn = Math.random() < 0.5 ? 'X' : 'O';
  io.emit('restart-done', { board, turn: currentTurn });
  io.emit('score-update', scores);
});




  socket.on('disconnect', () => {
    delete players[socket.id];
    board = Array(9).fill(null);
    currentTurn = 'X';
    scores = { X: 0, O: 0 };
    io.emit('reset');
  });
});

http.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
