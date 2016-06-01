import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import '../meteors.js';
import '../client/util.js';

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

 
Template.body.rendered = function() {
};

Template.body.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.selectedDate = new ReactiveVar(new Date().valueOf());
 // this.currentUser = new ReactiveVar(  Meteor.userId() );
});

Tracker.autorun(function(){
	debugger;
  if(Meteor.userId()){
	 Session.set("currentUser", Meteor.userId()); // use sessions as ReactiveVar had issues in Tracker to call its set() method. It needs to know the template 
    // this.currentUser = Meteor.userId();
  }
});

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

//from am/pm to 24 
function convertTo24Hour(time) {
	var hours = Number(time.match(/^(\d+)/)[1]);
	var minutes = Number(time.match(/:(\d+)/)[1]);
	var AMPM = time.match(/\s(.*)$/)[1].toLowerCase();
	if(AMPM == "pm" && hours<12) hours = hours+12;
	if(AMPM == "am" && hours==12) hours = hours-12;
	return {hours:hours, minutes:minutes};
}

function getTimeDiff(year, month, date, In, Out, brk, rem)
{
	debugger;
	var intime= convertTo24Hour(In);
	var outtime= convertTo24Hour(Out);

	var date1 = new Date(year, month, date, intime.hours, intime.minutes); 
	var date2 = new Date(year, month, date, outtime.hours, outtime.minutes);
	
	if(brk == "")
		brk = "0:0";
	
	var br = brk.split(':');
	
	if(rem.indexOf(' ')>0)
		rem = rem.substr(0,rem.indexOf(' '));
	
	var w = rem.split(':');
//	date1.setHours(t1.)

	// the following is to handle cases where the times are on the opposite side of
	// midnight e.g. when you want to get the difference between 9:00 PM and 5:00 AM

	if (date2 < date1) {
		date2.setDate(date2.getDate() + 1);
	}

	var brkmins = parseInt(br[0])*60+ parseInt(br[1]);
	var wfhmins = parseInt(w[0])*60+ parseInt(w[1]);
	
	// if its a txt remark then dont include it in hours worked calculation
	if(isNaN(wfhmins))
		wfhmins = 0;
	
	var diff = (date2 - date1)- brkmins * 60*1000 + wfhmins *60*1000;
//	var msec = diff;
    var hm = getHoursMinsFromms(diff);
	
  
   return {diffms:diff, hour:hm.hour, min:hm.min};
 }

 function getHoursMinsFromms(msec)
 {
	var hh = Math.floor(msec / 1000 / 60 / 60);
	msec -= hh * 1000 * 60 * 60;
	var mm = Math.floor(msec / 1000 / 60);
//	msec -= mm * 1000 * 60;
//	var ss = Math.floor(msec / 1000);
//	msec -= ss * 1000; 
   if(parseInt(mm)<10)
	mm = '0' + mm;
   
   return {hour:hh,min:mm};
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
  	//	currentDate = now;
      //  return [selectedDate.getMonth()+1, selectedDate.getFullYear()];
	  var d = new Date(Template.instance().selectedDate.get());
	  return [d.getMonth()+1, d.getFullYear()];
	},
	
	getDaysInParticularMonth(array) {
		 var month = array[0];
		 var year = array[1];
         // Since no month has fewer than 28 days
         var date = new Date(year, month-1, 1);
         days = [];
         console.log('month', month, 'date.getMonth()', date.getMonth())
		
		 // cursor.forEach(function (post) {
           // console.log("Title of post "+ post.day);
       // });
	   debugger;
	    var weeklyHoursms = 0;
         while (date.getMonth() === month-1) {
			  var cursor = Meteor.myFunctions.getTiming( Session.get("currentUser"), date.getDate(), date.getMonth()+1, date.getFullYear());
		//	  var cursor = getTiming1();
	//	debugger;
		
			 if(date.getDate() == 1 && date.getDay() != 1) // if first day of month is not monday then find hrsworked from previous month also
				weeklyHoursms = Meteor.myFunctions.findPreviousMonthsHrsWorked( Session.get("currentUser"), new Date(date));
		     
			 let intime,outtime, timingid;
			  
	       //	debugger;
              var obj = {
			   //  datestring : date.getDay() +" "+date.getDate()  + "-" + (date.getMonth()+1) + "-" + date.getFullYear(),
				 dayname: dayNames[date.getDay()],
				 day: date.getDay(),
				 date: date.getDate(),
				 month: (date.getMonth()+1),
				 year: date.getFullYear(),
		      }
			  
	//		  debugger;
		  	if(cursor.length >0) // if there is record in db for this date
			{
			//	debugger;
				obj.timeIn = cursor[0].in;
				obj.timeOut =  cursor[0].out;
				obj.id =  cursor[0]._id;
				obj.timediff = cursor[0].hrsworked; // break time deducted and wfh added in it already
				obj.breakTime =  cursor[0].breakTaken;
				obj.remarks =  cursor[0].remarks; // may contain wfh timing or txt remark
				
				if(cursor[0].hrsworkedms != null)
			    	weeklyHoursms += cursor[0].hrsworkedms;
			}
			
			// to be displayed agains sunday. whole weeks, hours
			if(obj.day == 0)
			{
			//	debugger;
				var result = getHoursMinsFromms(weeklyHoursms);
				obj.weeklyHours  = result.hour + ":" + result.min
				
				weeklyHoursms = 0; //reset
			}
				
            days.push(obj);
            date.setDate(date.getDate() + 1);
		  }
         
         return days;
    },
	
	getRegisteredUsers()
	{
		var result = Meteor.myFunctions.getRegisteredUsers();
		Session.set('currentUser', result[0]._id);  // set currentuser to first item in the dropdown as the data is related to that user, also download csv filename is correct this way
		return result;
	}
});

