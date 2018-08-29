angular.module("App").factory('axDataAdapter',
		["uibDateParser", function(dateParser) {
			return function(config) {
				var api = new axDataAdapter(config, dateParser);
				return api;
			};
		}]);

class axDataAdapter {
	constructor(config, dateParser) {
		this.config = config || {conversions: null};
		if (angular.isDefined(this.config.parsingCollection)) this.parsingCollection =this.config.parsingCollection;
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
				if (conversion.type=== "date" || conversion.type=== "datetime") item[column] = conversion.fn(item[column],this.dateParser);
				else item[column] = conversion.fn(item[column],this.dateParser);
			}
		}
		if (this.config.invariant) {
			for (let i=0;i<  this.config.invariant.length;i++) {
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
