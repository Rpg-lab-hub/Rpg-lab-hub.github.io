import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://cayzvquvwsntzintrwkv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheXp2cXV2d3NudHppbnRyd2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzUxODUsImV4cCI6MjA3NDE1MTE4NX0.ziW9cWXT8IzeRny3TKr8ABVuEMEhcQ-84LlsfFJHynQ"; // Substitua pelo seu anon key
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentEditingSheet = null;

// Sections
const loginSection = document.getElementById("login-section");
const masterSection = document.getElementById("master-section");
const playerSection = document.getElementById("player-section");

// --- LOGIN ---
document.getElementById("login-btn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;
  if (!name) return alert("Digite seu nome");

  let { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("name", name)
    .single();

  if (!userData) {
    const { data } = await supabase
      .from("users")
      .insert([{ name, role }])
      .select()
      .single();
    userData = data;
  }

  currentUser = userData;
  loginSection.classList.add("hidden");

  if (currentUser.role === "mestre") {
    masterSection.classList.remove("hidden");
    loadCampaigns();
  } else {
    playerSection.classList.remove("hidden");
    loadPlayerSheets();
  }
});

// --- MESTRE FUNCTIONS ---
let selectedCampaignId = null; // Variável global para a campanha selecionada

async function loadCampaigns() {
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("master_id", currentUser.id);

  const campaignList = document.getElementById("campaign-list");
  campaignList.innerHTML = "";

  campaigns.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.name;

    li.onclick = () => {
      document.querySelectorAll("#campaign-list li").forEach(item => {
        item.classList.remove("selected");
      });
      li.classList.add("selected");

      selectedCampaignId = c.id; // Guarda a campanha selecionada
      document.getElementById("add-player-section").classList.remove("hidden"); // mostra input
      loadPlayersAndSheets(c.id);
    };

    campaignList.appendChild(li);
  });
}

