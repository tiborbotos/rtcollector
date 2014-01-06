var angularApplicationInit = function(applicationName) {
  var basicDeps = ['js/utilities/prototypes.js',
                   'js/rtc_loaders.js',
                   'js/rtc_stats.js',
                   'js/rtc_file_data.js'];

  var jquery = ['lib/jquery/jquery.js'];

  var bootstrap = ['lib/bootstrap/dist/js/bootstrap.js'];

  var angularBasic = ['lib/angular/angular.js'];

  var angularExtensions = ['lib/angular-route/angular-route.js',
                    'lib/angular-sanitize/angular-sanitize.js'];

  var application = ['js/app.js',
                     'js/services.js',
                     'js/controllers.js',
                     'js/directives.js'];

  loadDependencies(loadApplication);

  function loadApplication() {
    requirejs(application, function(){
      console.log('Application dependencies are loaded! Bootstrapping application ' + applicationName);
      angular.bootstrap(document, [applicationName]);
    });
  }

  function loadDependencies(fn) {
    console.log('Loading basic dependencies...');
    requirejs(basicDeps, function(){
      console.log('DONE, loading jQuery...');
      requirejs(jquery, function(){
        console.log('DONE, loading bootstrap...');
        requirejs(bootstrap, function(){
          console.log('DONE, loading angular');
          requirejs(angularBasic, function(){
            console.log('DONE, loading angular extensions');
            requirejs(angularExtensions, function(){
              console.log('DONE!');

              fn();
            });
          });
        });
      });
    });
  }
}("rtcApp");