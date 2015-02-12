// kate: space-indent on; indent-width 2; replace-tabs on;
// vim: tabstop=2 expandtab shiftwidth=2 softtabstop=2

Ext.namespace('Ext.oa');

Ext.define("Ext.oa.WizPanel", {
  alias     : "widget.lvm__snapcore_wizpanel",
  extend    : "Ext.form.FormPanel",
  layout    : 'card',
  border    : false,
  defaults  : {
    bodyStyle : 'padding:5px 5px;',
    border    : false,
    autoScroll: true,
    anchor    : '-20px',
    defaults  : {
      border: false,
      anchor: '-20px'
    }
  },
  pnl_hist: ['lvm__snapcore_wiz_welc'],
  nextpanel: function(nextid){
    if( typeof this.layout.activeItem.getForm === "function" )
    {
      var form = this.layout.activeItem.getForm();
      form.updateRecord(this.config.data);

      var errs = this.config.data.validate();
      if(errs.isValid()){
        this.pnl_hist.push(nextid);
        this.layout.setActiveItem(nextid);
      }
      else{
        errs.each(function(err) {
          form.findField(err.field).markInvalid(err.message);
        });
      }
    }
    else
    {
      this.pnl_hist.push(nextid);
      this.layout.setActiveItem(nextid);
    }
  },
  prevpanel: function(){
    this.pnl_hist.pop();
    this.layout.setActiveItem(this.pnl_hist[this.pnl_hist.length - 1]);
  },
  initComponent: function(){
    for(var i = this.items.length - 1; i >= 0; i--){
      var item = this.items[i];
      if(typeof item.buttons === "undefined"){
        item.buttons = [];
      }
      if(typeof item.noAutoNext === "undefined"){
        item.buttons.unshift({
          text: gettext('Next'),
          handler: Ext.bind(this.nextpanel, this, [this.items[i+1].id])
        });
      }
      if(typeof item.noAutoPrev === "undefined"){
        item.buttons.unshift({
          text: gettext('Previous'),
          handler: Ext.bind(this.prevpanel, this, [this.items[i].id])
        });
      }
    }
    this.callParent(arguments);
  }
});

Ext.define("Ext.oa.LVM__Snapcore_TreePanel", {
  alias     : "widget.lvm__snapcore_treepanel",
  extend    : "Ext.tree.TreePanel",
  initComponent: function(){

    var treestore = Ext.create("Ext.oa.SwitchingTreeStore", {
      fields: ["text"],
      proxy : {type: "memory"},
      root  : {
        text      : "root",
        expanded  : true,
        id        : "snapapp_attr_root_node"
      }
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
     id             : "lvm__snapcore_treepanel",
     rootVisible    : false,
     useArrows      : true,
     autoScroll     : true,
     animate        : true,
     containerScroll: true,
     frame          : true,
     store          : treestore,
     forceFit       : true
    }));

    this.callParent(arguments);

    for(var i=0; i < window.SnapAppPlugins.length; i++){
      var childstore = window.SnapAppPlugins[i].getStore(this);
      treestore.getRootNode().appendChild(childstore.getRootNode());
    }
  }
});

var get_plugin = function(plugin_name){
  var plugin_func;
  for(var i=0; i < window.SnapAppPlugins.length; i++)
  {
    if(window.SnapAppPlugins[i].plugin_name === plugin_name)
    {
      plugin_func = window.SnapAppPlugins[i];
      break;
    }
  }
  return plugin_func;
};

// override the validate method to provide the inputparameter "model"
Ext.override(Ext.data.Model, {
  validate: function() {
    var errors = Ext.create('Ext.data.Errors'),
      validations = this.validations,
      validators = Ext.data.validations,
      length, validation, field, valid, type, i;

    if (validations) {
      length = validations.length;

      for (i = 0; i < length; i++) {
        validation = validations[i];
        field = validation.field || validation.name;
        type = validation.type;
        valid = validators[type](validation, this.get(field), this);

        if (!valid) {
          errors.add({
            field  : field,
            message: validation.message || validators[type + 'Message']
        });
        }
      }
    }
    return errors;
  }
});

var set_time = function(date, time){
  date = new Date(date.setSeconds(time.getSeconds()));
  date = new Date(date.setMinutes(time.getMinutes()));
  date = new Date(date.setHours(time.getHours()));

  return date;
}

var set_date = function(time, date){
  time = new Date(time.setDate(date.getDate()));
  time = new Date(time.setMonth(date.getMonth()));
  time = new Date(time.setFullYear(date.getFullYear()));

  return time;
}

Ext.data.validations.execute_datetime = function(config, value, model){
  if(value){
    var data = model.data;

    if(data["scheduling_select"] === "execute_later")
    {
      var date_time = set_time(data["date_select-inputEl"], data["time_select-inputEl"]);

      if(new Date() > date_time){
        return false;
      }
    }
  }
  return true;
}

