class axTableLayout {
	/**
	 * @param {axTableController} $controller
	 * @param {$scope} scope
	 */
	constructor($controller, scope) {
		return this.create($controller, scope);
	}

	create($controller, scope) {
		var $template = $controller.$template;
		var $element = $controller.element.linked;
		var $scroller = $element.find(">ax-table-content>[role=table-scroller]");
		var $axTable = $scroller.closest($controller.element.tag);
		var $layout = this;
		var elementHeight = function () {
			if (this.element.length === 0) return 0;
			else return this.element.prop('offsetHeight');
		};
		var elementWidth = function () {
			if (this.element.length === 0) return 0;
			else return this.element.prop('offsetWidth');
		};
		this.$destroy = function () {
			if ($layout.destroy) $layout.destroy();
			$layout = null;
			$controller = null;
			$template = null;
			this.__proto__ = null; //jshint ignore:line
		};
		this.attrs = {
			hasVirtualScroll: $controller.attrs.pageSize === 'ALL' && $controller.attrs.paginate === 'client',
			hasVariableRowHeight: $controller.attrs.hasVariableRowHeight === "true",
			hasFixedHeader: $controller.element.hasFixedHeader,
			hasEditor: $controller.attrs.hasGrid === "true" && $controller.element.editorDef.length > 0,
			editorPosition: $controller.element.editorDef.length && $controller.element.editorDef.getAttribute("position"),
			hasHorizontalVirtualScroll: $controller.attrs.hasHorizontalVirtualScroll === "true",
			syncHeadersRowsHeight: $controller.attrs.syncHeadersRowsHeight === "true",
			width: 0,
			height: 0
		};
		var debounceOptions = {
			vertical: {
				wait: $layout.attrs.hasHorizontalVirtualScroll ? $controller.columns.no * 0.01 : 0,
				options: {}
			}, horizontal: {
				wait: $layout.attrs.hasHorizontalVirtualScroll ? $controller.columns.no * 0.02 : 0,
				options: {leading: false}
			}
		};
		this.axTable = {
			element: $axTable,
			height: elementHeight,
			width: elementWidth
		};
		this.set = {
			global: function () {
				$layout.toolbar.set.rigth();
				$layout.header.set.top();
				$layout.headerVerticalFakeScrollbar.set.top();
				$layout.headerVerticalFakeScrollbar.set.height();
				$layout.scroller.set.top();
				$layout.scroller.set.bottom();
				$layout.scroller.set.right();
				$layout.set.widthChanged();
				$layout.set.updateCells();
			},
			updateCells: function () {
				$layout.updateCells($layout.leftPanel, '>[role=table-left]');
				$layout.updateCells($layout.rightPanel, '>[role=table-right]');
			},
			toggleShowHorizontalScrollers: function () {
				let marginLeft = $layout.leftPanel.table.width();
				let bottom = $layout.paginator.height();
				let hasLeftScrollbar = $layout.leftPanel.table.width() > $layout.leftPanel.width();
				let hasRightScrollbar = $layout.rightPanel.table.width() > $layout.rightPanel.width();
				let hasBodyScrollbar = $layout.attrs.hasHorizontalVirtualScroll ? (true) : (parseInt($layout.scroller.table.width()) > $layout.scroller.width());
				let hasHorizontalScrollbar = hasLeftScrollbar || hasRightScrollbar || hasBodyScrollbar;
				if (hasHorizontalScrollbar && !hasLeftScrollbar) $layout.leftPanel.scrollbar.show();
				else $layout.leftPanel.scrollbar.hide();
				if (hasHorizontalScrollbar && !hasRightScrollbar) $layout.rightPanel.scrollbar.show();
				else $layout.rightPanel.scrollbar.hide();
				if ($layout.attrs.hasHorizontalVirtualScroll) {

					var horizontalScrollbarHeight = $layout.verticalScroller.width();
					$layout.scroller.element.css("bottom", (bottom + horizontalScrollbarHeight) + "px");
					$layout.verticalScroller.set.bottom();

				}
				else if (hasHorizontalScrollbar) $layout.scroller.element.css("overflow-x", "scroll");
				else $layout.scroller.element.css("overflow-x", "hidden");
			},
			heightChanged: function () {
				let old = $controller.scrollerHeight;
				$layout.scroller.set.top();
				$layout.scroller.set.bottom();
				$layout.attrs.height = $layout.axTable.height();
				if ($layout.attrs.hasVirtualScroll) {
					$controller.scrollerHeight = $layout.scroller.element.prop('clientHeight');
					//if ($controller.getCollection('viewed', true) > 0) $controller.paginateApply(false, false); are probleme la show/hide ax-dt
					if ($controller.getCollection('items', true) > 0) $controller.paginateApply(false, false);
				}
			},
			toggleShowRightBorder() {
				$controller.$timeout(function () {
					let width = $layout.scroller.element.find("th.empty-column").width();
					if (width <= 0 || width === undefined) {
						let rowToSkip = 0;
						$layout.scroller.element.find("thead>tr").each(function (index, item) {
							if (rowToSkip > 0) return rowToSkip--;
							let th = angular.element(item).find("th").not('[right-freezed-column], [hidden-column], [colspan=0]').last();
							// console.log("ths", ths);
							if (th.attr("rowspan")) rowToSkip = parseInt(th.attr("rowspan")) - 1;
							if (!th.hasClass("last-column")) th.addClass("last-column");
						});
					} else {
						$layout.scroller.element.find(" tr>th.last-column").removeClass("last-column");
					}
				});
			},
			widthChanged: function () {
				if ($layout.attrs.hasEditor && $layout.attrs.editorPosition !== "over") {
					// let totalWidth = $element.parent().width();
					let editor = $element.parent().find(">ax-table-editor");
					let popupWidth = editor.css("display") != "none" ? $element.parent().find(">ax-table-editor").outerWidth() : 0;
					popupWidth = popupWidth === undefined ? 0 : popupWidth;
					//console.log($layout.attrs.editorPosition, $element.css("left"), $element.css("right"));
					if ($layout.attrs.editorPosition === "right")
						$element.css({"right": popupWidth, "width": "initial"});
					if ($layout.attrs.editorPosition === "left") {
						//$element.width(totalWidth - popupWidth-1);
						$element.css({"left": popupWidth, "width": "initial"});
					}
					//console.log($layout.attrs.editorPosition, $element.css("left"), $element.css("right") );
				}
				$layout.scroller.set.left();
				$layout.scroller.set.right();
				$layout.set.toggleShowHorizontalScrollers();
				$layout.attrs.width = $layout.axTable.width();
				// if ($layout.leftPanel.element.length > 0) this.toggleShowRightBorder();
				this.toggleShowRightBorder();
				this.heightChanged();
			}
		};
		this.handlers = {
			windowResize: function () {
				if ($controller.$destroying) return;
				$layout.set.widthChanged();
				scope.$apply();
			}
		};
		this.getCells = function (node) {
			return Array.prototype.map.call(node,
				function (cell) {
					return angular.element(cell);
				});
		};
		this.updateCells = function (panel, selector) {
			if (panel.element.length === 0) return;
			var cells;
			if ($layout.attrs.hasFixedHeader)
				cells = {
					clone: $layout.getCells(panel.element.find('table>tbody>tr, table>thead>tr')),
					original: $layout.getCells($element.find('>ax-table-content>[role=table-scroller]>table>tbody > tr, >ax-table-content>[role=table-header]>table>thead>tr'))
				};
			else if ($layout.attrs.syncHeadersRowsHeight)
				cells = {
					clone: $layout.getCells(panel.element.find('table>thead>tr')),
					original: $layout.getCells($layout.scroller.element.find('table>thead>tr'))
				};
			else return;
			cells.clone.forEach(function (clone, index) {
				if (!clone.data('extended')) {
					var cell = {
						original: cells.original[index],
						clone: clone,
					};
					clone.data('extended',
						angular.extend(cell,
							{
								originalStyle: window.getComputedStyle(cell.original[0]),
								cloneStyle: window.getComputedStyle(cell.clone[0]),
								getOriginalHeight: function () {
									return cell.original.height();
								},
								getCloneHeight: function () {
									return clone.style.height;
								},
								setCloneHeight: function (newVal, oldVal) {
									let height = Math.max(parseInt(cell.originalStyle.height), parseInt(cell.cloneStyle.height));
									cell.original.css("height", height + "px");
									cell.clone.css("height", height + "px");
									//console.log(clone,cell.style.height);
								},
								getOriginalWidth: function () {
									return cell.style.width;
								},

								setCloneWidth: function (newVal, oldVal) {
									clone.css({minWidth: cell.style.width, maxWidth: cell.style.width});
								},
								bindEvents: function () {
									$controller.$timeout(cell.setCloneHeight);
								}
							}));
					//console.log(cell);
					//cell.setCloneHeight();
					//scope.$watch(cell.getOriginalHeight, cell.setCloneHeight);
				} else {
					var test = 1;
					//console.log(clone, clone.data('extended').getOriginalHeight());
				}
				clone.data('extended').setCloneHeight();
			});
		};
		this.init = function () {
			$controller.debug.log("layout init");
			var horizontalScrollEventHandler = function (event) {
				$controller.scrollLeft = event.scrollLeft || $layout.scroller.horizontalScroller.scrollLeft();
				// console.log("header scroll ", $controller.scrollLeft);
				if ($layout.header.getVisibleColumns) {
					$layout.header.getVisibleColumns();
					scope.$apply();
				}

			};
			//console.log("debounce", debounceOptions.horizontal, $layout.attrs.hasHorizontalVirtualScroll);
			var windowResize = function () {
				$layout.handlers.windowResize();
			};

			if (debounceOptions.horizontal.wait > 10) {
				horizontalScrollEventHandler = _.debounce(horizontalScrollEventHandler, debounceOptions.horizontal.wait, debounceOptions.horizontal.options);
				windowResize = _.debounce(windowResize, debounceOptions.horizontal.wait, debounceOptions.horizontal.options);
			}
			var scrollEventHandler = function (event) {
				//scrollLeft position este necesar pt. mentinrea visibila a grooup-header-ului;
				//TODO de verificat daca template-ul are nevoie de asa ceva
				$controller.scrollLeft = event.scrollLeft || $layout.scroller.element.scrollLeft();
				var scrollTop = $layout.attrs.hasVirtualScroll ? $layout.verticalScroller.element.scrollTop() : (event.scrollTop || $layout.scroller.element.scrollTop());
				// console.log("scrollEventHandle", $controller.scrollLeft, scrollTop );
				if ($layout.attrs.hasFixedHeader) {
					if ($controller.scrollTop !== scrollTop) {
						$controller.scrollTop = scrollTop;
						$layout.leftPanel.table.css('transform', 'translate3d(0, -' + $controller.scrollTop + 'px,  0)');
						$layout.rightPanel.table.css('transform', 'translate3d(0, -' + $controller.scrollTop + 'px,  0)');
						$controller.setVirtualScrollPosition($controller.scrollTop, false, false, true);
					}
					$layout.header.table.css('transform', 'translate3d(-' + $controller.scrollLeft + 'px, 0, 0)');
					if ($layout.header.getVisibleColumns) $layout.header.getVisibleColumns();
				} else if (scrollTop) {
					$layout.scroller.element.scrollTop(0);
				}
				_.defer(function () {
					scope.$apply();
				});
			};
			var verticalVirtualScrollEventHandler = function (event) {
				if ($controller.stopVirtualScroll || $controller.inlineEditing || $controller.$destroying) return;
				var direction = $layout.verticalScroller.element.scrollTop() > ($controller.scrollTop || 0) ? virtualScrollDirections.down : virtualScrollDirections.up;
				$controller.scrollTop = $layout.verticalScroller.element.scrollTop();
				//console.log("virtualScrollEventHandler ", $controller.scrollTop);
				if ($layout.attrs.hasVirtualScroll) $controller.setVirtualScrollPosition($controller.scrollTop);
				else $layout.scroller.element.scrollTop($controller.scrollTop);
				scope.$apply();
			};
			var mouseWheelScrollEvent = function (e) {
				var event = window.event || e;
				var delta = event.detail ? event.detail / (-3) : event.wheelDelta / 120;
				if ($controller.virtualTableHeight === undefined || $controller.virtualTableHeight < $layout.verticalScroller.height() || $controller.inlineEditing) return;
				$controller.scrollTop += -(delta * mouseWhellScrollStep);
				$controller.scrollTop = Math.max(0, $controller.scrollTop);
				$controller.scrollTop = Math.min(Math.max($layout.verticalScroller.height(), $controller.virtualTableHeight - $layout.verticalScroller.height()), $controller.scrollTop);
				//console.log("mouseWheelScrollEvent ", $controller.scrollTop, Math.max($layout.verticalScroller.height(), $controller.virtualTableHeight - $layout.verticalScroller.height()), $controller.virtualTableHeight - $layout.verticalScroller.height());
				if ($layout.attrs.hasVirtualScroll) $controller.setVirtualScrollPosition($controller.scrollTop, false, false, true);
				else $layout.scroller.element.scrollTop($controller.scrollTop);
				scope.$apply();
			};
			$controller.panEventHandler = function (direction, event) {
				var delta = event.deltaY / 120;
				if ($controller.virtualTableHeight === undefined || $controller.virtualTableHeight < $layout.verticalScroller.height() || $controller.inlineEditing) return;
				$controller.scrollTop += direction*(event.distance);
				$controller.scrollTop = Math.max(0, $controller.scrollTop);
				$controller.scrollTop = Math.min(Math.max($layout.verticalScroller.height(), $controller.virtualTableHeight - $layout.verticalScroller.height()), $controller.scrollTop);
				// console.log("panEvent", $controller.scrollTop, event.deltaY , event);
				if ($layout.attrs.hasVirtualScroll) $controller.setVirtualScrollPosition($controller.scrollTop, false, false, true);
				else $layout.scroller.element.scrollTop($controller.scrollTop);
			};
			if (debounceOptions.vertical.wait > 10) {
				mouseWheelScrollEvent = _.debounce(mouseWheelScrollEvent, debounceOptions.vertical.wait, debounceOptions.vertical.options);
				scrollEventHandler = _.debounce(scrollEventHandler, debounceOptions.vertical.wait, debounceOptions.vertical.options);
				verticalVirtualScrollEventHandler = _.debounce(verticalVirtualScrollEventHandler, debounceOptions.vertical.wait, debounceOptions.vertical.options);
			}
			axUtils.addEventListener($layout.scroller.element[0], 'scroll', scrollEventHandler);
			axUtils.addEventListener($layout.scroller.element[0], mouseWhellEventName, mouseWheelScrollEvent);
			if ($layout.leftPanel.element.length > 0) axUtils.addEventListener($layout.leftPanel.element[0], mouseWhellEventName, mouseWheelScrollEvent);
			if ($layout.rightPanel.element.length > 0) axUtils.addEventListener($layout.rightPanel.element[0], mouseWhellEventName, mouseWheelScrollEvent);
			if ($layout.attrs.hasHorizontalVirtualScroll) axUtils.addEventListener($layout.scroller.horizontalScroller[0], 'scroll', horizontalScrollEventHandler);
			axUtils.addEventListener($layout.verticalScroller.element[0], 'scroll', verticalVirtualScrollEventHandler);
			//axUtils.addEventListener($layout.verticalScroller.element[0], 'scroll', verticalVirtualScrollEventHandler);
			// angular.element(window).bind("resize", $layout.handlers.windowResize); nu functioneaza mereu!!!!
			if (this.destroy) this.destroy();
			axUtils.addEventListener(window, 'resize', windowResize);
			this.destroy = function () {
				axUtils.removeEventListener(window, 'resize', windowResize);
			};

			this.set.global();
			$controller.$timeout(this.set.global);
		};
		this.toolbar = {
			element: $element.find(">ax-table-content>[role=toolbar]"),
			height: elementHeight,
			set: {
				rigth: function () {
					if ($layout.toolbar.element.length === 0) return;
					$layout.toolbar.element.css('right', $layout.verticalScroller.width() + "px");
				}
			}
		};
		this.header = {
			element: $element.find(">ax-table-content>[role=table-header]"),
			table: $element.find(">ax-table-content>[role=table-header] > table"),
			thead: function () {
				if (!$layout.attrs.hasFixedHeader) return $scroller.find(">table>thead");
				else return this.table.find(">thead");
			},
			height: function () {
				if ($layout.header.thead().length === 0) return 0;
				let height = window.getComputedStyle($layout.header.thead()[0]).height;
				//console.log("height:", height, $layout.header.thead().height());
				return height.includes("px") ? parseInt(height) : $layout.header.thead().height();
			},
			set: {
				top: function () {
					$layout.header.element.css('top', $layout.toolbar.height() + 'px');
				},
				right: function () {
					$layout.header.element.css('right', $layout.scroller.element.css('right'));
					if ($layout.header.getVisibleColumns) $layout.header.getVisibleColumns();
				},
				left: function () {
					$layout.header.element.css('left', $layout.scroller.element.css('left'));
				}
			}
		};
		$controller.columns.visibleColumns = [];
		if ($controller.attrs.hasHorizontalVirtualScroll === "true")
			this.header.getVisibleColumns = function () {
				let scrollLeft = $controller.scrollLeft || 0;
				let visibleWidth = $layout.scroller.element.width();
				let previous = {
					first: $controller.columns.visible.length ? $controller.columns.visible[0].title : "",
					last: $controller.columns.visible.length ? $controller.columns.visible[$controller.columns.visible.length - 1].title : ""
				};
				//console.log("previous", previous.last);

				let width = 0, firstColumn, lastColumn, marginLeft = 0;
				$controller.columns.visible = [];
				$controller.columns.showScrollBar = false;
				$controller.columns.hideable.each(function (column, i) {
					column.isScrollVisible = false;
					if (column.hidden || column.leftFreezedColumn) return true;
					if (lastColumn || column.rightFreezedColumn) return true; //must be true for iterate all columns


					width += column.width;
					if (!firstColumn && width >= scrollLeft) {
						firstColumn = column;
						marginLeft = column.width - (width - scrollLeft);
					}

					if (!firstColumn) return true;
					column.isScrollVisible = true;
					$controller.columns.visible.push(column);
					//console.log(width, scrollLeft + visibleWidth, scrollLeft , visibleWidth, column.title);
					if (width >= scrollLeft + visibleWidth || column.title === "Empty column") {
						lastColumn = column;
					}
				}, $controller);
				$controller.element.marginLeft = marginLeft;
				if (firstColumn && lastColumn && firstColumn.title === previous.first && lastColumn.title === previous.last) {
					//console.log("template translate: first", firstColumn.title, "last:", lastColumn.title);
					$layout.scroller.element.find(">table").css('transform', 'translate3d(-' + marginLeft + 'px, 0, 0)');
				} else {
					//console.log("template changed: first", firstColumn.title, "last:", lastColumn.title);
					let bodyHtml = $controller.$scroller.changeBody(-marginLeft);
					$controller.body.compile(bodyHtml);
				}
				if ($controller.attrs.hasDynamicTemplate !== "true") $controller.$$grid.element.show();
			};

		this.headerVerticalFakeScrollbar = {
			element: $element.find(">ax-table-content>[role=fake-scroller][header]"),
			set: {
				height: function () {
					$layout.headerVerticalFakeScrollbar.element.height($layout.header.height());
				},
				top: function () {
					$layout.headerVerticalFakeScrollbar.element.css("top", $layout.rightPanel.element.length > 0 ? 0 : $layout.toolbar.height() + 'px');
				}
			}
		};
		this.leftPanel = {
			element: $element.find(">ax-table-content>[role=table-left]"),
			table: $element.find(">ax-table-content>[role=table-left]>table:not([role=header]), >ax-table-content>[role=table-left]> [role=body]>table"),
			scrollbar: $element.find(">ax-table-content>[role=table-left]>[role=fake-scrollbar]"),
			height: elementHeight,
			width: elementWidth,
			set: {
				top: function () {
					$layout.leftPanel.table.css('marginTop', $layout.scroller.table.css('marginTop'));
					var top = $layout.attrs.hasFixedHeader ? $layout.header.element.css('top') : $layout.scroller.element.css('top');
					$layout.leftPanel.element.css('top', top);
				},
				bottom: function () {
					var bottom = $layout.attrs.hasHorizontalVirtualScroll ? parseFloat($layout.scroller.horizontalScroller.css('bottom')) : parseFloat($layout.scroller.element.css('bottom'));
					$layout.leftPanel.element.css('bottom', bottom + 'px');
					if (!$layout.attrs.hasVirtualScroll) $layout.leftPanel.element.find('[role=body]').height(($layout.scroller.height() - $layout.scroller.table.find(">thead").height()) + 'px');
				}
			}
		};
		this.rightPanel = {
			element: $element.find(">ax-table-content>[role=table-right]"),
			table: $element.find(">ax-table-content>[role=table-right]>table:not([role=header]), >ax-table-content>[role=table-right]> [role=body]>table"),
			scrollbar: $element.find(">ax-table-content>[role=table-right]>[role=fake-scrollbar][right]"),
			height: elementHeight,
			width: elementWidth,
			set: {
				top: function () {
					$layout.rightPanel.table.css('marginTop', $layout.scroller.table.css('marginTop'));
					var top = $layout.attrs.hasFixedHeader ? $layout.header.element.css('top') : $layout.scroller.element.css('top');
					$layout.rightPanel.element.css('top', top);
				},
				bottom: function () {
					var bottom = $layout.attrs.hasHorizontalVirtualScroll ? parseFloat($layout.scroller.horizontalScroller.css('bottom')) : parseFloat($layout.scroller.element.css('bottom'));
					$layout.rightPanel.element.css('bottom', bottom);
					if ($layout.attrs.hasVirtualScroll) $layout.rightPanel.element.find('[role=body]').height($layout.scroller.element.height() + 'px');
				},
				right: function () {
					$layout.rightPanel.element.css('right', $layout.verticalScroller.width() + 'px');
				}
			}
		};
		this.scroller = {
			element: $scroller,
			table: $scroller.find(">table"),
			horizontalScroller: $element.find(">ax-table-content>[role=horizontal-scroller]"),
			height: elementHeight,
			width: elementWidth,
			visibleHeight: function () {
				return this.element.prop('clientHeight');
			},
			set: {
				top: function () {
					var toolbarHeight = $layout.toolbar.height();
					var headerHeight = $layout.attrs.hasFixedHeader ? $layout.header.height() : 0;
					$layout.scroller.element.css('top', (toolbarHeight + headerHeight) + 'px');
					//console.log("scroller top", toolbarHeight + headerHeight);
					$layout.leftPanel.set.top();
					$layout.rightPanel.set.top();
					$layout.verticalScroller.set.top();
				},
				bottom: function () {
					let bottom = $layout.paginator.height();
					if ($layout.attrs.hasHorizontalVirtualScroll) $layout.scroller.horizontalScroller.css("bottom", bottom + 'px');
					else $layout.scroller.element.css('bottom', $layout.paginator.height() + 'px');
					// console.log("scroller botom", $layout.paginator.height() );
					$layout.leftPanel.set.bottom();
					$layout.rightPanel.set.bottom();
					$layout.verticalScroller.set.bottom();
					//console.log("scrolleHeight", $layout.scroller.height());
				},
				left: function () {
					var leftPanelWidth = $layout.leftPanel.width();
					if (leftPanelWidth === 0) return;
					let tableWidth = $layout.leftPanel.table.width();
					leftPanelWidth = Math.min(tableWidth + 2, leftPanelWidth);
					//leftPanelWidth +=1;
					//var width = $element.prop('clientWidth') - $layout.rightPanel.width() - $layout.verticalScroller.width();
					let width = "100%";
					//$layout.scroller.table.css({ 'marginLeft': -tableWidth + 'px' });
					//$layout.scroller.table.css({ 'marginLeft': 0 });
					$layout.scroller.element.css('left', leftPanelWidth + 'px');
					if ($layout.attrs.hasHorizontalVirtualScroll) $layout.scroller.horizontalScroller.css("left", leftPanelWidth + 'px');

					$layout.header.set.left();
					//console.log("layout", $layout.leftPanel.table.width(), leftPanelWidth )
				},
				right: function () {
					var right = $layout.verticalScroller.width() + $layout.rightPanel.width();
					$layout.scroller.element.css('right', (right - 0) + 'px');
					if ($layout.attrs.hasHorizontalVirtualScroll) $layout.scroller.horizontalScroller.css('right', (right - 0) + 'px');
					if ($controller.element.tableWidth) {
						//let tableWidth = $controller.element.tableWidth;
						//let rightEmptySpace = $layout.scroller.width() - ($controller.element.tableWidth - $layout.leftPanel.table.width()) + $layout.verticalScroller.width();
						//tableWidth += rightEmptySpace - $layout.verticalScroller.width();
						//$layout.scroller.table.css("width", tableWidth + "px");
						//console.log("tableWidth", $layout.scroller.table, tableWidth, $controller.element.tableWidth, $layout.leftPanel.table.width() - $layout.leftPanel.width(), $element.width(), rightEmptySpace);
					}
					$layout.rightPanel.set.right();
					$layout.header.set.right();

				}
			}
		};
		this.paginator = {
			element: $element.find(">ax-table-content>[role=paginator]"),
			height: elementHeight
		};
		this.verticalScroller = {
			element: $element.find(">ax-table-content>[role=vertical-scroller]"),
			width: function () {
				return this.element.length === 0 ? 0 : this.element.width();
			},
			height: elementHeight,
			horizontalScrollbarHeight: function () {
				return $layout.attrs.hasHorizontalVirtualScroll ? $layout.verticalScroller.width() : $layout.scroller.element.length ? ($layout.scroller.element[0].offsetHeight - $layout.scroller.element[0].clientHeight) : 0;
			},
			set: {
				top: function () {
					var toolbarHeight = $layout.toolbar.height();
					var headerHeight = $layout.header.height();
					//console.log("head", $layout.header.thead().html(), window.getComputedStyle($layout.header.thead()[0]).height);
					$layout.verticalScroller.element.css('top', (toolbarHeight + headerHeight) + 'px');
				},
				bottom: function () {
					var horizontalScrollbarHeight = $layout.verticalScroller.horizontalScrollbarHeight();
					$layout.verticalScroller.element.css('bottom', (horizontalScrollbarHeight + $layout.paginator.height()) + 'px');
					$layout.leftPanel.scrollbar.height(horizontalScrollbarHeight);
					$layout.rightPanel.scrollbar.height(horizontalScrollbarHeight);
				}
			}
		};
		return this;
	}
}
