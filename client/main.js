
// meteor --release 1.3.2.4

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import '../meteors.js';
import '/imports/api/util.js';

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

Meteor.startup(function () {

    sAlert.config({
        effect: '',
        position: 'top-right',
        timeout: 2000,
        html: false,
        onRouteClose: true,
        stack: true,
        // or you can pass an object:
        // stack: {
        //     spacing: 10 // in px
        //     limit: 3 // when fourth alert appears all previous ones are cleared
        // }
        offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,
        // examples:
        // beep: '/beep.mp3'  // or you can pass an object:
        // beep: {
        //     info: '/beep-info.mp3',
        //     error: '/beep-error.mp3',
        //     success: '/beep-success.mp3',
        //     warning: '/beep-warning.mp3'
        // }
        onClose: _.noop //
        // examples:
        // onClose: function() {
        //     /* Code here will be executed once the alert closes. */
        // }
    });

});
Template.body.rendered = function() {
};

Template.body.onCreated(function helloOnCreated() {
   // counter starts at 0
   this.selectedDate = new ReactiveVar(new Date().valueOf());
   // this.currentUser = new ReactiveVar(  Meteor.userId() );
   var self = this;

   Tracker.autorun(() => {
	 var d = new Date(self.selectedDate.get()); // whenever selectedDate changes run and get new months data
	 const handle = Meteor.subscribe('timingspub', Session.get("currentUser"), d.getMonth() + 1, d.getFullYear());
	 Meteor.subscribe('timingspub', Session.get("currentUser"), d.getMonth(), d.getFullYear()); // load prev month data also as we need it to find hrs worked in last week of last months

		Tracker.autorun(() => {
		  const isReady = handle.ready();
		  // only fires listeners when dataready state is diff from current
		  Session.set("dataready", isReady);// reqd to run getDaysInParticularMonth which updates UI
		  console.log(`Handle is ${isReady ? 'ready' : 'not ready'}`);  
		  console.log(Timing.find().count());
		});
	});
	
	
});

// global helper
Template.registerHelper('formatDate', function(date) {
    return moment(date).format("hh:mma DD-MMM-YY");
});

Template.calendarRow.onCreated(function helloOnCreated() {
     var self = this;
	 
	// var historyId = new ReactiveVar;
	  
	 //https://stackoverflow.com/questions/32195460/how-can-i-make-meteor-subscriptions-dynamic
	 // Put in tracker as it clears previous values automatically
	 // will fire automatically due to session.get
	Tracker.autorun(() => {
		 if(Session.get("historyId")){
		  //  debugger;
		//	Session.set("thishistory",)
		    const handle = self.subscribe('timinghistorypub', Session.get("historyId"));
			//if(handle.ready())
	 	    //  console.log(TimingHistory.find().fetch());
		 }
		});
});

Tracker.autorun(function(){
  if(Meteor.userId() && Session.get("currentUser") == undefined){
	 Session.set("currentUser", Meteor.userId()); // use sessions as ReactiveVar had issues in Tracker to call its set() method. It needs to know the template 
	    // this.currentUser = Meteor.userId();
  }
});


