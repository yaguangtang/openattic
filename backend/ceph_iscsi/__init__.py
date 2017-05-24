# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *   Copyright (c) 2017 SUSE LLC
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
import imp
from deepsea import DeepSea
from utilities import in_unittest

try:
    imp.find_module('ceph')
except ImportError:
    raise ImportError('Cannot import app "ceph", disabling app "ceph_iscsi"')

try:
    if not in_unittest():
        if not DeepSea.instance().is_service_online():
            raise ImportError('"salt-api" is offline')
except Exception:
    raise ImportError('"salt-api" is offline')