#!/usr/bin/env node
import { existsSync, unlinkSync } from 'fs';
import { createServer } from 'net';
import { spawn } from 'child_process';

const searchRegex = /\[dokku\-rebuild\] ([a-zA-z0-9-_]*)/;

// Check environment variables
if (!process.env.SOCKET_PATH) {
  throw new Error('Socket path is undefined');
}
if (!process.env.APP_NAME) {
  throw new Error('App name is undefined');
}

// Remove old socket file
if (existsSync(process.env.SOCKET_PATH)) {
  unlinkSync(process.env.SOCKET_PATH);
}

const server = createServer((socket) => {
  socket.on('error', (error: Error) => {
    throw error;
  });

  socket.on('data', async (data: Buffer) => {
    // Wait for rebuild command
    const command = data.toString();
    if (command !== 'rebuild') {
      socket.end;
      return;
    }

    // Trigger new build
    await new Promise((resolve, reject) => {
      const build = spawn('dokku', ['ps:rebuild', process.env.APP_NAME]);

      build.stdout.on('data', (data: Buffer) => {
        // Search for stage instructions in output
        const line = data.toString();
        const matches = line.match(searchRegex);
        if (!matches || matches.length < 1) {
          return;
        }
        const message = matches[1];
        if (message) {
          // Send current stage to client
          socket.write(message);
        }
      });
      build.stderr.on('data', function (data) {
        console.log(data.toString());
      });

      build.on('error', (error: Error) => {
        console.log(error);
        reject(error);
      });
      build.on('exit', (code: number) => {
        if (code === 0) {
          resolve(0);
        } else {
          reject(new Error('Process returned exit code ' + code));
        }
      });
    });

    // Close connection when build process is done
    socket.end();
  });
});
server.listen(process.env.SOCKET_PATH);
