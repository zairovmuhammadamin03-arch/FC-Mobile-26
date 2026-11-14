
const topics = [
    "Futbol tarixi", "Real Madrid", "Barcelona", "Manchester City",
    "Manchester United", "Liverpool", "Bayern Munich", "PSG",
    "Cristiano Ronaldo", "Lionel Messi", "Neymar", "Mbappe",
    "Haaland", "Vinicius", "Futbol qoidalari", "Jahon chempionati",
    "Champions League", "Premier League", "La Liga", "Serie A",
    "Arsenal", "Chelsea", "Juventus", "Inter"
];

const questions = [
    { q: "Futbol jamoasida nechta asosiy futbolchi bo‘ladi?", a: ["9", "10", "11", "12"], correct: 2 },
    { q: "Futbol uchrashuvi odatda necha daqiqa davom etadi?", a: ["60", "90", "100", "120"], correct: 1 },
    { q: "Darvozabonning vazifasi nima?", a: ["Gol urish", "To‘pni qaytarish", "Hakamlik", "Pas berish"], correct: 1 },
    { q: "Champions League qaysi sport musobaqasi?", a: ["Basketbol", "Tennis", "Futbol", "Voleybol"], correct: 2 },
    { q: "Qizil kartochka nimani anglatadi?", a: ["Ogohlantirish", "Maydondan chetlatish", "Gol", "Almashtirish"], correct: 1 },
    { q: "Penalti nuqtasi darvozadan qancha uzoqda?", a: ["9 metr", "11 metr", "15 metr", "7 metr"], correct: 1 },
    { q: "Bir jamoa maydonda nechta darvozabon bilan o‘ynaydi?", a: ["1", "2", "3", "4"], correct: 0 }
];

const packData = {
    GK: [["Courtois",105],["Alisson",103],["Neuer",102],["Donnarumma",101],["Ederson",100]],
    LB: [["Theo Hernandez",105],["Davies",104],["Robertson",102],["Cancelo",101],["Shaw",100]],
    CB: [["Van Dijk",105],["Rudiger",104],["Saliba",103],["Dias",102],["Araujo",100]],
    RB: [["Hakimi",105],["Alexander-Arnold",104],["Walker",102],["Carvajal",101],["Kounde",100]],
    CM: [["Bellingham",105],["De Bruyne",105],["Valverde",103],["Modric",102],["Pedri",101]],
    CAM: [["Wirtz",105],["Musiala",104],["Odegaard",103],["Bruno Fernandes",102],["Dybala",100]],
    LW: [["Vinicius Jr",105],["Neymar",104],["Leao",103],["Rafael",102],["Son",101]],
    ST: [["Haaland",105],["Mbappe",105],["Kane",103],["Lewandowski",102],["Osimhen",101]],
    RW: [["Salah",105],["Messi",105],["Saka",103],["Rodrygo",102],["Dembele",101]]
};

const packs = [
    ["GK","Darvozabon paketi"],
    ["LB","Chap himoyachi paketi"],
    ["CB","Markaziy himoyachi paketi"],
    ["RB","O‘ng himoyachi paketi"],
    ["CM","Markaziy yarim himoyachi paketi"],
    ["CAM","Hujumkor yarim himoyachi paketi"],
    ["LW","Chap qanot hujumchisi paketi"],
    ["ST","Hujumchi paketi"],
    ["RW","O‘ng qanot hujumchisi paketi"]
];

// 4-3-3 sxemasi
const formation = [
    "LW", "ST", "RW",
    "CM", "CAM", "CM",
    "LB", "CB", "CB", "RB",
    "GK"
];

let state = JSON.parse(localStorage.getItem("fcQuizSave")) || {
    coins: 0,
    completed: [],
    players: [],
    currentDay: null,
    questionIndex: 0,
    score: 0
};

// Eski saqlangan ma'lumotlarni yangi tizimga moslashtirish
if (!state.lineup) state.lineup = {};
if (!state.bench) state.bench = [];

state.players = state.players || [];
state.completed = state.completed || [];

// Eski futbolchilarni avtomatik joylashtirish
function migratePlayers() {
    const alreadyPlaced = new Set(Object.values(state.lineup).map(String));

    formation.forEach((position, index) => {
        if (state.lineup[index]) return;

        const player = [...state.players]
            .sort((a, b) => b.ovr - a.ovr)
            .find(p =>
                p.position === position &&
                !alreadyPlaced.has(String(p.id))
            );

        if (player) {
            state.lineup[index] = player.id;
            alreadyPlaced.add(String(player.id));
        }
    });

    state.players.forEach(player => {
        const inLineup = Object.values(state.lineup)
            .some(id => String(id) === String(player.id));

        if (!inLineup && !state.bench.some(id => String(id) === String(player.id))) {
            state.bench.push(player.id);
        }
    });

    save();
}

function save() {
    localStorage.setItem("fcQuizSave", JSON.stringify(state));
}