Tracker.autorun(function(){
	if(Meteor.user()!= undefined)
	 if(Meteor.user().username == 'admin')
	 {
		const handle1 = Meteor.subscribe('registeredusers');
		Tracker.autorun(() => {
		  if(handle1.ready())
		  {
			

		    //Session.set("currentUser",result[0]._id);
		//   return result;
	      }
		});	 
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

//from am/pm to 24. 8:10pm -> 20:10
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
 
 function suggestTime(index)
 {
	 debugger;
	 var weeklyhrsputms  =0;
	 var startofweekindex=index;
	 var daysworkedinweek =0;// = index - startofweekindex + 1;
	 
	 var selectedDate = days[index];
	 if( selectedDate.timeIn === undefined)
		 return;
	 
	 var intime= convertTo24Hour( selectedDate.timeIn );
 	 var date1 = new Date( selectedDate.year, selectedDate.month-1, selectedDate.date, intime.hours, intime.minutes); 

	 // if its the start of month then some working days were in last month
	 if(index - ((days[index].day + 6) %7 ) < 0) // if current index is less that day number  
	 {
		 // find hrsworked from the Sunday entry which has all the total
		 for(var x=index; ;x++)
		 {
			 var d = days[x];
			 if(d.day == 0) // sunday has the total # of hours in that week
			 {
				 weeklyhrsputms = convertStrToMs( d.weeklyHours ) * 60 * 1000;
				 break;
			 }
		 }
		
			// prev month data already loaded in the data loading stage
			// prev month + current month except current date
	    daysworkedinweek = Meteor.myFunctions.findDaysWorkedInLastWeekOfPreviousMonth( Session.get("currentUser"), new Date(date1)) ; // new Date as it decrements original
		  
		  // now find days worked in this week of current month
		  // skip the current day as if it has hoursworked already mention then dont get it counted as index date is later added in daysworkedinweek
		 
		 // finddaysworkedinlastweek calclates prev month and this week also except current
		 // for(var g=index-1; g>=0; g--)
		 // {
			  // var d = days[g];
			 
			 // // skip if it was a leave or holiday. only count if diff is present
			 // if(d.timediff != "" && d.timediff != undefined)
				 // daysworkedinweek ++;
		 // }
	 }
	 else
	 {
		 for(var i=index -1; i >=0; i--)
		 {
			 var d = days[i];
			 
			 if(d.day == 0) // sunday
				break;
				
			 // skip if it was a leave or holiday. only count if diff is present
			 if(d.timediff != "" && d.timediff != undefined)
				 daysworkedinweek ++;
			 
			 weeklyhrsputms += convertStrToMs( d.timediff ) * 60 * 1000;
		 }
	 }
	 
	 daysworkedinweek++; // add current day also
	 
	 var hoursreqperday = "10:00";
	 if(Meteor.user().username  === "sami" || Meteor.user().username  === "Asad")
	 	hoursreqperday = "08:00";

	 var shouldworkedinweekms = daysworkedinweek * convertStrToMs(hoursreqperday) * 60* 1000;
	 
	 var diffms = shouldworkedinweekms - weeklyhrsputms;
	 if(diffms < 0)
		 return 'Go home now!';
	 
	 var brkmins = 0, wfhmins = 0;
	 if(days[index].breakTime != "")
	 {
		var br = days[index].breakTime.split(':');
	    brkmins = parseInt(br[0])*60+ parseInt(br[1]);
	 }
	 
	 var remark = days[index].remarks;
	 if(days[index].remarks.indexOf(' ')>0)
		remark = days[index].remarks.substr(0,days[index].remarks.indexOf(' '));
	
	var w = remark.split(':');
	 wfhmins = parseInt(w[0])*60+ parseInt(w[1]);
	
	 // if its a txt remark then dont include it in hours worked calculation
	 if(isNaN(wfhmins))
		wfhmins = 0;

	 date1 = date1.getTime() + diffms + brkmins * 60*1000 - wfhmins *60*1000;
	 //date1 += diffms;
	// days[index].timeOut =  new Date(date1 );
	 var da = new Date( date1 );
	// days[index].timeOut = da;
	 return da;
 }

 // converts time str like 45:35 to ms
 function convertStrToMs(timestr)
 {
	 if(timestr === "" ||  timestr ===undefined )
		return 0;
	
	var br = timestr.split(':');
	return parseInt(br[0])*60+ parseInt(br[1]);
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
 
 function timeTo12HrFormat(time, isFormat)
{   // Take a time in 24 hour format and format it in 12 hour format
    var time_part_array = time.split(":");
    var ampm = 'AM';

    if (time_part_array[0] >= 12) {
        ampm = 'PM';
    }

    if (time_part_array[0] > 12) {
        time_part_array[0] = time_part_array[0] - 12;
    }

	var formatted = "";
	if(isFormat)
	{
		if(time_part_array[0] < 10 && ampm == "AM")
			formatted = "<span class='text-success'>" ;
		else if(time_part_array[0] < 11 && ampm == "AM")
			formatted = "<span class='text-secondary'>" ;
		else if(time_part_array[0] < 12 && ampm == "AM")
			formatted = "<span class='text-warning'>" ;
		else
			formatted = "<span class='text-danger'>" ;
	}

	formatted += time_part_array[0] + ':' + time_part_array[1] + ' ' + ampm;
	
	if(isFormat)
		formatted +="</span>";
	
    return formatted;
}

 function getAverageTime(times, inout) {
    var count = times.length
	var valids = 0;
    var timesInSeconds = 0;
	var time;
	
    // loop through times
    for (var i =0; i < count; i++) {
        // parse
		if(inout == "in")
			time = times[i].timeIn;
		else if (inout == "out")
			time = times[i].timeOut;
			
		if(time == undefined || time =="")
			continue;

	    var time24hr = convertTo24Hour(time);
		
		valids ++;
        var hrs = time24hr.hours;
        var mins = time24hr.minutes;
       // var secs = Number(ampm[0]);
   //     ampm = ampm[1];
        // convert to 24 hr format (military time)
        //if (ampm == 'PM' && hrs!=12) hrs = hrs + 12;   
        // find value in seconds of time
        var totalSecs = hrs * 60 * 60;
        totalSecs += mins * 60;
       // totalSecs += secs;
        // add to array
        timesInSeconds += totalSecs;
    }
    // find average timesInSeconds
	if(valids ==0)
		return "";
	
    var total = 0;

    var avg = Math.round(timesInSeconds / valids); // avg seconds since midnight
	var avgTime = new Date(0,0,0,0,0,0); // initialize a date with any day but with time of midnight
	avgTime.setSeconds(avg); // add seconds from midnight i.e 0th second of a day
	
	return timeTo12HrFormat(avgTime.toTimeString().split(' ')[0], inout == "in" ? true: false);
}

function formatTimeforUI()
{
	
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
		
		Session.get("dataready");  // to make this method called
         // Since no month has fewer than 28 days
         var date = new Date(year, month-1, 1);
         //days = [];
		 days.length = 0; // clear the array
         console.log('month', month, 'date.getMonth()', date.getMonth())
		
		 // cursor.forEach(function (post) {
           // console.log("Title of post "+ post.day);
       // });
//debugger;
	   var weeklyHoursms = 0, monthyHoursms = 0, index = 0;
	    while (date.getMonth() === month-1) {
		//debugger;
			  var cursor = Meteor.myFunctions.getTiming( Session.get("currentUser"), date.getDate(), date.getMonth()+1, date.getFullYear());
			
			// var cursor = null;
             //   Meteor.call('getTiming', Session.get("currentUser"), date.getDate(), date.getMonth()+1, date.getFullYear(),
			//	function(error, result)
			//	{
			//		cursor = result;
				
				//});
					 if(date.getDate() == 1 && date.getDay() != 1) // if first day of month is not monday then find hrsworked from previous month also
					//	weeklyHoursms = Meteor.myFunctions.findPreviousMonthsHrsWorked( Session.get("currentUser"), new Date(date));
					{
							//const handle = Meteor.subscribe('timingspub', Meteor.userId(), date.getMonth(), date.getFullYear()); // get data of prev month loaded
	 
							//Tracker.autorun(() => {
 							//    if(handle.ready())

									weeklyHoursms = Meteor.myFunctions.findPreviousMonthsHrsWorked(Session.get("currentUser"), new Date(date));
							// });
					}
					 
					 let intime,outtime, timingid;

					  var obj = {
					   //  datestring : date.getDay() +" "+date.getDate()  + "-" + (date.getMonth()+1) + "-" + date.getFullYear(),
						 dayname: dayNames[date.getDay()],
						 day: date.getDay(),
						 date: date.getDate(),
						 month: (date.getMonth()+1),
						 monthname: monthNames[(date.getMonth())].substr(0,3),
						 year: date.getFullYear(),
						 index: index,
					  }
					  
					  index++;
					  
			//		  debugger;
					if(cursor!= null && cursor.length >0) // if there is record in db for this date
					{
					//	debugger;
						obj.timeIn = cursor[0].in;
						obj.timeOut =  cursor[0].out;
						obj.id =  cursor[0]._id;
						obj.timediff = cursor[0].hrsworked; // break time deducted and wfh added in it already
						obj.breakTime =  cursor[0].breakTaken;
						obj.remarks =  cursor[0].remarks; // may contain wfh timing or txt remark
						
						if(cursor[0].hrsworkedms != null)
						{
							weeklyHoursms += cursor[0].hrsworkedms;
							monthyHoursms += cursor[0].hrsworkedms;
						}
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
					
			//	});
	       date.setDate(date.getDate() + 1);
	    }
		//	  var cursor = getTiming1();
	//	debugger;
		
         var monthTime = getHoursMinsFromms(monthyHoursms);
		Session.set('monthHrs', monthTime );	
		Session.set("days", days);
         return days;
    },
	
	getRegisteredUsers()
	{		
		// const handle = Meteor.subscribe('registeredusers');
	 
		// Tracker.autorun(() => {
			// debugger;
		  // const ready =	handle.ready();
		  // if(ready)
		  // {
  		     // Session.set('currentUser', result[0]._id);  // set currentuser to first item in the dropdown as the data is related to that user, also download csv filename is correct this way
			 // return Meteor.users();
		  // }
		// });
		
	   	var result = Meteor.myFunctions.getRegisteredUsers();
		
	   	Session.set("currentUser", result[0]._id);
	    return result;
	},
	
	getMonthHours()
	{
		var res = Session.get('monthHrs');
		return res.hour + ":" + res.min
	},
	

    getHistoryOfTiming()
	{
		return TimingHistory.find().fetch();
	},
	
	getAverageArrivalTime(param)
	{
	    var totalMS = 0;
	    var valids = 0;
  	 //   var d = new Date(Template.instance().selectedDate.get());
		
		var x = Session.get('days');
		console.log(x);
	    Session.get("dataready");  // to make this method called
	
	    var res = getAverageTime(days, param);
		// return hours+ ":" +mins + " " + suffix;
	    return res;
	}
});

Template.calendarRow.helpers({
	getHistoryOfTiming(array)
	{
		if(array.id == undefined)
			return null;
	//	console.log( "timings hist" + TimingHistory.find().count());
		return TimingHistory.find({timingid:array.id}).fetch();
	}

});

Template.body.events({
 	'click #reset'(event, instance) {
 		Meteor.call('resetPassword1',
					function(error, result)
					{
					
					});
		   	
		  
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
		var fileData;
		fileData = Meteor.myFunctions.getUserName( Session.get('currentUser') )[0].username + '\r\n'+monthNames[d.getMonth()] + ' ' + d.getFullYear()+ '\r\n\r\n'; 
		fileData+= "Day,Date,Time in,Time out,Break,WFH,Daily Hours,Weekly Hours \r\n";

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

Template.calendarRow.events({
	"submit form": function (event, instance) {  // this refers to the object we created when we created  timing record, this._id was set there
      // Prevent default browser form submit
      event.preventDefault();
      // Get value from form element
      var In = event.target.In.value;
      var Out = event.target.Out.value;
      var Break = event.target.Break.value;
      var Remarks = event.target.Remarks.value;
      var obj = instance.data;
 	
 	  $('#timeout'+ obj.index).attr("class","normalText");
		  
	  if (! Meteor.userId() )  {
         throw new Meteor.Error("Not authorized to change without valid user login");
      }
		
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
	 
	  var self = this;
	  if(!Meteor.status().connected)
	  {
        sAlert.info('Cannot communicate with server', { position: 'top-right', timeout: '3000', onRouteClose: false, stack: false, offset: '180px'});
    	return;
      }

	  Meteor.call("getServerTime", function (error, result) {
            Session.set("time", result);
            
            if(error)
            {
                sAlert.info('Error from server', { position: 'top-right', timeout: '2000', onRouteClose: false, stack: false, offset: '180px'});
            	return;
            }

            var recDate = moment(new Date( self.year, self.month-1, self.date));

            var mdate = moment(result);

			var duration = moment.duration(mdate.diff(recDate));
			var diffDays = duration.asDays();

         //   var timeDiff = Math.abs(result.getTime() - recDate.getTime());
		//	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

			if(diffDays< 0)
			{
				sAlert.info('You cannot predict future..', { position: 'top-right', timeout: '4000', onRouteClose: false, stack: false, offset: '220px'});
                return;
			}
            if(diffDays > 7 && Meteor.user().username != 'admin')
            {
                sAlert.info('Not authorized to modify old records...', { position: 'top-right', timeout: '4000', onRouteClose: false, stack: false, offset: '220px'});
                return;
            }
            else
            {
        	  if(self.id) // id already in db so update case
			  {
			  //  Timing.update(this.id, { // this.id is from getdaysinparticularmonth loop
				//  $set: {in: In, out: Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break, remarks:Remarks} });
				Meteor.call('updateTiming', self.id, Meteor.user().username, self.date, self.month, self.year, In, Out, hrsworkedms, hrsworked, Break, Remarks,
					function(error, result)
					{
						if(!error)
						{
						    sAlert.info('Saved...', { position: 'top-right', timeout: '2000', onRouteClose: false, stack: false, offset: '180px'});
							Session.set("dataready", 1);// reqd to updates UI
						}
						else
						   sAlert.info('Error updating record', { position: 'top-right', timeout: '2000', onRouteClose: false, stack: false, offset: '180px'});
					});
		   	  }
			  else
			  {
			 	Meteor.call('saveTiming', Session.get("currentUser"), Meteor.user().username, self.date, self.month, self.year, In, Out, hrsworkedms, hrsworked, Break, Remarks,
		 			function(error, result)
					{
						if(!error)
						{
							sAlert.info('Saved...', { position: 'top-right', timeout: '2000', onRouteClose: false, stack: false, offset: '180px'});
							Session.set("dataready", 1);// reqd to updates UI
						}					   
						else
						   sAlert.info('Error saving record', { position: 'top-right', timeout: '2000', onRouteClose: false, stack: false, offset: '180px'});
					});

			  }
            }
        });

		
	// Meteor.call('saveTask', text);
      // Clear form
     // event.target.text.value = "";
    },
    'focusout input.text': function (evt, template) {
      if (evt.which === 0) {
      	//  $('#formid'+ template.data.index).submit();
      }
    },
   'click #suggest'(event, instance) {
	  event.preventDefault();

      var obj = instance.data;
	  var t2 = suggestTime( obj.index );
	  
	  if( t2 === undefined)
		  return;
	  
	  if(typeof(t2) === 'string')
	  {
		  $('#timeout'+obj.index).val( t2 );
    	  $('#timeout'+obj.index).attr("class","suggestText");
		  return;
      }
	   //it is pm if hours from 12 onwards
	  var hours = t2.getHours();
	  suffix = (hours >= 12)? 'pm' : 'am';
      //only -12 from hours if it is greater than 12 (if not back at mid night)
      hours = (hours > 12)? hours -12 : hours;
      //if 00 then it is 12 am
      hours = (hours == '00')? 12 : hours;
	  var mins =  t2.getMinutes() ;
	  if(parseInt(mins)<10)
	     mins = '0' + mins;

	  var estdate = "";
      if(obj.date != t2.getDate())
		 estdate = " (" + t2.getDate() + "-" + (t2.getMonth() + 1) + ")" ;
	
	  $('#timeout'+obj.index).val( hours + ":" + mins + " " + suffix + estdate );
	  $('#timeout'+obj.index).attr("class","suggestText");
//	  alert("Leaving time today should be : " + t2);
  },
  
  'click #historybtn'(event, instance){
	   event.preventDefault();
	    var obj = instance.data;

        var previousId = Session.get("historyId"); 

        // fires subscription in tracker
		if(previousId != obj.id)		
			Session.set("historyId", obj.id);

 		if(previousId === obj.id &&  Session.get("historyShown") === 1)
	      Session.set("historyShown", 0);
		else
		  Session.set("historyShown", 1);
  }
});
//
Accounts.ui.config({
   passwordSignupFields: "USERNAME_ONLY"
});	
  
 // ------------------- used by #if in html-----------------------
Template.registerHelper('equals',
    function(v1, v2) {
        return (v1 === v2);
    }
);

Template.registerHelper('HasTimingRecords',
    function(val) {
    	if(val.id == undefined)
    		return 0;

    	if(Session.get("historyShown")  === 0)
    		return 0;

    	var count = TimingHistory.find({timingid:val.id}).fetch().length;
    	console.log ("count = " + count)
        return (count > 0 );
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

