// Tvoja Firebase konfiguracija
const firebaseConfig = {
  apiKey: "AIzaSyC9g2dM__ZHZiCjS6Qekq2YBle5SLxVM0k",
  authDomain: "tesla-smjena.firebaseapp.com",
  databaseURL: "https://tesla-smjena-default-rtdb.firebaseio.com",
  projectId: "tesla-smjena",
  storageBucket: "tesla-smjena.firebasestorage.app",
  messagingSenderId: "648346386918",
  appId: "1:648346386918:web:c38f9e6b376b16f918d627"
};

// Inicijalizacija Firebase-a
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Generišemo datum za SJUTRA u formatu GGGG-MM-DD
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const yyyy = tomorrow.getFullYear();
const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
const dd = String(tomorrow.getDate()).padStart(2, '0');
const tomorrowKey = `${yyyy}-${mm}-${dd}`; 

const dbRef = firebase.database().ref("smjene/" + tomorrowKey);

// Globalne varijable za praćenje sortiranja
let currentSortCol = -1;
let currentSortAsc = true;
let localFirebaseData = {}; // Čuvamo lokalnu kopiju podataka iz baze

window.onload = function() {
  document.getElementById("tomorrowDateDisplay").innerText = `📅 Raspored za sjutra: ${dd}.${mm}.${yyyy}.`;
  buildEmptyTable();
  listenToFirebase();
};

// 1. Kreiranje početne strukture tabele (30 redova)
function buildEmptyTable() {
  const body = document.getElementById("tableBody");
  body.innerHTML = "";
  
  for (let i = 1; i <= 30; i++) {
    const vehicleNum = `T-${String(i).padStart(2, '0')}`;
    
    body.innerHTML += `
      <tr id="row-${i}" data-row-id="${i}">
        <td class="cell-vehicle" style="font-weight: bold; color: #38bdf8; width: 25%;">${vehicleNum}</td>
        <td>
          <input id="driver-${i}" type="text" placeholder="Unesi ime vozača..." onchange="updateFirebase(${i}, '${vehicleNum}')">
        </td>
        <td style="width: 35%;">
          <input id="shift-${i}" type="text" placeholder="Npr. Prva, Druga..." onchange="updateFirebase(${i}, '${vehicleNum}')">
        </td>
        <td>
          <button type="button" class="btn-delete-row" onclick="clearRow(${i})" title="Obriši ovaj red">❌</button>
        </td>
      </tr>
    `;
  }
}

// 2. Osluškivanje izmjena iz Firebase-a u realnom vremenu
function listenToFirebase() {
  dbRef.on("value", function(snapshot) {
    localFirebaseData = snapshot.val() || {};
    updateTableValues();
  });
}

// Pomoćna funkcija koja popunjava vrijednosti bez ponovnog generisanja HTML-a (čuva sort)
function updateTableValues() {
  for (let i = 1; i <= 30; i++) {
    const driverInput = document.getElementById(`driver-${i}`);
    const shiftInput = document.getElementById(`shift-${i}`);
    
    if (localFirebaseData[i]) {
      if (document.activeElement !== driverInput) {
        driverInput.value = localFirebaseData[i].driver || "";
      }
      if (document.activeElement !== shiftInput) {
        shiftInput.value = localFirebaseData[i].shift || "";
      }
    } else {
      if (document.activeElement !== driverInput) driverInput.value = "";
      if (document.activeElement !== shiftInput) shiftInput.value = "";
    }
  }
  
  // Ako je aktivno sortiranje, ponovo sortiraj redove na osnovu novih podataka
  if (currentSortCol !== -1) {
    applySortLogic(currentSortCol, false);
  } else {
    filterTable();
  }
}

// 3. Automatski upis u Firebase
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

// 4. Brisanje pojedinačnog vozača klikom na ❌
function clearRow(rowId) {
  document.getElementById(`driver-${rowId}`).value = "";
  document.getElementById(`shift-${rowId}`).value = "";
  
  // Brišemo granu iz Firebase-a za taj id vozila
  firebase.database().ref(`smjene/${tomorrowKey}/${rowId}`).remove()
    .catch(function(error) {
      console.error("Greška pri brisanju reda: ", error);
    });
}

