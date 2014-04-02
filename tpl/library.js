(function() {
  var Library;

  window.Library = Library = (function() {
    /*
    */
    function Library() {
      $('#library ol').scrollbar({
        wheelSpeed: 150
      });
      this.selectRow($('#library li:first'));
      this.initFilter();
      this.initMouse();
      this.initKeyboard();
    }

    /*
    */

    Library.prototype.updateScrollbar = function() {
      return $('#library ol').scrollbar('update');
    };

    /*
    	Toggle artist open/close
    */

    Library.prototype.toggleArtist = function(row) {
      var hide, n;
      row = row.closest('li');
      if (!row.is('.artist')) return;
      if (row.find('i').attr('class') === 'icon-expand-alt') {
        row.find('i').attr('class', 'icon-collapse-alt');
        hide = false;
      } else {
        row.find('i').attr('class', 'icon-expand-alt');
        hide = true;
      }
      n = row.next();
      while (true) {
        if (!n.hasClass('album')) break;
        if (hide) {
          n.css('display', 'none');
        } else {
          if ($('#search input').val() === '' || n.attr('data-match') === 'true') {
            n.css('display', 'block');
          }
        }
        n = n.next();
      }
      return this.updateScrollbar;
    };

    /*
    	Add album to playlist
    */

    Library.prototype.addAlbumToPlaylist = function(albumId) {
      return jQuery.ajax({
        url: "" + _root + "/get-album/" + albumId,
        type: 'get',
        dataType: 'json',
        success: function(data) {
          var pl, row, save, t, _i, _len, _ref;
          pl = $('#playlist tbody');
          save = [];
          window._cache['artists'][data.artist.id] = data.artist;
          window._cache['albums'][data.album.id] = data.album;
          _ref = data.tracks;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            t = _ref[_i];
            window._cache['tracks'][t.id] = t;
            row = "<tr data-id=\"" + t.id + "\" data-length=\"" + t.length + "\">\n	<td></td>\n	<td>" + t.discno + "." + (t.trackno < 10 ? 0 : '') + t.trackno + "</td>\n	<td>" + (data.artist.name.quote()) + " - " + (data.album.name.quote()) + "</td>\n	<td>" + (t.name.quote()) + "</td>\n	<td>" + (displaytime(t.length)) + "</td>\n</tr>";
            pl.append(row);
            save.push(row);
          }
          $('#playlist-wrapper').scrollbar('update');
          window.playlist.headSize();
          return store.set('playlist', store.get('playlist').concat(save));
        }
      });
    };

    /*
    	Select artist/album
    */

    Library.prototype.selectRow = function(row) {
      row = row.closest('li');
      if (!row) return false;
      $('#library .active').removeClass('active');
      row.addClass('active');
      if (row.position().top > $('#library ol').height() || row.position().top < 0) {
        $('#library ol')[0].scrollTop += row.closest('li').position().top;
        return this.updateScrollbar;
      }
    };

    /*
    	Add album to playlist
    */

    Library.prototype.addAlbum = function(row) {
      return this.addAlbumToPlaylist(row.closest('li').attr('data-id'));
    };

    /*
    	Filter
    */

    Library.prototype.initFilter = function() {
      var dofilter, filter, pterm, t;
      t = null;
      pterm = null;
      dofilter = function(target) {
        var term;
        term = target.val().trim();
        if (term === pterm) return;
        target.removeClass('invalid');
        target.parent().find('.error').remove();
        pterm = term;
        if (term === '') {
          $('#library .artist').show();
          $('#library .album').hide();
          return;
        }
        try {
          term = new RegExp(term);
        } catch (exc) {
          target.addClass('invalid');
          target.after('<span class="error">Invalid regular expression</span>');
          return;
        }
        $('#library li').hide();
        $('#library ol')[0].scrollTop = 0;
        $$('#library li').forEach(function(row) {
          var n, _ref, _results;
          row = $(row);
          if (row.text().toLowerCase().match(term) || ((_ref = row.attr('data-name_tr')) != null ? _ref.toLowerCase().match(term) : void 0)) {
            if (row.is('.artist')) {
              row.show();
              n = row.next();
              _results = [];
              while (true) {
                if (!n.hasClass('album')) break;
                n.attr('data-match', 'true');
                _results.push(n = n.next());
              }
              return _results;
            } else {
              row.attr('data-match', 'true');
              return row.findPrev('.artist').show();
            }
          }
        });
        return this.updateScrollbar;
      };
      filter = function(e) {
        if (t) clearTimeout(t);
        return t = dofilter.timeout(400, [$(e.target)]);
      };
      $('#search input').on('keydown', filter);
      return $('#search input').on('change', filter);
    };

    /*
    	Bind mouse events
    */

    Library.prototype.initMouse = function() {
      var my;
      my = this;
      $('#library ol').on('click', 'li span', function() {
        return my.selectRow($(this));
      });
      $('#library ol').on('click', '.artist i', function() {
        return my.toggleArtist($(this));
      });
      $('#library ol').on('dblclick', '.artist span', function(e) {
        e.preventDefault();
        my.selectRow($(this));
        return my.toggleArtist($(this));
      });
      $('#library ol').on('dblclick', '.album span', function(e) {
        e.preventDefault();
        my.selectRow($(this));
        return my.addAlbum($(this));
      });
      $('#library ol').on('mousedown', '.artist span', function(e) {
        var next, _results;
        if (e.button !== 1) return;
        e.preventDefault();
        my.selectRow($(this));
        next = $(this).closest('li').next();
        _results = [];
        while (true) {
          if (!next.is('.album')) break;
          my.addAlbum(next);
          _results.push(next = next.next());
        }
        return _results;
      });
      return $('#library ol').on('mousedown', '.album span', function(e) {
        if (e.button !== 1) return;
        e.preventDefault();
        my.selectRow($(this));
        return my.addAlbum($(this));
      });
    };

    /*
    	Keybinds
    */

    Library.prototype.initKeyboard = function() {
      var chain, cleartimer, my, timer;
      my = this;
      chain = '';
      timer = null;
      cleartimer = null;
      return $('body').on('keydown', function(e) {
        var events, f, _ref, _ref2, _ref3;
        if (!((_ref = window._activepane) != null ? _ref.is('#library') : void 0)) {
          return;
        }
        if (((_ref2 = document.activeElement) != null ? (_ref3 = _ref2.tagName) != null ? _ref3.toLowerCase() : void 0 : void 0) === 'input') {
          return;
        }
        if (e.ctrlKey || e.altKey) return;
        events = {
          27: function() {
            if (timer) clearTimeout(timer);
            if (cleartimer) return clearTimeout(cleartimer);
          },
          38: function() {
            return my.selectRow($('#library .active').findPrev('li:visible'));
          },
          40: function() {
            return my.selectRow($('#library .active').findNext('li:visible'));
          },
          39: function() {
            var act;
            act = $('#library .active');
            if (act.is('.artist')) {
              if (act.next().is(':visible')) {
                return my.selectRow(act.next());
              } else {
                return my.toggleArtist(act);
              }
            }
          },
          37: function() {
            var act;
            act = $('#library .active');
            if (act.is('.album')) {
              return my.selectRow(act.findPrev('.artist'));
            } else if (act.is('.artist') && act.next().is(':visible')) {
              return my.toggleArtist(act);
            }
          },
          33: function() {
            var n, r;
            n = Math.floor($('#library ol').height() / $('#library li:first').outerHeight());
            r = my.selectRow($('#library .active').findPrev('li:visible', n));
            if (r === false) return my.selectRow($('#library li:first'));
          },
          34: function() {
            var n, r;
            n = Math.floor($('#library ol').height() / $('#library li:first').outerHeight());
            r = my.selectRow($('#library .active').findNext('li:visible', n));
            if (r === false) return my.selectRow($('#library li:last'));
          },
          36: function() {
            return my.selectRow($('#library li:first'));
          },
          35: function() {
            return my.selectRow($('#library li:last').findPrev('.artist'));
          },
          13: function() {
            var act;
            act = $('#library .active');
            if (act.is('.artist')) my.toggleArtist(act);
            if (act.is('.album')) return my.addAlbum(act);
          }
        };
        if (events[e.keyCode] != null) {
          e.preventDefault();
          chain = '';
          return events[e.keyCode]();
        } else if (e.keyCode === 32 || (e.keyCode > 46 && e.keyCode < 91)) {
          e.preventDefault();
          chain += String.fromCharCode(e.keyCode).toLowerCase();
          if (timer) clearTimeout(timer);
          f = function(chain) {
            return $('#library li').each(function(i, elem) {
              var _ref4;
              elem = $(elem);
              if (elem.is(':visible') && (elem.text().toLowerCase().indexOf(chain) === 0 || ((_ref4 = elem.attr('data-name_tr')) != null ? _ref4.toLowerCase().indexOf(chain) : void 0) === 0)) {
                my.selectRow(elem);
                return false;
              }
            });
          };
          timer = f.timeout(100, [chain]);
          if (cleartimer) clearTimeout(cleartimer);
          return cleartimer = (function() {
            return chain = '';
          }).timeout(1500);
        }
      });
    };

    return Library;

  })();

}).call(this);
