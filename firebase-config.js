const firebaseConfig = {
    apiKey: "AIzaSyCPUEDslDEvjKXuGrBS_YdBCrJpCpZcLPU",
    authDomain: "mealmate-e2b00.firebaseapp.com",
    projectId: "mealmate-e2b00",
    storageBucket: "mealmate-e2b00.firebasestorage.app",
    messagingSenderId: "206966216973",
    appId: "1:206966216973:web:0bed3f2924d71278e4b844"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("Firebase initialized successfully");