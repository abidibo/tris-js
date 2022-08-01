import React, { Component } from 'react'
import Sockette from 'sockette'
import { ToastContainer, toast } from 'react-toastify'
import { Button, Message } from 'semantic-ui-react'
import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import 'semantic-ui-css/semantic.min.css'

class App extends Component {
  constructor () {
    super()
    this.state = {
      player: null,
      game: null,
      gameEnd: false,
      message: ''
    }
    this.mapSymbol = {1: 'X', 2: 'O'}
  }

  onWsMessage ({ data }) {
    const {error, message, game, action} = JSON.parse(data)
    this.setState({ game: game })
    if (action && action.type === 'setPlayer') {
      this.setState({player: action.data})
    } else if (action === 'end') {
      this.setState({gameEnd: true, message: message})
      toast.info(message)
    } else {
      toast.info(message)
    }
  }

  componentDidMount () {
    this.ws = new Sockette('ws://192.168.1.151:5742', {
      timeout: 5e3,
      maxAttempts: 10,
      onmessage: this.onWsMessage.bind(this),
      onreconnect: e => console.log('Reconnecting...', e),
      onmaximum: e => console.log('Stop Attempting!', e),
      onclose: e => this.ws.send({action: 'close'}),
      onerror: e => console.log('Error:', e)
    })
    window.onbeforeunload = () => {
      this.ws.send(JSON.stringify({action: 'close'}))
      return 'Sure to exit?'
    }
  }

  init () {
    this.setState({gameEnd: false, message: ''})
    this.ws.send(JSON.stringify({action: 'init'}))
  }

  initButton () {
    return <Button onClick={this.init.bind(this)}>Nuovo gioco</Button>
  }

  players () {
    if (!this.state.game || !this.state.game.players.length) {
      return null
    }
    return (
      <div className='players'>
        {this.state.game.players.map(p => p === this.state.player
          ? <span key={p} style={{ textDecoration: 'underline' }}>Player {p} {this.mapSymbol[p]}</span>
          : <span key={p}>Player {p} {this.mapSymbol[p]}</span>
        )}
      </div>
    )
  }

  turn () {
    if (!this.state.game || !this.state.game.turn) {
      return null
    }

    return <Message>{`Player ${this.state.game.turn} plays`}</Message>
  }

  cellClick (x, y) {
    return () => {
      if (!this.state.game || this.state.game.turn !== this.state.player) {
        return null
      }
      if (this.state.game.stage[x][y]) {
        return null
      }
      this.ws.send(JSON.stringify({action: 'play', data: [x, y]}))
    }
  }

  row (r) {
    return [1, 2, 3].map(c => {
      return (
        <div className='cell' onClick={this.cellClick(r, c)}>
          {this.state.game && this.state.game.stage[r][c] ? this.mapSymbol[this.state.game.stage[r][c]] : ''}
        </div>
      )
    })
  }

  render () {
    return (
      <div className="tris">
        {this.initButton()}
        {this.players()}
        {this.turn()}
        {this.state.message && <Message>{this.state.message}</Message>}
        <div className="stage">
          {[1, 2, 3].map(r => this.row(r))}
        </div>
        <ToastContainer />
      </div>
    );
  }

  componentWillUnmount () {
    console.log('UNMOUNT')
    this.ws.send(JSON.stringify({action: 'close'}))
  }
}

export default App;
