angular.module('openattic')
  .factory('VolumeService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/volumes/:id', {
      id: '@id'
    }, {
      update: {method: 'PUT'},
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        }
      },
      services: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/services'
      },
      storage: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/storage'
      },
      snapshots: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/snapshots'
      },
      create_snapshot: {
        method: 'POST',
        url: '/openattic/api/volumes/:id/snapshots'
      },
      filter: {
        method: 'GET',
        url: '/openattic/api/volumes'
      }
    });
  })
  .factory('VolumeSnapshotService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/volumes/:volumeId/snapshots', {
      volumeId: '@volumeId'
    }, {
    });
  });
