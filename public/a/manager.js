/*global jQuery*/

function MuzzyTranslationsManager(locale, dbDriver) {
    "use strict";

    var $ = jQuery;

    function optionEl(value, displayed) {
        return $('<option/>').attr({value: value}).append(displayed);
    }

    function stringControl(pageId, id, globalValue, pageValue) {
        return $('<dl/>').append(
            $('<dt/>').append(globalValue)
        ).append(
            $('<dd/>').append(
                $('<textarea/>')
                    .attr({name: id})
                    .html(pageValue)
                    .bind('keydown', function () {
                        $(this).siblings('input').show();
                    })
            ).append(
                $('<input/>')
                    .attr({type: 'button', value: 'save'}).css({display: 'none'})
                    .bind('click', function () {
                        dbDriver.writeTranslation(locale, pageId, id, $(this).siblings('textarea').val());
                        $(this).hide();
                    })
            ).append(
                $('<input/>')
                    .attr({type: 'button', value: 'save as global'}).css({display: 'none'})
                    .bind('click', function () {
                        var newGlobalValue = $(this).siblings('textarea').val();
                        dbDriver.writeTranslation(locale, pageId, id, newGlobalValue, newGlobalValue);
                        $(this).hide();
                        $(this).parents('dl').empty().append(
                            stringControl(pageId, id, newGlobalValue, newGlobalValue)
                        );
                    })
            )
        );
    }

    return {
        loadPageList: function ($el, $translationsContainer) {
            var manager = this;
            dbDriver.readPageIds(
                locale,
                function (data) {
                    var i;
                    $el.append($('<option/>'));
                    for (i = 0; i < data.length; i++) {
                        $el.append(optionEl(data[i], data[i]));
                    }
                    $el.bind('change', function () {
                        if (this.value) {
                            manager.translationsList(this.value, $translationsContainer);
                        }
                    });
                }
            );
        },
        translationsList: function (pageId, c) {
            var ul = $('<ul/>').appendTo(c.empty());
            dbDriver.readPageObjects(locale, pageId, function (data) {
                var i;
                for (i = 0; i < data.length; i++) {
                    ul.append(
                        stringControl(
                            pageId,
                            data[i].key,
                            data[i].defaultTranslation,
                            data[i].pageTranslations[pageId] || data[i].defaultTranslation
                        )
                    );
                }
            });
        }
    };
}