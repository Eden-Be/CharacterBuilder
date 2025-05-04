import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJl1aYPEhSuJrxAC_Rdp05V8phXUPtBEY",
    authDomain: "monappauthfirebase.firebaseapp.com",
    projectId: "monappauthfirebase",
    storageBucket: "monappauthfirebase.firebasestorage.app",
    messagingSenderId: "440942443590",
    appId: "1:440942443590:web:2c25695d8f6ba2ad7dde47",
    measurementId: "G-LT09P8FK09"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let items = {};
let selectedClassId = null;
let selectedClassName = null;
let equippedItems = {};
let savedBuilds = [];
let characterLevel = 1;

export async function getItems() {
    try {
        const querySnapshot = await getDocs(collection(db, "items"));
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            items[item.id] = item;
        });
    } catch (e) {
        console.error("Erreur lors de la récupération des documents :", e);
    }
}

await getItems();

export async function choisirClasse(classe) {
    const imageMap = {
        'Aventurier': 'Aventurier.png',
        'Mage': 'Mage.png',
        'Épéiste': 'Epeiste.png',
        'Archer': 'Archer.png'
    };

    const classMapping = {
        'Aventurier': 1,
        'Épéiste': 2,
        'Archer': 4,
        'Mage': 8
    };

    selectedClassId = classMapping[classe];
    selectedClassName = classe;
    document.getElementById('selected-class').textContent = classe;

    const img = document.getElementById('class-image');
    img.src = imageMap[classe];
    img.style.display = 'block';
    document.getElementById('equipment-section').style.display = 'block';

    equippedItems = {};
    const labelMap = {
        "Slot 1": "Masque",
        "Slot 2": "Spécialist",
        "Slot 3": "Fairies",
        "Slot 4": "Arme",
        "Slot 5": "Arme secondaire",
        "Slot 6": "Gants",
        "Slot 7": "Armure",
        "Slot 8": "Bottes"
    };

    document.querySelectorAll('.equipment-slot').forEach(div => {
        const slotName = div.getAttribute('data-slot');
        const label = labelMap[slotName] || slotName;
        div.innerHTML = `<button onclick="handleEquipmentClick('${slotName}')">${label}</button>`;
    });

    document.getElementById('equipment-list').innerHTML = "";
}

export async function handleEquipmentClick(slot) {
    const listContainer = document.getElementById('equipment-list');
    listContainer.innerHTML = "";

    const levelInput = document.getElementById("characterLevel").value;
    const currentLevel = parseInt(levelInput) || 1;

    const displayRules = {
        'Slot 4': { itemType: 0, subTypeMap: { 1: 0, 2: 1, 4: 6, 8: 9 }, label: "Armes", requiresClass: true },
        'Slot 5': { itemType: 0, subTypeMap: { 1: 5, 2: 5, 4: 3, 8: 8 }, label: "Armes secondaire", requiresClass: true },
        'Slot 7': { itemType: 1, subTypeMap: { 1: 0, 2: 3, 4: 2, 8: 1 }, label: "Armures", requiresClass: true },
        'Slot 2': { itemType: 4, subTypeMap: { 1: 0, 2: 1, 4: 1, 8: 1 }, label: "Specialist", requiresClass: true },
        'Slot 3': { itemType: 3, itemSubType: 3, fixedClass: 15, label: "Fairies", requiresClass: false },
        'Slot 8': { itemType: 2, itemSubType: 3, fixedClass: 0, label: "Bottes", requiresClass: false },
        'Slot 6': { itemType: 2, itemSubType: 2, fixedClass: 0, label: "Gants", requiresClass: false }
    };

    if (!(slot in displayRules)) {
        alert(`Vous avez cliqué sur ${slot}`);
        return;
    }

    const rule = displayRules[slot];

    if (rule.requiresClass && !selectedClassId) {
        alert("Veuillez d'abord choisir une classe.");
        return;
    }

    let filtered;

    if (rule.requiresClass) {
        const itemSubType = rule.subTypeMap[selectedClassId];
        filtered = Object.values(items).filter(item =>
            (item.class === selectedClassId || item.class === 0 || item.class === 15) &&
            item.itemType === rule.itemType &&
            item.itemSubType === itemSubType &&
            item.minLevel <= currentLevel
        );
    } else {
        filtered = Object.values(items).filter(item =>
            item.class === rule.fixedClass &&
            item.itemType === rule.itemType &&
            item.itemSubType === rule.itemSubType &&
            item.minLevel <= currentLevel
        );
    }

    listContainer.innerHTML = `<h3>${rule.label}${selectedClassName ? " pour " + selectedClassName : ""}</h3>`;
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `
            <img src="https://itempicker.atlagaming.eu/api/items/icon/${item.iconId}" alt="${item.name}" style="width:30px; vertical-align:middle; margin-right:5px;">
            <strong>${item.name}</strong> - Niveau ${item.minLevel}
            <button onclick="equiperItem('${slot}', ${item.id})" style="margin-left: 10px;">Équiper</button>
        `;
        listContainer.appendChild(div);
    });
}

