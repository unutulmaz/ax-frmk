class axFormCustomCtrl {
	/**
	 *
	 * @param $axDataAdapter {axDataAdapter}
	 */
	constructor($axDataAdapter) {
		/**
		 *
		 * @type {axFormController}
		 */
		this. $ctrl = null;
		this.$axDataAdapter = $axDataAdapter;
		/**
		 *
		 * @type {axDataAdapter}
		 */
		this.dataAdapter = null;
		this.idField = null;
	}

	/**
	 *
	 * @param axAdapterConfig {axAdapterConfig}
	 */
	addAdapter(axAdapterConfig) {
		this.dataAdapter = new this.$axDataAdapter(axAdapterConfig);
	}

	editApiArgs() {
		let api = {};
		return api;
	}

	validate(datasource) {
		return true;
	}

	validateField(fieldName, datasource) {
		return true;
	}

	saveApiArgs(datasource) {
		let api = {};
		return api;
	}


	save(datasource, apiArgs, saveThen) {
		let response = {};
		return saveThen(response);
	}

	afterSuccessSave() {

	}

	undoCallback() {
	}
}

axFormCustomCtrl.$inject = ["$axDataAdapter"];