Ext.data.validations.end_datetime = function(config, value, model){
  var valid = true;

  if(value){
    var data = model.data;

    if(data["scheduling_select"] === "scheduling")
    {
      var no_enddatetime_value = data["no_enddatetime"]
      var start_date_time = set_time(data["startdate_select-inputEl"], data["starttime_select-inputEl"]);
      var end_date_time = set_time(data["enddate_select-inputEl"], data["endtime_select-inputEl"]);

      var now = new Date();

      if(!no_enddatetime_value)
      {
        if(end_date_time <= now || (start_date_time && start_date_time >= end_date_time))
        {
          return false;
        }
      }
    }
  }
  return true;
}

Ext.define('Ext.oa.LVM__Snapcore_Model', {
  extend: 'Ext.data.Model',
  fields: [
    {name: 'is_active',                 type: 'bool',   defaultValue: true},
    {name: 'configname',                type: 'string'},
    {name: 'day_of_month',              type: 'string'},
    {name: 'prescript',                 type: 'string'},
    {name: 'postscript',                type: 'string'},
    {name: 'retentiontime',             type: 'string'},
    {name: 'retention_time_combo',      type: 'string'},
    {name: 'retention_time',            type: 'int'},
    {name: 'date_select-inputEl',       type: 'date'},
    {name: 'time_select-inputEl',       type: 'time'},
    {name: 'startdate_select-inputEl',  type: 'date'},
    {name: 'starttime_select-inputEl',  type: 'time'},
    {name: 'enddate_select-inputEl',    type: 'date'},
    {name: 'endtime_select-inputEl',    type: 'time'},
    {name: 'no_enddatetime',            type: 'bool'},
    {name: 'doweek',                    type: 'string'},
    {name: 'scheduling_select',         type: 'string'},
    {name: 'executedate',               type: 'string'},
    {name: 'dow_1',                     type: 'int'},
    {name: 'dow_2',                     type: 'int'},
    {name: 'dow_3',                     type: 'int'},
    {name: 'dow_4',                     type: 'int'},
    {name: 'dow_5',                     type: 'int'},
    {name: 'dow_6',                     type: 'int'},
    {name: 'dow_0',                     type: 'int'},
    {name: 'moy_1',                     type: 'int'},
    {name: 'moy_2',                     type: 'int'},
    {name: 'moy_3',                     type: 'int'},
    {name: 'moy_4',                     type: 'int'},
    {name: 'moy_5',                     type: 'int'},
    {name: 'moy_6',                     type: 'int'},
    {name: 'moy_7',                     type: 'int'},
    {name: 'moy_8',                     type: 'int'},
    {name: 'moy_9',                     type: 'int'},
    {name: 'moy_10',                    type: 'int'},
    {name: 'moy_11',                    type: 'int'},
    {name: 'moy_12',                    type: 'int'}
  ],
  validations: [
    {type: 'length',           field: 'configname', min: 5, message: gettext('The configuration-name must be at least 5 characters long.')},
    {type: 'execute_datetime', field: 'date_select-inputEl', message: gettext('The datetime must not be in the past')},
    {type: 'execute_datetime', field: 'time_select-inputEl', message: gettext('The datetime must not be in the past')},
    {type: 'end_datetime',     field: 'enddate_select-inputEl', message: gettext('The enddatetime must not be before the startdatetime')},
    {type: 'end_datetime',     field: 'endtime_select-inputEl', message: gettext('The enddatetime must not be before the startdatetime')}
  ]
});

var config = {
  data: Ext.create("Ext.oa.LVM__Snapcore_Model", {}),
  volumes     : []/*[1, 2, 6, 9]*/,
  plugin_data : {} /*{
    VMware: {
      host: {
        data: {
        },
        children: {
          openattic01: {
            data: {
              consistency: "mit ram"
            },
            children: {
              vm01: {
                data: {
                  consistency: "mit ram"
                },
                children: {}
              },
              vm02: {
                data: {
                  consistency: "ohne ram"
                },
                children: {}
              },
              vm03: {
                data: {
                  consistency: "keine konsistenz (aka kein snap)"
                },
                children: {}
              }
            }
          },
          openattic02: {
            data: null,
            vms: {
              vm02: {
                data: {
                  consistency: "mit ram"
                },
                children: {}
              },
              vm05: {
                data: {
                  consistency: "ohne ram"
                },
                children: {}
              }
            }
          }
        }
      }
    },
    MSSql: {
      yadda
    }
  }*/
};

/*var nextCard = function(item, e){
  if (e.getCharCode() == Ext.EventObject.ENTER) {
    for(var i=0; i < item.ownerCt.buttons.length; i++){
      var btn = item.ownerCt.buttons[i];

      if(btn.id === "nextBtn")
      {
        btn.handler.call(btn.scope);
        break;
      }
    }
  }
}*/

