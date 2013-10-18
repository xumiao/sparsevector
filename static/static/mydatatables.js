
$(document).ready( function () {
    var svcs_host = "";
    var extraParam_pandaId = null;

    /****************************************************************
     * Panda Table
     ****************************************************************/
    var anPandaOpen = [];
	var id = -1;//simulation of id
	var oTablePandas = $('#pandas').dataTable({
        /* "sDom": 'lfT<"clear">rtip', */
        /* "sDom" : '<"H"lfTr>t<"F"ip>', */
        "sDom" : "<'row-fluid'<'span6'lT><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
        "bJQueryUI": true,
        "bProcessing": true,
        "bServerSide": true,
        "bjQueryUI": true,
        "oLanguage": {
            "sSearch": "搜索名称:"
        },
        "sAjaxSource": svcs_host + "/svcs/monk/panda/get/",
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "text",
                    "sButtonClass": "btn",
                    "sButtonText": "添加",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        $('#modal-add-panda').modal('show');
                    },
                    "fnInit": function ( nButton, oConfig ) {
                        var _this = $(this);
                        $.attr("id", "250");
                    }
                },
                {
                    "sExtends":    "text",
                    "sButtonClass": "btn",
                    "sButtonText": "删除",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        $.get(svcs_host + "/svcs/monk/panda/del/",
                            {
                                "id" : extraParam_pandaId
                            }).done(function () {
                                oTablePandas.fnReloadAjax();
                                $.pnotify({
                                    title: 'Panda Deleted',
                                    text: 'Panda Deleted',
                                    styling: 'bootstrap',
                                    delay: 1000
                                });
                                navbar_refresh_panda(null);
                            }).error(function () {
                                $.pnotify({
                                    title: 'Failed to delete panda',
                                    text: 'Failed to delete panda' + extraParam_pandaId,
                                    styling: 'error',
                                    delay: 5000
                                });
                            });
                    },
                    "fnInit": function ( nButton, oConfig ) {
                        var _this = $(this);
                        _this.attr("id", "250");
                    }
                }
            ]
        },
        "fnServerParams": function ( aoData ) {
            aoData.push({ "name": "turtleName", "value": "TelecomCategoryPredictor" });
        },
        "fnServerData": function ( sSource, aoData, fnCallback ) {
            $.ajax({
				"dataType": 'json',
				"type": "GET",
				"url": sSource,
				"data": aoData,
                "timeout": 1000000,
				"success": fnCallback
			});
        },
        "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
            /* set tr id. assume the id is in the first column of data */
            var id = aData["id"];
            // $(nRow).find("tr").attr("id", id);
            $(nRow).attr("id", id);
            return nRow;
        },
        "aoColumns": [
            {
                "mDataProp": null,
                "sClass": "control",
                "sDefaultContent": '<img src="static/images/details_open.png">'
            },
            { "mDataProp": "id" },
            { "mDataProp": "NAME" },
            { "mDataProp": "AUTHOR" },
            { "mDataProp": "ACCURACY" },
            { "mDataProp": "EXPERIENCE" }
        ],
        "aoColumnDefs": [
            {
                "aTargets": [ 4 ],
                "bVisible": true,
                "mRender": function ( data, type, full ) {
                    return data.toFixed(4);
                }
            }
        ],
        "fnInitComplete": function (oSettings, json) {
            // Load Turtle list
            $.getJSON(svcs_host + "/svcs/monk/panda/TurtleList", function(result) {
                var turtleOptions = $("#modal-add-panda .modal-body select#turtleName");
                turtleOptions.empty();
                $.each(result, function(item) {
                    turtleOptions.append(new Option(result[item], result[item]));
                });
            });
        }
    });

    $(document).on("click", "#pandas tr", function() {
        var oData = oTablePandas.fnGetData(this);
        var panda_id = oData["id"];
        var _this = $(this);

        if(_this.hasClass("active")) {
            return;
        }

        // Panda Select Row
        $(oTablePandas.fnSettings().aoData).each(function () {
            $(this.nTr).removeClass('active');
        });
        _this.addClass('active');

        // var oTablePandas = $('#pandas').dataTable();
        extraParam_pandaId = panda_id;
        // var oTableEntity = $('#entities').dataTable();
        oTableEntity.fnReloadAjax(null, function () {
            console.log("fnReloadAjax :: xxxx ");
        });
        $("button#save_trained_panda").button("enable");
        // Refresh Panda information on navbar
        navbar_refresh_panda(oData);
	});

    $('#modal-form-add-panda-submit').on('click', function(e){
        // We don't want this to act as a link so cancel the link action
        e.preventDefault();

        // Find form and submit it
        $('#modal-form-add-panda').submit();
    });

    $('#modal-form-add-panda').on('submit', function(){

        //Serialize the form and post it to the server
        $.get(svcs_host + "/svcs/monk/panda/add/", $(this).serialize(), function() {
            // Hide the modal
            $("#modal-add-panda").modal('hide');
            oTablePandas.fnReloadAjax(null, function() {
                $.pnotify({
                    title: 'Panda Added',
                    text: 'Panda Added',
                    styling: 'bootstrap',
                    delay: 1000
                });
            });
        });

        // Stop the normal form submission
        return false;
    });

    /*
     * Panda Detail
     */
    $(document).on('click', '#pandas td.control', function (event) {
        var nTr = this.parentNode,
            nTrX = $(nTr);
        var i = $.inArray(nTr, anPandaOpen);

        if (i === -1) {
            $('img', this).attr('src', "static/images/details_close.png");
            var nDetailsRow = oTablePandas.fnOpen(nTr, fnFormatPandaDetails(oTablePandas, nTr), 'details');
            $('div.pandaInnerDetails', nDetailsRow).slideDown(1000, function() {
                console.log(nTrX.attr("id"));
                myRefreshPandaDetail(nTrX.attr("id"));
            });
            anPandaOpen.push(nTr);
        }
        else {
            $('img', this).attr('src', "static/images/details_open.png");
            $('div.pandaInnerDetails', $(nTr).next()[0]).slideUp(function () {
                oTablePandas.fnClose(nTr);
                anPandaOpen.splice(i, 1);
            });
        }

        event.stopPropagation();
    });

    function fnFormatPandaDetails(oTable, nTr) {
        var oData = oTable.fnGetData(nTr);

        var sOut = '<div class="pandaInnerDetails" id="x' + oData["id"] + '">' +
            '<div id="tooltip" class="hidden">' +
            '    <p><strong>Important Label Heading</strong></p>' +
            '    <p><span id="value">100</span>%</p>' +
            '</div>' +
            '<svg class="positive"></svg>' +
            '<svg class="negative"></svg>' +
        '</div>';

        return sOut;
    }

    /****************************************************************
     * Entity Table
     ****************************************************************/
    var anEntityOpen = [];
    var oTableEntity = $('#entities').dataTable({
        "sDom" : "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
        "bProcessing": true,
        "bServerSide": true,
        "bjQueryUI": true,
        "oLanguage": {
            "sSearch": "搜索反馈信息:"
        },
        "sAjaxSource": svcs_host + "/svcs/monk/entity/data/",
        "fnServerParams": function (aoData) {
            aoData.push({
                "name": "entityCollectionName",
                "value": "TelecomCustomerFeedback"
            });
            if (typeof extraParam_pandaId == 'string' && extraParam_pandaId !== null)
            {
                aoData.push({ "name": "pandaId", "value": extraParam_pandaId });
            }
        },
        "fnServerData": function ( sSource, aoData, fnCallback ) {
            $.ajax( {
				"dataType": 'json',
				"type": "GET",
				"url": sSource,
				"data": aoData,
                "timeout": 100000,
				"success": fnCallback
			} );
        },
        "fnFormatNumber": function ( toFormat ) {
            return toFormat;
        },
        "aoColumns": [
            {
                "mDataProp": null,
                "sClass": "control",
                "sDefaultContent": '<img src="static/images/details_open.png">'
            },
            { "mDataProp": "ID" },
            { "mDataProp": "Feedback" },
            { "mDataProp": "Categories" },
            { "mDataProp": "Score" },
            {
                "mDataProp": "Label"
            }
        ],
        "aoColumnDefs": [
            {
                "aTargets": [ 4 ],
                "bVisible": true,
                "mRender": function ( data, type, full ) {
                    return data.toFixed(4);
                }
            },
            {
                "aTargets": [ 5 ],
                "bVisible": true,
                "mRender": function ( data, type, full ) {
                    if (type == "display") {
                        var eid = full["ID"];
                        var entval = data;
                        /*
                        return ' <form name="' + eid + '">' +
                            '   <input name="' + eid + '"type="radio" value="1"  class="entitylabel" ' + (entval ==  "1" ? "checked" : "") + '>1</br>' +
                            '   <input name="' + eid + '"type="radio" value="0"  class="entitylabel" ' + (entval ==  "0" ? "checked" : "") + '>0</br>' +
                            '   <input name="' + eid + '"type="radio" value="-1" class="entitylabel" ' + (entval == "-1" ? "checked" : "") + '>-1' +
                            ' </form>';
                            */
                        return '<div class="btn-group" data-toggle="buttons-radio" id="' + eid +'">' +
                               '    <button type="button" value="1"  class="btn btn-primary btn-training entitylabel ' + (entval ==   1 ? "active" : "") + '">Positive</button>' +
                               '    <button type="button" value="0"  class="btn btn-primary btn-training entitylabel ' + (entval ==   0 ? "active" : "") + '">0</button>' +
                               '    <button type="button" value="-1" class="btn btn-primary btn-training entitylabel ' + (entval ==  -1 ? "active" : "") + '">Negative</button>' +
                               '</div>';
                    }
                    return data;
                }
            }
        ]
    });


    $(document).on("click", "button.entitylabel", function () {
        var str = "";
        var _this = $(this);
        var _parent_tr = _this.parent().parent().parent()[0];
        var oData = oTableEntity.fnGetData(_parent_tr);
        var _this_id = oData["ID"]; // _this.parent().attr("id");
        var _this_val = _this.val();
        $.get(svcs_host + "/svcs/monk/entity/train",
            {
                "pandaId" : extraParam_pandaId,
                "entityCollectionName" : "TelecomCustomerFeedback",
                "entityId" : oData["ID"],
                "extendedId": oData["EID"],
                "entityLabel" : _this_val
            }).done(function () {
                $.pnotify({
                    title: 'Entity Training',
                    text: 'Train Entity ' + _this_id + " Done!",
                    styling: 'bootstrap',
                    delay: 1000
                });
                oTableEntity.fnReloadAjax();
            }).error(function () {
                $.pnotify({
                    title: 'Entity Training',
                    text: 'Failed to train entity ' + _this_id + "!",
                    styling: 'error',
                    delay: 1000
                });
            });
    });

    /*
     * Entity Detail
     */
    $(document).on('click', '#entities td.control', function () {
        var nTr = this.parentNode;
        var i = $.inArray(nTr, anEntityOpen);

        if (i === -1) {
            $('img', this).attr('src', "static/images/details_close.png");
            var nDetailsRow = oTableEntity.fnOpen(nTr, fnFormatEntityDetails(oTableEntity, nTr), 'details');
            $('div.entityInnerDetails', nDetailsRow).slideDown();
            anEntityOpen.push(nTr);
        }
        else {
            $('img', this).attr('src', "static/images/details_open.png");
            $('div.entityInnerDetails', $(nTr).next()[0]).slideUp(function () {
                oTableEntity.fnClose(nTr);
                anEntityOpen.splice(i, 1);
            });
        }
    });

    function fnFormatEntityDetails(oTableEntity, nTr) {
        var oData = oTableEntity.fnGetData(nTr);
        /*
         var sOut = '<div class="entityInnerDetails">' +
         '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
         '<tr><td>ID:</td><td>' + oData._id + '</td></tr>' +
         '<tr><td>URL:</td><td>' + oData.URL + '</td></tr>' +
         '<tr><td>TITLE:</td><td>' + oData.TITLE + '</td></tr>' +
         '<tr><td>Author:</td><td>' + oData.AUTHOR + '</td></tr>' +
         '<tr><td>Meta Description:</td><td>' + oData.META_DESCR + '</td></tr>' +
         '<tr><td>Categories:</td><td>' + oData.CATEGORIES + '</td></tr>' +
         '<tr><td>Meta Tags:</td><td>' + oData.META_TAGS + '</td></tr>' +
         '<tr><td>Posted Date:</td><td>' + oData.DATE + '</td></tr>' +
         '</table>' +
         '</div>';
         */
        var sOut = '<div class="entityInnerDetails">' +
                '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
                '<tr><td>ID:</td><td>' + oData.ID + '</td></tr>' +
                '</table>' +
                '</div>';
        return sOut;
    }

    // Button :: Save Trained Panda
    $( "button#save_trained_panda" ).button({
        create: function( event, ui ) {
            $(this).button("disable");
        }
    }).click(function() {
        if (extraParam_pandaId) {
            var pandaId = extraParam_pandaId;
            $.get(svcs_host + "/svcs/monk/entity/savePanda",
              {"pandaId" : extraParam_pandaId
              }).done(function () {
                    $.pnotify({
                        title: 'Save Panda',
                        text: 'Panda ' + pandaId + " Done!",
                        styling: 'bootstrap',
                        delay: 1000
                    });
              }).error(function () {
                    $.pnotify({
                        title: 'Save Panda',
                        text: 'Failed to save panda : ' + pandaId,
                        type: 'error',
                        delay: 1000
                    });
              });
        }
    });

    // Button :: Testing
    $( "button#start_testing" ).click(function() {
        $('#modal-testing').modal('show');
    });

    // Button :: Start Testing
    $( "button#btn-start-testing").click(function (){
        var _this = $(this);
        $("button#btn-start-testing").button('loading');

        var endpoint = svcs_host + '/svcs/monk/panda/getcategory',
            data = $("#zet-cat-sentence").val();
        $.ajax({
            type: "post",
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            "timeout": 1000000,
            data: JSON.stringify(data),
            url: endpoint
        }).done(function (data) {
                /*
                var response = JSON.stringify(data);
                response = response.substring(1, response.length - 2);
                var classfiersProbs = response.split(";");
                var categoryHtml = "<table class='table'>";
                categoryHtml = "<tr><th></th><th></th></tr>"
                for (var i = 0; i < classfiersProbs.length; i++) {
                    var kv = classfiersProbs[i].split(",");
                    categoryHtml += "<tr>";
                    categoryHtml += "  <td><p style=\"font-size:" + (30-2*i) + "px\">" + kv[0] + "</td>";
                    categoryHtml += "  <td><p style=\"font-size:" + (30-2*i) + "px\">" + parseFloat(kv[1]).toFixed(4) + "</p></td>";
                    categoryHtml += "</tr>";
                }
                categoryHtml += "</table>";
                */

                myRefreshTestingBarChart(data);

                $("button#btn-start-testing").button("reset");
                // $('#category').html(categoryHtml);
            }).fail(function (res) {
                $("button#btn-start-testing").button("reset");
                $('#category').html("<p>好像出了什么问题。请再试一次！</p>");
                console.error(res);
            });
    });

    // Notification Functions
    function navbar_refresh_panda(oData) {
        if(oData == null) {
            $("ul#selected-panda #panda-id").text("");
            $("ul#selected-panda #panda-name").text("");
            $("ul#selected-panda #panda-author").text("");
            $("ul#selected-panda #panda-accuracy").text("");
            $("ul#selected-panda #panda-experience").text("");
        } else {
            $("ul#selected-panda #panda-id").text(oData["id"]);
            $("ul#selected-panda #panda-name").text(oData["NAME"]);
            $("ul#selected-panda #panda-author").text(oData["AUTHOR"]);
            $("ul#selected-panda #panda-accuracy").text(oData["ACCURACY"].toFixed(4));
            $("ul#selected-panda #panda-experience").text(oData["EXPERIENCE"]);
        }
    }

});
