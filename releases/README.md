# DNAnexus.js Changelog #

All releases are backward compatible unless noted otherwise.

## v0.0.9 (2015/03/17) ##
- Passing the server error object through when 503 status codes are received

## v0.0.8 (2015/01/06) ##
- Fixing a rare condition where an AJAX request is automatically converted from POST to GET by jquery

## v0.0.7 (2014/12/18) ##
- Addressing an issue where canceling large uploads in Firefox would exhaust the call stack.
- Fixing examples so that the script included in each example directory matches the script reference in code
- Adding minified versions of the libraries with the distribution

## v0.0.6 (2014/12/03) ##
Removing reference to functions provided by Underscore.js; Underscore is no longer a dependency.

## v0.0.5 (2014/11/17) ##
 Implementing readBytes, and preventing upload of folders.

## v0.0.4 (2014/10/14) ##
 Extracting ajaxRequest into a top level resource. *This release introduced an undocumented dependency on Underscore.js*

## v0.0.3 (2014/10/03) ##
 Minor fixes and enhancements.

 - Fixed a bug that prevented uploading 0 byte files
 - Using a ResourcePool to manage file creation, making uploading of a large number of files more efficient

## v0.0.2 (2014/09/30) ##
 Several bug fixes, optimizations, and a couple new features. Backward compatible with 0.0.1.

 - Extending window.DX if it already exists, to prevent clobbering it
 - Fixing a major bug in the DX.Upload constructor with the access of the authToken
 - Applying AWS max parts constraint
 - Tracking and handling the aborted state, preventing unnecessary md5 computation and ajax requests
 - Terminating MD5Worker objects on DX.Upload.destroy
 - Rejecting the upload progress monitor when an upload is aborted
 - Adding support for tags/properties on a per file basis. See the DX.Upload documentation.
 - Fixing the checksum progress monitor notifications to be more accurate
 - Adding field "uploadStartedAt" to track the time when the first part began uploading. This can be used to accurately measure elasped time

## v0.0.1 (2014/08/04) ##
 - initial release with basic API bindings and file upload support
