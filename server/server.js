Meteor.startup(function() {

  Meteor.setInterval(function() {

    var accounts = addresses.find({}).fetch()[0]

    if (!accounts) {
      var valuesToInsert = [
        {
          'address': 'LQBSSGJHAEAWCOSOLUIVVEOZRWNOXIRESSEEQQDSIJWUDVLNIKCHHUTVPYCHCSWPIJKILRDRPRSAVRVKS',
          'value': 0
        }, {
          'address': 'SFLYEYPJKFKBRLHDVDTQJOTXDDVOGISLPWXPIBZKOM9EFGYKJGKQUYGXEKVKEFMDQNYGBNUVWSR9ZVRBV',
          'value': 0
        }, {
          'address': 'KIYFEAVBPGZMYNZCGBUSBKMCOHUPNKFYUZS9VDPZBHEIGCKOVEFXPOHQBTJAPYBPVQVTJJRFIDUUUDQQY',
          'value': 0
        }, {
          'address': 'IEOO9BOG9DNUYL9ZSTSNMIURBRXWTMNKYKNYEMB9AYYCB9XJOYNPSRPZMSACRROQCZZGFJQCOFARH9LVA',
          'value': 0
        }, {
          'address': 'IEF9MHJRBEUTCB9AHGDJZMXTIYINT9FQUWDLNLTHDBEZF9AGRJVURTRWWSPUZJGGSK9MVRPQNLNHOWFFK',
          'value': 0
        }, {
          'address': 'BOGTSYSZKVPEJNU9XUSHBNBCNIJDCIDZEZUPMCGOAOGURJLTFFWF9BCAPUCPFRGKHCSYB9TNAGXBYMCRB',
          'value': 0
        }, {
          'address': 'AAYPHSRFHZTKUXXXRWWKYPBZURKOER9CZGSWVXVULUZEFDUJM9AVAWHOEFFYIXJBUNZDWZZYQBIXLSTDY',
          'value': 0
        }
      ]
      addresses.insert({'addressList': valuesToInsert});
    }

    var accountList = []
    for (var i = 0; i < accounts.addressList.length; i++) {
      accountList.push(accounts.addressList[i].address);
    }

    var findTxCommand = {
      'command': 'findTransactions',
      'addresses': accountList
    }

    HTTP.call('POST', 'http://localhost:999', {'data': findTxCommand}, function(error, result) {
      if (!error) {
        var transactions = result.data.transactions;

        var getTxCommand = {
          'command': 'getTransactions',
          'hashes': transactions
        }

        HTTP.call('POST', 'http://localhost:999', {'data': getTxCommand}, function(e, result2) {

          if (!e) {

            trytes = result2.data.trytes;
            var analyzeTxCommand = {
              'command': 'analyzeTransactions',
              'trytes': trytes
            }

            HTTP.call('POST', 'http://localhost:999', {'data': analyzeTxCommand}, function(err, data) {

              if (!err) {
                var preparedTransfers = {}
                for (var i = 0; i < data.data.transactions.length; i++) {
                  preparedTransfers[data.data.transactions[i].address] = preparedTransfers[data.data.transactions[i].address] ? preparedTransfers[data.data.transactions[i].address] += parseInt(data.data.transactions[i].value) : preparedTransfers[data.data.transactions[i].address] = parseInt(data.data.transactions[i].value)
                }

                for (var i = 0; i < accounts.addressList.length; i++) {
                  var currAccount = accounts.addressList[i];

                  if (preparedTransfers[currAccount.address] > currAccount.value) {
                    console.log("Bigger!")
                    addresses.update({_id: accounts._id, 'addressList.address': currAccount.address}, {
                      $set: {
                        'addressList.$.value': preparedTransfers[currAccount.address]
                      }
                    })
                  }
                }
              }
            })
          }
        })

      } else {
        console.log(error)
      }
    });
  }, 300000)
})

Meteor.methods({
  getAccounts: function() {
    return addresses.find({}).fetch()[0]
  }
})
