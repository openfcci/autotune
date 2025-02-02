/*
 * autotune
 * https://github.com/voxmedia/autotune
 *
 * @file Top level class for the Autotune admin UI
 */

// Load jQuery and Backbone, make sure Backbone uses jQuery
var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    bootstrap = require('bootstrap'),
    Alpaca = require('./vendor/alpaca'),
    // Load our components and run the app
    Router = require('./router'),
    Listener = require('./listener'),
    logger = require('./logger'),
    models = require('./models');

// required to make Backbone work in browserify
Backbone.$ = $;

/**
 * Autotune admin UI
 * @constructor
 * @param {Object} config - Configure the admin UI
 * @param {string} config.env - Environment (production, staging or development)
 * @param {Object} config.user - Current user info
 * @param {Object[]} config.themes - Possible project themes
 * @param {Object[]} config.tags - Blueprint tags
 * @param {Object[]} config.blueprints - Blueprints
 * @param {Object[]} config.projects - Projects
 */
function App(config) {
  this.themes = new Backbone.Collection();
  this.themes.reset(config.themes);
  delete config.themes;

  this.tags = new Backbone.Collection();
  this.tags.reset(config.tags);
  delete config.tags;

  this.user = new Backbone.Model(config.user);
  delete config.user;

  this.blueprints = new models.BlueprintCollection();
  this.projects = new models.ProjectCollection();

  this.listener = new Listener();
  this.listener.on('change:blueprint', this.handleBlueprintChange, this);
  this.listener.on('change:project',   this.handleProjectChange, this);
  this.listener.on('stop',             this.handleListenerStop, this);
  this.listener.start();

  this.config = config;

  if ( this.isDev() ) { logger.level = 'debug'; }

  this.router = new Router({ app: this });
  Backbone.history.start({ pushState: true });

  this.hasFocus = true;
  if ( typeof(window) !== 'undefined' ) {
    $(window).on('focus', _.bind(function(){
      this.listener
        .cancelStop()
        .start();
      this.trigger('focus');
    }, this));

    $(window).on('blur', _.bind(function(){
      this.listener.stopAfter(20);
      this.trigger('blur');
    }, this));
  }
}

_.extend(App.prototype, Backbone.Events, {
  /**
   * Is the app running in dev mode
   * @return {bool}
   */
  isDev: function() {
    return this.config.env === 'development' || this.config.env === 'staging';
  },

  /**
   * Log an analytic event
   * @param {string} type - Event type (pageview)
   */
  analyticsEvent: function() {
    if ( typeof(window) !== 'undefined' && window.ga ) {
      var ga = window.ga;
      if ( arguments[0] === 'pageview' ) {
        ga('send', 'pageview');
      }
    }
  },

  /**
   * Handle updating a blueprint
   **/
  handleBlueprintChange: function(data) {
    var inst = this.blueprints.get(data.id);
    if ( !inst ) { return; }
    switch (data.status) {
      case 'new':
      case 'testing':
      case 'broken':
        inst.fetch();
        break;
      default:
        inst.set('status', data.status);
    }
  },

  /**
   * Handle updating a blueprint
   **/
  handleProjectChange: function(data) {
    var inst = this.projects.get(data.id);
    if ( !inst ) { return; }
    switch (data.status) {
      case 'new':
      case 'built':
        inst.fetch();
        break;
      default:
        inst.set('status', data.status);
    }
  },

  handleListenerStop: function() {
    this.view.alert('Updates are stopped', 'notice', true);
  }
});

module.exports = App;

if ( typeof(window) !== 'undefined' ) {
  // Make App a global so we can initialize from our webpage
  window.App = App;
  // Make libraries accessible to global scope for console use
  window.Backbone = Backbone;
  window.$ = $;
  window._ = _;
}
