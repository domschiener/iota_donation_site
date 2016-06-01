Meteor.publish('addressList', function() {
  return addresses.find({});
});