var getConfigForNode = function(node){
  var container = (node.parentNode.isRoot() ? config.plugin_data : getConfigForNode(node.parentNode).children);
  if( typeof container[node.data.objid] === "undefined" ){
    container[node.data.objid] = {
      data: null,
      children: {}
    }
  }
  return container[node.data.objid];
}

var setConfigForNode = function(node, data){
  var img_self, img_parent, img_childs;
  var config = getConfigForNode(node);
  config.data = data;

  if(typeof data === "undefined" || data === null){
    img_self, img_parent, img_childs = "empty";

    if(node.isLeaf()){
      if(getConfigForNode(node.parentNode).data !== null){
        img_self = "gray";
      }
    }
    else
    {
      for(var i=0; i < node.childNodes.length; i++)
      {
        if(getConfigForNode(node.childNodes[i]).data !== null){
          img_self = "gray";
          break;
        }
      }
    }
  }
  else{
    img_self = "green";
    img_parent = img_childs = "gray";
  }

  node.set("iconCls", node.data.csscl[img_self]);

  if(node.isLeaf()){
    if(getConfigForNode(node.parentNode).data === null){
      node.parentNode.set("iconCls", node.parentNode.data.csscl[img_parent]);
    }
  }
  else{
      for(var i=0; i < node.childNodes.length; i++)
      {
        if(getConfigForNode(node.childNodes[i]).data === null){
          node.childNodes[i].set("iconCls", node.childNodes[i].data.csscl[img_childs]);
        }
      }
    }

    return config;
  }

  var nextElement = function(item, e){
    if (e.getCharCode() == Ext.EventObject.ENTER) {
      item.nextSibling().focus();
    }
  }

  Ext.define('snapcore_volume_store_model', {
    extend: 'Ext.data.Model',
    fields:  ["id", "name"]
  });
  var first_volume_grid_store = Ext.create('Ext.data.Store', {
    model: 'snapcore_volume_store_model',
    proxy: {
      extraParams: {
        kwds: {
          'snapshot__isnull': true
        }
      },
      type: 'direct',
      directFn: lvm__LogicalVolume.filter
    },
    autoLoad: true
  });

  Ext.define('snapcore_snapshot_volume_store_model', {
    extend: 'Ext.data.Model',
    fields : ["id", "name"]
  });
  var snapcore_snapshot_volume_store = Ext.create('Ext.data.ArrayStore', {
    model: "snapcore_secondgrid_store_model",
    proxy: {
      type: 'direct',
      root: 'data'
    }
  });

  Ext.define("Ext.oa.ExtendedGridDropZone", {
    extend: "Ext.grid.ViewDropZone",
    onNodeOver: function(node, dragZone, e, data){
      if(data && data.records && data.records[0]){
        if(data.records[0].data.draggable === false){
          return this.dropNotAllowed;
        }
      }
      return this.callParent(arguments);
    }
  });

  Ext.define("Ext.oa.ExtendedGridDnD", {
    extend: "Ext.grid.plugin.DragDrop",
    alias: "plugin.extendeddnd",
    onViewRender: function(view){
      this.callParent(arguments);

      this.dropZone = Ext.create("Ext.oa.ExtendedGridDropZone", {
        view: view,
        ddGroup: this.dropGroup || this.ddGroup
      });
    }
  });

  var group1 = this.id + 'group1',
      group2 = this.id + 'group2';

  var wizform = Ext.create("Ext.oa.WizPanel", {
    config    : config,
    activeNode: null,
    activeItem: 'lvm__snapcore_wiz_welc',
    items     : [{
      title     : gettext('Welcome'),
      id        : 'lvm__snapcore_wiz_welc',
      noAutoPrev: true,
      xtype     : 'form',
      items     : [{
        xtype       : 'label',
        html        : gettext('The following wizard configures automated snapshots using the openATTIC SnapApps.<br /><br />Please enter a name for the new configuration.')
      },{
        xtype       : 'tbspacer',
        height      : 10
      },{
        xtype           : 'textfield',
        name            : 'configname',
        fieldLabel      : gettext('Description')
      }]
    },{
      id        : 'wiz_snapitems',
      layout    : 'border',
      items     : [{
        title     : gettext('Available Items'),
        region    : 'center',
        id        : 'lvm__snapcore_wizard_treepanel',
        xtype     : 'lvm__snapcore_treepanel',
        listeners : {
          itemclick: function(self, record, item, index, e, eOpts){
            var settings = Ext.getCmp('lvm__snapcore_wiz_snapitem_settings').layout;
            if(typeof record.data.configForm !== 'undefined' && record.data.configForm.length > 0){
            wizform.activeNode = record;
            settings.setActiveItem(record.data.configForm);
          }
          else
          {
            wizform.activeNode = null;
            settings.setActiveItem('emptyConfigForm');
          }
        }
      }
    }, (function(){
      var items = [];

      items.push(new Ext.form.FormPanel({
        itemId: "emptyConfigForm",
        items : [{
          xtype: "label",
          text : gettext("There are no configuration options available.")
        }]
      }));

      for(var i=0; i < window.SnapAppPlugins.length; i++){
        var configForms = window.SnapAppPlugins[i].configForms;

        for(var j=0; j < configForms.length; j++){
          var btn_save = Ext.create("Ext.button.Button", {
            constructor: function(){
              return this;
            },
            text: gettext('Save'),
            icon  : MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png',
            listeners : {
              click : function(btn, e){
                setConfigForNode(wizform.activeNode, this.ownerCt.ownerCt.getValues());
              }
            }
          });

          var btn_clear = Ext.create("Ext.button.Button", {
            text: gettext('Clear'),
            icon  : MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png',
            listeners : {
              click : function(btn, e){
                setConfigForNode(wizform.activeNode, null);
              }
            }
          });

          configForms[j].buttons = [];
          configForms[j].buttons.push(btn_save);
          configForms[j].buttons.push(btn_clear);

          items.push(configForms[j]);
        }
      }
      return{
        title     : gettext('Item settings'),
        id        : 'lvm__snapcore_wiz_snapitem_settings',
        region    : 'east',
        border    : false,
        split     : true,
        defaults  : {border: false},
        width     : 250,
        layout    : 'card',
        bodyStyle : 'padding; 5px 5px',
        items     : items,
        activeItem: 0
      };
    }())]
  },{
    title     : gettext('Additional Drives'),
    id        : 'wiz_addvol',
    layout    : "border",
    xtype     :'panel',
    border    : false,
    items     : [{
      xtype    : 'label',
      region   : 'north',
      text     : gettext('If other devices need to be included in the snapshot (e.g. for raw device mappings), they can be added via Drag&Drop.'),
      bodyStyle: "padding: 10px"
    },{
      itemId      : 'first_volume_grid',
      flex        : 1,
      xtype       : 'grid',
      multiSelect : false,
      region      : 'center',
      viewConfig  : {
        plugins : {
          ptype: 'extendeddnd',
          dragGroup: group1,
          dropGroup: group2
        }
      },
      store       : first_volume_grid_store,
      columns     : [ {text: gettext("Volume"), dataIndex: "name", flex: 1}],
      stripeRows  : true,
      title       : gettext("Volumes"),
      height      : 340
    },{
      itemId      : 'second_volume_grid',
      flex        : 1,
      xtype       : 'grid',
      multiSelect : false,
      region      : 'east',
      viewConfig  : {
        plugins: {
          ptype     : 'gridviewdragdrop',
          dragGroup : group2,
          dropGroup : group1
        }
      },
      store       : snapcore_snapshot_volume_store,
      columns     : [{ text: gettext("Volume"), dataIndex: "name", flex: 1}],
      stripeRows  : true,
      title       : gettext('Drag and drop additional volumes here:'),
      height      : 340
    }],
    listeners: {
      show: function(self){
        // first reset the grids if any former configs were deleted
        config.volumes = [];

        var reset = function(record, recordId, length){
          snapcore_snapshot_volume_store.remove(record);
          first_volume_grid_store.add(record);
        }
        if(snapcore_snapshot_volume_store.count() > 0){
          snapcore_snapshot_volume_store.each(Ext.bind(reset, this));
        }

        // then move the configured volumes to the right grid
        for(var plugin in config['plugin_data']){
          var plugin_func = get_plugin(plugin);

          plugin_func.getVolume(config, function(result, response){
            if(response.type !== 'exception'){

              var volumeRecord = first_volume_grid_store.getById(result.volume.id);

              if(volumeRecord !== null){
                snapcore_snapshot_volume_store.add(volumeRecord);
                first_volume_grid_store.remove(volumeRecord);
                volumeRecord.set("draggable", false);

                if(config.volumes.indexOf(volumeRecord.data.id) === -1){
                  config.volumes.push(volumeRecord.data.id);
                }
              }
            }
          });
        }
      }
    }
  },{
    title : gettext('Pre-/Post-Scripts'),
    id    : 'lvm__snapcore_wiz_prepost',
    labelWidth: 150,
    xtype : 'form',
    items : [{
      xtype     : 'label',
      html      : gettext("Before and after the snapshot is made, user-defined scripts can be executed. Please enter the path to your scripts or leave these fields empty if you don't have any.")
    },{
      xtype     : 'tbspacer',
      height    : 10
    },{
      xtype           : 'textfield',
      name            : 'prescript',
      fieldLabel      : gettext('Prescript'),
      enableKeyEvents : true,
      listeners : {
        keypress : nextElement
      }
    },{
      xtype           : 'textfield',
      name            : 'postscript',
      fieldLabel      : gettext('Postscript')
    }]
  },{
    title : gettext('Schedule Part 1 / Expiry Date'),
    id    : 'lvm__snapcore_wiz_sched1',
    layout: {
      type  : 'vbox',
      align : 'stretch'
    },
    xtype : 'form',
    items : [{
      xtype     : 'label',
      text      :  gettext('Please define the retention time for snapshots.')
    },{
      xtype     : 'tbspacer',
      height    : 10
    },{
      boxLabel  : gettext('Never automatically delete snapshots'),
      name      : 'retentiontime',
      inputValue: 'retention_time_noretention',
      xtype     : 'radio',
      checked   : true
    },{
      boxLabel  : gettext('Automatically delete snapahots after:'),
      name      : 'retentiontime',
      inputValue: 'retention_time_retention',
      xtype     : 'radio',
      listeners : {
        change: function(self, newValue, oldValue, eOpts){
          if(newValue)
          {
            Ext.getCmp('retention_time').enable();
            Ext.getCmp('retention_time_combo').enable();
          }
          else
          {
            Ext.getCmp('retention_time').disable();
            Ext.getCmp('retention_time_combo').disable();
          }
        }
      }
    },{
      xtype : 'panel',
      layout: {
        type  : 'hbox'
      },
      defaults: {
        style: 'margin-left: 17px;'
      },
      items : [{
        xtype       : 'numberfield',
        id          : 'retention_time',
        name        : 'retention_time',
        disabled    : true,
        minValue    : 1,
        allowBlank  : false
      },{
        name            : 'retention_time_combo',
        xtype           : 'combo',
        id              : 'retention_time_combo',
        disabled        : true,
        forceSelection  : true,
        allowBlank      : false,
        store           : [
            ['1', gettext('Second(s)')],
            ['60', gettext('Minute(s)')],
            ['3600', gettext('Hour(s)')],
            ['86400', gettext('Day(s)')],
            ['604800', gettext('Week(s)')]
        ],
        typeAhead:  true,
        triggerAction: 'all',
        listeners: {
          afterrender: function(self, eOpts){
            self.setValue('1');
          }
        }
      }]
    }]
  },{
    title : gettext('Schedule Part 2 / Options'),
    id    : 'lvm__snapcore_wiz_sched2',
    layout: {
      type  : 'vbox',
      align : 'stretch'
    },
    noAutoNext: true,
    xtype     : 'form',
    items     : [{
      boxLabel  : gettext('Execute immediately'),
      id        : 'execute_now',
      name      : 'scheduling_select',
      inputValue: 'execute_now',
      xtype     : 'radio',
      checked   : true
    },{
      boxLabel  : gettext('Execute later'),
      id        : 'execute_later',
      name      : 'scheduling_select',
      inputValue: 'execute_later',
      xtype     : 'radio',
      listeners : {
        change: function(self, newValue, oldValue, eOpts){
          if(newValue)
          {
            Ext.getCmp('date_select').enable();
            Ext.getCmp('time_select').enable();
          }
          else
          {
            Ext.getCmp('date_select').disable();
            Ext.getCmp('time_select').disable();
          }
        }
      }
    },{
      xtype   : 'panel',
      layout  : {
        type  : 'hbox'
      },
      defaults: {
        style : 'margin-left: 17px;'
      },
      items   : [{
        xtype       : 'datefield',
        id          : 'date_select',
        disabled    : true,
        value       : new Date(),
        fieldLabel  : gettext("Execute time")
      },{
        xtype       : 'timefield',
        id          : 'time_select',
        disabled    : true,
        value       : Ext.Date.add(new Date(), Ext.Date.HOUR, +1),
        format      : "H:i",
        fieldLabel  : gettext("Execute date")
      }]
    },{
      boxLabel  : gettext('Create Schedule'),
      id        : 'scheduling',
      name      : 'scheduling_select',
      inputValue: 'scheduling',
      xtype     : 'radio',
      listeners : {
        change: function(self, newValue, oldValue, eOpts){
          var no_enddatetime_value = Ext.getCmp('no_enddatetime').checked;

          if(newValue)
          {
            Ext.getCmp('startdate_select').enable();
            Ext.getCmp('starttime_select').enable();

            if(!no_enddatetime_value)
            {
              Ext.getCmp('enddate_select').enable();
              Ext.getCmp('endtime_select').enable();
            }

            Ext.getCmp('is_active').enable();
            Ext.getCmp('no_enddatetime').enable();
          }
          else
          {
            Ext.getCmp('startdate_select').disable();
            Ext.getCmp('starttime_select').disable();
            Ext.getCmp('enddate_select').disable();
            Ext.getCmp('endtime_select').disable();
            Ext.getCmp('is_active').disable();
            Ext.getCmp('no_enddatetime').disable();
          }
        }
      }
    },{
      xtype : 'panel',
      layout: {
        type  : 'form'
      },
      items : [{
        xtype : 'panel',
        layout: {
          type  : 'hbox'
        },
        defaults: {
          style: 'margin-left: 17px;'
        },
        border   : false,
        items   : [{
          xtype       : 'datefield',
          id          : 'startdate_select',
          disabled    : true,
          value       : new Date(),
          fieldLabel  : gettext('Start date')
        },{
          xtype       : 'timefield',
          id          : 'starttime_select',
          disabled    : true,
          value       : new Date(),
          format      : "H:i",
          fieldLabel  : gettext('Start time')
        }]
      },{
        xtype : 'tbspacer',
        height: 2
      },{
        xtype : 'panel',
        layout: {
          type  : 'hbox'
        },
        defaults: {
          style:  'margin-left: 17px;'
        },
        border  : false,
        items   : [{
          xtype       : 'datefield',
          id          : 'enddate_select',
          disabled    : true,
          value       : Ext.Date.add(new Date(), Ext.Date.DAY, +7),
          fieldLabel  : gettext('End date')
        },{
          xtype       : 'timefield',
          id          : 'endtime_select',
          disabled    : true,
          value       : new Date(),
          fieldLabel  : gettext('End time'),
          format      : "H:i"
        }]
      },{
        xtype       : 'checkbox',
        id          : 'no_enddatetime',
        name        : 'no_enddatetime',
        disabled    : true,
        fieldLabel  : gettext('No end date'),
        listeners : {
          change: function(self, newValue, oldValue, eOpts ){
            if(newValue)
            {
              Ext.getCmp('enddate_select').disable();
              Ext.getCmp('endtime_select').disable();
            }
            else
            {
              Ext.getCmp('enddate_select').enable();
              Ext.getCmp('endtime_select').enable();
            }
          }
        }
      },{
        xtype       : 'checkbox',
        id          : 'is_active',
        name        : 'is_active',
        disabled    : true,
        fieldLabel  : gettext('Is active'),
        checked     : true
      }]
    }],
    buttons: [{
      text    : gettext('Next'),
      handler : function(){
        var checked = Ext.getCmp('lvm__snapcore_wiz_sched2').getForm().getValues()['scheduling_select'];
        var nextpnl = '';
        switch(checked){
          case 'execute_now':
            nextpnl = 'lvm__snapcore_wiz_close';
            break;
          case 'execute_later':
            nextpnl = 'lvm__snapcore_wiz_close';
            break;
          case 'scheduling':
            nextpnl = 'lvm__snapcore_wiz_sched32';
            break;
        }
        wizform.nextpanel(nextpnl);
      }
    }]
  },{
    title : gettext('Schedule Part 3 / Times Part 2'),
    id    : 'lvm__snapcore_wiz_sched32',
    xtype : 'form',
    items : [{
      xtype : 'label',
      text  : gettext('Please select the time')
    },{
      xtype : 'tbspacer',
      height: 10
    },{
      xtype         : 'combo',
      name          : 'minute',
      fieldLabel    : gettext('Minute'),
      store         : (function(){
        var derp = ['*'];
        for(var i = 0; i < 60; i += 5)
          derp.push(i);
        return derp;
      }()),
      value         : '0',
      typeAhead     : true,
      triggerAction : 'all',
      deferEmptyText: false,
      emptyText     : gettext('Select...'),
      selectOnFocus : true
    },{
      xtype   : 'fieldset',
      title   : gettext('Hour'),
      ref     : '../h_fieldset',
      border  : true,
      defaults: {
        border      : false,
        columnWidth : .5,
        layout      : 'form',
        defaults    : {
          xtype: 'checkbox'
        }
      },
      layout: 'column',
      items : [{
        items: (function(){
          var it = [];
          for(var i = 0; i < 12; i++)
            it.push({id: 'h_' + i, fieldLabel: i.toString(), checked: (i%3 == 0) });
          return it;
        }())
      },{
        items: (function(){
          var it = [];
          for(var i = 12; i < 24; i++)
            it.push({id: 'h_' + i, fieldLabel: i.toString(), checked: (i%3 == 0) });
          return it;
        }())
      }]
    }]
  },{
    title : gettext('Schedule Part 3 / Times Part 3'),
    id    : 'lvm__snapcore_wiz_sched33',
    xtype : 'form',
    items : [{
      xtype       : 'label',
      text        : gettext('Please select the week day and months')
    },{
      xtype : 'tbspacer',
      height: 10
    },{
      xtype     : 'combo',
      name      : 'day_of_month',
      fieldLabel: gettext('Day'),
      store     : (function(){
        var derp = ['*'];
        for(var i = 1; i <= 31; i++)
          derp.push(i);
        return derp;
      }()),
      value         : '*',
      typeAhead     : true,
      triggerAction : 'all',
      deferEmptyText: false,
      emptyText     : gettext('Select...'),
      selectOnFocus : true
    },{
      xtype   : 'fieldset',
      title   : gettext('Day of Week'),
      ref     : '../dow_fieldset',
      border  : true,
      defaults: {
        border      : false,
        columnWidth : .5,
        layout      : 'form',
        defaults    : {
          xtype   : 'checkbox',
          checked : true
        }
      },
      layout  : 'column',
      items   : [{
        items: [{
          id: 'dow_1', fieldLabel: gettext('Monday')
        },{
          id: 'dow_2', fieldLabel: gettext('Tuesday')
        },{
          id: 'dow_3', fieldLabel: gettext('Wednesday')
        },{
          id: 'dow_4', fieldLabel: gettext('Thursday')
        },{
          id: 'dow_5', fieldLabel: gettext('Friday')
        }]
      },{
        items: [{
          id: 'dow_6', fieldLabel: gettext('Saturday')
        },{
          id: 'dow_0', fieldLabel: gettext('Sunday')
        }]
      }]
    },{
      xtype   : 'fieldset',
      ref     : '../moy_fieldset',
      border  : true,
      defaults: {
        border      : false,
        columnWidth : .5,
        layout      : 'form',
        defaults    : {
          xtype   : 'checkbox',
          checked : true
        }
      },
      title : gettext('Monday'),
      layout: 'column',
      items : [{
        items: [{
          id: 'moy_1', fieldLabel: gettext('January')
        },{
          id: 'moy_2', fieldLabel: gettext('Feburary')
        },{
          id: 'moy_3', fieldLabel: gettext('March')
        },{
          id: 'moy_4', fieldLabel: gettext('April')
        },{
          id: 'moy_5', fieldLabel: gettext('May')
        },{
          id: 'moy_6', fieldLabel: gettext('June')
        }]
      },{
        items: [{
          id: 'moy_7', fieldLabel: gettext('July')
        },{
          id: 'moy_8', fieldLabel: gettext('August')
        },{
          id: 'moy_9', fieldLabel: gettext('September')
        },{
          id: 'moy_10', fieldLabel: gettext('October')
        },{
          id: 'moy_11', fieldLabel: gettext('November')
        },{
          id: 'moy_12', fieldLabel: gettext('December')
        }]
      }]
    }]
  },{
    title       : gettext('Done'),
    id          : 'lvm__snapcore_wiz_close',
    noAutoNext  : true,
    buttons     : [{
      text      : gettext('Finish'),
      listeners : {
        click: function(self, e, eOpts){
          config.data = config.data.data;
          // set datetimes
          switch(config.data["scheduling_select"]){
            case "execute_later":
              if(config.data["date_select-inputEl"] !== null && typeof config.data["date_select-inputEl"] !== 'undefined' &&
                config.data["time_select-inputEl"] !== null && typeof config.data["time_select-inputEl"] !== 'undefined')
              {
                config.data["executedate"] = set_time(config.data["date_select-inputEl"], config.data["time_select-inputEl"]);
              }
              break;
            case "scheduling":
              if(config.data["startdate_select-inputEl"] !== null && typeof config.data["startdate_select-inputEl"] !== "undefined" &&
                config.data["starttime_select-inputEl"] !== null && typeof config.data["starttime_select-inputEl"] !== "undefined")
              {
                config.data["startdate"] = set_time(config.data["startdate_select-inputEl"], config.data["starttime_select-inputEl"]);
              }

              if(config.data["enddate_select-inputEl"] !== null && typeof config.data["enddate_select-inputEl"] !== "undefined" &&
                config.data["endtime_select-inputEl"] !== null && typeof config.data["endtime_select-inputEl"] !== "undefined")
              {
                config.data["endddate"] = set_time(config.data["enddate_select-inputEl"], config.data["endtime_select-inputEl"]);
              }
              break;
          }

          if(config.data["retentiontime"] === 'retention_time_retention' && config.data["retention_time"] > 0)
          {
            config.data["retention_time"] = config.data["retention_time"] * parseInt(config.data["retention_time_combo"]);
          }

          lvm__SnapshotConf.process_config(config)
          config_store.reload();
          wiz.hide();
        }
      }
    }]
  }]
});
var wiz = Ext.create("Ext.window.Window", {
  title       : gettext('Configuration Assistant'),
  layout      : 'fit',
  items       : wizform,
  width       : 800,
  height      : 500,
  anchor      : '-20px',
  closeAction : 'hide'
});

