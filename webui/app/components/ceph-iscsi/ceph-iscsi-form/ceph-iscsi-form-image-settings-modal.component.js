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

class CephIscsiFormImageSettingsModal {
  constructor (cephIscsiImageAdvangedSettings) {
    this.image = this.resolve.image;
    this.cephIscsiImageAdvangedSettings = cephIscsiImageAdvangedSettings;

    this.settings = angular.copy(this.image.settings);

    this.advancedSettingsEnabled = cephIscsiImageAdvangedSettings.some((value) => {
      return this.settings.hasOwnProperty(value.property);
    });
  }

  confirm () {
    angular.forEach(this.settings, (value, key) => {
      if (value === "" || value === null) {
        delete this.settings[key];
      } else if (key === "retry_errors" && angular.isString(this.settings[key])) {
        this.settings[key] = angular.fromJson("[" + value + "]");
      }
    });
    if (!this.advancedSettingsEnabled) {
      angular.forEach(this.cephIscsiImageAdvangedSettings, (value) => {
        delete this.settings[value.property];
      });
    }
    this.image.settings = this.settings;
    this.modalInstance.close("confirmed");
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./ceph-iscsi-form-image-settings-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephIscsiFormImageSettingsModal
};
