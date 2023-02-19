jQuery.noConflict();

(function ($, PLUGIN_ID) {
  'use strict';

  // Get plug-in configuration settings
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);

  // Record List Event
  kintone.events.on('app.record.index.show', function (event) {
    const records = event.records;

    // Get the element of the Blank space field
    var se = kintone.app.getHeaderMenuSpaceElement();

    // Create button
    var str = config.val;
    if (typeof str !== 'undefined' && str != '') {
      const val = JSON.parse(str);
      const appId = val.app_id
      
      // Create button
      var btn = document.createElement('button');
      btn.appendChild(document.createTextNode(' Generate 302 '));
      se.appendChild(btn);

      btn.onclick = async () => {
        var fields = '&fields[0]=Contact_Name';

        kintone.api(kintone.api.url('/k/v1/records', true) + '?app=' + appId + fields, 'GET', {}, function (resp) {
          // success
          console.log(resp);
          $('#tbody').empty()
          resp.records.forEach((element, i) => {
            const name = element.Contact_Name.value
            const checked = (selected == 'undefined' || selected == null) ? false : selected.includes(name)
            $('#tbody').append('<tr><td>' + (i + 1) + '</td>'
              + '<td>' + name + '</td>'
              + '<td><input type="checkbox" value = "' + name + '"' + (checked ? ' checked' : '') + '></td></tr>');
          });
  
        }, function (error) {
          // error
          console.log(error);
        });
      }
    }
  });

})(jQuery, kintone.$PLUGIN_ID);
