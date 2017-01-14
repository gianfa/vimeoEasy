/* ########################## vimeoEasy v.3  ################################
 * #    Classe di supporto per l'uso dell'API js di Vimeo.com
 * #    E' basata su una classe statica "Vimeo", che si aggancia allo
 * #    elemento contenitore dell'iframe di Vimeo.
 * #    
 * #    Una volta agganciata la classe, � possibile agire sul video
 * #    direttamente dai metodi:
 * #        play(); pause(); stop(); riavvolgi(); stop(); vaiA( secondi ),
 * #    Contiene la variabile:
 * #        percentualeRiprodotta, secondiRiprodotti. 
 * #
 * #    Es:
 * #    var f = new Vimeo("[id dell'iframe]"); //
 * #    f.play();
 * #
 * #    Inoltre tramite l'interfaccia di utilizzo è possibile abilitare
 * #    delle funzionalità come quella della ricerca autonoma dei pulsanti
 * #    funzionali nella pagina, usando su essi l'attributo "vimeo".
 * #    
 * #    E' consigliato agganciare la classe all'iframe prima del caricamento
 * #    della pagina, cioè anche alle ultime linee di questo file.
 * #
 * #    In fondo a questo documento troverai il punto di aggancio.
 * #
 * #    WARNING: pu� dare problemi se non si specifica la versione dell'api
 * #
 * ########################################################################
 */

/**
 * Classe di supporto per l'uso dell'API js di Vimeo.com<br>
 * Vimeo.com reference: https://developer.vimeo.com/player/js-api
 * @param {String} id_iframe L'id dell'oggetto <iframe> in cui � caricato il video di vimeo
 * @require JQuery
 * @author  Gianfrancesco Angelini 06-10-2015
 * @returns {Vimeo}
 */
var Vimeo = function( id_iframe ) {
    if( id_iframe === undefined || id_iframe === null )
        throw "Indicare l'id di un iframe video di Vimeo come argomento dell'oggetto Vimeo ";
    else if( id_iframe.constructor !== String )
        throw "Argomento sbagliato per Vimeo. id_iframe deve essere String!";
    else if ( $("iframe#"+id_iframe).length === 0 )
        throw "Non esistono iframe con l'id "+id_iframe+"!";
    else if( Vimeo.prototype.debug ) console.log("oggetto Vimeo creato correttamente sull'iframe '"+id_iframe+"'");
    
    var player = $("#"+id_iframe); //Aggancio l'iframe
    
    Vimeo.prototype.video = player;
    
    
    /* ############ INTERFACCIA DI UTILIZZO ############ */
    
    /**
     * Flag per il debug. Se true visualizza in console i commenti di esecuzione.
     * @type Boolean
     */
    Vimeo.prototype.debug = true;
    
    /**
     * Flag che indica se la classe deve cercare autonomamente i pulsanti
     * funzione all'interno della pagina.
     */
    Vimeo.prototype.xhtmlButton = true; 
    
    /**
     * Flag che dice se mostrare in console i secondi del video, durante la 
     * riproduzione
     * @type Boolean
     */
    Vimeo.prototype.showSeconds = true;
    
    /* ############ //INTERFACCIA DI UTILIZZO ############*/
    
       
    /**
     * Indica a che punto del video siamo, in frazione centesimale.
     * Basta moltiplicare per 100 per ottenere la percentuale.
     * Si aggiorna durante la riproduzione.
     * @type Number
     */
    Vimeo.prototype.percentualeRiprodotta = 0;
    
    /**
     * Indica a che punto del video siamo, in secondi.
     * Si aggiorna durante la riproduzione.
     * @type Number
     */
    Vimeo.prototype.secondiRiprodotti = 0;
    
    
    
    Vimeo.prototype.playerOrigin = "*";//[NON MODIFICARE]
    // Attivo l'ascolto dei messaggi dal player
    if (window.addEventListener) {
        window.addEventListener('message', onMessageReceived, false);
    }
    else {
        window.attachEvent('onmessage', onMessageReceived, false);
    }
    
    //Gestisce i messaggi ricevuti dal player
    function onMessageReceived(event) {
        // Gestisco i messaggi ricevuti solo dal player vimeo
        if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
            return false;
        }
                
        if ( Vimeo.prototype.playerOrigin === '*') {
            Vimeo.prototype.playerOrigin = event.origin;
        }
        
        //var data = JSON.parse(event.data);
        var data = event.data;
        
        switch (data.event) {
            case 'ready':
                Vimeo.prototype.onReady();
                break;
               
            case 'playProgress':
                Vimeo.prototype.onPlayProgress(data.data);
                break;
                
            case 'pause':
                Vimeo.prototype.onPause();
                break;
               
            case 'finish':
                Vimeo.prototype.onFinish();
                break;
        }
    };//onMessageReceived

    if( Vimeo.prototype.xhtmlButton ){
        /* Chiama l'api quando è premuto un elemento
         * con attributo "vimeo"
         */
        if( Vimeo.prototype.debug ) console.log( "\t analizzo la  pagina in cerca di pulsanti per vimeo" );
        $("[vimeo *= play]").click( function(){
            Vimeo.prototype.post("play");
        });
        $("[vimeo *= pause]").click( function(){
            Vimeo.prototype.post("pause");
        });
        
        var all_goTo = $( "[vimeo *= goTo]" ); 
        for(var i = 0; i<all_goTo.length; i++ ){
            var el = $(all_goTo[i]);
            var value = el.attr('vimeo');
            var start = value.search("goTo-");
            var extractSec = value.substr(start+5,value.length-1);
            var seconds = parseFloat(extractSec);
            el.click( function(){
                Vimeo.prototype.vaiA(seconds);
            });
        }
    }//if xhtmlButton
        
};//Vimeo class


