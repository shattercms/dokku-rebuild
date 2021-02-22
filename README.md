# dokku-rebuild

A small NodeJS service providing a unix socket for communication. When a rebuild is triggered the service will execute the `dokku ps:rebuild <your app>` command to rebuild your app.

## Requirements

- NodeJS (tested on v14, older versions will likely work too)

## Install Service

### Configuration

Edit the `APP_NAME` variable in the `dist/dokku-rebuild.service` file to match your app name.

```
Environment=APP_NAME=<your app>
```

### Run install script

```bash
$ sudo ./install.sh
```

## Remove Service

```bash
$ sudo ./remove.sh
```

## Usage

The service will provide a unix socket at `/var/run/dokku-rebuild/dokku-rebuild.sock` for other processes to access.

### Mount socket location

To make the socket available in your app you need to mount it to the docker container of your app. Dokku makes this quite easy.

```bash
$ dokku storage:mount <your app> /var/run/dokku-rebuild:/var/run/dokku-rebuild
```

You might need to restart your app for this change to take affect.

```bash
$ dokku ps:restart <your app>
```

### Connect to the socket

Find out how to use unix sockets in your language. This is a NodeJS example.

```js
const net = require('net');

const socketPath = '/var/run/dokku-rebuild/dokku-rebuild.sock';
const client = net.createConnection(socketPath);

// Write 'rebuild' to the socket to trigger a new rebuild
client.on('connect', () => {
  client.write('rebuild');
});

// Listen for current stage
client.on('data', (data) => {
  const stage = data.toString();
  console.log('currentStage:', stage);
});

// When the connection is closed the build is over
client.on('close', () => {
  console.log('done');
});
```

### Setup stage feedback

The service will scan each line of the build output for instructions. To tell the service a new stage has been reached, echo `[dokku-rebuild] <your stage>` to the output. Stage names may only contain letters, numbers, dashes and underscores.

Example with Docker:

```docker
...

# Install dependencies
RUN echo "[dokku-rebuild] setup"
COPY package.json ./
COPY yarn.lock ./
RUN yarn

# Build with TypeScript
RUN echo "[dokku-rebuild] build"
COPY . .
RUN yarn build

...
```

## Similar projects

This project was heavily inspired by [dokku-daemon](https://github.com/dokku/dokku-daemon). If you want more than just trigger a rebuild, you can checkout that project instead.
