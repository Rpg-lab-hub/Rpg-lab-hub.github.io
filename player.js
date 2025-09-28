document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-player");

  async function loadPlayer() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || user.role !== "player") return;

    document.getElementById("player-info").innerText = `Olá, ${user.username}!`;

    const { data, error } = await supabase
      .from("Sheets")
      .select("*")
      .eq("player_id", user.id);

    if (!error) {
      const list = document.getElementById("player-sheets");
      list.innerHTML = "";
      data.forEach(sheet => {
        const li = document.createElement("li");
        li.textContent = sheet.character_name;
        list.appendChild(li);
      });
    }
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    location.reload();
  });

  loadPlayer();
});
