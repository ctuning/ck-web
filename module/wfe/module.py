#
# Collective Knowledge (CK web front-end)
#
# See CK LICENSE.txt for licensing details
# See CK Copyright.txt for copyright details
#
# Developer: cTuning foundation
#

cfg={}  # Will be updated by CK (meta description of this module)
work={} # Will be updated by CK (temporal data)
ck=None # Will be updated by CK (initialized CK kernel) 

# Local settings

##############################################################################
# Initialize module

def init(i):
    """

    Input:  {}

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0
            }

    """
    return {'return':0}

##############################################################################
# index

def index(i):
    """

    Input:  {
              (template)       - use different template uoa
              (cid)            - direct CID
              (search)         - search string
              (search_by_tags) - search by tags (separated by commma)
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0
            }

    """

    import os

    form_name='ck_top_form'
    onchange='document.'+form_name+'.submit();'

    fdata_name='ck_top_data'
    fmodule_name='ck_top_module'
    frepo_name='ck_top_repo'

    fsearch_name='ck_top_search'
    fsearch_tag_name='ck_top_search_tag'

    fdate_after_name='ck_top_date_after'
    fdate_before_name='ck_top_date_before'

    fsubmit_name='ck_top_prune'

    flimit_name='ck_limit'
    fmore_button_name='ck_top_more'

    # Check filters
    cid=i.get('wcid','')
    cduoa=''
    cmuoa=''
    cruoa=''

    cs=i.get('search', '').strip()
    if fsearch_name in i: cs=i[fsearch_name]

    cst=i.get('search_by_tags','')
    if fsearch_tag_name in i: cst=i[fsearch_tag_name]

    find_cid=False                                          
    if cs!='' and cs.lower().startswith('cid='):
       find_cid=True
       cid=cs[4:].strip()

    if cid!='':
       r=ck.parse_cid({'cid':cid})
       if r['return']>0: return r
       cduoa=r['data_uoa']
       cmuoa=r['module_uoa']
       cruoa=r.get('repo_uoa','')

    if i.get('wrepo_uoa','')!='':
       cruoa=i['wrepo_uoa']

    if not find_cid and fdata_name in i: cduoa=i[fdata_name]
    if not find_cid and fmodule_name in i: cmuoa=i[fmodule_name]
    if not find_cid and frepo_name in i: cruoa=i[frepo_name]

    cid=''
    cidx=''
    if cruoa!='' or cmuoa!='' or cduoa!='':
       if cduoa!='': cid=cduoa
       cid=':'+cid
       if cmuoa!='': cid=cmuoa+cid
       cid=':'+cid
       cidx=cid
       if cruoa!='': cid=cruoa+cid

    # Check host URL prefix and default module/action
    url0=ck.cfg.get('wfe_url_prefix','')
    url=url0
    action=i.get('action','')
    muoa=i.get('module_uoa','')

    template=i.get('template','')
    if template=='': template=ck.cfg.get('wfe_template','')

    url_template_pull=url+'action=pull&common_func=yes&cid=wfe:'+template+'&filename='

    # Load template
    ii={'action':'load',
        'module_uoa':work['self_module_uoa'],
        'data_uoa':template}
    r=ck.access(ii)
    if r['return']>0: return r
    d=r['dict']
    p=r['path']

    px=os.path.join(p, 'template.html')
    if not os.path.isfile(px):
       return {'return':1, 'error':'template file not found'}
    r=ck.load_text_file({'text_file':px})
    if r['return']>0: return r
    h=r['string']

    # Prepare URL
    url+='action='+action+'&'+'module_uoa='+muoa
    url1=url

    # Check limits
    ln=i.get(flimit_name,'')
    lnstep=15
    if ln=='': 
       ln=i.get('limit','')
    if ln=='':
       ln=str(lnstep)
    if fmore_button_name in i: ln=str(int(ln)+lnstep)
    else: ln=str(lnstep)

    if i.get('nolimit','')=='yes':
       ln=''

    if ln!='': url+='&limit='+ln

    # Check dates
    datea=i.get('search_by_date_after','')
    dateb=i.get('search_by_date_before','')
    if fdate_after_name in i: datea=i[fdate_after_name]
    if fdate_before_name in i: dateb=i[fdate_before_name]

    # If viewing a given entry
    view_entry=False
    if cmuoa!='' and cduoa!='' and \
       cmuoa.find('*')<0 and cmuoa.find('?')<0 and \
       cduoa.find('*')<0 and cduoa.find('?')<0:
       view_entry=True

    # Prepare query div
    ht=''
    if view_entry:
       ht='<script>\n'
       ht+=' function goBack() {window.history.back()}\n'
       ht+='</script>\n'
       ht+='\n'
