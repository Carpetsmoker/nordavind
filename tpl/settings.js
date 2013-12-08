// Generated by CoffeeScript 1.6.2
(function() {
  window.showSettings = function() {
    return jQuery.ajax({
      url: "" + _root + "/get-settings",
      success: function(data) {
        return window.settings.create(data);
      }
    });
  };

  window.settings = {
    /*
    */

    create: function(content) {
      var rp, sess;

      $('body').append("<div id=\"backdrop\"></div>\n<div id='dialog'>\n	<div class=\"content\">" + content + "</div>\n	<div class=\"buttons\"><button class=\"btn close\">Close</div></div>\n</div>");
      $(window).on('keydown.dialog', function(e) {
        if (e.keyCode !== 27) {
          return;
        }
        $(window).off('keydown.dialog');
        return window.settings.close();
      });
      $('#dialog').animate({
        top: '100px',
        opacity: '1'
      }, {
        duration: 200
      });
      $('#backdrop').animate({
        opacity: '0.5'
      }, {
        duration: 200
      });
      sess = store.get('lastfm');
      $('.lastfm').addClass(sess != null ? 'lastfm-enabled' : 'lastfm-disabled');
      if (sess != null) {
        $('.disable-lastfm').replaceHTML('%user%', sess.name);
      }
      $('#dialog .close').on('click', function(e) {
        e.preventDefault();
        return window.settings.close();
      });
      $('#dialog').on('click', '.enable-lastfm', function(e) {
        e.preventDefault();
        $('.lastfm').attr('class', 'lastfm lastfm-loading');
        window.scrobble.startSession();
        return (function() {
          sess = store.get('lastfm');
          if (sess == null) {
            return;
          }
          this.clearInterval();
          $('.lastfm').attr('class', 'lastfm lastfm-enabled');
          if (sess != null) {
            return $('.disable-lastfm').replaceHTML('%user%', sess.name);
          }
        }).interval(500);
      });
      $('#dialog').on('click', '.disable-lastfm', function(e) {
        e.preventDefault();
        store.del('lastfm');
        window.settings.close();
        return window.settings.create();
      });
      rp = store.get('replaygain');
      return $("input[name=replaygain][value=" + rp + "]").prop('checked', true);
    },
    /*
    */

    close: function() {
      store.set('replaygain', $('input[name=replaygain]:checked').val());
      window.player.setVol();
      $('#dialog').remove();
      return $('#backdrop').remove();
    }
  };

}).call(this);