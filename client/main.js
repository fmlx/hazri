import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import '../meteors.js';

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];



var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];


Template.body.rendered = function() {
    $("#clockpick").clockpick({
starthour : 8,
endhour : 22,
showminutes : true,
minutedivisions:12,
event: 'mouseover',
layout: 'Horizontal'
});
};

Template.body.onCreated(function helloOnCreated() {
  // counter starts at 0

  this.selectedDate = new ReactiveVar(new Date().valueOf());
  
});

function getDaysInMonth1() {
   console.log("hey3"); 
   return 0;
}

function getTiming1()
{
     return Timing.find({day:4, month:5, year:2016}).fetch();
}
    
function getTiming(day, month,  year)
{
	return Timing.find({ userid: Meteor.userId(),day:day, month: month, year: year}).fetch();
}

function getDaysInPreviousMonth()
{
	var d = new Date(Template.instance().selectedDate.get());
  
	 d.setDate(1);
	 d.setMonth(d.getMonth()-1);	
	 Template.instance().selectedDate.set(d);
//	 return [selectedDate.getMonth()+1, selectedDate.getFullYear()];
}

function getDaysInNextMonth()
{
	var d = new Date(Template.instance().selectedDate.get());
  
	 d.setDate(1);
	 d.setMonth(d.getMonth()+1);	
	 Template.instance().selectedDate.set(d);
//	 return [selectedDate.getMonth()+1, selectedDate.getFullYear()];
}

function getTimeDiff(d1, d2, brk)
{
	//debugger;
	var date1 = new Date(d1); 
	var date2 = new Date(d2); 
	
	if(brk == "")
		brk = "0:0";
	
	var br = brk.split(':');
	
//	date1.setHours(t1.)

	// the following is to handle cases where the times are on the opposite side of
	// midnight e.g. when you want to get the difference between 9:00 PM and 5:00 AM

	if (date2 < date1) {
		date2.setDate(date2.getDate() + 1);
	}

	var brkmins = parseInt(br[0])*60+ parseInt(br[1]);
	
	var diff = (date2 - date1)- brkmins * 60*1000;
	var msec = diff;
	var hh = Math.floor(msec / 1000 / 60 / 60);
	msec -= hh * 1000 * 60 * 60;
	var mm = Math.floor(msec / 1000 / 60);
	msec -= mm * 1000 * 60;
//	var ss = Math.floor(msec / 1000);
//	msec -= ss * 1000;

if(parseInt(mm)<10)
	mm = '0' + mm;
   return {diffms:diff, hour:hh, min:mm};
 }

Template.body.helpers({
	// var selectedDate = new Date();
    selectedMonth()
	{
		var d = new Date(Template.instance().selectedDate.get());
		return monthNames[d.getMonth()];
	},
    selectedYear()
	{
		var d = new Date(Template.instance().selectedDate.get());
		return d.getFullYear();
	},
	
    getSelectedDate(){
		console.log('hey1')
    //    var now = new Date();
	//	currentDate = now;
      //  return [selectedDate.getMonth()+1, selectedDate.getFullYear()];
	  var d = new Date(Template.instance().selectedDate.get());
	  
	  return [d.getMonth()+1, d.getFullYear()];
	//  debugger;
	//	getDaysInParticularMonth(Template.instance().selectedDate.getMonth()+1, Template.instance().selectedDate.getFullYear());
	},
	
	getDaysInParticularMonth(array) {
		 var month = array[0];
		 var year = array[1];
         // Since no month has fewer than 28 days
         var date = new Date(year, month-1, 1);
         var days = [];
         console.log('month', month, 'date.getMonth()', date.getMonth())
		
		 // cursor.forEach(function (post) {
           // console.log("Title of post "+ post.day);
       // });
	   
         while (date.getMonth() === month-1) {
			  var cursor = getTiming(date.getDate(), date.getMonth()+1, date.getFullYear());
		//	  var cursor = getTiming1();
		    let intime,outtime, timingid;

		
	//	debugger;
              var obj = {
			     datestring : date.getDay() +" "+date.getDate()  + "-" + (date.getMonth()+1) + "-" + date.getFullYear(),
				 dayname: dayNames[date.getDay()],
				 day: date.getDay(),
				 date: date.getDate(),
				 month: (date.getMonth()+1),
				 year: date.getFullYear(),
			//	 timeIn: intime,
		//		 timeOut: outtime,
		//		 id: timingid
		      }
			  
		  	if(cursor.length >0) // if there is record in db for this date
			{
				obj.timeIn = cursor[0].in;
				obj.timeOut =  cursor[0].out;
				obj.id =  cursor[0]._id;
				obj.timediff = cursor[0].hrsworked;
				obj.breakTime =  cursor[0].breakTaken;
			}
            days.push(obj);
            date.setDate(date.getDate() + 1);
		  }
         
         return days;
    },
   
});

Template.body.events({
   "submit form": function (event) {  // this refers to the object we created when we created  timing record, this._id was set there
	// debugger;
      // Prevent default browser form submit
      event.preventDefault();
      // Get value from form element
      var In = event.target.In.value;
      var Out = event.target.Out.value;
      var Break = event.target.Break.value;

	  if (! Meteor.userId()) {
          throw new Meteor.Error("not-authorized");
      }
	
	 var hrsworkedms, hrsworked;
	 if(In != null && Out != null)
	 {
		  var d1 = this.date + "-" + this.month + "-" + this.year + " " + In;
		  var d2 = this.date + "-" + this.month + "-" + this.year + " " + Out;
	//	  var brk = this.date + "-" + this.month + "-" + this.year + " " + Break + " am";
			   
		 var result = getTimeDiff(d1,d2, Break);
		 hrsworkedms = result.diffms;
		 hrsworked = result.hour + ":" + result.min;
	 }
	 
	  if(this.id) // id already in db so update case
	  {
	    Timing.update(this.id, { // this.id is from getdaysinparticularmonth loop
		$set: {in: In, out: Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break} });
   	  }
	  else
	  {
		    Timing.insert({ userid: Meteor.userId(), usename: Meteor.user().username, 
				day: this.date, month: this.month, year:this.year, in: In, out:Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break});
	  }
		
	// Meteor.call('saveTask', text);
      // Clear form
      event.target.text.value = "";
    },
	 'click #prev'(event, instance) {
		   getDaysInPreviousMonth();
    },
    'click #next'(event, instance) {
           getDaysInNextMonth();
    }	
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

Template.calendarRow.helpers({
	
        
});

Accounts.ui.config({
   passwordSignupFields: "USERNAME_ONLY"
});	
  
Template.registerHelper('equals',
    function(v1, v2) {
        return (v1 === v2);
    }
);