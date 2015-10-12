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
      var hide_completed_toggle = Session.get("hideCompleted") ? {checked: {$ne: true}} : {};
      return Tasks.find(hide_completed_toggle, {sort: {createdAt: order_ascending ? 1 : -1}});
    },
    header: function () {
      var domain = Session.get("domain");
      var phrase = "work in progress";
      var header = phrase;
      switch (domain) {
        case "consensu.al":
          header = domain + "  " + phrase;
          break;
        case "consensual.ly":
          header = phrase + "... " + domain;
          break;
      }
      return header;
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    completeCount: function () {
      return Tasks.find({checked: true}).count(); // We can't use 'checked: {$eq: true}' until Mongo 3.0 (currently on 2.6.7)
    },
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count(); // Oddly, 'checked: false' doesn't seem to work
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
    },
    "click .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.events({
    "focus .task_block": function () {
      // First, none other should be selected
      if (Session.get("last_selected")) {
        Tasks.update(
          Session.get("last_selected"),
          { $set: {selected: false} },
          { multi: true }
        );
      }
      // Then, highlight the selected task
      Tasks.update(this._id, {
        $set: {selected: true}
      });
      Session.set("last_selected", this._id);
    },
    "blur .task_block": function () {
      // Un-highlight the selected task
      Tasks.update(this._id, {
        $set: {selected: false}
      });
    },
    "focus .wide-text-edit": function () {
      // Deselect the text and position the caret at the end
      // TODO: Figure out how to position it based on where I clicked
      var text_input = event.target;
      setTimeout(function() {
        text_input.selectionStart = text_input.selectionEnd;
      }, 0);
    },
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Tasks.update(this._id, {
        $set: {checked: ! this.checked}
      });
    },
    "click .delete": function () {
      // Do not submit the form when deleting a task
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
