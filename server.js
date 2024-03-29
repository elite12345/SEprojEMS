const express = require('express');
const mysql = require('mysql');
const http = require('http');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
//const session = require('express-session');
//const popup=require('popups');
const app = express();

const sessiion = require('express-session')
const flush = require('connect-flash')

//Google auth
//check lokesh
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '183043165157-m5ul62le4e9n124kmkaekj7mu29ee1k9.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);

//middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(sessiion({
	secret: 'secret',
	cookie: {maxage: 60000},
	resave: false,
	saveUninitialized: false
}))
app.use(flush());

//to send mail
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'noreplyems1@gmail.com',
		pass: 'iamgroot'
	}
});


//connecting to database
const db = mysql.createConnection({
	host: 'se-database.cyraaxcsws1y.us-east-1.rds.amazonaws.com',
	user: 'admin',
	password: 'rootroot',
	insecureAuth: true,
	database: 'mydb',
	multipleStatements: true
})

db.connect(err => {
	if (err) {
		console.error('Database connection error: ' + err.stack);
		return;
	}
	console.log('Database Connected');
})

var temp_studmail = '';

app.post('/otp', (req, res) => {
	var mail = req.body.mail;
	var pwd = req.body.pwd;
	var role = req.body.role;
	var inotp = req.body.inotp;
	var otp = req.body.otp;

	if (inotp == otp) {
		console.log('Signup successful');
		if (role.toString() == "student") {
			var sql = "INSERT INTO student_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');
				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Student account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})

			});
			res.render('login');
		}
		else if (role.toString() == "faculty") {
			var sql = "INSERT INTO faculty_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');

				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Faculty account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})
			});
			res.render('login');
		}
		else {
			var sql = "INSERT INTO coord_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');

				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Coordinator account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})
			});
			res.render('login');
		}
	}
	else {
		console.log('Signup Failed');
		res.render('login');
	}
})

app.post('/googlesignin', (req, res) => {
	let token = req.body.token;
	async function verify() {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID,
		});
		const payload = ticket.getPayload();
		const userid = payload['sub'];
	}
	verify()
		.then(() => {
			res.cookie('session-token', token);
			res.send('success')
		})
		.catch(console.error);

})

app.get('/pwdchange', (request, response) => {
	response.render("forgotpwd");
})

let num = 0; //forgotpwd otp
app.post('/fpwd', (request, response) => {
	var mail = request.body.email;
	var password = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;

	num = Math.floor(
		Math.random() * (9999 - 1000) + 1000
	);

	num = num.toString();

	var mailOptions = {
		from: 'noreplyems1@gmail.com',
		to: mail + '',
		subject: 'OTP for Password change',
		text: num + ''
	}

	transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log(err);
		}
		else {
			console.log('email sent' + info.response);
		}
	})
})

app.post('/otppwd', (request, response) => {
	var otp = request.body.otp;
	if (otp == num) {
		response.send('Password changed successfully');
	}
	else {
		response.send('Sorry OTP is Wrong');
	}
})

app.get('/signupform', (request, response) => {
	response.render("signup");
})

app.post('/login_student', (request, response) => {
	var mail = request.body.email;
	temp_studmail = mail;
	var pwd = request.body.password;

	var flag = 0;
	var sql = "SELECT * FROM student_login";

	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in accessing database', err);
			return;
		}

		for (i = 0; i < result.length; i++) {
			if (result[i].student_email == mail && result[i].student_password == pwd) {
				flag = 1;
				break;
			}
		}

		if (flag == 1) {
			response.render("stud_dash", {mailid : mail});
		}
		else {
			response.render("login");
			console.log("Login Failed");
			return;
		}

	});
})
var temp_coord_email;

app.post('/login_others', (request, response) => {
	var mail = request.body.email;
	
	var pwd = request.body.password;
	var role = request.body.role;

	var flag = 0;

	if (role.toString() == "faculty") {
		var sql = "SELECT * FROM faculty_login";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in accessing database', err);
				return;
			}

			for (i = 0; i < result.length; i++) {
				if (result[i].faculty_email == mail && result[i].faculty_password == pwd) {
					flag = 1;
					break;
				}
			}

			if (flag == 1) {
				response.send("Congrats Buddy");
			}
			else {
				response.render("login");
				console.log("Login Failed");
			}
		});
	}
	else {
		var sql = "SELECT * FROM coord_login";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in accessing database', err);
				return;
			}

			for (i = 0; i < result.length; i++) {
				if (result[i].coord_email == mail && result[i].coord_password == pwd) {
					flag = 1;
					break;
				}
			}

			if (flag == 1) {
				response.render("coord_dash");
				temp_coord_email=mail;
			}
			else {
				response.render("login");
				console.log("Login Failed");
			}
		});
	}
})


