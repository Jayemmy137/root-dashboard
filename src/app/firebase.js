import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAsIIUylB3pdjCAVFb5geMkcgX7My0Umuw",
  authDomain: "root-plant-watering.firebaseapp.com",
  databaseURL: "https://root-plant-watering-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "root-plant-watering",
  storageBucket: "root-plant-watering.firebasestorage.app",
  messagingSenderId: "220459778126",
  appId: "1:220459778126:web:2635104bb315403324031f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);