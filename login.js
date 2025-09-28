import { supabase } from "./supabaseClient.js";

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

// Função de login
loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        message.textContent = "Preencha todos os campos!";
        return;
    }

    try {
        const { data, error } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .eq("password", password)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            message.textContent = "Usuário ou senha incorretos!";
            return;
        }

        // Salva usuário logado
        localStorage.setItem("currentUserId", data.id);

        // Redireciona para escolha de papel
        window.location.href = "role.html";
    } catch (err) {
        message.textContent = "Erro ao logar: " + err.message;
    }
});

// Função de cadastro
signupBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        message.textContent = "Preencha todos os campos!";
        return;
    }

    try {
        const { error } = await supabase.from("users").insert([
            { username, password }
        ]);

        if (error) {
            message.textContent = "Erro ao cadastrar: " + error.message;
            return;
        }

        message.style.color = "green";
        message.textContent = "Cadastro realizado com sucesso! Faça login.";
    } catch (err) {
        message.textContent = "Erro inesperado: " + err.message;
    }
});
