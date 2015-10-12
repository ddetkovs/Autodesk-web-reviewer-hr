(function(window) {
  var token;

  var hostname = 'http://bootcamp1.autodesk.com:3000';
  function getToken(callback) {
    if (token) {
      callback(token);
    } else {
      $.ajax({
        url: hostname + '/api/readtoken',
        type: 'GET',
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        success: function(data) {
          console.log('data is:', data);
          token = data.access_token;
          callback(token);
        },
        error: function(err) {
          console.log('errpr:', err);
        },
        complete: function() {}
      });
    }
  }

  var objectKey = 0;

  $(document).ready(function() {
    getToken(function() {});
    $('#btnTranslateThisOne').click(function(evt) {
      var files = document.getElementById('files').files;
      if (files.length == 0)
        return;

      $.each(files, function(key, value) {
        var fileInput = document.getElementById('files');
        var file = fileInput.files[0];
        var oReq = new XMLHttpRequest();
        var url = 'https://developer-stg.api.autodesk.com/oss/v2/buckets/bootcamp2team1/objects/' + value.name;
        oReq.open('PUT', url, true);
        oReq.setRequestHeader('Authorization', 'Bearer ' + token);
        oReq.setRequestHeader('Content-Type', 'application/stream');
        oReq.onload = function(oEvent) {
          var objectId = JSON.parse(oReq.responseText).objectId;
          var urn = btoa(objectId);

          $.ajax({
            url: 'https://developer-stg.api.autodesk.com/derivativeservice/v2/registration',
            type: 'POST',
            data: JSON.stringify({
              design: urn
            }),
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            success: function(res) {
              $.ajax({
                url: hostname + '/api/addurn',
                type: 'POST',
                data: JSON.stringify({
                  urn: urn
                }),
                headers: {
                  'Content-Type': 'application/json'
                },
                success: function(res) {
                  console.log(res);
                }
              })
            }
          })

        };

        oReq.send(file);
      });

    });
  });

}(window));
