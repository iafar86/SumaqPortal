﻿sumaqHotelsApp.service('authSvc', function ($http, $q, cuentaDataFactory, tokenDataFactory, localStorageService, jwtHelper, configSvc) {

    var authServiceFactory = {};

    var _authentication = { //clase para manejar si el usuario esta autenticado o no
        isAuth: false,
        userName: "",
        roles: [],
        hotelId: ""
    };

    //#region registracion de usuario
    var _saveRegistration = function (registration) { //funcion para registrar un usuario

        _logOut();       

        return cuentaDataFactory.save(registration).$promise.then( //llamo al metodo save para registrar el nuevo usuario
            function (response) {
                return response;
            });
    };
    //#endregion

    //#region Login y Logout de usuario
    var _login = function (loginData) { // funcion para hacer el login de usuario y generar el token        
        var data = "grant_type=password&username=" + loginData.userName + "&password=" + loginData.password; // defino los datos que voy a pasar como parametros
        
        var deferred = $q.defer();

        $http.post(configSvc.urlApi + '/oauth/token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded'} }).success(function (response) {
        //$http.post('http://sumaqhotelsapi.azurewebsites.net/' + 'oauth/token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {

            var tokenPayload = jwtHelper.decodeToken(response.access_token); //fpaz: decodifico el token para obener los roles y los claims que se hayan definido

            localStorageService.set('authorizationData', { token: response.access_token, userName: loginData.userName, roles: tokenPayload.role, hotelId: tokenPayload.HotelId });

            //fpaz: seteo en el servicio las credenciales del usuario logueado, para que pueda acceder a esta info desde cualquier parte de la app usando la funcion authSvc.authentication
            // que devuelve todo el objeto con la info del usuario logueado
            _authentication.isAuth = true;
            _authentication.userName = loginData.userName;            
            _authentication.roles = tokenPayload.role;
            _authentication.hotelId = tokenPayload.HotelId;

            deferred.resolve(response);

        }).error(function (err, status) {
            _logOut();
            deferred.reject(err);
        });

        return deferred.promise;
    };
  
    var _logOut = function () {// funcion para hacer el logout

        localStorageService.remove('authorizationData'); //para hacer el logout solamente remuevo del storage del cliente el token obtenido

        _authentication.isAuth = false;
        _authentication.userName = "";
        _authentication.roles = [],
        _authentication.hotelId = ""

    };

    //#endregion

    var _fillAuthData = function () { 

        var authData = localStorageService.get('authorizationData');
        if (authData) {
            _authentication.isAuth = true;
            _authentication.userName = authData.userName;
            _authentication.roles = authData.roles;
            _authentication.hotelId = authData.hotelId;
        }

    }

    authServiceFactory.saveRegistration = _saveRegistration;
    authServiceFactory.login = _login;
    authServiceFactory.logOut = _logOut;
    authServiceFactory.fillAuthData = _fillAuthData;
    authServiceFactory.authentication = _authentication;

    return authServiceFactory;
});