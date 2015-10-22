'use strict';

var http = require('http'),
    util = require('util'),
    fs = require('fs'),
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

// DELIVERY REQUEST FORM
var req_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        from: {
            from_name: fields.string({ required: true, label: 'From - Location' }),
            from_lat: fields.number({ required: true, label: 'Latitude',validators: [validators.latlong()] }),
            from_long: fields.number({ required: true, label: 'Longitude',validators: [validators.latlong()] }),
            from_description: fields.string({ required: false, label: 'Description' })
        },
        to: {
            to_name: fields.string({ required: true, label: 'To - Location' }),
            to_lat: fields.number({ required: true, label: 'Latitude', validators: [validators.latlong()] }),
            to_long: fields.number({ required: true, label: 'Longitude',validators: [validators.latlong()] }),
            to_description: fields.string({ required: false, label: 'Description' })
        },
        recepient: {
            recepient_name: fields.string({ required: true, label: 'Name' }),
            recepient_phone: fields.tel({ required: true, label: 'Phone',validators: [validators.number()] }),
            recepient_email: fields.email({ required: true, label: 'Email Address' })
        },
        delivery_details: {
            pick_up_date: fields.date({ 
                required: true,
                widget: widgets.date(),
                label: 'Pick up date'
            }),
            collect_payment: {
                status: fields['boolean']({label: 'Collect Payment Status'}),
                pay_method: fields.number({ required: true, label: 'Pay Method',validators: [validators.number()] }),
                amount: fields.number({ required: true, label: 'Amount' })
            },
            return: fields['boolean']({label: 'Return?'}),
            note: fields.string({ required: false, label: 'Note' }),
            note_status: fields['boolean']({label: 'Note Satus?'}),
            request_type: fields.string({ required: true, label: 'Request Type' })
        }
        
    }

},{validatePastFirstError: true});



//COMPLETE DELIVERY FORM
var complete_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        order_no: fields.string({ required: true, label: 'Order Number',validators: [validators.alphanumeric()] }),
        delivery_details: {
            pick_up_date: fields.date({ 
                required: true,
                widget: widgets.date(),
                label: 'Pick up date'
            }),
            collect_payment: {
                status: fields['boolean']({label: 'Collect Payment Status'}),
                pay_method: fields.number({ required: true, label: 'Pay Method',validators: [validators.number()] }),
                amount: fields.number({ required: true, label: 'Amount' })
            },
            return: fields['boolean']({label: 'Return?'}),
            note: fields.string({ required: false, label: 'Note' }),
            note_status: fields['boolean']({label: 'Note Satus?'})
        }
        
    }

},{validatePastFirstError: true});



//TRACK DELIVERY FORM
var track_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        order_no: fields.string({ required: true, label: 'Order Number',validators: [validators.alphanumeric()] })
    }

},{validatePastFirstError: true});



//CANCEL DELIVERY FORM
var cancel_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        order_no: fields.string({ required: true, label: 'Order Number',validators: [validators.alphanumeric()] })
    }

},{validatePastFirstError: true});



//RIDER AVAILABILITY FORM
var rider_form = forms.create({
    command: fields.string({ required: true, label: 'Command' }),
    data: {
        api_key: fields.string({ required: true, label: 'API Key' }),
        api_username: fields.string({ required: true, label: 'API Username' }),
        lat: fields.number({ required: true, label: 'Latitude', validators: [validators.latlong()] }),
        long: fields.number({ required: true, label: 'Longitude',validators: [validators.latlong()] })
    }

},{validatePastFirstError: true});


//THE NODE SERVER
http.createServer(function (req, res) {

    //ROUTING FOR FORM REQUESTS
    if (req.method.toLowerCase() == 'get') {

        if(req.url == '/?cmd=request') {
           res.writeHead(200, { 'Content-Type': 'text/html' });
           res.end(template.expand({
               form: req_form.toHTML(),
               enctype: '',
               method: 'POST'
           }));

        }else if(req.url == '/?cmd=complete') {
           res.writeHead(200, { 'Content-Type': 'text/html' });
           res.end(template.expand({
               form: complete_form.toHTML(),
               enctype: '',
               method: 'POST'
           }));

        }else if(req.url == '/?cmd=cancel') {
           res.writeHead(200, { 'Content-Type': 'text/html' });
           res.end(template.expand({
               form: cancel_form.toHTML(),
               enctype: '',
               method: 'POST'
           }));

        }else if(req.url == '/?cmd=rider') {
           res.writeHead(200, { 'Content-Type': 'text/html' });
           res.end(template.expand({
               form: rider_form.toHTML(),
               enctype: '',
               method: 'POST'
           }));

        }else if(req.url == '/?cmd=track') {
           res.writeHead(200, { 'Content-Type': 'text/html' });
           res.end(template.expand({
               form: track_form.toHTML(),
               enctype: '',
               method: 'POST'
           }));

        }else(res.end("<h1>Wrong GET URL</h1>") );

    } //ENDS GET REQUESTS ROUTING
    
    // ROUTING FOR POST REQUESTS
    else if (req.method.toLowerCase() == 'post') {
       
        if(req.url == '/?cmd=request') {
           viewRequest(req, res);
        }else if(req.url == '/?cmd=complete') {
            viewComplete(req, res);
        }else if(req.url == '/?cmd=cancel') {
            viewCancel(req, res);
        }else if(req.url == '/?cmd=rider') {
            viewRider(req, res);
        }else if(req.url == '/?cmd=track') {
            viewTrack(req, res);
        }else(res.end("<h1>Wrong pst URL</h1>") );

    }//ends if POST

}).listen(8080);