app.get('/coord_edit', (req, res) => {

	var sql = "SELECT edit_profile FROM coord WHERE coord_email = '" + temp_coord_email + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			if (results.length==0)
			{
				res.render('profile',{name : ' ', dob : ' ', mobile : ' ', k:'0', Age:' ' , City:' ' , State : ' ', message : req.flash('message')});
			}
			else if(results[0].edit_profile==0)
			{
				res.render('profile',{name : ' ', dob : ' ', mobile : ' ', k:'0', Age:' ' , City:' ' , State : ' ', message : req.flash('message')});
			}
			else
			{
				var sql = "SELECT * FROM coord WHERE coord_email = '" + temp_coord_email +"';";
				db.query(sql, (err, results, field) => {
					if (err) 
					{
						console.log(err);
						return;
					}
					else
					{
						var name = results[0].coord_name;
						var dob = results[0].coord_dob;
						// dob = dob + ' ';

						// for (var i=0; i<dob.length; i++)
						// {
						// 	console.log(dob.charAt(i));
						// }

						
						var mobile = results[0].coord_mobileno;
						var k;
						var Age = results[0].coord_age;
						var City = results[0].coord_city;
						var State = results[0].coord_state;
						var mail = results[0].coord_email;
						var gender = results[0].coord_gender;
						var edit_profile=results[0].edit_profile;

						if(gender == 'Male')
						{
							k='1';
						}
						else if(gender=='Female')
						{
							k='2';
						}
						else
						{
							k='3';
						}
						res.render('profile',{name : name, dob : dob, mobile : mobile, k : k, Age : Age, City : City , State : State, message : req.flash('message')});
					}
			
				});
			}
		}

	});
})

app.post('/coord_save', (req, res) => {
	var name = req.body.name;
	var dob = req.body.dob;
	var mobile = req.body.mobile;
	var k = req.body.Gender;
	var Age = req.body.Age;
	var City = req.body.City;
	var State = req.body.State;
	var mail = temp_coord_email;
	var gender;
	var edit_profile=1

	if(k == '1')
	{
		gender = 'Male';
	}
	else if (k == '2')
	{
		gender = 'Female';
	}
	else
	{
		gender = 'Others';
	}

	var sql="Select * from coord where coord_email='"+temp_coord_email+"';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length > 0)
			{
				var sql="update coord set coord_name = '"+ name +"',"+"coord_dob = '"+ dob + "'," + "coord_age = '" + Age + "', coord_mobileno = '" + mobile + "'," + "coord_gender = '" + gender + "'," + "coord_city ='"+ City + "'," + "coord_state ='"+ State + "';";
				db.query(sql, (err, results, field) => {
					if (err) 
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Elective added successfully');
						req.flash('message', 'Profile Details Updated Successfully');
						res.redirect('/coord_edit');
					}
			
				});
			}
			else
			{
				var sql="insert into coord values('"+ name +"','"+ dob +"',"+ Age +",'"+ mail +"','"+ mobile +"','"+ gender +"','"+ City +"','"+ State +"'," + edit_profile + ");";
				db.query(sql, (err, results, field) => {
					if (err) 
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Inserted Successfully');
						//req.flash('name', name);
						req.flash('message', 'Profile Details Saved Successfully');
						res.redirect('/coord_edit');
						//res.redirect('/?valid=' + string)
					}
			
				});
			}
		}

	});


})



app.get('/coord_add', (req, res) => {
	res.render('coord_add', {message : req.flash('message')});
})
 
app.post('/addelective', (request, response) => {
	var elective_name = request.body.elective_name;
	var elective_sem = request.body.elective_sem;
	var elective_dept = request.body.elective_dept;
	var credits = request.body.credits;
	var capacity = request.body.capacity;
	var sent_students=0;
	var sent_faculties=0;

	var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else {
			if (result.length != 0) {
				console.log('Elective already inserted cannot insert');
				request.flash('message', 'Elective already inserted, try adding a new one');
				response.redirect('/coord_add');
			}
			else {
				var sql = "INSERT INTO elective(elective_name,elective_sem,elective_dept,credits,capacity,sent_students,sent_faculties) VALUES ('" + elective_name + "'," + elective_sem + ",'" + elective_dept + "'," + credits + "," + capacity + "," + sent_students + "," + sent_faculties + ")";
				db.query(sql, (err, result, field) => {
					if (err) {
						console.log(err);
						return;
					}
					console.log('Elective added successfully');
					request.flash('message', 'Saved succesfully');
					response.redirect('/coord_add');
				});

			}
		}
	});


})

