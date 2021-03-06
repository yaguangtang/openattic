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

import _ from "lodash";

class CephRgwUserFormCapabilityModal {
  constructor () {
    this.editing = false;
    this.cap = {};
  }

  $onInit () {
    this.user = this.resolve.user;
    this.index = this.resolve.index;

    if (!_.isNumber(this.index)) { // Add
      this.editing = false;
    } else { // Edit
      this.editing = true;
      this.cap = _.cloneDeep(this.user.caps[this.index]);
    }
  }

  submitAction (form) {
    if (this.editing) { // Edit
      if (form.$valid === true) {
        this.modalInstance.close({
          "action": "modify",
          "data": this.cap
        });
      }
    } else { // Add
      if (form.$valid === true) {
        this.modalInstance.close({
          "action": "add",
          "data": this.cap
        });
      }
    }
  }

  /**
   * Get a list of types that should be displayed.
   */
  enumTypes () {
    let result = [];
    if (this.editing) {
      result.push(this.cap.type);
    } else {
      let usedTypes = [];
      this.user.caps.forEach((cap) => {
        usedTypes.push(cap.type);
      });
      ["users", "buckets", "metadata", "usage", "zone"].forEach((type) => {
        if (usedTypes.indexOf(type) < 0) {
          result.push(type);
        }
      });
    }
    return result;
  }

  cancelAction () {
    this.modalInstance.dismiss("close");
  }
}

export default {
  template: require("./ceph-rgw-user-form-capability-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephRgwUserFormCapabilityModal
};
