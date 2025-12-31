const firebaseConfig = {
    apiKey: "AIzaSyAWmeTfq7eVVCd7m4zWW1AuZcsm3UQxGO0",
    authDomain: "cotswold-shop.firebaseapp.com",
    projectId: "cotswold-shop",
    storageBucket: "cotswold-shop.firebasestorage.app",
    messagingSenderId: "924177807370",
    appId: "1:924177807370:web:843629ec99d9c3779dc7f3",
    measurementId: "G-5763F1B3HP"
};

let auth, provider;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        provider = new firebase.auth.GoogleAuthProvider();
        console.log("Firebase Başarıyla Başlatıldı");
    } else {
        throw new Error("SDK not loaded");
    }
} catch(e) {
    console.error("Firebase Config/Load Hatası:", e);
    
    auth = { 
        signInWithPopup: () => Promise.resolve({user: {displayName: 'Demo User', email: 'demo@test.com', photoURL: null}}),
        signOut: () => console.log('Mock signout')
    };
}