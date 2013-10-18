/**
 * @summary     Panda Table Object for MONK
 * @description Panda
 * @version     0.1.0
 * @file        monkPandaTable.js
 * @author      Zetyun (http://www.zetyun.com)
 *
 * @copyright Copyright 2013 www.zetyun.com.
 * All Rights Reserved.
 */

// TODO : move to better place
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function PandaTable(config) {

    // Local Settings
    var _settings = {
        "svcs_host" : config["svcs_host"] || "",
        "monk_name" : encodeURI(config["monk_name"]) || "",
        "turtle_name" : encodeURI(config["turtle_name"]) || "",
        "dest_collection_name" : encodeURI(config["dest_collection_name"]) || "",
        "table_selector" : config["table_selector"] || "#pandas",
        "feature_skip" : 0,
        "feature_limit" : 10,
        // Callback functions
        "fnOnClickRow": null,
        // Callback for graduating a panda
        "fnOnClickLabel": null,
        // Internal state
        "current_id" : null
    };

    /****************************************************************
     * Panda Table
     ****************************************************************/
	var id = -1;//simulation of id
    var _oPandaTableSettings = {
        /* "sDom": 'lfT<"clear">rtip', */
        /* "sDom" : '<"H"lfTr>t<"F"ip>', */
        "sDom" : "<'row-fluid'<'span6'lT><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
        "bJQueryUI": true,
        "bProcessing": true,
        "bServerSide": true,
        "sAjaxSource": _settings.svcs_host + "/svcs/monk/panda/get/",
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": "添加新分类器",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        $('#modal-add-panda').modal('show');
                    },
                    "fnInit": function ( nButton, oConfig ) {
                        nButton.id = "btnAddPanda";
                    }
                },
                {
                    "sExtends":    "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": "删除当前分类器",
                    "fnClick": function ( nButton, oConfig, oFlash ) {
                        $.get(_settings.svcs_host + "/svcs/monk/panda/del/",
                            {
                                "monkName" : _settings.monk_name,
                                "id" : _settings.current_id
                            }).done(function () {
                                _oTablePanda.fnReloadAjax();
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
                                    text: 'Failed to delete panda' + _settings.current_id,
                                    type: 'error',
                                    delay: 5000
                                });
                            });
                    },
                    "fnInit": function ( nButton, oConfig ) {
                        nButton.id = "btnDeletePanda";
                    }
                }
            ]
        },
        "fnServerParams": function ( aoData ) {
            aoData.push({ "name": "monkName", "value": _settings.monk_name });
            aoData.push({ "name": "turtleName", "value": _settings.turtle_name });
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
            $(nRow).attr("id", id);
            return nRow;
        },
        "aoColumns": [
            { "mDataProp": "id", "sWidth":"9%" },
            { "mDataProp": "NAME", "sWidth": "20%" },
            { "mDataProp": "AUTHOR", "sWidth":"9%" },
            { "mDataProp": "ACCURACY", "sWidth":"20%" },
            { "mDataProp": "EXPERIENCE", "sWidth": "20%" },
            { "mDataProp": "GRADUATED", "sWidth": "20%" }
        ],
        "aoColumnDefs": [
            {
                "aTargets": [ 3 ],
                "bVisible": true,
                "mRender": function ( data, type, full ) {
                    return data.toFixed(3);
                }
            },
            {
                "aTargets": [ 5 ],
                "bVisible": true,
                "mRender": function (data, type, full) {
                    if (type == "display") {
                        var eid = full["id"];
                        var entval = data;

                        return '<div class="btn-group" data-toggle="buttons-radio" id="' + eid + '">' +
                            '    <button type="button" value=true  class="btn btn-primary btn-training graduateLabel ' + (entval ? "active" : "") + '">' + "是" + '</button>' +
                            '    <button type="button" value=false class="btn btn-primary btn-training graduateLabel ' + (!entval ? "active" : "") + '">' + "否" + '</button>' +
                            '</div>';
                    }
                    return data;
                }
            }
        ],
        "fnInitComplete": function (oSettings, json) {
            // Load Turtle list
            $.getJSON(_settings.svcs_host + "/svcs/monk/panda/TurtleList?monkName=" + _settings.monk_name, function(result) {
                var turtleOptions = $("#modal-add-panda .modal-body select#turtleName");
                turtleOptions.empty();
                $.each(result, function(item) {
                    turtleOptions.append(new Option(result[item], result[item]));
                });
            });
        }
    };

    if (config["oLanguage"]) {
        _oPandaTableSettings["oLanguage"] = config["oLanguage"];
    }

	var _oTablePanda = $(_settings.table_selector).dataTable(_oPandaTableSettings);

    /*
     * UI event handling
     */
    $(document).on("click", _settings.table_selector + " tr", function(e) {
        var oData = _oTablePanda.fnGetData(this);
        if (oData == null || !("id" in oData)) {
            return;
        }

        var panda_id = oData["id"];
        var _this = $(this);

        if(_this.hasClass("active")) {
            return;
        }

        // Panda Select Row

        // deactivate old row
        $(_oTablePanda.fnSettings().aoData).each(function () {
            var nTr = this.nTr;
            if ($(nTr).hasClass("active")) {
                $('div.pandaInnerDetails', $(nTr).next()[0]).slideUp(function () {
                    _oTablePanda.fnClose(nTr);
                });
                $(nTr).removeClass('active');
            }
        });

        // activate the selected row
        _this.addClass('active');
        _settings.current_id = panda_id;

        // Show details
        var nDetailsRow = _oTablePanda.fnOpen(this, fnFormatPandaDetails(_settings.current_id), 'details');
        $('div.pandaInnerDetails', nDetailsRow).slideDown();
        _settings.feature_skip = 0;
        _settings.feature_limit = 10;
        fnShowPandaDetails(_settings.current_id, _settings.feature_skip, _settings.feature_limit);

        /*
         * Callback function to do extra work
         */
        if ( typeof _settings.fnOnClickRow == 'function' && _settings.fnOnClickRow !== null ) {
            _settings.fnOnClickRow( oData );
        }

        $("button#save_trained_panda").button("enable");
        // Refresh Panda information on navbar
        navbar_refresh_panda(oData);
	});

    $(document).on('click', '.label', function (e) {
        label = e.currentTarget;
        id = label['id'];
        if (id[0] == 'f') {
            fnRemoveFeatureFromCurrentPanda(id.slice(1, id.length));
        }
        e.preventDefault();
    });

    $(document).on('click', '#prevPandaFeatures', function (e) {
        if (_settings.current_id != null) {
            _settings.feature_skip -= _settings.feature_limit;

            if (_settings.feature_skip< 0) {
                _settings.feature_skip = 0;
            }
            fnShowPandaDetails(_settings.current_id, _settings.feature_skip, _settings.feature_limit);
        }
        e.preventDefault();
    });

    $(document).on('click', '#nextPandaFeatures', function (e) {
        if (_settings.current_id != null) {
            _settings.feature_skip += _settings.feature_limit;
            fnShowPandaDetails(_settings.current_id, _settings.feature_skip, _settings.feature_limit);
        }
        e.preventDefault();
    });

    $(document).on("click", "button.graduateLabel", function () {
        var str = "";
        var _this = $(this);
        var oData = _oTablePanda.fnGetData(_this.closest("tr")[0]);
        var _this_id = oData["id"];
        var _this_val = _this.val();

        /*
         * Callback function to train current entity
         */
        if ( typeof _settings.fnOnClickLabel == 'function' && _settings.fnOnClickLabel !== null ) {
            _settings.fnOnClickLabel(_settings, _this_id, _this_val);
        }
    });
    // when RegexPanda is selected we can input Arguments
    $("#pandaType").change(function () {
        if ($(this).val() == 'RegexPanda') {
            $("#pandaArgs").attr("disabled", false);
        } else {
            $("#pandaArgs").attr("disabled", true);
        }
    });
    

    $(document).on('click', '#modal-form-add-panda-submit', function(e){
        // We don't want this to act as a link so cancel the link action
        e.preventDefault();
        $("#modal-form-add-panda-submit").button("loading");

        // Find form and submit it
        $('#modal-form-add-panda').submit();
    });

    $(document).on('submit', '#modal-form-add-panda', function(e) {
        // append 'monkName' into parameter list
        var _base_params = $(this).serialize() + "&monkName=" + _settings.monk_name;
        var _param_array = $(this).serializeObject();
        var _types_need_updated = ["RegexPanda"];

        // Ajax Chain for adding a panda
        function ajaxAddPandaSteps(step, data) {
            switch (step) {
                // Step 1 : Add panda
                case 1:
                    $.ajax({
                        url: _settings.svcs_host + "/svcs/monk/panda/add/",
                        data: _base_params,
                        success: function (data) {
                            if (data.Result == "OK")
                                ajaxAddPandaSteps(2, data);
                            else {
                                ajaxAddPandaSteps(0);
                                $.pnotify({
                                    title: 'Add Panda ERROR',
                                    text: 'Add Panda ERROR ' + _settings.current_id + "!",
                                    type: 'error',
                                    delay: 1000
                                });
                            }
                        }
                    });
                    break;
                    // Step 2 : Train Pandas
                case 2:
                    $.ajax({
                        url: _settings.svcs_host + "/svcs/monk/panda/addFeature/",
                        data: _base_params + "&newPandaId=" + data.Panda.PandaId + "&selectedPandaId=" + _settings.current_id + "&trainTurtleName=" + _settings.turtle_name,
                        success: function () {
                            if (jQuery.inArray(_param_array["pandaType"], _types_need_updated) != -1) {
                                ajaxAddPandaSteps(3,data);
                            } else {
                                ajaxAddPandaSteps(0);
                            }
                        }
                    });
                    break;
                    // Step 3 : Update panda
                case 3:
                    $.ajax({
                        url: _settings.svcs_host + "/svcs/monk/panda/update/",
                        data: _base_params + "&newPandaId=" + data.Panda.PandaId + "&entityCollectionName=" + _settings.dest_collection_name,
                        success: function () {
                            ajaxAddPandaSteps(0);
                        }
                    });
                    break;
                    // Step 4 : Close Dialog
                case 0:
                    $("#modal-form-add-panda-submit").button("reset");
                    // Hide the modal
                    $("#modal-add-panda").modal('hide');
                    _oTablePanda.fnReloadAjax(null, function () {
                        $.pnotify({
                            title: 'Panda Added',
                            text: 'Panda Added',
                            styling: 'bootstrap',
                            delay: 1000
                        });
                    });
                    break;
            }
        }
        ajaxAddPandaSteps(1); // Start ajax chain

        // Stop the normal form submission
        return false;
    });


    function fnRemoveFeatureFromCurrentPanda(uid) {
        if (_settings.current_id == null) {
            return;
        }

        var url = _settings.svcs_host + "/svcs/monk/panda/RemoveFeature?pandaId=" + _settings.current_id + "&uid=" + uid;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (data) {
                fnShowPandaDetails(_settings.current_id, _settings.feature_skip, _settings.feature_limit);
            },
            error: function (result) {
                console.log(result)
            }
        });
    }

    function fnShowPandaDetails(pandaId, nSkip, nLimit) {
        var url = _settings.svcs_host + "/svcs/monk/panda/GetFeatures?pandaId=" + pandaId + "&nSkip=" + nSkip + "&nLimit=" + nLimit;
        var detailDivId = "p" + pandaId;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (data) {
                pandaDetailDiv = $("#" + detailDivId);
                var featureLabels = "";
                featureLabels += '<span class="btn" id="prevPandaFeatures">prev</span>&nbsp;';

                for (var i = 0; i < Math.min(nLimit, data.length); i++) {
                    var feature = data[i];
                    var value = feature["frequency"];
                    var featureSpan = '';
                    if (value > 0) {
                        featureSpan = '<span class="label label-success" id="f' + feature["uid"] + '">';
                        featureSpan += feature["letter"] + ':' + feature["frequency"].toFixed(3);
                    } else {
                        featureSpan = '<span class="label label-important" id="f' + feature["uid"] + '">';
                        featureSpan += feature["letter"] + ':' + feature["frequency"].toFixed(3);
                    }
                    featureLabels += featureSpan + '</span>&nbsp;';
                }
                featureLabels += '<span class="btn" id="nextPandaFeatures">next</span>';

                pandaDetailDiv.html("<p>" + featureLabels + "</p>");
            },
            error: function (result) {
                console.log(result)
            }
        });
    }

    function fnFormatPandaDetails(pandaId) {
        return '<div class="pandaInnerDetails" id="p' + pandaId + '"></div>';
    }

    function _fnOnClickLabel(_pandaSettings, _pandaId, _graduate) {
        console.log("Default fnOnClick : " + _pandaId + " " + _graduate);
    }

    /*
     * Build Object
     */
    this.oTable = _oTablePanda;
    this.settings = _settings;
    this.fnShowPandaDetails = fnShowPandaDetails;
    this.settings.fnOnClickLabel = _fnOnClickLabel;
    this.fnFormatPandaDetails = fnFormatPandaDetails;
}
