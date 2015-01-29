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
              (template) - use different template uoa
            }

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0
            }

    """

    import os

    # Check host URL prefix and default module/action
    host=ck.cfg.get('wfe_url_prefix','')
    action=i.get('action','')
    muoa=i.get('module_uoa','')

    template=i.get('template','')
    if template=='': template=ck.cfg.get('wfe_template','')

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




    return {'return':0, 'html':h}
