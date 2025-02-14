var peer;
var myStream = null; // Initialisation à null pour éviter l'affichage avant l'enregistrement

// Fonction pour ajouter une vidéo sans duplication
function ajoutVideo(stream, userId) {
    let existingVideo = document.getElementById(`video-${userId}`);

    // Vérifier si la vidéo existe déjà pour cet utilisateur
    if (!existingVideo) {
        let video = document.createElement('video');
        video.id = `video-${userId}`;
        video.srcObject = stream;
        video.autoplay = true;
        video.controls = true;
        document.getElementById('participants').appendChild(video);
    }
}

// Fonction pour enregistrer l'utilisateur et initialiser le peer
function register() {
    var name = document.getElementById('name').value.trim();

    if (!name) {
        alert("Veuillez entrer un nom !");
        return;
    }

    try {
        peer = new Peer(name);  // Créer un peer avec le nom de l'utilisateur

        peer.on('open', function(id) {
            console.log('Peer ouvert avec l\'ID:', id);
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                myStream = stream; // Stocke le flux local
                ajoutVideo(stream, "self"); // Ajoute la vidéo uniquement après l'enregistrement du nom
                document.getElementById('register').style.display = 'none';
                document.getElementById('userAdd').style.display = 'block';
                document.getElementById('userShare').style.display = 'block';

                // Réception d'un appel entrant
                peer.on('call', function(call) {
                    call.answer(myStream); // Répondre avec le flux local
                    call.on('stream', function(remoteStream) {
                        ajoutVideo(remoteStream, call.peer); // Ajouter la vidéo de l'appelant si elle n'existe pas déjà
                    });
                });
            })
            .catch(function(err) {
                console.log('Échec de l\'accès au flux vidéo/audio', err);
                alert("Impossible d'accéder à votre caméra et microphone.");
            });

    } catch (error) {
        console.error("Erreur lors de la création du peer:", error);
    }
}

// Fonction pour appeler un utilisateur
function appelUser() {
    var name = document.getElementById('add').value.trim();
    
    if (!name || !myStream) {
        alert("Veuillez entrer un nom valide et vous enregistrer d'abord !");
        return;
    }

    var call = peer.call(name, myStream);
    
    call.on('stream', function(remoteStream) {
        ajoutVideo(remoteStream, name); // Ajouter la vidéo de l'utilisateur appelé
    });

    document.getElementById('add').value = ""; // Réinitialiser l'entrée
}

function addScreenShare() {
    var name = document.getElementById('share').value.trim();
    document.getElementById('share').value = ""; // Réinitialiser l'entrée

    if (!name || !peer) {
        alert("Veuillez entrer un nom valide et vous enregistrer d'abord !");
        return;
    }

    navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true })
        .then((screenStream) => {
            console.log('Partage d\'écran démarré');

            // Supprimer l'ancienne vidéo de partage d'écran si elle existe
            let existingScreenVideo = document.getElementById(`video-screen-${name}`);
            if (existingScreenVideo) existingScreenVideo.remove();

            // Ajouter la vidéo du partage pour l'administrateur
            ajoutVideo(screenStream, `screen-${name}`);

            // Envoyer le flux de partage à l'invité
            let call = peer.call(name, screenStream);

            // L’invité reçoit le partage et l’affiche
            call.on('stream', function(remoteStream) {
                let userScreenVideoId = `video-screen-${name}`;
                
                // Supprimer la vidéo normale de l’invité (évite les doublons)
                let existingUserVideo = document.getElementById(`video-${name}`);
                if (existingUserVideo) existingUserVideo.remove();

                // Ajouter la vidéo du partage pour l'invité
                if (!document.getElementById(userScreenVideoId)) {
                    ajoutVideo(remoteStream, userScreenVideoId);
                }
            });

            // Quand l’administrateur arrête le partage, il remet sa caméra
            screenStream.getTracks()[0].onended = function() {
                console.log("Partage d'écran terminé");
                document.getElementById(`video-screen-${name}`)?.remove(); // Supprimer le partage
                ajoutVideo(myStream, "self"); // Remettre la caméra normale
            };
        })
        .catch((err) => {
            console.error('Erreur lors du partage d\'écran:', err);
            alert('Impossible de partager l\'écran.');
        });
}

// Fonction pour afficher les utilisateurs connectés
function afficherUtilisateursConnectes() {
    peer.listAllPeers(function(peers) {
        let userList = document.getElementById('userList');
        userList.innerHTML = ''; // Vider la liste avant de la remplir

        peers.forEach(function(peerId) {
            let listItem = document.createElement('li');
            listItem.textContent = peerId;
            userList.appendChild(listItem);
        });
    });
}

// Appeler la fonction pour afficher les utilisateurs connectés toutes les 5 secondes
setInterval(afficherUtilisateursConnectes, 5000);