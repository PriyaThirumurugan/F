// ✅ Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC92w1-3dlb_UBJ_c5hS3sZ4gAYyMty8Vw",
  authDomain: "lostfound-26c24.firebaseapp.com",
  projectId: "lostfound-26c24",
  storageBucket: "lostfound-26c24.appspot.com",
  messagingSenderId: "820289732702",
  appId: "1:820289732702:web:2e34e7c6c2703a42c4b4cf",
  measurementId: "G-6REH3G9KD6"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ UI Elements
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnReportLost = document.getElementById("btnReportLost");
const btnReportFound = document.getElementById("btnReportFound");
const authModal = document.getElementById("authModal");
const reportModal = document.getElementById("reportModal");
const btnDoLogin = document.getElementById("btnDoLogin");
const btnCloseAuth = document.getElementById("btnCloseAuth");
const btnSubmitReport = document.getElementById("btnSubmitReport");
const btnCloseReport = document.getElementById("btnCloseReport");
const reportsContainer = document.getElementById("reportsContainer");

// ✅ Global State
let currentUser = null;

// 🔑 Open Login
btnLogin.onclick = () => authModal.style.display = "flex";
btnCloseAuth.onclick = () => authModal.style.display = "none";

// 🚪 Logout
btnLogout.onclick = () => {
  signOut(auth).then(() => {
    currentUser = null;
    btnLogout.style.display = "none";
    btnLogin.style.display = "inline-block";
    alert("Logged out!");
  });
};

// 🔑 Login/Register
btnDoLogin.onclick = async () => {
  const name = document.getElementById("authName").value;
  const phone = document.getElementById("authPhone").value;
  const password = document.getElementById("authPassword").value;
  const email = phone + "@lostfound.com"; // use phone as email

  try {
    // Try login first
    let userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = { name, phone, uid: userCred.user.uid };
    alert("Welcome back " + name + "!");
  } catch (err) {
    // If not registered, create
    let userCred = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = { name, phone, uid: userCred.user.uid };
    alert("Account created for " + name);
  }

  authModal.style.display = "none";
  btnLogin.style.display = "none";
  btnLogout.style.display = "inline-block";
};

// 📝 Open Report Modal
btnReportLost.onclick = () => openReport("Lost");
btnReportFound.onclick = () => openReport("Found");
btnCloseReport.onclick = () => reportModal.style.display = "none";

function openReport(type) {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  document.getElementById("reportTitle").innerText = `📝 Report ${type}`;
  document.getElementById("reportType").value = type;
  reportModal.style.display = "flex";
}

// 📩 Submit Report
btnSubmitReport.onclick = async () => {
  const type = document.getElementById("reportType").value;
  const item = document.getElementById("reportItem").value;
  const loc = document.getElementById("reportLocation").value;
  const desc = document.getElementById("reportDesc").value;
  const imgFile = document.getElementById("reportImg").files[0];

  let imgURL = "";
  if (imgFile) {
    const imgRef = ref(storage, "reports/" + Date.now() + "-" + imgFile.name);
    await uploadBytes(imgRef, imgFile);
    imgURL = await getDownloadURL(imgRef);
  }

  await addDoc(collection(db, "reports"), {
    type, item, loc, desc, img: imgURL,
    reporter: currentUser.name,
    rphone: currentUser.phone,
    status: "Not Claimed"
  });

  reportModal.style.display = "none";
  loadReports();
};

// 📋 Load Reports
async function loadReports() {
  reportsContainer.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "reports"));
  querySnapshot.forEach(docSnap => {
    let data = docSnap.data();
    let card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <h3>${data.type} - ${data.item}</h3>
      <p>📍 ${data.loc}</p>
      <p>${data.desc}</p>
      ${data.img ? `<img src="${data.img}">` : ""}
      <p>👤 ${data.reporter} (${data.rphone})</p>
      <p>Status: ${data.status}</p>
      ${data.status === "Not Claimed" ? `<button onclick="claimItem('${docSnap.id}')">✅ Claim</button>` : "✔️ Claimed"}
    `;
    reportsContainer.appendChild(card);
  });
}

// ✅ Claim Item
window.claimItem = async (id) => {
  await updateDoc(doc(db, "reports", id), { status: "Claimed" });
  alert("Item claimed ✅");
  loadReports();
};

// Load reports on startup
loadReports();
