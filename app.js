const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-thomas:test123@cluster0.tyyjg.mongodb.net/todolistDB");

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB.");
          }
        });

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        // Create a new list

        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + list.name);
      } else {
        // Show an existing list

        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/", function (req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;

  const item = new Item({ name: itemName });

  if (listName == "Today") {
    item.save();

    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $push: { items: item } }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + foundList.name);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (listName == "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      }
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + foundList.name);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});
