Ext.namespace("Ext.oa");

Ext.oa.MenuTree = Ext.extend(Ext.tree.TreePanel, {
  title: 'openATTIC',
  border: false,
  rootVisible: false,
  region: 'west',
  useArrows: true,
  autoScroll: true,
  animate: true,
  enableDD: false,
  containerScroll: true,
  border: false,
  split: true,
  width: 200,
  minSize: 175,
  maxSize: 400,
  root: {
    text: 'root',
    children: [
      {
        id: 'menu_status',
        text: 'Status',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/emblems/emblem-web.png',
        children: [
          {
            text: 'Disk Usage',
            leaf: true,
            icon: '/filer/static/icons2/22x22/apps/disk_use.png'
          },
          {text: 'Service State',  leaf: true}
        ],
      }, {
        id: 'menu_storage',
        text: 'Storage',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/devices/gnome-dev-harddisk.png',
        children: [],
      }, {
        id: 'menu_shares',
        text: 'Shares',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/places/gnome-fs-share.png',
        children: [ {
            text: 'iSCSI',
            children: [
              {text: 'Target List',    leaf: true},
              {text: 'Initiator List', leaf: true}
            ]
          }, {
            text: 'FC',
            icon: '/filer/static/icons2/22x22/apps/fibre_channel.png',
            children: [{text: 'FC Targets', leaf: true}]
          }, {
            text: 'AFP',
            children: [{text: 'AFP Shares', leaf: true}]
          } ]
      }, {
        id: 'menu_applications',
        text: 'Applications',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/mimetypes/application-certificate.png',
        children: [
          {text: 'DDNS',       leaf: true},
          {
            text: 'SSH/Telnet', leaf: true,
            icon: '/filer/static/icons2/22x22/apps/gnome-terminal.png'
          }],
      }, {
        id: 'menu_services',
        text: 'Services',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/mimetypes/gnome-mime-application-x-killustrator.png',
        children: [
          {text: 'DRBD',        leaf: true},
          {text: 'rSync',       leaf: true},
          {text: 'Snapmanager', leaf: true},
          {text: 'VTL',         leaf: true},
          {text: 'Revisioning', leaf: true},
          {text: 'Backup',      leaf: true}
        ]
      }, {
        id: 'menu_system',
        text: 'System',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: '/filer/static/icons2/22x22/mimetypes/application-x-executable.png',
        children: [ 
          {
            text: 'Network',
            icon: '/filer/static/icons2/22x22/places/gnome-fs-network.png',
            children: [ {
                text: 'General',
                leaf: true,
                icon: '/filer/static/icons2/22x22/apps/network.png'
              }, {
                text: 'Bonding',          leaf: true
              }, {
                text: 'Proxy',            leaf: true,
                icon: '/filer/static/icons2/22x22/apps/preferences-system-network-proxy.png'  
              }, {
                text: 'Domain',
                icon: '/filer/static/icons2/128x128/apps/domain.png',
                children: [
                  {text: 'Active Directory',  leaf: true},
                  {text: 'LDAP',   leaf: true}
                ]
            } ]
          }, {
            text: 'User Management',  leaf: true,
            icon: '/filer/static/icons2/22x22/apps/config-users.png'
          }, {
            text: 'Date/Time',
            leaf: true,
            icon: '/filer/static/icons2/22x22/apps/date_time.png'
          }, {
            text: 'E-Mail',           leaf: true,
            icon: '/filer/static/icons2/22x22/apps/email.png'
          },
          {text: 'openITCockpit',    leaf: true},
          {text: 'openQRM',          leaf: true},
          {text: 'WebSSH',           leaf: true},
          {
            text: 'Online Update',
            leaf: true,
            icon: '/filer/static/icons2/22x22/apps/update.png'
          }, {
            text: 'Shutdown/Reboot',  leaf: true,
            icon: '/filer/static/icons2/22x22/actions/system-log-out.png'
          }
        ]
      }
    ]
  },
  fbar: [ 'Auto-expand root nodes', {
    xtype: "checkbox",
    checked: Ext.state.Manager.get("expand_root_nodes", false),
    listeners: {
      check: function( self, checked ){
        Ext.state.Manager.set("expand_root_nodes", checked);
      }
    },
  }]
});


// kate: space-indent on; indent-width 2; replace-tabs on;