Template.body.events({
   "submit form": function (event) {  // this refers to the object we created when we created  timing record, this._id was set there
      // Prevent default browser form submit
      event.preventDefault();
      // Get value from form element
      var In = event.target.In.value;
      var Out = event.target.Out.value;
      var Break = event.target.Break.value;
      var Remarks = event.target.Remarks.value;

	  if (! Meteor.userId() || Meteor.user().username === 'admin')  {
          throw new Meteor.Error("Not authorized to change without valid user login");
      }
		
	debugger;
	
	Remarks = Remarks.replace(',','.'); // replace , with smthing else as it disturbs the CSV output 
	 var hrsworkedms = 0, hrsworked = "";
	 if(In != '' && Out != '')
	 {
		  var d1 =  this.year + "-" + this.month + "-" + this.date+ " " + In;
		  var d2 =  this.year + "-" + this.month + "-" + this.date  + " " + Out;
			   
		 var result = getTimeDiff(this.year, this.month-1, this.date, In, Out, Break, Remarks);
		 hrsworkedms = result.diffms;
		 hrsworked = result.hour + ":" + result.min;
	 }
	 
	  if(this.id) // id already in db so update case
	  {
	    Timing.update(this.id, { // this.id is from getdaysinparticularmonth loop
		$set: {in: In, out: Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break, remarks:Remarks} });
   	  }
	  else
	  {
		    Timing.insert({ userid: Meteor.userId(), usename: Meteor.user().username, 
				day: this.date, month: this.month, year:this.year, in: In, out:Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break, remarks:Remarks});
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
    },	
	 'click #download'(event, instance) {
           	  debugger;
		var d = new Date(Template.instance().selectedDate.get());
		
		// get current username from his _id
		var filename =  Meteor.myFunctions.getUserName( Session.get('currentUser') )[0].username + '-'+monthNames[d.getMonth()] + '.csv';
		var fileData = "Day,Date,Time in,Time out,Break,Remarks,Daily Hours,Weekly Hours \r\n";

		var headers = {
		  'Content-type': 'text/csv',
		  'Content-Disposition': "attachment; filename=" + filename
		};
		var records = days;
		
		// build a CSV string. Oversimplified. You'd have to escape quotes and commas.
		records.forEach(function(rec) {
		  fileData += rec.dayname + "," + rec.month + "-"+rec.date +"-"+ rec.year;
		  
		  fileData  += ",";
		  if(rec.timeIn)
		   fileData  += rec.timeIn;

		 fileData  += ",";
		  if(rec.timeOut)
		   fileData  += rec.timeOut;
	   
		fileData  += ",";
		 if(rec.breakTime)
		   fileData  += rec.breakTime;
	   
		fileData  += ",";
		 if(rec.remarks)
			fileData  += rec.remarks;
		
		 fileData  += ",";
		 if(rec.timediff)
		   fileData  += rec.timediff;
	   
		fileData  += ",";
		 if(rec.weeklyHours)
			fileData  += rec.weeklyHours;
		  fileData+= "\r\n";
		});
		
		var blob = new Blob([fileData], 
						{type: "text/csv;charset=utf-8"});
						
		saveAs(blob, filename);
    },	
	'change #allusers' (event, instance){
		debugger;
		var currentTarget = event.currentTarget;
       	 Session.set("currentUser", currentTarget.options[currentTarget.selectedIndex].value );
	}
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

Accounts.ui.config({
   passwordSignupFields: "USERNAME_ONLY"
});	
  
 // ------------------- used by #if in html-----------------------
Template.registerHelper('equals',
    function(v1, v2) {
        return (v1 === v2);
    }
);

Template.registerHelper('isAdmin',
    function(user) {
        return ( 'admin' === user.username);
    }
);

var today = new Date();
Template.registerHelper('isToday',
    function(day,month,year) {
	//	debugger;
		//var today = new Date();
		return ( today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year)
    }
);
//---------------------

