# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from ifconfig.models import IPAddress, NetDevice

class IPAddressHandler(ModelHandler):
    model = IPAddress

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'address': obj.address}

class NetDeviceHandler(ModelHandler):
    model = NetDevice

    def _override_get(self, obj, data):
        data['brports'] = [ self._idobj(member) for member in obj.brports.all() ]
        data['slaves']  = [ self._idobj(member) for member in obj.slaves.all()  ]
        if obj.vlanrawdev:
            data['vlanrawdev'] = self._idobj(obj.vlanrawdev)
        else:
            data['vlanrawdev'] = None
        return data


    def write_interfaces(self):
        return NetDevice.write_interfaces()

RPCD_HANDLERS = [NetDeviceHandler, IPAddressHandler]
