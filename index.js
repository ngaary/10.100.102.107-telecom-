var peer;
var myStream;
var videoElements = {}; // Stocker les flux pour éviter les doublons

// Fonction pour ajouter une vidéo à l'interface
function ajoutVideo(stream, id) {
    if (videoElements[id]) return; // Empêche d'ajouter plusieurs fois la même vidéo

    var video = document.createElement('video');
    video.id = id; // Identifiant unique pour chaque vidéo
    video.autoplay = true;
    video.controls = true;
    video.srcObject = stream;
    document.getElementById('participants').appendChild(video);

    videoElements[id] = video; // Stocke la vidéo pour éviter le doublon
}

// Fonction d'enregistrement de l'utilisateur
function register() {
    var name = document.getElementById('name').value;
    if (!name) {
        console.error("Nom requis.");
        return;
    }

    if (peer) {
        console.log("Une connexion Peer existe déjà.");
        return;
    }

    peer = new Peer(name);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            myStream = stream;
            ajoutVideo(stream, "localVideo");

            document.getElementById('register').style.display = 'none';
            document.getElementById('userAdd').style.display = 'block';
            document.getElementById('userShare').style.display = 'block';

            peer.on('call', function(call) {
                call.answer(myStream);
                call.on('stream', function(remoteStream) {
                    ajoutVideo(remoteStream, call.peer);
                });
                call.on('error', function(err) {
                    console.error("Erreur lors de l'appel :", err);
                });
            });

        }).catch(err => {
            console.error("Échec d'accès au flux vidéo/audio :", err);
        });
}

// Fonction pour appeler un utilisateur
function appelUser() {
    var name = document.getElementById('add').value;
    if (!name) {
        console.error("Nom de l'utilisateur requis.");
        return;
    }
    document.getElementById('add').value = "";

    var call = peer.call(name, myStream);

    call.on('stream', function(remoteStream) {
        ajoutVideo(remoteStream, call.peer);
    });

    call.on('error', function(err) {
        console.error("Erreur d'appel :", err);
    });
}

// Fonction pour partager l'écran
function addScreenShare() {
    var name = document.getElementById('share').value;
    if (!name) {
        console.error("Nom de l'utilisateur requis.");
        return;
    }
    document.getElementById('share').value = "";

    navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true })
        .then(stream => {
            let call = peer.call(name, stream);

            ajoutVideo(stream, "screenShare");

            call.on('error', function(err) {
                console.error("Erreur de partage d'écran :", err);
            });

            stream.getVideoTracks()[0].onended = function() {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then(newStream => {
                        myStream = newStream;
                        ajoutVideo(newStream, "localVideo");
                    })
                    .catch(err => console.error("Impossible de récupérer la caméra :", err));
            };
        })
        .catch(error => console.error("Erreur lors du partage d'écran :", error));
}