# -*- coding: utf-8 -*-
"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
from collections import defaultdict
from contextlib import contextmanager
from functools import total_ordering
from itertools import chain, product
from os.path import commonprefix

import fnmatch
import re
import yaml
from django.core.exceptions import ValidationError

from ceph_deployment.systemapi import salt_cmd
from ceph_deployment.conf import settings as ceph_deployment_settings
from systemd import get_dbus_object
from utilities import aggregate_dict


def get_config():
    """
    Returns a list of all minions, where each minion
    is a dict of the pillar data, e.g.
        * ip-address,
        * hostname
        * role
        * cluster fsid
        * key_accepted (boolean)
        * roles
    May be similar to:

    >>> subprocess.check_output(['salt', '*', 'pillar.items'])

    """
    out = salt_cmd().invoke_salt(['*', 'pillar.items'])
    return [
        aggregate_dict(data, hostname=hostname)
        for (hostname, data)
        in out.iteritems()
    ]

minion_roles = ['storage', 'mon', 'mds', 'rgw', 'master', 'admin']


def add_role(minion, role):
    """
    Adds a role to a given host. E.g. "storage", "mon", "mds", "rgw"
    Ceph cluster already set up. Afterwards, also edit the stack file.

    :type minion: str | unicode
    :type role: str
    """
    assert role in minion_roles
    filename = os.path.join(ceph_deployment_settings.DEEPSEA_PILLAR_ROOT, 'cluster',
                            minion + '.sls')

    with open(filename) as f:
        contents = yaml.safe_load(f)
    original_content = copy.deepcopy(contents)

    if 'roles' not in contents:
        contents['roles'] = [role]
    elif role not in contents['roles']:
        contents['roles'].append(role)
    else:
        return  # already present

    dumper = yaml.SafeDumper
    dumper.ignore_aliases = lambda self, data: True
    content = yaml.dump(contents, Dumper=dumper, default_flow_style=False)
    get_dbus_object("/ceph_deployment").write_pillar_file(filename, content)
    try:
        validate_pillar_data()
    except ValidationError:
        print "resetting"
        old_content = yaml.dump(original_content, Dumper=dumper, default_flow_style=False)
        get_dbus_object("/ceph_deployment").write_pillar_file(filename, old_content)
        raise


def set_storage_configuration(hostname, storage_configuration):
    """
    Sets the storage configuration as returned by
    get_possible_storage_configurations()
    """
    pass


def get_possible_storage_configurations(hostname):
    """
    Returns a list of proposals, of how this node
    could be configured.
    """
    pass

def deepsea_stage_0():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.0'])
    pass


def deepsea_stage_1():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.1'])
    pass


def deepsea_stage_2():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.2'])
    pass


def deepsea_stage_3():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.3'])
    pass

def deepsea_stage_4():
    salt_cmd().invoke_salt_run(['state.orch', 'ceph.stage.4'])
    pass

