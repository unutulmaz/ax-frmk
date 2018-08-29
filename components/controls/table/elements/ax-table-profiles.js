class axTableProfiles {
	/**
	 *
	 * @param {axTableController} controller
	 */
	constructor($controller) {
		this.template = $controller.$template;
		this.controller = $controller;
		$controller.profiles.$controller = $controller;
		var $profiles = this;
		this.controller.$dropdowns.profiles = {
			save: {
				title: this.template.getMessage('toolbar', 'profileSave'),
				applyText: this.template.getMessage("toolbar", "btnSave"),
				applyingText: this.template.getMessage("toolbar", "btnSaving"),
				form: {
					data: {},
					validateForm: function () {
						this.$ctrl.clearAllErrors();
						if (!this.data.name) return this.$ctrl.addFieldError("name", "Profile name is required!");
						if ($controller.profiles.items.findObject(this.data.name, "name")) return this.$ctrl.addFieldError("name", "Profile name already exist!");
						if (!this.data.columns && !this.data.grouping && !this.data.order) return this.$ctrl.addGlobalError("Nothing to save. Please check what you want to save from current profile!");
						return true;
					}
				},
				confirm: function () {
					let removeSpinner = arguments[0];
					let valid = this.form.validateForm();

					removeSpinner();
					if (valid) {
						$controller.profiles.add(this.form.data);
						this.close();
					}
				},
				onOpen: function () {
					this.form.data.name = "Profile 1";
					this.form.data.description = "";
					this.form.data.type = 'Shared';
					this.form.data.columns = false;
					this.form.data.filters = false;
					this.form.data.grouping = false;
					this.form.data.order = false;
					this.openFinish = true;
				}
			},
			load: {
				title: this.template.getMessage('toolbar', 'profileLoad'),
				title2: this.template.getMessage('toolbar', 'profileDelete'),
				applyText: this.template.getMessage("toolbar", "btnLoad"),
				applyingText: this.template.getMessage("toolbar", "btnLoading"),
				confirm: function () {
					let removeSpinner = arguments[0];
					if ($controller.profiles.load(this, removeSpinner)) this.close();
				},
				hasSelected: function () {
					return this.columns.selected || this.grouping.selected || this.order.selected;
				},
				onOpen: function () {
					let selected = this.columns ? this.columns.selected : null;
					let dropdown = this;
					this.columns = {
						items: $controller.profiles.items.filter(function (profile) {
							return profile.columns;
						}),
						onChange: function () {
							if (!this.selected) return;
							if (this.selected.grouping && !dropdown.grouping.selected) dropdown.grouping.selected = this.selected;
							if (this.selected.order && !dropdown.order.selected) dropdown.order.selected = this.selected;
						},
						selected: selected
					};
					selected = this.grouping ? this.grouping.selected : null;
					this.grouping = {
						items: $controller.profiles.items.filter(function (profile) {
							return profile.grouping;
						}),
						selected: selected
					};
					selected = this.order ? this.order.selected : null;
					this.order = {
						items: $controller.profiles.items.filter(function (profile) {
							return profile.order;
						}),
						selected: null
					};
					this.profiles = {
						items: $controller.profiles.items.filter(function (item) {
							return item.type === "Private";
						})
					};
					this.openFinish = true;
				}
			}
		};

	}//end constructor
	static getProfiles($template) {
		let $controller = $template.controller;
		var source = $($template.element.source);
		let profilesDef = source.find(">ax-profiles");
		let profiles = {
			exist: profilesDef.length1 > 0,
			apiController: profilesDef.length > 0 ? profilesDef.getAttribute("api-controller") : false,
			canSave: profilesDef.length > 0 && profilesDef.getAttribute("api-controller"),
			dev: profilesDef.find("ax-profile"),
			selected: {},
			items: [],
			pivots: [],
			load: function (dropdown, removeSpinner) {
				var element = this.$controller.element.initial;
				if (dropdown.order.selected) {
					let profile = angular.element(createElement("ax-profile", {}, dropdown.order.selected.content));
					let profileAttrs = profile.find("ax-table-attributes");
					this.$controller.setAttribute("order-by", profileAttrs.getAttribute("order-by") || "");
				}
				if (dropdown.grouping.selected) {
					let html = "";
					angular.element(dropdown.grouping.selected.content).each(function (i, item) {
						if (item.tagName !== "AX-GROUPS") return true;
						html += item.outerHTML;
						return false;
					});
					element.find('>ax-groups').remove();
					element[0].innerHTML += html;
				}
				if (dropdown.columns.selected) {
					element.find('>ax-column').remove();
					let profile = angular.element(createElement("ax-profile", {}, dropdown.columns.selected.content));
					let profileAttrs = profile.find(">ax-table-attributes");
					element.find('>ax-column').each(function (i, column) {
					});
					profile.find(">ax-column").each(function (i, column) {
						if (column.getAttribute("header") === "Empty column") return;
						element[0].innerHTML += column.outerHTML;
					});
					if (profileAttrs.length > 0) {
						let attributes = profileAttrs[0].attributes;
						for (let i = 0; i < attributes.length; i++) {
							let attr = attributes[i];
							this.$controller.setAttribute(attr.nodeName, attr.nodeValue);
						}
					}
					let toolbar = profile.find('>ax-toolbar');
					if (toolbar.length > 0) {
						element.find('>ax-toolbar').remove();
						element[0].innerHTML += toolbar[0].outerHTML;
					}
				}
				this.$controller.changePagination = true;
				this.$controller.dataReload = true;
				this.$controller.render();
			},
			htmlToJson: function (element) {
				return {
					name: element.getAttribute('name'),
					type: element.getAttribute('type'),
					userDefined: false,
					description: $(element).find('ax-description').html(),
					columns: $(element).find('>ax-columns-layout').length > 0,
					order: $(element).find('>ax-columns-layout>ax-table-attributes').length > 0 ? $(element).find('>ax-columns-layout>ax-table-attributes').hasAttribute("order-by") : false,
					pivot: $(element).find('>ax-grid-pivot-table').length > 0,
					grouping: $(element).find('>ax-groups').length > 0,
					filters: element.getAttribute('filters') === "true",
					element: $(element),
					content: element.innerHTML,
					getGrouping: function () {
						let axGroups = $(element).find('>ax-groups');
						// axUtils.testForScope($template,[]);
						let template = new axTableTemplate(angular.copy($template.element.initial), angular.copy($template.element.$attrs), $template.element.linked, $template.$dataStore, $controller.config ||{});
						template.element.source.find(">ax-groups").remove();
						template.element.source[0].innerHTML += axGroups[0].outerHTML;
						template.createLastColumn();
						$template.grouping.getGroupsDefs(template);
						return template.controller.groups;
					},
					getColumnsLayout: function () {
						if ($(element).find('>ax-columns-layout').length === 0) return null;
						let hiddenColumns = $(element).find('>ax-columns-layout').getAttribute("hiddenColumns");
						let leftFreezedColumns = $(element).find('>ax-columns-layout').getAttribute("leftFreezedColumns") || 0;
						let rightFreezedColumns = $(element).find('>ax-columns-layout').getAttribute("rightFreezedColumns") || 0;
						return {
							hiddenColumns: hiddenColumns,
							leftFreezedColumns: parseInt(leftFreezedColumns),
							rightFreezedColumns: parseInt(rightFreezedColumns),
							attributes: $(element).find('>ax-columns-layout>ax-table-attributes'),
							toolbar: $(element).find('>ax-columns-layout>ax-toolbar'),
						};
					}
				};
			},
			pivotHtmlToJson: function (element) {
				return {
					name: element.getAttribute('name'),
					userDefined: false,
					description: $(element).find('ax-description').html(),
					element: $(element),
					content: element.innerHTML,
					getDef: function () {
						let def = {rows: [], values: [], columns: []};
						let rows = this.element.find(">ax-grid-pivot-table-row");
						rows.each(function (i, column) {
							let item = {column: column.getAttribute("column"), orderDirection: column.getAttribute("order-direction")};
							if (column.hasAttribute("width")) item.width = column.getAttribute("width");
							if (column.hasAttribute("show")) item.show = column.getAttribute("show") === "true";
							else if (i === rows.length - 1) item.show = true;
							else item.show = false;
							def.rows.push(item);
						});
						this.element.find(">ax-grid-pivot-table-value").each(function (i, column) {
							let item = {column: column.getAttribute("column"), type: column.getAttribute("type")};
							if (column.hasAttribute("width")) item.width = column.getAttribute("width");
							def.values.push(item);
						});
						this.element.find(">ax-grid-pivot-table-column").each(function (i, column) {
							let item = {column: column.getAttribute("column"), orderDirection: column.getAttribute("order-direction")};
							if (column.hasAttribute("width")) item.width = column.getAttribute("width");
							if (column.hasAttribute("show")) item.show = column.getAttribute("show") === "true";
							else if (i === 0) item.show = true;
							else item.show = false;

							def.columns.push(item);
						});
						return def;
					}
				};
			},
			add: function (profile) {
				profile.userDefined = true;
				profile.content = "";
				let element = this.$controller.element.initial;
				if (profile.order) profile.orderBy = $controller.attrs.orderBy;
				if (profile.columns) {
					profile.leftFreezedColumns = $controller.attrs.leftFreezedColumns;
					profile.rightFreezedColumns = $controller.attrs.rightFreezedColumns;
					element.find('>ax-column').each(function (i, column) {
						if (column.getAttribute("header") === "Empty column") return;
						profile.content += column.outerHTML;
					});
				}
				if (profile.grouping) {
					let axGroups = element.find('>ax-groups');
					profile.content += axGroups[0].outerHTML;
				}
				this.items.push(profile);
			}
		};
		profilesDef.find(">ax-profile").each(function (i, profile) {
			let item = profiles.htmlToJson(profile);
			profiles.items.push(item);
		});
		profilesDef.find(">ax-grid-pivot-table").each(function (i, def) {
			let item = profiles.pivotHtmlToJson(def);
			profiles.pivots.push(item);
		});

		profilesDef.remove();
		$controller.profiles = profiles;
	}

	static createApi($axApi, $controller) {
		if (!$controller.profiles.canSave) return;
		let api = new $axApi({controller: $controller.profiles.apiController, actions: {}});
		api.get = function (params, removeSpinner) {
			return api.$http.post(
				api.getCustomActionUrl('getProfiles'),
				params).then(function (response) {
				var responseThen = {
					headers: response.headers,
					data: response.data,
				};
				return response;
			}).catch(function (response) {
				api.serviceFailed(response);
				if (removeSpinner) removeSpinner();
			});
		};
		api.add = function (params, removeSpinner) {
			return api.$http.post(
				api.getCustomActionUrl('addProfile'),
				params).then(function (response) {
				return response;
			}).catch(function (response) {
				api.serviceFailed(response);
				if (removeSpinner) removeSpinner();
			});
		};
		api.delete = function (params, removeSpinner) {
			return api.$http.delete(
				api.getCustomActionUrl('deleteProfile'),
				params).then(function (response) {
				return response;
			}).catch(function (response) {
				api.serviceFailed(response);
				if (removeSpinner) removeSpinner();
			});
		};
		$controller.profiles.$api = api;
	}
}