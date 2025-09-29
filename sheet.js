// Pega parâmetros da URL
const params = new URLSearchParams(window.location.search);
const campaignId = params.get("campaign_id");
const sheetId = params.get("sheet_id");

const sheetForm = document.getElementById("sheet-form");
const saveBtn = document.getElementById("save-sheet");

// Carregar ficha existente (modo edição)
async function loadSheet() {
  if (!sheetId) return;

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", sheetId)
    .single();

  if (error) {
    console.error("Erro ao carregar ficha:", error);
    return;
  }

  document.getElementById("sheet-name").value = data.name || "";
  document.getElementById("sheet-class").value = data.class || "";
  document.getElementById("sheet-level").value = data.level || 1;
  document.getElementById("sheet-hp").value = data.hp || 10;
  document.getElementById("sheet-description").value = data.description || "";
}

// Salvar ficha (criação ou edição)
saveBtn.addEventListener("click", async () => {
  const sheetData = {
    name: document.getElementById("sheet-name").value,
    class: document.getElementById("sheet-class").value,
    level: document.getElementById("sheet-level").value,
    hp: document.getElementById("sheet-hp").value,
    description: document.getElementById("sheet-description").value,
    campaign_id: campaignId
  };

  if (sheetId) {
    // Atualizar ficha
    const { error } = await supabase
      .from("sheets")
      .update(sheetData)
      .eq("id", sheetId);

    if (!error) alert("Ficha atualizada!");
  } else {
    // Criar nova ficha
    const { error } = await supabase
      .from("sheets")
      .insert([sheetData]);

    if (!error) alert("Ficha criada!");
  }
});

loadSheet();
