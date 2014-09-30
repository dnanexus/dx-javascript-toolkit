# DNAnexus.js Changelog #

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
