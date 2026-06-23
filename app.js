// Tvoja Firebase konfiguracija (Koristimo tvoje tačne ključeve iz prethodnog projekta)
const firebaseConfig = {
  apiKey: "AIzaSyA_wcdHfOVXJkS4Sm6ihjhaeGyrRjH9r1w",
  authDomain: "tesla-punjaci.firebaseapp.com",
  databaseURL: "https://tesla-punjaci-default-rtdb.firebaseio.com",
  projectId: "tesla-punjaci",
  storageBucket: "tesla-punjaci.firebasestorage.app",
  messagingSenderId: "140620994358",
  appId: "1:140620994358:web:9bd2cbeaee436edea00597"
};

// Inicijalizacija Firebase-a pod novom granom "smjene"
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Generišemo datum za SJUTRA u formatu GGGG-MM-DD radi baze podataka
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const yyyy = tomorrow.getFullYear();
const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
const dd = String(tomorrow.getDate()).padStart(2, '0');
const tomorrowKey = `${yyyy}-${mm}-${dd}`; // Ključ za Firebase (npr. "2026-06-24")

// Referenca u bazi specifična za sjutrašnji datum
const dbRef = firebase.database().ref("smjene/" + tomorrowKey);

window.onload = function() {
  // Prikaz čitljivog datuma na vrhu ekrana za vozače (npr. 24.06.2026)
  document.getElementById("tomorrowDateDisplay").innerText = `📅 Raspored za sjutra: ${dd}.${mm}.${yyyy}.`;
  
  buildEmptyTable();
  listenToFirebase();
};

// 1. Funkcija koja kreira tačno 30 horizontalnih redova sa predefinisanim brojevima vozila
function buildEmptyTable() {
  const body = document.getElementById("tableBody");
  body.innerHTML = "";
  
  for (let i = 1; i <= 30; i++) {
    // Formatiramo broj vozila da bude T-01, T-02... do T-30
    const vehicleNum = `T-${String(i).padStart(2, '0')}`;
    
    body.innerHTML += `
      <tr id="row-${i}">
        <td style="font-weight: bold; color: #38bdf8; width: 25%;">${vehicleNum}</td>
        <td>
          <input id="driver-${i}" type="text" placeholder="Unesi ime vozača..." onchange="updateFirebase(${i}, '${vehicleNum}')">
        </td>
        <td style="width: 35%;">
          <input id="shift-${i}" type="text" placeholder="Npr. Prva, Druga..." onchange="updateFirebase(${i}, '${vehicleNum}')">
        </td>
      </tr>
    `;
  }
}

// 2. Osluškivanje izmjena iz Firebase-a u realnom vremenu
function listenToFirebase() {
  dbRef.on("value", function(snapshot) {
    const data = snapshot.val() || {};
    
    // Prolazimo kroz svih 30 redova i ažuriramo polja ako podaci postoje u bazi
    for (let i = 1; i <= 30; i++) {
      const driverInput = document.getElementById(`driver-${i}`);
      const shiftInput = document.getElementById(`shift-${i}`);
      
      if (data[i]) {
        // Ako vozač trenutno ne piše aktivno u polje, ažuriraj vrijednost iz baze
        if (document.activeElement !== driverInput) {
          driverInput.value = data[i].driver || "";
        }
        if (document.activeElement !== shiftInput) {
          shiftInput.value = data[i].shift || "";
        }
      } else {
        if (document.activeElement !== driverInput) driverInput.value = "";
        if (document.activeElement !== shiftInput) shiftInput.value = "";
      }
    }
    // Nakon što stignu podaci, primijeni filtere ako je nešto upisano u pretrazi
    filterTable();
  });
}

// 3. Automatski upis u Firebase kada vozač klikne van polja ili pritisne Enter
function updateFirebase(rowId, vehicleNum) {
  const driverValue = document.getElementById(`driver-${rowId}`).value.trim();
  const shiftValue = document.getElementById(`shift-${rowId}`).value.trim();
  
  firebase.database().ref(`smjene/${tomorrowKey}/${rowId}`).set({
    vehicle: vehicleNum,
    driver: driverValue,
    shift: shiftValue
  }).catch(function(error) {
    console.error("Greška pri upisu: ", error);
  });
}

// 4. Funkcija za horizontalno filtriranje tabele u realnom vremenu
function filterTable() {
  const fVehicle = document.getElementById("filterVehicle").value.toLowerCase().trim();
  const fDriver = document.getElementById("filterDriver").value.toLowerCase().trim();
  const fShift = document.getElementById("filterShift").value.toLowerCase().trim();

  for (let i = 1; i <= 30; i++) {
    const row = document.getElementById(`row-${i}`);
    const vehicleNum = `T-${String(i).padStart(2, '0')}`.toLowerCase();
    const driverValue = document.getElementById(`driver-${i}`).value.toLowerCase();
    const shiftValue = document.getElementById(`shift-${i}`).value.toLowerCase();

    const matchVehicle = vehicleNum.includes(fVehicle);
    const matchDriver = driverValue.includes(fDriver);
    const matchShift = shiftValue.includes(fShift);

    // Ako red ispunjava sva tri filtera ostaje vidljiv, u suprotnom se sakriva
    if (matchVehicle && matchDriver && matchShift) {
      row.classList.remove("hidden-row");
    } else {
      row.classList.add("hidden-row");
    }
  }
}

// 5. Resetovanje svih horizontalnih filtera na dugme
function resetFilters() {
  document.getElementById("filterVehicle").value = "";
  document.getElementById("filterDriver").value = "";
  document.getElementById("filterShift").value = "";
  filterTable();
}