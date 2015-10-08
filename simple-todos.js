// Mongo collections we'll be working with
Tasks = new Mongo.Collection("tasks");
Settings = new Mongo.Collection("settings");

// Place to stash stuff for my app that I don't want to be global
Consensual = new Object(null);

// Function to extract the hostname from a URL
Consensual.extractDomain = function (url) {
    var domain;
    // We don't want the protocol
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    // We also don't want the port number
    domain = domain.split(':')[0];
    return domain;
}


if (Meteor.isClient) {
  // This code only runs on the client

  Meteor.startup(function() {
    Session.setDefault("domain", Consensual.extractDomain(document.referrer));
  });
  
  Template.body.helpers({
    settings: function () {
      return Settings.find({});
    },
    tasks: function () {
      var order_default = "ascending";
      var order_ascending = (Settings.find({}).fetch()[0] !== undefined) ? Settings.find({}).fetch()[0].order_ascending : order_default === "ascending" ? true : false;
      return Tasks.find({}, {sort: {createdAt: order_ascending ? 1 : -1}});
    },
    header: function () {
      return Session.get("domain");
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
      // Insert a task into the collection
      Tasks.insert({
        text: text,
        createdAt: new Date() // current time
      });
 
      // Clear form
      event.target.text.value = "";
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Tasks.update(this._id, {
        $set: {checked: ! this.checked}
      });
    },
    "click .delete": function () {
      event.preventDefault();
      Tasks.remove(this._id);
    }
  });

  Template.setting.events({
    "click .reorder-tasks": function () {
      Settings.update(this._id, {
        $set: {order_ascending: ! this.order_ascending}
      });
    }
  });
}