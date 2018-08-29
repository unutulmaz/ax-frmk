String.prototype.camelCase = function () {
	var target = this;
	var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
	var MOZ_HACK_REGEXP = /^moz([A-Z])/;
	return target.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
		return offset ? letter.toUpperCase() : letter;
	}).replace(MOZ_HACK_REGEXP, 'Moz$1');
};
String.prototype.reverseCamelCase = function () {
	var input = this;
	return input
		// insert a space between lower & upper
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		// space before last upper in a sequence followed by lower
		.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1-$2$3')
		// uppercase the first character
		.toLowerCase();
};
String.prototype.urlAccepted = function () {
	var target = this.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-")// jshint ignore:line
		.replaceAll("/", "-").normalize('NFD').replace(/[\u0300-\u036f]/g, "");// jshint ignore:line
	return target;
};
String.prototype.replaceAll = function (search, replacement, removeLineBrakes) {
	var target = this;
	if (removeLineBrakes) target = target.replace(/(\r\n|\n\r|\n|\r|\t)/g, "");
	let newText = target.replace(new RegExp(search, "g"), replacement);
	// console.log( newText);
	return newText;
};
String.prototype.contain = function (search, invariant) {
	var target = this;
	if (target.toLowerCase().indexOf(search.trim().toLowerCase()) > -1) return true;
	if (invariant && invariant.toLowerCase().indexOf(search.trim().toLowerCase()) > -1) return true;
	return false;
};
String.prototype.startsWith || (String.prototype.startsWith = function (search) {
	return (this.substring(0, search.length) === search);
}); // jshint ignore:line
String.prototype.toProperCase || (String.prototype.toProperCase = function () {
	return (this.substring(0, 1).toUpperCase() + this.substring(1).toLowerCase());
}); // jshint ignore:line
String.prototype.cleaning = function (separator) {
	let self = this.trim().replaceAll("\"", "\'");
	return self;
};

String.prototype.toTitleCase = function (separator) {
	let self = this.cleaning();
	separator = separator || " ";
	let words = self.split(separator);
	words.each(function (word, i) {
		let accents = word.split("'");
		let newAccents = [];
		accents.each(function (accent, j) {
			newAccents[j] = j = 0 ? accent : accent.toProperCase();
		});
		words[i] = newAccents.join("'");
	});
	return words.join(separator);
}; // jshint ignore:line
String.prototype.repeat || (String.prototype.repeat = function (length) {
	var returnString = "";
	for (var i = 0; i < length; i++) {
		returnString += this;
	}
	return returnString;
}); // jshint ignore:line
String.prototype.padLeft = function (length, character) {
	if (character === undefined || character === null) character = " ";
	if (character.length > 1) character = character.substring(0, 1);
	return (character.repeat(length - this.length) + this);
}; // jshint ignore:line

