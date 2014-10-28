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

from django.contrib.auth.models import User
from rest_framework import serializers, viewsets
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from volumes.models import FileSystemVolume

# Serializers define the API representation.
class FsvSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileSystemVolume

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    volumes = serializers.HyperlinkedIdentityField(view_name='user-volumes', format='html')

    class Meta:
        model = User
        fields = ('url', 'id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff',
                  'is_superuser', 'last_login', 'date_joined', 'volumes')

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_fields = ('username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'first_name', 'last_name', 'email')

    @detail_route()
    def volumes(self, request, *args, **kwargs):
        user = self.get_object()
        vols = FileSystemVolume.objects.filter(owner=user)
        serializer = FsvSerializer(vols, many=True, context={'request': request})
        return Response(serializer.data)

RESTAPI_VIEWSETS = [
    ('users', UserViewSet),
]