export async function equiperItem(slot, itemId) {
    const item = items[itemId];

    const levelInput = document.getElementById("characterLevel").value;
    const currentLevel = parseInt(levelInput) || 1;

    if (item.minLevel > currentLevel) {
        alert(`Niveau insuffisant pour équiper cet objet (nécessite niveau ${item.minLevel}).`);
        return;
    }

    if (equippedItems[slot]) {
        alert("Cet emplacement est déjà occupé. Veuillez retirer l'équipement avant d'en équiper un autre.");
        return;
    }

    if (!item) {
        alert("Équipement introuvable.");
        return;
    }

    equippedItems[slot] = item;

    const slotDiv = document.querySelector(`.equipment-slot[data-slot='${slot}']`);
    if (slotDiv) {
        slotDiv.innerHTML = `
            <div onclick="handleEquipmentClick('${slot}')" style="cursor:pointer;">
              <img src="https://itempicker.atlagaming.eu/api/items/icon/${item.iconId}" title="${item.name}" style="width:50px;"><br>
              <small style="font-size:10px;">Cliquez pour changer</small>
              <button onclick="event.stopPropagation(); desequiperItem('${slot}')" style="font-size:10px; margin-top:3px;">Retirer</button>
            </div>
        `;
    }

    ajouterStats(item);
    document.getElementById('equipment-list').innerHTML = `<strong>${item.name}</strong> équipé dans ${slot}`;
}

export async function desequiperItem(slot) {
    const item = equippedItems[slot];
    delete equippedItems[slot];

    const labelMap = {
        "Slot 1": "Masque",
        "Slot 2": "Spécialist",
        "Slot 3": "Fairies",
        "Slot 4": "Arme",
        "Slot 5": "Arme secondaire",
        "Slot 6": "Gants",
        "Slot 7": "Armure",
        "Slot 8": "Bottes"
    };
    const slotDiv = document.querySelector(`.equipment-slot[data-slot='${slot}']`);
    const label = labelMap[slot] || slot;
    slotDiv.innerHTML = `<button onclick="handleEquipmentClick('${slot}')">${label}</button>`;

    retirerStats(item);
    document.getElementById('equipment-list').innerHTML = `<strong>${slot}</strong> retiré`;
}

function ajouterStats(item) {
    const stats = [
        "closeDefence", "distanceDefence", "magicDefence", "defenceDodge",
        "fireResistance", "waterResistance", "lightResistance", "darkResistance",
        "heroic", "minDamage", "maxDamage", "hitRate", "criticalChance",
        "criticalDamage", "concentration"
    ];
    stats.forEach(stat => {
        const el = document.getElementById(stat);
        el.textContent = parseInt(el.textContent || 0) + parseInt(item[stat] || 0);
    });
}

function retirerStats(item) {
    const stats = [
        "closeDefence", "distanceDefence", "magicDefence", "defenceDodge",
        "fireResistance", "waterResistance", "lightResistance", "darkResistance",
        "heroic", "minDamage", "maxDamage", "hitRate", "criticalChance",
        "criticalDamage", "concentration"
    ];
    stats.forEach(stat => {
        const el = document.getElementById(stat);
        el.textContent = parseInt(el.textContent || 0) - parseInt(item[stat] || 0);
    });
}

function mettreAJourSelectBuilds() {
    const select = document.getElementById("buildsSelect");
    select.innerHTML = `<option value="">-- Sélectionner un build --</option>`;
    savedBuilds.forEach((build, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${build.nom} (${build.classe} lvl ${build.niveau})`;
        select.appendChild(option);
    });
}

export function sauvegarderBuild() {
    const buildName = document.getElementById("buildName").value || "Sans nom";
    const levelInput = document.getElementById("characterLevel").value;
    characterLevel = parseInt(levelInput) || 1;

    if (!selectedClassName) {
        alert("Veuillez d'abord choisir une classe.");
        return;
    }

    const build = {
        nom: buildName,
        niveau: characterLevel,
        classe: selectedClassName,
        equipements: { ...equippedItems }
    };

    savedBuilds.push(build);
    alert(`Build "${buildName}" sauvegardé.`);
    mettreAJourSelectBuilds();
}

export function nouveauBuild() {
    const statIds = [
        "closeDefence", "distanceDefence", "magicDefence", "defenceDodge",
        "fireResistance", "waterResistance", "lightResistance", "darkResistance",
        "heroic", "minDamage", "maxDamage", "hitRate", "criticalChance",
        "criticalDamage", "concentration"
    ];
    statIds.forEach(id => document.getElementById(id).textContent = "0");

    selectedClassId = null;
    selectedClassName = null;
    equippedItems = {};
    characterLevel = 1;

    document.getElementById('selected-class').textContent = "";
    document.getElementById('class-image').src = "";
    document.getElementById('equipment-section').style.display = "none";
    document.getElementById('equipment-list').innerHTML = "";
    document.getElementById("buildName").value = "";
    document.getElementById("characterLevel").value = "";
}

export async function chargerBuild() {
    const select = document.getElementById("buildsSelect");
    const index = select.value;
    if (index === "") {
        alert("Veuillez sélectionner un build.");
        return;
    }

    const build = savedBuilds[index];
    nouveauBuild();
    document.getElementById("buildName").value = build.nom;
    document.getElementById("characterLevel").value = build.niveau;
    characterLevel = build.niveau;

    await choisirClasse(build.classe);

    for (const slot in build.equipements) {
        const item = build.equipements[slot];
        equippedItems[slot] = item;

        const slotDiv = document.querySelector(`.equipment-slot[data-slot='${slot}']`);
        slotDiv.innerHTML = `
            <div onclick="handleEquipmentClick('${slot}')" style="cursor:pointer;">
              <img src="https://itempicker.atlagaming.eu/api/items/icon/${item.iconId}" title="${item.name}" style="width:50px;"><br>
              <small style="font-size:10px;">Cliquez pour changer</small>
              <button onclick="event.stopPropagation(); desequiperItem('${slot}')" style="font-size:10px; margin-top:3px;">Retirer</button>
            </div>
        `;

        ajouterStats(item);
    }

    document.getElementById('equipment-list').innerHTML = `<strong>Build "${build.nom}" rechargé.</strong>`;
}
