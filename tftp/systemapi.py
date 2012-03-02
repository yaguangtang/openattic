# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

from django.template.loader import render_to_string

from systemd       import invoke, logged, LockingPlugin, method

from tftp.conf     import settings as tftp_settings
from tftp.models   import Instance

@logged
class SystemD(LockingPlugin):
    dbus_path = "/tftp"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( tftp_settings.XINETD_CONF, "wb" )
            try:
                fd.write( render_to_string( "tftp/xinetd.conf", {
                    'Instances': Instance.objects.all(),
                    } ) )
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def reload(self):
        return invoke(["/etc/init.d/xinetd", "reload"])
