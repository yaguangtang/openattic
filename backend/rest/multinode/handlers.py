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

import requests, json

from collections import OrderedDict

from rest_framework.response import Response
from rest_framework.request import Request

from ifconfig.models import Host

class RequestHandlers(object):

    def retrieve(self, request, view_name=None, *args, **kwargs):
        obj = self.get_object()
        host = self._get_object_host(obj)
        current_host = Host.objects.get_current()

        if host == current_host:
            if view_name:
                local_view = getattr(super(RequestHandlers, self), view_name)
                return local_view(request, args, kwargs)

            return super(RequestHandlers, self).retrieve(request, args, kwargs)

        return Response(json.loads(self._remote_request(request, host, obj, view_name)))

    def list(self, request, *args, **kwargs):
        queryset_total = self.get_queryset()
        queryset = self.filter_queryset(queryset_total)
        queryset = self.paginate_queryset(queryset)

        current_host = Host.objects.get_current()

        results = []
        for obj in queryset:
            host = self._get_object_host(obj)
            if host == current_host:
                serializer = self.get_serializer(obj)
                results.append(serializer.data)
            else:
                results.append(json.loads(self._remote_request(request, host, obj)))

        next_page = None
        prev_page = None

        ip = current_host.get_primary_ip_address().host_part

        if queryset.has_next():
            next_page = '%s?ordering=%s&page=%s&page_size=%s' % (self._get_base_url(ip),
                                                                 request.QUERY_PARAMS['ordering'],
                                                                 queryset.next_page_number(),
                                                                 request.QUERY_PARAMS['page_size'])
        if queryset.has_previous():
            prev_page = '%s?ordering=%s&page=%s&page_size=%s' % (self._get_base_url(ip),
                                                                 request.QUERY_PARAMS['ordering'],
                                                                 queryset.previous_page_number(),
                                                                 request.QUERY_PARAMS['page_size'])

        return Response(OrderedDict([
            ('count',       queryset.paginator.count),
            ('next',        next_page),
            ('previous',    prev_page),
            ('results',     results)
        ]))

    def create(self, request, *args, **kwargs):
        host = self._get_reqdata_host(request.DATA)

        if host == Host.objects.get_current():
            return super(RequestHandlers, self).create(request, args, kwargs)

        return Response(json.loads(self._remote_request(request, host)))

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        host = self._get_object_host(obj)

        if host == Host.objects.get_current():
            return super(RequestHandlers, self).destroy(request, args, kwargs)

        return Response(self._remote_request(request, host, obj))

    def update(self, request, *args, **kwargs):
        obj = self.get_object_or_none()

        if obj is None:
            return self.create(request, args, kwargs)

        host = self._get_object_host(obj)
        if host == Host.objects.get_current():
            return super(RequestHandlers, self).update(request, args, kwargs)

        return Response(json.loads(self._remote_request(request, host, obj)))

    def _remote_request(self, request, host, obj=None, view_name=None):
        ip = host.get_primary_ip_address().host_part

        if obj:
            url = '%s/%s' % (self._get_base_url(ip), str(obj.id))
        else:
            url = self._get_base_url(ip)

        if view_name:
            url = '%s/%s' % (url, view_name)

        header = self._get_auth_header(request)
        header['content-type'] = 'application/json'

        current_host = Host.objects.get_current()
        data = dict(request.DATA, proxy_host_id=current_host.id)

        response = requests.request(request.method, url, data=json.dumps(data), headers=header)
        response.raise_for_status()
        return response.text

    def _get_base_url(self, ip):
        return 'http://%s/openattic/api/%s' % (ip, self.api_prefix)

    def _get_object_host(self, obj):
        try:
            host_filter = self.get_queryset().model.objects.hostfilter
        except AttributeError:
            return obj.host
        else:
            host = obj
            for field in host_filter.split('__'):
                host = getattr(host, field)
                if isinstance(host, Host):
                    return host

    def _get_reqdata_host(self, data):
        host_filter = self.host_filter.split('__')

        try:
            return self.model.objects.get(id=data[host_filter[0]]['id']).host
        except:
            target_model = self.model._meta.get_field_by_name(host_filter[0])[0].related.parent_model

            if target_model == Host:
                return Host.objects.get(id=data[host_filter[0]]['id'])
            else:
                try:
                    host = target_model.all_objects.get(id=data[host_filter[0]]['id'])
                except target_model.DoesNotExist:
                    key = host_filter.pop(0)

                    target_model = target_model._meta.get_field_by_name(host_filter[0])[0].related.parent_model
                    host = target_model.all_objects.get(id=data[key]['id'])

                for field in host_filter[1:]:
                    host = getattr(host, field)
                    if isinstance(host, Host):
                        return host

    def _get_auth_header(self, request):
        auth_token = request.user.auth_token.key
        return {'Authorization': 'Token %s' % auth_token}

    def _clone_request_with_new_data(self, request, data):
        clone = Request(request=request._request,
                        parsers=request.parsers,
                        authenticators=request.authenticators,
                        negotiator=request.negotiator,
                        parser_context=request.parser_context)
        clone._data = data
        clone._files = request._files
        clone._content_type = request._content_type
        clone._stream = request._stream
        clone._method = request._method
        if hasattr(request, '_user'):
            clone._user = request._user
        if hasattr(request, '_auth'):
            clone._auth = request._auth
        if hasattr(request, '_authenticator'):
            clone._authenticator = request._authenticator

        return clone
