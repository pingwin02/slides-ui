let process = require('node:process');
let http = require('http');
let fs = require('fs');
let path = require('path');

process.on('SIGINT', () => {
    console.info("Interrupted")
    process.exit(0)
});

const portIndex = process.argv.indexOf('--port');
const srcDirIndex = process.argv.indexOf('--src');

let port = 8080;
let srcDir = './src';

if (portIndex !== -1 && process.argv.length > portIndex + 1) {
    port = parseInt(process.argv[portIndex + 1]);
}

if (srcDirIndex !== -1 && process.argv.length > srcDirIndex + 1) {
    srcDir = process.argv[srcDirIndex + 1];
}

http.createServer(function (request, response) {
    let url = decodeURI(request.url);

    let filePath = srcDir + url;

    if (filePath === srcDir + '/') {
        filePath += 'index.html';
    }

    let extension = path.extname(filePath);

    let accept = request.headers.accept;
    
    let contentType;

    switch (extension) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.svg':
            contentType = 'image/svg+xml';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.md':
            contentType = 'text/markdown; charset=utf-8'
            break;
        default:
            contentType = 'text/html';
    }

    if (extension === '.md' && !accept.includes('text/markdown')) {
        filePath = srcDir + '/index.html';
        contentType = 'text/html';
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            console.log(error);
            if(error.code === 'ENOENT'){
                response.writeHead(404);
                response.end(); 
            } else {
                response.writeHead(500);   
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(port, '0.0.0.0');

console.log(`Server running at http://127.0.0.1:${port}/`);
console.log('To stop use: CTRL+C');