// THE VIEWS FOR POST REQUESTS.

function viewRequest(req, res) {

  req_form.handle(req, {
      success: function (form) {
          request({ 
                    method: 'POST'
                  , uri: 'https://developer.sendyit.com/v1/api/#request'
                  , json: true
                  , headers: {
                      "content-type": "application/json",
                    }
                  , body: form.data 
                  }
                , function (error, response, body) {
                     if (!error) {
                           res.writeHead(200, { 'Content-Type': 'text/html' });
                           res.end('<span>Response = '+JSON.stringify(body, null, 2)+'</span>  \n\n');
                     }else{
                          res.writeHead(500, { 'Content-Type': 'text/html' });
                          res.write('<h3> Error = '+JSON.stringify(error)+'</h3> \n\n'+JSON.stringify(form.data));
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
      error: function (form) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(template.expand({
              form: form.toHTML(),
              enctype: '',
              method: 'POST'
          }));
      } ,
      // there was no form data in the request
      empty: function (form) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(template.expand({
              form: form.toHTML(),
              enctype: '',
              method: 'POST'
          }));
      }

  });
};


function viewComplete(req, res) {
  complete_form.handle(req, {
      success: function (form) {
          request({ 
                    method: 'POST'
                  , uri: 'https://developer.sendyit.com/v1/api/#complete'
                  , json: true
                  , headers: {
                      "content-type": "application/json",
                    }
                  , body: form.data 
                  }
                , function (error, response, body) {
                     if (!error) {
                           res.writeHead(200, { 'Content-Type': 'text/html' });
                           res.end('<span>Response = '+JSON.stringify(body, null, 2)+'</span>  \n\n');
                     }else{
                          res.writeHead(500, { 'Content-Type': 'text/html' });
                          res.write('<h3> Error = '+JSON.stringify(error)+'</h3> \n\n'+JSON.stringify(form.data));
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
}


function viewCancel(req, res) {    
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
                           res.end('<span>Response = '+JSON.stringify(body, null, 2)+'</span>  \n\n');
                     }else{
                          res.writeHead(500, { 'Content-Type': 'text/html' });
                          res.write('<h3> Error = '+JSON.stringify(error)+'<h3> response = '+JSON.stringify(response)+'</h3> \n\n'+JSON.stringify(form.data));
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
}
    

function viewTrack(req, res) {
  track_form.handle(req, {
      success: function (form) {
          request({ 
                    method: 'POST'
                  , uri: 'https://developer.sendyit.com/v1/api/#track'
                  , json: true
                  , headers: {
                      "content-type": "application/json",
                    }
                  , body: form.data 
                  }
                , function (error, response, body) {
                     if (!error) {
                           res.writeHead(200, { 'Content-Type': 'text/html' });
                           res.end('<span>Response = '+JSON.stringify(body, null, 2)+'</span>  \n\n');
                     }else{
                          res.writeHead(500, { 'Content-Type': 'text/html' });
                          res.write('<h3> Error = '+JSON.stringify(error)+'</h3> \n\n'+JSON.stringify(form.data));
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
}



function viewRider(req, res) {
  rider_form.handle(req, {
      success: function (form) {
          request({ 
                    method: 'POST'
                  , uri: 'https://developer.sendyit.com/v1/api/#rider'
                  , json: true
                  , headers: {
                      "content-type": "application/json",
                    }
                  , body: form.data 
                  }
                , function (error, response, body) {
                     if (!error) {
                           res.writeHead(200, { 'Content-Type': 'text/html' });
                           res.end('<span>Response = '+JSON.stringify(body, null, 2)+'</span>  \n\n');
                     }else{
                          res.writeHead(500, { 'Content-Type': 'text/html' });
                          res.write('<h3> Error = '+JSON.stringify(error)+'</h3> \n\n'+JSON.stringify(form.data));
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
}

console.log('Server running at http://127.0.0.1:8080/');