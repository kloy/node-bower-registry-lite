# Bower registry

NodeJS version of twitter's [bower registry](https://github.com/bower/registry).
This implementation is different from others as it has no database requirement.
A easy to setup alternative to the other registries out there was needed for
installing in corporate environment.

## Running

`npm install && node index.js`

## Create package

    curl http://bower.heroku.com/packages -v -F 'name=jquery' -F 'url=git://github.com/jquery/jquery.git'

## Find package

    curl http://bower.heroku.com/packages/jquery
      {"name":"jquery","url":"git://github.com/jquery/jquery.git"}

## License

Copyright 2012 Twitter, Inc.

Licensed under the MIT License