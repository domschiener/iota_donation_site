Meteor.subscribe('addressList');

Template.addresses.onRendered(function() {
  $(function () {
    $('[data-toggle="popover"]').popover()
  })
})

Template.addresses.helpers({
  allAddresses: function() {
    return addresses.find({}).fetch()[0]
  },
  getPerc: function(value) {
    var maxValue = 3812798742493;
    return Math.round((value * 100) / maxValue);
  }
})
