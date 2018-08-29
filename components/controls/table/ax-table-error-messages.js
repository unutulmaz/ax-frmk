/**
 * 
 * @param id
		1001: "You cannot have page-size === ALL for row groups!",
		1002: "You need to create dataitem-group-field attribute for ax-group with grouping field name, for group:",
		1003: "Draggable table with indexField, must be ordered by that field:",
		1004: "You can define just one element axColumnFilter in column!"
 * @returns
 */
var getDataTableErrMsg = function (id) {
	var texts = {
		1001: "You cannot have page-size === ALL for row groups!",
		1002: "You need to create dataitem-group-field attribute for ax-group with grouping field name, for group:",
		1003: "Draggable table with indexField, must be ordered by that field:",
		1004: "Nu puteti defini decat un singur element axColumnFilter in coloana!"
	};
	return texts[id];
};

