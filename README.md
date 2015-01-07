cuipp-remote-controller
=======================


**cuipp-remote-controller** is a *express.js* -based web application which can remotely control a *Cisco Unified IP Phone*. It does so by issuing commands through *node-cuipp* whenever the user requests a key push via the web interface.


This is unfinished but useable: this can now query *one* "publisher" server for the RIS database (through SSH, as SOAP will return only the first 1000 devices in that publisher), display them, query their online status, and allow for remote controlling them (given there is an administrative user/password set up on all the phones).

Scraping the SSH output hasn't been throughoutly tested and might timeout or crash.

The remote control interface is very basic and doesn't (yet) implement different UIs for different phone models.


Legalese
------------

*cuipp-remote-controller* includes Bootstrap 3.3.1, which is available under a MIT license. Otherwise, check the *LICENSE* file.

*cuipp-remote-controller* uses jQuery and DataTables, pulling them from a CDN. Be sure to check out www.datatables.net, www.jquery.com and www.getbootstrap.com.