#       ht+='<div id="ck_go_back">\n'
#       ht+=' <button onclick="goBack()">Go Back</button>\n'
#       ht+='</div>\n'

    else:
        # Start form + URL
       ii={'url':url1, 'name':form_name}
       r=start_form(ii)
       if r['return']>0: return r
       hf=r['html']

       # Get list of repos
       r=ck.access({'action':'list',
                    'module_uoa':ck.cfg["repo_name"],
                    'add_info':'yes',
                    'add_meta':'yes'})
       if r['return']>0: return r
       lm=r['lst']

       r=convert_ck_list_to_select_data({'lst':lm, 'add_empty':'yes', 'sort':'yes', 'value_uoa':cruoa, 'ignore_remote':'yes'})
       if r['return']>0: return r
       dlm=r['data']
       if r.get('value_uid','')!='': cruoa=r['value_uid']

       ii={'data':dlm, 'name':frepo_name, 'onchange':onchange, 'style':'width:300px;'}
       if cruoa!='': ii['selected_value']=cruoa
       r=create_selector(ii)
       if r['return']>0: return r
       hlr=r['html']

       # Get list of modules
       r=ck.access({'action':'list',
                    'module_uoa':ck.cfg["module_name"],
                    'add_info':'yes'})
       if r['return']>0: return r
       lm=r['lst']

       r=convert_ck_list_to_select_data({'lst':lm, 'add_empty':'yes', 'sort':'yes', 'value_uoa':cmuoa})
       if r['return']>0: return r
       dlm=r['data']
       if r.get('value_uid','')!='': cmuoa=r['value_uid']

       ii={'data':dlm, 'name':fmodule_name, 'onchange':onchange, 'style':'width:300px;'}
       if cmuoa!='': ii['selected_value']=cmuoa
       r=create_selector(ii)
       if r['return']>0: return r
       hlm=r['html']

       # Prepare general search
       r=create_input({'size':'25', 'name': fsearch_name, 'value':cs})
       if r['return']>0: return r
       hs1=r['html']

       # Prepare search by tags
       r=create_input({'size':'25', 'name': fsearch_tag_name, 'value':cst})
       if r['return']>0: return r
       hs2=r['html']

       # Prepare date after
       r=create_input({'size':'25', 'name': fdate_after_name, 'value':datea})
       if r['return']>0: return r
       hda=r['html']

       # Prepare date after
       r=create_input({'size':'25', 'name': fdate_before_name, 'value':dateb})
       if r['return']>0: return r
       hdb=r['html']

       # Prepare reset
       hreset='<a href="'+url1+'">[Reset form]</a>'

       # Prepare submit
       r=create_button({'name': fsubmit_name, 'value':'Prune'})
       if r['return']>0: return r
       hsubmit=r['html']

       # Prepare top
       ht=hf
       ht+='<div id="ck_prune">\n'
       ht+='<small><b>Prune entries by:</b></small><br>\n'

       ht+='<center>\n'
       ht+='<table border="0" cellpadding="5">\n'
       ht+=' <tr>\n'
       ht+='  <td align="right">Module/class:</td>\n'
       ht+='  <td>'+hlm+'</td>\n'
       ht+='  <td align="right">String:</td>\n'
       ht+='  <td>'+hs1+'</td>\n'
       ht+='  <td align="right">After date (ISO):</td>\n'
       ht+='  <td>'+hda+'</td>\n'
       ht+=' </tr>\n'
       ht+=' <tr>\n'
       ht+='  <td align="right">Repository:</td>\n'
       ht+='  <td>'+hlr+'</td>\n'
       ht+='  <td align="right">Tags:</td>\n'
       ht+='  <td>'+hs2+'</td>\n'
       ht+='  <td align="right">Before date (ISO):</td>\n'
       ht+='  <td>'+hdb+'</td>\n'
       ht+=' </tr>\n'
       ht+='</table>\n'
       ht+='</center>\n'
       ht+=hreset+'&nbsp;'+hsubmit+'\n'

       if ck.cfg.get('use_indexing','')=='no':
          ht+='<br><br><b><i><small>Warning: Elastic Search indexing is off - search by string/tags/date can be slow ...</small></i></b><br>'

       ht+='</div>\n'

    # Create pruned list 
    ii={'action':'search',
        'repo_uoa':cruoa,
        'module_uoa':cmuoa,
        'data_uoa':cduoa,
        'add_info':'yes',
        'ignore_case':'yes',
        'limit_size':ln}
    if cs!='' and not find_cid:
       ii['search_string']=cs
    if cst!='' and not find_cid:
       ii['tags']=cst
    if datea!='':
       ii['add_if_date_after']=datea
    if dateb!='':
       ii['add_if_date_before']=dateb

    r=ck.access(ii)
    if r['return']>0: return r

    lst=r['lst']

    show_more=False

    if len(lst)==0:
       ########################################### No entries #############
       hp='<div id="ck_entries">\n'
       hp+='No entries found!'
       hp+='</div>\n'

    elif len(lst)==1:
       ########################################### Entry viewer #############
       import json

       q=lst[0]

       hp=''

       ruoa=q['repo_uoa']
       muoa=q['module_uoa']

       muid=q['module_uid']
       ruid=q['repo_uid']

       duoa=q['data_uoa']
       duid=q['data_uid']

       # Load for full info
       rx=ck.access({'action':'load', 'repo_uoa':ruid, 'module_uoa':muid, 'data_uoa':duid})
       if rx['return']>0: return rx
       dd=rx['dict']
       pp=rx['path']

       info=q.get('info',{})
       control=info.get('control',{})

       author=control.get('author','')
       author_wp=control.get('author_webpage','')
       iso_datetime=control.get('iso_datetime','')

       desc=info.get('description','')

       au=''
       if author!='': au=author
       if author_wp!='': au='<a href="'+author_wp+'" target="_blank">'+au+'</a>'

       if iso_datetime!='':
          iso_datetime=iso_datetime.replace('T',' ')
          ix=iso_datetime.find('.')
          if ix>0: iso_datetime=iso_datetime[:ix]

       dn=info.get('data_name','')
       if dn=='': dn=duoa

       xcid=muid+':'+duid
       url2=url1+'&wcid='+xcid

       url3=url0+'&action=pull&common_func=yes&archive=yes&all=yes&cid='+xcid
       url4=url0+'&action=load&out=json&cid='+xcid

       url5=ck.cfg.get('wiki_data_web','')
       if url5!='':
          url5+='_'+muid+'_'+duid

       urlself1=url0+'wcid='+xcid
