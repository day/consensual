Tasks = new Mongo.Collection("tasks");
Settings = new Mongo.Collection("settings");

if (Meteor.isClient) {
  // This code only runs on the client

  Meteor.startup(function() {
    // Session stuff could go in here
    // Session.set("name_of_some_session_var", value_of_some_session_var);
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
      return document.domain;
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
