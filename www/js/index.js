(function(window) {
  var hostname = 'http://bootcamp1.autodesk.com:3000';
  var defaultUrn = '';
  var token;
  var pubnub = PUBNUB({
    subscribe_key: 'sub-c-6def75da-404e-11e5-9f25-02ee2ddab7fe', // always required
    publish_key: 'pub-c-7d98d445-8a56-4c0f-b8f8-19bf18192bc1' // only required if publishing
  });
  var viewer;

  $(document).ready(function() {
    // initViewer();

    $('#viewsel').change(function(){
      changeModel(this.value)
    });

    $('#comment-btn').click(function(){
      postComment();
    });

    loadUrns();
  });


  function initViewer() {

    getToken(function(t) {
      var options = {

        'document': 'urn:' + defaultUrn,

        'env': 'AutodeskStaging',

        'getAccessToken': function() {
          return token
        },

        'refreshToken': function() {
          return token
        }

      };

      var viewerElement = document.getElementById('viewer');

      viewer = new Autodesk.Viewing.Viewer3D(viewerElement, {});
      loadComments(token);

      Autodesk.Viewing.Initializer(options, function() {

        viewer.initialize();
        loadComments(token);
        pubnub.subscribe({
          channel: defaultUrn,
          message: function(m) {
            console.log(m);
            loadComments(token)
          },
          error: function(error) {
            // Handle error here
            console.log(JSON.stringify(error));
          }
        });
        loadDocument(viewer, options.document);

      });
    });
  }

  function onError(error) {
    console.log('Error: ' + error);
  }

  function loadUrns() {
    $('#viewsel').empty();
    $('#viewsel').append('<option value="" selected></option>');

    $.ajax({
      url: hostname + '/api/geturns',
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      success: function(data) {
        data = JSON.parse(data);
        if (data.length) {
          for (var i = 0; i < data.length; i++) {
            console.log(data[i]);
            var itemval = $('<option value="' + data[i] + '">file' + i + '</option>');
            $('#viewsel').append(itemval);
          }
          // changeModel(data[i - 1]);
        }
      },
      error: function(err) {
        console.error('errpr:', err);
      },
      complete: function() {}
    });
  }

  // This method returns a valid access token  For the Quick Start we are just returning the access token
  // we obtained in step 2.  In the real world, you would never do this.

  function changeModel(urn) {
    viewer !== undefined && viewer.uninitialize();
    console.log('Loading urn: ', urn);
    defaultUrn = urn;
    initViewer();
  }

  function refreshToken(callback) {

  }

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
          console.error('errpr:', err);
        },
        complete: function() {}
      });
    }
  }

  function postComment() {
    var text = $('#commentText')[0].value;
    getToken(function(token) {
      $.ajax({
        url: hostname + '/api/comment',
        type: 'POST',
        data: JSON.stringify({
          token: token,
          text: text,
          urn: defaultUrn
        }),
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        success: function(data) {
          console.log('data', data);
          loadComments(token);
        },
        error: function(err) {
          console.error(err);
        },
        complete: function() {}
      });
    });
    $('#commentText')[0].value = '';
  }

  function loadComments(token) {
    console.log(token);
    $.ajax({
      url: 'https://developer-stg.api.autodesk.com/comments/v2/resources/' + defaultUrn,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        Authorization: 'Bearer ' + token
      },
      success: function(data) {
        console.log('loaded comments');
        // Don't bother if we have nothing to work with

        $('#comments').empty();
        console.log(data);
        for (var i = 0; i < data.length; i++) {
          console.log('asdasd');
          var elem = $('<div class="comment">' + data[i].body + '</div>');
          $('#comments').append(elem);
        }

      },
      error: function(err) {
        console.error(err);
      },
      complete: function() {}
    });
  }


  function loadDocument(viewer, documentId) {
    // Find the first 3d geometry and load that.
    Autodesk.Viewing.Document.load(documentId, function(doc) { // onLoadCallback
      var geometryItems = [];
      geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
        'type': 'geometry',
        'role': '3d'
      }, true);

      if (geometryItems.length > 0) {
        viewer.load(doc.getViewablePath(geometryItems[0]));
      }
    }, function(errorMsg) { // onErrorCallback
      console.log('Load Error: ' + errorMsg);
    });
  }
}(window));