function getPlayer(id) {
    return state.players.find(p => String(p.id) === String(id));
}

function getPlayerSlot(playerId) {
    return Object.keys(state.lineup).find(
        index => String(state.lineup[index]) === String(playerId)
    );
}

function isInBench(playerId) {
    return state.bench.some(id => String(id) === String(playerId));
}

function showMessage(message) {
    const box = document.getElementById("message");
    box.textContent = message;
    box.style.display = "block";

    setTimeout(() => box.style.display = "none", 2500);
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(page).classList.remove("hidden");

    if (page === "team") renderSquad();
    if (page === "shop") renderShop();
}

function updateWallet() {
    document.getElementById("coins").textContent = state.coins;
}

// QUIZ
function renderDays() {
    const container = document.getElementById("days");
    container.innerHTML = "";

    topics.forEach((topic, index) => {
        const day = index + 1;
        const completed = state.completed.includes(day);
        const unlocked = day === 1 || state.completed.includes(day - 1);

        container.innerHTML += `
            <div class="day ${completed ? "completed" : ""} ${!unlocked ? "locked" : ""}">
                <h3>Kun ${day}</h3>
                <p>${topic}</p>
                <p>${completed ? "✅ Tugallangan" : unlocked ? "🔓 Ochiq" : "🔒 Yopiq"}</p>
                <button ${!unlocked || completed ? "disabled" : ""}
                    onclick="startQuiz(${day})">
                    ${completed ? "Tugallangan" : "Boshlash"}
                </button>
            </div>
        `;
    });
}

function startQuiz(day) {
    state.currentDay = day;
    state.questionIndex = 0;
    state.score = 0;
    save();
    renderQuestion();
}

function renderQuestion() {
    const area = document.getElementById("quizArea");
    const index = state.questionIndex;

    if (index >= 7) {
        finishQuiz();
        return;
    }

    const q = questions[index % questions.length];

    area.innerHTML = `
        <h3>Kun ${state.currentDay} — Savol ${index + 1}/7</h3>
        <p>${q.q}</p>
        ${q.a.map((answer, i) => `
            <button class="answer" onclick="answerQuestion(${i})">${answer}</button>
        `).join("")}
    `;
}

function answerQuestion(choice) {
    const q = questions[state.questionIndex % questions.length];

    if (choice === q.correct) {
        state.score++;
        state.coins++;
        showMessage("+1 FC! To‘g‘ri javob!");
    } else {
        showMessage("Noto‘g‘ri javob!");
    }

    state.questionIndex++;
    save();
    updateWallet();
    setTimeout(renderQuestion, 500);
}

function finishQuiz() {
    const day = state.currentDay;

    if (!state.completed.includes(day)) {
        state.completed.push(day);
    }

    save();

    document.getElementById("quizArea").innerHTML = `
        <h2>🎉 Quiz tugadi!</h2>
        <p>To‘g‘ri javoblar: ${state.score}/7</p>
        <button onclick="renderDays()">Kunlarga qaytish</button>
    `;

    renderDays();
}

// SHOP
function renderShop() {
    document.getElementById("packs").innerHTML = packs.map(([position, name]) => `
        <div class="pack">
            <h3>${name}</h3>
            <p>🎁 5 ta ehtimoliy futbolchi</p>
            <p>🪙 Narxi: 3 FC</p>
            <button onclick="buyPack('${position}')">Sotib olish</button>
        </div>
    `).join("");
}

function buyPack(position) {
    if (state.coins < 3) {
        showMessage("FC yetarli emas!");
        return;
    }

    const options = packData[position];
    const selected = options[Math.floor(Math.random() * options.length)];

    state.coins -= 3;

    const player = {
        id: Date.now() + Math.random(),
        name: selected[0],
        ovr: selected[1],
        position
    };

    state.players.push(player);

    // Yangi futbolchi avval zaxiraga tushadi.
    state.bench.push(player.id);

    save();
    updateWallet();
    renderSquad();

    showMessage(`${player.name} jamoangga qo‘shildi!`);
}

// FUTBOLCHI KARTASI
function makePlayerCard(player) {
    return `
        <div class="player">
            <strong>${player.ovr}</strong>
            <small>${player.position}</small>
            <span class="player-name">${player.name}</span>
        </div>
    `;
}

// ZAXIRADAGI FUTBOLCHINI TARKIBGA QO'YISH YOKI ZAMENA
function placePlayer(playerId, slotIndex) {
    const player = getPlayer(playerId);

    if (!player) return;

    const requiredPosition = formation[slotIndex];

    if (player.position !== requiredPosition) {
        showMessage("Bu futbolchining pozitsiyasi mos emas!");
        return;
    }

    const oldPlayerId = state.lineup[slotIndex];

    // Eski futbolchi bo'lsa, uni zaxiraga chiqaramiz.
    if (oldPlayerId) {
        state.bench = state.bench.filter(
            id => String(id) !== String(oldPlayerId)
        );

        state.bench.push(oldPlayerId);
    }

    // Yangi futbolchini zaxiradan olamiz.
    state.bench = state.bench.filter(
        id => String(id) !== String(playerId)
    );

    // Asosiy tarkibga joylaymiz.
    state.lineup[slotIndex] = playerId;

    save();
    renderSquad();

    showMessage(oldPlayerId ? "ZAMENA bajarildi!" : "Futbolchi tarkibga qo‘yildi!");
}

