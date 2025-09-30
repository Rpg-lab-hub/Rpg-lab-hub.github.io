import { supabase } from "./supabaseClient.js";

// Pegar parâmetros da URL (id da ficha, jogador e campanha)
const urlParams = new URLSearchParams(window.location.search);
const sheetId = urlParams.get("sheetId");
const playerId = urlParams.get("playerId");
const campaignId = urlParams.get("campaignId");

const form = document.getElementById("sheetForm");
const deleteBtn = document.getElementById("deleteBtn");

// =========================
// Carregar ficha existente
// =========================
async function loadSheet() {
  if (!sheetId) {
    deleteBtn.style.display = "none"; // só aparece se for edição
    return;
  }

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", sheetId)
    .single();

  if (error) return console.error("Erro ao carregar ficha:", error);

  document.getElementById("name").value = data.name;
  document.getElementById("level").value = data.level || 1;

  if (data.attributes) {
    document.getElementById("forca").value = data.attributes.forca || 0;
    document.getElementById("agilidade").value = data.attributes.agilidade || 0;
    document.getElementById("intelecto").value = data.attributes.intelecto || 0;
    document.getElementById("presenca").value = data.attributes.presenca || 0;
    document.getElementById("vigor").value = data.attributes.vigor || 0;
  }

  if (data.skills) {
    document.getElementById("luta").value = data.skills.luta || 0;
    document.getElementById("percepcao").value = data.skills.percepcao || 0;
    document.getElementById("investigacao").value = data.skills.investigacao || 0;
    document.getElementById("ocultismo").value = data.skills.ocultismo || 0;
  }

  document.getElementById("notes").value = data.notes || "";
}

// =========================
// Salvar ficha
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const sheetData = {
    name: document.getElementById("name").value,
    level: parseInt(document.getElementById("level").value) || 1,
    attributes: {
      forca: parseInt(document.getElementById("forca").value),
      agilidade: parseInt(document.getElementById("agilidade").value),
      intelecto: parseInt(document.getElementById("intelecto").value),
      presenca: parseInt(document.getElementById("presenca").value),
      vigor: parseInt(document.getElementById("vigor").value),
    },
    skills: {
      luta: parseInt(document.getElementById("luta").value),
      percepcao: parseInt(document.getElementById("percepcao").value),
      investigacao: parseInt(document.getElementById("investigacao").value),
      ocultismo: parseInt(document.getElementById("ocultismo").value),
    },
    notes: document.getElementById("notes").value,
    player_id: playerId,
    campaign_id: campaignId,
  };

  let result;
  if (sheetId) {
    // Atualizar ficha
    result = await supabase.from("sheets").update(sheetData).eq("id", sheetId);
  } else {
    // Criar ficha
    result = await supabase.from("sheets").insert([sheetData]);
  }

  if (result.error) {
    console.error("Erro ao salvar ficha:", result.error);
    alert("Erro ao salvar ficha!");
  } else {
    alert("Ficha salva com sucesso!");
    window.location.href = "master.html"; // ou player.html dependendo do acesso
  }
});

// =========================
// Excluir ficha
// =========================
deleteBtn.addEventListener("click", async () => {
  if (!sheetId) return;
  if (!confirm("Deseja realmente excluir esta ficha?")) return;

  const { error } = await supabase.from("sheets").delete().eq("id", sheetId);
  if (error) {
    console.error("Erro ao excluir ficha:", error);
    alert("Erro ao excluir ficha!");
  } else {
    alert("Ficha excluída com sucesso!");
    window.location.href = "master.html"; // voltar para tela do mestre
  }
});

// Inicialização
loadSheet();
