!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b){var c;c=function(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s;null==b&&(b={}),null==c&&(c=0),o=$.Deferred(),i=null!=(q=b.headers)?q:{},g=b.data,k=null!=(r=b.method)?r:"POST",d=b.ajaxDelay,j=null!=(s=b.maxRetries)?s:5,f=b.contentType,m=null,p=[200,202,206],null!=g&&"object"==typeof g&&b.skipConversion!==!0&&(i["Content-Type"]="application/json",g=JSON.stringify(g),f="application/json; charset=UTF-8"),n=function(a){return null!=d?setTimeout(function(){return o.resolve(a)},d):o.resolve(a)},l=function(a){var b,c;return null!=d?setTimeout(function(){return o.reject(a)},d):o.reject(a),o.reject({type:"AjaxError",details:{jqXHR:null!=(b=null!=(c=a.details)?c.jqXHR:void 0)?b:{}}})};try{e={data:g,headers:i,type:k,url:a,success:function(a){return n(a)},error:function(d,e,f){var g,h,i,k;if(503===d.status)return i=parseInt(d.getResponseHeader("Retry-After"),10),null!=i&&isFinite(i)&&i>0||(i=60),l({type:"AjaxRetryTimeout",details:{delay:i,serverError:JSON.parse(d.responseText).error}}),setTimeout(function(){return DX.ajaxRequest(a,b,c).then(o.resolve,o.reject,o.notify)},1e3*i);if("error"===e&&0===d.status)return c>j?l({type:"AjaxError",details:{jqXHR:d}}):(c+=1,setTimeout(function(){return DX.ajaxRequest(a,b,c).then(o.resolve,o.reject,o.notify)},1e3*Math.pow(2,c)));if("abort"!==f&&"abort"!==e&&!o.aborted){if(h=null,"timeout"===e)h={type:"AjaxTimeout",details:{url:a}};else if("parsererror"===e)h={type:"AjaxError",details:{data:JSON.stringify(input)}};else try{h=null!=(k=JSON.parse(d.responseText).error)?k:{type:"InvalidErrorResponse"}}catch(m){g=m,h={type:"InvalidErrorResponse",details:g}}return l(h)}}},b.withCredentials===!0&&(e.xhrFields={withCredentials:!0}),null!=b.cache&&(e.cache=b.cache),null!=f&&(e.contentType=f),null!=b.dataType&&(e.dataType=b.dataType),m=$.ajax(e),o.abort=function(){return m.abort()}}catch(t){h=t,console.log("Unknown error during API call",h),null!=m&&null!=m.abort&&m.abort(),l({type:"UnknownError",details:h})}return o},b.exports=c},{}],2:[function(a,b){var c,d,e={}.hasOwnProperty;d=a("./ajax_request.coffee"),c=function(){function a(a,b){var c,d;if(this.authToken=a,null==b&&(b={}),null==this.authToken||0===this.authToken.length)throw new Error("authToken must be specified");this.maxAJAXTrials=null!=(c=b.maxAJAXTrials)?c:5,this.apiServer="https://"+(null!=(d=b.apiServer)?d:"api.dnanexus.com"),this.pendingApiCallKey=0,this.pendingApiCalls={}}return a.prototype.API_ERRORS={MalformedJSON:"The input could not be parsed as JSON",InvalidAuthentication:"The provided OAuth2 token is invalid",PermissionDenied:"Insufficient permissions to perform this action",ResourceNotFound:"A specified entity or resource could not be found",InvalidInput:"The input is syntactically correct (JSON), but semantically incorrect",InvalidState:"The operation is not allowed at this object state",InvalidType:"An object specified in the request is of invalid type",InternalError:"The server encountered an internal error",InvalidErrorResponse:"We've received an error, but cannot process the message",InvalidAPICall:"An invalid api call has occurred",InvalidResponse:"We've received an invalid response from an API call",AjaxError:"There was an error in the way the server request was formed",AjaxTimeout:"The server could not be contacted in a timely fashion"},a.prototype.ALL_ERRORS="AllErrors",a.prototype.call=function(a,b,c,e){var f,g,h,i,j;return null==e&&(e={}),i=$.Deferred(),i.abort=function(){return this.aborted=!0},this.disabled?i:null==a||null==b||"string"!=typeof a||"string"!=typeof b?(console.error("Subject and method must both be defined and must be strings, when calling Nucleus.call",a,b),i.reject()):(null==c&&(c={}),f=this.pendingApiCallKey++,this.pendingApiCalls[f]=i,j=[this.apiServer,a,b].join("/"),g={},g.Authorization="Bearer "+this.authToken,c={headers:g,data:c,maxRetries:this.maxAJAXTrials},e.withCredentials===!0&&(c.withCredentials=!0),h=d(j,c),i.abort=function(){return this.aborted=!0,h.abort()},h.done(function(){return function(a){var b;if(!i.aborted){try{"string"==typeof a&&(a=$.parseJSON(a))}catch(c){return b=c,void i.reject({type:"InvalidResponse"})}return i.resolve(a)}}}(this)).fail(function(){return function(a){return i.reject(a)}}(this)).always(function(a){return function(){return delete a.pendingApiCalls[f]}}(this)),i)},a.prototype.destroy=function(){var a,b,c,d;this.disabled=!0,c=this.pendingApiCalls,d=[];for(a in c)e.call(c,a)&&(b=c[a],d.push(b.abort()));return d},a.prototype.getNumPendingApiCalls=function(){var a,b,c,d;a=0,d=this.pendingApiCalls;for(b in d)e.call(d,b)&&(c=d[b],a++);return a},a.prototype.uploadFilePart=function(a,b,c,d,e){var f,g,h,i;return f=$.Deferred(),g={"Content-MD5":d},h={index:b,md5:d,size:c.size},i=this.call(a,"upload",h,e).done(function(a){var b,d,e,h,j;j=a.headers;for(d in j)h=j[d],g[d]=h;return b=$.ajax({url:a.url,contentType:"application/octet-stream",processData:!1,data:c,headers:g,success:function(){return f.resolve(null)},error:function(a,b,c){var d,e;try{return d=JSON.parse(a.responseText).error.type,f.reject(d)}catch(g){return e=g,f.reject(c)}},type:"POST",xhr:function(){var a,b,c;return c=$.ajaxSettings.xhr(),null!=c.upload&&(b=function(a){return a.lengthComputable?f.notify({loaded:a.loaded,total:a.total}):void 0},a=function(){return c.upload.removeEventListener("progress",b),c.upload.removeEventListener("loadend",a)},c.upload.addEventListener("progress",b),c.upload.addEventListener("loadend",a)),c}}),e=i.abort,i.abort=function(){return b.abort(),e.call(i)}}).fail(function(a){return f.reject(a)}),f.abort=function(){return i.abort()},f},a}(),b.exports=c},{"./ajax_request.coffee":1}],3:[function(a){null==window.DX&&(window.DX={}),window.DX.ajaxRequest=a("./ajax_request.coffee"),window.DX.Api=a("./api.coffee")},{"./ajax_request.coffee":1,"./api.coffee":2}]},{},[3]);