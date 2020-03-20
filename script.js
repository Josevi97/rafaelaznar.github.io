// Based on http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
// Based on https://gist.github.com/strategicpause/827183/2da101e92a79c0ffa40b0b986175170984f00355
// Author: Rafael Aznar
// MIT License

var miModulo = angular.module("MiAngularApp", ["chart.js"]).config([
  "ChartJsProvider",
  function(ChartJsProvider) {
    ChartJsProvider.setOptions({
      chartColors: ["#28a745", "#dc3545", "#17a2b8", "#000000"],
      responsive: true
    });
  }
]);

var miControlador = miModulo.controller("MiControlador", [
  "$scope",
  "$interval",
  function($scope, $interval) {
    const WIDTH = 300;
    const HEIGHT = 300;

    $scope.language = 0;

    state = new Array(WIDTH);
    $scope.counter = 1;

    $scope.checkInmunity = true;
    $scope.groupedInfectedPopulation = true;

    $scope.info = "Ready.";
    $scope.state = "initial"; //initial, processing, paused

    $scope.rangeInitialPopulation = 50;
    $scope.rangeContacts = 5;
    $scope.rangeNeighborhood = 3;
    $scope.rangeRecuperation = 10;
    $scope.rangeContaminationThreshold = 25;
    $scope.rangeTickSeconds = 1;
    $scope.rangeMortality = 3;

    $scope.healthy = 0;
    $scope.sick = 0;
    $scope.inmune = 0;
    $scope.dead = 0;
    $scope.total = 0;

    $scope.progressHealthy = 0;
    $scope.progressSick = 0;
    $scope.progressInmune = 0;
    $scope.progressHealthyTotal = 0;
    $scope.progressSickTotal = 0;
    $scope.progressInmuneTotal = 0;
    $scope.progressDead = 0;

    $scope.options = {
      options: { maintainAspectRatio: false },
      legend: { display: true },
      animation: { duration: 0 },
      scales: {
        yAxes: [
          {
            id: "y-axis-1",
            type: "linear",
            display: true,
            position: "left"
          }
        ]
      }
    };

    $scope.start = function() {
      $scope.state = "processing";
      $scope.ticTac = $interval(game_loop, $scope.rangeTickSeconds * 1000);
    };

    $scope.stop = function() {
      $scope.state = "paused";
      $interval.cancel($scope.ticTac);
    };

    $scope.reset = function() {
      $scope.state = "initial";

      $scope.labels = [];
      if ($scope.language == 0) {
        $scope.series = ["Healthy", "Sick", "Immune", "Dead"];
      } else {
        if ($scope.language == 1) {
          $scope.series = ["Sanos", "Enfermos", "Inmunes", "Fallecidos"];
        } else {
          $scope.series = ["Sans", "Malalts", "Immunes", "Morts"];
        }
      }
      $scope.data = [];
      $scope.data.push([]); //Healthy
      $scope.data.push([]); //Sick
      $scope.data.push([]); //Inmune
      $scope.data.push([]); //Dead

      $scope.counter = 1;
      $interval.cancel($scope.ticTac);

      init();
      draw();
      progressUpdate();
    };

    $scope.resetInit = function() {
      init();
      draw();
      progressUpdate();
    };

    $scope.languageChange = function() {
      if ($scope.language == 0) {
        $scope.series = ["Healthy", "Sick", "Inmune", "Dead"];
      } else {
        if ($scope.language == 1) {
          $scope.series = ["Sanos", "Enfermos", "Inmunes", "Fallecidos"];
        } else {
          $scope.series = ["Sans", "Malalts", "Immunes", "Morts"];
        }
      }
    };

    loadLanguages();
    $scope.reset();

    function decreaseOneIterationInfected() {
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          state[i][j] = 0;
        }
      }
    }

    function init() {
      for (i = 0; i < WIDTH; i++) {
        state[i] = new Array(HEIGHT);
        for (j = 0; j < HEIGHT; j++) {
          if (randomInt(1, 10000) < $scope.rangeInitialPopulation) {
            state[i][j] = randomInt(1, parseInt($scope.rangeRecuperation) * 2);
          } else {
            state[i][j] = 0;
          }
        }
      }
      if ($scope.groupedInfectedPopulation) {
        for (i = 0; i < WIDTH; i++) {
          for (j = 0; j < HEIGHT; j++) {
            if (randomInt(1, 1000) < $scope.rangeInitialPopulation) {
              var total = exploreNeigborhood(i, j, 2);
              if (total > 0) {
                state[i][j] = randomInt(
                  1,
                  parseInt($scope.rangeRecuperation) * total
                );
              }
            } else {
              state[i][j] = 0;
            }
          }
        }
      }
    }

    function decreaseOneIterationInfected() {
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          if ($scope.checkInmunity) {
            if (state[i][j] == 1) {
              state[i][j] = -1;
            }
          }
          if (state[i][j] > 0) {
            state[i][j]--;
          }
        }
      }
    }

    function count() {
      $scope.healthy = 0;
      $scope.sick = 0;
      $scope.inmune = 0;
      $scope.dead = 0;
      $scope.total = 0;
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          $scope.total++;
          if (state[i][j] < 0) {
            if (state[i][j] <= -1000) {
              $scope.dead++;
            } else {
              $scope.inmune++;
            }
          } else {
            if (state[i][j] > 0) {
              $scope.sick++;
            } else {
              $scope.healthy++;
            }
          }
        }
      }
    }

    function progressUpdate() {
      $scope.progressHealthy = ($scope.healthy * 100) / $scope.total;
      $scope.progressSick = ($scope.sick * 100) / $scope.total;
      $scope.progressInmune = ($scope.inmune * 100) / $scope.total;
      $scope.progressDead = ($scope.dead * 100) / $scope.total;
      $scope.data[0].push($scope.progressHealthy);
      $scope.data[1].push($scope.progressSick);
      $scope.data[2].push($scope.progressInmune);
      $scope.data[3].push($scope.progressDead);
    }

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function game_loop() {
      $scope.labels.push($scope.counter.toString());
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          if (state[i][j] == 0) {
            explore(i, j);
          } else {
            if (state[i][j] > 0) {
              if (randomInt(1, 1000) <= $scope.rangeMortality * 1.15) {
                state[i][j] = -1000;
              }
            }
          }
        }
      }
      decreaseOneIterationInfected();
      draw();
      progressUpdate();
      $scope.counter++;
    }

    function getRealCoord(x, tope) {
      if (x > tope - 1) {
        return x - tope;
      } else {
        if (x < 0) {
          return tope + x;
        } else {
          return x;
        }
      }
    }

    function exploreNeigborhood(x, y, neighborhood) {
      total = 0;
      for (f = x - neighborhood; f <= x + neighborhood; f++) {
        for (g = y - neighborhood; g <= y + neighborhood; g++) {
          var realx = getRealCoord(f, WIDTH);
          var realy = getRealCoord(g, HEIGHT);
          if (state[realx][realy] > 0) {
            total += state[realx][realy];
          }
        }
      }
      return total;
    }

    function explore(x, y) {
      if (randomInt(1, 30) < $scope.rangeContacts) {
        var contamination = exploreNeigborhood(x, y, $scope.rangeNeighborhood);
        if (contamination > $scope.rangeContaminationThreshold) {
          state[x][y] = randomInt(1, parseInt($scope.rangeRecuperation) * 2);
        }
      }
    }

    function draw() {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        for (i = 0; i < WIDTH; i++) {
          for (j = 0; j < HEIGHT; j++) {
            if (state[i][j] == -1) {
              ctx.fillStyle = "green";
              ctx.fillRect(i, j, 1, 1);
            }
            if (state[i][j] <= -1000) {
              ctx.fillStyle = "#000000";
              ctx.fillRect(i, j, 1, 1);
            }
            if (state[i][j] > 0) {
              ctx.fillStyle =
                "#" +
                rgbToHex(
                  16777215 -
                    Math.floor(65535 / $scope.rangeRecuperation) * state[i][j]
                );
              ctx.fillRect(i, j, 1, 1);
            }
          }
        }
      }
      count();
    }

    function rgbToHex(rgb) {
      var hex = Number(rgb).toString(16);
      if (hex.length < 2) {
        hex = "0" + hex;
      }
      return hex;
    }

    function loadLanguages() {
      $scope.txtTitle = ["Quarantine2020", "Cuarentena2020", "Quarantena2020"];
      $scope.txtIntro = [
        "Below is an epidemic simulator. Adjust the controls and simulate the infection yourself.",
        "A continuación se muestra un simulador de epidemia. Ajuste los controles y simule la infección usted mismo.",
        "A continuació es mostra un simulador d'epidèmia. Ajusteu els controls i simuleu la infecció vosaltres mateix."
      ];
      $scope.txtReady = ["Ready", "Preparado", "Preparat"];
      $scope.txtStart = ["Start", "Iniciar", "Inici"];
      $scope.txtPause = ["Pause", "Pausar", "Pausar"];
      $scope.txtContinue = ["Continue", "Continuar", "Continuar"];
      $scope.txtReset = ["Reset", "Restablecer", "Restablir"];
      $scope.txtImmunity = ["Inmunity", "Inmunidad", "Inmunitat"];
      $scope.txtGroup = [
        "Group the initial infected population",
        "Agrupar la población infectada inicial",
        "Agrupar la població inicial infectada"
      ];
      $scope.txtInitial = [
        "Group the initial infected population",
        "Agrupar la población infectada inicial",
        "Agrupar la població inicial infectada"
      ];
      $scope.txtDay = [
        "Day length in seconds",
        "Duración del día en segundos",
        "Durada del dia en segons"
      ];
      $scope.txtHealthy = ["Healthy", "Sanos", "Sans"];
      $scope.txtSick = ["Sick", "Enfermos", "Malalts"];
      $scope.txtImmune = ["Immune", "Inmunes", "Immunes"];
      $scope.txtDeath = ["Death", "Fallecidos", "Morts"];
      $scope.txtRecuperation = [
        "Average time for patients to recover",
        "Tiempo medio que los enfermos tardan en recuperarse",
        "Temps mitjà que els malalts tarden a recuperar-se"
      ];
      $scope.txtContacts = ["Contacts", "Contactos", "Contactes"];
      $scope.txtDays = ["Day", "Dia", "Dia"];
      $scope.txtNeighborhood = ["Neighborhood", "Vecindario", "Veïnat"];
      $scope.txtAbout = ["About", "Acerca de", "Contacta"];
      $scope.txtLoad = [
        "Viral load index for infection",
        "Índice de carga virica para la infección",
        "Índex de càrrega vírica per a la infecció"
      ];
      $scope.txtDeathRate = [
        "Death rate",
        "Índice de mortalidad",
        "Índex de mortalitat"
      ];
      $scope.txtFooter1 = [
        "This code does not use cookies, does not contain ads nor track or spy on you.",
        "Este código no utiliza cookies, no contiene anuncios ni te rastrea ni te espía.",
        "Aquest codi no utilitza cookies, no conté anuncis, ni vos fa cap seguiment, ni espia."
      ];
      $scope.txtFooter2 = [
        "Designed and built by Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)",
        "Diseñado y programado por Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)",
        "Disenyat y programat per Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)"
      ];
      $scope.txtFooter3 = [
        "MIT licensed project",
        "Proyecto con licencia MIT",
        "Projecte amb licència MIT"
      ];
      $scope.txtModal1 = [
        "My name is Rafael Aznar, Web Development professor at CIPFP Ausiàs March in Valencia",
        "Mi nombre es Rafael Aznar, profesor del ciclo Desarrollo de aplicaciones web en el CIPFP Ausiàs March de Valencia. ",
        "El meu nom és Rafael Aznar, professor del cicle Desenvolupament d'aplicacions web al CIPFP Ausiàs March de València."
      ];
      $scope.txtModal2 = [
        "With no Fallas (https://en.wikipedia.org/wiki/Falles) and locked up at home because of the Coronavirus quarantine, I have designed and written this epidemic simulator in my spare time. I hope it can be useful for learning the behavior of epidemics, for schoolchildren to simulate them by varying the parameterized data, and to forewarn that if this happens again, we have to be prepared. Dedicated to healthcare personnel around the world.",
        "Sin Fallas y encerrado en casa a causa de la cuarentena por el Coronavirus, he diseñado y escrito este simulador de epidemias en mis ratos libres. Espero que pueda ser de utilidad para aprender el comportamiento de las epidemias, para que los escolares las simulen variando los datos parametrizados y para concienciar de que si vuelve a ocurrir esto, que estemos preparados. Dedicado al personal sanitario de todo el mundo.",
        "Sense Falles i tancat a casa a causa de la quarantena del Coronavirus, he dissenyat i escrit aquest simulador d’epidèmies en les estones lliures. Espere que puga servir d’utilitat per aprendre el comportament de les epidèmies, per a que els escolars les simulen variant les dades parametritzades i per a conscienciar que si torna a ocórrer açò, que estiguem preparats. Dedicat al personal sanitari de tot el món."
      ];
      $scope.txtModal3 = [
        "Code is released under MIT license: ",
        "El código está liberado bajo licencia MIT: ",
        "El codi està alliberat sot la llicència MIT: "
      ];
      $scope.txtModal4 = [
        "rafaaznar {at} gmail {dot} com (@rafaelaznar)",
        "rafaaznar {at} gmail {dot} com (@rafaelaznar)",
        "rafaaznar {at} gmail {dot} com (@rafaelaznar)"
      ];
      $scope.txtModal5 = ["Sources at: ", "Fuentes en:", "Codi font a: "];
      $scope.txtClose = ["Close", "Cerrar", "Tancar"];
      $scope.txtShare = ["Share", "Compartir", "Compartir"];
    }
  }
]);
