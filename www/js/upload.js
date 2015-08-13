var token;

var hostname = "http://bootcamp1.autodesk.com";
function getToken(callback) {
  if (token)
  {
    callback(token);
  } else {
    $.ajax({
      url: hostname+'/api/readtoken',
      type: 'GET',
      contentType: 'application/json',
      headers: {"Access-Control-Allow-Origin" : "*"},
      success: function(data) {
        console.log('data is:', data);
      	token = data.access_token;
        callback(token);
      },
      error: function(err) {
        console.log('errpr:', err);
      },
      complete: function() {
      }
    });
  }
}

var objectKey = 0;

$(document).ready (function () {
	getToken(function() {});
	$('#btnTranslateThisOne').click (function (evt) {
		var files =document.getElementById ('files').files ;
		if ( files.length == 0 )
			return ;

		$.each (files, function (key, value) {
			var fileInput = document.getElementById('files');
			var file = fileInput.files[0];
			var data = new FormData();
			data.append('file', file);
			console.log(file);
			var reader = new FileReader();
			// Closure to capture the file information.
			reader.onload = (function(theFile) {
				return function(e) {
					console.log(e.target.result);
					objectKey++;
				  $.ajax ({
					url: hostname+'/api/uploadfile',
					type: 'POST',
					data: e.target.result,
					cache: false,
					//dataType: 'json',
					processData: false, // Don't process the files
					complete: null
				}).done (function (data) {
					$('#msg').text (value.name + ' file uploaded on your server') ;
					console.log(data);
				}).fail (function (xhr, ajaxOptions, thrownError) {
					console.log(xhr);
					console.log(thrownError);
					$('#msg').text (value.name + ' upload failed!') ;
				}) ;
				};
			})(file);

			// Read in the image file as a data URL.
			reader.readAsDataURL(file);
			
		}) ;

	}) ;

	$('#btnAddThisOne').click (function (evt) {
		var urn =$('#urn').val ().trim () ;
		if ( urn == '' )
			return ;
		AddThisOne (urn) ;
	}) ;

}) ;

function AddThisOne (urn) {
	var id =urn.replace (/=+/g, '') ;
	$('#list').append ('<div class="list-group-item row">'
			+ '<button id="' + id + '" type="text" class="form-control">' + urn + '</button>'
		+ '</div>'
	) ;
	$('#' + id).click (function (evt) {
		window.open ('/?urn=' + $(this).text (), '_blank') ;
	}) ;
}

function translate (data) {
	$('#msg').text (data.name + ' translation request...') ;
	$.ajax ({
		url: '/api/translate',
		type: 'post',
		data: JSON.stringify (data),
		timeout: 0,
		contentType: 'application/json',
		complete: null
	}).done (function (response) {
		$('#msg').text (data.name + ' translation requested...') ;
		setTimeout (function () { translateProgress (response.urn) ; }, 5000) ;
	}).fail (function (xhr, ajaxOptions, thrownError) {
		$('#msg').text (data.name + ' translation request failed!') ;
	}) ;
}

function translateProgress (urn) {
	$.ajax ({
		url: '/api/translate/' + urn + '/progress',
		type: 'get',
		data: null,
		contentType: 'application/json',
		complete: null
	}).done (function (response) {
		if ( response.progress == 'complete' ) {
			AddThisOne (response.urn) ;
			$('#msg').text ('') ;
		} else {
			var name =window.atob (urn) ;
			var filename =name.replace (/^.*[\\\/]/, '') ;
			$('#msg').text (filename + ': ' + response.progress) ;
			setTimeout (function () { translateProgress (urn) ; }, 500) ;
		}
	}).fail (function (xhr, ajaxOptions, thrownError) {
		$('#msg').text ('Progress request failed!') ;
	}) ;
}