angular.module("App").factory('axDataAdapter',
	[function () {
		return function (config) {
			var api = new axDataAdapter(config);
			return api;
		};
	}]);

class axDataAdapter {
	constructor(config, dateParser) {
		this.config = config || {conversions: null};
		if (angular.isDefined(this.config.parsingCollection)) this.parsingCollection = this.config.parsingCollection;
		this.dateParser = dateParser;
		if (this.config.conversions) {
			for (let column  in this.config.conversions) {
				let conversion = this.config.conversions[column];
				conversion.fn = convertDataTypes[conversion.type];
			}
		}
		this.invariant = axCreateInvariant.remove;
	}

	parseCollection(collection) {
		collection.each(this.parseItem, this);
		return collection;
	}

	parseItem(item) {
		if (this.config.conversions) {
			for (let column  in this.config.conversions) {
				if (item[column] === undefined) continue;
				let conversion = this.config.conversions[column];
				if (conversion.type === "date" || conversion.type === "datetime") item[column] = conversion.fn(item[column]);
				else item[column] = conversion.fn(item[column]);
			}
		}
		if (this.config.invariant) {
			for (let i = 0; i < this.config.invariant.length; i++) {
				let column = this.config.invariant[i];
				if (item[column] === undefined) continue;
				if (!angular.isString(item[column])) continue;
				item[column + "Invariant"] = this.invariant(item[column]);
			}
		}
		if (angular.isFunction(this.config.extend)) this.config.extend.call(item);
		// console.log("parsed", angular.copy(item));
		return item;
	}
}

class axAdapterConfig {
	/**
	 *
	 * @param invariant [] array of fieldName
	 * @param conversions object
	 * @param {function} extendedFn
	 */
	constructor(extendedFn) {
		this.invariant = [];
		/**
		 * @type {object} with members = {type:['integer','float', 'date', 'datetime','boolean']}
		 */
		this.conversions = {};
		if (extendedFn === undefined ) return;
		if (typeof extendedFn !== 'function') console.error('Adatpter extendedFn must be a function');
		else this.extended = extendedFn.bind(this);
	}

	addInvariantField(fieldName) {
		this.invariant.push(fieldName);
	}

	addIntegerConversion(fieldName) {
		this.conversions[fieldName] = new axAdapterIntegerConversion();
	}

	addFloatConversion(fieldName) {
		this.conversions[fieldName] = new axAdapterFloatConversion();
	}

	addBooleanConversion(fieldName) {
		this.conversions[fieldName] = new axAdapterBooleanConversion();
	}

	addDateConversion(fieldName, inputFormat) {
		this.conversions[fieldName] = new axAdapterDateConversion(inputFormat);
	}

	addDatetimeConversion(fieldName, inputFormat) {
		this.conversions[fieldName] = new axAdapterDatetimeConversion(inputFormat);
	}
	addExtend(extendFn){
		if (typeof extendFn !== 'function') console.error('Adatpter extendedFn must be a function');
		else this.extend = extendFn;

	}
}

class axAdapterIntegerConversion {
	get type() {
		return "integer";
	}
}

class axAdapterFloatConversion {
	get type() {
		return "float";
	}
}

class axAdapterBooleanConversion {
	get type() {
		return "boolean";
	}
}

class axAdapterDateConversion {
	/**
	 *
	 * @param inputFormat "YYYY-MM-DD",
	 */
	constructor(inputFormat) {
		this.inputFormat = inputFormat;
	}

	get type() {
		return "date";
	}

}

class axAdapterDatetimeConversion {
	/**
	 *
	 * @param inputFormat "YYYY-MM-DD HH:mm:ss"
	 */
	constructor(inputFormat) {
		this.inputFormat = inputFormat;
	}

	get type() {
		return "datetime";
	}
}