@contextmanager
def policy_cfg(minion_names):
    """
    # cluster assignment
    cluster-ceph/cluster/*.sls
    #cluster-unassigned/cluster/client*.sls

    # Hardware Profile
    #2Dsk2GB-1/cluster/data*.sls
    2Disk2GB-1/cluster/data*.sls
    #2Dsk2GB-1/stack/default/ceph/minions/data*.ceph.yml
    2Disk2GB-1/stack/default/ceph/minions/data*.ceph.yml

    # Common configuration
    config/stack/default/global.yml
    config/stack/default/ceph/cluster.yml

    # Role assignment
    role-master/cluster/admin*.sls
    role-admin/cluster/mon*.sls
    #role-admin/cluster/igw*.sls
    #role-admin/cluster/data*.sls
    role-admin/cluster/admin*.sls
    #role-igw/cluster/igw*.sls
    role-mon/cluster/mon*.sls
    #role-mds/cluster/mon[12]*.sls

    # Default stuff
    role-mon/stack/default/ceph/minions/mon*.yml
    """

    file = '/srv/pillar/ceph/proposals/policy.cfg'

    class PolicyCfg(object):
        def __init__(self, f):
            self.cluster_assignment = set()
            self.hardware_profiles = defaultdict(set)
            self.common_configuration = [
                'config/stack/default/global.yml'
                'config/stack/default/ceph/cluster.yml'
            ]
            self.role_assigments = defaultdict(set)
            self.default_stuff = set()

            for line in f:
                self.read_cluster_assignment(line)
                self.read_hardware_profiles(line)
                #self.read_common_configuration(line)
                self.read_role_assigments(line)
                self.read_default_stuff(line)

        def read_cluster_assignment(self, line):
            res = re.match(r'^cluster-ceph/cluster/(.*).sls$', line)
            if res is None:
                return
            minions = fnmatch.filter(minion_names, res.groups()[0])
            self.cluster_assignment = self.cluster_assignment.union(minions)

        def read_hardware_profiles(self, line):
            res = re.match(r'^([^#]*Disk[^/]*)/cluster/(.*).sls$', line)
            if res is None:
                return
            profile, pattern = res.groups()
            minions = fnmatch.filter(minion_names, pattern)
            self.hardware_profiles[profile] = self.hardware_profiles[profile].union(minions)


        #def read_common_configuration(self, line):
        #    pass

        def read_role_assigments(self, line):
            res = re.match(r'^role-(.*)/cluster/(.*).sls$', line)
            if res is None:
                return
            role, pattern = res.groups()
            minions = fnmatch.filter(minion_names, pattern)
            self.role_assigments[role] = self.hardware_profiles[role].union(minions)
            if role == 'mon':
                self.default_stuff = self.default_stuff.union({minions})
            pass


        def read_default_stuff(self, line):
            pass


def validate_pillar_data():
    out = salt_cmd().invoke_salt_run_quiet(['validate.pillars'])

    def format_errors(name, errors):
        return [
            "{}: {}: {}".format(name, key, '\n'.join(error))
            for key, error
            in errors.items()
        ]

    def format_cluster(name, cluster):
        if 'errors' in cluster:
            return format_errors(name, cluster['errors'])
        else:
            return []

    all_errors = list(
        chain.from_iterable([format_cluster(name, cluster) for name, cluster in out.items()]))
    if all_errors:
        raise ValidationError({'detail': all_errors})


def generate_globs(whitelist, blacklist):

    def is_odd_len(l):
        return len(l) % 2 != 0

    def merge_globs_rec(globs):
        """
        :type globs: list[set[GlobSolution]]
        :rtype: list[set[GlobSolution]]
        """
        if len(globs) <= 1:
            return globs
        if is_odd_len(globs):
            merged_globs = [globs[0]] + merge_globs_rec(globs[1:])
            return merge_globs_rec(merged_globs)
        i = iter(globs)
        res = [merge_two_globs_proposals(ls, rs, blacklist) for ls, rs in zip(i, i)]
        return merge_globs_rec(res)

    if not whitelist:
        return []

    start = [{GlobSolution(Glob.from_string(s))} for s in whitelist]
    res = merge_globs_rec(start)[0]
    best_globs = sorted(res, key=lambda s: s.complexity())[0]
    return best_globs.str_set()


def merge_two_globs_proposals(ls, rs, blacklist):
    """
    :type ls: set[GlobSolution]
    :type rs: set[GlobSolution]
    :rtype: set[GlobSolution]

    Generates a set of all merged glob proposals. All results match the union of ls and rs.
    """

    proposals = set()
    for l, r in product(ls, rs):
        proposals.update(l.merge_solutions(r, blacklist))
    return set(sorted(proposals, key=lambda s: s.complexity())[:3])