app.get('/coord_remove', (req, res) => {
	res.render('coord_remove', {message : req.flash('message')});
})

app.post('/remelective', (request, response) => {
	var elective_name = request.body.elective_name;
	var elective_sem = request.body.elective_sem;
	var elective_dept = request.body.elective_dept;

	var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else {
			if (result.length == 0) {
				console.log('No such elective exists');
				request.flash('message', 'No such elective exists');
				response.redirect('/coord_remove');
			}
			else {
				var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
				db.query(sql, (err, result, field) => {
					if (err) 
					{
						console.log(err);
						return;
					}
					else
					{
						var sql = "delete from elective where elective_id=" + result[0].elective_id + ";";
						db.query(sql, (err, result, field) => {
							if (err) {
								console.log(err);
								return;
							}
							console.log('Elective removed successfully');
							request.flash('message', 'Elective removed successfully');
							response.redirect('/coord_remove');
						});
					}

				});

			}
		}
	});


});

app.get('/coord_group', (req, res) => {
	var results=0;
	var sem=0;
	var dept="NOTHING"
	res.render("coord_group.ejs",{results:results, sem : sem, dept : dept, message : req.flash('message')});
	//res.render("coord_group.ejs",{results:results,  message : req.flash('message')});
})

app.post('/groupelective', (req, res) => {

	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT * FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			res.render("coord_group.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message')});
		}

	});
})


app.post('/sendstudents' , (req, res) => {


	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT sent_students FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';"; 
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			var i;
			for (i = 0; i < results.length; i++) 
			{
			  	if (results[i].sent_students==0)
			  	{
					var sql = "UPDATE elective SET sent_students = 1 WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
					db.query(sql, (err, results, field) => {
						if (err) 
						{
							console.log(err);
							return;
						}
						else
						{
							console.log('Updated Successfully');
							req.flash('message', 'Electives are displayed in Student Portal');
							req.flash('sem', sem)
							req.flash('dept', dept)
							res.redirect(307, '/groupelective');
							//res.render("coord_group.ejs",{results:results, temp_sem:results[0].elective_sem, temp_dept:results[0].elective_dept});
						}
				
					});	
					break;
			  	}
			}
			if (i==results.length)
			{
				req.flash('message', 'Electives are already displayed in Student Portal');
				req.flash('sem', sem)
				req.flash('dept', dept)
				res.redirect(307, '/groupelective');
			}
		}

	});

})


app.post('/sendfaculties' , (req, res) => {


	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT sent_faculties FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';"; 
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			var i;
			for (i = 0; i < results.length; i++) 
			{
			  	if (results[i].sent_faculties==0)
			  	{
					var sql = "UPDATE elective SET sent_faculties = 1 WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
					db.query(sql, (err, results, field) => {
						if (err) 
						{
							console.log(err);
							return;
						}
						else
						{
							console.log('Updated Successfully');
							req.flash('message', 'Electives are displayed in Faculty Portal');
							req.flash('sem', sem)
							req.flash('dept', dept)
							res.redirect(307, '/groupelective');
							//res.render("coord_group.ejs",{results:results, temp_sem:results[0].elective_sem, temp_dept:results[0].elective_dept});
						}
				
					});	
					break;
			  	}
			}
			if (i==results.length)
			{
				req.flash('message', 'Electives are already displayed in Faculty Portal');
				req.flash('sem', sem)
				req.flash('dept', dept)
				res.redirect(307, '/groupelective');
			}
		}

	});

})

app.get('/stud_view', (req, res) => {
	
	var sql = "SELECT roll_no FROM student WHERE student_email = '" + temp_studmail + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			var roll_no=results[0].roll_no;
			var sql = "SELECT * FROM elective WHERE elective_id IN (SELECT elective_id FROM elec_pref WHERE roll_no = '" + roll_no + "');";
			db.query(sql, (err, results, field) => {
				if (err) 
				{
					console.log(err);
					return;
				}
				else
				{	
					res.render("view_pref.ejs",{results:results});
				}
			});
		}
	});
})

app.get('/stud_choose', (req, res) => {

	var sql = "SELECT preference_given FROM student WHERE student_email = '" + temp_studmail + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			if(results[0].preference_given==1){
				res.render("choosepref_done.ejs");
			}
			else{
				var sql = "SELECT student_sem,student_dept FROM student WHERE student_email = '" + temp_studmail + "';";
				db.query(sql, (err, results, field) => {
					if (err) 
					{
						console.log(err);
						return;
					}
					else
					{
						var sem=results[0].student_sem;
						var dept=results[0].student_dept;
						var sql = "SELECT elective_id,elective_name FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
						db.query(sql, (err, results, field) => {
							if (err) 
							{
								console.log(err);
								return;
							}
							else
							{
								res.render("choose_pref.ejs",{results:results});
							}
						});
					}
				});
			}
		}
	});
})

