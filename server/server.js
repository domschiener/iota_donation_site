Meteor.startup(function() {

  Meteor.setInterval(function() {

    var accounts = addresses.find({}).fetch()[0]

    if (!accounts) {
      var valuesToInsert = [
        {
          'address': 'IEOO9BOG9DNUYL9ZSTSNMIURBRXWTMNKYKNYEMB9AYYCB9XJOYNPSRPZMSACRROQCZZGFJQCOFARH9LVAFWJFLQPTY',
          'value': 0
        }, {
          'address': 'KIYFEAVBPGZMYNZCGBUSBKMCOHUPNKFYUZS9VDPZBHEIGCKOVEFXPOHQBTJAPYBPVQVTJJRFIDUUUDQQYQRKQFEAZZ',
          'value': 0
        }, {
          'address': 'SFLYEYPJKFKBRLHDVDTQJOTXDDVOGISLPWXPIBZKOM9EFGYKJGKQUYGXEKVKEFMDQNYGBNUVWSR9ZVRBVILFKUBMAQ',
          'value': 0
        }, {
          'address': 'IEF9MHJRBEUTCB9AHGDJZMXTIYINT9FQUWDLNLTHDBEZF9AGRJVURTRWWSPUZJGGSK9MVRPQNLNHOWFFKGVXHIHVQZ',
          'value': 0
        }, {
          'address': 'BOGTSYSZKVPEJNU9XUSHBNBCNIJDCIDZEZUPMCGOAOGURJLTFFWF9BCAPUCPFRGKHCSYB9TNAGXBYMCRBZMERBXWHM',
          'value': 0
        }, {
          'address': 'LQBSSGJHAEAWCOSOLUIVVEOZRWNOXIRESSEEQQDSIJWUDVLNIKCHHUTVPYCHCSWPIJKILRDRPRSAVRVKSLLFGHXCQG',
          'value': 0
        }, {
          'address': 'AAYPHSRFHZTKUXXXRWWKYPBZURKOER9CZGSWVXVULUZEFDUJM9AVAWHOEFFYIXJBUNZDWZZYQBIXLSTDYW9ANOIQRN',
          'value': 0
        }, {
          'address': 'ERNPNZBJMIVBDVHVZEWSAKJFDHQEWWLUMAKLZCR9BHJN9CRAOZQKIZIZMARQSKYQZ9HEQGKLIMHHGOM9LGAWPBRJCV',
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

    HTTP.call('POST', 'http://localhost:14265', {'data': findTxCommand}, function(error, result) {
      if (!error) {
        var transactions = result.data.hashes;
        if (!transactions) {
          return
        }

        var getTxCommand = {
          'command': 'getTrytes',
          'hashes': transactions
        }

        HTTP.call('POST', 'http://localhost:14265', {'data': getTxCommand}, function(error, result) {
          if (!error) {

            trytes = result.data.trytes;
            var analyzeTxCommand = {
              'command': 'analyzeTransactions',
              'trytes': trytes
            }

            HTTP.call('POST', 'http://localhost:14265', {'data': analyzeTxCommand}, function(err, data) {

              if (!err) {

                var preparedTransfers = {}

                for (var i = 0; i < data.data.transactions.length; i++) {
                  preparedTransfers[data.data.transactions[i].address] = preparedTransfers[data.data.transactions[i].address] ? preparedTransfers[data.data.transactions[i].address] += parseInt(data.data.transactions[i].value) : preparedTransfers[data.data.transactions[i].address] = parseInt(data.data.transactions[i].value)
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
