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

import mock
import operator

from django.db.models import Q
from django.test import TestCase

from nodb.models import NodbQuerySet, NodbModel, DictField
from nodb.restapi import NodbSerializer


class QuerySetTestCase(TestCase):

    @classmethod
    def setUpClass(cls):
        class CephClusterMock(NodbModel):

            @staticmethod
            def get_all_objects(context):
                cluster1 = mock.MagicMock()
                cluster1.fsid = 'e79f3338-f9e4-4656-8af3-7af7357fcd09'
                cluster1.name = 'ceph'

                cluster2 = mock.MagicMock()
                cluster2.fsid = 'e90a0c5a-5caa-405a-bc09-a7cfd1874243'
                cluster2.name = 'vinara'

                cluster3 = mock.MagicMock()
                cluster3.fsid = 'kd89g3lf-sed4-j986-asd3-akf84nchazeb'
                cluster3.name = 'balkan'

                return [cluster1, cluster2, cluster3]

        cls.qs = NodbQuerySet(CephClusterMock)

    def test_kwargs_filter_by_name(self):
        filter_result = self.qs.filter(name='balkan')

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'balkan')
        self.assertEqual(filter_result[0].fsid, 'kd89g3lf-sed4-j986-asd3-akf84nchazeb')

    def test_kwargs_filter_by_id(self):
        filter_result = self.qs.filter(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd09')

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'ceph')
        self.assertEqual(filter_result[0].fsid, 'e79f3338-f9e4-4656-8af3-7af7357fcd09')

    def test_kwargs_filter_name_not_found(self):
        filter_result = self.qs.filter(name='notfound')

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_by_name(self):
        filter_list = [Q(name__icontains='vin'), ]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'vinara')
        self.assertEqual(filter_result[0].fsid, 'e90a0c5a-5caa-405a-bc09-a7cfd1874243')

    def test_args_filter_by_id(self):
        filter_list = [Q(fsid__icontains='kd89g3lf'), ]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'balkan')
        self.assertEqual(filter_result[0].fsid, 'kd89g3lf-sed4-j986-asd3-akf84nchazeb')

    def test_args_filter_by_name_and_id(self):
        filter_list = [Q(fsid__icontains='kd89g3lf'), Q(name__icontains='ce')]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 2)

    def test_args_filter_name_not_found(self):
        filter_list = [Q(name__icontains='notfound')]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_id_not_found(self):
        filter_list = [Q(fsid__icontains='notfound')]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_name_id_not_found(self):
        filter_list = [Q(name__icontains='namenotfound'), Q(fsid__icontains='idnotfound')]
        filter_params = reduce(operator.or_, filter_list)

        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)


class DictFieldSerializerTest(TestCase):

    def test_serializer(self):

        class DictFieldModel(NodbModel):

            @staticmethod
            def get_all_objects():
                self.fail("should not be called")

            my_dict = DictField(primary_key=True)

        class DictFieldModelSerializer(NodbSerializer):
            class Meta:
                model = DictFieldModel

        my_dict = {'foo': 'bar', 'baz': 'baaz'}

        serializer = DictFieldModelSerializer(DictFieldModel(my_dict=my_dict))

        self.assertEqual(serializer.data, {'my_dict': my_dict})