// Adicionar jogador
document.getElementById("add-player-btn").addEventListener("click", async () => {
  const playerName = document.getElementById("new-player-name").value.trim();
  if (!playerName || !selectedCampaignId) return;

  // Cria usuário se não existir
  let { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("name", playerName)
    .single();

  let userId;
  if (!existingUser) {
    const { data: newUser } = await supabase
      .from("users")
      .insert([{ name: playerName }])
      .select()
      .single();
    userId = newUser.id;
  } else {
    userId = existingUser.id;
  }

  // Adiciona jogador à campanha
  await supabase
    .from("player_campaigns")
    .insert([{ campaign_id: selectedCampaignId, player_id: userId }]);

  document.getElementById("new-player-name").value = "";
  loadPlayersAndSheets(selectedCampaignId); // Atualiza lista de jogadores
});



async function loadPlayersAndSheets(campaignId) {
  if (!campaignId) return;

  const container = document.getElementById("player-cards");
  container.innerHTML = "<p>Carregando jogadores...</p>";

  try {
    // 1️⃣ Busca todos os jogadores da campanha via relacionamento player_campaigns -> users
    const { data: players, error: playerError } = await supabase
      .from("player_campaigns")
      .select(`
        player_id,
        users!inner(name)
      `)
      .eq("campaign_id", campaignId);

    if (playerError) throw playerError;

    container.innerHTML = ""; // Limpa container

    for (let pc of players) {
      // 2️⃣ Busca a ficha do jogador na campanha
      const { data: sheet, error: sheetError } = await supabase
        .from("sheets")
        .select("*")
        .eq("player_id", pc.player_id)
        .eq("campaign_id", campaignId)
        .maybeSingle(); // permite retornar null se não existir ficha

      if (sheetError && sheetError.code !== "PGRST116") {
        console.error("Erro ao buscar ficha:", sheetError);
      }

      // 3️⃣ Cria o card do jogador
      const card = document.createElement("div");
      card.className = "player-card";

      const nameEl = document.createElement("h4");
      nameEl.textContent = pc.users.name;
      card.appendChild(nameEl);

      // 4️⃣ Exibe informações da ficha se existir
      if (sheet) {
        const info = document.createElement("div");
        info.innerHTML = `
          <p>Ficha: ${sheet.name || "Sem nome"}</p>
          <p>Rank: ${sheet.rank || 0}</p>
          <p>Saúde: ${sheet.health || 0}</p>
          <p>Sanidade: ${sheet.sanity || 0}</p>
          <p>Força: ${sheet.strength || 0}</p>
          <p>Destreza: ${sheet.dexterity || 0}</p>
          <p>Inteligência: ${sheet.intelligence || 0}</p>
        `;
        card.appendChild(info);
      } else {
        const info = document.createElement("p");
        info.textContent = "Ficha não criada ainda";
        card.appendChild(info);
      }

      // 5️⃣ Botão Editar
      const editBtn = document.createElement("button");
      editBtn.textContent = "Editar Ficha";
      editBtn.className = "edit-btn";
      editBtn.onclick = () => {
        if (sheet) editSheet(sheet);
      };

      // 6️⃣ Botão Excluir
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Excluir Ficha";
      deleteBtn.className = "delete-btn";
      deleteBtn.onclick = async () => {
        if (!sheet) return;
        await supabase.from("sheets").delete().eq("id", sheet.id);
        loadPlayersAndSheets(campaignId); // Atualiza lista
      };

      card.appendChild(editBtn);
      card.appendChild(deleteBtn);

      container.appendChild(card);
    }

    if (players.length === 0) {
      container.innerHTML = "<p>Nenhum jogador nesta campanha.</p>";
    }

  } catch (err) {
    console.error("Erro ao carregar jogadores:", err);
    container.innerHTML = "<p>Erro ao carregar jogadores.</p>";
  }
}



async function loadPlayers(campaignId) {
  const { data } = await supabase
    .from("player_campaigns")
    .select("player_id, users(name)")
    .eq("campaign_id", campaignId)
    .join("users", "users.id", "player_campaigns.player_id");

  const container = document.getElementById("player-cards");
  container.innerHTML = "";

  data.forEach(pc => {
    const card = document.createElement("div");
    card.className = "player-card";

    const nameEl = document.createElement("h4");
    nameEl.textContent = pc.users.name;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar Ficha";
    editBtn.className = "edit-btn";
    editBtn.onclick = async () => {
      const { data: sheet } = await supabase
        .from("sheets")
        .select("*")
        .eq("player_id", pc.player_id)
        .eq("campaign_id", campaignId)
        .single();
      if (sheet) editSheet(sheet);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Excluir Ficha";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = async () => {
      const { data: sheet } = await supabase
        .from("sheets")
        .select("*")
        .eq("player_id", pc.player_id)
        .eq("campaign_id", campaignId)
        .single();
      if (sheet) {
        await supabase.from("sheets").delete().eq("id", sheet.id);
        loadPlayers(campaignId);
      }
    };

    card.appendChild(nameEl);
    card.appendChild(editBtn);
    card.appendChild(deleteBtn);
    container.appendChild(card);
  });
}



document.getElementById("create-sheet-btn").addEventListener("click", async () => {
  const campaignId = document.getElementById("campaign-select").value;
  const playerName = document.getElementById("player-name").value.trim();
  const sheetName = document.getElementById("sheet-name").value.trim();
  if (!campaignId || !playerName || !sheetName) return alert("Preencha todos os campos");

  // Cria ou pega jogador
  let { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("name", playerName)
    .single();

  if (!player) {
    const { data } = await supabase
      .from("users")
      .insert([{ name: playerName, role: "player" }])
      .select()
      .single();
    player = data;
  }

  await supabase.from("player_campaigns").insert([{ player_id: player.id, campaign_id: campaignId }]);
  await supabase.from("sheets").insert([{ player_id: player.id, campaign_id: campaignId, name: sheetName }]);

  document.getElementById("player-name").value = "";
  document.getElementById("sheet-name").value = "";
  loadPlayers();
});

function editSheet(sheet) {
  currentEditingSheet = sheet;
  document.getElementById("edit-sheet-section").classList.remove("hidden");
  document.getElementById("sheet-edit-name").value = sheet.name;
  document.getElementById("sheet-edit-rank").value = sheet.rank || 0;
  document.getElementById("sheet-edit-health").value = sheet.health || 0;
  document.getElementById("sheet-edit-sanity").value = sheet.sanity || 0;
  document.getElementById("sheet-edit-strength").value = sheet.strength || 0;
  document.getElementById("sheet-edit-dexterity").value = sheet.dexterity || 0;
  document.getElementById("sheet-edit-intelligence").value = sheet.intelligence || 0;
  document.getElementById("sheet-edit-skills").value = JSON.stringify(sheet.skills || {});
  document.getElementById("sheet-edit-equipment").value = JSON.stringify(sheet.equipment || {});
}

document.getElementById("save-sheet-btn").addEventListener("click", async () => {
  if (!currentEditingSheet) return;
  const updated = {
    name: document.getElementById("sheet-edit-name").value,
    rank: Number(document.getElementById("sheet-edit-rank").value),
    health: Number(document.getElementById("sheet-edit-health").value),
    sanity: Number(document.getElementById("sheet-edit-sanity").value),
    strength: Number(document.getElementById("sheet-edit-strength").value),
    dexterity: Number(document.getElementById("sheet-edit-dexterity").value),
    intelligence: Number(document.getElementById("sheet-edit-intelligence").value),
    skills: JSON.parse(document.getElementById("sheet-edit-skills").value || "{}"),
    equipment: JSON.parse(document.getElementById("sheet-edit-equipment").value || "{}")
  };
  await supabase.from("sheets").update(updated).eq("id", currentEditingSheet.id);
  document.getElementById("edit-sheet-section").classList.add("hidden");
  loadPlayers();
});

// --- JOGADOR FUNCTIONS ---
async function loadPlayerSheets() {
  const { data } = await supabase
    .from("sheets")
    .select("*")
    .eq("player_id", currentUser.id);

  const list = document.getElementById("player-sheets");
  list.innerHTML = "";

  data.forEach(sheet => {
    const li = document.createElement("li");
    li.textContent = sheet.name;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.classList.add("action-btn");
    editBtn.onclick = () => editPlayerSheet(sheet);

    li.appendChild(editBtn);
    list.appendChild(li);
  });
}

function editPlayerSheet(sheet) {
  currentEditingSheet = sheet;
  document.getElementById("edit-player-sheet-section").classList.remove("hidden");
  document.getElementById("player-sheet-edit-name").value = sheet.name;
  document.getElementById("player-sheet-edit-rank").value = sheet.rank || 0;
  document.getElementById("player-sheet-edit-health").value = sheet.health || 0;
  document.getElementById("player-sheet-edit-sanity").value = sheet.sanity || 0;
  document.getElementById("player-sheet-edit-strength").value = sheet.strength || 0;
  document.getElementById("player-sheet-edit-dexterity").value = sheet.dexterity || 0;
  document.getElementById("player-sheet-edit-intelligence").value = sheet.intelligence || 0;
  document.getElementById("player-sheet-edit-skills").value = JSON.stringify(sheet.skills || {});
  document.getElementById("player-sheet-edit-equipment").value = JSON.stringify(sheet.equipment || {});
}

document.getElementById("player-save-sheet-btn").addEventListener("click", async () => {
  if (!currentEditingSheet) return;
  const updated = {
    name: document.getElementById("player-sheet-edit-name").value,
    rank: Number(document.getElementById("player-sheet-edit-rank").value),
    health: Number(document.getElementById("player-sheet-edit-health").value),
    sanity: Number(document.getElementById("player-sheet-edit-sanity").value),
    strength: Number(document.getElementById("player-sheet-edit-strength").value),
    dexterity: Number(document.getElementById("player-sheet-edit-dexterity").value),
    intelligence: Number(document.getElementById("player-sheet-edit-intelligence").value),
    skills: JSON.parse(document.getElementById("player-sheet-edit-skills").value || "{}"),
    equipment: JSON.parse(document.getElementById("player-sheet-edit-equipment").value || "{}")
  };
  await supabase.from("sheets").update(updated).eq("id", currentEditingSheet.id);
  document.getElementById("edit-player-sheet-section").classList.add("hidden");
  loadPlayerSheets();
});