Vimeo.prototype.video = "";
    
/**
 * Funzione di supporto per l'invio di messaggi al player.
 * <p>
 * Vimeo definisce deli metodi disponibili con relativi valori assegnabili.
 * Es: - play():void -  =>  post("play");
 * Es: - seekTo(s):void - => post("seekTo",secondi);<br>
 * I metodi sono:
 * "play";   => mette in play il video
 * "pause";  => mette in pausa il video
 * "paused"; => ritorna un Boolean true se il video è in pausa;
 * "seekTo",secondi; => sposta il video al secondo indicato in "secondi";
 * "unload"; => fa ripartire il video da zero secondi;
 * "getCurrentTime" => restituisce un Number indicante il n di secondi del video;
 * "getDuration"    => restituisce un Number, la durata totale del video;
 * "getVideoEmbedCode" => restituisce il codice annidato dell'iframe;<br>
 * "getVolume"<br>
 * "setVolume"<br>
 * "getVideoHeight"<br>
 * "getVideoWidth"<br>
 * "getVideoUrl"<br>
 * "getColor"<br>
 * "setColor"<br>
 * "setLoop"
 * 
 * @param {String} action L'azione definita da Vimeo. 
 * @param {String/Number} value Il valore per la funzione
 * @returns {undefined}
 */
Vimeo.prototype.post = function(action, value) {
        var data = {
          method: action
        };
        if (value) {
            data.value = value;
        }
        var message = JSON.stringify(data);
        Vimeo.prototype.video[0].contentWindow.postMessage(data, Vimeo.prototype.playerOrigin);
};//post


/**
 * Codice eseguito quando il video è caricato e pronto.
 * @param {Function} funzione [opzionale] Funzione di callback
 * @returns {undefined}
*/ 
Vimeo.prototype.onReady = function (funzione) {
    if( Vimeo.prototype.debug ) console.log("video caricato e pronto!");
    /**
     * Indica la durata totale del video
     * @type Number
     */
    
    /*Aggiungo i listener per le funzioni di mio interesse*/
    Vimeo.prototype.post('addEventListener', 'pause');
    Vimeo.prototype.post('addEventListener', 'finish');
    Vimeo.prototype.post('addEventListener', 'playProgress');
    
    if ( funzione !== undefined && funzione !== null && funzione.constructor === Function )
        funzione();
    else if ( funzione !== undefined && funzione !== null && funzione.constructor !== Function ){
        if( Vimeo.prototype.debug ) console.log("E' stato passato un parametro illegale a onReady, non era funzione: verrà ignorato");
        return;
    }
};

