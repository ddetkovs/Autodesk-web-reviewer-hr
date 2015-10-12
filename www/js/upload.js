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
            success: function (data) {
                console.log('data is:', data);
                token = data.access_token;
                callback(token);
            },
            error: function (err) {
                console.log('errpr:', err);
            },
            complete: function () {}
        });
    }
}

var objectKey = 0;

$(document).ready(function () {
    getToken(function () {});
    $('#btnTranslateThisOne').click(function (evt) {
        var files = document.getElementById('files').files;
        if (files.length == 0)
            return;

        $.each(files, function (key, value) {
            var fileInput = document.getElementById('files');
            var file = fileInput.files[0];
            console.log(key);
            console.log(value);
            var oReq = new XMLHttpRequest();
            var url = 'https://developer-stg.api.autodesk.com/oss/v2/buckets/bootcamp2team1/objects/' + value.name;
            oReq.open('PUT', url, true);
            oReq.setRequestHeader('Authorization', 'Bearer ' + token);
            oReq.setRequestHeader('Content-Type', 'application/stream');
            oReq.onload = function (oEvent) {
                var objectId = JSON.parse(oReq.responseText).objectId;
                var urn = btoa(objectId);

                console.log(oReq.responseText);
                console.log(urn);
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
                    success: function (res) {
                        console.log(res);
                        $.ajax({
                            url: hostname + '/api/addurn',
                            type: 'POST',
                            data: JSON.stringify({
                                urn: urn
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            success: function (res) {
                                console.log(res);
                            }
                        })
                    }
                })

            };

            oReq.send(file);
        }) ;

    }) ;

    $('#btnAddThisOne').click(function (evt) {
        var urn = $('#urn').val().trim();
        if (urn == '')
            return;
        AddThisOne(urn) ;
    }) ;

}) ;

function AddThisOne(urn) {
    var id = urn.replace(/=+/g, '');
    $('#list').append('<div class="list-group-item row">'
        + '<button id="' + id + '" type="text" class="form-control">' + urn + '</button>'
        + '</div>'
    ) ;
    $('#' + id).click(function (evt) {
        window.open('/?urn=' + $(this).text(), '_blank') ;
    }) ;
}

function translate(data) {
    $('#msg').text(data.name + ' translation request...') ;
    $.ajax({
        url: '/api/translate',
        type: 'post',
        data: JSON.stringify(data),
        timeout: 0,
        contentType: 'application/json',
        complete: null
    }).done(function (response) {
        $('#msg').text(data.name + ' translation requested...') ;
        setTimeout(function () {
            translateProgress(response.urn) ;
        }, 5000) ;
    }).fail(function (xhr, ajaxOptions, thrownError) {
        $('#msg').text(data.name + ' translation request failed!') ;
    }) ;
}

function translateProgress(urn) {
    $.ajax({
        url: '/api/translate/' + urn + '/progress',
        type: 'get',
        data: null,
        contentType: 'application/json',
        complete: null
    }).done(function (response) {
        if (response.progress == 'complete') {
            AddThisOne(response.urn) ;
            $('#msg').text('') ;
        } else {
            var name = window.atob(urn);
            var filename = name.replace(/^.*[\\\/]/, '');
            $('#msg').text(filename + ': ' + response.progress) ;
            setTimeout(function () {
                translateProgress(urn) ;
            }, 500) ;
        }
    }).fail(function (xhr, ajaxOptions, thrownError) {
        $('#msg').text('Progress request failed!') ;
    }) ;
}
