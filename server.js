const server = require("express")();
const cors = require("cors");
server.use(cors());
const http = require("http").createServer(server);
const axios = require("axios");
const io = require("socket.io")(
  http,
  (options = {
    cors: true,
    origins: ["*"],
  })
);
let players = [];

io.on("connection", function (socket) {
  console.log("A user connected: " + socket.id);

  players.push(socket.id);

  // Assign playerA if first to connect
  if (players.length === 1) {
    io.emit("isPlayerA");
  }
  if (players.length === 2) {
    io.emit("twoPlayersIn");
  }

  /**
 * Deal Cards
    - 26 cards are dealt for each player as an array of codes
    Ex. [AH, 3S, 7D, QC]
 */
  socket.on("dealCards", function () {
    if (players.length !== 2) {
      return io.emit("twoPlayersReq");
    }
    axios
      .get(`https://deckofcardsapi.com/api/deck/new/draw/?count=52`)
      .then(({ data }) => {
        let cardsA = [];
        let cardsB = [];

        data.cards.map((card, i) =>
          i % 2 === 1 ? cardsA.push(card.code) : cardsB.push(card.code)
        );

        io.emit("dealCards", { cardsA, cardsB });
      });
  });

  socket.on("cardPlayed", function (gameObject, code, isPlayerA) {
    io.emit("cardPlayed", gameObject, code, isPlayerA);
  });

  socket.on("disconnect", function () {
    console.log("A user disconnected: " + socket.id);
    players = players.filter((player) => player !== socket.id);
    io.emit("playerAbandoned");
    io.emit("isPlayerA");
  });
});

http.listen(3000, function () {
  console.log("Server started!");
});
