import '../meteors.js';

// not compiling without MEteor.func syntax
Meteor.myFunctions  =  {
	getRegisteredUsers()
	{
  	     return Meteor.users.find({ 'username' : { $ne : 'admin'}},{ username:1 }).fetch();
	},
	
	getTiming :function(user, day, month,  year) 
	{
		return Timing.find({ userid: user ,day:day, month: month, year: year}).fetch();
	},

	findPreviousMonthsHrsWorked:  function (userid, date)
	{
	//	debugger;
		var weeklyHoursms = 0;

		while(date.getDay() != 1) {// monday
		  date.setDate(date.getDate() - 1);
		   var cursor = Meteor.myFunctions.getTiming( userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		
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
		   var cursor = Meteor.myFunctions.getTiming( userid, date.getDate(), date.getMonth()+1, date.getFullYear());
		
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