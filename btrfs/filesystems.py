# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import os
import os.path

from systemd import get_dbus_object
from volumes.conf import settings as volumes_settings
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Btrfs(FileSystem):
    name = "btrfs"
    desc = "BTRFS (Experimental)"

    @classmethod
    def format_blockvolume(cls, volume, options):
        from btrfs.models import Btrfs, BtrfsSubvolume
        from volumes.models import StorageObject
        pool = Btrfs(storageobj=volume.storageobj, host=volume.host)
        pool.full_clean()
        pool.save()
        svol = BtrfsSubvolume(storageobj=volume.storageobj, btrfs=pool, owner=options["owner"], fswarning=options["fswarning"], fscritical=options["fscritical"])
        svol.full_clean()
        svol.save()
        dso = StorageObject(name="default", megs=volume.storageobj.megs)
        dso.full_clean()
        dso.save()
        dvol = BtrfsSubvolume(storageobj=dso, btrfs=pool, owner=options["owner"], fswarning=options["fswarning"], fscritical=options["fscritical"])
        dvol.full_clean()
        dvol.save()
        return svol

    @property
    def info(self):
        return {}

    @property
    def dbus_object(self):
        return get_dbus_object("/btrfs")

    def format(self):
        self.dbus_object.format( self.volume.volume.base.volume.path )
        self.write_fstab()
        self.mount()
        self.chown()

    @property
    def path(self):
        return os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.fullname)

    @property
    def mounted(self):
        return os.path.ismount(os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.storageobj.filesystemvolume.volume.fullname))

    @classmethod
    def check_type(cls, typestring):
        return False

    def create_subvolume(self, path):
        self.dbus_object.create_subvolume(path)

    def create_snapshot(self, origpath, snappath, readonly):
        self.dbus_object.create_snapshot(origpath, snappath, readonly)

    def delete_subvolume(self, path):
        self.dbus_object.delete_subvolume(path)

class BtrfsDevice(capabilities.Device):
    requires = [
        capabilities.BlockbasedCapability,
        capabilities.FailureToleranceCapability,
        ]
    provides = [
        capabilities.FileSystemCapability,
        capabilities.VolumeSnapshotCapability,
        capabilities.SubvolumesCapability,
        capabilities.SubvolumeSnapshotCapability,
        capabilities.FileSnapshotCapability,
        capabilities.GrowCapability,
        capabilities.ShrinkCapability,
        capabilities.DeduplicationCapability,
        capabilities.CompressionCapability,
        capabilities.PosixACLCapability,
        capabilities.FileIOCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        ]

class BtrfsSubvolumeDevice(capabilities.Device):
    requires = BtrfsDevice