class GlobSolution(object):
    """represents one solution of multiple globs"""
    def __init__(self, globs):
        """:type globs: set[Glob] | Glob"""
        if isinstance(globs, Glob):
            self.globs = frozenset({globs})
        elif isinstance(globs, frozenset):
            self.globs = globs
        elif isinstance(globs, set):
            self.globs = frozenset(globs)
        else:
            assert False

    def merge_solutions(self, rs, blacklist):
        """
        :type ls: GlobSolution
        :type rs: GlobSolution
        :rtype: set[GlobSolution]

        Generate lots of solutions for these two solutions. All results match both input solutions.
        """

        ret = []
        for l, r in product(self.globs, rs.globs):
            merges = l.merge(r, blacklist)
            for merge in merges:
                merge_set = set(merge.globs)

                ls_no_l = set(self.globs).difference({l})
                rs_no_r = set(rs.globs).difference({r})

                merge_set.update(ls_no_l)
                merge_set.update(rs_no_r)
                ret.append(GlobSolution(merge_set))

        return set(sorted(ret, key=lambda s: s.complexity())[:4])

    def __str__(self):
        return 'GlobSolution({})'.format(str(self.globs))

    def complexity(self):
        return 100 * len(self.globs) + sum((g.complexity() for g in self.globs))

    def __hash__(self):
        return hash(self.globs)

    def __eq__(self, other):
        return self.globs == other.globs

    def str_set(self):
        return frozenset(map(str, self.globs))


