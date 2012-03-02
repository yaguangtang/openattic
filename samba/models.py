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

import new
import dbus

from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import signals
from django.db import models

from lvm.models import LogicalVolume

class Share(models.Model):
    volume        = models.ForeignKey(LogicalVolume)
    name          = models.CharField(max_length=50, unique=True)
    path          = models.CharField(max_length=255)
    available     = models.BooleanField(default=True,  blank=True)
    browseable    = models.BooleanField(default=True,  blank=True)
    guest_ok      = models.BooleanField(default=False, blank=True)
    writeable     = models.BooleanField(default=True,  blank=True)
    force_user    = models.CharField(max_length=50, blank=True)
    force_group   = models.CharField(max_length=50, blank=True)
    create_mode   = models.CharField(max_length=5,  default="0664")
    dir_mode      = models.CharField(max_length=5,  default="0775")
    comment       = models.CharField(max_length=250, blank=True)
    valid_users   = models.ManyToManyField(User, blank=True, related_name="valid_user_share_set"  )
    invalid_users = models.ManyToManyField(User, blank=True, related_name="invalid_user_share_set")
    read_list     = models.ManyToManyField(User, blank=True, related_name="read_user_share_set"   )
    write_list    = models.ManyToManyField(User, blank=True, related_name="write_user_share_set"  )

    share_type    = "samba"

    def __unicode__(self):
        return unicode(self.volume)

    @property
    def valid_users_str(self):
        return ' '.join([rec["username"] for rec in self.valid_users.values("username")])

    @property
    def invalid_users_str(self):
        return ' '.join([rec["username"] for rec in self.invalid_users.values("username")])

    @property
    def read_list_str(self):
        return ' '.join([rec["username"] for rec in self.read_list.values("username")])

    @property
    def write_list_str(self):
        return ' '.join([rec["username"] for rec in self.write_list.values("username")])

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        samba = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/samba")
        samba.writeconf()
        if not self.volume.standby:
            samba.reload()
        return ret

    def delete( self ):
        volume = self.volume
        ret = models.Model.delete(self)
        samba = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/samba")
        samba.writeconf()
        if not volume.standby:
            samba.reload()
        return ret


def replace_set_password(instance=None, **kwargs):
    """ Replace the standard *_password functions in the auth model. """
    oldfunc = instance.set_password

    def set_password_samba(self, raw_password):
        ret = oldfunc(raw_password)
        if self.id is None:
            self.save() # need to save() first, because smbpasswd will fail if the user doesn't exist
        # Yaay! Let's send the password to systemd! Why, in plain text, of course!
        # Who needs encryption and shit! Security lolomgz
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/samba").setpasswd(self.username, raw_password)
        return ret

    instance.set_password = new.instancemethod(set_password_samba, instance, instance.__class__)

signals.post_init.connect(replace_set_password, sender=User)
