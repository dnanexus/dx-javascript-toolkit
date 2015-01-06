!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b){var c;c=function(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r;null==b&&(b={}),null==c&&(c=0),n=$.Deferred(),h=null!=(p=b.headers)?p:{},f=b.data,j=null!=(q=b.method)?q:"POST",d=b.ajaxDelay,i=null!=(r=b.maxRetries)?r:5,l=null,o=[200,202,206],null!=f&&"object"==typeof f&&b.skipConversion!==!0&&(h["Content-Type"]="application/json",f=JSON.stringify(f)),m=function(a){return null!=d?setTimeout(function(){return n.resolve(a)},d):n.resolve(a)},k=function(a){var b,c;return null!=d?setTimeout(function(){return n.reject(a)},d):n.reject(a),n.reject({type:"AjaxError",details:{jqXHR:null!=(b=null!=(c=a.details)?c.jqXHR:void 0)?b:{}}})};try{e={url:a,headers:h,type:j,data:f,success:function(a){return m(a)},error:function(d,e,f){var g,h,j,l;if(503===d.status)return j=parseInt(d.getResponseHeader("Retry-After"),10),null!=j&&isFinite(j)&&j>0||(j=60),k({type:"AjaxRetryTimeout",details:{delay:j}}),setTimeout(function(){return DX.ajaxRequest(a,b,c).then(n.resolve,n.reject,n.notify)},1e3*j);if("error"===e&&0===d.status)return c>i?k({type:"AjaxError",details:{jqXHR:d}}):(c+=1,setTimeout(function(){return DX.ajaxRequest(a,b,c).then(n.resolve,n.reject,n.notify)},1e3*Math.pow(2,c)));if("abort"!==f&&"abort"!==e&&!n.aborted){if(h=null,"timeout"===e)h={type:"AjaxTimeout",details:{url:a}};else if("parsererror"===e)h={type:"AjaxError",details:{data:JSON.stringify(input)}};else try{h=null!=(l=JSON.parse(d.responseText).error)?l:{type:"InvalidErrorResponse"}}catch(m){g=m,h={type:"InvalidErrorResponse",details:g}}return k(h)}}},null!=b.cache&&(e.cache=b.cache),b.withCredentials===!0&&(e.xhrFields={withCredentials:!0}),null!=b.dataType&&(e.dataType=b.dataType),l=$.ajax(e),n.abort=function(){return l.abort()}}catch(s){g=s,console.log("Unknown error during API call",g),null!=l&&null!=l.abort&&l.abort(),k({type:"UnknownError",details:g})}return n},b.exports=c},{}],2:[function(a,b){var c,d,e={}.hasOwnProperty;d=a("./ajax_request.coffee"),c=function(){function a(a,b){var c,d;if(this.authToken=a,null==b&&(b={}),null==this.authToken||0===this.authToken.length)throw new Error("authToken must be specified");this.maxAJAXTrials=null!=(c=b.maxAJAXTrials)?c:5,this.apiServer="https://"+(null!=(d=b.apiServer)?d:"api.dnanexus.com"),this.pendingApiCallKey=0,this.pendingApiCalls={}}return a.prototype.API_ERRORS={MalformedJSON:"The input could not be parsed as JSON",InvalidAuthentication:"The provided OAuth2 token is invalid",PermissionDenied:"Insufficient permissions to perform this action",ResourceNotFound:"A specified entity or resource could not be found",InvalidInput:"The input is syntactically correct (JSON), but semantically incorrect",InvalidState:"The operation is not allowed at this object state",InvalidType:"An object specified in the request is of invalid type",InternalError:"The server encountered an internal error",InvalidErrorResponse:"We've received an error, but cannot process the message",InvalidAPICall:"An invalid api call has occurred",InvalidResponse:"We've received an invalid response from an API call",AjaxError:"There was an error in the way the server request was formed",AjaxTimeout:"The server could not be contacted in a timely fashion"},a.prototype.ALL_ERRORS="AllErrors",a.prototype.call=function(a,b,c,e){var f,g,h,i,j;return null==e&&(e={}),i=$.Deferred(),i.abort=function(){return this.aborted=!0},this.disabled?i:null==a||null==b||"string"!=typeof a||"string"!=typeof b?(console.error("Subject and method must both be defined and must be strings, when calling Nucleus.call",a,b),i.reject()):(null==c&&(c={}),f=this.pendingApiCallKey++,this.pendingApiCalls[f]=i,j=[this.apiServer,a,b].join("/"),g={},g.Authorization="Bearer "+this.authToken,c={headers:g,data:c,maxRetries:this.maxAJAXTrials},e.withCredentials===!0&&(c.withCredentials=!0),h=d(j,c),i.abort=function(){return this.aborted=!0,h.abort()},h.done(function(){return function(a){var b;if(!i.aborted){try{"string"==typeof a&&(a=$.parseJSON(a))}catch(c){return b=c,void i.reject({type:"InvalidResponse"})}return i.resolve(a)}}}(this)).fail(function(){return function(a){return i.reject(a)}}(this)).always(function(a){return function(){return delete a.pendingApiCalls[f]}}(this)),i)},a.prototype.destroy=function(){var a,b,c,d;this.disabled=!0,c=this.pendingApiCalls,d=[];for(a in c)e.call(c,a)&&(b=c[a],d.push(b.abort()));return d},a.prototype.getNumPendingApiCalls=function(){var a,b,c,d;a=0,d=this.pendingApiCalls;for(b in d)e.call(d,b)&&(c=d[b],a++);return a},a.prototype.uploadFilePart=function(a,b,c,d,e){var f,g,h;return f=$.Deferred(),g={"Content-MD5":d},h=this.call(a,"upload",{index:b},e).done(function(a){var b,d,e,i,j;j=a.headers;for(d in j)i=j[d],g[d]=i;return b=$.ajax({url:a.url,contentType:"application/octet-stream",processData:!1,data:c,headers:g,success:function(){return f.resolve(null)},error:function(a,b,c){var d,e;try{return d=JSON.parse(a.responseText).error.type,f.reject(d)}catch(g){return e=g,f.reject(c)}},type:"POST",xhr:function(){var a,b,c;return c=$.ajaxSettings.xhr(),null!=c.upload&&(b=function(a){return a.lengthComputable?f.notify({loaded:a.loaded,total:a.total}):void 0},a=function(){return c.upload.removeEventListener("progress",b),c.upload.removeEventListener("loadend",a)},c.upload.addEventListener("progress",b),c.upload.addEventListener("loadend",a)),c}}),e=h.abort,h.abort=function(){return b.abort(),e.call(h)}}).fail(function(a){return f.reject(a)}),f.abort=function(){return h.abort()},f},a}(),b.exports=c},{"./ajax_request.coffee":1}],3:[function(a,b){var c;c=function(){function a(a){this._resources=a,this.CLIENT_ID_LENGTH=9,this._queue=[],this._closed=!1,this._clientRequests={}}return a.prototype.acquireClientID=function(a){var b;for(null==a&&(a=""),b=null;null==b||null!=this._clientRequests[b];)b=a+Math.round(Math.random()*Math.pow(10,this.CLIENT_ID_LENGTH));return this._clientRequests[b]=[],b},a.prototype.releaseClientID=function(a){var b,c,d,e,f;for(f=null!=(e=this._clientRequests[a])?e:[],c=0,d=f.length;d>c;c++)b=f[c],b.reject();return delete this._clientRequests[a]},a.prototype.acquire=function(a){var b,c;return b=$.Deferred(),this._resources.length>0&&!this._closed?(c=this._resources.shift(),b.resolve(c)):(this._queue.push(b),null!=a&&null!=this._clientRequests[a]&&this._clientRequests[a].push(b)),b},a.prototype.close=function(){return this._closed=!0},a.prototype.getNumberAvailable=function(){return this._closed?0:this._resources.length},a.prototype.release=function(a){var b;if(b=null,!this._closed)for(;this._queue.length>0&&(null==b||"pending"!==b.state());)b=this._queue.shift();return null!=b?b.resolve(a):this._resources.push(a)},a.prototype.open=function(){var a,b,c,d,e;if(this._closed){for(this._closed=!1,d=this._resources,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(this.release(a));return e}},a.prototype.clear=function(){return this._clientRequests={},this._queue=[]},a}(),b.exports=c},{}],4:[function(a){null==window.DX&&(window.DX={}),window.DX.ajaxRequest=a("./ajax_request.coffee"),window.DX.Api=a("./api.coffee"),window.DX.Upload=a("./upload/upload.coffee")},{"./ajax_request.coffee":1,"./api.coffee":2,"./upload/upload.coffee":7}],5:[function(a,b){var c,d,e,f=function(a,b){return function(){return a.apply(b,arguments)}};d=1e4,e=Math.pow(1024,2),c=function(){function a(b,c){var g,h,i,j,k,l;for(this.file=b,null==c&&(c={}),this._onUploadProgress=f(this._onUploadProgress,this),c=$.extend({folder:"/"},c),l=["folder","partSize","fileCreationPool","workerPool","uploadPool","api","projectID"],j=0,k=l.length;k>j;j++){if(i=l[j],null==c[i])throw new Error("Required parameter "+i+" is not specified");this[i]=c[i]}this.partSize=Math.max(Math.ceil(this.file.size/d),this.partSize),this._uploadProgress=$.Deferred(),this._checksumProgress=$.Deferred(),this._closingProgress=$.Deferred(),this._uploadCalls={},this._uploadsDone=0,this._bytesUploaded=0,this._bytesResumed=0,this._aborted=!1,this._closing=!1,this._closed=!1,this.numParts=Math.max(1,Math.ceil(this.file.size/this.partSize)),this.uploadStartedAt=null,this._checksumQueue=[],this._uploadQueue=[],this._parts=[],this._partUploadProgress=[],this._uploadPoolClientID=this.uploadPool.acquireClientID("file_upload_"),this._workerPoolClientID=this.workerPool.acquireClientID("file_worker_"),this.isDirectory=!1,g={folder:this.folder,tags:c.tags,properties:c.properties},this.fileCreationStatus=$.Deferred(),h=function(c){return function(){return c.fileCreationPool.acquire().done(function(d){return a.prototype.findOrCreateFile(b,c.api,c.partSize,c.projectID,g).done(function(a){var b,d,e,f,g,h,i,j;for(b=null!=(h=a.parts)?h:{},c.fileID=a.fileID,d=g=0,i=c.numParts;i>=0?i>g:g>i;d=i>=0?++g:--g)f=c.partSize*d,e={index:d+1,start:f,stop:Math.min(c.file.size,f+c.partSize)},c._parts.push(e),"complete"===(null!=(j=b[d+1])?j.state:void 0)?(c._uploadsDone+=1,c._bytesResumed+=e.stop-e.start):c._checksumQueue.push(e);return c._onUploadProgress(),c.fileCreationStatus.resolve(c.fileID)}).fail(function(a){return c.fileCreationStatus.reject(a)}).always(function(){return c.fileCreationPool.release(d)})})}}(this),this.file.size<1*e?this.readBytes(0,10).done(h).fail(function(a){return function(){var b;return a.isDirectory=!0,b={error:{type:"InvalidType",message:"File is a directory and cannot be uploaded"}},a.fileCreationStatus.reject(b),a._uploadProgress.reject(b),a._checksumProgress.reject(b),a._closingProgress.reject(b)}}(this)):h()}return a.prototype.computeSignature=function(a,b){return[a.size,a.lastModifiedDate.getTime(),0,b,a.name].join(" ")},a.prototype.createFile=function(a,b,c,d,e){var f,g,h;return null==e&&(e={}),g=$.extend(e.properties,{".system-fileSignature":this.computeSignature(a,c)}),f={folder:e.folder,name:a.name,project:d,properties:g},(null!=(h=e.tags)?h.length:void 0)>0&&(f.tags=e.tags),b.call("file","new",f).then(function(a){return{fileID:a.id}})},a.prototype.findOrCreateFile=function(a,b,c,d,e){var f,g,h,i;return null==e&&(e={}),i={"class":"file",state:"open",describe:!0,properties:{".system-fileSignature":this.computeSignature(a,c)},scope:{project:d,folder:e.folder}},f=function(f){return function(){return f.createFile(a,b,c,d,e)}}(this),h=function(a){return 1===a.results.length?{fileID:a.results[0].id,parts:a.results[0].describe.parts}:f()},g=function(){return f()},b.call("system","findDataObjects",i).then(h,g)},a.prototype._computeChecksums=function(){var a,b,c,d;for(c=this._checksumQueue.length,a=0,d=[];this._checksumQueue.length>0;)b=this._checksumQueue.shift(),d.push(function(b){return function(d){return b.workerPool.acquire(b._workerPoolClientID).done(function(e){var f,g,h,i;return b._aborted?void b.workerPool.release(e):(g=null!=(h=null!=(i=b.file.slice)?i:b.file.webkitSlice)?h:b.file.mozSlice,f=g.call(b.file,d.start,d.stop),d.slice=f,e.computeMD5(f).done(function(f){var g;return d.md5=f,b._uploadQueue.push(d),b._doUpload(),b.workerPool.release(e),a+=1,g={partsTotal:c,partsDone:a},c===a?b._checksumProgress.resolve(g):(b._checksumProgress.notify(g),b._computeChecksums())}).fail(function(a){return console.error("Error computing MD5 checksum",a)}))})}}(this)(b));return d},a.prototype._closeFile=function(){var a;if(!(this._closing||this._closed||this._aborted))return this._closing=!0,(a=function(b){return function(){return b.api.call(b.fileID,"describe").done(function(c){var d,e,f,g;f=!0,g=c.parts;for(e in g)if(d=g[e],"complete"!==d.state){f=!1;break}return f?b.api.call(b.fileID,"close").done(function(){return b._closing=!1,b._closed=!0,b._closingProgress.resolve()}):setTimeout(a,1e3)})}}(this))()},a.prototype._onUploadProgress=function(a,b,c){var d,e,f,g,h;null==c&&(c=!1),null!=b&&(this._partUploadProgress[a.index]=b.loaded),d=0,h=this._partUploadProgress;for(e in h)f=h[e],d+=f;return g={bytesTotal:this.file.size,bytesUploaded:this._bytesUploaded+d,bytesDone:this._bytesResumed+this._bytesUploaded+d},c?this._uploadProgress.resolve(g):this._uploadProgress.notify(g)},a.prototype._closeIfDone=function(){return this._uploadsDone===this.numParts&&this._bytesUploaded+this._bytesResumed===this.file.size?(this._closeFile(),this.uploadPool.releaseClientID(this._uploadPoolClientID),this.workerPool.releaseClientID(this._workerPoolClientID),!0):!1},a.prototype._doUpload=function(){return this._closeIfDone()?void 0:this._uploadQueue.length>0?this.uploadPool.acquire(this._uploadPoolClientID).done(function(a){return function(b){var c,d,e,f,g;return 0===a._uploadQueue.length||a._aborted?void a.uploadPool.release(b):(g=a._uploadQueue.shift(),a._partUploadProgress[g.index]=0,a.uploadStartedAt=Date.now(),d=a.api.uploadFilePart(a.fileID,g.index,g.slice,g.md5),a._uploadCalls[g.index]=d,d.progress(function(b){return a._onUploadProgress(g,b)}),e=function(){return delete a._uploadCalls[g.index],null!=b&&(a.uploadPool.release(b),b=null),a._closeIfDone()},c=function(){return a._uploadQueue.unshift(g),a._partUploadProgress[g.index]=0,a._onUploadProgress(g),e()},f=d.abort,d.abort=function(){return f.call(d),c()},d.done(function(){return a._uploadsDone+=1,a._bytesUploaded+=g.stop-g.start,delete a._partUploadProgress[g.index],a._onUploadProgress(g,null,a._uploadsDone===a.numParts)}),d.always(e))}}(this)):void 0},a.prototype.monitorChecksumProgress=function(){return this._checksumProgress.promise()},a.prototype.monitorUploadProgress=function(){return this._uploadProgress.promise()},a.prototype.monitorFileClosingProgress=function(){return this._closingProgress.promise()},a.prototype.abort=function(){var a,b,c;if(this._aborted)return $.Deferred().resolve(this.fileID);if(this._closed)return $.Deferred().reject({reason:"File Closed"});this._aborted=!0,this.uploadPool.releaseClientID(this._uploadPoolClientID),this.workerPool.releaseClientID(this._workerPoolClientID),this._uploadQueue=[],c=this._uploadCalls;for(b in c)a=c[b],a.abort();return this._uploadsCalls={},this.fileCreationStatus.done(function(a){return function(){return a.api.call(a.projectID,"removeObjects",{objects:[a.fileID]}).then(function(){return a._uploadProgress.reject(),a.fileID})}}(this))},a.prototype.pause=function(){var a,b,c,d;c=this._uploadCalls,d=[];for(b in c)a=c[b],d.push(a.abort());return d},a.prototype.resume=function(){return this._computeChecksums(),this._doUpload()},a.prototype.start=function(){return this.fileCreationStatus.done(function(a){return function(){return a._computeChecksums(),a._doUpload()}}(this))},a.prototype.readBytes=function(a,b){var c,d,e,f,g,h;return null==a&&(a=0),null==b&&(b=1/0),0>a&&(a=Math.max(0,this.file.size+a)),0>b&&(b=0),f=$.Deferred(),e=null!=(g=null!=(h=this.file.slice)?h:this.file.webkitSlice)?g:this.file.mozSlice,null==e?f.reject("No slice function found for "+this.file.name):(d=e.call(this.file,Math.min(this.file.size,a),Math.min(this.file.size,a+b)),c=new FileReader,c.onload=function(){return f.resolve(c.result)},c.onerror=function(){return f.reject(c.error)},c.readAsArrayBuffer(d),f)},a}(),b.exports=c},{}],6:[function(a,b){var c;c=function(){function a(a){this._sparkMD5Src=a,this.keyToDeferred={},this.worker=this._makeMD5WebWorker()}return a.prototype.computeMD5=function(a){var b;return b=this._makeKey(),this.keyToDeferred[b]=$.Deferred(),this.worker.computeMD5(b,a,function(a){return function(c){return"object"==typeof c&&null!=c.error?a.keyToDeferred[b].reject(c):a.keyToDeferred[b].resolve(c)}}(this)),this.keyToDeferred[b]},a.prototype.terminate=function(){return this.worker.destroy()},a.prototype._makeKey=function(){return Date.now().toString()+"-"+Math.round(9999999*Math.random())},a.prototype._makeMD5WebWorker=function(){var a;return a=operative({computeMD5:function(a,b){var c,d,e,f;f=new FileReaderSync;try{return d=f.readAsArrayBuffer(b),e=SparkMD5.ArrayBuffer.hash(d)}catch(g){return c=g,{error:c.name,message:c.message}}}},[this._sparkMD5Src])},a}(),b.exports=c},{}],7:[function(a,b){var c,d,e,f,g,h=function(a,b){return function(){return a.apply(b,arguments)}};c=a("../api.coffee"),d=a("./file_upload.coffee"),e=a("./md5_worker.coffee"),f=a("../common/resource_pool.coffee"),g=function(){function a(a,b,d){var g,i,j,k,l,m,n,o,p;if(this._authToken=a,this.files=b,null==d&&(d={}),this.start=h(this.start,this),!((null!=(k=d.projectID)?k.length:void 0)>0))throw new Error("projectID must be specified");if(!((null!=(l=d.sparkMD5Src)?l.length:void 0)>0))throw new Error("sparkMD5Src must be specified");this.partSize=null!=(m=d.partSize)?m:10485760,this.folder=null!=(n=d.folder)?n:"/",g=null!=(o=d.checksumConcurrency)?o:10,this.uploadConcurrency=null!=(p=d.uploadConcurrency)?p:10,this.projectID=d.projectID,this.api=new c(this._authToken,d),this.workers=function(){var a,b;for(b=[],i=a=0;g>=0?g>a:a>g;i=g>=0?++a:--a)b.push(new e(d.sparkMD5Src));return b}(),this.workerPool=new f(this.workers),j=function(){var a,b,c;for(c=[],i=a=0,b=this.uploadConcurrency;b>=0?b>a:a>b;i=b>=0?++a:--a)c.push("UploadToken "+i);return c}.call(this),this.uploadPool=new f(j),this.fileCreationPool=new f(function(){var a,b,c;for(c=[],i=a=0,b=this.uploadConcurrency;b>=0?b>a:a>b;i=b>=0?++a:--a)c.push("FileCreateToken "+i);return c}.call(this))}return a.prototype.start=function(){var a,b,c,e,f,g,h,i,j,k;for(g=$.Deferred(),this.uploads=[],a={partSize:this.partSize,workerPool:this.workerPool,uploadPool:this.uploadPool,fileCreationPool:this.fileCreationPool,api:this.api,projectID:this.projectID,folder:this.folder},k=this.files,e=i=0,j=k.length;j>i;e=++i)b=k[e],$.isPlainObject(b)&&null!=b.file&&null!=b.options?(c=b.file,h=$.extend(a,b.options)):(c=b,h=a),this.uploads[e]=new d(c,h);return f=function(a){return function(b){var c;return c=a.uploads[b],c.start(),b===a.uploads.length-1?g.resolve(a.uploads):f(b+1)}}(this),f(0),g},a.prototype.abort=function(){var a,b,c,d,e,f,g;for(this.fileCreationPool.close(),this.workerPool.close(),this.uploadPool.close(),this.fileCreationPool.clear(),this.workerPool.clear(),this.uploadPool.clear(),c=$.Deferred(),b=0,a=[],g=this.uploads,e=0,f=g.length;f>e;e++)d=g[e],d.abort().done(function(b){return a.push(b)}).fail(function(a){return"File Closed"!==(null!=a?a.reason:void 0)?c.reject(a):void 0}).always(function(d){return function(){return++b===d.uploads.length?c.resolve(a):void 0}}(this));return c},a.prototype.destroy=function(){var a,b,c,d;for(d=this.workers,b=0,c=d.length;c>b;b++)a=d[b],a.terminate();return this.workerPool.close(),this.uploadPool.close(),this.workerPool.clear(),this.uploadPool.clear()},a.prototype.pause=function(){var a,b,c,d,e;for(this.workerPool.close(),this.uploadPool.close(),d=this.uploads,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.pause());return e},a.prototype.resume=function(){var a,b,c,d;for(d=this.uploads,b=0,c=d.length;c>b;b++)a=d[b],a.resume();return this.workerPool.open(),this.uploadPool.open()},a}(),b.exports=g},{"../api.coffee":2,"../common/resource_pool.coffee":3,"./file_upload.coffee":5,"./md5_worker.coffee":6}]},{},[4]);