const WebSocket = require('ws')
const term = require('terminal-kit').terminal

// connection
const PORT = 5742
const wss = new WebSocket.Server({ port: PORT })
console.log(`Listening on localhost:${PORT}`)

const initGame = () => ({
  players: [],
  status: null,
  stage: {
    1: {
      1: null,
      2: null,
      3:null
    },
    2: {
      1: null,
      2: null,
      3:null
    },
    3: {
      1: null,
      2: null,
      3:null
    }
  }
})

const send = (ws, obj) => ws.send(JSON.stringify({...obj, game}))
const broadcast = obj => {
  players.forEach(p => p.ws.send(JSON.stringify({...obj, game})))
}

let game = initGame()
let players = []

const init = () => {
  let initPlayer = Math.random() > 0.5 ? 1 : 2
  game = {
    ...initGame(),
    players: game.players,
    status: 'running',
    turn: initPlayer,
  }
  broadcast({ error: false, action: 'init', message: 'init game' })
}

const play = (data, player) => {
  // fill player clicked cell
  game.stage[data[0]][data[1]] = player
  // togel player turn
  game.turn = game.turn == 1 ? 2 : 1
  broadcast({error: false, action: 'refresh'})
  checkWin()
}

const checkWin = () => {
  let win = null
  // rows
  for(let r in [1, 2, 3]) {
    r++
    if (game.stage[r][1] && game.stage[r][1] === game.stage[r][2] && game.stage[r][2] === game.stage[r][3]) {
      win = game.stage[r][1]
    }
  }
  // cols
  for(let c in [1, 2, 3]) {
    c++
    if (game.stage[1][c] && game.stage[1][c] === game.stage[2][c] && game.stage[2][c] === game.stage[3][c]) {
      win = game.stage[1][c]
    }
  }

  // oblique
  if (game.stage[1][1] && game.stage[1][1] === game.stage[2][2] && game.stage[2][2] === game.stage[3][3]) {
    win = game.stage[1][1]
  }
  if (game.stage[1][3] && game.stage[1][3] === game.stage[2][2] && game.stage[2][2] === game.stage[3][1]) {
    win = game.stage[1][3]
  }

  if (win) {
    game.turn = null
    broadcast({error: false, action: 'end', message: `Game finished, player ${win} wins`})
  }

}

wss.on('connection', function connection (ws, req) {
  if (players.length === 2) {
    send(ws, {
      error: true,
      message: 'Max number of players reached'
    })
    return
  }
  let newPlayer = {
    name: players.length + 1,
    ws: ws
  }
  players.push(newPlayer)
  game.players.push(newPlayer.name)
  send(ws, {error: false, message: `You are player ${newPlayer.name}`, action: {type: 'setPlayer', data: newPlayer.name}})
  term.brightCyan(`\nNew connection from player ${newPlayer.name}`)
  broadcast({
    error: false,
    message: `Player ${newPlayer.name} connected!`
  })

  ws.on('message', function incoming (message) {
    console.log('received: %s', message)
    let { action, data } = JSON.parse(message)
    console.log('received: %s', message, action)
    if (action === 'init') {
      init()
    } else if (action === 'play') {
      play(data, newPlayer.name)
    } else if (action === 'close') {
      players = players.filter(p => p.name !== newPlayer.name)
      game.players = game.players.filter(p => p !== newPlayer.name)
      broadcast({error: false, action: 'refresh'})
    }
  })
})