app.post('/chooseelective', (req, res) => {

	var roll_no=''
	var sql = "SELECT roll_no FROM student WHERE student_email = '" + temp_studmail + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			roll_no=results[0].roll_no;
		}
	});
	
	var sql = "SELECT student_sem,student_dept FROM student WHERE student_email = '" + temp_studmail + "';";
	db.query(sql, (err, results, field) => {
		if (err) 
		{
			console.log(err);
			return;
		}
		else
		{
			var sem=results[0].student_sem;
			var dept=results[0].student_dept;
			var sql = "SELECT elective_id,elective_name FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
			db.query(sql, (err, results, field) => {
				if (err) 
				{
					console.log(err);
					return;
				}
				else
				{
					var i;
					let pref=[]
					for (i = 0; i < results.length; i++) {
						var elec=results[i].elective_id;
						pref[i]=req.body[elec];

						var sql = "INSERT INTO elec_pref VALUES('" + roll_no + "'," + elec + "," + pref[i] + ");";
						db.query(sql, (err, results, field) => {
							if (err) 
							{
								console.log(err);
								return;
							}
							else
							{
								console.log("inserted successfully");
							}
						});

					}	

					var sql = "Select pref from elec_pref where roll_no = '"+ roll_no + "';";
					db.query(sql, (err, results, field) => {
						if (err) 
						{
							console.log(err);
							return;
						}
						else
						{
							var flag=0;
							var i;
							var j;
							for (i=0;i<results.length;i++)
							{
								for(j=i+1;j<results.length;j++)
								{
									if(results[i].pref==results[j].pref)
									{
										flag=1;
										break;
									}
								}
								if(flag==1)
								{
									break;
								}
							}

							if(flag==1)
							{
								var sql = "DELETE FROM elec_pref where roll_no = '"+roll_no+"';";
								db.query(sql, (err, results, field) => {
									if (err) 
									{
										console.log(err);
										return;
									}
									else
									{
										res.redirect('/stud_choose');
									}
								});
							}
							else
							{
								var sql = "UPDATE student SET preference_given=1 where roll_no = '"+roll_no+"';";
								db.query(sql, (err, results, field) => {
									if (err) 
									{
										console.log(err);
										return;
									}
									else
									{
										res.render("choosepref_done.ejs");
									}
								});
							}
						}
					});

				}
			});
		}
	});
})

app.get('/stud_profile', (req, res) => {
	res.send("GET method");
})


app.get('/gdash', checkAuthenticated, (req, res) => {
	let user = req.user;
	temp_studmail = user.email;
	res.render('stud_dash', {mailid : user.email});
})

app.get('/logout', (req, res) => {
	res.clearCookie('session-token');
	res.render('login');
})

function checkAuthenticated(req, res, next) {

	let token = req.cookies['session-token'];

	let user = {};
	async function verify() {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
		});
		const payload = ticket.getPayload();
		user.name = payload.name;
		user.email = payload.email;
		user.picture = payload.picture;
		var sql = "SELECT * FROM student_login WHERE student_email='" + user.email + "' AND student_password='" + payload.sub + "';";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in changing database', err);
				return;
			}
			if(result.length == 0){
				var sql = "INSERT INTO student_login VALUES ('" + user.email + "','" + payload.sub + "')";
				db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				});
			}			
		});
		
		//res.render('login');
	}
	verify()
		.then(() => {
			req.user = user;
			next();
		})
		.catch(err => {
			res.redirect('/login')
		})
}

app.post('/signup', (request, response) => {
	var mail = request.body.email;
	var pwd = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;
	var role = request.body.role;


	var num = Math.floor(
		Math.random() * (9999 - 1000) + 1000
	);
	var num = num.toString();

	var mailOptions = {
		from: 'noreplyems1@gmail.com',
		to: mail + '',
		subject: 'OTP for Signup',
		text: num + ''
	}

	transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log(err);
		}
		else {
			console.log('email sent' + info.response);
		}
	})

	response.render('otp', { role: role, otp: num, mail: mail, pwd: pwd });
})


app.get('/', (req, res) => {
	res.render('login');
	//res.send("Hi");
})

app.listen(5050, () => {
	console.log("Server listening");
})
