Number.prototype.toLocaleString || (Number.prototype.toLocaleString = function (locale, options) {
	return this.toString();
}); // jshint ignore:line

Number.prototype.padLeft = function (length, character) {
	return this.toString().padLeft(length, character);
};
Number.prototype.round = function (precision) {
	var value = this;
	if (typeof precision === "undefined" || +precision === 0)
		return Math.round(value);

	value = +value;
	precision = +precision;

	if (isNaN(value) || !(typeof precision === "number" && precision % 1 === 0))
		return NaN;

	// Shift
	value = value.toString().split('e');
	value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + precision) : precision)));

	// Shift back
	value = value.toString().split('e');
	value = +(value[0] + 'e' + (value[1] ? (+value[1] - precision) : -precision));
	return value;
};
