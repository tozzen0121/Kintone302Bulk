jQuery.noConflict();

(function ($, PLUGIN_ID) {
  'use strict';

  // Get plug-in configuration settings
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  var configVal = {}
  var checkFields = []

  if (config) {
    var str = config.val;
    if (typeof str !== 'undefined' && str != '') {
      configVal = JSON.parse(str);
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

  const addRecord = (name) => {
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
      console.log(resp);
    }, function (error) {
      console.log(error);
    });
  }

  const getAllRecords = () => {
    fetch_fast().then(function (records) {
      allRecords = records
    });
  }

  const fetch_fast = (opt_last_record_id, opt_records) => {
    var records = opt_records || [];
    var query = opt_last_record_id ? '$id > ' + opt_last_record_id : '';
    query += ' order by $id asc limit 500';
    var params = {
      app: configVal.app_id,
      query: query,
      fields: ['$id', 'Contact_Name']
    };
    return kintone.api('/k/v1/records', 'GET', params).then(function (resp) {
      records = records.concat(resp.records);
      if (resp.records.length === 500) {
        /* If the maximum number of retrievable records was retrieved, there is a possibility that more records exist.
          Therefore, the next 500 records that have a record number larger than the last retrieved record are retrieved.
          Since the records are retrieved all at once in ascending record number order,
          it is possible to retrieve the next 500 records with these conditions.
        */
        return fetch_fast(resp.records[resp.records.length - 1].$id.value, records);
      }
      return records;
    });
  }

  // Record List Event
  kintone.events.on('app.record.index.show', function (event) {
    const records = event.records;

    // Get the element of the Blank space field
    var se = kintone.app.getHeaderMenuSpaceElement();

    // Create button
    var str = config.val;
    if (typeof str !== 'undefined' && str != '') {
      // Create button
      var btn = document.createElement('button');
      btn.appendChild(document.createTextNode(' Generate 302 '));
      se.appendChild(btn);

      btn.onclick = async () => {
        if (!confirm("Are you sure to generate 302 records with currently setting?")) {
          return
        }

        fetch_fast().then(function (records) {
          console.log('total record count =>', records.length)
          for (var i = 0; i < records.length; i++) {
            const element = records[i]
            const name = element.Contact_Name.value
            if (name != '') {
              addRecord(name)
            }
          }
          alert("Done, Please refresh page and then check them.")
        });

        // var fields = '&fields[0]=Contact_Name';

        // kintone.api(kintone.api.url('/k/v1/records', true) + '?app=' + appId + fields, 'GET', {}, function (resp) {
        //   // success
        //   const records = resp.records
        //   console.log('total record count =>', records.length)
        //   for (var i = 0; i < records.length; i++) {
        //     const element = records[i]
        //     const name = element.Contact_Name.value
        //     if (name != '') {
        //       addRecord(name)
        //     }
        //   }
        //   alert("Done, Please refresh page and then check them.")
        // }, function (error) {
        //   // error
        //   console.log(error);
        // });
      }
    }
  });

})(jQuery, kintone.$PLUGIN_ID);