// 5. Brisanje CIJELOG rasporeda odjednom
function clearEntireSchedule() {
  if (confirm("Da li ste sigurni da želite obrisati SVA IMENA I SMJENE za sjutrašnji dan?")) {
    dbRef.remove()
      .then(function() {
        alert("Cijeli raspored je uspješno obrisan!");
      })
      .catch(function(error) {
        console.error("Greška pri brisanju cijele baze: ", error);
      });
  }
}

// 6. Filtriranje tabele u realnom vremenu
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

    if (matchVehicle && matchDriver && matchShift) {
      row.classList.remove("hidden-row");
    } else {
      row.classList.add("hidden-row");
    }
  }
}

// 7. Sortiranje kolona (0 = Vozilo, 1 = Vozač, 2 = Smjena)
function sortTable(colIndex) {
  if (currentSortCol === colIndex) {
    currentSortAsc = !currentSortAsc; // Obrni smjer ako klikneš opet na istu kolonu
  } else {
    currentSortCol = colIndex;
    currentSortAsc = true; // Defaultno uzlazno
  }
  
  // Ažuriraj vizuelne strelice u zaglavlju
  for (let i = 0; i <= 2; i++) {
    const indicator = document.getElementById(`sortSort${i}`);
    if (i === colIndex) {
      indicator.innerText = currentSortAsc ? "▲" : "▼";
    } else {
      indicator.innerText = "↕";
    }
  }

  applySortLogic(colIndex, true);
}

// Logika koja fizički pomijera HTML redove u tabeli na osnovu vrijednosti polja
function applySortLogic(colIndex, runFilter = true) {
  const tbody = document.getElementById("tableBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((rowA, rowB) => {
    const idA = rowA.getAttribute("data-row-id");
    const idB = rowB.getAttribute("data-row-id");
    
    let valA = "", valB = "";

    if (colIndex === 0) {
      // Sortiranje po broju vozila (T-01, T-02...)
      valA = `T-${String(idA).padStart(2, '0')}`;
      valB = `T-${String(idB).padStart(2, '0')}`;
    } else if (colIndex === 1) {
      // Po imenu vozača iz input polja
      valA = document.getElementById(`driver-${idA}`).value.toLowerCase().trim();
      valB = document.getElementById(`driver-${idB}`).value.toLowerCase().trim();
    } else if (colIndex === 2) {
      // Po nazivu smjene iz input polja
      valA = document.getElementById(`shift-${idA}`).value.toLowerCase().trim();
      valB = document.getElementById(`shift-${idB}`).value.toLowerCase().trim();
    }

    // Guranje praznih polja na dno bez obzira na smjer sortiranja
    if (valA === "" && valB !== "") return 1;
    if (valA !== "" && valB === "") return -1;
    if (valA === "" && valB === "") return 0;

    return currentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Primijeni novi raspored redova u HTML-u
  rows.forEach(row => tbody.appendChild(row));

  if (runFilter) {
    filterTable();
  }
}

// 8. Resetovanje svih filtera i vraćanje na fabrički sort (po broju vozila)
function resetFilters() {
  document.getElementById("filterVehicle").value = "";
  document.getElementById("filterDriver").value = "";
  document.getElementById("filterShift").value = "";
  
  // Resetuj i sortiranje na početno stanje
  currentSortCol = -1;
  currentSortAsc = true;
  for (let i = 0; i <= 2; i++) {
    document.getElementById(`sortSort${i}`).innerText = "↕";
  }
  
  // Vrati redoslijed redova od 1 do 30
  const tbody = document.getElementById("tableBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  rows.sort((a, b) => parseInt(a.getAttribute("data-row-id")) - parseInt(b.getAttribute("data-row-id")));
  rows.forEach(row => tbody.appendChild(row));
  
  filterTable();
}
