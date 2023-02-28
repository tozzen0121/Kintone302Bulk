jQuery.noConflict();

(function ($, PLUGIN_ID) {
  'use strict';

  // Get plug-in configuration settings
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  var configVal = {}
  var checkFields = []
  var allRecords = []
  var absentMembers = []

  const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  if (config) {
    var str = config.val;
    if (typeof str !== 'undefined' && str != '') {
      configVal = JSON.parse(str);
      absentMembers = configVal.absent
    }
    console.log('config', configVal)

    var url = kintone.api.url("/k/v1/preview/app/form/fields", true);
    var body = {
      app: kintone.app.getId()
    };

    kintone.api(url, "GET", body).then(function (resp) {
      const fields = Object.values(resp.properties);
      fields.forEach((field) => {
        if (field.type == "CHECK_BOX") {
          checkFields.push(field.code)
        }
      });
      console.log('checkboxs', checkFields)
    });

    getAllRecords()
  }

  function saveConfig() {
    console.log("preare saving configure")

    var stringVal = JSON.stringify(configVal);
    const c = {};
    c.val = stringVal;

    // seems not working....
    kintone.plugin.app.setConfig(c, ()=> {
      console.log("saved configure")
    });
  }


  function showIndicator() {
    // Initialize
    if ($('.activity-indicator').length === 0) {
      // Create elements for the spinner and the background of the spinner
      const spin_div = $('<div class="activity-indicator"></div>');

      // Append spinner to the body
      $(document.body).append(spin_div);
    }

    // Display the spinner
    $('.activity-indicator').show();
  }

  function hideIndicator() {
    $('.activity-indicator').hide();
  }

  const validatePrefix = (val, def) => {
    if (val != null && val != 'undefined' && val != '') {
      return val
    }
    return def
  }

  const getFieldQuery = (index, check) => {
    if (!check) {
      return null
    }

    var prefix = ''
    if (index == 0) {
      prefix = validatePrefix(configVal.mon_prefix, 'monday')
    } else if (index == 1) {
      prefix = validatePrefix(configVal.tue_prefix, 'tuesday')
    } else if (index == 2) {
      prefix = validatePrefix(configVal.wed_prefix, 'wednesday')
    } else if (index == 3) {
      prefix = validatePrefix(configVal.thr_prefix, 'thursday')
    } else if (index == 4) {
      prefix = validatePrefix(configVal.fri_prefix, 'friday')
    } else if (index == 5) {
      prefix = validatePrefix(configVal.sat_prefix, 'saturday')
    }

    if (prefix == '')
      return null

    const filteredFields = checkFields.filter(field => field.includes(prefix))
    if (filteredFields.length == 0)
      return null

    var query = {}
    for (var i = 0; i < filteredFields.length; i++) {
      const field = filteredFields[i]
      query[field] = { value: ['Yes'] }
    }

    return query
  }

  const addRecords = (selected) => {
    selected.forEach((sel, i) => {
      var index = allRecords.findIndex((record) => record.Contact_Name.value == sel)
      if (index != -1) {
        addRecord(sel, (i == selected.length - 1))
      }
    })
  }

  const addRecord = (name, isLast) => {
    var body = {
      app: kintone.app.getId(),
      record: {
        Recipient_s_Name: {
          value: name
        },
        monday: {
          value: configVal.mon_date
        }
      }
    };

    for (var i = 0; i < 6; i++) {
      var absents = configVal.absent[i]
      var query = null
      if (absents == null) {
        query = getFieldQuery(i, true)
      } else {
        var attend = !absents.includes(name)
        query = getFieldQuery(i, attend)
      }

      if (query != null) {
        const keys = Object.keys(query)
        keys.forEach(key => {
          body.record[key] = query[key]
        });
      }

    }


    console.log('REST body', body)

    kintone.api(kintone.api.url('/k/v1/record', true), 'POST', body, function (resp) {
      if (isLast) {
        hideIndicator()
        Swal.fire({
          icon: 'success',
          title: 'Done, Please refresh page and then check them.',
          showConfirmButton: false,
          timer: 3000
        })

        saveConfig()
      }
    }, function (error) {
      console.log(error);
    });
  }

  function getContactQuery(contacts) {
    var query = ''
    for (var i = 0; i < contacts.length; i++) {
      var contact = contacts[i]
      if (i == 0) {
        query += '('
      } else {
        query += ' or '
      }
      query += 'Recipient_s_Name = "' + contact + '"'

      if (i == contacts.length - 1) {
        query += ')'
      }
    }
    if (query != '') {
      query += ' and monday = "' + configVal.mon_date + '"'
    }
    return query
  }


  function fetchFastAll(opt_last_record_id, opt_records) {
    var records = opt_records || [];
    var query = opt_last_record_id ? '$id > ' + opt_last_record_id : '';
    query += (query != '' ? ' and' : '') + ' active_daycare_member = "Daycare Member"'
    query += ' order by $id asc limit 500';
    var params = {
      app: configVal.app_id,
      query: query,
      fields: ['$id', 'Contact_Name', 'active_daycare_member']
    };

    return kintone.api('/k/v1/records', 'GET', params).then(function (resp) {
      records = records.concat(resp.records);
      if (resp.records.length === 500) {
        return fetchFastAll(resp.records[resp.records.length - 1].$id.value, records);
      }
      return records;
    });
  }

  function getAllRecords() {
    fetchFastAll().then(function (records) {
      allRecords = records
    });
  }

  function fetchFastCond(contacts, opt_last_record_id, opt_records) {
    var records = opt_records || [];
    var query = opt_last_record_id ? '$id > ' + opt_last_record_id : '';
    query += (query != '' ? ' and ' : '') + getContactQuery(contacts)
    query += ' order by $id asc limit 500';
    var params = {
      app: kintone.app.getId(),
      query: query,
      fields: ['$id', 'Recipient_s_Name',]
    };
    console.log(params)

    return kintone.api('/k/v1/records', 'GET', params).then(function (resp) {
      records = records.concat(resp.records);
      if (resp.records.length === 500) {
        return fetchFastCond(contacts, resp.records[resp.records.length - 1].$id.value, records);
      }
      return records;
    });
  }

  function getCondRecords(contacts) {
    return fetchFastCond(contacts).then(function (records) {
      return records
    });
  }

  const pickAbsentModal = (index) => {
    const absents = absentMembers[index]
    console.log("picked", absentMembers)

    var table = $('<table id = "pick"> \
    <tr> \
      <th>No</th> \
      <th><input type="text" id="quick_search" placeholder="Quick Search"></th> \
      <th><input type="checkbox" id="check_all"></th> \
    </tr> \
  </table>')

    var container = $('<div class="modal-container"></div>')
    container.append(table)

    var body = $('<div></div>')
    body.append(container)

    allRecords.forEach((element, i) => {
      const name = element.Contact_Name.value
      const checked = (absents == 'undefined' || absents == null) ? false : absents.includes(name)
      table.append('<tr><td>' + (i + 1) + '</td>'
        + '<td>' + name + '</td>'
        + '<td><input type="checkbox" value = "' + name + '"' + (checked ? ' checked' : '') + '></td></tr>');
    });

    Swal.fire({
      title: WEEK[index] + ' Absent',
      html: body,
      showCancelButton: true,
      heightAuto: false,
      padding: '25px 0 25px',
      didOpen: () => {
        $('#check_all').change(function () {
          $('#pick input:checkbox').not(this).prop('checked', $(this).is(":checked"));
        })

        $('#quick_search').on('input', () => {
          var text = $('#quick_search').val().toLowerCase()
          $('#pick > tbody > tr').not(':first').each(function () {
            var val = $(this).find("td:eq(1)").text()
            val.toLowerCase().includes(text) ? $(this).show() : $(this).hide()
          })
        });
      },
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        var selected = [];
        $('#pick tr input:checked').each(function () {
          selected.push($(this).val());
        });

        if (selected.length > 0) {
          absentMembers[index] = selected
        }
      }
    })

  }

  // Record List Event
  kintone.events.on('app.record.index.show', function (event) {
    const records = event.records;

    // Get the element of the Blank space field
    var se = kintone.app.getHeaderMenuSpaceElement();

    // Create plugin elements
    var str = config.val;
    if (typeof str !== 'undefined' && str != '') {
      // create pick date
      var dateMon = document.createElement("input");
      dateMon.type = "date";
      dateMon.name = "mon_date";
      dateMon.id = "mon_date";
      dateMon.style.marginRight = '10px'
      dateMon.value = configVal.mon_date
      dateMon.addEventListener('input', function (evt) {
        configVal.mon_date = evt.target.value
    });

      // Create absents buttons
      var btnMon = document.createElement('button');
      btnMon.appendChild(document.createTextNode('Mo'))
      btnMon.onclick = () => pickAbsentModal(0)

      var btnTue = document.createElement('button');
      btnTue.appendChild(document.createTextNode('Tu'))
      btnTue.onclick = () => pickAbsentModal(1)

      var btnWed = document.createElement('button');
      btnWed.appendChild(document.createTextNode('We'))
      btnWed.onclick = () => pickAbsentModal(2)

      var btnThr = document.createElement('button');
      btnThr.appendChild(document.createTextNode('Th'))
      btnThr.onclick = () => pickAbsentModal(3)

      var btnFri = document.createElement('button');
      btnFri.appendChild(document.createTextNode('Fr'))
      btnFri.onclick = () => pickAbsentModal(4)

      var btnSat = document.createElement('button');
      btnSat.appendChild(document.createTextNode('Se'))
      btnSat.onclick = () => pickAbsentModal(5)

      // Create button
      var btnGen = document.createElement('button');
      btnGen.appendChild(document.createTextNode(' AF Generator '))
      btnGen.style.marginLeft = '10px'

      var div = document.createElement('div');
      div.style.display = 'inline'
      div.style.border = '1px solid #0000FF'
      div.style.padding = '10px'

      div.appendChild(dateMon)
      div.appendChild(btnMon)
      div.appendChild(btnTue)
      div.appendChild(btnWed)
      div.appendChild(btnThr)
      div.appendChild(btnFri)
      div.appendChild(btnSat)
      div.appendChild(btnGen)

      se.appendChild(div)

      btnGen.onclick = async () => {
        var table = $('<table id = "target"> \
          <tr> \
            <th>No</th> \
            <th><input type="text" id="quick_search" placeholder="Quick Search"></th> \
            <th><input type="checkbox" id="check_all"></th> \
          </tr> \
        </table>')

        var container = $('<div class="modal-container"></div>')
        container.append(table)

        var body = $('<div></div>')
        body.append(container)

        allRecords.forEach((element, i) => {
          const name = element.Contact_Name.value
          const checked = false
          table.append('<tr><td>' + (i + 1) + '</td>'
            + '<td>' + name + '</td>'
            + '<td><input type="checkbox" value = "' + name + '"' + (checked ? ' checked' : '') + '></td></tr>');
        });

        Swal.fire({
          title: 'AF Generator',
          html: body,
          showCancelButton: true,
          heightAuto: false,
          padding: '25px 0 25px',
          didOpen: () => {
            $('#check_all').change(function () {
              $('#target input:checkbox').not(this).prop('checked', $(this).is(":checked"));
            })

            $('#quick_search').on('input', () => {
              var text = $('#quick_search').val().toLowerCase()
              $('#target > tbody > tr').not(':first').each(function () {
                var val = $(this).find("td:eq(1)").text()
                val.toLowerCase().includes(text) ? $(this).show() : $(this).hide()
              })
            });

          },
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            showIndicator();

            var selected = [];
            $('#target tr input:checked').each(function () {
              selected.push($(this).val());
            });

            if (selected.length > 0) {
              getCondRecords(selected).then(function (records) {
                var exist = []
                records.forEach((element, i) => {
                  const name = element.Recipient_s_Name.value
                  exist.push(name)
                });
                console.log(exist)

                if (exist.length > 0) {
                  selected = selected.filter(e => !exist.includes(e)); // will return ['A', 'C']
                  console.log(selected)
                  Swal.fire({
                    icon: 'error',
                    title: 'Duplicate',
                    text: 'There are duplicated record(s) in same Monday. They will not generated',
                  }).then(() => {
                    if (selected == 0) {
                      saveConfig()
                      hideIndicator()
                      return
                    }

                    addRecords(selected)
                  })
                } else {
                  addRecords(selected)
                }

              });
            }
          }
        })

      }
    }
  });

})(jQuery, kintone.$PLUGIN_ID);
