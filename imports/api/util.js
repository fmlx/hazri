import '/meteors.js';
import { Accounts } from 'meteor/accounts-base'

// not compiling without MEteor.func syntax
//Meteor.myFunctions  =  {
	
if (Meteor.isServer) {
  // This code only runs on the server
// debugger stmt wont work as its server side,. also dont use fetch() in find(), subscription wont get ready
  Meteor.publish('timingspub', function getTimingPub(userid, month, year) {
    return Timing.find({ userid: userid, month: month, year: year});
  });
  
  Meteor.publish('registeredusers', function a() {
     return Meteor.users.find({ 'username' : { $ne : 'admin'}},{ username:1 });
  });
  
  Meteor.publish('timinghistorypub', function a(timingid) {
	  // get all records(history records) for this timingid
     return TimingHistory.find({ timingid: timingid} , {sort : {"date":-1} } );
  });
}

if (Meteor.isServer) {
    Meteor.methods({
        getServerTime: function () {
            var _time = new Date();
            return _time;
        },

        resetPassword1: function()
        {
        	// Accounts.setPassword("WAXmiQJ5yEoyZ28pX", "hello");
        }
    });
}
  
Meteor.myFunctions = 
{
	// runs locally. works on the collection returned by server side methods 
	getRegisteredUsers()
	{
  	     return Meteor.users.find({ 'username' : { $ne : 'admin'}},{ username:1 }).fetch();
	},
	getTiming :function(user, day, month,  year) 
	{
	//	debugger;
		return Timing.find({ userid: user ,day:day, month: month, year: year}).fetch();
	},
	findPreviousMonthsHrsWorked:  function (userid, date)
	{
	//	debugger;
		var weeklyHoursms = 0;

		while(date.getDay() != 1) {// monday
		  date.setDate(date.getDate() - 1);
		//   var cursor = Meteor.call('getTiming', userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		   var cursor = Meteor.myFunctions.getTiming(userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		
 		  if(cursor.length >0) 
		     if(cursor[0].hrsworkedms != null)
			   weeklyHoursms += cursor[0].hrsworkedms;
		}
		return weeklyHoursms;
	},
	findDaysWorkedInLastWeekOfPreviousMonth:  function (userid, date)
	{
	//	debugger;
		var counter = 0;

		while(date.getDay() != 1) {// monday
		  date.setDate(date.getDate() - 1);
		  // var cursor = Meteor.call('getTiming', userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		   var cursor = Meteor.myFunctions.getTiming(userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		
 		  if(cursor.length >0) 
		     if(cursor[0].hrsworked != "")
			   counter++;
		}
		return counter;
	},
	getUserName :function(userid) 
	{
		return Meteor.users.find({ _id: userid }, { username:1 }).fetch();
	},
}

Meteor.methods({	
	saveTiming(userid, username, date, month, year, In, Out, hrsworkedms, hrsworked, Break, Remarks)
	{
	  var tid = Timing.insert({ userid: userid, username: username, 
				day: date, month: month, year:year, in: In, out:Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break, remarks:Remarks});

	  var rec = Timing.find({ _id: tid });
	  TimingHistory.insert({ timingid: tid, byuser: username, date: new Date(), in: In, out: Out, remarks: Remarks, breakTaken: Break});
	},
	updateTiming(recordid, username, date, month, year, In, Out, hrsworkedms, hrsworked, Break, Remarks)
	{
		Timing.update(recordid, { // this.id is from getdaysinparticularmonth loop
		    $set: {in: In, out: Out, hrsworkedms:hrsworkedms, hrsworked: hrsworked, breakTaken: Break, remarks:Remarks} });
		TimingHistory.insert({ timingid: recordid,  byuser:username, date: new Date(), in: In, out: Out, remarks: Remarks, breakTaken: Break});
	}

	 //}
});