import { supabase } from "./supabaseClient.js";

const currentUserId = localStorage.getItem("currentUserId");
const campaignContainer = document.getElementById("campaignContainer");

// ======================
// Carregar fichas do jogador
// ======================
async function loadPlayerSheets() {
  const { data: sheets, error } = await supabase
    .from("sheets")
    .select(`
      id, name, campaign_id, 
      campaigns (id, name)
    `)
    .eq("player_id", currentUserId);

  if (error) return console.error("Erro ao carregar fichas:", error);

  // Agrupar por campanha
  const grouped = {};
  sheets.forEach((s) => {
    if (!grouped[s.campaigns.id]) {
      grouped[s.campaigns.id] = {
        name: s.campaigns.name,
        sheets: [],
      };
    }
    grouped[s.campaigns.id].sheets.push(s);
  });

  // Renderizar
  campaignContainer.innerHTML = "";
  Object.keys(grouped).forEach((campaignId) => {
    const campaignData = grouped[campaignId];

    const campaignDiv = document.createElement("div");
    campaignDiv.classList.add("campaign-block");

    const title = document.createElement("h2");
    title.textContent = campaignData.name;
    campaignDiv.appendChild(title);

    const ul = document.createElement("ul");
    campaignData.sheets.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s.name;

      // Botão editar
      const editBtn = document.createElement("button");
      editBtn.textContent = "Editar";
      editBtn.onclick = () => {
        window.location.href = `sheet.html?sheetId=${s.id}&playerId=${currentUserId}`;
      };

      // Botão excluir
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Excluir";
      deleteBtn.onclick = async () => {
        const confirmDelete = confirm(`Deseja excluir a ficha "${s.name}"?`);
        if (!confirmDelete) return;

        const { error: delError } = await supabase
          .from("sheets")
          .delete()
          .eq("id", s.id);

        if (delError) return console.error("Erro ao excluir ficha:", delError);

        loadPlayerSheets();
      };

      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });

    campaignDiv.appendChild(ul);

    // Botão criar nova ficha
    const newBtn = document.createElement("button");
    newBtn.textContent = "Criar nova ficha";
    newBtn.onclick = async () => {
      const sheetName = prompt("Nome da nova ficha:");
      if (!sheetName) return;

      const { error: insertError } = await supabase.from("sheets").insert([
        {
          name: sheetName,
          player_id: currentUserId,
          campaign_id: campaignId,
        },
      ]);

      if (insertError) return console.error("Erro ao criar ficha:", insertError);

      loadPlayerSheets();
    };

    campaignDiv.appendChild(newBtn);

    campaignContainer.appendChild(campaignDiv);
  });
}

// ======================
// Inicialização
// ======================
loadPlayerSheets();
