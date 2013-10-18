/**
 * @summary     Navigation Bar for MONK
 * @description Navigation Bar
 * @version     0.1.0
 * @file        monkNavibar.js
 * @author      zetyun (http://www.zetyun.com)
 *
 * @copyright Copyright 2013 www.zetyun.com.
 * All Rights Reserved.
 */

$(document).ready( function () {
    // Button :: Save Panda
    $("button#savePanda" ).button({
        create: function( event, ui ) {
            $(this).button("disable");
        }
    }).click(function() {
        var pandaId = mainPandaTableObj.settings.current_id;
        if (pandaId) {
            $.get(svcs_host + "/svcs/monk/entity/savePanda",
              {
                  "pandaId" : pandaId
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

    /*
     * Testing
     */
    function myRefreshTestingBarChart(data) {
        console.log(data);
        var myvals = [];

        var classfiersProbs = data.split(";");

        for (var i = 0; i < classfiersProbs.length; i++) {
            var kv = classfiersProbs[i].split(",");
            if(kv.length == 2) {
                myvals.push({
                    "label": kv[0],
                    "value": parseFloat(kv[1])
                });
            }
            if (i > 10)
                break;
        }

        var mydata = [{
            "key": "分类测试结果",
            /* "color": "#d62728", */
            "color": "#1f77b4",
            "values": myvals
        }];

        nv.addGraph(function() {
            var chart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.label })
                .y(function(d) { return d.value })
                /* .margin({top: 30, right: 20, bottom: 50, left: 175}) */
                .margin({left: 100})
                .showValues(true)
                .tooltips(false)
                .showControls(false);

            chart.yAxis
                .tickFormat(d3.format(',.2f'));

            d3.select('svg.testing-result')
                .datum(mydata)
                .transition().duration(500)
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
    }

    // Button :: Reload
    $("button#reloadPanda").button({
        create: function (event, ui) {
        }
    }).click(function () {
        var pandaId = mainPandaTableObj.settings.current_id;
        if (pandaId) {
            $.get(svcs_host + "/svcs/monk/panda/reload",
            {
                "monkName"  : mainPandaTableObj.settings.monk_name,
                "turtleName": mainPandaTableObj.settings.turtle_name,
                "pandaId": pandaId
            }).done(function () {
                $.pnotify({
                    title: 'Reload Panda',
                    text: 'Panda ' + pandaId + ' Done!',
                    styling: 'bootstrap',
                    delay: 1000
                });
            }).error(function () {
                $.pnotify({
                    title: 'Reload Panda',
                    text: 'Failed to reload panda : ' + pandaId,
                    type: 'error',
                    delay: 1000
                });
            });
        }
        else {
            $.get(svcs_host + "/svcs/monk/panda/reloadAll", 
            {
                "monkName"  : mainPandaTableObj.settings.monk_name,
                "turtleName": mainPandaTableObj.settings.turtle_name
            }).done(function () {
                $.pnotify({
                    title: 'Reload All Pandas',
                    text: 'Done!',
                    styling: 'bootstrap',
                    delay: 1000
                });
            }).error(function () {
                $.pnotify({
                    title: 'Reload All Pandas',
                    text: 'Failed!',
                    styling: 'bootstrap',
                    delay: 1000
                });
            });
        }
    });

    // Button :: Testing
    $( "button#startTesting" ).click(function() {
        $('#modal-testing').modal('show');
    });

    // Button :: Start Testing
    $( "button#btn-start-testing").click(function (){
        var _this = $(this);
        $("button#btn-start-testing").button('loading');

        var endpoint = svcs_host + '/svcs/monk/panda/getcategory' + "?monkName=" + mainPandaTableObj.settings.monk_name;
        var data = $("#zet-cat-sentence").val();
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
                // categoryHtml += "<tr><th></th><th></th></tr>"
                categoryHtml += "<tr>";
                for (var i = 0; i < classfiersProbs.length; i++) {
                    var kv = classfiersProbs[i].split(",");
                    // categoryHtml += "  <td><p style=\"font-size:" + (30-2*i) + "px\">" + kv[0] + "</td>";
                    categoryHtml += "  <td>" + kv[0] + "</td>";
                }
                categoryHtml += "</tr>";
                categoryHtml += "<tr>";
                for (var i = 0; i < classfiersProbs.length; i++) {
                    var kv = classfiersProbs[i].split(",");
                    categoryHtml += "  <td>" + parseFloat(kv[1]).toFixed(8) + "</p></td>";
                }
                categoryHtml += "</tr>";
                categoryHtml += "</table>";
                */

                myRefreshTestingBarChart(data);

                $("button#btn-start-testing").button("reset");
                // console.log(categoryHtml);
                // $('div#testing-result').html(categoryHtml);
            }).fail(function (res) {
                $("button#btn-start-testing").button("reset");
                $('div#testing-result').html("<p>好像出了什么问题。请再试一次！</p>");
                console.error(res);
            });
    });

});

// Notification Functions
function navbar_refresh_panda(oData) {
    if (oData == null) {
        $("ul#selected-panda #panda-name").text("");
        $("ul#selected-panda #panda-accuracy").text("");
        $("ul#selected-panda #panda-experience").text("");
    } else {
        $("ul#selected-panda #panda-name").text(oData["NAME"]);
        $("ul#selected-panda #panda-accuracy").text(oData["ACCURACY"].toFixed(4));
        $("ul#selected-panda #panda-experience").text(oData["EXPERIENCE"]);
    }
}
