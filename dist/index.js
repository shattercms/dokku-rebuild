#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const net_1 = require("net");
const child_process_1 = require("child_process");
const searchRegex = /\[dokku\-rebuild\] ([a-zA-z0-9-_]*)/;
// Check environment variables
if (!process.env.SOCKET_PATH) {
    throw new Error('Socket path is undefined');
}
if (!process.env.APP_NAME) {
    throw new Error('App name is undefined');
}
// Remove old socket file
if (fs_1.existsSync(process.env.SOCKET_PATH)) {
    fs_1.unlinkSync(process.env.SOCKET_PATH);
}
const server = net_1.createServer((socket) => {
    socket.on('error', (error) => {
        throw error;
    });
    socket.on('data', async (data) => {
        // Wait for rebuild command
        const command = data.toString();
        if (command !== 'rebuild') {
            socket.end;
            return;
        }
        // Trigger new build
        await new Promise((resolve, reject) => {
            const build = child_process_1.spawn('dokku', ['ps:rebuild', process.env.APP_NAME]);
            build.stdout.on('data', (data) => {
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
            build.on('error', (error) => {
                console.log(error);
                reject(error);
            });
            build.on('exit', (code) => {
                if (code === 0) {
                    resolve(0);
                }
                else {
                    reject(new Error('Process returned exit code ' + code));
                }
            });
        });
        // Close connection when build process is done
        socket.end();
    });
});
server.listen(process.env.SOCKET_PATH);
