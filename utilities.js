// Handy stuff to have around that shouldn't be embedded in the app itself
Utilities  = {
  taskOrderRepair: function () {
    Consensual.tasks = Tasks.find({}, {sort: {order: 1}}).fetch();
    return (function () {
      try {
        var queueRepairs = function() {
          var runstart = Date.now();
          var new_order = 0;
          console.log("running orderRepair...");
          _.each(Consensual.tasks, function(element) {
            new_order++;
            var doThisLater = (function (element, new_order) {
              Tasks.update({_id: element._id},{$set: {order: new_order}})
            })(element, new_order);
            setTimeout(doThisLater, 0);
          });
          return ("...success in " + (Date.now() - runstart) + "ms");
        }
        if (Consensual.tasks.length > 0) {
          console.log("called orderRepair on " + Consensual.tasks.length + " tasks... " + queueRepairs(Consensual.tasks));
        }
      }
      catch (e) {
        return e;
      }
    })();
  }
};
