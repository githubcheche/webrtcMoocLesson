'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');

// 需要npm安装express和serve-index
var serveIndex = require('serve-index');
var express = require('express');
var app = express();

//指定发布目录，顺序不能换
app.use(serveIndex('./public'));//浏览目录功能
app.use(express.static('./public'));

var options = {
	key  : fs.readFileSync('./cert/key.pem'),
	cert : fs.readFileSync('./cert/cert.pem') 
}

var http_server = http.createServer(app);
http_server.listen(80, '0.0.0.0');

var https_server = https.createServer(options, app);
https_server.listen(443, '0.0.0.0');
