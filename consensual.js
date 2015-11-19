// Mongo collections we'll be working with
Tasks = new Mongo.Collection("tasks");
Settings = new Mongo.Collection("settings");

// Place to stash stuff for my app that I don't want to be global
Consensual  = {
  extractDomain: function (url) {
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
  },
  order_ascending_default: false,
  orderAscending: function () {
    return (Settings.find({_id: Meteor.userId()}).fetch()[0] !== undefined) ? Settings.find({_id: Meteor.userId()}).fetch()[0].order_ascending : Consensual.order_ascending_default;
  },
  hide_completed_default: true,
  hideCompleted: function () {
    return (Settings.find({_id: Meteor.userId()}).fetch()[0] !== undefined) ? Settings.find({_id: Meteor.userId()}).fetch()[0].hide_completed : Consensual.hide_completed_default;
  },
  currentUser: function () {
    return Meteor.user() && Meteor.user().username || "";
  }
};

if (Meteor.isServer) {

  // Make it so we can drag and drop tasks to reorder
  Sortable.collections = ["tasks"];

  // Customize the password reset email
  Accounts.emailTemplates.siteName = "Consensu.al";
  Accounts.emailTemplates.from = "Consensu.al Admin <day.waterbury@gmail.com>";
  Accounts.emailTemplates.resetPassword.subject = function (user) {
    return "Password Reset for " + Accounts.emailTemplates.siteName;
  };
  Accounts.emailTemplates.resetPassword.text = function (user, url) {
    var greeting = (user.profile && user.profile.name) ? ("Greetings " + user.profile.name + "!") : "Greetings!";
    return greeting + "\n\n"
    + "To reset your password, simply click the link below:\n\n"
    + url + "\n\n"
    + "If you do not wish to reset your password, simply ignore this email.\n\n"
    + "Big Love! <3 ~Day";
  };

  Accounts.onCreateUser(function(options, user) {
    // We store user-specific settings in another table keyed to the userId
    Settings.insert({"_id": user._id, "order_ascending": Consensual.order_ascending_default, "hide_completed": Consensual.hide_completed_default, "createdAt": user.createdAt});
    // We still want the default hook's 'profile' behavior.
    if (options.profile)
      user.profile = options.profile;
    return user;
  });

}

if (Meteor.isClient) {
  // This code only runs on the client

  Meteor.startup(function() {
    Session.setDefault("domain", Consensual.extractDomain(document.referrer));
    Session.set("task_selected", false);
  });
  
  Template.body.helpers({
    settings: function () {
      return Settings.find({_id: Meteor.userId()});
    },
    tasks: function () {
      
      var hide_completed_toggle = Consensual.hideCompleted() ? {checked: {$ne: true}} : {};

      // Eventually, this will be accessible only through an TS/admin interface...for now, merely obfuscated
      // Utilities.taskOrderRepair();

      return Tasks.find({$and:[{owner: Meteor.userId()}, hide_completed_toggle]}, {sort: {order: Consensual.orderAscending() ? 1 : -1}});

    },
    domain: function () {
      var domain = Session.get("domain");
      switch (domain) {
        case "consensu.al":
          return domain;
        case "consensual.ly":
          return domain;
        default:
          return false;
      }
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
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
      var next = Tasks.find({}).count() + 1;
      // Insert a task into the collection
      Tasks.insert({
        text: text,
        createdAt: new Date(),              // current time
        owner: Meteor.userId(),             // _id of logged in user
        username: Meteor.user().username,   // username of logged in user
        order: next,
        checked: false,
        selected: false
      });
 
      // Clear form
      event.target.text.value = "";
    }
  });

  Template.task.helpers({
    selected: function() {
      return this._id === Session.get("task_selected");
    },
    editable: function() {
      return ((Consensual.currentUser() === this.username) && !this.checked);
    }
  });

  Template.task.events({
    "focus .task_block": function () {
      // Highlight the selected task
      Session.set("task_selected", this._id);
    },
    "blur .task_block": function () {
      // Un-highlight the selected task
      Session.set("task_selected", false);
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
      var ids = _.pluck(Tasks.find({order: {$gt: this.order}}).fetch(), '_id');
      // This coupling rubs me the wrong way. Can this be done by setting something in Sortable?
      Meteor.call('rubaxa:sortable/collection-update', "tasks", ids, "order", -1);
      Tasks.remove(this._id);
    }
  });
   
  Template.hide_completed_toggle.helpers({
    hideCompleted: function () {
      return Consensual.hideCompleted();
    },
    completeCount: function () {
      return Tasks.find({$and:[{owner: Meteor.userId()}, {checked: true}]}).count(); // We can't use 'checked: {$eq: true}' until Mongo 3.0 (currently on 2.6.7)
    },
    incompleteCount: function () {
      return Tasks.find({$and:[{owner: Meteor.userId()}, {checked: {$ne: true}}]}).count(); // Oddly, 'checked: false' doesn't seem to work
    }
  });

  Template.hide_completed_toggle.events({
    "click .hide-completed input": function (event) {
      Settings.update(Meteor.userId(), {
        $set: {hide_completed: event.target.checked}
      });
    }
  });

  Template.task_order.helpers({
    orderAscending: function () {
      return Consensual.orderAscending()
    }
  });

  Template.task_order.events({
    "click .reorder-tasks": function (event) {
      Settings.update(Meteor.userId(), {
        $set: {order_ascending: ! Consensual.orderAscending()}
      });
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
  });

}
