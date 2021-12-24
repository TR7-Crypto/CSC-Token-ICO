App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	tokensSold: 0,
	tokensAvailable: 750000,

	init: function() {
		console.log("App initialized...")
		return App.initWeb3();
	},

	initWeb3: async function (argument) {
		// Modern dapp browsers...
		if (window.ethereum) {
	      App.web3Provider = window.ethereum;
	      try {
	        // Request account access
	        await window.ethereum.enable();
	      } catch (error) {
	        // User denied account access...
	        console.error("User denied account access")
	      }
	    }
		// Legacy dapp browsers...
	    else if (window.web3) {
			// If a web3 instance is already provided by Meta Mask
			App.web3Provider = window.web3.currentProvider;
			// web3 = new Web3(web3.currentProvider);
			// window.ethereum.enable();
		} else {
			// Specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
			
		}
		web3 = new Web3(App.web3Provider);

		return App.initContracts();
	},

	initContracts: function() {
		$.getJSON("DappTokenSale.json", function(dappTokenSale) {
			App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
			App.contracts.DappTokenSale.setProvider(App.web3Provider);
			App.contracts.DappTokenSale.deployed().then(function(dappTokenSale) {
				console.log("Dapp Token Sale Contract Address: ", dappTokenSale.address);
			});
		}).done(function() {
			$.getJSON("DappToken.json", function(dappToken) {
				App.contracts.DappToken = TruffleContract(dappToken);
				App.contracts.DappToken.setProvider(App.web3Provider);
				App.contracts.DappToken.deployed().then(function(dappToken) {
					console.log("Dapp Token Contract Address: ", dappToken.address);
				});
				App.listenForEvents();
				return App.render();
			});
		})
	},

	// Listen for events emitted from the contract
  listenForEvents: function() {
  	App.contracts.DappTokenSale.deployed().then(function(instance) {
	  	instance.Sell({
		    filter: {}, // Using an array means OR: e.g. 20 or 23
		    fromBlock: 0
		}, function(error, event){ console.log(event); App.render();})
		.on("connected", function(subscriptionId){
		    console.log(subscriptionId);
		})
		.on('data', function(event){
		    console.log(event); // same results as the optional callback above

		})
		.on('changed', function(event){
		    // remove event from local database
		})
		.on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
		    
		});
	});
  },

	render: function() {
		if(App.loading) {
			return;
		}
		App.loading = true;
		var loader = $('#loader');
		var content = $('#content');

		loader.show();
		content.hide();
		// Load account data
		web3.eth.getCoinbase(function(err, account) {
			if(err === null) {
				console.log('account', account);
				App.account = account;
				$('#accountAddress').html("Your Account: " + account);
			}
		});

		App.contracts.DappTokenSale.deployed().then(function(instance) {
			dappTokenSaleInstance = instance;
			return dappTokenSaleInstance.tokenPrice();
		}).then(function(tokenPrice) {
			App.tokenPrice = tokenPrice;
			$('.token-price').html(web3.fromWei(App.tokenPrice, 'ether'));
			return dappTokenSaleInstance.tokensSold();
		}).then(function (tokensSold) {
			App.tokensSold = tokensSold.toNumber();
			$('.tokens-sold').html(App.tokensSold);
			$('.tokens-available').html(App.tokensAvailable);

			var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
			$('#progress').css('width', progressPercent + '%');

			// Load token contract
			App.contracts.DappToken.deployed().then(function(instance) {
				return instance.balanceOf(App.account);
			}).then(function(balance) {
				$('.dapp-balance').html(balance.toNumber());

				App.loading = false;
				loader.hide();
				content.show();
			});
		});
	},


	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();
		var numberOfTokens = $('#numberOfTokens').val();
		App.contracts.DappTokenSale.deployed().then(function(instance) {
			var _value = numberOfTokens * App.tokenPrice;
			console.log(numberOfTokens);
			console.log(App.tokenPrice);
			return instance.buyTokens(numberOfTokens, {
				from: App.account,
				value: _value,
				gas: 500000
			});
		}).then(function(result) {
			console.log("Tokens bought...");
			$('form').trigger('reset') // reset number of tokens in form
      		// Wait for Sell event
		});
	},



}

$(function() {
	$(window).load(function() {
		App.init();
	})
})