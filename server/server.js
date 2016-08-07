import async from 'async';


Meteor.startup(function() {

  function makeNodeRequest(command, cb) {

    var options = {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(command).length
      },
      data: command
    };

    return HTTP.call('POST', 'http://localhost:14265', options, cb);
  }

  Meteor.setInterval(function() {

    var accounts = addresses.find({}).fetch()[0]

    if (!accounts) {
      var valuesToInsert = [
        {
          'address': 'V9ILNKSJBEH9QU9LVDASMCCRROQBHTNUNDMXPCWGDGCUEDDVWKSESJBWJ9QRKQBXONJNXD9WHWLISXMDMBBW9W9ANC',
          'value': 0
        }, {
          'address': 'GIWJKSZRINLWXVLUULREMXPAEFRIUH9KOKNTOGNTRACJG9PJ9MBLNBXDZEEHKZAHOZYYOZDKAASP9CPZJTVSVUFPJB',
          'value': 0
        }, {
          'address': 'WI9EWRIOJP9TJLQRGMLUAZUQJFFUJWTMTIZDQQMFCNGXPTYNJRXTUTVVJLOAQOQHNRNGCLLKP9VRFTZMIXBEOJH9IL',
          'value': 0
        }, {
          'address': 'YLIQJNNFPWIXMNWHHOGPOWIHEHAHZZDGFFDLDQBCMHYDLYCJOCPHEMVPNP9NPJOAQWARJBSFNCNIBQDGJDVCLOWVYP',
          'value': 0
        }, {
          'address': 'IIBY9YFHMXILVRPPZNTGI9TAPILTKODDHESEJUCNZLSARSLHEPSUIEGJEJPNJF9DOQAZJNKWVJUYCUKVJAXVQVXHFA',
          'value': 0
        }, {
          'address': 'ZZLLDOKFKXUXRHWZDHFUPLZ9ZWUNAPWBPIKBHXUVOZCSL9LXNXCHBDRIPWMVLJVIKSZWSJVYG9TMEXVWULYLWXOVOJ',
          'value': 0
        }, {
          'address': 'ZI9PCRVUXZJZMPZPQ9OBLBNZRPCQQXEALZBY9KFPIIVXVNYDKGBMJLTQIKLVQONPAQRUFWBTJUBNGCOATBPNKQBVPB',
          'value': 0
        }
      ]

      addresses.insert({'addressList': valuesToInsert});
    }

    var accountList = []
    for (var i = 0; i < accounts.addressList.length; i++) {
      accountList.push(accounts.addressList[i].address);
    }


    async.waterfall([
      // FIND TRANSACTIONS
      function(callback) {

        var findTxCommand = {
          'command': 'findTransactions',
          'addresses': accountList
        }

        makeNodeRequest(findTxCommand, function(error, result) {

          if (error) return console.error("Error")

          var transactions = result.data.hashes;
          if (!transactions) {
            return
          }

          callback(null, transactions);
        })
        // GET LATEST MILESTONE
      }, function(transactions, callback) {

        var getNodeInfo = {
          'command': 'getNodeInfo'
        }

        makeNodeRequest(getNodeInfo, function(error, success) {

          if (error) return console.error("Error")

          var milestoneIndex = success.data.milestoneIndex;

          callback(null, transactions, milestoneIndex);
        })
        // GET THE MOST RECENT MILESTONE
      }, function(transactions, milestoneIndex, callback) {

        var getMilestone = {
          'command': 'getMilestone',
          'index': parseInt(milestoneIndex) - 1
        }

        makeNodeRequest(getMilestone, function(error, success) {

          if (error) return console.error(error);

          var milestone = success.data.milestone;
          console.log(success.data)
          callback(null, transactions, milestone);
        })
        // CHECK WHICH OF THE TRANSACTIONS IS CONFIRMED OR NOT
      }, function(transactions, milestone, callback) {

        var getInclusionStates = {
          'command': 'getInclusionStates',
          'transactions': transactions,
          'tips': [milestone]
        }

        makeNodeRequest(getInclusionStates, function(error, success) {
          var confTxs = [];
          var states = success.data.states;

          for (var i = 0; i < transactions.length; i++) {
            if (states[i] === true) {
              confTxs.push(transactions[i]);
            }
          }
          callback(null, confTxs)
        })
      }, function(confTxs, callback) {

        var getTrytes = {
          'command': 'getTrytes',
          'hashes': confTxs
        }

        makeNodeRequest(getTrytes, function(error, success) {

          if (error) return console.log(error);

          var trytes = success.data.trytes;
          callback(null, trytes);
        })
      }, function(trytes, callback) {

        var analyzeTxCommand = {
          'command': 'analyzeTransactions',
          'trytes': trytes
        }

        makeNodeRequest(analyzeTxCommand, function(error, success) {

          var confirmedTxs = success.data.transactions;
          callback(null, confirmedTxs)
        })

      }
    ], function(error, result) {

      var preparedTransfers = {}

      for (var i = 0; i < result.length; i++) {
        preparedTransfers[result[i].address] = preparedTransfers[result[i].address] ? preparedTransfers[result[i].address] += parseInt(result[i].value) : preparedTransfers[result[i].address] = parseInt(result[i].value)
      }

      for (var i = 0; i < accounts.addressList.length; i++) {
        var currAccount = accounts.addressList[i];

        if (preparedTransfers[currAccount.address.slice(0, -9)] > currAccount.value) {
          console.log("Bigger!")
          addresses.update({_id: accounts._id, 'addressList.address': currAccount.address}, {
            $set: {
              'addressList.$.value': preparedTransfers[currAccount.address.slice(0, -9)]
            }
          })
        }
      }
    })
  }, 60000)
})

Meteor.methods({
  getAccounts: function() {
    return addresses.find({}).fetch()[0]
  }
})
