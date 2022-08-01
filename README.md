# TRIS

## Getting started

Install all dependencies

```
$ cd ws
$ yarn install
$ cd ../ui
$ yarn install
```

Start the websocket server (open a new terminal window)

```
$ cd ws
$ node index.js
```

Adjust the ip address of the ws server in `src/App.js` inside the `componentDidMount` method, and start the UI app (inside `ui` folder)

```
$ yarn start
```

Now connect from different browsers and play your game.
