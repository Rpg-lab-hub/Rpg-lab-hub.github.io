import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔑 Substitua pelos dados do seu projeto Supabase
const supabaseUrl = "https://cayzvquvwsntzintrwkv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheXp2cXV2d3NudHppbnRyd2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzUxODUsImV4cCI6MjA3NDE1MTE4NX0.ziW9cWXT8IzeRny3TKr8ABVuEMEhcQ-84LlsfFJHynQ"; // Use a anon key
const supabase = createClient(supabaseUrl, supabaseKey);

const btn = document.getElementById("carregar");
const lista = document.getElementById("lista");

btn.addEventListener("click", async () => {
  lista.innerHTML = "<li>Carregando...</li>";

  const { data, error } = await supabase.from("Users").select("*");

  if (error) {
    console.error("Erro ao buscar dados:", error);
    lista.innerHTML = "<li>Erro ao carregar dados</li>";
  } else if (!data || data.length === 0) {
    lista.innerHTML = "<li>Nenhum usuário encontrado</li>";
  } else {
    lista.innerHTML = "";
    data.forEach(user => {
      const li = document.createElement("li");

      // Lista todos os campos dinamicamente
      const campos = Object.keys(user)
        .map(key => `${key}: ${user[key] || "vazio"}`)
        .join(" | ");
      
      li.textContent = campos;
      lista.appendChild(li);
    });
  }
});
