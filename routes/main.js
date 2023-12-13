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
        //res.send("You searched for: " + req.sanitize(req.query.keyword));

        let sqlquery = "SELECT * FROM users WHERE username LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableUsers:result});
            console.log(newData)
            res.render("friend-request.ejs", newData)
         });
        };         
    });

    app.get('/friend-request/:keyword', function(req, res) {
      if (!req.session.userId ) {
        res.send('you need to login. <a href='+'../login'+'>login</a>');
        } 
        else{  // Get the keyword parameter from the URL
          let keyword = req.sanitize(req.params.keyword);
          let sqlquery = "INSERT INTO friends (sender,receiver,message) VALUES (?,?,?)";
          // execute sql query
          let newrecord = [req.session.userId, keyword,'sent'];
          db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
              console.error(err.message);
              res.send('The user may already be added');
            }
                res.send('Your request to, ' + keyword+ ' has been sent ' + '<a href='+'../chat-list'+'>Go back?</a>');

            });
        }  
    });

    app.get('/requests', function(req, res) {
      if (!req.session.userId) {
          res.send('You need to login. <a href="./login">Login</a>');
      } else {
          let sanitizedUsername = req.sanitize(req.session.userId);
          let sqlquery = `
              SELECT DISTINCT username
              FROM (
                  SELECT receiver AS username
                  FROM friends
                  WHERE sender = ? AND receiver != ?
                  UNION
                  SELECT sender AS username
                  FROM friends
                  WHERE receiver = ? AND sender != ?
              ) AS friendsUsers;
          `;
          // execute sql query
          db.query(sqlquery, [sanitizedUsername, sanitizedUsername, sanitizedUsername, sanitizedUsername], (err, result) => {
              if (err) {
                  res.redirect('./');
              }
              let newData = Object.assign({}, shopData, { availableUsers: result });
              console.log(newData);
              console.log(sqlquery);
              res.render("requests.ejs", newData);
          });
        }
    });

    app.get('/friends-list', function(req, res) {
      if (!req.session.userId) {
          res.send('You need to login. <a href="./login">Login</a>');
      } else {
          let sanitizedUsername = req.sanitize(req.session.userId);
          
          let sqlquery = `
              SELECT DISTINCT username
              FROM (
                  SELECT receiver AS username
                  FROM friends
                  WHERE sender = ? AND receiver IN (SELECT sender FROM friends WHERE receiver = ?)
                  UNION
                  SELECT sender AS username
                  FROM friends
                  WHERE receiver = ? AND sender IN (SELECT receiver FROM friends WHERE sender = ?)
              ) AS mutualFriendsUsers;
          `;
  
          // execute sql query
          db.query(sqlquery, [sanitizedUsername, sanitizedUsername, sanitizedUsername, sanitizedUsername], (err, result) => {
              if (err) {
                  res.redirect('./');
              }
              let newData = Object.assign({}, shopData, { availableUsers: result });
              console.log(newData);
              console.log(sqlquery);
              res.render("friends-list.ejs", newData);
          });
        }
    });
    
    app.get('/group',function(req,res){
      if (!req.session.userId ) {
        res.send('you need to login. <a href='+'./login'+'>login</a>');
        } 
        else{
          res.render("add-to-group.ejs", shopData);
        }
    }); 
    
    app.post('/group-add', function(req, res) {
      if (!req.session.userId) {
        return res.send('You need to login. <a href="./login">Login</a>');
      }
    
      const admin = req.sanitize(req.session.userId);
      const userToAdd = req.sanitize(req.body.username);
    
      // Generate a unique group name, you might use a more sophisticated method in production
      const groupName = `group_${Date.now()}`;
    
      // Create the group table
      const createTableQuery = `
        CREATE TABLE ${groupName} (
          admin VARCHAR(20),
          users VARCHAR(20),
          message TEXT DEFAULT NULL,
          url VARCHAR(255) DEFAULT NULL,
          title VARCHAR(255) DEFAULT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          timestamp_formatted VARCHAR(19) GENERATED ALWAYS AS (DATE_FORMAT(timestamp, '%d-%m-%Y %H:%i')) STORED,
          FOREIGN KEY (admin) REFERENCES users(username),
          FOREIGN KEY (users) REFERENCES users(username)
        )
      `;
    
      db.query(createTableQuery, (createErr, createResult) => {
        if (createErr) {
          return console.error(createErr.message);
        }
    
        // Insert the user to the group
        const insertQuery = `
          INSERT INTO ${groupName} (admin, users)
          VALUES (?, ?)
        `;
    
        db.query(insertQuery, [admin, userToAdd], (err, result) => {
          if (err) {
            return console.error(err.message);
          }
    
          const outputMessage = `Hello ${admin}, you have added ${userToAdd} to the group. 
            <a href='./chat-list'>See messages</a>`;
          
          res.send(outputMessage);
        });
      });
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
              + ' '+ req.sanitize(req.body.last) +' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email) + 'Your password is: '+ req.sanitize(req.body.password) +' and your hashed password is: '+ req.sanitize(hashedPassword) + '<a href='+'./'+'>Home</a>';
              res.send(result);
              });
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
app.get('/chat',function(req,res){
  if (!req.session.userId ) {
    res.send('you need to login. <a href='+'./login'+'>login</a>');
    } 
    else{
      res.render("chat.ejs", shopData);
    }
}); 

