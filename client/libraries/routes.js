FlowRouter.route('/', {
  subscriptions: function(params) {
    this.register('addressList', Meteor.subscribe('addressList'));
  },
  action: function () {
    BlazeLayout.render('main');
  }
})
