/**
 * @summary     Entity Table Object for MONK
 * @description Entity
 * @version     0.1.0
 * @file        monkEntityTable.js
 * @author      Zetyun (http://www.zetyun.com)
 *
 * @copyright Copyright 2013 www.zetyun.com.
 * All Rights Reserved.
 */

function EntityTable(config) {
    var _bExtended = config["is_extended"];
    var _bSelectable = config["is_selectable"];

    // Local Settings
    var _settings = {
        "svcs_host" : config["svcs_host"] || "",
        "table_selector" : config["table_selector"] || "#entity",
        "collection_name" : config["collection_name"] || "EntityCollectionNotFound",
        "columns" : config["columns"] || [],
        "columns_search" : config["columns_search"] || [],
        "slice_used" : true, //true-all used data, false-all unused data
        "slice_label" : 1, //0-unlabeled data, 1-positive data, -1-negative data
        "feature_skip" : 0,
        "feature_limit" : 10,
        "entity_limit" : 10,
        "order_entity_by_uncertainty" : true,
        "language": config["language"] || undefined,

        // Callback functions
        "fnOnClickRow" : null,
        "fnExtraServerParameters": null
    };

    /*
     * Localization
     */
    if (_settings.language) {
        var _locales = {
            "zh_CN": {
                "Add" : "添加",
                "Used": "已使用",
                "Unused": "未使用",
                "Positive": "正例",
                "Negative": "反例",
                "Unlabeled": "未标注",
                "Certain First": "按'确定性'排序",
                "Uncertain First": "按'不确定性'排序",
                "PositiveL": "正例",
                "NegativeL": "反例"
            }
        };

        console.log(_settings.language);
        if(_locales[_settings.language]) {
            $.i18n.setDictionary(_locales[_settings.language]);
        }
    }

    /*
     * Build columns of entity table
     */
    var _columns = [];
    _columns.push({
            "mDataProp": null,
            "sClass": "control",
            "sDefaultContent": '<img src="static/images/details_open.png">'
    });
    if (_bSelectable) {
        _columns.push({ "mDataProp": null });  // TODO : additional column for datatables.Selectable's "checkbox"
    }
    _columns.push({ "mDataProp": "ID" });

    for(var i = 0; i < _settings.columns.length; i++) {
        _columns.push({"mDataProp": _settings.columns[i]});
    }

    if (_bExtended) {
        _columns.push({ "mDataProp": "Score" }, { "mDataProp": "Label" });
    }

    /*
     * Build buttons based on "is_extended"
     */

    var entityButtons = [
        {
            "sExtends": "collection",
            "sButtonClass": "btn-space",
            "sButtonText": $.i18n._("Used"),
            "aButtons": [
                {
                    "sExtends": "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": $.i18n._('Used'),
                    "fnClick": function (nButton, oConfig, oFlash) {
                        _settings.slice_used = true;
                        $("#btnSliceUsed").text($.i18n._("Used"));
                        _oTableEntity.fnReloadAjax();
                    }
                },
                {
                    "sExtends": "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": $.i18n._("Unused"),
                    "fnClick": function (nButton, oConfig, oFlash) {
                        _settings.slice_used = false;
                        $("#btnSliceUsed").text($.i18n._("Unused"));
                        _oTableEntity.fnReloadAjax();
                    }
                }
            ],
            "fnInit": function (nButton, oConfig) {
                nButton.id = "btnSliceUsed";
            }
        },
        {
            "sExtends": "collection",
            "sButtonClass": "btn-space",
            "sButtonText": $.i18n._("Positive"),
            "aButtons": [
                {
                    "sExtends": "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": $.i18n._("Positive"),
                    "fnClick": function (nButton, oConfig, oFlash) {
                        _settings.slice_label = 1;
                        $("#btnSliceLabel").text($.i18n._("Positive"));
                        _oTableEntity.fnReloadAjax();
                    }
                },
                {
                    "sExtends": "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": $.i18n._("Unlabeled"),
                    "fnClick": function (nButton, oConfig, oFlash) {
                        _settings.slice_label = 0;
                        $("#btnSliceLabel").text($.i18n._("Unlabeled"));
                        _oTableEntity.fnReloadAjax();
                    }
                },
                {
                    "sExtends": "text",
                    "sButtonClass": "btn-space",
                    "sButtonText": $.i18n._("Negative"),
                    "fnClick": function (nButton, oConfig, oFlash) {
                        _settings.slice_label = -1;
                        $("#btnSliceLabel").text($.i18n._("Negative"));
                        _oTableEntity.fnReloadAjax();
                    }
                }
            ],
            "fnInit": function (nButton, oConfig) {
                nButton.id = "btnSliceLabel";
            }
        },
        {
            "sExtends": "text",
            "sButtonClass": "btn-space",
            "sButtonText": $.i18n._("Uncertain First"),
            "fnInit": function (nButton, oConfig) {
                nButton.id = "btnOrderBy";
            },
            "fnClick": function (nButton, oConfig, oFlash) {
                _settings.order_entity_by_uncertainty = !_settings.order_entity_by_uncertainty;
                if (_settings.order_entity_by_uncertainty) {
                    $("#btnOrderBy").text($.i18n._("Uncertain First"));
                } else {
                    $("#btnOrderBy").text($.i18n._("Certain First"));
                }
                _oTableEntity.fnReloadAjax();
            }
        }
    ];

    /*
     * Build aoColumnDefs
     */
    var _column_score = _columns.length - 2;   // Column for "Score"
    var _column_label = _columns.length - 1;   // Column for "Label Buttons"

    var entityColumnDefs = [
        {
            "aTargets": [ _column_score ],
            "bVisible": true,
            "mRender": function ( data, type, full ) {
                return data.toFixed(4);
            }
        },
        {
            "aTargets": [ _column_label ],
            "bVisible": true,
            "mRender": function ( data, type, full ) {
                if (type == "display") {
                    var eid = full["ID"];
                    var entval = data;

                    return '<div class="btn-group" data-toggle="buttons-radio" id="' + eid +'">' +
                        '    <button type="button" value="1"  class="btn btn-primary btn-training entitylabel ' + (entval ==   1 ? "active" : "") + '">' + $.i18n._("PositiveL") + '</button>' +
                        '    <button type="button" value="0"  class="btn btn-primary btn-training entitylabel ' + (entval ==   0 ? "active" : "") + '">0</button>' +
                        '    <button type="button" value="-1" class="btn btn-primary btn-training entitylabel ' + (entval ==  -1 ? "active" : "") + '">' + $.i18n._("NegativeL") + '</button>' +
                        '</div>';
                }
                return data;
            }
        }
    ];

    var _sDom = "<'row-fluid'<'span6'lTi><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>" + (_bSelectable ? "S" : "");

    /****************************************************************
     * Entity Table
     ****************************************************************/
    var anEntityOpen = [];
    var _oEntityTableSettings = {
        "sDom": _sDom,
        "bProcessing": true,
        "bServerSide": true,
        "bjQueryUI": true,
        "sAjaxSource": _settings.svcs_host + "/svcs/monk/entity/data/",
        "oTableTools": {
            "aButtons": []
        },
        "fnServerParams": function (aoData) {
            aoData.push({
                "name": "entityCollectionName",
                "value": _settings.collection_name
            });
            aoData.push({
                "name": "columns",
                "value": _settings.columns.join(",")
            });
            aoData.push({
                "name": "searchColumns",
                "value": _settings.columns_search.join(",")
            });

            if(_bExtended) {
                aoData.push({
                    "name": "sliceUsed",
                    "value": _settings.slice_used
                });
                aoData.push({
                    "name": "sliceLabel",
                    "value": _settings.slice_label
                });
                aoData.push({
                    "name": "orderByUncertainty",
                    "value": _settings.order_entity_by_uncertainty
                });
            }

            /*
             * Callback function to add extra parameters
             */
            if ( typeof _settings.fnExtraServerParameters == 'function' && _settings.fnExtraServerParameters !== null ) {
                _settings.fnExtraServerParameters(aoData);
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
        "aoColumns": _columns
    };

    // Selectable ?
    if (_bSelectable) {
        _oEntityTableSettings["oSelectable"] = {
            iColNumber: 2,
            sIdColumnName: 'ID',
            bSingleRowSelect: true,
            bShowControls: false,
            sSelectionTrigger: 'row',
            // Classes customization
            sSelectedRowClass: 'active',

            fnSelectionChanged: function(selection) {
                if (selection.fnGetSize() > 0) {
                    console.log(selection);
                }
            }
        };
    } else {
        _oEntityTableSettings["oSelectable"] = {
            iColNumber: 0
        }
    }

    if (config["oLanguage"]) {
        _oEntityTableSettings["oLanguage"] = config["oLanguage"];
    }

    if (_bExtended) {
        _oEntityTableSettings["oTableTools"] = { "aButtons": entityButtons };
        _oEntityTableSettings["aoColumnDefs"] = entityColumnDefs;
    }

    var _oTableEntity = $(_settings.table_selector).dataTable(_oEntityTableSettings);

    $(document).on("click", "button.entitylabel", function () {
        var str = "";
        var _this = $(this);
        var oData = _oTableEntity.fnGetData(_this.closest("tr")[0]);
        var _this_id = oData["ID"];
        var _this_val = _this.val();

        /*
         * Callback function to train current entity
         */
        if ( typeof _settings.fnOnClickLabel== 'function' && _settings.fnOnClickLabel !== null ) {
            _settings.fnOnClickLabel(_settings, _this_id, _this_val);
        }
    });

    /*
     * Entity Detail
     */
    $(document).on('click', _settings.table_selector + ' td.control', function (e) {
        var nTr = this.parentNode;
        var i = $.inArray(nTr, anEntityOpen);
        var entityId = _oTableEntity.fnGetData(nTr).ID;

        if (i === -1) {
            $('img', this).attr('src', "static/images/details_close.png");
            var nDetailsRow = _oTableEntity.fnOpen(nTr, fnFormatEntityDetails(entityId), 'details');
            $('div.entityInnerDetails', nDetailsRow).slideDown();
            anEntityOpen.push(nTr);
            fnShowEntityDetails(entityId, 0, _settings.entity_limit);
        }
        else {
            $('img', this).attr('src', "static/images/details_open.png");
            $('div.entityInnerDetails', $(nTr).next()[0]).slideUp(function () {
                _oTableEntity.fnClose(nTr);
                anEntityOpen.splice(i, 1);
            });
        }
    });

    $(document).on('click', '.btn-prev', function (e) {
        var id = e.target['id'];
        var strs = id.split('-');
        fnShowEntityDetails(strs[0], parseInt(strs[1], 10) - _settings.entity_limit, _settings.entity_limit);
        e.preventDefault();
    });

    $(document).on('click', '.btn-next', function (e) {
        var id = e.target['id'];
        var strs = id.split('-');
        fnShowEntityDetails(strs[0], parseInt(strs[1], 10) + _settings.entity_limit, _settings.entity_limit);
        e.preventDefault();
    });

    function fnShowEntityDetails(entityId, nSkip, nLimit) {
        if (nSkip < 0) {
            return;
        }

        var url = _settings.svcs_host + "/svcs/monk/entity/GetFeatures?entityCollectionName=" + _settings.collection_name + "&entityId=" + entityId + "&nSkip=" + nSkip + "&nLimit=" + nLimit;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (data) {
                entityDetailDiv = $("#e" + entityId);
                var featureLabels = "";
                featureLabels += '<span class="btn-prev" id="' + entityId + '-' + nSkip + '">prev</span>&nbsp;';

                for (var i = 0; i < Math.min(nLimit, data.length); i++) {
                    var feature = data[i];
                    var value = feature["frequency"];
                    var featureSpan = '';
                    if (value > 0) {
                        featureSpan = '<span class="label label-success">';
                        featureSpan += feature["letter"] + ':' + feature["frequency"].toFixed(3);
                    } else {
                        featureSpan = '<span class="label label-important">';
                        featureSpan += feature["letter"] + ':' + feature["frequency"].toFixed(3);
                    }
                    featureLabels += featureSpan + '</span>&nbsp;';
                }
                featureLabels += '<span class="btn-next" id="' + entityId + '-' + nSkip + '">next</span>';

                entityDetailDiv.html("<p>" + featureLabels + "</p>");
            },
            error: function (result) {
                console.log(result)
            }
        });
    }

    function fnFormatEntityDetails(entityId) {
        return '<div class="entityInnerDetails" id="e' + entityId + '"></div>';
    }


    // Default Callback function for fnOnClickLabel
    function _fnOnClickLabel (_entitySettings, _entityId, _entityLabel) {
        console.log("Default fnOnClick : " + _entityId + " " + _entityLabel);
    }

    /*
     * Build Object
     */
    this.oTable = _oTableEntity;
    this.settings = _settings;
    this.settings.fnOnClickLabel = _fnOnClickLabel;
    this.fnShowEntityDetails = fnShowEntityDetails;
}
