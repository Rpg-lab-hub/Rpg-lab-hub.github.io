import { supabase } from "./supabaseClient.js";

const currentUserId = localStorage.getItem("currentUserId");

// Elementos do DOM
const campaignList = document.getElementById("campaignList");
const playerList = document.getElementById("playerList");
const addPlayerSelect = document.getElementById("addPlayerSelect");
const sheetList = document.getElementById("sheetList");
const newCampaignName = document.getElementById("newCampaignName");
const createCampaignBtn = document.getElementById("createCampaignBtn");
const addPlayerBtn = document.getElementById("addPlayerBtn");

let selectedCampaignId = null;
let selectedPlayerId = null;

// ==========================
// Funções principais
// ==========================

// Carregar campanhas do mestre
async function loadCampaigns() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("master_id", currentUserId);

  if (error) return console.error(error);

  campaignList.innerHTML = "";
  data.forEach((camp) => {
    const li = document.createElement("li");
    li.textContent = camp.name;
    li.onclick = () => selectCampaign(camp.id);
    campaignList.appendChild(li);
  });
}

// Selecionar campanha
async function selectCampaign(campaignId) {
  selectedCampaignId = campaignId;

  const campaignName = await getCampaignName(campaignId);
  const selectedLi = Array.from(campaignList.children).find(
    (li) => li.textContent === campaignName
  );
  if (selectedLi) selectedLi.style.background = "#3b82f6";

  loadPlayersForCampaign();
}

// Pegar nome da campanha
async function getCampaignName(campaignId) {
  const { data } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", campaignId)
    .single();
  return data?.name || "";
}

// Carregar jogadores e atualizar select de adição
async function loadPlayersForCampaign() {
  if (!selectedCampaignId) return;

  // Jogadores da campanha
  const { data: playersInCampaign, error: playersError } = await supabase
    .from("campaign_players")
    .select(`player_id, users!inner(username)`)
    .eq("campaign_id", selectedCampaignId);

  if (playersError) return console.error(playersError);

  playerList.innerHTML = "";
  const playersInCampaignIds = [];

  playersInCampaign.forEach((p) => {
    playersInCampaignIds.push(p.player_id);
    const li = document.createElement("li");
    li.textContent = p.users.username;

    // Botão remover jogador
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.onclick = async (e) => {
      e.stopPropagation();
      await supabase
        .from("campaign_players")
        .delete()
        .eq("campaign_id", selectedCampaignId)
        .eq("player_id", p.player_id);
      loadPlayersForCampaign();
    };

    // Ao clicar no jogador, carregar fichas dele
    li.onclick = () => selectPlayer(p.player_id);

    li.appendChild(removeBtn);
    playerList.appendChild(li);
  });

  // Lista de usuários para adicionar à campanha (exceto logado)
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, username")
    .neq("id", currentUserId);

  addPlayerSelect.innerHTML = `<option value="">Escolha um jogador</option>`;
  allUsers.forEach((u) => {
    if (!playersInCampaignIds.includes(u.id)) {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent = u.username;
      addPlayerSelect.appendChild(option);
    }
  });
}

// ==========================
// Funções de fichas
// ==========================
async function selectPlayer(playerId) {
  selectedPlayerId = playerId;

  const { data: sheets, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("campaign_id", selectedCampaignId)
    .eq("player_id", playerId);

  if (error) return console.error(error);

  sheetList.innerHTML = "";
  sheets.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s.name;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.onclick = async () => {
      const newName = prompt("Novo nome da ficha:", s.name);
      if (newName) {
        await supabase.from("sheets").update({ name: newName }).eq("id", s.id);
        selectPlayer(playerId);
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Excluir";
    deleteBtn.onclick = async () => {
      await supabase.from("sheets").delete().eq("id", s.id);
      selectPlayer(playerId);
    };

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    sheetList.appendChild(li);
  });

  // Botão para criar ficha
  const newBtn = document.createElement("button");
  newBtn.textContent = "Criar nova ficha";
  newBtn.onclick = async () => {
    const sheetName = prompt("Nome da nova ficha:");
    if (!sheetName) return;
    const { error } = await supabase.from("sheets").insert([
      {
        name: sheetName,
        player_id: playerId,
        campaign_id: selectedCampaignId,
      },
    ]);
    if (error) return console.error(error);
    selectPlayer(playerId);
  };
  sheetList.appendChild(newBtn);
}

// ==========================
// Event listeners
// ==========================

// Criar nova campanha
createCampaignBtn.addEventListener("click", async () => {
  const name = newCampaignName.value.trim();
  if (!name) return alert("Informe o nome da campanha.");

  const { error } = await supabase
    .from("campaigns")
    .insert([{ name, master_id: currentUserId }]);
  if (error) return console.error(error);

  newCampaignName.value = "";
  loadCampaigns();
});

// Adicionar jogador
addPlayerBtn.addEventListener("click", async () => {
  const playerId = addPlayerSelect.value;
  if (!playerId || !selectedCampaignId) return;

  const { error } = await supabase.from("campaign_players").insert([
    {
      campaign_id: selectedCampaignId,
      player_id: playerId,
    },
  ]);
  if (error) return console.error(error);

  loadPlayersForCampaign();
});

// ==========================
// Inicialização
// ==========================
loadCampaigns();
