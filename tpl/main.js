(function() {
  var detectSupport, initGlobalKeys, initPanes, setPane;

  window._root = '';

  window._activepane = null;

  window._cache = {
    tracks: {},
    albums: {},
    artists: {}
  };

  setPane = function(p) {
    window._activepane = $(p);
    $('.pane-active').removeClass('pane-active');
    return window._activepane.addClass('pane-active');
  };

  initPanes = function() {
    var setinfo, setlib;
    $('body').on('click', '#library', function() {
      return setPane(this);
    });
    $('body').on('click', '#playlist-wrapper', function() {
      return setPane(this);
    });
    $('body').on('click', '#player', function() {
      return setPane(this);
    });
    $('body').on('click', '#info', function() {
      return setPane(this);
    });
    $('body').on('keydown', function(e) {
      if (e.keyCode === 27) {
        e.preventDefault();
        window._activepane = null;
        return $('.pane-active').removeClass('pane-active');
      }
    });
    setinfo = function(h, set) {
      set.css('height', "" + h + "px");
      $('#info .table-wrapper').css('height', "" + h + "px");
      $('#playlist-wrapper').css('bottom', "" + (h + $('#status').height() + 3) + "px");
      $('#playlist-wrapper').scrollbar('update');
      $('#info .table-wrapper').scrollbar('update');
      return $('#info .table-wrapper').width($('#info').width() - $('#info img').width() - 20);
    };
    setlib = function(w, set) {
      set.css('width', "" + w + "px");
      return $('.right-of-library').css('left', "" + ($('#library').width()) + "px");
    };
    return $('.resize-handle').each(function(i, elem) {
      var move, set, stop;
      elem = $(elem);
      set = elem.parent();
      if (elem.hasClass('resize-vertical')) {
        if (store.get('info-size')) setinfo(store.get('info-size'), set);
      } else {
        if (store.get('library-size')) setlib(store.get('library-size'), set);
      }
      move = function(e) {
        if (elem.hasClass('resize-vertical')) {
          return setinfo($(window).height() - e.pageY - $('#status').height(), set);
        } else {
          return setlib(e.pageX, set);
        }
      };
      stop = function() {
        if (elem.hasClass('resize-vertical')) {
          return store.set('info-size', $('#info').height());
        } else {
          return store.set('library-size', $('#library').width());
        }
      };
      babyUrADrag(elem, null, move, stop);
      return elem.css('display', 'block');
    });
  };

  detectSupport = function() {
    var err, _ref, _ref2;
    err = [];
    if (!((_ref = window.JSON) != null ? _ref.parse : void 0)) {
      err.push("Your browser doesn't seem to support JSON");
    }
    if (!((_ref2 = window.localStorage) != null ? _ref2.setItem : void 0)) {
      err.push("Your browser doesn't seem to support localStorage");
    }
    if (new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '') {
      window.player.codec = 'ogg';
    } else if (new Audio().canPlayType('audio/mp3; codecs="mp3"') !== '') {
      window.player.codec = 'mp3';
    }
    if (err.length > 0) return alert(err.join('\n'));
  };

  window.setSize = function() {
    var _ref;
    $('#library ol').css('height', "" + ($(window).height() - $('#library ol').offset().top) + "px");
    $('.seekbar').css('width', ($('#player').width() - $('.volume').outerWidth() - $('.volume').position().left - $('.buttons-right').outerWidth() - 30) + 'px');
    $('#playlist-wrapper').css('bottom', "" + ($('#info').height() + $('#status').height() + 3) + "px");
    $('#info .table-wrapper').width($('#info').width() - $('#info img').width() - 20);
    $('#playlist-thead').css('left', "" + ($('#playlist').offset().left) + "px");
    if (((_ref = window.playlist) != null ? _ref.headSize : void 0) != null) {
      return window.playlist.headSize();
    }
  };

  initGlobalKeys = function() {
    var cycle;
    cycle = ['#library', '#playlist-wrapper', '#search input', '#player .play', '#player .pause', '#player .backward', '#player .forward', '#player .stop'];
    return $('body').on('keydown', function(e) {
      var active, n;
      if (e.keyCode !== 9) return;
      e.preventDefault();
      active = null;
      cycle.forEach(function(sel) {
        if ($(document.activeElement).is(sel)) return active = sel;
      });
      if (active === null) {
        cycle.forEach(function(sel) {
          if ($('.pane-active').is(sel)) return active = sel;
        });
      }
      if (active === null) {
        return setPane($('#library'));
      } else {
        n = cycle.indexOf(active) + 1;
        if (n > cycle.length - 1) n = 0;
        if (!$(cycle[n]).is(':visible')) n += 1;
        $(active).blur();
        $('.pane-active').removeClass('pane-active');
        window._activepane = null;
        if ($(cycle[n]).hasClass('pane')) {
          return setPane($(cycle[n]));
        } else {
          return $(cycle[n]).focus();
        }
      }
    });
  };

  $(document).ready(function() {
    $('input').val('');
    store.init('client', md5(new Date() + Math.random()));
    store.init('playlist', []);
    store.init('replaygain', 'album');
    setSize();
    window.library = new Library();
    window.playlist = new Playlist();
    window.player = new Player();
    window.info = new Info();
    detectSupport();
    initPanes();
    initGlobalKeys();
    setSize();
    $(window).on('resize', setSize);
    window.playlist.headSize();
    if (store.get('lasttrack') != null) {
      return window.playlist.playRow($("#playlist tr[data-id=" + (store.get('lasttrack')) + "]"));
    }
  });

}).call(this);
