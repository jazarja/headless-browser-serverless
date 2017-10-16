Headless Browser
----------------

Headless browser automation for AWS lambda environment.

Features
--------
    
    1. API (REST POST) call.
    2. Support phantomjs (webkit), and electron (Chromium).
    
Installation
------------
    
    Run serverless deploy
        
        sls deploy -s
        
Test
----
    
    Send POST request to API endpoint (/nightmare or /horseman) , with this payload
    
    	{
      	    "script" : "<JSON escaped script (see sample scripts below)>"
    	}

Sample Scripts
--------------

````
return nightmare
    .goto('https://duckduckgo.com')
    .type('#search_form_input_homepage', 'github nightmare')
    .click('#search_button_homepage')
    .wait('#r1-0 a.result__a')
    .evaluate(function () {
        return document.querySelector('#r1-0 a.result__a').href;
    })
    .end();
````

````
return horseman
    .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
    .open('https://www.detik.com')
    .html()
    .log() 
    .close();
````


References
----------

    * https://github.com/dimkir/nightmare-lambda-tutorial
    