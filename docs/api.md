DX.Api
======

The DNAnexus API library allows you to create an authenticated session and make API calls on the user's behalf. This library provides a
basic API entry point, and manages requests using a jQuery deferred object.

Making a request
----------------

To create an API object instance, all you need is an access token. This is a token which provides access to the DNAnexus platform on behalf of
a user. See [API-Tokens](https://wiki.dnanexus.com/UI/API-Tokens) for more information on how to create a token in using the DNAnexus
platform. Additionally visit [Authentication](https://wiki.dnanexus.com/API-Specification-v1.0.0/Authentication) for detailed information on authenticating with DNAnexus.

See our [API Documentation](https://wiki.dnanexus.com/API-Specification-v1.0.0/Introduction) to learn more about making API calls to the DNAnexus platform.

Dependencies
------------

* [jQuery](http://jquery.com/) - Any relatively recent version will do. Required features are `$.ajax` and `$.Deferred`

DX.Api Documentation
--------------------

```javascript
  /*
   * Constructs a new DNAnexus API instance
   *
   * authToken: A DNAnexus Authentication token.  See
                https://wiki.dnanexus.com/API-Specification-v1.0.0/Authentication
   * options: An object literal, with additional options for the API binding. [OPTIONAL]
   *   apiServer: The DNAnexus API end point to use. Default: "api.dnanexus.com"
   *   maxAJAXTrials: The number of times to retry a failed AJAX request. Default: 5
   *
   * Returns a new DX.Api object
   */
  constructor: function(authToken, options)

  /*
   * Performs an API call - See https://wiki.dnanexus.com/API-Specification-v1.0.0/Introduction
   * for available API methods
   *
   * subject: The subject, e.g. "user-bob", "system", etc.
   * method: The action to take on the subject, e.g. "describe", "search", etc.
   * input: An object literal with the input for the API call. [OPTIONAL]
   * options: Additional options for the API call. Not used at time time. [OPTIONAL]
   *
   * Returns a deferred object which will be resolved with the results upon success, or rejected
   * with the error if an error occurs. The deferred object also has an "abort" method which
   * will abort the AJAX call.
   */
  call: function(subject, method, input, options)
```

Usage example
-----------

```html
<html>
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
    <script src="dnanexus-[LATEST].js"></script>
  </head>
  <body>
    <script>
      var api = new DX.Api("AUTH_TOKEN_GOES_HERE");
      api.call("user-bob", "describe").done(function(userData) {
        alert("user-bob's full name is " + [userData.first, userData.last].join(" "));
      });
    </script>
  </body>
</html>
```
