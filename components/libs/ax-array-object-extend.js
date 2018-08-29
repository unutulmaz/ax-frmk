
Array.prototype.findObject = function findObject(value, columnToSearch) {
	let data = this;
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		if (typeof (item[columnToSearch]) === 'undefined' && value !== undefined) continue;
		if (item[columnToSearch] == value) return item;
	}
	return false;
};
Array.prototype.removeObject = function removeObject(value, columnToSearch) {
	let data = this;
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		if (typeof (item[columnToSearch]) === 'undefined' && value !== undefined) continue;
		if (item[columnToSearch] == value) {
			data.splice(i, 1);
			this.removeObject(value, columnToSearch);
			return true;
		}
	}
	return false;
};
Array.prototype.countObject = function countObject(value, columnToSearch) {
	let data = this;
	let cnt = 0;
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		if (typeof (item[columnToSearch]) === 'undefined' && value !== undefined) continue;
		if (item[columnToSearch] == value) cnt++;
	}
	return cnt;
};

Array.prototype.findObjectIndex = function findObjectIndex(value, columnToSearch) {
	let data = this;
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		if (typeof (item[columnToSearch]) === 'undefined' && value !== undefined) continue;
		if (item[columnToSearch] == value) return i;
	}
	return -1;
};
Array.prototype.findObjectLastIndex = function findObjectLastIndex(value, columnToSearch) {
	let data = this;
	for (var i = data.length - 1; i >= 0; i--) {
		var item = data[i];
		if (typeof (item[columnToSearch]) === 'undefined' && value !== undefined) continue;
		if (item[columnToSearch] == value) return i;
	}
	return -1;
};
Array.prototype.axPush = function (item) {
	let self = this;
	self[self.length] = item;
};
Array.prototype.indexOf = function (item) {
	let arr = this;
	for (var i = 0, len = arr.length; i != len; i++) {
		if (arr[i] === item) return i;
	}
	return -1;
};
Array.prototype.spliceOne = function (index) {
	let arr = this;
	var len = arr.length;
	if (!len) return;
	while (index < len) {
		arr[index] = arr[index + 1];
		index++;
	}
	arr.length--;
};
Array.prototype.limit = function limitArray(length) {
	if (length > this.length) return this;
	let data = this;
	let i = 0;
	let trunk = [];
	while (i < length) {
		trunk.push(data[i]);
		i++;
	}
	return trunk;
};

Array.prototype.each = function each(iterator, context, startIndex, endIndex) {
	let data = this;
	let len = endIndex ? endIndex : this.length;
	let i = startIndex ? startIndex : 0;
	while (i < len) {
		if (iterator.call(context || startIndex, data[i], i) === false) break;
		i++;
	}
};
//Array.prototype.appendItems = function appendItems(arrayEl) {
//	let data = this;
//	(arrayEl || []).each(function (item) { data.push(item); });
//};

HTMLCollection.prototype.each = Array.prototype.each;
Array.prototype.eachLastToFirst = function (iterator, context) {
	let data = this;
	if (typeof iterator !== "function") return;
	let len = this.length;
	let i = len - 1;
	while (i >= 0) {
		if (iterator.call(context, data[i], i) === false) break;
		i--;
	}
};
