var helpers = require('../../common.js');

describe('CommandLogs', function(){
  beforeAll(function(){
    helpers.login();
    helpers.setLocation('commandlog');
    browser.sleep(400);
  });

  it('should display oadatatable', function(){
    expect(element(by.css('.tc_oadatatable_cmdlog')).isDisplayed()).toBe(true);
  });

  it('should have a delete by date button', function(){
    expect(element(by.css('.tc_deleteByDateBtn')).isDisplayed()).toBe(true);
  });

  it('should have a delete button', function(){
    element(by.css('.tc_menudropdown')).click();
    expect(element(by.css('.tc_deleteBtn')).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    console.log('cmdlogs -> cmdLogs.e2e.js');
  });
});