app.post('/chat-send', function(req, res) {
  let sqlquery = "INSERT INTO chat (sender,receiver,message) VALUES (?,?,?)";
    // execute sql query
    let newrecord = [req.session.userId, req.body.username,req.body.message];
    db.query(sqlquery, newrecord, (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      else
      // output sent message
      result = 'Hello '+ req.sanitize(req.session.userId)
      + ' your message to '+ req.sanitize(req.body.username) +' has been sent '+ '<a href='+'./chat-list'+'>See message</a>';
      res.send(result);
    });
});

app.get('/chat-list', function(req, res) {
  if (!req.session.userId ) {
    res.send('you need to login. <a href='+'./login'+'>login</a>');
    } 
    else{
      let sanitizedUsername = req.sanitize(req.session.userId);
      let sqlquery = `
              SELECT DISTINCT username
              FROM (
                  SELECT receiver AS username
                  FROM friends
                  WHERE sender = ? AND receiver IN (SELECT sender FROM friends WHERE receiver = ?)
                  UNION
                  SELECT sender AS username
                  FROM friends
                  WHERE receiver = ? AND sender IN (SELECT receiver FROM friends WHERE sender = ?)
              ) AS mutualFriendsUsers;
          `;      // execute sql query
      db.query(sqlquery, [sanitizedUsername, sanitizedUsername, sanitizedUsername, sanitizedUsername], (err, result) => {
            if (err) {
              res.redirect('./'); 
          }
          let newData = Object.assign({}, shopData, {availableUsers:result});
          console.log(newData)
          console.log(sqlquery)
          res.render("chat-list.ejs", newData)
      });
    }
});

app.get('/chat-message/:keyword', function(req, res) {
  if (!req.session.userId ) {
    res.send('you need to login. <a href='+'../login'+'>login</a>');
    } 
    else{  // Get the keyword parameter from the URL
      let keyword = req.sanitize(req.params.keyword);
      let sqlquery = "SELECT * FROM chat WHERE (sender = '" + req.sanitize(req.session.userId) + "' AND receiver = '" + keyword + "') OR (sender = '" + keyword + "' AND receiver = '"+ req.sanitize(req.session.userId) + "') ORDER BY timestamp;"; // query database to get all the books
        // execute sql query
        console.log(sqlquery);
        db.query(sqlquery, (err, result) => {
            if (err) {
              res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {chatData:result});
            console.log(newData)
            res.render("chat-message.ejs", newData)
        });
    }  
});

app.get('/gif',function(req,res){
  if (!req.session.userId ) {
    res.send('you need to login. <a href='+'./login'+'>login</a>');
    } 
    else{
      res.render("gif.ejs", shopData);
    }
});

app.post('/gif-send', async(req, res) => {
  try {
    const APIKEY = '1344jP0UiEy5Eom8CsVIWryP4JrIg8rp';
    const gif = req.sanitize(req.body.gif);
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${APIKEY}&limit=1&q=${gif}`;

    const response = await fetch(url);
    const content = await response.json();

    const gifData = {
      url: content.data[0].images.downsized.url,
      title: content.data[0].title,
    };

    // Insert into the database
    let sqlquery = "INSERT INTO chat (sender,receiver,url,title) VALUES (?,?,?,?)";
      // execute sql query
      let newrecord = [req.session.userId, req.body.username,content.data[0].images.downsized.url,content.data[0].title];
      db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
          return console.error(err.message);
        }
        else
        // output sent message
        result = 'Hello '+ req.sanitize(req.session.userId)
        + ' your GIF to '+ req.sanitize(req.body.username) +' has been sent '+ '<a href='+'./chat-list'+'>See message</a>';
        res.send(result);
    });
  }catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

}