Ext.define("Ext.oa.LVM__Snapcore_Panel", {
  extend: "Ext.Panel",
  alias: "widget.lvm__snapcore_panel",
  initComponent: function(){
    //var tree = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id    : 'lvm__snapcore_panel_inst',
      title : gettext('SnapApps'),
      layout: 'border',
      items:[{
        id        : 'lvm__snapcore_west_treepanel',
        region    : 'west',
        width     : 280,
        height    : 990,
        xtype     : 'lvm__snapcore_treepanel',
        showIcons : false,
        buttons   : [{
          text    : gettext('New configuration'),
          icon    : MEDIA_URL + "/icons2/16x16/actions/add.png",
          listeners: {
            click: function(self, e, eOpts){
              wiz.show();
            }
          }
        },{
          text     : gettext('Collapse all'),
          icon     : MEDIA_URL + "/extjs/resources/ext-theme-classic/images/tree/elbow-end-minus.gif",
          listeners: {
            click: function(self, e, eOpts){
              self.ownerCt.ownerCt.collapseAll();
            }
          }
        }]
      },{
        region    : 'center',
        xtype     : 'panel',
        id        : 'lvm__snapcore_center_panel',
        layout    : 'border',
        viewConfig: {forceFit: true},
        items     : [{
          region    : 'center',
          xtype     : 'grid',
          width     : 160,
          id        : "lvm__snapcore_inner_center_panel",
          viewConfig: {forceFit: true},
          columns: [{
            header    : gettext("Schedules"),
            dataIndex : 'confname'
          },{
            header: gettext("Last execution"),
            dataIndex : 'last_execution'
          }],
          selModel  : { mode: "SINGLE" },
          store: config_store,
          listeners : {
            cellclick:  function(self, td, cellIndex, record, tr, rowIndex, e, eOpts){
              lvm__snapcore_snap_store.removeAll();
              var record = self.getStore().getAt(rowIndex);
              lvm__snapcore_snap_store.load({
                params: {
                  snapshotconf: record.data.id
                }
              })
            }
          },
          buttons   : [/*{
            text      : gettext("Edit config"),
            listeners : {
              click: function(btn, e){
                if(typeof btn.ownerCt.ownerCt.getSelectionModel().getSelected() !== "undefined")
                {
                  var config_id = btn.ownerCt.ownerCt.getSelectionModel().getSelected().id;
                  // restore config object from database
                  lvm__SnapshotConf.restore_config(config_id, function(result, response){
                    if(response.type !== 'exception'){
                      // iterate assistant cards
                      var wiz_cards = wiz.items.items[0].items.items;
                      for(var i=0; i < wiz_cards.length; i++)
                      {
                        if(typeof wiz_cards[i].items !== 'undefined')
                        {
                          // iterate form items within assistant cards
                          var form_items = wiz_cards[i].items.items;
                          for(var j=0; j < form_items.length; j++)
                          {
                            // assign stored values to assistant fields
                            switch(form_items[j].xtype)
                            {
                              case "textfield":
                              case "combo":
                                if(typeof result[form_items[j].name] !== 'undefined')
                                  form_items[j].setValue(result[form_items[j].name]);
                                break;
                            }
                          }
                        }
                      }
                      wiz.show();
                    }
                  });
                }
              }
            }
          },*/{
            text      : gettext("Delete config"),
            icon      : MEDIA_URL + "/icons2/16x16/actions/remove.png",
            listeners : {
              click: function(self, e, eOpts){
                if(typeof self.ownerCt.ownerCt.getSelectionModel().getSelection() !== "undefined")
                {
                  if(self.ownerCt.ownerCt.getSelectionModel().getSelection().length > 0)
                  {
                    var config_id = self.ownerCt.ownerCt.getSelectionModel().getSelection()[0].data.id;
                    lvm__SnapshotConf.remove(config_id, function(result, response){
                      if(response.type !== 'exception'){
                        config_store.reload();
                      }
                    })
                  }
                }
              }
            }
          }]
        },{
          region    : 'south',
          id        : 'lvm__snapcore_south_panel',
          split     : true,
          height    : 160,
          width     : 160,
          xtype     : 'grid',
          viewConfig: {forceFit: true},
          columns: [{
            header: gettext("Snapshot"),
            dataIndex: 'name'
          },{
            header: gettext("Created"),
            dataIndex: 'createdate'
          }],
          store: lvm__snapcore_snap_store
        }]
      }]
    }));
    this.callParent(arguments);
  }
  /*  refresh: function(){
    var tree = Ext.getCmp('lvm__snapcore_treepanel');
    tree.getLoader().load(tree.root);
  }*/
});

Ext.define('snapcore_config_model', {
  extend: 'Ext.data.Model',
  fields:  ['confname', 'last_execution', 'id', '__unicode__']
});
var config_store = Ext.create('Ext.data.Store', {
  model: "snapcore_config_model",
  proxy: {
    type: 'direct',
    directFn: lvm__SnapshotConf.all
  },
  autoLoad: true
});

Ext.define('snapcore_snap_model', {
  extend: 'Ext.data.Model',
  fields:  ['id', 'name', 'snapshot_id', 'createdate']
});
var lvm__snapcore_snap_store = Ext.create('Ext.data.Store', {
  model: "snapcore_snap_model",
  proxy: {
    type: 'direct',
    directFn: lvm__LogicalVolume.filter,
    pageParam:  undefined,
    startParam: undefined,
    limitParam: undefined
  }
});

Ext.oa.VMSnapApp__Snap_Module = {
  panel: 'lvm__snapcore_panel',
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById('menu_storage', {
      text: gettext('SnapApps'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/places/network_local.png',
      panel: "lvm__snapcore_panel_inst"
    });
  }
};

window.MainViewModules.push(Ext.oa.VMSnapApp__Snap_Module);