#       urlself=url0+'action=index%26module_uoa=wfe%26wcid='+xcid
       urlself=url0+'wcid='+xcid


       url6=url0+'action=generate&module_uoa=qr-code&qr_level=6&image_size=170&string='+urlself

       hp+='<div id="ck_entries">\n'

       hp+=' <table border="0">\n'

       hp+='  <tr colspan="2">\n'
       hp+='   <td valign="top">\n'
       hp+='    <img src="'+url6+'">\n'

       # Check if share
       ps=os.path.join(p, 'share.html')
       if os.path.isfile(ps):
          r=ck.load_text_file({'text_file':ps})
          if r['return']>0: return r
          htx=r['string'].replace('$#url#$',url2)
          hp+=htx+'\n'

       hp+='   </td>\n'
       hp+='   <td valign="top">\n'


       hp+='<span id="ck_entries1a">'+dn+'</span><br>\n'
       hp+=' <hr class="ck_hr">\n'

       hp+='<div id="ck_entries_space4"></div>\n'
       if au!='':
          hp+='<span id="ck_entries2"><b>Added by:</b> <i>'+au+'</i></span><br>\n'
       hp+='<span id="ck_entries2"><b>Date:</b> <i>'+iso_datetime+'</i></span><br>\n'

       hp+='<div id="ck_entries_space4"></div>\n'

       hp+='<span id="ck_entries2"><b>Module:</b> <i>'+muoa+'</i></span><br>\n'
       hp+='<span id="ck_entries2"><b>Repo:</b> <i>'+ruoa+'</i></span><br>\n'

       hp+='<div id="ck_entries_space4"></div>\n'
       hp+='<span id="ck_entries2"><b>CID:</b> <i><a href="'+urlself1+'">'+xcid+'</a></i></span><br>\n'

       if desc!='':
          hp+='<div id="ck_entries_space8"></div>\n'
          hp+='<span id="ck_entries3">'+desc+'</span><br>\n'


       hp+='<div id="ck_entries_space4"></div>\n'

       hp+='   </td>\n'
       hp+='  </tr>\n'

       hp+=' </table>\n'

       # Show tags
       tags=dd.get('tags', [])
       if len(tags)>0:
          stags=''
          for q in tags:
              if stags!='': stags+=','
              stags+=q

          hp+='<b>Tags:</b> <i>'+stags+'</i>\n'

       hp+='<div id="ck_downloads">\n'
       if url5!='': hp+='<a href="'+url5+'" target="_blank">[Discuss (wiki)]</a>&nbsp;\n'
       hp+='<a href="'+url3+'">[Download entry as archive]</a>\n'
       hp+='</div>\n'

       # Check files
       rx=ck.list_all_files({'path':pp, 'limit':100})
       if rx['return']==0:
          ll=sorted(rx['list'])
          if len(ll)>0:
             utp=url0+'action=pull&common_func=yes&cid='+xcid+'&filename='

             hp+='<hr class="ck_hr">\n'
             hp+='<span id="ck_text51"><b>Files:</b></span>\n'
             hp+='<div id="ck_entries_space4"></div>\n'

             hp+='<div id="ck_text55">\n'
             for q in ll:
                 hp+='<a href="'+utp+q+'">'+q+'</a><br>\n'
             hp+='</div>\n'

             hp+='<div id="ck_downloads">\n'
             hp+='<a href="'+url3+'">[Download archive]</a>\n'
             hp+='</div>\n'

       # Show dependencies
       hp+=' <hr class="ck_hr">\n'

       hp+=' <span id="ck_text51"><b>Cross-linking (dependencies):</b></span>\n'
       hp+='<div id="ck_entries_space4"></div>\n'

       hp+='<div id="ck_text55">\n'
       hp+='</div>\n'

       # Show meta
       hp+=' <hr class="ck_hr">\n'

       hp+=' <span id="ck_text51"><b>Meta:</b></span>\n'
       hp+='<div id="ck_entries_space4"></div>\n'

       hp+='<div id="ck_text55">\n'
       hp+='<pre>\n'
       rx=ck.dumps_json({'dict':dd, 'sort_keys':'yes'})
       if rx['return']>0: return rx
       hp+=rx['string']
       hp+='</pre>\n'
       hp+='</div>\n'

       hp+='<div id="ck_downloads">\n'
       hp+='<a href="'+url4+'" target="_blank">[Download meta]</a>&nbsp;\n'
       hp+='</div>\n'

       # Check if report
       ps=os.path.join(p, 'report.html')
       if os.path.isfile(ps):
          r=ck.load_text_file({'text_file':ps})
          if r['return']>0: return r
          hp+=' <hr class="ck_hr">\n'
          htx=r['string'].replace('$#cid#$',url2)
          hp+=htx+'\n'

       hp+='</div>\n'

    else:
       ######################################## View multiple entries ###############
       show_more=True
       lst1=sorted(lst, key=lambda k: k.get('info',{}).get('data_name','').lower())

       hp=''
       iq=0
       for q in lst1:
           iq+=1
           siq=str(iq)

           ruoa=q['repo_uoa']
           muoa=q['module_uoa']

           muid=q['module_uid']
           ruid=q['repo_uid']
 
           duoa=q['data_uoa']
           duid=q['data_uid']

           info=q.get('info',{})
           control=info.get('control',{})

           author=control.get('author','')
           author_wp=control.get('author_webpage','')
           iso_datetime=control.get('iso_datetime','')

           desc=info.get('description','')

           au=''
           if author!='': au=author
           if author_wp!='': au='<a href="'+author_wp+'" target="_blank">'+au+'</a>'

           if iso_datetime!='':
              if au!='': au+=', '
              x=iso_datetime.replace('T',' ')
              ix=x.find('.')
              if ix>0: x=x[:ix]
              au+=x

           if au!='':
              au+=', '
           au+='Repo: '+ruoa

           dn=info.get('data_name','')
           if dn=='': dn=duoa

           xcid=muid+':'+duid
           url2=url0+'wcid='+xcid

           url3=url0+'&action=pull&common_func=yes&archive=yes&all=yes&cid='+xcid
           url4=url0+'&action=load&out=json&cid='+xcid

           url5=ck.cfg.get('wiki_data_web','')
           if url5!='':
              url5+='_'+muid+'_'+duid

           hp+='<div id="ck_entries">\n'

           hp+='<small>'+str(iq)+') </small><span id="ck_entries1"><a href="'+url2+'">'+dn+' ('+muoa+')</a></span><br>\n'
           if au!='':
              hp+='<div id="ck_entries_space4"></div>\n'
              hp+='<span id="ck_entries2"><i>'+au+'</i></span><br>\n'

           if desc!='':
              hp+='<div id="ck_entries_space8"></div>\n'
              hp+='<span id="ck_entries3">'+desc+'</span><br>\n'


           hp+='<div id="ck_entries_space4"></div>\n'
           hp+='<div id="ck_downloads">\n'
           hp+='<a href="'+url4+'" target="_blank">[View meta]</a>&nbsp;\n'
           if url5!='': hp+='<a href="'+url5+'" target="_blank">[Discuss (wiki)]</a>&nbsp;\n'
           hp+='<a href="'+url3+'">[Download entry]</a>\n'
           hp+='</div>\n'

           hp+='</div>\n'

    # Replace top if needed
    h=h.replace('$#template_top#$',ht)

    # Prepare middle
    if view_entry:
       hp+='<div id="ck_go_back">\n'
       hp+=' <button onclick="goBack()">Go Back</button>\n'
       hp+='</div>\n'

    h=h.replace('$#template_middle#$',hp)

    # Show more
    r=create_input({'type':'hidden', 'name': flimit_name, 'value':ln})
    if r['return']>0: return r
    hm=r['html']+'\n'

    # Prepare submit
    if show_more:
       r=create_button({'name': fmore_button_name, 'value':'Show more entries'})
       if r['return']>0: return r
       hm+=r['html']+'<br>\n'

    hm+='</form>\n'

    h=h.replace('$#template_middle_finish#$', hm)

    # Check if visits
    px=os.path.join(p, 'visits.html')
    htx=''
    if os.path.isfile(px):
       r=ck.load_text_file({'text_file':px})
       if r['return']>0: return r
       htx=r['string']
    h=h.replace('$#template_end#$',htx)

    # Substitute specials
    h=h.replace('$#title#$', 'CK Browser')
    h=h.replace('$#ck_url_template_pull#$', url_template_pull)

    return {'return':0, 'html':h}

