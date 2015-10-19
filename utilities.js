// Handy stuff to have around that shouldn't be embedded in the app itself
Utilities  = {
  tasks: [],
  taskOrderRepair: function () {
    Utilities.tasks = Tasks.find({}, {sort: {order: 1}}).fetch();
    return (function () {
      try {
        var queueRepairs = function() {
          var runstart = Date.now();
          var new_order = 0;
          console.log("running orderRepair...");
          _.each(Utilities.tasks, function(element) {
            new_order++;
            var doThisLater = (function (element, new_order) {
              Tasks.update({_id: element._id},{$set: {order: new_order}})
            })(element, new_order);
            setTimeout(doThisLater, 0);
          });
          return ("...success in " + (Date.now() - runstart) + "ms");
        }
        if (Utilities.tasks.length > 0) {
          console.log("called orderRepair on " + Utilities.tasks.length + " tasks... " + queueRepairs(Utilities.tasks));
        }
      }
      catch (e) {
        return e;
      }
    })();
  }
};
