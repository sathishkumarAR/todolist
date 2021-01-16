require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_CONNECTION_URI, {useNewUrlParser:true, useUnifiedTopology:true});

const itemSchema= new mongoose.Schema({
  name:String
});

const listSchema = new mongoose.Schema({
  name:String,
  itemsArray: [itemSchema]
});

const List = mongoose.model("List",listSchema);

const Item= mongoose.model("item", itemSchema);

const item1 = new Item({
  name:"Welcome to your ToDo List"
});

const item2= new Item({
  name:"Hit + to add your item"
});

const item3= new Item({
  name:"<---Hit this to delete an item"
});

const defaultItems=[item1, item2, item3];

//////////////////////////////////////////////////////// Handling HTTP requests ////////////////////////////////////////////////////////

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err);
    }
    else{
      if(foundItems.length ===0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully inserted default items to DB");
          }
        });
      }

      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:listName", function(req,res){
  const listName= _.capitalize(req.params.listName);

  List.findOne({name:listName}, function(err, listFound){
    if(err){
      console.log(err);
    }
    else{
      if(!listFound){
        const list= new List({
          name:listName,
          itemsArray: defaultItems
        });
        list.save();
        res.redirect("/"+listName);
      }
      else{
        res.render("list", {listTitle:listFound.name, newListItems:listFound.itemsArray});
      }
    }
  }); 
});

app.post("/", function(req, res){

  const listName= req.body.listName;

  const item = new Item({
    name: req.body.newItem
  });

  if(item){
    if(listName==="Today"){
      item.save();
      res.redirect("/");
    }
    else{
      List.findOne({name:listName},function(err, foundDocument){

          foundDocument.itemsArray.push(item);
          foundDocument.save();
          res.redirect("/" + listName);
      });
    }
  }
  //not adding items when it is empty---->not working, must check
  else{
    console.log("Empty Item");
    res.redirect("/");
  }
});

app.post("/delete", function(req, res){
  
  const listName= req.body.listName;
  const itemId= req.body.checkbox;

  if(listName==="Today"){
    Item.deleteOne({"_id":itemId}, function(err){
      if(err){
        console.log(err);
      }
      else{
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{"$pull":{itemsArray:{"_id":itemId}}},{useFindAndModify:false}, function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully removed");
        res.redirect("back");
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT, function() {
  console.log("Server started on port 3000");
});