##############################################################################
# create HTML selector

def create_selector(i):
    """
    Input:  {
              (class)          - if !='', add this class
              (name)           - if !='', add this name
              (onchange)       - if !='', add this onchange function
              (style)          - if !='', use this style

              (data)           - [{'name':name, 'value': uid}, ...]
              (selected_value) - if !='', select this item
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0

              html         - returned generated HTML
            }

    """

    # Prepare header
    h='<select'
    
    cl=i.get('class','')
    if cl!='':
       h+=' class="'+cl+'"'

    nm=i.get('name','')
    if nm!='':
       h+=' name="'+nm+'"'

    oc=i.get('onchange','')
    if oc!='':
       h+=' onchange="'+oc+'"'

    hs=i.get('style','')
    if hs!='':
       h+=' style="'+hs+'"'

    h+='>\n'

    # Prepare 
    d=i['data']

    sv=i.get('selected_value','')

    for q in d:
        n=q['name']
        v=q['value']

        h+='<option value="'+v+'"'
        if sv!='' and sv==v:
           h+=' SELECTED'
        h+='>'+n+'</option>'

    # Finish
    h+='</select>\n'

    return {'return':0, 'html':h}

##############################################################################
# 

def convert_ck_list_to_select_data(i):
    """
    Input:  {
              lst             - CK list object
              (add_empty)     - if 'yes', add empty line
              (sort)          - if 'yes', sort by name
              (value_uoa)     - if !='', find uoa and return uid
              (ignore_remote) - if 'yes', ignore if meta has 'remote':'yes' 
                                   (to avoid remote repositories)
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0

              data         - data list in selector format
              (value_uid)  - if value_uoa  is set, find UID of the entry
            }

    """

    dat=[]

    if i.get('add_empty','')=='yes':
       dat.append({'name':'', 'value':''})

    lst=i['lst']

    vuoa=i.get('value_uoa','')
    vuid=''

    ir=i.get('ignore_remote','')

    for q in lst:
        duoa=q['data_uoa']
        duid=q['data_uid']

        skip=False
        if ir=='yes':
           meta=q.get('meta',{})
           if meta.get('remote','')=='yes':
              skip=True

        if not skip:
           dn=q.get('info',{}).get('data_name','')
           if dn=='': dn=duoa

           if vuoa!='' and vuoa==duoa:
              vuid=duid

           dat.append({'name':dn, 'value':duid}) 

    if i.get('sort','')=='yes':
       dat=sorted(dat, key=lambda k: k['name'].lower())

    return {'return':0, 'data':dat, 'value_uid':vuid}

