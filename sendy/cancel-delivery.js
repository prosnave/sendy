'use strict';

var http = require('http'),
    util = require('util'),fs = require('fs'),
    forms = require('forms/lib/forms'),
    jsontemplate = require('./json-template'),
    request = require('request'),
    widgets = require('forms').widgets;


var fields = forms.fields,
    validators = forms.validators;

// TEMPLATE FOR THE FORMS PAGES
var template = jsontemplate.Template(
    fs.readFileSync(__dirname + '/page.jsont').toString()
);

//CANCEL DELIVERY FORM
var cancel_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        order_no: fields.string({ required: true, label: 'Order Number',validators: [validators.alphanumeric()] })
    }

},{validatePastFirstError: true});




http.createServer(function (req, res) {

    cancel_form.handle(req, {
        success: function (form) {
            request({ 
                      method: 'POST'
                    , uri: 'https://developer.sendyit.com/v1/api/#cancel'
                    , json: true
                    , headers: {
                        "content-type": "application/json",
                      }
                    , body: form.data 
                    }
                  , function (error, response, body) {
                       if (!error) {
                             res.writeHead(200, { 'Content-Type': 'text/html' });
                             res.end('<span>Body = '+JSON.stringify(body)+'</span>  \n\n');
                       }else{
                            res.writeHead(500, { 'Content-Type': 'text/html' });
                            res.write('<h1> Error = '+JSON.stringify(error)+'<h1> response = '+JSON.stringify(response)+'</h1> \n\n'+JSON.stringify(form.data));
                            res.end(
                                template.expand({
                                  form: form.toHTML(),
                                  enctype: '',
                                  method: 'POST'
                                })
                            );
                       }
                      
                    }
                  );
        },
        // perhaps also have error and empty events
        other: function (form) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(template.expand({
                form: form.toHTML(),
                enctype: '',
                method: 'POST'
            }));
        }
    });


}).listen(8080);

console.log('Server running at http://127.0.0.1:8080/');