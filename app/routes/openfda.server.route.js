'use strict';

var	openFDAController = require('../../app/controllers/openFDA.server.controller');

module.exports = function(app) {
	app.route('/fetch/:appId/:datasetId/:qId').get(openFDAController.queryOpenFDA);
	app.route('/fetch/:appId/:datasetId/:qId/clearCache').get(openFDAController.queryOpenFDA);
};