/**
 * Codice eseguito quando il video è in pausa.
 * @param {Function} funzione [opzionale] Funzione di callback
 * @returns {undefined}
 */
Vimeo.prototype.onPause = function (funzione) {
    if( Vimeo.prototype.debug ) console.log("\t video in pausa");
    if( funzione !== undefined && funzione !== null && funzione.constructor !== Function  ){
        if( Vimeo.prototype.debug ) console.log("E' stato passato un parametro illegale a onPause, non era funzione: verrà ignorato");
        return;
    }
    else if ( funzione !== undefined && funzione !== null && funzione.constructor === Function )
        funzione();
};//onPause

/**
 * Codice eseguito quando il video è finito.
 * @param {Function} funzione [opzionale] Funzione di callback
 * @returns {undefined}
 */
Vimeo.prototype.onFinish = function (funzione) {
    if( Vimeo.prototype.debug ) console.log("video finito");
    if( funzione !== undefined && funzione !== null && funzione.constructor !== Function ){
        if( Vimeo.prototype.debug ) console.log("E' stato passato un parametro illegale a onFinish, non era funzione: verrà ignorato");
        return;
    }
    else if ( funzione.constructor === Function )
        funzione();
};

/**
 * Codice eseguito quando il video è in riproduzione.
 * @param {Object} data Oggetto derivante dalla chiamata all'Api
 * @param {Function} funzione [opzionale] Funzione di callback
 * @returns {undefined}
 */
Vimeo.prototype.onPlayProgress = function(data, funzione) {  //TODO: sistemare qui
    if( funzione !== undefined && funzione !== null && funzione.constructor !== Function ){
        if( Vimeo.prototype.debug ) console.log("E' stato passato un parametro illegale a onPlayProgress, non era funzione: verrà ignorato");
        return;
    }
    else if ( funzione !== undefined && funzione !== null && funzione.constructor === Function )
        funzione();
    
    if( Vimeo.prototype.debug ) console.log("video in Riproduzione");
    if( Vimeo.prototype.showSeconds ) console.log(data.seconds + " secondi" );  
    
    Vimeo.prototype.percentualeRiprodotta = data.percent;
    Vimeo.prototype.secondiRiprodotti = data.seconds;
    
};//onPlayProgress 

/**
 * Riproduce il video
 * @returns {undefined}
 */
Vimeo.prototype.play = function(){
    Vimeo.prototype.post("play");
};//play

/**
 * Mette in pausa il video
 * @returns {undefined}
 */
Vimeo.prototype.pause = function(){
    Vimeo.prototype.post("pause");
};//pause

/**
 * Stoppa il video riportando a 0 secondi la testina.
 * @returns {undefined}
 */
Vimeo.prototype.stop = function(){
    Vimeo.prototype.post("pause");
    Vimeo.prototype.post("unload");
};//stop

/**
 * Riporta a 0 secondi la testina.
 * @returns {undefined}
 */
Vimeo.prototype.riavvolgi = function(){
    Vimeo.prototype.post("unload");
};//riavvolgi

/**
 * Sposta la testina del video ad una posizione precisa di esso
 * @param {Number} secondi
 * @returns {undefined}
 */
Vimeo.prototype.vaiA = function( secondi ){
    if( secondi === undefined || secondi === null )
        throw "Per usare vaiA() devi fornire un Number come parametro, "+
            "indicante il numero di secondi dall'inizio del video ";
    if( secondi.constructor !== Number )
        throw "Parametro illegale per VaiA: "+secondi+" deve essere Number!";
    Vimeo.prototype.post("seekTo",secondi);
};//vaiA




/*######### AGGANCIA QUI IL TUO IFRAME ###########*/
/* Semplicemente sostituisci a [id iframe] l'id del tuo
 * oggetto iframe nel documento in cui vuoi far partire
 * il video.
 */
// var v = new Vimeo("[id iframe]");
var f = new Vimeo("video");