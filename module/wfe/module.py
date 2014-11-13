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

    Input:  {}

    Output: {
              return       - return code =  0, if successful
                                         >  0, if error
              (error)      - error text if return > 0
            }

    """

    h='<B>TBD: CK web front-end</B><BR><BR>'

    r=ck.access({'action':'load',
                 'module_uoa':'test',
                 'data_uoa':'unicode'})
    if r['return']>0: return r

    d=r['dict']

    for q in d['languages']:
        h+=q+'<BR>'

    return {'return':0, 'html':h}