##############################################################################
# start form

def start_form(i):
    """
    Input:  {
              (url) - url
              (name) - name
              (method) - 'POST' by default
              (enctype) - 'multipart/form-data' by default
              (charset) - 'utf-8' by default
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0

              html         - html for the form
            }

    """

    h='<form action="'

    url=i.get('url','')
    if url!='':
       h+=url
    h+='"'

    name=i.get('name','')
    if name!='':
       h+=' name="'+name+'"'

    method=i.get('method','')
    if method=='': method='post'
    h+=' method="'+method+'"'

    enctype=i.get('enctype','')
    if enctype=='': enctype='multipart/form-data'
    h+=' enctype="'+enctype+'"'

    charset=i.get('charset','')
    if charset=='': charset='utf-8'
    h+=' accept-charset="'+charset+'"'

    h+='>\n'

    return {'return':0, 'html':h}

##############################################################################
# create search

def create_input(i):
    """
    Input:  {
              (type)       - if '', set 'text'
              (size)       - size, 50 by default
              (spellcheck) - if !='yes', skip 
              (name)       - name
              (value)      - default value
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0

              html         - html for the form
            }

    """

    tp=i.get('type','')
    if tp=='': tp='text'

    h='<input type="'+tp+'"'

    sz=i.get('size','')
    if sz=='': sz='50'
    h+=' size="'+sz+'"'
       
    sp=i.get('spellcheck','')
    if sp!='yes':
       h+=' spellcheck="false"'

    name=i.get('name','')
    if name!='':
       h+=' name="'+name+'"'

    value=i.get('value','')
    if value!='':
       h+=' value="'+value+'"'

    h+='>\n' 

    return {'return':0, 'html':h}

##############################################################################
# create submit button

def create_button(i):
    """
    Input:  {
              (type)       - if '', use 'submit'
              (name)       - name
              (value)      - default value
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0

              html         - html for the form
            }

    """



    tp=i.get('type','')
    if tp=='': tp='submit'

    h='<input type="'+tp+'"'
    
    name=i.get('name','')
    if name!='':
       h+=' name="'+name+'"'

    value=i.get('value','')
    if value!='':
       h+=' value="'+value+'"'

    h+='>'

    return {'return':0, 'html':h}