// ASOSIY TARKIBDAN ZAXIRAGA
function moveToBench(playerId) {
    const slot = getPlayerSlot(playerId);

    if (slot === undefined) return;

    delete state.lineup[slot];

    if (!isInBench(playerId)) {
        state.bench.push(playerId);
    }

    save();
    renderSquad();
    showMessage("Futbolchi zaxiraga olindi!");
}

// FUTBOLCHINI HECH QAYERGA JOYLASHTIRMASLIK
function removeFromSquad(playerId) {
    const slot = getPlayerSlot(playerId);

    if (slot !== undefined) {
        delete state.lineup[slot];
    }

    state.bench = state.bench.filter(
        id => String(id) !== String(playerId)
    );

    save();
    renderSquad();

    showMessage("Futbolchi tarkibdan chiqarildi!");
}

// ZAXIRAGA QAYTARISH
function addToBench(playerId) {
    const slot = getPlayerSlot(playerId);

    if (slot !== undefined) {
        showMessage("Bu futbolchi allaqachon tarkibda!");
        return;
    }

    if (!isInBench(playerId)) {
        state.bench.push(playerId);
    }

    save();
    renderSquad();
    showMessage("Futbolchi zaxiraga qo‘shildi!");
}

// BO'SH POZITSIYALAR VA ZAMENA TUGMALARI
function renderPlayerActions(player) {
    const compatibleSlots = formation
        .map((position, index) => ({ position, index }))
        .filter(item => item.position === player.position);

    return compatibleSlots.map(item => {
        const currentId = state.lineup[item.index];
        const currentPlayer = currentId ? getPlayer(currentId) : null;

        const label = currentPlayer
            ? `ZAMENA: ${currentPlayer.name}`
            : `Bo‘sh ${item.position} joyiga qo‘yish`;

        return `
            <button onclick="placePlayer('${player.id}', ${item.index})">
                ${label}
            </button>
        `;
    }).join("");
}

// JAMOANI CHIZISH
function renderSquad() {
    const slots = document.querySelectorAll(".position-slot");

    formation.forEach((position, index) => {
        const slot = slots[index];
        const playerId = state.lineup[index];
        const player = playerId ? getPlayer(playerId) : null;

        if (!player) {
            slot.innerHTML = `<div class="empty-slot">${position}</div>`;
            return;
        }

        slot.innerHTML = `
            <div>
                ${makePlayerCard(player)}
                <button onclick="moveToBench('${player.id}')">Zaxiraga</button>
                <button onclick="removeFromSquad('${player.id}')">Chiqarish</button>
            </div>
        `;
    });

    // ZAXIRADAGI FUTBOLCHILAR
    const benchPlayers = state.bench
        .map(getPlayer)
        .filter(Boolean);

    document.getElementById("bench").innerHTML =
        benchPlayers.length
            ? benchPlayers.map(player => `
                <div class="player-card">
                    ${makePlayerCard(player)}
                    <p>${player.name}</p>
                    <p>${player.position} | Zaxira</p>
                    ${renderPlayerActions(player)}
                    <button onclick="removeFromSquad('${player.id}')">
                        Tarkibdan chiqarish
                    </button>
                </div>
            `).join("")
            : "<p>Zaxirada futbolchi yo‘q.</p>";

    // HECH QAYERGA JOYLASHTIRILMAGAN FUTBOLCHILAR
    const unassigned = state.players.filter(player =>
        !getPlayerSlot(player.id) && !isInBench(player.id)
    );

    document.getElementById("allPlayers").innerHTML =
        unassigned.length
            ? unassigned.map(player => `
                <div class="player-card">
                    ${makePlayerCard(player)}
                    <p>${player.name}</p>
                    <p>${player.position} | Joylashtirilmagan</p>
                    <button onclick="addToBench('${player.id}')">
                        Zaxiraga qo‘shish
                    </button>
                    ${renderPlayerActions(player)}
                </div>
            `).join("")
            : "<p>Joylashtirilmagan futbolchi yo‘q.</p>";

    // TEAM OVR
    const startingPlayers = formation
        .map((position, index) => getPlayer(state.lineup[index]))
        .filter(Boolean);

    const total = startingPlayers.length
        ? Math.round(
            startingPlayers.reduce((sum, player) => sum + player.ovr, 0) /
            startingPlayers.length
        )
        : 0;

    document.getElementById("teamOVR").textContent =
        `${total} (${startingPlayers.length}/11)`;
}

function init() {
    migratePlayers();
    updateWallet();
    renderDays();
    renderShop();
    renderSquad();
}

init();
