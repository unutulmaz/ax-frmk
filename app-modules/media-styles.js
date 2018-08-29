let mediaStyles = function (maxWidth) {
	angular.element(window.document).find("head >style[ax-media-style]").remove();

	let style = `@media screen and (max-width: {{maxWidth}}px) {
		ax-popup {
			min-width: 100% !important;
			// height:100% !important;
		}
		.scroller-popup-menu {
  			width: 100%; 
  		}
	}`;
	style = style.replaceAll("{{maxWidth}}", maxWidth);
	// console.log("style", style);
	createElement("style", {axMediaStyle: ""}, style, angular.element(window.document).find("head")[0]);
	return style;
};