@total_ordering
class Glob(object):
    T_Char = 1
    T_Any = 2
    T_One = 3
    T_Range = 4

    def __init__(self, elems=None):
        """:type elems: list | tuple"""
        if elems is None:
            self.elems = tuple()
        elif isinstance(elems, Glob):
            self.elems = elems.elems
        elif isinstance(elems, list):
            self.elems = tuple(elems)
        else:
            assert isinstance(elems, tuple)
            self.elems = elems

    @staticmethod
    def from_string(s):
        return Glob([(Glob.T_Char, c) for c in s])

    @staticmethod
    def make_range_string(r):
        """
        Generates strings like "a-c" or "abde" or "1-5e-g"
        :param r:
        :return:
        """
        def split_chunks(l):
            ret = [[l[0]]]
            for c in l[1:]:
                if ret[-1][-1] == c - 1:
                    ret[-1].append(c)
                else:
                    ret.append([c])
            return ret

        l = sorted(map(ord, r))
        chunks = split_chunks(l)
        return ''.join([
            ''.join(map(chr, chunk)) if len(chunk) <= 2 else '{}-{}'.format(
                chr(chunk[0]), chr(chunk[-1]))
            for chunk
            in chunks
            ])

    def __str__(self):
        """Returns a string representation of this glob."""
        def mk1(elem):
            return {
                Glob.T_Char: lambda: elem[1],
                Glob.T_Any: lambda: '*',
                Glob.T_One: lambda: '?',
                Glob.T_Range: lambda: '[{}]'.format(self.make_range_string(elem[1])),
            }[elem[0]]()
        return ''.join(map(mk1, self.elems))

    def __getitem__(self, val):
        ret = self.elems.__getitem__(val)
        if isinstance(ret, list):
            return Glob(ret)
        if isinstance(ret, tuple) and (not ret or isinstance(ret[0], tuple)):
            return Glob(ret)
        if isinstance(ret, Glob):
            return ret
        assert isinstance(ret, tuple)
        return ret

    def __eq__(self, other):
        return self.elems == other.elems

    def __lt__(self, other):
        return self.elems < other.elems

    def __hash__(self):
        return hash(self.elems)

    def complexity(self):
        """Returns a complexity indicator. Simple glob expressions are preferred."""
        def complexity1(index, e):
            ret = {
                Glob.T_Char: lambda: 0.0,
                Glob.T_Any: lambda: 1.0,
                Glob.T_One: lambda: 2.0,
                Glob.T_Range: lambda: max(3, len(self.make_range_string(e[1]))), # pefer small
            }[e[0]]()
            if e[0] != Glob.T_Char and index != len(self) - 1:
                ret += 0.5  # Prefer globing last character
            return ret

        return sum((complexity1(index, elem) for index, elem in  enumerate(self.elems)))

    def merge(self, r, blacklist):
        """
        Merges this glob with `r`. Filters all solutions that violate the blacklist.

        :type r: Glob
        :rtype: set[GlobSolution]
        :raise ValueError: If either self or r matches the blacklist.
        """
        for e in [self, r]:
            if any((fnmatch.fnmatch(black, str(e)) for black in blacklist)):
                raise ValueError('Glob "{}" already matches blacklist.'.format(e))

        merged = self.merge_all(r)
        ok = {e for e in merged if not any((fnmatch.fnmatch(black, str(e)) for black in blacklist))}
        ok = sorted(ok, key=Glob.complexity)[:3]
        if not ok:
            return {GlobSolution({self, r})}
        else:
            return {GlobSolution(e) for e in ok}

    def merge_all(self, r):
        """:rtype: set[Glob]"""
        if self == r:
            return {self}
        if not self or not r:
            return {self.merge_any(r)}

        prefix = self.commonprefix(r)
        suffix = self.commonsuffix(r[len(prefix):])
        mid_l = self[len(prefix):len(self)-len(suffix)]
        mid_r = r[len(prefix):len(r)-len(suffix)]

        def fix(merged):
            if merged is None:
                return None
            return prefix + merged + suffix

        ret = set()
        ret.add(fix(mid_l.merge_any(mid_r)))
        ret.update(map(fix, mid_l.merge_one(mid_r)))
        range_merged = mid_l.merge_range(mid_r)
        if range_merged is not None:
            ret.update(map(fix, mid_l.merge_range(mid_r)))
        if None in ret:
            ret.remove(None)
        return ret
        pass

    def __add__(self, other):
        return Glob(self.elems + other.elems)

    def __nonzero__(self):
        return bool(self.elems)

    def __len__(self):
        return len(self.elems)

    def merge_any(self, r):
        if not self and not r:
            return Glob()
        return Glob([(Glob.T_Any, )])

    def merge_one(self, r):
        l = min(len(self), len(r))
        ones = tuple([(Glob.T_One, )] * l)
        ends = self[l:].merge_all(r[l:])
        return {Glob(ones + merged.elems) for merged in ends}

    def merge_range(self, r):
        def combine_range_char(r, c):
            return Glob.T_Range, frozenset(r[1].union({c[1]}))

        def combine_ranges(r1, r2):
            return Glob.T_Range, frozenset(r1[1].union(r2[1]))

        def one(e1, e2):
            t_1 = e1[0]
            t_2 = e2[0]
            if t_1 == Glob.T_Char and t_2 == Glob.T_Char:
                if e1[1] != e2[1]:
                    return Glob.T_Range, frozenset({e1[1], e2[1]})
                else:
                    return Glob.T_Char, e2[1]
            if t_1 == Glob.T_Range and t_2 == Glob.T_Char:
                return combine_range_char(e1, e2)
            if t_1 == Glob.T_Char and t_2 == Glob.T_Range:
                return combine_range_char(e2, e1)
            if t_1 == Glob.T_Range and t_2 == Glob.T_Range:
                return combine_ranges(e1, e2)
            return None

        length = min(len(self), len(r))
        ranges = [one(e1, e2) for e1, e2 in zip(self[:length], r[:length])]
        if any([range is None for range in ranges]):
            return None
        ends = self[length:].merge_all(r[length:])
        return {Glob(tuple(ranges) + merged.elems) for merged in ends}

    def commonsuffix(self, r):
        return self[::-1].commonprefix(r[::-1])[::-1]

    def commonprefix(self, r):
        return Glob(commonprefix([self, r]))

    def has_special(self):
        return any((elem[0] != Glob.T_Char) for elem in self.elems)

    def __repr__(self):
        return 'Glob(({}))'.format(', '.join([repr(elem) for elem in self.elems]))
