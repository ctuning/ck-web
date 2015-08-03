Implementing JSON based web-services in CK
==========================================

CK web front-end. It demonstrates how to implement
various web services (browsing repository, viewing 
entries, enabling intractive graphs and articles, etc).

We expect that users can use third-party web frameworks with CK
such as Django, Mediawiki, Drupal, etc.

Dependencies
============
Python Pillow or PIL module to generate QR images:

You may need to install easysetup:
* Linux: wget https://bootstrap.pypa.io/ez_setup.py -O - | python

* https://github.com/python-pillow
or
* http://www.pythonware.com/products/pil/

Authors
=======

* Grigori Fursin, cTuning foundation (France) / dividiti (UK)

License
=======
* BSD, 3-clause

Installation
============

> ck pull repo:ck-web

Modules with actions
====================

qr-code - generating QR codes

  * generate - generate QR code

wfe - CK web front-end (browsing repository and entries, visualizing experiments, viewing interactive graphs and articles, etc)

  * clean - clean tmp cache of a CK web service
  * convert_ck_list_to_select_data - convert CK list to html to select data
  * create_button - create html button
  * create_input - create html search
  * create_selector - create html universal selector
  * index - browse CK repositories
  * parse_txt - parse text or json files to process, high-light and cross-link special CK words including $#cm_, $#ck_, http ...
  * process_all_pages - process all pages and convert them into static ones (to create static websites)
  * process_ck_page - process special CK words in html pages
  * start_form - start html form
  * view_page - view a given CK page
  * webadd - add/update CK entries via html
