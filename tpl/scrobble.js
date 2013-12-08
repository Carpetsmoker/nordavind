// Generated by CoffeeScript 1.6.2
(function() {
  var Scrobble,
    __hasProp = {}.hasOwnProperty;

  Scrobble = (function() {
    /*
    	The secret key is supposed to be, well, secret ... Which is somewhat
    	impossible in an open-source application.
    
    	Please don't misuse this key :-)
    
    	Also, if you make modifications to Nordavind, then please register your own
    	key. Many thanks :-)
    */
    Scrobble.prototype.secret = '0ce163b13c9d0ae05fd152a9a5b92a45';

    Scrobble.prototype.key = '2741bbf6e0178180846e814f042cfbcd';

    Scrobble.prototype.root = 'http://ws.audioscrobbler.com/2.0';

    Scrobble.prototype.enabled = false;

    function Scrobble() {
      if (window.localStorage.getItem('nordavind_lastfm')) {
        this.enabled = true;
      }
    }

    /*
    */


    Scrobble.prototype.startSession = function() {
      var my;

      my = this;
      window.open(("http://www.last.fm/api/auth/?api_key=" + this.key) + ("&cb=" + (window.location.href.replace(/\/$/, '')) + "/lastfm-callback"));
      return (function() {
        var token;

        token = localStorage.getItem('nordavind_token');
        if (token === null) {
          return;
        }
        localStorage.removeItem('nordavind_token');
        this.clearInterval();
        return my._req({
          method: 'auth.getSession',
          token: token
        }, function(data) {
          window.store.set('lastfm', data.session);
          return my.enabled = true;
        });
      }).interval(500);
    };

    /*
    */


    Scrobble.prototype.nowPlaying = function(info) {
      if (!this.enabled) {
        return;
      }
      info['method'] = 'track.updateNowPlaying';
      return this._req(info, null, 'post');
    };

    /*
    	A track should only be scrobbled when the following conditions have been
    	met:
    	- The track must be longer than 30 seconds.
    	- And the track has been played for at least half its duration, or for 4
    	  minutes (whichever occurs earlier.)
    */


    Scrobble.prototype.scrobble = function(info) {
      if (!this.enabled) {
        return;
      }
      info['method'] = 'track.scrobble';
      return this._req(info, null, 'post');
    };

    /*
    	Make a request to the API
    */


    Scrobble.prototype._req = function(paramsobj, cb, type) {
      var k, params, session, sig, urlparams, v;

      if (cb == null) {
        cb = null;
      }
      if (type == null) {
        type = 'get';
      }
      paramsobj['api_key'] = this.key;
      paramsobj['format'] = 'json';
      session = window.store.get('lastfm');
      if (session != null) {
        paramsobj['sk'] = session.key;
      }
      params = (function() {
        var _results;

        _results = [];
        for (k in paramsobj) {
          if (!__hasProp.call(paramsobj, k)) continue;
          v = paramsobj[k];
          _results.push([k, v]);
        }
        return _results;
      })();
      params.sort(function(a, b) {
        return a[0].localeCompare(b[0]);
      });
      sig = md5(((function() {
        var _i, _len, _ref, _results;

        _results = [];
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          _ref = params[_i], k = _ref[0], v = _ref[1];
          if (k !== 'format' && k !== 'callback') {
            _results.push("" + k + v);
          }
        }
        return _results;
      })()).join('') + this.secret);
      urlparams = ((function() {
        var _i, _len, _ref, _results;

        _results = [];
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          _ref = params[_i], k = _ref[0], v = _ref[1];
          _results.push("" + (encodeURIComponent(k)) + "=" + (encodeURIComponent(v)));
        }
        return _results;
      })()).join('&');
      return jQuery.ajax({
        url: "" + this.root + "?" + urlparams + "&api_sig=" + sig,
        type: 'post',
        dataType: 'json',
        success: function(data) {
          if (data.error) {
            alert("LastFM error " + data.error + ": " + data.message);
            return;
          }
          if (cb) {
            return cb.call(null, data);
          }
        }
      });
    };

    return Scrobble;

  })();

  window.scrobble = new Scrobble;

}).call(this);
