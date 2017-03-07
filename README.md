This repository contains Collective Knowledge extension modules
to browse CK repositories, visualize interactive graphs and articles, 
render CK-based websites, implement simple web services with JSON API 
(for example to crowdsource experiments or unify access to DNN). 

For example, it is used to power the following websites:
* [public CK repository of optimization knowledge](http://cKnowledge.org/repo)
* [cTuning foundation](http://cTuning.org)
* [Artifact evaluation website for computer systems' conferences](http://cTuning.org/ae)

You can reuse above example to build your own websites, JSON web services 
(such as DNN-as-a-service), and [experiment crowd-sourcing web servers](http://cKnowledge.org/repo).

These extensions help users integrate CK artifacts and research workflows
with other frameworks includin Django, Mediawiki, Drupal and Apache.

Prerequisites
=============
[Collective Knowledge Framework](http://github.com/ctuning/ck)

Python Pillow or PIL module to generate QR images:

You may need to install easysetup:
* Linux: wget https://bootstrap.pypa.io/ez_setup.py -O - | python

* https://github.com/python-pillow
or
* http://www.pythonware.com/products/pil/

Authors
=======

* [Grigori Fursin](http://fursin.net/research.html), cTuning foundation (France) / dividiti (UK)

License
=======
* BSD, 3-clause

Installation
============

```
$ ck pull repo:ck-web
```

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

Publications
============

```
@inproceedings{ck-date16,
    title = {{Collective Knowledge}: towards {R\&D} sustainability},
    author = {Fursin, Grigori and Lokhmotov, Anton and Plowman, Ed},
    booktitle = {Proceedings of the Conference on Design, Automation and Test in Europe (DATE'16)},
    year = {2016},
    month = {March},
    url = {https://www.researchgate.net/publication/304010295_Collective_Knowledge_Towards_RD_Sustainability}
}

@inproceedings{Fur2009,
  author =    {Grigori Fursin},
  title =     {{Collective Tuning Initiative}: automating and accelerating development and optimization of computing systems},
  booktitle = {Proceedings of the GCC Developers' Summit},
  year =      {2009},
  month =     {June},
  location =  {Montreal, Canada},
  keys =      {http://www.gccsummit.org/2009}
  url  =      {https://scholar.google.com/citations?view_op=view_citation&hl=en&user=IwcnpkwAAAAJ&cstart=20&citation_for_view=IwcnpkwAAAAJ:8k81kl-MbHgC}
}
```

* http://arxiv.org/abs/1506.06256
* http://hal.inria.fr/hal-01054763
* https://hal.inria.fr/inria-00436029
* http://arxiv.org/abs/1407.4075
* https://scholar.google.com/citations?view_op=view_citation&hl=en&user=IwcnpkwAAAAJ&citation_for_view=IwcnpkwAAAAJ:LkGwnXOMwfcC

Feedback
========

* https://groups.google.com/forum/#!forum/collective-knowledge

![logo](https://github.com/ctuning/ck-guide-images/blob/master/logo-validated-by-the-community-simple.png)
