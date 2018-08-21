var express = require('express');
var fs = require('fs');
var bp = require('body-parser');
var app = express();

// assets folder
app.use('/assets', express.static('assets'));

// requests handling
app.get('/odio',function(req, res){
    res.sendFile(__dirname+"/templates/oditorium.html");
})

// set port listener
app.listen(3009);
