import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/* 👇 IMPORTANTE */
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBM66kfjeWzPOi_h_CDna_ehoyJenEOjRE",
  authDomain: "proyectodampablo.firebaseapp.com",
  projectId: "proyectodampablo",
  storageBucket: "proyectodampablo.firebasestorage.app",
  messagingSenderId: "187719158200",
  appId: "1:187719158200:web:ccd7b61efb34a832d0674d",
  measurementId: "G-FHLE4J94JY"
};

const firebaseApp = initializeApp(firebaseConfig);

/* 👇 ACTIVAR ANALYTICS */
const analytics = getAnalytics(firebaseApp);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { auth, db, analytics, logEvent };

export const rankingRef = collection(db, 'ranking');