var list, add, write, byName, searchName, validate, isUnique, alphabetize,
    express = require('express'),
    app = express(),
    fs = require('fs'),
    _ = require('lodash'),
    log = require('winston'),
    store = './store.json';

alphabetize = function (packages) { return _.sortBy(packages, 'name'); };

isUnique = function (package, packages) {

  var unique = true;

  packages.forEach(function (iPackage) {

    if (iPackage.name === package.name || iPackage.url === package.url) {
      unique = false;
    }
  });

  return unique;
};

hasValidationError = function (package) {

  var urlMatches;

  if (_.isUndefined(package.name) || _.isUndefined(package.url)) {
    return 'property missing';
  }

  urlMatches = /^git:\/\//.test(package.url);

  if (!urlMatches) {
    return 'url is not correct format';
  }

  return false;
};

// Write contents to store
write = function (contents, fn) {

  var handler = function (err, data) {

    fn(err);
  };

  fs.writeFile(store, JSON.stringify(contents), handler);
};

// List all packages
// Todo, sort alphabetically
list = function (fn) {

  fs.readFile(store, function (err, data) {

    if (err) { fn(err); }
    else { fn(err, alphabetize(JSON.parse(data))); }
  });
};

// Fetch package by name
// Todo, sort alphabetically
byName = function (name, fn) {

  var listFn = function (err, packages) {

    var package;

    if (err) { fn(err); }
    else {

      package = _.filter(packages, { 'name': name });

      if (package.length) { fn(false, package[0]); }
      else { fn('package not found'); }
    }
  };

  list(listFn);
};

// Fetch packages like name
searchName = function (name, fn) {

  var listFn = function (err, packages) {

    var matches;

    if (err) { fn(err); }
    else {

      matches = _.filter(packages, function (package) {

        return package.name.toLowerCase().indexOf(name) !== -1;
      });

      fn(false, matches);
    }
  };

  name = name.toLowerCase();
  list(listFn);
};

// Add package to store
add = function (package, fn) {

  var listFn, writeFn, validationFailed;

  listFn = function (err, packages) {

    if (err) { fn(err); }
    else {
      validationFailed = hasValidationError(package);
      if (validationFailed) { fn(validationFailed); }
      else if (!isUnique(package, packages)) { fn('package not unique'); }
      else {
        packages.push(package);
        write(packages, fn);
      }
    }
  };

  list(listFn);
};

app.use(express.bodyParser());

// get /packages
app.get('/packages', function (req, res) {

  var fn = function (err, data) {

    if (err) {
      log.error(err);
      res.send(500);
    } else {
      res.json(JSON.stringify(data));
    }
  };

  list(fn);
});

// post /packages
// TODO add validation to inputs. 400 for validation fail.
// 406 for store fail.
app.post('/packages', function (req, res) {

  var data, fn;

  data = {
    name: req.param('name', undefined),
    url: req.param('url', undefined)
  };

  fn = function (err) {

    if (err == 'url is not correct format') {
      log.error(err);
      res.send(400);
    } else if ('property missing') {
      log.error(err);
      res.send(400);
    } else if (err == 'package not unique') {
      log.error(err);
      res.send(406);
    } else if (err) {
      log.error(err);
      res.send(500);
    } else {
      res.send(201);
    }
  };

  add(data, fn);
});

// get /packages/:name
app.get('/packages/:name', function (req, res) {

  var fn = function (err, package) {

    if (err && err == 'package not found') {
      log.info(err);
      res.send(404);
    } else if (err) {
      log.error(err);
      res.json(500);
    } else {

      res.json(JSON.stringify(package));
    }

  };

  var name = req.param('name');

  byName(name, fn);
});

// get /packages/search/:name
app.get('/packages/search/:name', function (req, res) {

  var fn = function (err, packages) {

    if (err) {
      log.error(err);
      res.send(500);
    } else {
      res.json(JSON.stringify(packages));
    }
  };

  var name = req.param('name');

  searchName(name, fn);
});

app.listen(3000);