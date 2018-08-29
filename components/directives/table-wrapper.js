/*
 * Angular Fixed Table Header
 * https://github.com/daniel-nagy/fixed-table-header
 * @license MIT
 * v0.2.1
 */

/*
 * Conditii de utilizare:
 * html separat pt. table
 * se foloseste un div wrapper iar template (tabvle) trebuie definit in interiorul un <script type='text/ng-temnplate'>
 * este necesara definirea latimii in px a fiecarei coloane cu <colgroup>
 * la freeze left (atribut: freeze-columns-left="1") este necesar: coloanele respective sa nu aiba colspan sau ng-repeat (sa fie definite static) 
 */

(function(window, angular, undefined) {

    angular.module("App").directive('tableWrapper', directive);
    directive.$inject = ["$window"];

    function directive($window) {
        return {
            restrict: 'A',
            scope: false,
            compile: function(tElement, attrs) {
                var tableLayout = "table-layout:auto;";
                var leftFreezedColumnsAttr = parseInt(attrs.freezeColumnsLeft);
                if (leftFreezedColumnsAttr > 0) tableLayout = "table-layout:fixed;";
                var tableHtml = tElement.html();
                var template = {
                    fixedLayout: tableLayout.startsWith("table-layout:fixed"),
                    createFixedHeader: function() {
                        var headerTable = angular.element(tableHtml);
                        headerTable.find('tbody, tfoot').remove();
                        headerTable.find('thead').css("visibility", "visible");
                        headerTable.addClass('header-clone');
                        headerTable[0].style.cssText = tableLayout + ";width:auto;border:none;";

                        headerTable[0].removeAttribute('table-wrapper');

                        var headerWrapper = createElement('div', { role: "table-header" });
                        headerWrapper.style.cssText = "overflow:hidden;z-index:1;position:absolute;top:0;left:0;right:0";
                        headerWrapper.appendChild(headerTable[0]);
                        tElement[0].appendChild(headerWrapper);

                        var headerScrollbar = createElement("div",
                            {
                                role: "fake-scrollbar",
                                vertical: '',
                                style: "width:20px;position:absolute;right:0;z-index:1"
                            });
                        tElement[0].appendChild(headerScrollbar);

                        var hideHeaderLefFreezedColumns = function() {
                            angular.forEach(headerTable.find('thead tr'),
                                function(element, index) {
                                    angular.forEach(angular.element(element).find('th, td'),
                                        function(element, index) {
                                            if (index < leftFreezedColumnsAttr) element.style.display = 'none';
                                            else {
                                                angular.element(element).find('input').attr('tabindex', '-1');
                                            }
                                        });
                                });
                            angular.forEach(headerTable.find('colgroup> col'),
                                function(element, index) {
                                    if (index < leftFreezedColumnsAttr) element.style.display = 'none';
                                });
                        };
                        hideHeaderLefFreezedColumns();
                    },
                    createBodyScroller: function() {
                        var tableScroller = createElement("div",
                            {
                                role: "table-scroller",
                                'scroller1': 'bidirectional',
                                'scrollbar-width': '14',
                                style: "overflow-x:auto;overflow-y:scroll;padding-right:0;position:absolute;top:0;right:0;bottom:0;left:0"
                            });

                        var content = angular.element(tableHtml);
                        content[0].style.cssText = content[0].style.cssText + ';' + tableLayout + ";border-bottom:none;border-right:none";
                        var header = content.find('thead');
                        header[0].style.visibility = "hidden";
                        angular.forEach(content.find('thead tr'),
                            function(element, index) {
                                angular.forEach(angular.element(element).find('th, td'),
                                    function(element, index) {
                                        if (index < leftFreezedColumnsAttr) element.setAttribute('left-freezed-column', '');
                                    });
                            });
                        angular.forEach(content.find('tbody tr'),
                            function(element, index) {
                                angular.forEach(angular.element(element).find('th, td'),
                                    function(element, index) {
                                        if (index < leftFreezedColumnsAttr) {
                                            element.style.visibility = 'hidden';
                                            element.setAttribute('left-freezed-column', '');
                                        }
                                    });
                            });
                        angular.forEach(content.find('tfoot tr'),
                            function(element, index) {
                                angular.forEach(angular.element(element).find('th, td'),
                                    function(element, index) {
                                        if (index < leftFreezedColumnsAttr) element.setAttribute('left-freezed-column', '');
                                    });
                            });
                        tableScroller.appendChild(content[0]);
                        tElement[0].appendChild(tableScroller);

                    },
                    createLeftFreezedColumns: function() {
                        if (!(leftFreezedColumnsAttr > 0)) return; // jshint ignore:line
                        var wrapper = createElement('div', { role: 'table-left' });
                        wrapper.style.cssText = "position:absolute;left: 0;top: 0;z-index:3;bottom:0";
                        wrapper.addClass('left-freezed-columns');
                        var headerTable = angular.element(tableHtml);
                        headerTable.find('tbody, tfoot').remove();
                        headerTable[0].style.cssText = 'border-left:none;border-top:none;border-bottom:none';
                        headerTable.attr('role', 'header');
                        var bodyTable = angular.element(tableHtml);
                        bodyTable.find("thead").remove();
                        bodyTable.css({ "border-top": "none", "border-bottom": "none", "border-left": "none", 'margin-top': '-1px' });
                        var hideLeftFreezedColumns = function() {
                            angular.forEach(angular.element(headerTable).find('thead tr'),
                                function(element, index) {
                                    angular.forEach(angular.element(element).find('th, td'),
                                        function(element, index) {
                                            if (index >= leftFreezedColumnsAttr) element.style.display = 'none';
                                            else element.setAttribute('left-freezed-column', '');
                                        });
                                });
                            angular.forEach(angular.element(bodyTable).find('tbody tr'),
                                function(element, index) {
                                    angular.forEach(angular.element(element).find('td'),
                                        function(element, index) {
                                            if (index >= leftFreezedColumnsAttr) element.style.display = 'none';
                                            else element.setAttribute('left-freezed-column', '');
                                        });
                                });
                            angular.forEach(angular.element(bodyTable).find('tfoot tr'),
                                function(element, index) {
                                    angular.forEach(angular.element(element).find('th, td'),
                                        function(element, index) {
                                            if (index >= leftFreezedColumnsAttr) element.style.display = 'none';
                                            else element.setAttribute('left-freezed-column', '');
                                        });
                                });
                        };
                        hideLeftFreezedColumns();
                        wrapper.appendChild(headerTable[0]);
                        var bodyWrapper = createElement('div', { role: 'body' });
                        bodyWrapper.style.cssText = "overflow:hidden;";
                        bodyWrapper.appendChild(bodyTable[0]);
                        wrapper.appendChild(bodyWrapper);
                        var fakeScrollbar = createElement("div",
                            {
                                role: "fake-scrollbar",
                                horizontal: '',
                                style: "position:absolute;left:0;bottom:0;z-index:2;height:0;border-bottom:1px solid white"
                            });
                        wrapper.appendChild(fakeScrollbar);

                        tElement[0].appendChild(wrapper);
                    },
                    create: function() {
                        tElement.html('');
                        tElement.css('overflow', 'hidden');
                        this.createLeftFreezedColumns();
                        this.createFixedHeader();
                        this.createBodyScroller();
                    }
                };

                template.create();

                return {
                    post: function(scope, tElement, attrs) {
                        var html = tElement[0].innerHTML;
                        var table = {
                            toolbar: tElement.find('ax-toolbar'),
                            header: tElement.find('[role=table-header] table'),
                            headerScrollbar: tElement.find('[role=fake-scrollbar][vertical]'),
                            original: tElement.find('[role=table-scroller] table'),
                            scroller: tElement.find('[role=table-scroller]'),
                            leftFreezedColumns: tElement.find('[role=table-left]'),
                            leftFreezedColumnsBody: tElement.find('[role=table-left] [role=body] > table'),
                            wrapper: tElement,
                            getWrapperHeight: function() {
                                return table.wrapper.height();
                            },
                            setScrollerHeight: function() {
                                table.marginTop(table);
                                table.scrollerHeight();
                            },
                            headerHeight: function() {
                                var height = table.header.prop('clientHeight');
                                //console.log("header height", height, header.original[0].outerHTML);
                                return height + 1;
                            },

                            footerHeight: function() {
                                var height = table.footer ? table.footer.prop('clientHeight') : 0;
                                return height;
                            },
                            otherHeight: function() {
                                var height = 0;
                                height += table.header ? table.header.prop('clientHeight') : 0;
                                height += table.footer ? table.footer.prop('clientHeight') : 0;
                                height += table.toolbar ? table.toolbar.prop('clientHeight') || 0 : 0;
                                height += table.paginator ? table.paginator.prop('clientHeight') || 0 : 0;
                                return height;
                            },

                            wrapperHeight: function() {
                                var height = table.wrapper.prop('clientHeight');
                                return height;
                            },

                            marginTop: function(table) {
                                var top = this.headerHeight();
                                var bottom = this.footerHeight();
                                table.scroller.css('top', (top - 1) + 'px');
                                table.scroller.find('table').css('marginTop', '-' + (top - 1) + 'px');
                                table.scroller.find('table').css('marginBottom', '-' + (bottom - 1) + 'px');
                                var width;
                                if (table.scroller.find('[role=vertical-scrollbar]').length > 0) width = table.scroller.find('[role=vertical-scrollbar]').width();
                                else width = table.scroller[0].offsetWidth - table.scroller[0].clientWidth;
                                table.headerScrollbar.css({
                                    top: (table.toolbar.prop('clientHeight') || 0),
                                    height: top + 'px',
                                    width: width + 'px'
                                });
                                table.header.parent().css('padding-right', width);
                                if (table.leftFreezedColumns)
                                    table.leftFreezedColumns.find('[role=fake-scrollbar]').css('height', width + 1);
                            },

                            scrollerHeight: function() {
                                var other = table.otherHeight(), wrapper = table.wrapperHeight();
                                var scrollerHeight = (wrapper - other - 1) + 'px';
                                //table.scroller.css('height', scrollerHeight);
                                if (table.leftFreezedColumnsBody) table.leftFreezedColumnsBody.parent().css('height', scrollerHeight);
                            },

                            getFreezedColumnsLeftWidth: function() {
                                if (!table.leftFreezedColumns) return "0";
                                var style = $window.getComputedStyle(table.leftFreezedColumns[0]);
                                return style.width;
                            }
                        };


                        table.scroller.on('scroll',
                            function(event) {
                                var scrollLeft = event.originalEvent.scrollLeft || table.scroller.prop('scrollLeft');
                                if (table.header)
                                    table.header.css('transform', 'translate3d(-' + scrollLeft + 'px, 0, 0)');
                                if (table.footer)
                                    table.footer.css('transform', 'translate3d(-' + scrollLeft + 'px, 0, 0)');
                                var scrollTop = event.originalEvent.scrollTop || table.scroller.prop('scrollTop');
                                table.leftFreezedColumnsBody.css('transform', 'translate3d(0, -' + scrollTop + 'px,  0)');
                            });

                        scope.$watch(table.getWrapperHeight, table.setScrollerHeight);
                        angular.element($window).bind("resize", table.setScrollerHeight);
                        scope.$on('$destroy',
                            function() {
                                angular.element($window).unbind("resize", table.setScrollerHeight);
                            });


                        var header = {
                            cellsCnt: function() {
                                return table.original.find('thead th, thead td').length;
                            },
                            getCells: function(node) {
                                //console.log("header", node);
                                return Array.prototype.map.call(node.find('th,td'),
                                    function(cell) {
                                        return angular.element(cell);
                                    });
                            },
                            updateCells: function() {
                                var cells = {
                                    clone: header.getCells(table.header.find('thead')),
                                    original: header.getCells(table.original.find('thead'))
                                };
                                table.marginTop(table);
                                table.scrollerHeight();

                                cells.clone.forEach(function(clone, index) {
                                    if (clone.data('isClone')) {
                                        return;
                                    }
                                    // prevent duplicating watch listeners
                                    clone.data('isClone', true);

                                    var cell = cells.original[index];
                                    var headerCellstyle = $window.getComputedStyle(cell[0]);

                                    var getCellWidth = function() {
                                        //console.log("getCellWidth", style.width);
                                        return headerCellstyle.width;
                                    };

                                    var setCellWidth = function(newVal, oldVal) {
                                        //console.log(cell[0].innerHTML, headerCellstyle.width);
                                        clone.css({ minWidth: headerCellstyle.width, maxWidth: headerCellstyle.width });
                                        //clone.css({ width: headerCellstyle.width });
                                    };
                                    scope.$watch(getCellWidth, setCellWidth);
                                    $window.addEventListener('resize', setCellWidth);
                                    scope.$on('$destroy',
                                        function() {
                                            $window.removeEventListener('resize', setCellWidth);
                                        });

                                });
                            },
                            watch: function() {
                                scope.$watch(this.cellsCnt, this.updateCells);
                            }
                        };
                        header.watch();
                        var leftFreezedColumns = {
                            cellsCnt: function() {
                                if (!table.leftFreezedColumns) return 0;
                                return table.leftFreezedColumns.find('[left-freezed-column]').length;
                            },
                            getCells: function(node) {
                                //console.log("header", node);
                                return Array.prototype.map.call(node,
                                    function(cell) {
                                        return angular.element(cell);
                                    });
                            },
                            setLeftMargin: function(value) {
                                table.scroller.css('left', value);
                                table.original.css('margin-left', '-' + value);
                                table.leftFreezedColumns.find('[role=fake-scrollbar]').css('width', value);
                                table.header.parent().css({ left: (parseFloat(value) - 1) + 'px' });
                            },
                            updateCells: function(value) {
                                if (!value) return;
                                var cells = {
                                    clone: leftFreezedColumns.getCells(table.leftFreezedColumns.find('[left-freezed-column]')),
                                    original: leftFreezedColumns.getCells(table.original.find('[left-freezed-column]'))
                                };

                                cells.clone.forEach(function(clone, index) {
                                    if (clone.data('isClone')) {
                                        return;
                                    }
                                    clone.data('isClone', true);
                                    var cell = {
                                        element: cells.original[index]
                                    };
                                    angular.extend(cell,
                                        {
                                            element: cells.original[index],
                                            style: $window.getComputedStyle(cell.element[0]),
                                            getOriginalHeight: function() {
                                                return cell.style.height;
                                            },
                                            setCloneHeight: function(newVal, oldVal) {
                                                clone.css({ height: cell.style.height });
                                            },
                                            getOriginalWidth: function() {
                                                return cell.style.width;
                                            },

                                            setCloneWidth: function(newVal, oldVal) {
                                                clone.css({ minWidth: cell.style.width, maxWidth: cell.style.width });
                                            },
                                            bindEvents: function() {
                                                scope.$watch(cell.getOriginalHeight, cell.setCloneHeight);
                                                scope.$watch(cell.getOriginalWidth, cell.setCloneWidth);
                                                $window.addEventListener('resize', cell.setCloneWidth);
                                                scope.$on('$destroy',
                                                    function() {
                                                        $window.removeEventListener('resize', cell.setCloneWidth);
                                                    });

                                            }
                                        });
                                    cell.bindEvents();
                                });
                            },
                            watch: function() {
                                if (table.leftFreezedColumns.length === 0) return;
                                scope.$watch(this.cellsCnt, this.updateCells);
                                scope.$watch(table.getFreezedColumnsLeftWidth, this.setLeftMargin);
                            }
                        };
                        leftFreezedColumns.watch();

                        //var scrollerStyle = $window.getComputedStyle(table.original[0]);
                        //var getTableWidth = function() {
                        //    return scrollerStyle.width;
                        //}
                        //scope.$watch(getTableWidth,
                        //    function(value) {
                        //        var scrollerStyle = $window.getComputedStyle(table.original[0]);
                        //        angular.element(table.original[0]).parent().css("width", scrollerStyle.width);
                        //    });

                    }
                };
            }
        };
    }


})(window, angular);