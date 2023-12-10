module.exports = function(app, shopData) {
    const { check, validationResult } = require('express-validator');

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
        res.redirect('./login')
        } else { next (); }
      }

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search',function(req,res){
      if (!req.session.userId ) {
        res.send('you need to login. <a href='+'./login'+'>login</a>');
        } 
        else{
          res.render("search.ejs", shopData);
        }
    });
    app.get('/search-result', [check('search-box').isEmpty().withMessage('should not be empty')],function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors);
        res.redirect('./search'); }
      else {
        //searching in the database
        res.send("You searched for: " + req.sanitize(req.query.keyword));

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
        };         
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });                                                                                                 
    app.post('/registered', [check('email').isEmail().withMessage('Not a valid e-mail address')],[check('password').isLength({ min: 8 }).withMessage('password must be more than 8 characters')], [check('confirm').custom((value, { req }) => {
      return value === req.sanitize(req.body.password);
    }).withMessage('password must match confirm password')],function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log(errors)
          res.redirect('./register'); }
        else {
        // Import bcrypt module
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = req.sanitize(req.body.password);

        // Hash the password before storing it in the database
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            // Store hashed password in your database.
            let sqlquery = "INSERT INTO users (username, first_name, last_name, email, hashed_password) VALUES (?,?,?,?,?)";
            // execute sql query
            let newrecord = [req.sanitize(req.body.username), req.sanitize(req.body.first)
              , req.sanitize(req.body.last), req.sanitize(req.body.email), req.sanitize(hashedPassword)];
            db.query(sqlquery, newrecord, (err, result) => {
              if (err) {
                return console.error(err.message);
              }
              else
              // Output the password and hashedPassword in the response
              result = 'Hello '+ req.sanitize(req.body.first)
              + ' '+ req.sanitize(req.body.last) +' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email) + 'Your password is: '+ req.sanitize(req.body.password) +' and your hashed password is: '+ req.sanitize(hashedPassword);
              res.send(result);
              });
          });
        }
    }); 
    app.get('/list', function(req, res) {
      if (!req.session.userId ) {
        res.send('you need to login. <a href='+'./login'+'>login</a>');
        } 
        else{
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
          // execute sql query
          db.query(sqlquery, (err, result) => {
              if (err) {
                  res.redirect('./'); 
              }
              let newData = Object.assign({}, shopData, {availableBooks:result});
              console.log(newData)
              res.render("list.ejs", newData)
          });
        }
    });

    app.get('/addbook', function (req, res) {
      if (!req.session.userId ) {
        res.send('you need to login. <a href='+'./login'+'>login</a>');
        } 
        else{
          res.render('addbook.ejs', shopData);
        }
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

       app.get('/bargainbooks', function(req, res) {
        if (!req.session.userId ) {
          res.send('you need to login. <a href='+'./login'+'>login</a>');
          } 
          else{
            let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });

          }
        
    });       

    // Add a /listusers route and page to display the user details
    app.get('/listusers', function(req, res) {
        let sqlquery = "SELECT username, first_name, last_name, email FROM users"; // query database to get all the users
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableUsers:result});
            console.log(newData)
            res.render("listusers.ejs", newData)
         });
    });

    // Create a new login form and route
    app.get('/login', function(req, res) {
      if (req.session.userId ) {
        res.send('you are already logged in. <a href='+'./'+'>Home</a>');
        } 
        else{
          res.render('login.ejs', shopData);
        }
    });

    // Edit your login route to save the user session when login is successful
app.post('/loggedin', function(req, res) {
    // Compare the form data with the data stored in the database
    let sqlquery = "SELECT hashed_password FROM users WHERE username = ?"; // query database to get the hashed password for the user
    // execute sql query
    let username = req.sanitize(req.body.username);
    db.query(sqlquery, username, (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      else if (result.length == 0) {
        // No user found with that username
        res.send('Invalid username or password');
      }
      else {
        // User found, compare the passwords
        let hashedPassword = result[0].hashed_password;
        const bcrypt = require('bcrypt');
        bcrypt.compare(req.sanitize(req.body.password), hashedPassword, function(err, result) {
          if (err) {
            // Handle error
            return console.error(err.message);
          }
          else if (result == true) {
            // Passwords match, login successful
            // Save user session here, when login is successful
            req.session.userId = req.sanitize(req.body.username);
            res.send('Welcome, ' + req.sanitize(req.body.username) + '!' + '<a href='+'./'+'>Home</a>');
          }
          else {
            // Passwords do not match, login failed
            res.send('Invalid username or password');
          }
        });
      }
    });
  });
  
  // Add a logout route to your main.js file
  app.get('/logout', redirectLogin, (req,res) => {
    req.session.destroy(err => {
      if (err) {
        return res.redirect('./')
      }
      res.send('you are now logged out. <a href='+'./'+'>Home</a>');
    })
  })


  app.get('/deleteuser', function (req,res) {
    if (!req.session.userId ) {
      res.send('you need to login. <a href='+'./login'+'>login</a>');
      } 
      else{
      res.render('deleteuser.ejs', shopData); 
      }                                                                    
});                        

