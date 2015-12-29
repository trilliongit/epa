'use strict';

var queryService = require("./queryOfda.server.service");
var config = require("./../../config/config");
var states = config.states;
var logger = require('./../utils/logger.js')(module);
var parseString = require('xml2js').parseString;
var response = {};
var completeQueries = 0;
var clear;


module.exports.mapus = function(params, callback){
	
	response.mapData = {};
	response.orderedData = {};
	response.mapDataTitle = {};
	response.mapDataFills = {};
	response.mapDataLegends = {};
 

    var datasets = [{name:"lead",title:"Lead contamination", defaultFill:"#ECECEA", selectedFill:'#f5d76e', thresholds:[{val:0, color:"#D5E7E6", key:"L"}, {val:25, color:"#74AFAD", key:"M"}, {val:50, color:"#558C89", key:"H"}, {val:75, color:"#2a4644", key:"VH"}]}];


    datasets.forEach(function(dataset){
    	
        var allTermQuery;
        

        var keys = Object.keys(states);
	    	for(var j = 0; j < keys.length; j++){
		        
			/*clear = setInterval(function(){some(keys, allTermQuery, dataset)},10000);*/
			clear = setInterval(function(){
				allTermQuery = {
				    queryId: 1,
				    noun:'Result',
				    endpoint:'search?mimeType=xml',
				    params:{
				      characteristicName:'Lead',
				      startDateLo: params.startDate,
				      statecode: keys[j]
				    }
				}
				some(keys, allTermQuery, dataset);
			},1000);
			
					
	}
});

	 function findKeyFill(dataset, count){
	    	var max = {};
	    	for(var i = 0; i < dataset.thresholds.length; i++){
	    		var th = dataset.thresholds[i];
	    		if(count < th.val)
	    			return th;
	    		else
	    			max = th;
	    	}

	    	return max;
	    }

	    function getFills(dataset){
	    	var fills = {};
	    	dataset.thresholds.forEach(function(th){
	    		fills[th.key] = th.color;
	    	});
	    	fills['defaultFill'] = dataset.defaultFill;
	    	fills['selectedFill'] = dataset.selectedFill;
	    	return fills;
	    }

	    function getLegends(dataset){
	    	var labels = {};
	    	var i =0;
	    	dataset.thresholds.forEach(function(th){

	    		if(++i == dataset.thresholds.length)
	    			labels[th.key] =  th.val + " >= ";
	    		else
	    			labels[th.key] = " < " + th.val;

	    	});
	    	labels['defaultFill'] = 'unknown';
	    	return labels;
	    }

	    function compareCount(a,b) {
	  	  if (a.count > b.count){
	      	return -1;
	    	}
	  	  if (a.count < b.count){
	      	return 1;
	    	}
	  	  return 0;
	  }

	  function some(keys, allTermQuery, dataset){
	  	queryService.getData(allTermQuery,function(error,data, query){
				completeQueries++;

				if(error)
					logger.error("ERROR: ", JSON.stringify(error), JSON.stringify(allTermQuery));

				if(data){
					parseString(data, function (err, result) {
						if (err) throw err;
				    data = result['WQX']['Organization'][0]['Activity'];
					});
				}else
					data = {};

				var higherCount = 0;
				var lowerCount = 0;
				var notDetected = 0;
				var infectedPercentage;
				var th;
				var results = {};
        		var resultsArray = [];

				if(data.length > 0){
						for(var i = 0; i < data.length; i++){
						if(data[i]['Result'][0]['ResultDescription'][0]['ResultDetectionConditionText']){
							notDetected++;
						}else if(data[i]['Result'][0]['ResultDescription'][0]['ResultMeasure'][0]['ResultMeasureValue'][0] >= 15){
							higherCount++;
						}else if(data[i]['Result'][0]['ResultDescription'][0]['ResultMeasure'][0]['ResultMeasureValue'][0] < 15){
							lowerCount++;
						}
					}

					infectedPercentage = Math.round((higherCount) * 100 / data.length);
				}
				

				th = findKeyFill(dataset, infectedPercentage );
				results[states[allTermQuery.params.statecode]] = { fillKey: th.key, totalSamples: data.length, infectedSamples: higherCount, infectedPercentage: infectedPercentage, label: th.val};
				response.mapData[dataset.name] = results;
				response.mapDataTitle[dataset.name] = dataset.title;
				response.mapDataFills[dataset.name] = getFills(dataset);
				response.mapDataLegends[dataset.name] = getLegends(dataset);

				if (completeQueries == keys.length){
						callback(null, response);
						clearInterval(clear);
				}
			});
	  }
};
