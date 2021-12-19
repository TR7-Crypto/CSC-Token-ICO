const DappToken = artifacts.require("DappToken");
const DappTokenSale = artifacts.require("DappTokenSale");

module.exports = function (deployer) {
  var tokenPrice = 1000000000000000;
  deployer.deploy(DappToken, 1000000).then(function() {
    return deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
  });
};