app.post('/deleteduser', redirectLogin,function(req, res) {
  // Compare the form data with the data stored in the database
  let sqlquery = "SELECT hashed_password FROM users WHERE username = ?"; // query database to get the hashed password for the user
  // execute sql query
  let username = req.body.username;
  db.query(sqlquery, username, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    else if (result.length == 0) {
      // No user found with that username
      res.send('Invalid username or password');
    }
    else {
      // User found, compare the passwords
      let hashedPassword = result[0].hashed_password;
      const bcrypt = require('bcrypt');
      bcrypt.compare(req.sanitize(req.body.password), hashedPassword, function(err, result) {
        if (err) {
          // Handle error
          return console.error(err.message);
        }
        else if (result == true) {
          req.session.destroy(err => {
            if (err) {
              return res.redirect('./')
            }
            let sqlquery = "DELETE FROM users WHERE username = ?";
            // execute sql query
            let usernameToRemove = req.sanitize(req.body.username); 
            db.query(sqlquery, [usernameToRemove], (err, result) => {
              if (err) {
                return console.error(err.message);
              } else {
                res.send('User removed from the database, username: ' + usernameToRemove +'./'+'>Home</a>');
              }
            });
          });
        }
        else {
          // Passwords do not match, login failed
          res.send('Invalid username or password');
        }
      });
    }
  });
});

app.get('/weather',function(req,res){
  res.render('weather.ejs', shopData);
});

app.post('/weatherpost',function(req,res){
  const request = require('request');
  let apiKey = 'ecfc6e660587d658a47319efa5cc69ed';
  let city = req.sanitize(req.body.city);
  let url =
  `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
  request(url, function (err, response, body) {
    if(err){
      console.log('error:', error);
    } else {
      //res.send(body);
      if (weather!==undefined && weather.main!==undefined) {
        var weather = JSON.parse(body)
        var wmsg = 'It is '+ weather.main.temp + 
          ' degrees in '+ weather.name +
          '! <br> The humidity now is: ' + 
          weather.main.humidity + '<br> The wind speeds are: ' + 
          weather.wind.speed;
        res.send (wmsg);
      }
      else{
        res.send ("No data found");
      } 
    }
  });
});

app.get('/api', function (req,res) {
  // Query database to get all the books
 let sqlquery = "SELECT * FROM books"; 
 // Execute the sql query
 db.query(sqlquery, (err, result) => {
 if (err) {
 res.redirect('./');
 }
 // Return results as a JSON object
 res.json(result); 
 });
 });
 

app.get('/api/:keyword', function (req, res) {
  // Get the keyword parameter from the URL
  let keyword = req.params.keyword;
  // Declare the SQL query variable
  let sqlquery;
  // Check if the keyword parameter is defined or not
  if (keyword) {
    // If it is defined, use a SQL query that filters the books by the keyword in the title
    sqlquery = "SELECT * FROM books WHERE name LIKE '%" + keyword + "%'";
  
  } else {
    res.redirect('./api');
  }
  // Execute the SQL query
  db.query(sqlquery, (err, result) => {
    if (err) {
      res.redirect('./');
    }
    // Return the results as a JSON object
    res.json(result);
  });
});

app.get('/tvapi',function(req,res){
  if (!req.session.userId ) {
    res.send('you need to login. <a href='+'./login'+'>login</a>');
    } 
    else{
      res.render("tvapi.ejs", shopData);
    }
});

app.get('/tvshows-result',function(req,res){
  const request = require('request');
  let keyword = req.sanitize(req.query.keyword);
  let url =
  `https://api.tvmaze.com/search/shows?q=${keyword}`
  request(url, function (err, response, body) {
    if (err) {
      console.log('error:', err);
    } else {
      if (body !== undefined) {
        var show = JSON.parse(body);
        // Pass the parsed JSON data to the EJS file for rendering
        let newData = Object.assign({}, shopData, { showData: show });
        console.log(newData)
        res.render('tvshows-result.ejs', newData);
      }
      else{
        res.send ("No data found");
      } 
    }
  });
});

 
 
}

