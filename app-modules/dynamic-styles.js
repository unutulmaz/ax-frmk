let dynamicStyles = function (theme) {
	angular.element(window.document).find("head >style[ax-dynamic-style]").remove();
	let style = "table.ax-table > thead > tr, table.ax-table > thead > tr > th {height: "+theme.dimensions.rowDataHeight+"px}";

	for (let i = 2; i < 20; i++) {
		style += "\ntable.ax-table > thead > tr > th[rowspan='" + i + "'] {height: " + (i * theme.dimensions.rowDataHeight) + "px;}";
	}
	// console.log("dynamic style", style);
	createElement("style", {axDynamicStyle: ""}, style, angular.element(window.document).find("head")[0]);
	return style;
};