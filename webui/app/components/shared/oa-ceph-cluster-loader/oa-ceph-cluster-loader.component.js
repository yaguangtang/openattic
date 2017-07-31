/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic.shared");
app.component("oaCephClusterLoader", {
  templateUrl: "components/shared/oa-ceph-cluster-loader/oa-ceph-cluster-loader.component.html",
  bindings: {
    onClusterLoad: "&"
  },
  transclude: true,
  controller: function (cephClusterService, registryService) {
    var self = this;
    self.loading = false;
    self.loaded = false;

    self.$onInit = function () {
      self.loadCluster();
    };

    self.loadCluster = function () {
      self.loading = true;
      cephClusterService.get().$promise
        .then(function (res) {
          var cluster = res;
          // Update the registry.
          if (angular.isObject(cluster) && cluster.results && cluster.results.length > 0 &&
              angular.isUndefined(registryService.selectedCluster)) {
            registryService.selectedCluster = cluster.results[0];
          }
          // Execute the callback function.
          if (angular.isFunction(self.onClusterLoad)) {
            self.onClusterLoad({cluster: cluster});
          }
          // Finally execute the transclusion.
          self.loaded = res.$resolved;
        }).catch(function (error) {
          self.error = error;
        }).finally(function () {
          self.loading = false;
        });
    };
  }
});