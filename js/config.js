jQuery.noConflict();

(function ($, PLUGIN_ID) {
  'use strict';

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  var activeDay = 0
  var selectedMems = []
  var fieldInfos = []
  var lookupInfo = null
  var appId = -1


  const escapeHtml = (htmlstr) => {
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  const loadConfig = () => {
    if (config) {
      var str = config.val;
      if (typeof str !== 'undefined' && str != '') {
        var val = JSON.parse(str);
        console.log(val)

        appId = val.app_id
        selectedMems = val.absent

        $('#mon').text(val.mon_prefix)
        $('#tue').text(val.tue_prefix)
        $('#wed').text(val.wed_prefix)
        $('#thr').text(val.thr_prefix)
        $('#fri').text(val.fri_prefix)
        $('#sat').text(val.sat_prefix)
        $('#sun').text(val.sun_prefix)

        $('#mon_desc').text(selectedMems[0]?.join(' : '))
        $('#tue_desc').text(selectedMems[1]?.join(' : '))
        $('#wed_desc').text(selectedMems[2]?.join(' : '))
        $('#thr_desc').text(selectedMems[3]?.join(' : '))
        $('#fri_desc').text(selectedMems[4]?.join(' : '))
        $('#sat_desc').text(selectedMems[5]?.join(' : '))
        $('#sun_desc').text(selectedMems[6]?.join(' : '))

        const date = val.mon_date
        $('#mon_date').val(date)
      }
    }
  }

  const setDropdown = () => {
    var url = kintone.api.url("/k/v1/preview/app/form/fields", true);
    var body = {
      app: kintone.app.getId()
    };
    return kintone.api(url, "GET", body).then(function (resp) {
      var obj = resp.properties;
      for (var i in obj)
        fieldInfos.push(obj[i]);

      for (let i = 0; i < fieldInfos.length; i++) {
        const prop = fieldInfos[i];
        if (typeof prop.lookup !== "undefined") {
          const $option = $('<option>');
          const val = prop.code;
          console.log(prop)

          $option.attr('value', escapeHtml(val));
          $option.text(escapeHtml(val));
          $('#select_fields').append($option.clone());

          if (prop.lookup.relatedApp.app == appId) {
            lookupInfo = prop.lookup
            // $('#select_fields').text(val)
            $('#select_fields').val(val)
          }
        }
      }

    });
  };

  $(document).ready(() => {
    loadConfig()
    setDropdown()

    $('#mon_pick').click(() => {
      pick(0)
    })

    $('#tue_pick').click(() => {
      pick(1)
    })

    $('#wed_pick').click(() => {
      pick(2)
    })

    $('#thr_pick').click(() => {
      pick(3)
    })

    $('#fri_pick').click(() => {
      pick(4)
    })

    $('#sat_pick').click(() => {
      pick(5)
    })

    $('#sun_pick').click(() => {
      pick(6)
    })

    $('#select_fields').on('change', function () {
      const val = this.value

      lookupInfo = fieldInfos.find((e) => {
        return e.code == val
      })

      if (typeof lookupInfo != undefined) {
        appId = lookupInfo.lookup.relatedApp.app
      }
    });

    const pick = (index) => {
      activeDay = index
      const selected = selectedMems[activeDay]

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

      $("#selectModal").modal("toggle");
    }

    $('#select_modal_ok').click(() => {
      var checked = $('#records input:checkbox:checked')
      var selected = []
      checked.each((element, prop) => {
        selected.push(prop.value)
      })

      selectedMems[activeDay] = selected
      const count = selected.length
      var desc = countselected.join(' : ')

      if (activeDay == 0) {
        $('#mon_desc').text(desc)
      } else if (activeDay == 1) {
        $('#tue_desc').text(desc)
      } else if (activeDay == 2) {
        $('#wed_desc').text(desc)
      } else if (activeDay == 3) {
        $('#thr_desc').text(desc)
      } else if (activeDay == 4) {
        $('#fri_desc').text(desc)
      } else if (activeDay == 5) {
        $('#sat_desc').text(desc)
      } else if (activeDay == 6) {
        $('#sun_desc').text(desc)
      }

      $("#selectModal").modal("toggle");
    })

    $('#save').click(() => {
      var val = {}
      if (appId == -1) {
        alert('Please select valid lookup field')
        return
      }

      const date = $('#mon_date').val()
      const monDate = new Date(date)
      if (!(monDate instanceof Date) || isNaN(monDate)) {
        alert('Please select Monday')
        return
      }

      val.app_id = appId
      val.lookup_code = lookupInfo.code
      val.mon_date = date
      val.mon_prefix = $('#mon').text()
      val.tue_prefix = $('#tue').text()
      val.wed_prefix = $('#wed').text()
      val.thr_prefix = $('#thr').text()
      val.fri_prefix = $('#fri').text()
      val.sat_prefix = $('#sat').text()
      val.sun_prefix = $('#sun').text()
      val.absent = selectedMems

      console.log(val)

      var stringVal = JSON.stringify(val);
      const c = {};
      c.val = stringVal;

      kintone.plugin.app.setConfig(c);
    })

  });

})(jQuery, kintone.$PLUGIN_ID);
