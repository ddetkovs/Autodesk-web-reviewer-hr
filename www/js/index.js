
var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE1LTA4LTExLTAwLTIxLTI2LWhyZG1vd2d3ejhpb3N0anVlbGR3c3gxaXZ6eW0vUm9ib3RBcm0uZHdmeA==';

$(document).ready(function () {
	getToken(function(token) {
		console.log(token);
	  var options = {

	    'document' : 'urn:'+defaultUrn,

	    'env':'AutodeskStaging',

	    'getAccessToken': function() { return token },

	    'refreshToken': function() { return token }

	  };

	  var viewerElement = document.getElementById('viewer');

	  var viewer = new Autodesk.Viewing.Viewer3D(viewerElement, {});

	  Autodesk.Viewing.Initializer(options,function() {

	    viewer.initialize();
	    createChannel('221sad', token);
	    loadComments(token);
	    loadDocument(viewer, options.document);

	  });
	});
});

function onError(error) {
    console.log('Error: ' + error);
};


function createChannel(name, token) {
  $.ajax({
    url: 'http://livereview.com:3000/api/createchannel',
    type: 'POST',
    data: JSON.stringify({'name' : name}),
    contentType: 'application/json',
    success: function(data) {
      console.log(data);
    },
    error: function(err) {
      console.error(err);
    },
    complete: function() {
    }
  });
}


// This method returns a valid access token  For the Quick Start we are just returning the access token

// we obtained in step 2.  In the real world, you would never do this.

function getToken(callback) {

  $.ajax({
    url: 'http://livereview.com:3000/api/token',
    type: 'GET',
    contentType: 'application/json',
    success: function(data) {
      callback(JSON.parse(data).access_token);
    },
    error: function(err) {
      console.error(err);
    },
    complete: function() {
    }
  });

}

function postComment() {
	var text = $('#commentText')[0].value;
	getToken(function(token) {
		$.ajax({
		    url: 'https://developer-stg.api.autodesk.com/comments/v2/resources/'+defaultUrn,
		    type: 'POST',
		    data: JSON.stringify({
		    	body: text
		    }),
		    contentType: 'plain/text',
		    headers: {"Access-Control-Allow-Origin": '*', Authorization: "Bearer "+token },
		    success: function(data) {
		      console.log('loaded comments');
		      // Don't bother if we have nothing to work with
		      if (!data.results || !data.results.length) { return; }

		      $('#comments').empty();

		      for(var i = 0; i<data.results; i++) {
		        var elem = $('<div></div>');
		        elem.text = data.results[i];
		        $('#comments').append(elem)
		      }

		    },
		    error: function(err) {
		      console.error(err);
		    },
		    complete: function() {
		    }
	  	});
	  	loadComments(token);
  });
}

function loadComments(token) {
  $.ajax({
    url: 'https://developer-stg.api.autodesk.com/comments/v2/resources/'+defaultUrn,
    type: 'GET',
    contentType: 'application/json',
    headers: {"Access-Control-Allow-Origin": '*', Authorization: "Bearer "+token },
    success: function(data) {
      console.log('loaded comments');
      // Don't bother if we have nothing to work with

      $('#comments').empty();
      console.log(data);
      for(var i = 0; i<data.length; i++) {
      	console.log('asdasd');
        var elem = $('<div class="comment">'+data[i].body+'</div>');
        $('#comments').append(elem);
      }

    },
    error: function(err) {
      console.error(err);
    },
    complete: function() {
    }
  });
}


function loadDocument(viewer, documentId) {
    // Find the first 3d geometry and load that.
    Autodesk.Viewing.Document.load(documentId, function(doc) {// onLoadCallback
    var geometryItems = [];
    geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
        'type' : 'geometry',
        'role' : '3d'
    }, true);

    if (geometryItems.length > 0) {
        viewer.load(doc.getViewablePath(geometryItems[0]));
    }
 }, function(errorMsg) {// onErrorCallback
    alert("Load Error: " + errorMsg);
    });
}